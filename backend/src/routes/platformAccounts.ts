import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { PlatformAccount } from '../models';
import { authMiddleware } from '../middleware/auth';

const router = Router();

function serializeAccount(a: any) {
  return {
    id: a._id?.toString() || a.id,
    platform: a.platform,
    platform_account_id: a.platform_account_id || '',
    platform_account_name: a.platform_account_name || '',
    status: a.status,
    is_active: a.is_active ?? true,
    sync_frequency: a.sync_frequency || 'daily',
    last_synced: a.last_synced,
    error_message: a.error_message,
    metrics: a.metrics || { impressions: 0, clicks: 0, spend: 0 },
    created_at: a.created_at,
  };
}

// NOTE: PlatformAccountsPage consumes `response.data` directly as an array,
// so this endpoint intentionally returns a bare JSON array (not success()).
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const accounts = await PlatformAccount.find({ user_id: req.user!.userId, is_active: true })
      .sort({ created_at: -1 })
      .lean();
    res.json(accounts.map(serializeAccount));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch platform accounts' });
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid account id' });
      return;
    }
    const account = await PlatformAccount.findOneAndUpdate(
      { _id: id, user_id: req.user!.userId },
      { is_active: false, status: 'revoked' },
      { new: true }
    ).lean();
    if (!account) {
      res.status(404).json({ success: false, message: 'Platform account not found' });
      return;
    }
    res.json({ success: true, message: 'Platform account disconnected' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to disconnect account' });
  }
});

// Health check: verify the stored connection is still usable (placeholder —
// real platform API calls require registered OAuth apps).
router.post('/:id/test', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid account id' });
      return;
    }
    const account = await PlatformAccount.findOne({ _id: id, user_id: req.user!.userId });
    if (!account) {
      res.status(404).json({ success: false, message: 'Platform account not found' });
      return;
    }

    const healthy = account.status !== 'revoked';
    account.status = healthy ? 'connected' : 'sync_error';
    account.last_synced = healthy ? new Date() : account.last_synced;
    account.error_message = healthy ? undefined : 'Connection test failed: authorization revoked';
    await account.save();

    if (!healthy) {
      res.status(502).json({ success: false, message: 'Connection test failed' });
      return;
    }
    res.json({ success: true, message: 'Connection verified', account: serializeAccount(account.toObject()) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Connection test failed' });
  }
});

export default router;
