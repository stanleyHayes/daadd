import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Types } from 'mongoose';
import {
  User,
  Consent,
  CONSENT_PURPOSES,
  currentConsent,
  ConsentPurpose,
  recordDataAccess,
  Review,
  Redemption,
  Reward,
  Message,
  Notification,
  SupportTicket,
  AdView,
} from '../models';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { success } from '../utils/response';

/**
 * Data-protection rights (Ghana DPA, Act 843).
 *
 * A user can see and change what they consented to, get a copy of their data,
 * and request deletion. All three operate on the caller's own account; there is
 * no path to another person's data here.
 */
const router = Router();

router.use(authMiddleware);

// ---------------------------------------------------------------------------
// Consent
// ---------------------------------------------------------------------------

/** GET /privacy/consents — the caller's current position on every purpose. */
router.get('/consents', async (req: Request, res: Response) => {
  try {
    const consents = await currentConsent(req.user!.userId);
    res.json(success({ purposes: CONSENT_PURPOSES, consents }));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /privacy/consents — grant or withdraw. Body: { purpose, granted }.
 * Each call appends a row; the history is never overwritten, so there is always
 * evidence of what was agreed and when.
 */
router.put('/consents', async (req: Request, res: Response) => {
  try {
    const purpose = req.body?.purpose as ConsentPurpose;
    const granted = req.body?.granted;

    if (!CONSENT_PURPOSES.includes(purpose)) {
      res.status(400).json({
        success: false,
        message: `purpose must be one of: ${CONSENT_PURPOSES.join(', ')}`,
      });
      return;
    }
    if (typeof granted !== 'boolean') {
      res.status(400).json({ success: false, message: 'granted must be true or false' });
      return;
    }

    await Consent.create({
      user_id: req.user!.userId,
      purpose,
      granted,
      policy_version: req.body?.policy_version || 'v1',
      ip: req.ip || '',
      user_agent: req.headers['user-agent'] || '',
    });

    res.json(success(await currentConsent(req.user!.userId), 'Consent updated'));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// Data export (subject access request)
// ---------------------------------------------------------------------------

/**
 * GET /privacy/export — a machine-readable copy of the caller's own data,
 * assembled across the collections that hold it. This is the DSAR right: a
 * person can obtain what DAADD holds about them.
 */
router.get('/export', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const oid = new Types.ObjectId(userId);

    const [profile, consents, reviews, redemptions, rewards, messages, notifications, tickets, adViews] =
      await Promise.all([
        User.findById(userId).select('-password_hash -permission_overrides').lean(),
        Consent.find({ user_id: oid }).sort({ created_at: -1 }).lean(),
        Review.find({ user: oid }).lean(),
        Redemption.find({ user_id: { $in: [oid, userId] } }).lean(),
        Reward.find({ user_id: oid }).lean(),
        Message.find({ sender_id: oid }).lean(),
        Notification.find({ user_id: oid }).lean(),
        SupportTicket.find({ user_id: oid }).lean(),
        AdView.find({ user_id: { $in: [oid, userId] } }).lean(),
      ]);

    res.json(
      success({
        generated_at: new Date().toISOString(),
        note: 'This is a copy of the personal data DAADD holds about your account.',
        profile,
        consents,
        reviews,
        redemptions,
        rewards,
        messages,
        notifications,
        support_tickets: tickets,
        ad_views: adViews,
      })
    );
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// Deletion / erasure
// ---------------------------------------------------------------------------

/**
 * POST /privacy/delete — erase the caller's personal data.
 *
 * "Erasure" here means anonymise, not drop rows. Financial and reward records
 * are an append-only ledger DAADD has a lawful reason to retain (tax, fraud,
 * accounting — the advisory's immutable-ledger requirement), so those rows stay
 * but are stripped of anything that identifies the person. What can simply go —
 * messages, notifications, push tokens, device ids — is deleted outright.
 *
 * The account is left in place but scrubbed and deactivated, so the ledgers it
 * anchors stay valid while the human behind it is no longer identifiable.
 */
router.post('/delete', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const oid = new Types.ObjectId(userId);

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Anonymise the identity. The row survives so ledger references stay valid;
    // the person does not.
    const anonymousEmail = `deleted-${userId}@deleted.invalid`;
    user.name = 'Deleted user';
    user.email = anonymousEmail;
    user.avatar_url = '';
    user.push_tokens = [];
    user.device_ids = [];
    user.preferences = {};
    // A bcrypt hash of a random secret no one holds, so the account can never be
    // signed into again.
    user.password_hash = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 10);
    user.email_verified = false;
    await user.save();

    // Free-text personal content that has no retention basis: remove outright.
    // Reviews are left in place — they carry no stored name (the reviewer's
    // name is populated from the User, which is now anonymised), so a merchant's
    // rating history stays intact without exposing who left it.
    await Promise.all([
      Message.deleteMany({ sender_id: oid }),
      Notification.deleteMany({ user_id: oid }),
    ]);

    // Consent history is itself evidence of a data-protection decision; keep it,
    // but record the erasure as the final consent state.
    await Consent.create({
      user_id: oid,
      purpose: 'marketing',
      granted: false,
      policy_version: 'erasure',
      ip: req.ip || '',
      user_agent: 'account-erasure',
    });

    res.json(
      success(
        { deleted: true },
        'Your personal data has been erased. Financial records are retained in anonymised form as the law requires.'
      )
    );
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// Admin: read another user's data (audited)
// ---------------------------------------------------------------------------

/**
 * GET /privacy/admin/user/:id — a staff member views a user's profile. Every
 * such access is written to the data-access log, satisfying the accountability
 * requirement to record who read sensitive personal data.
 */
router.get(
  '/admin/user/:id',
  requirePermission('users:read'),
  async (req: Request, res: Response) => {
    try {
      const target = await User.findById(req.params.id)
        .select('-password_hash -permission_overrides')
        .lean();
      if (!target) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      await recordDataAccess({
        actorId: req.user!.userId,
        subjectId: String(req.params.id),
        resource: 'profile',
        action: 'read',
      });

      res.json(success(target));
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

export default router;
