import { Router, Request, Response } from 'express';
import { User } from '../models';
import { authMiddleware } from '../middleware/auth';
import { success } from '../utils/response';
import { paymentsEnabled } from '../services/payment.service';
import { createCharge } from '../utils/payment-flow';

const router = Router();

// GET /billing — billing status for the signed-in user.
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json(success({ billing_ready: user.billing_ready === true }));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to load billing' });
  }
});

/**
 * POST /billing/setup — start advertiser billing.
 *
 * When a PSP is configured (Phase 4), this starts a real Paystack charge and
 * returns a checkout URL; `billing_ready` flips ONLY once that payment is
 * verified (see routes/payments.ts / utils/payment-flow.ts), never on a client
 * claim. When no PSP is configured, a dev/test fallback flips the flag directly
 * so local onboarding works — but that fallback is refused in production, where
 * implying payment without the PSP holding funds would be unsafe.
 */
router.post('/setup', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (paymentsEnabled()) {
      try {
        const { authorization_url, reference } = await createCharge({
          userId: String(user._id),
          email: user.email,
          purpose: 'advertiser_billing',
        });
        res.json(success({ requires_payment: true, authorization_url, reference }, 'Complete your payment to finish'));
      } catch {
        res.status(502).json({ success: false, message: 'Could not start the payment. Please try again.' });
      }
      return;
    }

    if (process.env.NODE_ENV === 'production') {
      res.status(503).json({ success: false, message: 'Billing is not available yet' });
      return;
    }

    // Dev/test only: no PSP configured, so unblock onboarding locally.
    user.billing_ready = true;
    await user.save();
    res.json(success({ requires_payment: false, billing_ready: true }, 'Billing set up (dev)'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to set up billing' });
  }
});

export default router;
