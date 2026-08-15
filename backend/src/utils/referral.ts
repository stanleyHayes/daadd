import crypto from 'crypto';
import { Types } from 'mongoose';
import { User, Reward, Notification } from '../models';

/**
 * Referral rewards (Phase 3.2). A referrer is paid ONCE, and only when their
 * invitee becomes a real, active user (their first completed redemption) — not
 * at signup, which would be trivial to farm.
 *
 * The reward is a FRESH MINT to the referrer (a positive Reward row, redeemable
 * only as a merchant discount), never a transfer of the invitee's balance —
 * tokens remain non-transferable per the token policy. Referral bonuses are a
 * platform marketing cost.
 */
export const TOKEN_VALUE = parseFloat(process.env.TOKEN_VALUE || '0.05');

/** Tokens the referrer earns when an invitee activates. */
export const REFERRAL_BONUS_TOKENS = parseInt(process.env.REFERRAL_BONUS_TOKENS || '100', 10);

// No ambiguous characters (0/O, 1/I) so codes are easy to read and share.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

function randomCode(): string {
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[crypto.randomInt(0, CODE_ALPHABET.length)];
  }
  return out;
}

/** A referral code not currently held by any user (retries on collision). */
export async function generateReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = randomCode();
    const clash = await User.exists({ referral_code: code });
    if (!clash) return code;
  }
  // Astronomically unlikely; fall back to a longer entropy source.
  return (randomCode() + crypto.randomBytes(2).toString('hex').toUpperCase()).slice(0, 12);
}

/** Ensure a user has a referral code, assigning one lazily if missing. */
export async function ensureReferralCode(userId: string): Promise<string> {
  const user = await User.findById(userId).select('referral_code');
  if (user?.referral_code) return user.referral_code;
  const code = await generateReferralCode();
  await User.findByIdAndUpdate(userId, { $set: { referral_code: code } });
  return code;
}

/**
 * Activate the referral for `userId` (called on their first completed
 * redemption) and pay the referrer exactly once. Best-effort and idempotent:
 * the atomic flag flip guarantees a single payout even under concurrent calls,
 * and any failure is swallowed so it never breaks the redemption.
 */
export async function activateReferral(userId: string): Promise<void> {
  try {
    if (!Types.ObjectId.isValid(userId)) return;

    // Flip the flag first; only the winner of the race proceeds to pay.
    const activated = await User.findOneAndUpdate(
      { _id: userId, referral_activated: false, referred_by: { $exists: true, $ne: null } },
      { $set: { referral_activated: true } },
      { new: true }
    ).select('referred_by name');
    if (!activated?.referred_by) return;

    const referrerId = activated.referred_by;
    // Self-referral guard (defence in depth; also rejected at signup).
    if (String(referrerId) === String(userId)) return;
    const referrer = await User.exists({ _id: referrerId });
    if (!referrer) return;

    await Reward.create({
      user_id: referrerId,
      amount: Math.round(REFERRAL_BONUS_TOKENS * TOKEN_VALUE * 100) / 100,
      status: 'approved',
      type: 'referral_reward',
      note: `Referral activated: ${activated.name || 'a friend'}`,
    });

    await Notification.create({
      user_id: referrerId,
      type: 'reward',
      title: 'Referral reward',
      message: `A friend you referred just made their first redemption — you earned ${REFERRAL_BONUS_TOKENS} tokens.`,
    }).catch(() => {});
  } catch (err) {
    console.error('[referral] activation failed (swallowed):', err);
  }
}
