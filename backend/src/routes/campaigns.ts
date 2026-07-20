import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { Campaign, Ad, Review, User, ABTest, Anomaly, AIRecommendation, AIAuditLog, DeviceEvent, TeamMember, IABTestVariant } from '../models';
import { authMiddleware } from '../middleware/auth';
import { success, paginated } from '../utils/response';
import { seededRandom } from '../utils/seeded';
import { escapeRegExp } from '../utils/regex';
import { canManageCampaign, findManageableCampaign } from '../utils/ownership';
import { advertiserGate } from '../utils/advertiser-gate';
import multer from 'multer';
import { uploadCreative } from '../services/storage.service';

const router = Router();

/**
 * Advertiser onboarding gate for "running ads". Returns a 403 message when the
 * acting user may not set a campaign to `active` yet, otherwise null. Reads the
 * authoritative role/flags from the DB (a stale JWT role can't bypass it).
 * Admins and other non-advertiser roles are ungated.
 */
async function runAdsBlockReason(userId: string): Promise<string | null> {
  const dbUser = await User.findById(userId)
    .select('role email_verified advertiser_approval billing_ready')
    .lean();
  if (!dbUser) return 'Account not found';
  const gate = advertiserGate(dbUser);
  if (gate.can_run_ads) return null;
  return `You can't launch a campaign yet — complete: ${gate.missing.join(', ')}.`;
}

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
    location: c.location ?? '',
    contact_phone: c.contact_phone ?? '',
    contact_email: c.contact_email ?? '',
    contact_website: c.contact_website ?? '',
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

function toObjectId(id: string | string[]): Types.ObjectId | null {
  if (typeof id !== 'string') return null;
  try {
    return new Types.ObjectId(id);
  } catch {
    return null;
  }
}

const LOCALIZED_MIN_BUDGET = 500;
const CURRENCY_RE = /^[A-Z]{3}$/;

/**
 * Spec §4.8: localized targeting requires a budget of at least $500 and
 * valid region / language / currency configuration. Accepts both the flat
 * create-page payload (budget, regions, languages, localized) and the
 * edit-page payload (budget_total, targeting_config.{...}).
 */
function validateLocalizedTargeting(body: any, existing?: any): string | null {
  const tc = body.targeting_config || {};
  const localized = tc.localized ?? body.localized ?? existing?.targeting_config?.localized ?? false;
  if (!localized) return null;

  const budget = body.budget_total ?? body.budget ?? existing?.budget_total ?? 0;
  if (Number(budget) < LOCALIZED_MIN_BUDGET) {
    return `Localized targeting requires a minimum total budget of $${LOCALIZED_MIN_BUDGET}`;
  }

  const regions = tc.regions ?? body.regions ?? existing?.targeting_config?.regions;
  if (!Array.isArray(regions) || regions.length === 0) {
    return 'Localized targeting requires at least one target region';
  }

  const languages = tc.languages ?? body.languages ?? existing?.targeting_config?.languages;
  if (!Array.isArray(languages) || languages.length === 0) {
    return 'Localized targeting requires at least one language';
  }

  const currency = body.currency ?? existing?.currency;
  if (currency !== undefined && currency !== null && currency !== '' && !CURRENCY_RE.test(String(currency))) {
    return 'Invalid currency: must be a 3-letter ISO code (e.g. USD, GHS)';
  }

  return null;
}

const CAMPAIGN_STATUSES = ['draft', 'active', 'paused', 'completed', 'archived'];
const AI_MODES = ['auto_adjust', 'recommendation_only'];

/**
 * Normalize the flat create-page payload into the Campaign schema shape.
 * Whitelists updatable fields — budget_spent, owner, _id and timestamps are
 * never passed through (mass-assignment guard).
 */
