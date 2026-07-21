import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import multer from 'multer';
import { Review, Reward, User } from '../models';
import { bumpStreak } from '../utils/streak';
import { authMiddleware, requireRole } from '../middleware/auth';
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

// Photo and/or video of the visit. Video is capped higher; both are
// restricted to real media types (SVG excluded — it can carry script).
const reviewMediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      /^image\/(jpe?g|png|gif|webp|heic|heif)$/.test(file.mimetype) ||
      /^video\/(mp4|quicktime|webm|x-m4v)$/.test(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error('Only image or video uploads are allowed'));
  },
});

/** The parts of a multer upload we actually pass to the storage service. */
interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

/** Pull a single uploaded file out of multer's `fields` shape. */
function pickFile(req: Request, field: string): UploadedFile | undefined {
  const files = req.files as Record<string, UploadedFile[]> | undefined;
  return files?.[field]?.[0];
}

/** 1–5 rating from the body, or undefined when absent/invalid. */
function ratingField(value: unknown): number | undefined {
  const n = Number(value);
  if (Number.isNaN(n) || n < 1 || n > 5) return undefined;
  return Math.round(n);
}

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
      // rating 0 = expectations recorded but not yet reviewed — not a rating.
      { $match: { campaign_id: id, rating: { $gt: 0 } } },
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

/**
 * Record BEFORE-visit expectations (V2 Area 9). Upserts the user's review row
 * for the campaign with rating 0 — a placeholder that the after-visit review
 * later completes, so the two can be compared.
 */
router.post('/expectations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = toObjectId(req.body?.campaign_id);
    if (!campaignId) {
      res.status(400).json({ success: false, message: 'A valid campaign id is required' });
      return;
    }
    const expectation = {
      experience: ratingField(req.body?.experience),
      service: ratingField(req.body?.service),
      product: ratingField(req.body?.product),
      planned_purchase:
        typeof req.body?.planned_purchase === 'string' ? req.body.planned_purchase.trim() : '',
      recorded_at: new Date(),
    };

    const review = await Review.findOneAndUpdate(
      { campaign_id: campaignId, user: req.user!.userId },
      { $set: { expectation }, $setOnInsert: { rating: 0, comment: '' } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(success(review, 'Expectations recorded'));
  } catch (err: any) {
    if (err?.code === 11000) {
      res.status(409).json({ success: false, message: 'Expectations already recorded' });
      return;
    }
    res.status(400).json({ success: false, message: err.message || 'Failed to record expectations' });
  }
});

