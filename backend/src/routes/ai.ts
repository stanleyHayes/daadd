import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { AIRecommendation, AIAuditLog, AICreative, Campaign, IAIRecommendation } from '../models';
import { authMiddleware } from '../middleware/auth';
import { success } from '../utils/response';
import { seededRandom } from '../utils/seeded';
import { findManageableCampaign } from '../utils/ownership';

const router = Router();

function serializeRecommendation(r: any) {
  return {
    id: r._id?.toString() || r.id,
    campaign_id: r.campaign_id,
    type: r.type,
    title: r.title,
    description: r.description,
    expected_impact: r.expected_impact,
    confidence: r.confidence ?? 0,
    status: r.status,
    created_at: r.created_at,
  };
}

function serializeAuditLog(l: any) {
  return {
    id: l._id?.toString() || l.id,
    campaign_id: l.campaign_id,
    version: l.version ?? 1,
    action: l.action,
    field: l.field,
    old_value: l.old_value ?? '',
    new_value: l.new_value ?? '',
    applied_by: l.applied_by,
    timestamp: l.timestamp,
  };
}

/**
 * Generate 2-3 deterministic recommendations for a campaign that has none,
 * based on its budget utilization and a stable pseudo-CTR derived from its id.
 */
async function generateSeedRecommendations(campaign: any): Promise<IAIRecommendation[]> {
  const rng = seededRandom(`ai-recs:${campaign._id?.toString()}`);
  const budgetTotal = campaign.budget_total ?? 0;
  const budgetSpent = campaign.budget_spent ?? 0;
  const utilization = budgetTotal > 0 ? budgetSpent / budgetTotal : 0;
  // Stable pseudo-CTR between 0.5% and 6% derived from the campaign id
  const pseudoCtr = 0.5 + rng() * 5.5;

  const pool: Partial<IAIRecommendation>[] = [];

  if (pseudoCtr < 2) {
    pool.push({
      type: 'creative',
      title: 'Refresh underperforming creatives',
      description: `Your estimated CTR of ${pseudoCtr.toFixed(2)}% trails the industry average of 2.4%. Testing new headlines and visuals could meaningfully lift engagement.`,
      expected_impact: '+15-25% CTR',
      confidence: 0.78,
    });
  } else {
    pool.push({
      type: 'bid',
      title: 'Increase bids on high-CTR placements',
      description: `With an estimated CTR of ${pseudoCtr.toFixed(2)}%, your creatives are resonating. Raising bids ~10% on top placements should capture more qualified traffic.`,
      expected_impact: '+8-12% conversions',
      confidence: 0.72,
    });
  }

  if (utilization > 0.8) {
    pool.push({
      type: 'budget',
      title: 'Raise daily budget to avoid early cap-out',
      description: `You have spent ${(utilization * 100).toFixed(0)}% of your total budget. Increasing the budget prevents the campaign from pausing before its end date.`,
      expected_impact: '+20% reach',
      confidence: 0.81,
    });
  } else {
    pool.push({
      type: 'targeting',
      title: 'Tighten audience targeting',
      description:
        'Budget utilization is healthy. Narrowing age and region targeting toward your best-performing segments can improve return on ad spend.',
      expected_impact: '-10% CPA',
      confidence: 0.66,
    });
  }

  pool.push({
    type: 'device',
    title: 'Shift spend toward mobile devices',
    description:
      'Mobile placements historically deliver stronger engagement for this industry. Reallocating ~15% of impressions to mobile should improve efficiency.',
    expected_impact: '+5-10% CTR',
    confidence: 0.64,
  });

  const docs = await AIRecommendation.insertMany(
    pool.slice(0, 3).map((p) => ({ ...p, campaign_id: campaign._id.toString(), status: 'pending' }))
  );
  return docs as unknown as IAIRecommendation[];
}

async function nextAuditVersion(campaignId: string): Promise<number> {
  const count = await AIAuditLog.countDocuments({ campaign_id: campaignId });
  return count + 1;
}

// List recommendations for a campaign (auto-seeds on first fetch)
router.get('/recommendations/:campaignId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.campaignId as string;
    let recs = await AIRecommendation.find({ campaign_id: campaignId }).sort({ created_at: -1 }).lean();

    if (recs.length === 0 && Types.ObjectId.isValid(campaignId)) {
      const campaign = await Campaign.findById(campaignId).lean();
      if (campaign) {
        recs = (await generateSeedRecommendations(campaign)).map((d: any) => d.toObject());
      }
    }

    res.json(success(recs.map(serializeRecommendation)));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch recommendations' });
  }
});

