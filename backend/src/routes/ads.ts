import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import { Ad, Campaign, Outlet } from '../models';
import { success, paginated } from '../utils/response';
import { escapeRegExp } from '../utils/regex';
import { tokensForInteraction, TOKEN_VALUE } from '../utils/reward-economics';
import { JWT_SECRET, JwtPayload } from '../middleware/auth';
import { fatigueService } from '../services/fatigue.service';

const router = Router();

/** Optional auth: identify the user when a valid Bearer token is present. Never rejects. */
function optionalAuth(req: Request): JwtPayload | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

function serializeAd(ad: any) {
  // `campaign` is only attached (with its owner populated) on the detail route;
  // list routes leave it undefined and fall back to the lightweight card.
  const campaign = ad.campaign && typeof ad.campaign === 'object' ? ad.campaign : null;
  const owner = campaign?.owner && typeof campaign.owner === 'object' ? campaign.owner : null;
  return {
    id: ad._id?.toString() || ad.id,
    title: ad.title,
    description: ad.description,
    creativeUrl: ad.creative_url || ad.image_url || ad.media_url || '',
    creativeType: ad.creative_type || (ad.media_url ? 'video' : 'image'),
    advertiser: ad.advertiser || {
      // owner id is the chat target ("Message company").
      id: owner?._id ? String(owner._id) : '',
      name: ad.brand || owner?.name || ad.advertiser_name || 'Advertiser',
      // A campaign-specific logo wins; otherwise fall back to the owner avatar.
      logo: campaign?.business_logo || owner?.avatar_url || '',
      category: campaign?.business_category || ad.industry || '',
      opening_hours: campaign?.opening_hours || '',
      verified: true,
      // Branches the customer can visit (V2 Area 10).
      branches: Array.isArray(ad.branches) ? ad.branches : [],
    },
    industry: ad.industry,
    rewardAmount: ad.reward_amount ?? 0,
    rewardCurrency: ad.reward_currency || '$',
    isTrending: ad.trending ?? false,
    isFeatured: ad.is_featured ?? false,
    isAgeRestricted: ad.isAgeRestricted ?? ad.age_restricted ?? false,
    rating: ad.rating ?? 4.5,
    reviewCount: ad.review_count ?? 0,
    viewCount: ad.view_count ?? 0,
    createdAt: ad.created_at || ad.createdAt,
    // What the consumer can earn from this campaign before engaging (Area 12).
    rewards: campaign
      ? {
          token_value: TOKEN_VALUE,
          per_view: tokensForInteraction(campaign, 'view', ad.reward_amount || 0),
          per_click: tokensForInteraction(campaign, 'click'),
          per_review: tokensForInteraction(campaign, 'review'),
          per_photo: tokensForInteraction(campaign, 'photo'),
          max_tokens: campaign.max_tokens || 0,
          tokens_issued: campaign.tokens_issued || 0,
          tokens_remaining:
            campaign.max_tokens > 0
              ? Math.max(0, (campaign.max_tokens || 0) - (campaign.tokens_issued || 0))
              : null,
        }
      : null,
    // Promotion duration + per-campaign advertiser contact details.
    campaign: campaign
      ? {
          id: String(campaign._id),
          name: campaign.name,
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          location: campaign.location || '',
          contact_phone: campaign.contact_phone || '',
          contact_email: campaign.contact_email || '',
          contact_website: campaign.contact_website || '',
        }
      : ad.campaign,
  };
}

