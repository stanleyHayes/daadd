import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { Campaign, Ad, Review, User } from '../models';
import { authMiddleware } from '../middleware/auth';
import { success, paginated } from '../utils/response';

const router = Router();

function serializeCampaign(c: any) {
  return {
    id: c._id?.toString() || c.id,
    name: c.name,
    description: c.description || '',
    industry: c.industry,
    status: c.status,
    budget_total: c.budget_total ?? 0,
    budget_spent: c.budget_spent ?? 0,
    reward_value: c.reward_value ?? 0,
    start_date: c.start_date,
    end_date: c.end_date,
    targeting_config: c.targeting_config ?? null,
    creatives: c.creatives ?? [],
    ai_optimization_enabled: c.enable_ai_optimization ?? c.ai_optimization_enabled ?? false,
    ai_mode: c.ai_mode ?? 'balanced',
    advertiser_id: c.advertiser_id || c.owner?.toString() || '',
    is_age_restricted: c.is_age_restricted ?? false,
    ctr: c.ctr ?? 0,
    created_at: c.created_at,
    updated_at: c.updated_at,
  };
}

function toObjectId(id: string): Types.ObjectId | null {
  try {
    return new Types.ObjectId(id);
  } catch {
    return null;
  }
}

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      status,
      industry,
      search,
      page = '1',
      limit = '10',
    } = req.query as Record<string, string | undefined>;

    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit || '10', 10)));

    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (industry) filter.industry = { $regex: industry, $options: 'i' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Campaign.countDocuments(filter);
    const campaigns = await Campaign.find(filter)
      .sort({ created_at: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json(paginated(campaigns.map(serializeCampaign), total, pageNum, limitNum));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch campaigns' });
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaign = await Campaign.create({
      ...req.body,
      owner: req.user!.userId,
    });
    res.status(201).json(success(serializeCampaign(campaign), 'Campaign created'));
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Failed to create campaign' });
  }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Invalid campaign id' });
      return;
    }
    const campaign = await Campaign.findById(id).lean();
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }
    res.json(success(serializeCampaign(campaign)));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch campaign' });
  }
});

router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Invalid campaign id' });
      return;
    }
    const campaign = await Campaign.findByIdAndUpdate(id, req.body, { new: true }).lean();
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }
    res.json(success(serializeCampaign(campaign), 'Campaign updated'));
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Failed to update campaign' });
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Invalid campaign id' });
      return;
    }
    const campaign = await Campaign.findByIdAndDelete(id).lean();
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }
    await Ad.deleteMany({ campaign_id: id });
    await Review.deleteMany({ campaign_id: id });
    res.json(success(null, 'Campaign deleted'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to delete campaign' });
  }
});

router.patch('/:id/toggle-ai', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Invalid campaign id' });
      return;
    }
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }
    campaign.enable_ai_optimization = !campaign.enable_ai_optimization;
    await campaign.save();
    res.json(success(serializeCampaign(campaign.toObject()), 'AI optimization toggled'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to toggle AI' });
  }
});

router.post('/:id/clone', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Invalid campaign id' });
      return;
    }
    const source = await Campaign.findById(id).lean();
    if (!source) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }

    const { _id, created_at, updated_at, name, ...rest } = source as any;
    const clone = await Campaign.create({
      ...rest,
      name: `${name} (Copy)`,
      status: 'draft',
      budget_spent: 0,
      owner: req.user!.userId,
    });

    const ads = await Ad.find({ campaign_id: id }).lean();
    if (ads.length) {
      await Ad.insertMany(
        ads.map((ad) => ({
          ...ad,
          _id: undefined,
          campaign_id: clone._id,
          status: 'draft',
          created_at: new Date(),
        }))
      );
    }

    res.status(201).json(success(serializeCampaign(clone.toObject()), 'Campaign cloned'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to clone campaign' });
  }
});

router.post('/:id/creatives', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Invalid campaign id' });
      return;
    }
    const campaign = await Campaign.findById(id).lean();
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }

    const creatives = Array.isArray(req.body.creatives) ? req.body.creatives : [req.body];
    const ads = await Ad.insertMany(
      creatives.map((creative: any) => ({
        title: creative.title || 'Untitled',
        description: creative.description || '',
        brand: creative.brand || campaign.name,
        industry: campaign.industry,
        image_url: creative.image_url || '',
        media_url: creative.media_url || '',
        isAgeRestricted: creative.isAgeRestricted || false,
        reward_amount: creative.reward_amount || 0,
        status: creative.status || 'draft',
        campaign_id: id,
      }))
    );

    res.status(201).json(success(ads.map((ad: any) => ({ id: ad._id.toString(), title: ad.title, description: ad.description, creativeUrl: ad.image_url || '', creativeType: ad.media_url ? 'video' : 'image', advertiser: { id: '', name: ad.brand || campaign.name, logo: '', verified: true }, industry: ad.industry, rewardAmount: ad.reward_amount, rewardCurrency: '$', isTrending: false, isFeatured: false, isAgeRestricted: ad.isAgeRestricted, rating: 4.5, reviewCount: 0, viewCount: 0, createdAt: ad.created_at })), 'Creatives added'));
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Failed to add creatives' });
  }
});

export default router;
