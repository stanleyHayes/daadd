import { Router, Request, Response } from 'express';
import { Notification } from '../models';
import { authMiddleware } from '../middleware/auth';
import { success, paginated } from '../utils/response';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { read, page = '1', limit = '10' } = req.query as Record<string, string | undefined>;
    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit || '10', 10)));

    const filter: Record<string, any> = { user_id: req.user!.userId };
    if (read !== undefined) filter.read = read === 'true';

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ created_at: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json(paginated(notifications, total, pageNum, limitNum));
  } catch (err: any) {
    res
      .status(500)
      .json({ success: false, message: err.message || 'Failed to fetch notifications' });
  }
});

export default router;
