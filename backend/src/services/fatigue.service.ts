import { AdView } from '../models';

/** Spec §4.10: a user is fatigued on an ad after this many views in the window. */
export const FATIGUE_VIEW_THRESHOLD = 5;
export const FATIGUE_WINDOW_HOURS = 24;

export interface FatigueCheck {
  isFatigued: boolean;
  viewCount: number;
  threshold: number;
  windowHours: number;
}

function windowStart(): Date {
  return new Date(Date.now() - FATIGUE_WINDOW_HOURS * 60 * 60 * 1000);
}

export const fatigueService = {
  /** Count recent views and decide whether the user is fatigued on the ad. */
  async checkFatigue(userId: string, adId: string): Promise<FatigueCheck> {
    const viewCount = await AdView.countDocuments({
      user_id: userId,
      ad_id: adId,
      viewed_at: { $gte: windowStart() },
    });
    return {
      isFatigued: viewCount >= FATIGUE_VIEW_THRESHOLD,
      viewCount,
      threshold: FATIGUE_VIEW_THRESHOLD,
      windowHours: FATIGUE_WINDOW_HOURS,
    };
  },

  async isFatigued(userId: string, adId: string): Promise<boolean> {
    const check = await this.checkFatigue(userId, adId);
    return check.isFatigued;
  },

  /** Record an ad view for fatigue tracking. */
  async recordView(userId: string, adId: string): Promise<void> {
    await AdView.create({ user_id: userId, ad_id: adId, viewed_at: new Date() });
  },

  /** Return the subset of adIds the user is fatigued on (>= threshold views in window). */
  async getFatiguedAdIds(userId: string, adIds: string[]): Promise<Set<string>> {
    if (!adIds.length) return new Set();
    const rows = await AdView.aggregate<{ _id: string; views: number }>([
      {
        $match: {
          user_id: userId,
          ad_id: { $in: adIds },
          viewed_at: { $gte: windowStart() },
        },
      },
      { $group: { _id: '$ad_id', views: { $sum: 1 } } },
      { $match: { views: { $gte: FATIGUE_VIEW_THRESHOLD } } },
    ]);
    return new Set(rows.map((r) => String(r._id)));
  },
};
