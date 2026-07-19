import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { User } from '../models';
import { authMiddleware, requireRole } from '../middleware/auth';
import { success } from '../utils/response';

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
