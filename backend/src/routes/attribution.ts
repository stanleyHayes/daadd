/**
 * Cross-device attribution routes (spec §4.11).
 *
 * NOTE ON DATA: there is no real event stream in this deployment. When a
 * campaign has no recorded DeviceEvents, GET /devices/:campaignId returns a
 * DETERMINISTIC SYNTHETIC breakdown seeded from the campaign id (same shape
 * as real data) so UIs always render — see src/utils/seeded.ts.
 */
import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { DeviceEvent, User, Campaign, Ad, DeviceType } from '../models';
import { authMiddleware } from '../middleware/auth';
import { success } from '../utils/response';
import { seededRandom, pickSeeded } from '../utils/seeded';

const router = Router();

const DEVICE_TYPES: DeviceType[] = ['phone', 'tablet', 'tv', 'desktop', 'other'];
const VALID_WINDOWS = [7, 14, 30, 90];

function serializeEvent(e: any) {
  return {
    id: e._id?.toString() || e.id,
    device_id: e.device_id,
    device_type: e.device_type,
    ad_id: e.ad_id?.toString() || null,
    campaign_id: e.campaign_id?.toString() || null,
    event_type: e.event_type,
    created_at: e.created_at,
  };
}

// Record a device event and associate the device with the caller.
router.post('/event', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { device_id, device_type, ad_id, campaign_id, event_type } = req.body as {
      device_id?: string;
      device_type?: string;
      ad_id?: string;
      campaign_id?: string;
      event_type?: string;
    };

    if (!device_id || !event_type) {
      res.status(400).json({ success: false, message: 'device_id and event_type are required' });
      return;
    }
    if (!['impression', 'click', 'conversion'].includes(event_type)) {
      res.status(400).json({ success: false, message: 'event_type must be impression, click or conversion' });
      return;
    }
    const resolvedEventType = event_type as 'impression' | 'click' | 'conversion';
    const resolvedType: DeviceType = DEVICE_TYPES.includes(device_type as DeviceType)
      ? (device_type as DeviceType)
      : 'other';

    // Resolve the campaign from the ad when not provided explicitly.
    let resolvedCampaignId: any = campaign_id || null;
    if (!resolvedCampaignId && ad_id) {
      try {
        const ad = await Ad.findById(ad_id).select('campaign_id').lean();
        resolvedCampaignId = (ad as any)?.campaign_id || null;
      } catch {
        resolvedCampaignId = null;
      }
    }

    const event = await DeviceEvent.create({
      user_id: req.user!.userId,
      device_id,
      device_type: resolvedType,
      ad_id: ad_id || undefined,
      campaign_id: resolvedCampaignId || undefined,
      event_type: resolvedEventType,
    });

    // Dedupe: add the device to the user's known devices if new.
    await User.updateOne(
      { _id: req.user!.userId },
      { $addToSet: { device_ids: device_id } }
    );

    res.status(201).json(success(serializeEvent(event.toObject()), 'Event recorded'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to record event' });
  }
});

// The caller's cross-device journey within their attribution window.
router.get('/journey', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId).select('attribution_window_days device_ids').lean();
    const windowDays = (user as any)?.attribution_window_days || 30;
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

    const events = await DeviceEvent.find({
      user_id: req.user!.userId,
      created_at: { $gte: since },
    })
      .sort({ created_at: 1 })
      .lean();

    // Group events by device.
    const byDevice: Record<string, any[]> = {};
    for (const e of events) {
      const key = String(e.device_id);
      (byDevice[key] ||= []).push(serializeEvent(e));
    }

    // Conversion paths: sequence of device types since the previous
    // conversion (consecutive duplicates collapsed) leading to a conversion.
    const pathCounts: Record<string, number> = {};
    let currentPath: string[] = [];
    for (const e of events) {
      const dt = String(e.device_type);
      if (currentPath[currentPath.length - 1] !== dt) currentPath.push(dt);
      if (e.event_type === 'conversion') {
        const label = currentPath.join('→');
        pathCounts[label] = (pathCounts[label] || 0) + 1;
        currentPath = [];
      }
    }
    const conversionPaths = Object.entries(pathCounts)
      .map(([path, count]) => ({ path: path.split('→'), count }))
      .sort((a, b) => b.count - a.count);

    const first = events[0];
    const last = events[events.length - 1];

    res.json(
      success({
        window_days: windowDays,
        touchpoint_count: events.length,
        devices: Object.entries(byDevice).map(([device_id, deviceEvents]) => ({
          device_id,
          device_type: deviceEvents[0]?.device_type || 'other',
          events: deviceEvents,
        })),
        first_touch: first ? serializeEvent(first) : null,
        last_touch: last ? serializeEvent(last) : null,
        conversion_paths: conversionPaths,
      })
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch journey' });
  }
});

