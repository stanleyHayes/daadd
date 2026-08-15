import { Router, Request, Response } from 'express';
import {
  MerchantVerification,
  VERIFICATION_STATUSES,
  VerificationStatus,
  maskLast,
  User,
  UserRole,
} from '../models';
import { authMiddleware, requireRole } from '../middleware/auth';
import { merchantGate } from '../utils/merchant-gate';
import { success, paginated } from '../utils/response';

/**
 * Merchant verification (KYC). A merchant submits their business and owner
 * details once; an admin reviews and sets the status. A merchant cannot confirm
 * redemptions until verified — see utils/merchant-gate.ts and the gate wired
 * into routes/redemption.ts.
 *
 * Admin review mirrors the advertiser-approval flow in routes/admin.ts: gated on
 * the `admin` role rather than a fine-grained permission, so the two partner
 * approval queues stay consistent.
 */
const router = Router();

/** What the merchant themselves sees — never another merchant's record. */
function serializeOwn(v: Record<string, any> | null) {
  if (!v) return null;
  return {
    status: v.status,
    business_name: v.business_name,
    business_registration_number: v.business_registration_number,
    business_address: v.business_address,
    business_city: v.business_city,
    contact_phone: v.contact_phone,
    owner_name: v.owner_name,
    owner_id_type: v.owner_id_type,
    owner_id_last4: v.owner_id_last4,
    settlement_provider: v.settlement_provider,
    settlement_account_last4: v.settlement_account_last4,
    review_notes: v.review_notes,
    submitted_at: v.submitted_at,
    reviewed_at: v.reviewed_at,
  };
}

router.use(authMiddleware);

// ---------------------------------------------------------------------------
// Merchant self-service
// ---------------------------------------------------------------------------

/** GET /merchants/verification — the caller merchant's own record + gate. */
router.get('/verification', requireRole('merchant'), async (req: Request, res: Response) => {
  try {
    const record = await MerchantVerification.findOne({ merchant_id: req.user!.userId }).lean();
    const gate = merchantGate({ role: req.user!.role as UserRole, status: record?.status ?? null });
    res.json(success({ verification: serializeOwn(record), gate }));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /merchants/verification — submit or update KYC details.
 *
 * Sensitive identifiers (owner ID, settlement account) are masked to their last
 * few digits at write time and the full value is never stored — DAADD is not the
 * money custodian, so it has no reason to hold a full bank account or ID number.
 *
 * Submitting always returns the merchant to `pending`: a merchant cannot edit
 * their way back into `verified` after a change; an admin re-reviews.
 */
router.put('/verification', requireRole('merchant'), async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const update = {
      business_name: String(body.business_name ?? '').trim(),
      business_registration_number: String(body.business_registration_number ?? '').trim(),
      business_address: String(body.business_address ?? '').trim(),
      business_city: String(body.business_city ?? '').trim(),
      contact_phone: String(body.contact_phone ?? '').trim(),
      owner_name: String(body.owner_name ?? '').trim(),
      owner_id_type: body.owner_id_type || 'ghana_card',
      owner_id_last4: maskLast(body.owner_id_number),
      settlement_provider: String(body.settlement_provider ?? '').trim(),
      settlement_account_last4: maskLast(body.settlement_account),
      status: 'pending' as VerificationStatus,
      submitted_at: new Date(),
      review_notes: '',
    };

    const record = await MerchantVerification.findOneAndUpdate(
      { merchant_id: req.user!.userId },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(success(serializeOwn(record?.toObject() ?? null), 'Verification submitted for review'));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// Admin review
// ---------------------------------------------------------------------------

/** GET /merchants/admin?status=pending — the review queue. */
router.get('/admin', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const status = req.query.status as VerificationStatus | undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 25);

    const filter: Record<string, unknown> = {};
    if (status && VERIFICATION_STATUSES.includes(status)) filter.status = status;

    const [rows, total] = await Promise.all([
      MerchantVerification.find(filter)
        .sort({ submitted_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      MerchantVerification.countDocuments(filter),
    ]);

    const merchantIds = rows.map((r) => r.merchant_id);
    const merchants = merchantIds.length
      ? await User.find({ _id: { $in: merchantIds } }).select('name email').lean()
      : [];
    const byId = new Map(merchants.map((m) => [String(m._id), m]));

    const items = rows.map((r) => ({
      ...r,
      merchant: byId.get(String(r.merchant_id)) ?? null,
    }));

    res.json(paginated(items, total, page, limit));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PATCH /merchants/admin/:id — set a merchant's verification status.
 * Body: { status, review_notes? }.
 */
router.patch('/admin/:id', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const status = req.body?.status as VerificationStatus;
    if (!VERIFICATION_STATUSES.includes(status)) {
      res.status(400).json({
        success: false,
        message: `status must be one of: ${VERIFICATION_STATUSES.join(', ')}`,
      });
      return;
    }

    const record = await MerchantVerification.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status,
          review_notes: String(req.body?.review_notes ?? '').trim(),
          reviewed_by: req.user!.userId,
          reviewed_at: new Date(),
        },
      },
      { new: true }
    );
    if (!record) {
      res.status(404).json({ success: false, message: 'Verification not found' });
      return;
    }

    res.json(success(record, `Merchant ${status}`));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
