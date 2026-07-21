import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { Reward, Ad, Notification, User, Campaign, Review, Redemption } from '../models';
import { authMiddleware } from '../middleware/auth';
import { success, paginated } from '../utils/response';
import {
  advanceStreak,
  bumpStreak,
  multiplierForStreak,
  STREAK_BONUS_THRESHOLD,
  STREAK_TIERS,
  STREAK_TYPES,
} from '../utils/streak';
import {
  engagementScore,
  getVipCriteria,
  qualifiesForVip,
  VIP_MULTIPLIER,
} from '../utils/vip';
import { tokensForInteraction, BUDGET_ALERT_THRESHOLD } from '../utils/reward-economics';

const router = Router();

const round2 = (n: number) => Math.round(n * 100) / 100;
// Ledger amounts are dollars; the leaderboard displays token counts.
const TOKEN_VALUE = parseFloat(process.env.TOKEN_VALUE || '0.05');

/** Tell the advertiser their reward pool is spent and the campaign is paused. */
async function notifyBudgetExhausted(campaign: any): Promise<void> {
  try {
    await Notification.create({
      user_id: campaign.owner,
      type: 'campaign',
      title: 'Campaign paused — reward budget exhausted',
      message: `"${campaign.name}" has issued all ${campaign.max_tokens} of its reward tokens and has been paused. Top up the campaign to resume rewarding customers.`,
    });
  } catch {
    /* best-effort */
  }
}

/** One-time heads-up as the reward pool approaches exhaustion. */
async function maybeWarnBudget(campaign: any): Promise<void> {
  try {
    const cap = campaign?.max_tokens || 0;
    if (cap <= 0 || campaign.budget_alert_sent) return;
    if ((campaign.tokens_issued || 0) / cap < BUDGET_ALERT_THRESHOLD) return;
    // Flag first so concurrent claims can't fan out duplicate notifications.
    const flagged = await Campaign.findOneAndUpdate(
      { _id: campaign._id, budget_alert_sent: false },
      { $set: { budget_alert_sent: true } }
    );
    if (!flagged) return;
    await Notification.create({
      user_id: campaign.owner,
      type: 'campaign',
      title: 'Campaign reward budget running low',
      message: `"${campaign.name}" has used ${campaign.tokens_issued} of ${cap} reward tokens. Top it up to keep rewarding customers.`,
    });
  } catch {
    /* best-effort */
  }
}

function toObjectId(id: string | string[]): Types.ObjectId | null {
  if (typeof id !== 'string') return null;
  try {
    return new Types.ObjectId(id);
  } catch {
    return null;
  }
}

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { status, page = '1', limit = '10' } = req.query as Record<string, string | undefined>;
    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit || '10', 10)));

    const filter: Record<string, any> = { user_id: req.user!.userId };
    if (status) filter.status = status;

    const total = await Reward.countDocuments(filter);
    const rewards = await Reward.find(filter)
      .sort({ created_at: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json(paginated(rewards, total, pageNum, limitNum));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch rewards' });
  }
});

router.get('/balance', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await Reward.aggregate([
      { $match: { user_id: new Types.ObjectId(req.user!.userId), status: { $in: ['approved', 'paid'] } } },
      {
        $group: {
          _id: '$user_id',
          balance: { $sum: '$amount' },
        },
      },
    ]);
    const balance = result[0]?.balance || 0;
    res.json(success({ balance, currency: 'USD' }));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch balance' });
  }
});

/**
 * Token calculator data (Area 6): what a token is worth, the typical grant per
 * interaction across live campaigns, and the value the user has accumulated.
 */
