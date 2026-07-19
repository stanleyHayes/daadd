import type { AdvertiserApproval, UserRole } from '../models/User';

/** Roles that must clear the advertiser onboarding gate before running ads. */
const GATED_ROLES: readonly UserRole[] = ['advertiser'];

export interface GateInput {
  role: UserRole;
  email_verified?: boolean;
  advertiser_approval?: AdvertiserApproval;
  billing_ready?: boolean;
}

export interface AdvertiserGate {
  gated: boolean;
  email_verified: boolean;
  advertiser_approval: AdvertiserApproval;
  billing_ready: boolean;
  /** True when the user may set a campaign to `active` (run ads). */
  can_run_ads: boolean;
  /** Human-readable list of outstanding requirements (empty when can_run_ads). */
  missing: string[];
}

/**
 * Compute the advertiser onboarding gate for a user. Non-advertiser roles are
 * ungated (admins, managers, end_users bypass). A self-registered advertiser
 * may only run ads once email is verified, an admin has approved them, and
 * billing is set up. `undefined` flags are treated as not-satisfied.
 */
export function advertiserGate(user: GateInput): AdvertiserGate {
  const gated = GATED_ROLES.includes(user.role);
  const email_verified = user.email_verified === true;
  const advertiser_approval: AdvertiserApproval = user.advertiser_approval ?? 'pending';
  const billing_ready = user.billing_ready === true;

  const missing: string[] = [];
  if (gated) {
    if (!email_verified) missing.push('email verification');
    if (advertiser_approval !== 'approved') missing.push('admin approval');
    if (!billing_ready) missing.push('billing setup');
  }

  return {
    gated,
    email_verified,
    advertiser_approval,
    billing_ready,
    can_run_ads: !gated || missing.length === 0,
    missing,
  };
}
