import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { User, PlatformSetting } from '../models';
import { authMiddleware, requireRole } from '../middleware/auth';
import { success } from '../utils/response';
import { getVipCriteria, DEFAULT_VIP_CRITERIA, VIP_CRITERIA_KEY } from '../utils/vip';

const router = Router();

// Every admin route requires an authenticated admin.
router.use(authMiddleware, requireRole('admin'));

function serializeAdvertiser(u: InstanceType<typeof User>) {
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar_url: u.avatar_url,
    email_verified: u.email_verified === true,
    advertiser_approval: u.advertiser_approval ?? 'pending',
    billing_ready: u.billing_ready === true,
    created_at: u.created_at,
  };
}

// GET /admin/advertisers?status=pending|approved|rejected — review queue.
/**
 * VIP qualification criteria (V2 Area 8) — administrator-configurable.
 * A 0 on any minimum disables that particular requirement.
 */
router.get('/vip-criteria', async (_req: Request, res: Response) => {
  try {
    res.json(success({ criteria: await getVipCriteria(), defaults: DEFAULT_VIP_CRITERIA }));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch VIP criteria' });
  }
});

router.put('/vip-criteria', async (req: Request, res: Response) => {
  try {
    const current = await getVipCriteria();
    const next = { ...current };
    for (const key of [
      'min_merchant_visits',
      'min_purchases',
      'min_reviews',
      'min_engagement_score',
    ] as const) {
      if (req.body?.[key] !== undefined) {
        const n = Number(req.body[key]);
        if (!Number.isNaN(n)) next[key] = Math.max(0, Math.floor(n));
      }
    }
    await PlatformSetting.findOneAndUpdate(
      { key: VIP_CRITERIA_KEY },
      { $set: { value: next } },
      { upsert: true, new: true }
    );
    res.json(success({ criteria: next }, 'VIP criteria updated'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update VIP criteria' });
  }
});

router.get('/advertisers', async (req: Request, res: Response) => {
  try {
    const status = String(req.query.status || 'pending');
    const filter: Record<string, unknown> = { role: 'advertiser' };
    if (['pending', 'approved', 'rejected'].includes(status)) {
      filter.advertiser_approval = status;
    }
    const users = await User.find(filter).sort({ created_at: -1 }).limit(200);
    res.json(success(users.map(serializeAdvertiser)));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to list advertisers' });
  }
});

async function setApproval(
  id: string,
  approval: 'approved' | 'rejected',
  res: Response
): Promise<void> {
  if (!Types.ObjectId.isValid(id)) {
    res.status(400).json({ success: false, message: 'Invalid user id' });
    return;
  }
  const user = await User.findById(id);
  if (!user || user.role !== 'advertiser') {
    res.status(404).json({ success: false, message: 'Advertiser not found' });
    return;
  }
  user.advertiser_approval = approval;
  await user.save();
  res.json(success(serializeAdvertiser(user), `Advertiser ${approval}`));
}

router.post('/advertisers/:id/approve', async (req: Request, res: Response) => {
  try {
    await setApproval(req.params.id as string, 'approved', res);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to approve advertiser' });
  }
});

router.post('/advertisers/:id/reject', async (req: Request, res: Response) => {
  try {
    await setApproval(req.params.id as string, 'rejected', res);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to reject advertiser' });
  }
});

export default router;
