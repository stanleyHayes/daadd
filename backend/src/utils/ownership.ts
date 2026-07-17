import { Types } from 'mongoose';
import { Campaign } from '../models';

interface AuthUser {
  userId: string;
  role: string;
}

/** True when the user owns the campaign or is an admin. */
export function canManageCampaign(
  campaign: { owner?: unknown } | null | undefined,
  user: AuthUser
): boolean {
  if (!campaign) return false;
  return user.role === 'admin' || String(campaign.owner) === String(user.userId);
}

/**
 * Look up a campaign the user may manage (owner or admin). Returns null for
 * both "does not exist" and "not yours" so callers can answer 404 without
 * leaking existence.
 */
export async function findManageableCampaign(campaignId: string | Types.ObjectId, user: AuthUser) {
  if (!Types.ObjectId.isValid(campaignId)) return null;
  const campaign = await Campaign.findById(campaignId);
  return canManageCampaign(campaign, user) ? campaign : null;
}
