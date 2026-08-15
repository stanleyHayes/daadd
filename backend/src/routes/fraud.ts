import { Router, Request, Response } from 'express';
import {
  FraudSignal,
  FraudSignalStatus,
  FRAUD_SIGNAL_STATUSES,
} from '../models';
import { authMiddleware, requireRole } from '../middleware/auth';
import { runFraudScan } from '../services/fraud-detection.service';
import { success, paginated } from '../utils/response';

/**
 * Admin-only fraud review. Signals are raised by the fraud-detection service
 * from real money-path events; here an admin runs a scan, reviews the queue, and
 * marks a signal reviewing / dismissed / actioned. Acting on a merchant (restrict
 * / suspend) is done through the merchant verification routes.
 */
const router = Router();

router.use(authMiddleware, requireRole('admin'));

/** POST /fraud/scan — run detection now (also driven by a scheduled job). */
router.post('/scan', async (_req: Request, res: Response) => {
  try {
    const result = await runFraudScan();
    res.json(success(result, `${result.created} new, ${result.refreshed} refreshed`));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** GET /fraud?status=open — the review queue. */
router.get('/', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as FraudSignalStatus | undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 25);

    const filter: Record<string, unknown> = {};
    if (status && FRAUD_SIGNAL_STATUSES.includes(status)) filter.status = status;

    const [rows, total] = await Promise.all([
      FraudSignal.find(filter)
        .sort({ severity_rank: -1, detected_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      FraudSignal.countDocuments(filter),
    ]);

    res.json(paginated(rows, total, page, limit));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** PATCH /fraud/:id — set a signal's review status. */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const status = req.body?.status as FraudSignalStatus;
    if (!FRAUD_SIGNAL_STATUSES.includes(status)) {
      res.status(400).json({
        success: false,
        message: `status must be one of: ${FRAUD_SIGNAL_STATUSES.join(', ')}`,
      });
      return;
    }

    const resolved = status === 'dismissed' || status === 'actioned';
    const signal = await FraudSignal.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status,
          review_notes: String(req.body?.review_notes ?? '').trim(),
          reviewed_by: req.user!.userId,
          ...(resolved ? { resolved_at: new Date() } : {}),
        },
      },
      { new: true }
    );
    if (!signal) {
      res.status(404).json({ success: false, message: 'Signal not found' });
      return;
    }

    res.json(success(signal, `Signal ${status}`));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
