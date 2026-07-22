import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { AdChannel, BidRequest, AD_CHANNELS, PRICING_MODELS } from '../models';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { calculateSpend, effectiveCpm, BILLABLE_UNIT } from '../services/channel-pricing.service';
import { success } from '../utils/response';

/**
 * Ad channels — the surface for roadmap phases 3-6 (RTB, CTV, audio, retail
 * media). See models/AdChannel.ts for why they share one model.
 *
 * Channels are disabled until an admin enables them, because a channel with no
 * signed supply agreement behind it should not appear to an advertiser as
 * something they can buy.
 */
const router = Router();

router.use(authMiddleware);

/** GET /channels — what this advertiser can actually buy right now. */
router.get('/', requirePermission('campaigns:read'), async (_req: Request, res: Response) => {
  try {
    const channels = await AdChannel.find({ is_enabled: true }).sort({ type: 1, name: 1 }).lean();
    res.json(
      success(
        channels.map((c) => ({
          ...c,
          billable_unit: BILLABLE_UNIT[c.pricing_model],
        }))
      )
    );
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** GET /channels/catalogue — the vocabulary, for building forms. */
router.get('/catalogue', requirePermission('campaigns:read'), (_req: Request, res: Response) => {
  res.json(success({ types: AD_CHANNELS, pricingModels: PRICING_MODELS, units: BILLABLE_UNIT }));
});

/**
 * POST /channels/estimate
 * What a given delivery would cost on a channel, before committing budget.
 */
router.post('/estimate', requirePermission('campaigns:read'), async (req: Request, res: Response) => {
  try {
    const { channel_id, impressions, clicks, completedViews, conversions } = req.body || {};
    if (!Types.ObjectId.isValid(channel_id)) {
      res.status(400).json({ success: false, message: 'A valid channel_id is required' });
      return;
    }

    const channel = await AdChannel.findById(channel_id).lean();
    if (!channel || !channel.is_enabled) {
      res.status(404).json({ success: false, message: 'Channel not available' });
      return;
    }

    const units = {
      impressions: Number(impressions) || 0,
      clicks: Number(clicks) || 0,
      completedViews: Number(completedViews) || 0,
      conversions: Number(conversions) || 0,
    };
    const spend = calculateSpend(channel.pricing_model, channel.base_rate, units);

    res.json(
      success({
        channel: channel.name,
        pricing_model: channel.pricing_model,
        billable_unit: BILLABLE_UNIT[channel.pricing_model],
        base_rate: channel.base_rate,
        units,
        spend,
        effective_cpm: effectiveCpm(spend, units.impressions),
      })
    );
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /channels/auctions/:campaignId
 * Auction history for a campaign (Phase 3). Returns real recorded bids — an
 * empty list where none have been logged, rather than a simulated one.
 */
router.get(
  '/auctions/:campaignId',
  requirePermission('analytics:read'),
  async (req: Request, res: Response) => {
    try {
      const campaignId = req.params.campaignId as string;
      if (!Types.ObjectId.isValid(campaignId)) {
        res.status(400).json({ success: false, message: 'Invalid campaign id' });
        return;
      }

      const [rows, recent] = await Promise.all([
        BidRequest.aggregate<{ _id: string; count: number; spend: number }>([
          { $match: { campaign_id: new Types.ObjectId(campaignId) } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              spend: { $sum: '$clearing_cpm' },
            },
          },
        ]),
        BidRequest.find({ campaign_id: campaignId }).sort({ created_at: -1 }).limit(50).lean(),
      ]);

      const byStatus = new Map(rows.map((r) => [r._id, r]));
      const submitted = rows.reduce((sum, r) => sum + r.count, 0);
      const won = byStatus.get('won')?.count ?? 0;

      res.json(
        success({
          submitted,
          won,
          lost: byStatus.get('lost')?.count ?? 0,
          timeouts: byStatus.get('timeout')?.count ?? 0,
          // Undefined rather than 0% when we have not bid at all.
          winRate: submitted > 0 ? Number(((won / submitted) * 100).toFixed(2)) : null,
          spend: Number(((byStatus.get('won')?.spend ?? 0) / 1000).toFixed(2)),
          recent,
        })
      );
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// --- admin ------------------------------------------------------------------

router.post('/', requirePermission('campaigns:create'), async (req: Request, res: Response) => {
  try {
    const { type, name, provider, pricing_model, base_rate, specs, is_enabled } = req.body || {};
    if (!AD_CHANNELS.includes(type)) {
      res.status(400).json({ success: false, message: `type must be one of: ${AD_CHANNELS.join(', ')}` });
      return;
    }
    if (!name?.trim()) {
      res.status(400).json({ success: false, message: 'name is required' });
      return;
    }

    const channel = await AdChannel.create({
      type,
      name: name.trim(),
      provider: provider ?? '',
      pricing_model: PRICING_MODELS.includes(pricing_model) ? pricing_model : 'cpm',
      base_rate: Math.max(0, Number(base_rate) || 0),
      specs: specs ?? {},
      is_enabled: !!is_enabled,
    });
    res.status(201).json(success(channel, 'Channel created'));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:id', requirePermission('campaigns:update'), async (req: Request, res: Response) => {
  try {
    const allowed = ['name', 'provider', 'pricing_model', 'base_rate', 'specs', 'is_enabled'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) if (req.body?.[key] !== undefined) update[key] = req.body[key];

    const channel = await AdChannel.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!channel) {
      res.status(404).json({ success: false, message: 'Channel not found' });
      return;
    }
    res.json(success(channel, 'Channel updated'));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
