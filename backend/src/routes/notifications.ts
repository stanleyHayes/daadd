import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { Notification, User } from '../models';
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

router.patch('/read-all', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await Notification.updateMany(
      { user_id: req.user!.userId, read: false },
      { $set: { read: true } }
    );
    res.json(success({ updated: result.modifiedCount }));
  } catch (err: any) {
    res
      .status(500)
      .json({ success: false, message: err.message || 'Failed to mark notifications as read' });
  }
});

router.patch('/:id/read', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id as string)) {
      res.status(400).json({ success: false, message: 'Invalid notification id' });
      return;
    }
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user!.userId },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }
    res.json(success(notification));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update notification' });
  }
});

router.post('/register', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { token, platform } = req.body;
    if (!token || !platform) {
      res.status(400).json({ success: false, message: 'Token and platform are required' });
      return;
    }

    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const tokens = user.push_tokens || [];
    const existing = tokens.find((t) => t.token === token);
    if (existing) {
      existing.platform = platform;
      existing.created_at = new Date();
    } else {
      tokens.push({ token, platform, created_at: new Date() });
    }
    user.push_tokens = tokens;
    await user.save();

    res.json(success({ registered: true }));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to register push token' });
  }
});

export default router;
