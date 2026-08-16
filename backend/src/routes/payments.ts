import { Router, Request, Response } from 'express';
import { Payment, WebhookEvent, PaymentPurpose, PAYMENT_PURPOSES } from '../models';
import { authMiddleware } from '../middleware/auth';
import { resolveProvider, paymentsEnabled } from '../services/payment.service';
import { createCharge, reconcile, PURPOSE_ROLES } from '../utils/payment-flow';
import { alertOps } from '../services/alerting';
import { success } from '../utils/response';

/**
 * Real-money payments over a licensed PSP (Phase 4). DAADD records intent and
 * status; the PSP holds the funds. Amounts are integer minor units (pesewas) and
 * never touch the token ledger.
 *
 * The webhook is intentionally UNAUTHENTICATED (no Bearer) — it authenticates by
 * HMAC signature only. Every other route requires a logged-in user.
 */
const router = Router();

function enabledOr503(res: Response): boolean {
  if (paymentsEnabled()) return true;
  res.status(503).json({ success: false, message: 'Payments are not enabled' });
  return false;
}

/** POST /payments/initialize — start a charge and get the PSP checkout URL. */
router.post('/initialize', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!enabledOr503(res)) return;
    const purpose = req.body?.purpose as PaymentPurpose;
    if (!PAYMENT_PURPOSES.includes(purpose)) {
      res.status(400).json({ success: false, message: 'Unknown payment purpose' });
      return;
    }
    if (!PURPOSE_ROLES[purpose].includes(req.user!.role)) {
      res.status(403).json({ success: false, message: 'Not permitted for this account type' });
      return;
    }
    try {
      const { authorization_url, reference } = await createCharge({
        userId: req.user!.userId,
        email: req.user!.email,
        purpose,
      });
      res.json(success({ authorization_url, reference }));
    } catch {
      res.status(502).json({ success: false, message: 'Could not start the payment. Please try again.' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** GET /payments/verify/:reference — the browser-callback reconciliation. */
router.get('/verify/:reference', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!enabledOr503(res)) return;
    const payment = await Payment.findOne({ reference: req.params.reference, user_id: req.user!.userId });
    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment not found' });
      return;
    }
    if (payment.status === 'pending') {
      const verify = await resolveProvider().verifyTransaction(payment.reference);
      await reconcile(payment, verify);
    }
    const fresh = await Payment.findById(payment._id).lean();
    res.json(success({ status: fresh!.status, amount_minor: fresh!.amount_minor, currency: fresh!.currency }));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** GET /payments — the caller's own payments. */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const rows = await Payment.find({ user_id: req.user!.userId }).sort({ created_at: -1 }).limit(50).lean();
    res.json(
      success(
        rows.map((p) => ({
          id: String(p._id),
          reference: p.reference,
          amount_minor: p.amount_minor,
          currency: p.currency,
          status: p.status,
          purpose: p.purpose,
          created_at: p.created_at,
          paid_at: p.paid_at,
        }))
      )
    );
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /payments/webhook — the PSP calls this. We verify the HMAC over the raw
 * body, dedupe on the event id (exactly-once), then RE-VERIFY with the provider
 * before granting value (never trust the webhook payload alone), and ack 200.
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    if (!paymentsEnabled()) {
      res.status(503).json({ success: false, message: 'Payments are not enabled' });
      return;
    }
    const provider = resolveProvider();
    const signature = req.headers['x-paystack-signature'] as string | undefined;
    const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody;
    if (!rawBody || !provider.verifyWebhookSignature(rawBody, signature)) {
      res.status(401).json({ success: false, message: 'Invalid signature' });
      return;
    }

    const parsed = provider.parseWebhook(req.body);
    if (!parsed) {
      res.status(200).json({ received: true });
      return;
    }

    // Exactly-once: a duplicate delivery hits the unique index and is acked.
    try {
      await WebhookEvent.create({
        provider: provider.name,
        event_id: parsed.event_id,
        event_type: parsed.event_type,
        reference: parsed.reference,
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        res.status(200).json({ received: true, duplicate: true });
        return;
      }
      throw err;
    }

    if (parsed.event_type === 'charge.success' && parsed.reference) {
      const payment = await Payment.findOne({ reference: parsed.reference });
      if (payment && payment.status === 'pending') {
        // Defence in depth: confirm with the provider's verify API, not the
        // webhook body, before granting value.
        const verify = await provider.verifyTransaction(parsed.reference);
        await reconcile(payment, verify);
      }
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    // Still 200 so the PSP does not hammer retries on our internal error; the
    // event is recorded and can be reconciled via the verify endpoint. Alert ops
    // so a failing webhook path is noticed, not just logged.
    void alertOps('payment webhook error', String(error?.stack || error?.message || error));
    res.status(200).json({ received: true });
  }
});

export default router;
