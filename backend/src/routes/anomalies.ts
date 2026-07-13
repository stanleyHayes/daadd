import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { Anomaly } from '../models';
import { authMiddleware } from '../middleware/auth';
import { success } from '../utils/response';
import { scanForUser } from '../services/anomaly-detection.service';

const router = Router();

function serializeAnomaly(a: any) {
  return {
    id: a._id?.toString() || a.id,
    campaign_id: a.campaign_id,
    campaign_name: a.campaign_name || '',
    type: a.type,
    severity: a.severity,
    metric: a.metric,
    current_value: a.current_value ?? 0,
    threshold_value: a.threshold_value ?? 0,
    description: a.description || '',
    detected_at: a.detected_at,
    resolved_at: a.resolved_at,
    resolved_by: a.resolved_by?.toString(),
    auto_paused: a.auto_paused ?? false,
  };
}

// Trigger an on-demand anomaly scan (spec §4.7). Runs across the caller's
// active campaigns — all active campaigns for admins. Must be registered
// BEFORE the /:campaignId routes so "scan" is not captured as an id.
router.post('/scan', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await scanForUser(req.user!.userId, req.user!.role);
    res.json(success(result, `Scanned ${result.scanned} campaign(s), created ${result.created} anomaly(ies)`));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to run anomaly scan' });
  }
});

// List anomalies for a campaign. Empty array (never 404) when none exist.
router.get('/:campaignId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.campaignId as string;
    const anomalies = await Anomaly.find({ campaign_id: campaignId })
      .sort({ detected_at: -1 })
      .lean();
    res.json(success(anomalies.map(serializeAnomaly)));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch anomalies' });
  }
});

// Resolve an anomaly by id.
router.post('/:anomalyId/resolve', authMiddleware, async (req: Request, res: Response) => {
  try {
    const anomalyId = req.params.anomalyId as string;
    let anomaly = null;
    if (Types.ObjectId.isValid(anomalyId)) {
      anomaly = await Anomaly.findById(anomalyId);
    }
    if (!anomaly) {
      res.status(404).json({ success: false, message: 'Anomaly not found' });
      return;
    }
    anomaly.status = 'resolved';
    anomaly.resolved_at = new Date();
    anomaly.resolved_by = req.user!.userId;
    await anomaly.save();
    res.json(success(serializeAnomaly(anomaly.toObject()), 'Anomaly resolved'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to resolve anomaly' });
  }
});

export default router;
