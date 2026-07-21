import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { Outlet, User } from '../models';
import { authMiddleware } from '../middleware/auth';
import { escapeRegExp } from '../utils/regex';
import { success } from '../utils/response';

const router = Router();

const WRITABLE = ['name', 'address', 'city', 'phone', 'opening_hours', 'is_active'] as const;

function toObjectId(id: string | string[] | undefined): Types.ObjectId | null {
  if (typeof id !== 'string') return null;
  try {
    return new Types.ObjectId(id);
  } catch {
    return null;
  }
}

function serializeOutlet(o: any) {
  return {
    id: String(o._id),
    owner: String(o.owner),
    name: o.name,
    address: o.address || '',
    city: o.city || '',
    phone: o.phone || '',
    opening_hours: o.opening_hours || '',
    is_active: o.is_active !== false,
    created_at: o.created_at,
  };
}

/** Only whitelisted fields are accepted — `owner` is always server-set. */
function normalizeOutletBody(body: any): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const key of WRITABLE) {
    if (body?.[key] !== undefined) normalized[key] = body[key];
  }
  return normalized;
}

/**
 * Public: search active outlets by name/city/address so a customer can pick
 * the branch they are standing in before generating a redemption QR.
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query as Record<string, string | undefined>;
    const filter: Record<string, any> = { is_active: true };
    if (q && q.trim()) {
      const rx = new RegExp(escapeRegExp(q.trim()), 'i');
      filter.$or = [{ name: rx }, { city: rx }, { address: rx }];
    }
    const outlets = await Outlet.find(filter).sort({ name: 1 }).limit(50).lean();

    // Attach the owning business name so the customer can recognise the brand.
    const ownerIds = outlets.map((o) => o.owner);
    const owners = ownerIds.length
      ? await User.find({ _id: { $in: ownerIds } }).select('name').lean()
      : [];
    const ownerById = new Map(owners.map((u) => [String(u._id), u]));

    res.json(
      success(
        outlets.map((o) => ({
          ...serializeOutlet(o),
          business: ownerById.get(String(o.owner))?.name || 'Merchant',
        }))
      )
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to search outlets' });
  }
});

/**
 * Public: active outlets for a given advertiser — used by the customer app to
 * pick which branch they are visiting before generating a redemption QR.
 */
router.get('/advertiser/:advertiserId', async (req: Request, res: Response) => {
  try {
    const advertiserId = toObjectId(req.params.advertiserId);
    if (!advertiserId) {
      res.status(400).json({ success: false, message: 'Invalid advertiser id' });
      return;
    }
    const outlets = await Outlet.find({ owner: advertiserId, is_active: true })
      .sort({ name: 1 })
      .lean();
    res.json(success(outlets.map(serializeOutlet)));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch outlets' });
  }
});

/** The signed-in advertiser's own outlets (including inactive ones). */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const outlets = await Outlet.find({ owner: req.user!.userId }).sort({ name: 1 }).lean();
    res.json(success(outlets.map(serializeOutlet)));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch outlets' });
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const normalized = normalizeOutletBody(req.body);
    if (!normalized.name) {
      res.status(400).json({ success: false, message: 'Outlet name is required' });
      return;
    }
    const outlet = await Outlet.create({
      ...normalized,
      owner: new Types.ObjectId(req.user!.userId),
    });
    res.status(201).json(success(serializeOutlet(outlet), 'Outlet created'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to create outlet' });
  }
});

router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Invalid outlet id' });
      return;
    }
    // Scoping the query by owner makes this both the fetch and the authz check.
    const outlet = await Outlet.findOneAndUpdate(
      { _id: id, owner: req.user!.userId },
      { $set: normalizeOutletBody(req.body) },
      { new: true }
    );
    if (!outlet) {
      res.status(404).json({ success: false, message: 'Outlet not found' });
      return;
    }
    res.json(success(serializeOutlet(outlet), 'Outlet updated'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update outlet' });
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Invalid outlet id' });
      return;
    }
    const outlet = await Outlet.findOneAndDelete({ _id: id, owner: req.user!.userId });
    if (!outlet) {
      res.status(404).json({ success: false, message: 'Outlet not found' });
      return;
    }
    res.json(success({ deleted: true }, 'Outlet deleted'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to delete outlet' });
  }
});

export default router;