router.get('/token-info', authMiddleware, async (req: Request, res: Response) => {
  try {
    const [rates, balanceRow] = await Promise.all([
      Campaign.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: null,
            per_view: { $avg: '$reward_per_view' },
            per_click: { $avg: '$reward_per_click' },
            per_review: { $avg: '$reward_per_review' },
            per_photo: { $avg: '$reward_per_photo' },
          },
        },
      ]),
      Reward.aggregate([
        {
          $match: {
            user_id: new Types.ObjectId(req.user!.userId),
            status: { $in: ['approved', 'paid'] },
          },
        },
        { $group: { _id: '$user_id', balance: { $sum: '$amount' } } },
      ]),
    ]);

    // Fall back to sensible defaults when no live campaign configures a rate.
    const avg = rates[0] || {};
    const pick = (v: number | undefined, fallback: number) =>
      v && v > 0 ? Math.max(1, Math.round(v)) : fallback;
    const balance = balanceRow[0]?.balance || 0;

    res.json(
      success({
        token_value: TOKEN_VALUE,
        tokens_per_dollar: Math.round(1 / TOKEN_VALUE),
        average: {
          per_view: pick(avg.per_view, 1),
          per_click: pick(avg.per_click, 2),
          per_review: pick(avg.per_review, 3),
          per_photo: pick(avg.per_photo, 2),
        },
        balance: round2(balance),
        balance_tokens: Math.floor(balance / TOKEN_VALUE),
      })
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch token info' });
  }
});

export type LeaderboardType = 'earner' | 'active' | 'reviews' | 'visits' | 'streak';

/** Calendar-aligned window start (UTC); null means all-time. */
function periodStart(period: string): Date | null {
  const now = new Date();
  if (period === 'week') {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const mondayOffset = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - mondayOffset);
    return d;
  }
  if (period === 'month') {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
  return null;
}

/**
 * Leaderboards (V2 Area 8): five boards over an all-time, weekly or monthly
 * window. Windows are calendar-aligned rather than destructive resets, so
 * history is preserved and past periods stay queryable.
 */
router.get('/leaderboard', authMiddleware, async (req: Request, res: Response) => {
  try {
    const type = String(req.query.type || 'earner') as LeaderboardType;
    const period = String(req.query.period || 'all');
    const since = periodStart(period);
    const sinceMatch = since ? { created_at: { $gte: since } } : {};

    // "Longest streak" is current state, so a time window doesn't apply.
    if (type === 'streak') {
      const users = await User.find({ streak_count: { $gt: 0 } })
        .select('name avatar_url streak_count vip_tier')
        .sort({ streak_count: -1 })
        .limit(20)
        .lean();
      res.json(
        success(
          users.map((u, i) => ({
            rank: i + 1,
            user_id: String(u._id),
            name: u.name || 'User',
            avatar_url: u.avatar_url || '',
            streak: u.streak_count || 0,
            vip: u.vip_tier === 'vip',
            value: u.streak_count || 0,
            unit: 'days',
            tokens: 0,
          }))
        )
      );
      return;
    }

    let rows: { _id: unknown; value: number }[] = [];
    if (type === 'reviews') {
      rows = await Review.aggregate([
        { $match: { ...sinceMatch } },
        { $group: { _id: '$user', value: { $sum: 1 } } },
        { $sort: { value: -1 } },
        { $limit: 20 },
      ]);
    } else if (type === 'visits') {
      rows = await Redemption.aggregate([
        { $match: { status: 'completed', ...sinceMatch } },
        { $group: { _id: '$user_id', value: { $sum: 1 } } },
        { $sort: { value: -1 } },
        { $limit: 20 },
      ]);
    } else if (type === 'active') {
      rows = await Reward.aggregate([
        { $match: { amount: { $gt: 0 }, status: { $in: ['approved', 'paid'] }, ...sinceMatch } },
        { $group: { _id: '$user_id', value: { $sum: 1 } } },
        { $sort: { value: -1 } },
        { $limit: 20 },
      ]);
    } else {
      rows = await Reward.aggregate([
        { $match: { amount: { $gt: 0 }, status: { $in: ['approved', 'paid'] }, ...sinceMatch } },
        { $group: { _id: '$user_id', value: { $sum: '$amount' } } },
        { $sort: { value: -1 } },
        { $limit: 20 },
      ]);
    }

    // Ids arrive as ObjectIds or strings depending on the source collection.
    const ids = rows.map((r) => r._id).filter(Boolean) as any[];
    const users = ids.length
      ? await User.find({ _id: { $in: ids } })
          .select('name avatar_url streak_count vip_tier')
          .lean()
      : [];
    const byId = new Map(users.map((u) => [String(u._id), u]));

    const unit = type === 'earner' ? 'tokens' : type === 'reviews' ? 'reviews' : type === 'visits' ? 'visits' : 'actions';

    res.json(
      success(
        rows.map((r, i) => {
          const u = byId.get(String(r._id));
          // The earner board sums a dollar ledger; show it as token counts.
          const value = type === 'earner' ? Math.round((r.value || 0) / TOKEN_VALUE) : r.value || 0;
          return {
            rank: i + 1,
            user_id: String(r._id),
            name: u?.name || 'User',
            avatar_url: u?.avatar_url || '',
            streak: u?.streak_count || 0,
            vip: u?.vip_tier === 'vip',
            value,
            unit,
            tokens: type === 'earner' ? value : 0,
          };
        })
      )
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch leaderboard' });
  }
});

// The signed-in user's engagement streaks + bonus status (V2 Area 8).
router.get('/streak', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId)
      .select('streak_count last_reward_date streaks')
      .lean();
    const streak = user?.streak_count || 0;
    const stored = (user?.streaks || {}) as Record<string, { count?: number; last_at?: Date }>;

    res.json(
      success({
        streak,
        last_reward_date: user?.last_reward_date || null,
        bonus_active: streak >= STREAK_BONUS_THRESHOLD,
        bonus_threshold: STREAK_BONUS_THRESHOLD,
        // Multiplier the headline (daily) streak currently earns.
        bonus_multiplier: multiplierForStreak(streak),
        tiers: STREAK_TIERS,
        // Per-activity streaks: daily / ad / merchant / review.
        streaks: STREAK_TYPES.reduce(
          (acc, type) => {
            const count = type === 'daily' ? streak : stored[type]?.count || 0;
            acc[type] = {
              count,
              last_at: type === 'daily' ? user?.last_reward_date || null : stored[type]?.last_at || null,
              multiplier: multiplierForStreak(count),
            };
            return acc;
          },
          {} as Record<string, { count: number; last_at: Date | null; multiplier: number }>
        ),
      })
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch streak' });
  }
});

