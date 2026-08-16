import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { User, PlatformSetting } from '../models';
import { authMiddleware, requireRole } from '../middleware/auth';
import { success } from '../utils/response';
import { getVipCriteria, DEFAULT_VIP_CRITERIA, VIP_CRITERIA_KEY } from '../utils/vip';
import {
  getMultiplierRules,
  sanitizeMultiplierRules,
  DEFAULT_MULTIPLIER_RULES,
  MULTIPLIER_RULES_KEY,
  MAX_STREAK_MULTIPLIER,
  MAX_VIP_MULTIPLIER,
  MAX_EFFECTIVE_MULTIPLIER,
} from '../utils/multiplier-rules';
import {
  getCommerceSettings,
  sanitizeCommerceSettings,
  DEFAULT_COMMERCE_SETTINGS,
  COMMERCE_SETTINGS_KEY,
} from '../utils/commerce-settings';

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

/**
 * Reward-multiplier rules (Phase 3.3) — administrator-configurable streak tiers
 * and VIP multiplier, replacing the previously hardcoded values. The saved value
 * is sanitised and clamped to hard ceilings so no admin input can inflate the
 * multiplier past a safe bound (the reward path re-clamps too — see
 * utils/multiplier-rules.ts).
 */
router.get('/multiplier-rules', async (_req: Request, res: Response) => {
  try {
    res.json(
      success({
        rules: await getMultiplierRules(),
        defaults: DEFAULT_MULTIPLIER_RULES,
        limits: {
          max_streak_multiplier: MAX_STREAK_MULTIPLIER,
          max_vip_multiplier: MAX_VIP_MULTIPLIER,
          max_effective_multiplier: MAX_EFFECTIVE_MULTIPLIER,
        },
      })
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch multiplier rules' });
  }
});

router.put('/multiplier-rules', async (req: Request, res: Response) => {
  try {
    const next = sanitizeMultiplierRules(req.body);
    await PlatformSetting.findOneAndUpdate(
      { key: MULTIPLIER_RULES_KEY },
      { $set: { value: next } },
      { upsert: true, new: true }
    );
    res.json(success({ rules: next }, 'Multiplier rules updated'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update multiplier rules' });
  }
});

/**
 * Commerce settings (Phase 5) — VAT rate + inclusive/exclusive, and the order
 * lifecycle windows. Config, not a code decision; sanitised + clamped on save.
 */
router.get('/commerce-settings', async (_req: Request, res: Response) => {
  try {
    res.json(success({ settings: await getCommerceSettings(), defaults: DEFAULT_COMMERCE_SETTINGS }));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch commerce settings' });
  }
});

router.put('/commerce-settings', async (req: Request, res: Response) => {
  try {
    const next = sanitizeCommerceSettings(req.body);
    await PlatformSetting.findOneAndUpdate(
      { key: COMMERCE_SETTINGS_KEY },
      { $set: { value: next } },
      { upsert: true, new: true }
    );
    res.json(success({ settings: next }, 'Commerce settings updated'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update commerce settings' });
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
