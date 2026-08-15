import { Router, Request, Response } from 'express';
import { User } from '../models';
import { authMiddleware } from '../middleware/auth';
import { ensureReferralCode, REFERRAL_BONUS_TOKENS } from '../utils/referral';
import { success } from '../utils/response';

/**
 * Referral self-service (Phase 3.2). A user sees their own shareable code and
 * how their invitees are doing — as counts only, never the invitees' identities.
 * The referrer is paid when an invitee activates (first completed redemption);
 * see utils/referral.ts.
 */
const router = Router();

/** GET /referrals/me — the caller's code + share link + activation stats. */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    // Assign a code lazily so accounts created before this feature get one too.
    const code = await ensureReferralCode(userId);

    const [activated, pending] = await Promise.all([
      User.countDocuments({ referred_by: userId, referral_activated: true }),
      User.countDocuments({ referred_by: userId, referral_activated: false }),
    ]);

    const base = process.env.PUBLIC_WEB_URL || 'https://daadd.vercel.app';

    res.json(
      success({
        code,
        share_url: `${base}/register?ref=${code}`,
        activated_count: activated,
        pending_count: pending,
        bonus_tokens: REFERRAL_BONUS_TOKENS,
      })
    );
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