interface DeviceBreakdownRow {
  device_type: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
}

function buildSyntheticCampaignBreakdown(campaignId: string): {
  breakdown: DeviceBreakdownRow[];
  cross_device_paths: { path: string[]; count: number }[];
} {
  const rng = seededRandom(`attribution:${campaignId}`);
  const types: DeviceType[] = ['phone', 'desktop', 'tablet', 'tv'];
  const breakdown: DeviceBreakdownRow[] = types.map((device_type) => {
    const impressions = Math.floor(1000 + rng() * 9000);
    const clicks = Math.floor(impressions * (0.02 + rng() * 0.08));
    const conversions = Math.floor(clicks * (0.05 + rng() * 0.2));
    return {
      device_type,
      impressions,
      clicks,
      conversions,
      ctr: impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0,
    };
  });
  const cross_device_paths = [
    { path: ['phone', 'desktop'], count: 20 + Math.floor(rng() * 80) },
    { path: ['tv', 'phone'], count: 10 + Math.floor(rng() * 50) },
    { path: ['tablet', 'desktop'], count: 5 + Math.floor(rng() * 30) },
    { path: [pickSeeded(rng, types), pickSeeded(rng, types)], count: 1 + Math.floor(rng() * 15) },
  ].filter((p) => p.path[0] !== p.path[1]);
  return { breakdown, cross_device_paths };
}

// Device path mapping for a campaign. Falls back to deterministic synthetic
// data seeded from the campaign id when no real events exist (see header).
router.get('/devices/:campaignId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.campaignId as string;

    const campaign = await Campaign.findById(campaignId).select('name owner').lean();
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }

    // campaign_id is stored as Mixed — match both string and ObjectId forms.
    const idCandidates: any[] = [campaignId];
    if (Types.ObjectId.isValid(campaignId)) idCandidates.push(new Types.ObjectId(campaignId));

    const events = await DeviceEvent.find({ campaign_id: { $in: idCandidates } })
      .sort({ created_at: 1 })
      .lean();

    if (events.length === 0) {
      const synthetic = buildSyntheticCampaignBreakdown(campaignId);
      res.json(
        success({
          campaign_id: campaignId,
          synthetic: true,
          breakdown: synthetic.breakdown,
          cross_device_paths: synthetic.cross_device_paths,
        })
      );
      return;
    }

    // Real breakdown by device type.
    const byType: Record<string, DeviceBreakdownRow> = {};
    for (const e of events) {
      const dt = String(e.device_type);
      const row = (byType[dt] ||= {
        device_type: dt,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
      });
      if (e.event_type === 'impression') row.impressions++;
      else if (e.event_type === 'click') row.clicks++;
      else if (e.event_type === 'conversion') row.conversions++;
    }
    const breakdown = Object.values(byType).map((row) => ({
      ...row,
      ctr: row.impressions > 0 ? Number(((row.clicks / row.impressions) * 100).toFixed(2)) : 0,
    }));

    // Cross-device paths: per-user ordered device-type transitions where the
    // device type changes (e.g. phone→desktop), aggregated.
    const perUser: Record<string, string[]> = {};
    for (const e of events) {
      const uid = String(e.user_id);
      const seq = (perUser[uid] ||= []);
      const dt = String(e.device_type);
      if (seq[seq.length - 1] !== dt) seq.push(dt);
    }
    const transitionCounts: Record<string, number> = {};
    for (const seq of Object.values(perUser)) {
      for (let i = 1; i < seq.length; i++) {
        const label = `${seq[i - 1]}→${seq[i]}`;
        transitionCounts[label] = (transitionCounts[label] || 0) + 1;
      }
    }
    const cross_device_paths = Object.entries(transitionCounts)
      .map(([label, count]) => ({ path: label.split('→'), count }))
      .sort((a, b) => b.count - a.count);

    res.json(
      success({
        campaign_id: campaignId,
        synthetic: false,
        breakdown,
        cross_device_paths,
      })
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch device breakdown' });
  }
});

// Attribution settings: lookback window (7/14/30/90 days).
router.get('/settings', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId).select('attribution_window_days').lean();
    res.json(success({ attribution_window_days: (user as any)?.attribution_window_days || 30 }));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch settings' });
  }
});

router.put('/settings', authMiddleware, async (req: Request, res: Response) => {
  try {
    const windowDays = Number((req.body as any)?.attribution_window_days);
    if (!VALID_WINDOWS.includes(windowDays)) {
      res.status(400).json({
        success: false,
        message: `attribution_window_days must be one of: ${VALID_WINDOWS.join(', ')}`,
      });
      return;
    }
    await User.updateOne({ _id: req.user!.userId }, { $set: { attribution_window_days: windowDays } });
    res.json(success({ attribution_window_days: windowDays }, 'Attribution window updated'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update settings' });
  }
});

export default router;
