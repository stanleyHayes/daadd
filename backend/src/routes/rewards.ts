import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { Reward, Ad, Notification } from '../models';
import { authMiddleware } from '../middleware/auth';
import { success, paginated } from '../utils/response';

const router = Router();

function toObjectId(id: string): Types.ObjectId | null {
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
      { $match: { user_id: req.user!.userId, status: { $in: ['approved', 'paid'] } } },
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

    const reward = await Reward.create({
      user_id: req.user!.userId,
      ad_id: adId,
      ad_title: ad.title,
      amount: ad.reward_amount,
      status: 'approved',
    });

    await Notification.create({
      user_id: req.user!.userId,
      type: 'reward',
      title: 'Reward Claimed',
      message: `You claimed ${ad.reward_amount} for viewing "${ad.title}".`,
    });

    res.status(201).json(success(reward, 'Reward claimed'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to claim reward' });
  }
});

export default router;