/**
 * VIP status (V2 Area 8). Metrics are recomputed on read so the tier is always
 * current, and the resulting tier is persisted so the claim path can apply the
 * VIP multiplier without recomputing.
 */
router.get('/vip', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const uid = new Types.ObjectId(userId);
    const userMatch = { $in: [userId, uid] as any[] };

    const [redemptions, reviewCount, adRewards, user, criteria] = await Promise.all([
      Redemption.find({ user_id: userMatch, status: 'completed' }).select('merchant_id').lean(),
      Review.countDocuments({ user: userMatch }),
      Reward.countDocuments({ user_id: uid, type: 'ad_reward', status: { $in: ['approved', 'paid'] } }),
      User.findById(userId).select('streak_count streaks vip_tier vip_since'),
      getVipCriteria(),
    ]);

    const stored = (user?.streaks || {}) as Record<string, { count?: number }>;
    const longestStreak = Math.max(
      user?.streak_count || 0,
      ...STREAK_TYPES.map((t) => stored[t]?.count || 0)
    );
    const metrics = {
      merchant_visits: new Set(redemptions.map((r) => String(r.merchant_id))).size,
      purchases: redemptions.length,
      reviews: reviewCount,
      ads_viewed: adRewards,
      longest_streak: longestStreak,
    };
    const score = engagementScore(metrics);
    const qualifies = qualifiesForVip(metrics, criteria);

    // Persist tier changes so the claim path can read it cheaply.
    if (user && (user.vip_tier === 'vip') !== qualifies) {
      user.vip_tier = qualifies ? 'vip' : 'none';
      if (qualifies && !user.vip_since) user.vip_since = new Date();
      await user.save().catch(() => {});
    }

    res.json(
      success({
        tier: qualifies ? 'vip' : 'none',
        since: user?.vip_since || null,
        multiplier: qualifies ? VIP_MULTIPLIER : 1,
        engagement_score: score,
        metrics,
        criteria,
      })
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch VIP status' });
  }
});

