/**
 * Structured event log routes (spec §6).
 * POST records an event for the caller; GET is admin-only with pagination
 * and optional event_type filtering.
 */
import { Router, Request, Response } from 'express';
import { Event } from '../models';
import { authMiddleware } from '../middleware/auth';
import { success, paginated } from '../utils/response';

const router = Router();

function serializeEvent(e: any) {
  return {
    id: e._id?.toString() || e.id,
    event_type: e.event_type,
    user_id: e.user_id?.toString() || null,
    payload: e.payload ?? null,
    ip: e.ip || '',
    created_at: e.created_at,
  };
}

// Record a structured event for the authenticated caller.
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { event_type, payload } = req.body as { event_type?: string; payload?: any };
    if (!event_type) {
      res.status(400).json({ success: false, message: 'event_type is required' });
      return;
    }
    const event = await Event.create({
      event_type,
      user_id: req.user!.userId,
      payload: payload ?? null,
      ip: req.ip || req.socket.remoteAddress || '',
    });
    res.status(201).json(success(serializeEvent(event.toObject()), 'Event recorded'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to record event' });
  }
});

// List events (admin only) with pagination and optional event_type filter.
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden: admin role required' });
      return;
    }
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
    const filter: any = {};
    if (req.query.event_type) filter.event_type = String(req.query.event_type);

    const [events, total] = await Promise.all([
      Event.find(filter).sort({ created_at: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Event.countDocuments(filter),
    ]);

    res.json(paginated(events.map(serializeEvent), total, page, limit));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch events' });
  }
});

export default router;
