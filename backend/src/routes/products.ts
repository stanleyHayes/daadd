import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { Product, MerchantVerification, UserRole } from '../models';
import { authMiddleware } from '../middleware/auth';
import { merchantGate } from '../utils/merchant-gate';
import { success, paginated } from '../utils/response';

/**
 * Merchant products (Phase 5). Only a verified merchant may sell — the same gate
 * as redemption/voucher settlement. Prices are integer minor units (pesewas).
 */
const router = Router();

function serialize(p: Record<string, any>) {
  return {
    id: String(p._id),
    merchant_id: String(p.merchant_id),
    name: p.name,
    description: p.description,
    category: p.category,
    price_minor: p.price_minor,
    currency: p.currency,
    images: p.images || [],
    stock: p.stock,
    is_active: p.is_active,
    created_at: p.created_at,
  };
}

async function requireVerifiedMerchant(userId: string, role: string): Promise<string | null> {
  const verification = await MerchantVerification.findOne({ merchant_id: userId }).select('status').lean();
  const gate = merchantGate({ role: role as UserRole, status: verification?.status ?? null });
  return gate.can_transact ? null : gate.reason || 'Merchant verification required';
}

/** GET /products — public catalogue of active products. */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const filter: Record<string, unknown> = { is_active: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.merchant_id && Types.ObjectId.isValid(String(req.query.merchant_id))) {
      filter.merchant_id = new Types.ObjectId(String(req.query.merchant_id));
    }
    const [rows, total] = await Promise.all([
      Product.find(filter).sort({ created_at: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);
    res.json(paginated(rows.map(serialize), total, page, limit));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** GET /products/mine — the caller merchant's own products (any status). */
router.get('/mine', authMiddleware, async (req: Request, res: Response) => {
  try {
    const rows = await Product.find({ merchant_id: req.user!.userId }).sort({ created_at: -1 }).lean();
    res.json(success(rows.map(serialize)));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** GET /products/:id — a single product. */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    const product = await Product.findById(id).lean();
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.json(success(serialize(product)));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** POST /products — create (verified merchant only). */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const reason = await requireVerifiedMerchant(req.user!.userId, req.user!.role);
    if (reason) {
      res.status(403).json({ success: false, message: reason });
      return;
    }
    const b = req.body || {};
    const price_minor = Math.floor(Number(b.price_minor));
    if (!b.name || !Number.isFinite(price_minor) || price_minor < 0) {
      res.status(400).json({ success: false, message: 'name and a non-negative price_minor are required' });
      return;
    }
    const product = await Product.create({
      merchant_id: req.user!.userId,
      name: String(b.name).trim(),
      description: String(b.description ?? '').trim(),
      category: String(b.category ?? '').trim(),
      price_minor,
      currency: b.currency || 'GHS',
      images: Array.isArray(b.images) ? b.images.slice(0, 8).map(String) : [],
      stock: b.stock != null ? Math.max(0, Math.floor(Number(b.stock))) : undefined,
      is_active: b.is_active !== false,
    });
    res.status(201).json(success(serialize(product.toObject()), 'Product created'));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** PATCH /products/:id — update (owning merchant only). */
router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || String(product.merchant_id) !== req.user!.userId) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    const b = req.body || {};
    if (b.name != null) product.name = String(b.name).trim();
    if (b.description != null) product.description = String(b.description).trim();
    if (b.category != null) product.category = String(b.category).trim();
    if (b.price_minor != null) {
      const p = Math.floor(Number(b.price_minor));
      if (Number.isFinite(p) && p >= 0) product.price_minor = p;
    }
    if (Array.isArray(b.images)) product.images = b.images.slice(0, 8).map(String);
    if (b.stock !== undefined) product.stock = b.stock == null ? undefined : Math.max(0, Math.floor(Number(b.stock)));
    if (b.is_active != null) product.is_active = !!b.is_active;
    await product.save();
    res.json(success(serialize(product.toObject()), 'Product updated'));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** DELETE /products/:id — soft delete (owning merchant only). */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || String(product.merchant_id) !== req.user!.userId) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    product.is_active = false;
    await product.save();
    res.json(success({ id: String(product._id) }, 'Product removed'));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