router.post('/claim/:adId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const adId = toObjectId(req.params.adId);
    if (!adId) {
      res.status(400).json({ success: false, message: 'Invalid ad id' });
      return;
    }

    const ad = await Ad.findById(adId).lean();
    if (!ad) {
      res.status(404).json({ success: false, message: 'Ad not found' });
      return;
    }

    const existing = await Reward.findOne({ user_id: req.user!.userId, ad_id: adId }).lean();
    if (existing) {
      res.status(409).json({ success: false, message: 'Reward already claimed for this ad' });
      return;
    }

    // Streak bonus (#6): regulars earn +0.5x on rewards. Advance the streak and
    // apply the multiplier to this reward.
    const user = await User.findById(req.user!.userId).select(
      'streak_count last_reward_date streaks vip_tier'
    );
    const streak = advanceStreak(user || {});
    // VIP members earn an extra multiplier on top of their streak bonus.
    const vipMultiplier = user?.vip_tier === 'vip' ? VIP_MULTIPLIER : 1;

    // Reward economics (Area 5): the token grant comes from the campaign's
    // configuration; campaigns predating that config fall back to the ad's
    // fixed reward so existing adverts keep paying out.
    const campaign = ad.campaign_id ? await Campaign.findById(ad.campaign_id).lean() : null;
    const baseTokens = tokensForInteraction(campaign, 'view', ad.reward_amount || 0);
    const tokens = Math.max(0, Math.round(baseTokens * streak.multiplier * vipMultiplier));
    if (tokens <= 0) {
      res.status(409).json({ success: false, message: 'This campaign is not issuing rewards' });
      return;
    }

    // Budget exhaustion (Area 7): atomically reserve tokens from the campaign
    // pool. The $expr guard makes the cap race-safe under concurrent claims.
    if (campaign) {
      const reserved = await Campaign.findOneAndUpdate(
        {
          _id: campaign._id,
          $or: [
            { max_tokens: 0 },
            { $expr: { $lte: [{ $add: ['$tokens_issued', tokens] }, '$max_tokens'] } },
          ],
        },
        { $inc: { tokens_issued: tokens } },
        { new: true }
      );
      if (!reserved) {
        // Pool spent — stop distributing and pause the campaign automatically.
        await Campaign.updateOne({ _id: campaign._id, status: 'active' }, { $set: { status: 'paused' } });
        await notifyBudgetExhausted(campaign);
        res
          .status(409)
          .json({ success: false, message: 'This campaign has exhausted its reward budget' });
        return;
      }
      await maybeWarnBudget(reserved);
    }

    const amount = round2(tokens * TOKEN_VALUE);

    // The check above is a fast path; the unique partial index on
    // (user_id, ad_id) for 'ad_reward' rows is the real guard against
    // concurrent duplicate claims.
    let reward;
    try {
      reward = await Reward.create({
        user_id: new Types.ObjectId(req.user!.userId),
        ad_id: adId,
        ad_title: ad.title,
        amount,
        status: 'approved',
        note: streak.active ? `Streak bonus x${streak.multiplier}` : '',
      });
    } catch (err: any) {
      // Give the reserved tokens back — the claim didn't happen.
      if (campaign) {
        await Campaign.updateOne({ _id: campaign._id }, { $inc: { tokens_issued: -tokens } }).catch(
          () => {}
        );
      }
      if (err?.code === 11000) {
        res.status(409).json({ success: false, message: 'Reward already claimed for this ad' });
        return;
      }
      throw err;
    }

    // Keep the reward and the streak consistent. The reward is already written,
    // so if the streak write fails, roll the reward back rather than leave the
    // two out of sync — a stale last_reward_date would silently reset the streak
    // on the next claim. This is the env-safe alternative to a replica-set
    // transaction (the test Mongo is standalone).
    if (user) {
      user.streak_count = streak.streak_count;
      user.last_reward_date = streak.last_reward_date;
      // Ad-interaction streak runs alongside the headline daily streak.
      bumpStreak(user as any, 'ad');
      user.markModified('streaks');
      try {
        await user.save();
      } catch (streakErr) {
        console.error('Streak persist failed; rolling back reward:', streakErr);
        await Reward.deleteOne({ _id: reward._id }).catch(() => {});
        res
          .status(500)
          .json({ success: false, message: 'Could not record reward, please try again' });
        return;
      }
    }

    await Notification.create({
      user_id: new Types.ObjectId(req.user!.userId),
      type: 'reward',
      title: 'Reward Claimed',
      message: streak.active
        ? `You claimed ${amount} for viewing "${ad.title}" (streak bonus x${streak.multiplier}).`
        : `You claimed ${amount} for viewing "${ad.title}".`,
    });

    res
      .status(201)
      .json(
        success(
          { ...reward.toObject(), streak: streak.streak_count, bonus_applied: streak.active },
          'Reward claimed'
        )
      );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to claim reward' });
  }
});

export default router;
