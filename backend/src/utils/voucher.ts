import crypto from 'crypto';
import { DiscountVoucher, Reward, Notification } from '../models';

export const TOKEN_VALUE = parseFloat(process.env.TOKEN_VALUE || '0.05');
/** How long a voucher stays valid if unclaimed/unredeemed. */
export const VOUCHER_TTL_DAYS = parseInt(process.env.VOUCHER_TTL_DAYS || '30', 10);
/** Maximum tokens a single voucher may carry (bounds a single gift). */
export const VOUCHER_MAX_TOKENS = parseInt(process.env.VOUCHER_MAX_TOKENS || '2000', 10);

// No ambiguous characters, prefixed so a voucher code is recognisable.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(): string {
  let out = 'GV-';
  for (let i = 0; i < 10; i++) out += ALPHABET[crypto.randomInt(0, ALPHABET.length)];
  return out;
}

/** A voucher code not currently in use (retries on the astronomically rare clash). */
export async function generateVoucherCode(): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = randomCode();
    if (!(await DiscountVoucher.exists({ code }))) return code;
  }
  return randomCode() + crypto.randomBytes(2).toString('hex').toUpperCase();
}

export function round2(n: number): number {
  return Math.round((n || 0) * 100) / 100;
}

/**
 * Lapse vouchers past their expiry and REFUND the issuer (value conservation:
 * the issuer's tokens were debited at issue, so an unused gift must come back).
 * Idempotent and best-effort — driven by the scheduled job. Returns how many
 * were expired.
 */
export async function expireVouchers(): Promise<number> {
  const due = await DiscountVoucher.find({
    status: { $in: ['issued', 'claimed'] },
    expires_at: { $lte: new Date() },
  }).limit(500);

  let expired = 0;
  for (const v of due) {
    // Flip first so a concurrent redeem/sweep can't double-refund.
    const claimed = await DiscountVoucher.findOneAndUpdate(
      { _id: v._id, status: { $in: ['issued', 'claimed'] } },
      { $set: { status: 'expired' } },
      { new: true }
    );
    if (!claimed) continue;

    try {
      await Reward.create({
        user_id: claimed.issuer_id,
        amount: round2(claimed.amount),
        status: 'approved',
        type: 'voucher_refund',
        note: `Voucher ${claimed.code} expired unused — refund`,
      });
      await Notification.create({
        user_id: claimed.issuer_id,
        type: 'reward',
        title: 'Voucher refunded',
        message: `Your ${claimed.amount_tokens}-token gift expired unused and was refunded.`,
      }).catch(() => {});
      expired += 1;
    } catch (err) {
      // Could not refund — put it back so the next sweep retries rather than
      // stranding the issuer's value.
      await DiscountVoucher.updateOne({ _id: claimed._id }, { $set: { status: 'issued' } }).catch(() => {});
      console.error('[voucher] refund on expiry failed (will retry):', err);
    }
  }
  return expired;
}
