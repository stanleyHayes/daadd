import crypto from 'crypto';
import { Payment, User, Notification, IPayment, PaymentPurpose } from '../models';
import { resolveProvider, VerifyResult } from '../services/payment.service';

/**
 * The DAADD-side payment flow (Phase 4): create a charge, reconcile it against a
 * provider verification, and apply what a successful payment unlocks. Kept here
 * so the payments route and the billing route share one implementation.
 *
 * Amounts are integer minor units (pesewas) and never touch the token ledger.
 */
export const PAYMENTS_CURRENCY = process.env.PAYMENTS_CURRENCY || 'GHS';

/** Server-controlled amount per purpose (never client-supplied). Minor units. */
export const PURPOSE_AMOUNT_MINOR: Record<PaymentPurpose, number> = {
  advertiser_billing: parseInt(process.env.BILLING_SETUP_MINOR || '5000', 10), // GH₵50.00
};

/** Which account roles may pay for a given purpose. */
export const PURPOSE_ROLES: Record<PaymentPurpose, string[]> = {
  advertiser_billing: ['advertiser', 'admin'],
};

export type PaymentOutcome = 'paid' | 'failed' | 'abandoned' | 'pending';

/**
 * Create a pending Payment and start the PSP checkout. Returns the checkout URL.
 * On provider failure the intent is marked failed so nothing is left dangling.
 */
export async function createCharge(input: {
  userId: string;
  email: string;
  purpose: PaymentPurpose;
}): Promise<{ authorization_url: string; reference: string }> {
  const provider = resolveProvider();
  const amount_minor = PURPOSE_AMOUNT_MINOR[input.purpose];
  const reference = `daadd-${crypto.randomUUID()}`;

  const payment = await Payment.create({
    user_id: input.userId,
    provider: provider.name,
    reference,
    amount_minor,
    currency: PAYMENTS_CURRENCY,
    status: 'pending',
    purpose: input.purpose,
    metadata: { user_id: input.userId, purpose: input.purpose },
  });

  const base = process.env.PUBLIC_WEB_URL || 'https://daadd.vercel.app';
  try {
    const init = await provider.initializeCharge({
      email: input.email,
      amount_minor,
      currency: PAYMENTS_CURRENCY,
      reference,
      callback_url: `${base}/dashboard/billing/callback?reference=${reference}`,
      metadata: { payment_id: String(payment._id), purpose: input.purpose },
    });
    payment.authorization_url = init.authorization_url;
    await payment.save();
    return { authorization_url: init.authorization_url, reference };
  } catch (err) {
    await Payment.updateOne({ _id: payment._id }, { $set: { status: 'failed', gateway_response: 'initialize failed' } });
    throw err;
  }
}

/** What a successful payment unlocks. Idempotent — safe to run more than once. */
export async function applyPaymentEffect(payment: IPayment): Promise<void> {
  if (payment.purpose === 'advertiser_billing') {
    // billing_ready is set ONLY here, from a verified payment — never from a
    // client claim (the old billing stub did the latter, which is unsafe).
    await User.updateOne({ _id: payment.user_id }, { $set: { billing_ready: true } });
  }
}

/**
 * Reconcile a pending payment against a provider verification. Grants value only
 * when the charge succeeded AND the amount + currency match what we asked for,
 * so a tampered or partial charge never unlocks anything. Atomic + idempotent —
 * safe to call from both the browser callback and the webhook.
 */
export async function reconcile(payment: IPayment, verify: VerifyResult): Promise<PaymentOutcome> {
  if (verify.status !== 'success') {
    const next: PaymentOutcome =
      verify.status === 'abandoned' ? 'abandoned' : verify.status === 'pending' ? 'pending' : 'failed';
    if (next !== 'pending') {
      await Payment.updateOne(
        { _id: payment._id, status: 'pending' },
        { $set: { status: next, gateway_response: verify.gateway_response } }
      );
    }
    return next;
  }
  if (verify.amount_minor !== payment.amount_minor || verify.currency !== payment.currency) {
    await Payment.updateOne(
      { _id: payment._id, status: 'pending' },
      { $set: { status: 'failed', gateway_response: 'amount/currency mismatch' } }
    );
    return 'failed';
  }

  // Atomic pending -> paid; only the winner (webhook vs callback) applies the effect.
  const won = await Payment.findOneAndUpdate(
    { _id: payment._id, status: 'pending' },
    { $set: { status: 'paid', paid_at: new Date(), gateway_response: verify.gateway_response } },
    { new: true }
  );
  if (!won) return 'paid'; // already finalized by the other path
  await applyPaymentEffect(won);
  await Notification.create({
    user_id: won.user_id,
    type: 'reward',
    title: 'Payment received',
    message: 'Your payment was received and your account has been updated.',
  }).catch(() => {});
  return 'paid';
}