// Apply a recommendation
router.post('/apply/:campaignId/:recId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.campaignId as string;
    const recId = req.params.recId as string;
    if (!Types.ObjectId.isValid(recId)) {
      res.status(400).json({ success: false, message: 'Invalid recommendation id' });
      return;
    }
    const campaign = await findManageableCampaign(campaignId, req.user!);
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Recommendation not found' });
      return;
    }
    const rec = await AIRecommendation.findOne({ _id: recId, campaign_id: campaignId });
    if (!rec) {
      res.status(404).json({ success: false, message: 'Recommendation not found' });
      return;
    }
    rec.status = 'applied';
    await rec.save();

    await AIAuditLog.create({
      campaign_id: campaignId,
      version: await nextAuditVersion(campaignId),
      action: `Applied recommendation: ${rec.title}`,
      field: rec.type,
      old_value: 'pending',
      new_value: 'applied',
      applied_by: 'user',
    });

    res.json(success(serializeRecommendation(rec.toObject()), 'Recommendation applied'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to apply recommendation' });
  }
});

// Dismiss a recommendation
router.delete('/recommendations/:campaignId/:recId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.campaignId as string;
    const recId = req.params.recId as string;
    if (!Types.ObjectId.isValid(recId)) {
      res.status(400).json({ success: false, message: 'Invalid recommendation id' });
      return;
    }
    const campaign = await findManageableCampaign(campaignId, req.user!);
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Recommendation not found' });
      return;
    }
    const rec = await AIRecommendation.findOne({ _id: recId, campaign_id: campaignId });
    if (!rec) {
      res.status(404).json({ success: false, message: 'Recommendation not found' });
      return;
    }
    rec.status = 'dismissed';
    await rec.save();

    await AIAuditLog.create({
      campaign_id: campaignId,
      version: await nextAuditVersion(campaignId),
      action: `Dismissed recommendation: ${rec.title}`,
      field: rec.type,
      old_value: 'pending',
      new_value: 'dismissed',
      applied_by: 'user',
    });

    res.json(success(serializeRecommendation(rec.toObject()), 'Recommendation dismissed'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to dismiss recommendation' });
  }
});

// AI audit log for a campaign
router.get('/audit-log/:campaignId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.campaignId as string;
    const logs = await AIAuditLog.find({ campaign_id: campaignId }).sort({ timestamp: -1 }).lean();
    res.json(success(logs.map(serializeAuditLog)));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch audit log' });
  }
});

// Update the campaign's AI mode
router.patch('/mode/:campaignId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.campaignId as string;
    const { mode } = req.body as { mode?: string };
    if (!mode || !['auto_adjust', 'recommendation_only'].includes(mode)) {
      res.status(400).json({
        success: false,
        message: "Invalid mode. Must be 'auto_adjust' or 'recommendation_only'",
      });
      return;
    }
    if (!Types.ObjectId.isValid(campaignId)) {
      res.status(400).json({ success: false, message: 'Invalid campaign id' });
      return;
    }
    const manageable = await findManageableCampaign(campaignId, req.user!);
    if (!manageable) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }
    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { ai_mode: mode, enable_ai_optimization: true },
      { new: true }
    ).lean();
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }

    await AIAuditLog.create({
      campaign_id: campaignId,
      version: await nextAuditVersion(campaignId),
      action: 'Changed AI mode',
      field: 'ai_mode',
      old_value: '',
      new_value: mode,
      applied_by: 'user',
    });

    res.json(success({ id: campaign._id.toString(), ai_mode: campaign.ai_mode }, 'AI mode updated'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update AI mode' });
  }
});

/* ---------------- AI Creative generation (template-based, no LLM key) ---------------- */

const TONES = ['professional', 'casual', 'playful', 'urgent', 'emotional'] as const;
const CTAS_BY_GOAL: Record<string, string[]> = {
  awareness: ['Learn More', 'Discover More', 'Explore Now'],
  consideration: ['See How It Works', 'Compare Options', 'Get the Details'],
  conversion: ['Shop Now', 'Get Started Today', 'Claim Your Offer'],
};
const HEADLINE_TEMPLATES = [
  (p: string) => `Discover ${p} — Made for You`,
  (p: string) => `${p}: Smarter Choices Start Here`,
  (p: string) => `Why Everyone Is Talking About ${p}`,
  (p: string) => `Unlock the Power of ${p}`,
  (p: string) => `${p} — Quality You Can Feel`,
  (p: string) => `Your Perfect ${p} Awaits`,
  (p: string) => `Limited Time: Experience ${p}`,
  (p: string) => `Fall in Love with ${p}`,
];
const BODY_TEMPLATES = [
  (p: string, a: string) =>
    `${p} delivers real results${a ? ` for ${a}` : ''}. Join thousands of happy customers and see the difference today.`,
  (p: string, a: string) =>
    `Tired of compromise? ${p} brings you premium quality${a ? ` tailored to ${a}` : ''} at a price you'll love.`,
  (p: string, a: string) =>
    `${a ? `${a} deserve better — ` : ''}${p} is here to make every day easier, brighter, and better.`,
];

