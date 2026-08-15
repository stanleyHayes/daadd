import type { UserRole } from '../models/User';
import type { VerificationStatus } from '../models/MerchantVerification';

/**
 * The merchant equivalent of the advertiser gate: whether a merchant has cleared
 * verification enough to perform money-touching actions (confirming a
 * redemption, and later, receiving settlement).
 *
 * Only the `merchant` role is gated. Admins pass through — an admin acting on a
 * merchant's behalf is not the merchant. The status meanings:
 *
 *   pending    — submitted, not yet reviewed. Cannot transact.
 *   verified   — cleared. May transact.
 *   restricted — limited by an admin (e.g. under investigation). Cannot transact.
 *   suspended  — blocked. Cannot transact.
 *
 * A merchant with no verification record at all is treated as `pending`.
 */
const GATED_ROLES: readonly UserRole[] = ['merchant'];

export interface MerchantGateInput {
  role: UserRole;
  status?: VerificationStatus | null;
}

export interface MerchantGate {
  gated: boolean;
  status: VerificationStatus;
  /** True when the merchant may confirm redemptions / receive settlement. */
  can_transact: boolean;
  /** Why not, when can_transact is false. */
  reason: string;
}

export function merchantGate(input: MerchantGateInput): MerchantGate {
  const gated = GATED_ROLES.includes(input.role);
  const status: VerificationStatus = input.status ?? 'pending';

  if (!gated) {
    return { gated: false, status, can_transact: true, reason: '' };
  }

  const can_transact = status === 'verified';
  const reason = can_transact
    ? ''
    : status === 'pending'
      ? 'Your business verification is still under review.'
      : status === 'restricted'
        ? 'Your account is restricted. Contact support.'
        : 'Your account is suspended. Contact support.';

  return { gated, status, can_transact, reason };
}
