import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import multer from 'multer';
import { Review, Reward } from '../models';
import { authMiddleware } from '../middleware/auth';
import { uploadCreative } from '../services/storage.service';
import { success, paginated } from '../utils/response';

const router = Router();

// Reviewing earns reward tokens; adding a photo of the place earns a bonus.
const REVIEW_REWARD_TOKENS = 3;
const REVIEW_PHOTO_BONUS_TOKENS = 2;
// Reward ledger amounts are DOLLARS everywhere (see redemption/balance), so a
// token count must be converted to money before crediting.
const TOKEN_VALUE = parseFloat(process.env.TOKEN_VALUE || '0.05');
const round2 = (n: number) => Math.round(n * 100) / 100;

const reviewPhotoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function toObjectId(id: string | string[]): Types.ObjectId | null {
  if (typeof id !== 'string') return null;
  try {
    return new Types.ObjectId(id);
  } catch {
    return null;
  }
}

router.get('/campaign/:id', async (req: Request, res: Response) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Invalid campaign id' });
      return;
    }
    const { page = '1', limit = '10' } = req.query as Record<string, string | undefined>;
    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit || '10', 10)));

    const filter = { campaign_id: id };
    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .sort({ created_at: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('user', 'name avatar_url')
      .lean();

    res.json(paginated(reviews, total, pageNum, limitNum));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch reviews' });
  }
});

router.get('/campaign/:id/summary', async (req: Request, res: Response) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Invalid campaign id' });
      return;
    }
    const result = await Review.aggregate([
      { $match: { campaign_id: id } },
      {
        $group: {
          _id: '$campaign_id',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const summary = result[0] || { averageRating: 0, totalReviews: 0 };
    res.json(
      success({
        averageRating: Number(summary.averageRating.toFixed(2)),
        totalReviews: summary.totalReviews,
      })
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch summary' });
  }
});

router.post(
  '/',
  authMiddleware,
  reviewPhotoUpload.single('photo'),
  async (req: Request, res: Response) => {
    try {
      const { campaign_id, rating, comment } = req.body;
      if (!campaign_id || !rating) {
        res.status(400).json({ success: false, message: 'Campaign id and rating are required' });
        return;
      }
      const campaignId = toObjectId(campaign_id);
      if (!campaignId) {
        res.status(400).json({ success: false, message: 'Invalid campaign id' });
        return;
      }

      // Fast path for a clean 409; the unique (campaign_id, user) index is the
      // real guard against concurrent duplicates.
      const existing = await Review.findOne({
        campaign_id: campaignId,
        user: req.user!.userId,
      }).lean();
      if (existing) {
        res.status(409).json({ success: false, message: 'You have already reviewed this campaign' });
        return;
      }

      // Optional photo of the place/experience -> Cloudinary (or configured store).
      let photoUrl = typeof req.body.photo_url === 'string' ? req.body.photo_url : '';
      if (req.file) {
        const stored = await uploadCreative({
          buffer: req.file.buffer,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
        });
        photoUrl = stored.url;
      }

      let review;
      try {
        review = await Review.create({
          campaign_id: campaignId,
          user: req.user!.userId,
          rating,
          comment: comment || '',
          photo_url: photoUrl,
        });
      } catch (err: any) {
        if (err?.code === 11000) {
          res
            .status(409)
            .json({ success: false, message: 'You have already reviewed this campaign' });
          return;
        }
        throw err;
      }

      // Reward the reviewer with tokens (bonus for including a photo). The
      // review row is already committed, so a reward failure must not 400 the
      // request (which would strand the review behind a 409 on retry) — grant it
      // best-effort and surface any failure for repair.
      const rewardTokens = REVIEW_REWARD_TOKENS + (photoUrl ? REVIEW_PHOTO_BONUS_TOKENS : 0);
      let rewardGranted = 0;
      try {
        await Reward.create({
          user_id: req.user!.userId,
          amount: round2(rewardTokens * TOKEN_VALUE),
          status: 'approved',
          type: 'review_reward',
          note: photoUrl ? 'Review with photo' : 'Review',
        });
        rewardGranted = rewardTokens;
      } catch (rewardErr) {
        console.error('Failed to grant review reward:', rewardErr);
      }

      res
        .status(201)
        .json(success({ ...review.toObject(), reward_tokens: rewardGranted }, 'Review created'));
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to create review' });
    }
  }
);

export default router;