function toObjectId(id: string): Types.ObjectId | null {
  try {
    return new Types.ObjectId(id);
  } catch {
    return null;
  }
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      industry,
      search,
      advertiser,
      sort = 'created_at',
      order = 'desc',
      page = '1',
      limit = '10',
    } = req.query as Record<string, string | undefined>;

    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit || '10', 10)));

    const filter: Record<string, any> = {};
    if (industry) filter.industry = { $regex: escapeRegExp(industry), $options: 'i' };
    if (advertiser) filter.brand = { $regex: escapeRegExp(advertiser), $options: 'i' };
    if (search) {
      const escaped = escapeRegExp(search);
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
        { brand: { $regex: escaped, $options: 'i' } },
      ];
    }

    const sortDirection = order === 'asc' ? 1 : -1;
    const sortField = ['reward_amount', 'created_at', 'title'].includes(sort) ? sort : 'created_at';

    // Spec §4.10: exclude ads the identified user is fatigued on (>= 5 views in 24h)
    const user = optionalAuth(req);
    if (user) {
      const candidateIds = (
        await Ad.find(filter).select('_id').limit(500).lean()
      ).map((a: any) => a._id.toString());
      const fatigued = await fatigueService.getFatiguedAdIds(user.userId, candidateIds);
      if (fatigued.size > 0) {
        filter._id = { $nin: [...fatigued].map((id) => new Types.ObjectId(id)) };
      }
    }

    const total = await Ad.countDocuments(filter);
    const ads = await Ad.find(filter)
      .sort({ [sortField]: sortDirection })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json(paginated(ads.map(serializeAd), total, pageNum, limitNum));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch ads' });
  }
});

router.get('/featured', async (_req: Request, res: Response) => {
  try {
    const ads = await Ad.find({ status: 'active', reward_amount: { $gt: 0 } })
      .sort({ reward_amount: -1, created_at: -1 })
      .limit(6)
      .lean();
    res.json(success(ads.map(serializeAd)));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch featured ads' });
  }
});

router.get('/trending', async (_req: Request, res: Response) => {
  try {
    const ads = await Ad.find({ status: 'active' })
      .sort({ view_count: -1, created_at: -1 })
      .limit(10)
      .lean();
    res.json(success(ads.map(serializeAd)));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch trending ads' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = toObjectId(req.params.id as string);
    if (!id) {
      res.status(400).json({ success: false, message: 'Invalid ad id' });
      return;
    }
    const ad = await Ad.findById(id).lean();
    if (!ad) {
      res.status(404).json({ success: false, message: 'Ad not found' });
      return;
    }
    // Join the campaign (promo dates + per-campaign contact details) and its
    // owner (the advertiser — the chat target + name/logo) for the detail view.
    const campaign = ad.campaign_id
      ? await Campaign.findById(ad.campaign_id).populate('owner', 'name avatar_url').lean()
      : null;
    // The advertiser's branches, so customers know where they can visit.
    const ownerId = (campaign as any)?.owner?._id;
    const branches = ownerId
      ? await Outlet.find({ owner: ownerId, is_active: true })
          .select('name address city phone opening_hours')
          .sort({ name: 1 })
          .lean()
      : [];
    res.json(
      success(
        serializeAd({
          ...ad,
          campaign,
          branches: branches.map((b) => ({
            id: String(b._id),
            name: b.name,
            address: b.address || '',
            city: b.city || '',
            phone: b.phone || '',
            opening_hours: b.opening_hours || '',
          })),
        })
      )
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch ad' });
  }
});

// Record an ad view for fatigue tracking (optional auth — anonymous views are not tracked)
router.post('/:id/view', async (req: Request, res: Response) => {
  try {
    const id = toObjectId(req.params.id as string);
    if (!id) {
      res.status(400).json({ success: false, message: 'Invalid ad id' });
      return;
    }
    const ad = await Ad.findById(id).lean();
    if (!ad) {
      res.status(404).json({ success: false, message: 'Ad not found' });
      return;
    }

    const user = optionalAuth(req);
    let fatigue = null;
    if (user) {
      await fatigueService.recordView(user.userId, id.toString());
      fatigue = await fatigueService.checkFatigue(user.userId, id.toString());
    }

    res.json(
      success({
        recorded: !!user,
        fatigued: fatigue?.isFatigued ?? false,
        viewCount: fatigue?.viewCount ?? 0,
        threshold: fatigue?.threshold,
      })
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to record ad view' });
  }
});

export default router;