function normalizeCampaignBody(body: any): any {
  const normalized: Record<string, any> = {};

  for (const key of [
    'name',
    'description',
    'industry',
    'reward_value',
    'currency',
    'start_date',
    'end_date',
    'language',
    'platform_ids',
    // Per-campaign advertiser contact details shown on adverts.
    'location',
    'contact_phone',
    'contact_email',
    'contact_website',
  ]) {
    if (body[key] !== undefined) normalized[key] = body[key];
  }

  // Discount shared with clients (0–100%); clamp defensively.
  if (body.discount_percentage !== undefined) {
    const pct = Number(body.discount_percentage);
    if (!Number.isNaN(pct)) normalized.discount_percentage = Math.min(100, Math.max(0, pct));
  }

  if (body.status !== undefined && CAMPAIGN_STATUSES.includes(body.status)) {
    normalized.status = body.status;
  }
  if (body.ai_mode !== undefined && AI_MODES.includes(body.ai_mode)) {
    normalized.ai_mode = body.ai_mode;
  }

  const budgetTotal = body.budget_total ?? body.budget;
  if (budgetTotal !== undefined) {
    normalized.budget_total = budgetTotal;
  }

  const aiEnabled = body.enable_ai_optimization ?? body.ai_enabled;
  if (aiEnabled !== undefined) {
    normalized.enable_ai_optimization = aiEnabled;
  }

  if (body.targeting_config !== undefined) {
    normalized.targeting_config = body.targeting_config;
  } else if (
    body.regions !== undefined ||
    body.languages !== undefined ||
    body.devices !== undefined ||
    body.localized !== undefined
  ) {
    normalized.targeting_config = {
      regions: body.regions ?? [],
      languages: body.languages ?? [],
      devices: body.devices ?? [],
      localized: body.localized ?? false,
      age_min: body.age_min,
      age_max: body.age_max,
    };
  }

  const languages = body.languages ?? normalized.targeting_config?.languages;
  if (Array.isArray(languages) && languages.length > 0 && normalized.language === undefined) {
    normalized.language = languages[0];
  }

  return normalized;
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
    if (industry) filter.industry = { $regex: escapeRegExp(industry), $options: 'i' };
    if (search) {
      const escaped = escapeRegExp(search);
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
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
    const localizedError = validateLocalizedTargeting(req.body);
    if (localizedError) {
      res.status(400).json({ success: false, message: localizedError });
      return;
    }
    const normalized = normalizeCampaignBody(req.body);
    // Gate "running ads": creating a campaign already set to active.
    if (normalized.status === 'active') {
      const block = await runAdsBlockReason(req.user!.userId);
      if (block) {
        res.status(403).json({ success: false, message: block });
        return;
      }
    }
    const campaign = await Campaign.create({
      ...normalized,
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
    const id = toObjectId(req.params.id as string);
    if (!id) {
      res.status(400).json({ success: false, message: 'Invalid campaign id' });
      return;
    }
    const existing = await Campaign.findById(id).lean();
    if (!existing || !canManageCampaign(existing, req.user!)) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }
    const localizedError = validateLocalizedTargeting(req.body, existing);
    if (localizedError) {
      res.status(400).json({ success: false, message: localizedError });
      return;
    }
    const normalized = normalizeCampaignBody(req.body);
    // Gate "running ads": activating a campaign (draft/paused -> active).
    if (normalized.status === 'active' && existing.status !== 'active') {
      const block = await runAdsBlockReason(req.user!.userId);
      if (block) {
        res.status(403).json({ success: false, message: block });
        return;
      }
    }
    const campaign = await Campaign.findByIdAndUpdate(id, normalized, { new: true }).lean();
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
    const campaign = await Campaign.findById(id).lean();
    if (!campaign || !canManageCampaign(campaign, req.user!)) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }
    await Campaign.findByIdAndDelete(id);
    await Ad.deleteMany({ campaign_id: id });
    await Review.deleteMany({ campaign_id: id });
    // Related records keyed by the string form of the campaign id
    const campaignIdStr = id.toString();
    await ABTest.deleteMany({ campaign_id: campaignIdStr });
    await Anomaly.deleteMany({ campaign_id: campaignIdStr });
    await AIRecommendation.deleteMany({ campaign_id: campaignIdStr });
    await AIAuditLog.deleteMany({ campaign_id: campaignIdStr });
    await DeviceEvent.deleteMany({ campaign_id: { $in: [id, campaignIdStr] } });
    await TeamMember.deleteMany({ campaign_id: campaignIdStr });
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
    if (!campaign || !canManageCampaign(campaign, req.user!)) {
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
    if (!source || !canManageCampaign(source, req.user!)) {
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

/* ---------------- Creative file upload (spec §6) ---------------- */

// Files are buffered in memory and handed to the storage service, which
// writes to S3 when configured or to the local uploads/ dir otherwise.
const creativeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

router.post('/:id/creatives/upload', authMiddleware, creativeUpload.single('file'), async (req: Request, res: Response) => {
  try {
    const id = toObjectId(req.params.id as string);
    if (!id) {
      res.status(400).json({ success: false, message: 'Invalid campaign id' });
      return;
    }
    const campaign = await Campaign.findById(id).lean();
    if (!campaign || !canManageCampaign(campaign, req.user!)) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ success: false, message: 'file field is required (multipart/form-data)' });
      return;
    }

    const stored = await uploadCreative({
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
    });

    const isVideo = (req.file.mimetype || '').startsWith('video/');
    const ad = await Ad.create({
      title: req.body.title || req.file.originalname,
      description: req.body.description || '',
      brand: campaign.name,
      industry: campaign.industry,
      image_url: isVideo ? '' : stored.url,
      media_url: isVideo ? stored.url : '',
      isAgeRestricted: false,
      reward_amount: 0,
      status: 'draft',
      campaign_id: id,
    });

    res.status(201).json(success({
      id: ad._id.toString(),
      creativeUrl: stored.url,
      storage: stored.storage,
      creativeType: isVideo ? 'video' : 'image',
    }, 'Creative uploaded'));
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Failed to upload creative' });
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
    if (!campaign || !canManageCampaign(campaign, req.user!)) {
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

/* ---------------- A/B Testing ---------------- */

const VARIANT_LABELS = ['A', 'B', 'C', 'D', 'E'];

function buildVariantMetrics(creativeId: string, variant: string): IABTestVariant {
  const rng = seededRandom(`abtest:${creativeId}`);
  const impressions = Math.round(3000 + rng() * 12000);
  const ctr = 1 + rng() * 5; // %
  const clicks = Math.round((impressions * ctr) / 100);
  const conversions = Math.round(clicks * (0.02 + rng() * 0.1));
  return { creative_id: creativeId, variant, impressions, clicks, conversions };
}

function serializeVariantMetrics(v: any) {
  const impressions = v.impressions ?? 0;
  const clicks = v.clicks ?? 0;
  return {
    creativeId: v.creative_id,
    variant: v.variant,
    impressions,
    clicks,
    ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,
    conversions: v.conversions ?? 0,
  };
}

async function serializeABTestResults(test: any) {
  const controlVariant = test.variants.find((v: any) => v.creative_id === test.control_creative_id);
  const variantRows = test.variants.filter((v: any) => v.creative_id !== test.control_creative_id);

  const creativeIds = test.variants
    .map((v: any) => v.creative_id)
    .filter((id: string) => Types.ObjectId.isValid(id));
  const ads = creativeIds.length
    ? await Ad.find({ _id: { $in: creativeIds } }).select('title description').lean()
    : [];
  const adMap = new Map(ads.map((a: any) => [a._id.toString(), a]));

  function creativeEntry(v: any) {
    const ad: any = adMap.get(v.creative_id);
    return {
      id: v.creative_id,
      title: ad?.title,
      description: ad?.description,
      metrics: serializeVariantMetrics(v),
    };
  }

  return {
    testId: test._id?.toString() || test.id,
    campaignId: test.campaign_id,
    controlCreative: creativeEntry(controlVariant || test.variants[0]),
    variantCreatives: variantRows.map(creativeEntry),
    winner: test.winner?.creative_id
      ? { creativeId: test.winner.creative_id, variant: test.winner.variant }
      : undefined,
    isComplete: test.status === 'completed',
  };
}

// Create an A/B test for a campaign
router.post('/:campaignId/ab-test/create', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.campaignId as string;
    const { controlCreativeId, variantCreativeIds, trafficAllocation } = req.body as {
      controlCreativeId?: string;
      variantCreativeIds?: string[];
      trafficAllocation?: number;
    };

    if (!controlCreativeId || !Array.isArray(variantCreativeIds) || variantCreativeIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'controlCreativeId and at least one variantCreativeId are required',
      });
      return;
    }
    if (variantCreativeIds.includes(controlCreativeId)) {
      res.status(400).json({ success: false, message: 'Control creative cannot also be a variant' });
      return;
    }

    const running = await ABTest.findOne({ campaign_id: campaignId, status: 'running' });
    if (running) {
      res.status(409).json({ success: false, message: 'An A/B test is already running for this campaign' });
      return;
    }

    const creativeIds = [controlCreativeId, ...variantCreativeIds];
    const variants = creativeIds.map((creativeId, i) =>
      buildVariantMetrics(creativeId, VARIANT_LABELS[i] || String(i))
    );

    const test = await ABTest.create({
      campaign_id: campaignId,
      name: `A/B Test ${new Date().toISOString().slice(0, 10)}`,
      control_creative_id: controlCreativeId,
      variant_creative_ids: variantCreativeIds,
      traffic_allocation: trafficAllocation ?? 50,
      variants,
      status: 'running',
    });

    res.status(201).json(success(await serializeABTestResults(test.toObject()), 'A/B test created'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to create A/B test' });
  }
});

// Mark the winning creative of a test (static path — registered before param routes would clash)
router.post('/ab-test/mark-winner', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { testId, creativeId } = req.body as { testId?: string; creativeId?: string };
    if (!testId || !creativeId) {
      res.status(400).json({ success: false, message: 'testId and creativeId are required' });
      return;
    }
    if (!Types.ObjectId.isValid(testId)) {
      res.status(400).json({ success: false, message: 'Invalid test id' });
      return;
    }

    const test = await ABTest.findById(testId);
    if (!test) {
      res.status(404).json({ success: false, message: 'A/B test not found' });
      return;
    }

    // The test must belong to a campaign the caller manages (owner or admin)
    const campaign = await findManageableCampaign(test.campaign_id, req.user!);
    if (!campaign) {
      res.status(404).json({ success: false, message: 'A/B test not found' });
      return;
    }

    if (test.status === 'completed') {
      res.status(409).json({ success: false, message: 'A/B test is already completed' });
      return;
    }

    const winnerVariant = test.variants.find((v) => v.creative_id === creativeId);
    if (!winnerVariant) {
      res.status(400).json({ success: false, message: 'Creative is not part of this test' });
      return;
    }

    test.winner = { creative_id: creativeId, variant: winnerVariant.variant };
    test.status = 'completed';
    await test.save();

    res.json(success(await serializeABTestResults(test.toObject()), 'Winner marked'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to mark winner' });
  }
});

// Latest A/B test results for a campaign (null when no test exists)
router.get('/:campaignId/ab-test/results', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.campaignId as string;
    const test = await ABTest.findOne({ campaign_id: campaignId }).sort({ created_at: -1 }).lean();
    if (!test) {
      res.json(success(null));
      return;
    }
    res.json(success(await serializeABTestResults(test)));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch A/B test results' });
  }
});

// Metrics for the latest A/B test of a campaign
router.get('/:campaignId/ab-test/metrics', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.campaignId as string;
    const test = await ABTest.findOne({ campaign_id: campaignId }).sort({ created_at: -1 }).lean();
    const metrics = test ? test.variants.map(serializeVariantMetrics) : [];
    res.json(success({ metrics }));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch A/B test metrics' });
  }
});

export default router;