router.post(
  '/',
  authMiddleware,
  reviewMediaUpload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
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

      // An expectation-only row (rating 0) is a placeholder to complete, not a
      // duplicate. A real review (rating > 0) is a clean 409.
      const existing = await Review.findOne({
        campaign_id: campaignId,
        user: req.user!.userId,
      }).lean();
      if (existing && (existing.rating || 0) > 0) {
        res.status(409).json({ success: false, message: 'You have already reviewed this campaign' });
        return;
      }

      // Optional photo/video of the place -> Cloudinary (or configured store).
      let photoUrl = typeof req.body.photo_url === 'string' ? req.body.photo_url : '';
      let videoUrl = typeof req.body.video_url === 'string' ? req.body.video_url : '';
      const photoFile = pickFile(req, 'photo');
      const videoFile = pickFile(req, 'video');
      if (photoFile) {
        const stored = await uploadCreative({
          buffer: photoFile.buffer,
          originalname: photoFile.originalname,
          mimetype: photoFile.mimetype,
        });
        photoUrl = stored.url;
      }
      if (videoFile) {
        const stored = await uploadCreative({
          buffer: videoFile.buffer,
          originalname: videoFile.originalname,
          mimetype: videoFile.mimetype,
        });
        videoUrl = stored.url;
      }
      const hasMedia = !!photoUrl || !!videoUrl;

      const reality = {
        experience: ratingField(req.body?.reality_experience),
        satisfaction: ratingField(req.body?.satisfaction),
        product: ratingField(req.body?.product_rating),
        service: ratingField(req.body?.service_rating),
      };

      let review;
      try {
        review = await Review.findOneAndUpdate(
          { campaign_id: campaignId, user: req.user!.userId },
          {
            $set: {
              rating,
              comment: comment || '',
              photo_url: photoUrl,
              video_url: videoUrl,
              reality,
              // Media earns its bonus only after moderation approves it.
              media_status: hasMedia ? 'pending' : 'none',
            },
            $setOnInsert: { created_at: new Date() },
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
      } catch (err: any) {
        if (err?.code === 11000) {
          res
            .status(409)
            .json({ success: false, message: 'You have already reviewed this campaign' });
          return;
        }
        throw err;
      }

      // Base tokens are granted immediately; the media bonus waits for
      // moderation (see POST /:id/moderate). The review row is already
      // committed, so a reward failure must not 400 the request.
      const rewardTokens = REVIEW_REWARD_TOKENS;
      let rewardGranted = 0;
      try {
        await Reward.create({
          user_id: req.user!.userId,
          amount: round2(rewardTokens * TOKEN_VALUE),
          status: 'approved',
          type: 'review_reward',
          note: 'Review',
        });
        rewardGranted = rewardTokens;
      } catch (rewardErr) {
        console.error('Failed to grant review reward:', rewardErr);
      }

      // Review-submission streak (V2 Area 8) — best-effort.
      try {
        const author = await User.findById(req.user!.userId).select('streaks');
        if (author) {
          bumpStreak(author as any, 'review');
          author.markModified('streaks');
          await author.save();
        }
      } catch (streakErr) {
        console.error('Failed to bump review streak:', streakErr);
      }

      res
        .status(201)
        .json(success({ ...review.toObject(), reward_tokens: rewardGranted }, 'Review created'));
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to create review' });
    }
  }
);

/** Reviews whose uploaded media is awaiting moderation (admin only). */
router.get('/moderation', authMiddleware, requireRole('admin'), async (_req: Request, res: Response) => {
  try {
    const pending = await Review.find({ media_status: 'pending' })
      .sort({ created_at: 1 })
      .limit(100)
      .populate('user', 'name avatar_url')
      .lean();
    res.json(success(pending));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch moderation queue' });
  }
});

/**
 * Approve or reject a review's media (admin only). Approving releases the
 * media bonus tokens exactly once; rejecting clears the media from the review.
 */
router.post('/:id/moderate', authMiddleware, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Invalid review id' });
      return;
    }
    const approve = req.body?.approve === true;

    const review = await Review.findById(id);
    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }
    if (review.media_status !== 'pending') {
      res.status(409).json({ success: false, message: `Media is already ${review.media_status}` });
      return;
    }

    if (!approve) {
      review.media_status = 'rejected';
      review.photo_url = '';
      review.video_url = '';
      await review.save();
      res.json(success(review, 'Media rejected'));
      return;
    }

    // Flag first so concurrent approvals can't pay the bonus twice.
    const claimed = await Review.findOneAndUpdate(
      { _id: review._id, media_status: 'pending', media_bonus_granted: false },
      { $set: { media_status: 'approved', media_bonus_granted: true } },
      { new: true }
    );
    if (!claimed) {
      res.status(409).json({ success: false, message: 'Media was already moderated' });
      return;
    }

    try {
      await Reward.create({
        user_id: claimed.user,
        amount: round2(REVIEW_PHOTO_BONUS_TOKENS * TOKEN_VALUE),
        status: 'approved',
        type: 'review_reward',
        note: 'Review media bonus',
      });
    } catch (rewardErr) {
      console.error('Failed to grant review media bonus:', rewardErr);
    }

    res.json(
      success({ ...claimed.toObject(), bonus_tokens: REVIEW_PHOTO_BONUS_TOKENS }, 'Media approved')
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to moderate review' });
  }
});

export default router;
