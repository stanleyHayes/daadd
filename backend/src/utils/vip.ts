import { PlatformSetting } from '../models/PlatformSetting';

/** Extra multiplier VIP members earn on top of their streak bonus. */
export const VIP_MULTIPLIER = 1.25;

export const VIP_CRITERIA_KEY = 'vip_criteria';

export interface VipCriteria {
  min_merchant_visits: number;
  min_purchases: number;
  min_reviews: number;
  min_engagement_score: number;
}

/** Administrators can tune these; a 0 disables that particular requirement. */
export const DEFAULT_VIP_CRITERIA: VipCriteria = {
  min_merchant_visits: 3,
  min_purchases: 3,
  min_reviews: 2,
  min_engagement_score: 50,
};

export interface EngagementMetrics {
  merchant_visits: number;
  purchases: number;
  reviews: number;
  ads_viewed: number;
  longest_streak: number;
}

/** Weighted engagement score — real-world actions count for more than views. */
export function engagementScore(m: EngagementMetrics): number {
  return (
    m.merchant_visits * 5 +
    m.purchases * 5 +
    m.reviews * 4 +
    m.ads_viewed * 1 +
    m.longest_streak * 2
  );
}

export function qualifiesForVip(m: EngagementMetrics, c: VipCriteria): boolean {
  return (
    m.merchant_visits >= c.min_merchant_visits &&
    m.purchases >= c.min_purchases &&
    m.reviews >= c.min_reviews &&
    engagementScore(m) >= c.min_engagement_score
  );
}

/** Current criteria, falling back to the defaults when unset. */
export async function getVipCriteria(): Promise<VipCriteria> {
  try {
    const row = await PlatformSetting.findOne({ key: VIP_CRITERIA_KEY }).lean();
    const stored = (row?.value || {}) as Partial<VipCriteria>;
    return { ...DEFAULT_VIP_CRITERIA, ...stored };
  } catch {
    return DEFAULT_VIP_CRITERIA;
  }
}