function buildVariations(
  productName: string,
  audience: string | undefined,
  goal: string,
  tone: string | undefined,
  numVariations: number,
  seed: string
) {
  const rng = seededRandom(seed);
  const goalKey = CTAS_BY_GOAL[goal] ? goal : 'conversion';
  const count = Math.max(1, Math.min(10, numVariations || 3));
  return Array.from({ length: count }, (_, i) => ({
    headline: HEADLINE_TEMPLATES[Math.floor(rng() * HEADLINE_TEMPLATES.length)](productName),
    bodyText: BODY_TEMPLATES[Math.floor(rng() * BODY_TEMPLATES.length)](productName, audience || ''),
    cta: CTAS_BY_GOAL[goalKey][Math.floor(rng() * CTAS_BY_GOAL[goalKey].length)],
    tone: (tone && TONES.includes(tone as any) ? tone : TONES[Math.floor(rng() * TONES.length)]) as string,
    confidence: Math.round((0.6 + rng() * 0.35) * 100) / 100,
  }));
}

router.post('/creative/generate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      campaignId,
      productName,
      audience,
      goal = 'conversion',
      tone,
      language = 'en',
      numVariations = 3,
    } = req.body as Record<string, any>;

    if (!campaignId || !productName) {
      res.status(400).json({ success: false, message: 'campaignId and productName are required' });
      return;
    }

    const variations = buildVariations(
      productName,
      audience,
      goal,
      tone,
      numVariations,
      `gen:${campaignId}:${productName}:${goal}:${language}`
    );

    res.json(
      success({
        campaignId,
        variations,
        summary: `Generated ${variations.length} ${goal}-focused creative variation(s) for "${productName}"${audience ? ` targeting ${audience}` : ''}.`,
        language,
        generatedAt: new Date(),
      })
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to generate creatives' });
  }
});

router.post('/creative/refine', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { campaignId, feedback, variations } = req.body as {
      campaignId?: string;
      feedback?: string;
      variations?: any[];
    };
    if (!campaignId || !feedback || !Array.isArray(variations)) {
      res.status(400).json({ success: false, message: 'campaignId, feedback and variations are required' });
      return;
    }

    const rng = seededRandom(`refine:${campaignId}:${feedback}`);
    const refined = variations.map((v: any) => ({
      ...v,
      headline: v.headline,
      bodyText: `${v.bodyText}`.slice(0, 280),
      confidence: Math.min(0.99, Math.round(((v.confidence ?? 0.7) + rng() * 0.1) * 100) / 100),
    }));

    res.json(success({ refined: refined.length, variations: refined }));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to refine creatives' });
  }
});

router.post('/creative/save', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { campaignId, variations, language = 'en' } = req.body as {
      campaignId?: string;
      variations?: any[];
      language?: string;
    };
    if (!campaignId || !Array.isArray(variations) || variations.length === 0) {
      res.status(400).json({ success: false, message: 'campaignId and at least one variation are required' });
      return;
    }

    const saved = await AICreative.create({ campaign_id: campaignId, variations, language });
    res.status(201).json(
      success(
        { id: saved._id.toString(), campaign_id: campaignId, saved: variations.length, language },
        'Creatives saved'
      )
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to save creatives' });
  }
});

router.get('/creative/performance/:campaignId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.campaignId as string;
    const creatives = await AICreative.find({ campaign_id: campaignId }).lean();

    const allVariations = creatives.flatMap((c: any) => c.variations || []);
    const total = allVariations.length;
    const avgConfidence =
      total > 0
        ? Math.round((allVariations.reduce((s: number, v: any) => s + (v.confidence ?? 0), 0) / total) * 100) / 100
        : 0;

    let bestPerformer: string | null = null;
    if (total > 0) {
      const best = allVariations.reduce((a: any, b: any) => ((b.confidence ?? 0) > (a.confidence ?? 0) ? b : a));
      bestPerformer = best.headline || null;
    }

    res.json(
      success({
        bestPerformer,
        aiGeneratedStats: { total, avgConfidence },
        recommendations:
          total === 0
            ? ['Generate your first AI creative variations to start tracking performance.']
            : [
                'A/B test your highest-confidence headline against a fresh variation.',
                avgConfidence < 0.75
                  ? 'Refine existing variations with feedback to raise average confidence.'
                  : 'Your creatives look strong — consider localizing them for top regions.',
              ],
      })
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch creative performance' });
  }
});

export default router;
