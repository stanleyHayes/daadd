import { Router, Request, Response } from 'express';
import { User } from '../models';
import { authMiddleware } from '../middleware/auth';
import { success } from '../utils/response';

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
 * POST /billing/setup — STUB for real payment integration (e.g. Stripe Checkout
 * / SetupIntent). It marks the account billing-ready so the advertiser gate can
 * clear. Replace the body with a real payment-method capture before production;
 * do NOT trust a client claim of payment here in a live system.
 */
router.post('/setup', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    user.billing_ready = true;
    await user.save();
    res.json(success({ billing_ready: true }, 'Billing set up'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to set up billing' });
  }
});

export default router;
