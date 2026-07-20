import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { Reward, Ad, Notification, User } from '../models';
import { authMiddleware } from '../middleware/auth';
import { success, paginated } from '../utils/response';
import { advanceStreak, STREAK_BONUS_THRESHOLD, STREAK_BONUS_MULTIPLIER } from '../utils/streak';

const router = Router();

const round2 = (n: number) => Math.round(n * 100) / 100;
// Ledger amounts are dollars; the leaderboard displays token counts.
const TOKEN_VALUE = parseFloat(process.env.TOKEN_VALUE || '0.05');

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

// Leadership board (#6): top users by total tokens earned.
router.get('/leaderboard', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const top = await Reward.aggregate([
      { $match: { amount: { $gt: 0 }, status: { $in: ['approved', 'paid'] } } },
      { $group: { _id: '$user_id', tokens: { $sum: '$amount' } } },
      { $sort: { tokens: -1 } },
      { $limit: 20 },
    ]);
    const ids = top.map((t) => t._id);
    const users = await User.find({ _id: { $in: ids } })
      .select('name avatar_url streak_count')
      .lean();
    const byId = new Map(users.map((u) => [String(u._id), u]));
    const leaderboard = top.map((t, i) => {
      const u = byId.get(String(t._id));
      return {
        rank: i + 1,
        user_id: String(t._id),
        name: u?.name || 'User',
        avatar_url: u?.avatar_url || '',
        streak: u?.streak_count || 0,
        tokens: Math.round((t.tokens || 0) / TOKEN_VALUE),
      };
    });
    res.json(success(leaderboard));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch leaderboard' });
  }
});

// The signed-in user's engagement streak + bonus status (#6).
router.get('/streak', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId)
      .select('streak_count last_reward_date')
      .lean();
    const streak = user?.streak_count || 0;
    res.json(
      success({
        streak,
        last_reward_date: user?.last_reward_date || null,
        bonus_active: streak >= STREAK_BONUS_THRESHOLD,
        bonus_threshold: STREAK_BONUS_THRESHOLD,
        bonus_multiplier: STREAK_BONUS_MULTIPLIER,
      })
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch streak' });
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
    const user = await User.findById(req.user!.userId).select('streak_count last_reward_date');
    const streak = advanceStreak(user || {});
    const amount = round2((ad.reward_amount || 0) * streak.multiplier);

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
