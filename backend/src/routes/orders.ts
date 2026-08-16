import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import {
  Order,
  Product,
  Payment,
  Notification,
  IOrder,
  OrderStatus,
  ORDER_STATUSES,
  OrderActor,
  canTransition,
  shouldRefund,
} from '../models';
import { authMiddleware } from '../middleware/auth';
import { paymentsEnabled } from '../services/payment.service';
import { createCharge, refundPayment, restoreStock, reserveStock } from '../utils/payment-flow';
import { getCommerceSettings, computeOrderTotals } from '../utils/commerce-settings';
import { success, paginated } from '../utils/response';

/**
 * The buyer-protection marketplace order flow (Phase 5). Money is held in escrow
 * (with the PSP) from `paid` until the buyer confirms receipt or an auto-release
 * timer elapses, or a dispute is resolved. Every state change is validated
 * against the 12-state machine (utils/order-state.ts), applied atomically, and
 * appended to the order history.
 */
const router = Router();

function serialize(o: Record<string, any>) {
  return {
    id: String(o._id),
    buyer_id: String(o.buyer_id),
    merchant_id: String(o.merchant_id),
    items: (o.items || []).map((i: any) => ({
      product_id: String(i.product_id),
      name: i.name,
      unit_price_minor: i.unit_price_minor,
      quantity: i.quantity,
    })),
    subtotal_minor: o.subtotal_minor,
    tax_minor: o.tax_minor ?? 0,
    total_minor: o.total_minor,
    currency: o.currency,
    status: o.status,
    contact: o.contact,
    history: o.history || [],
    dispute: o.dispute,
    auto_release_at: o.auto_release_at,
    created_at: o.created_at,
  };
}

/** How the caller relates to this order (drives which transitions they may make). */
function actorFor(order: IOrder, userId: string, role: string): OrderActor | null {
  if (role === 'admin') return 'admin';
  if (String(order.buyer_id) === userId) return 'buyer';
  if (String(order.merchant_id) === userId) return 'merchant';
  return null;
}

/**
 * Apply a validated transition atomically. The `{status: from}` precondition on
 * the update is the concurrency guard — only one actor can move the order out of
 * a given state. Refund side effects run after the state is claimed.
 */
async function doTransition(
  order: IOrder,
  to: OrderStatus,
  actor: OrderActor,
  byId: string | undefined,
  extra?: { note?: string; set?: Record<string, unknown> }
): Promise<{ ok: boolean; code: number; message?: string; order?: IOrder }> {
  const from = order.status;
  if (!canTransition(from, to, actor)) {
    return { ok: false, code: 409, message: `Cannot move an order from ${from} to ${to}` };
  }

  const set: Record<string, unknown> = { status: to, ...(extra?.set || {}) };
  if (to === 'delivered') {
    const { auto_release_days } = await getCommerceSettings();
    set.auto_release_at = new Date(Date.now() + auto_release_days * 86400000);
  }

  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: from },
    {
      $set: set,
      $push: { history: { status: to, actor, by: byId ? new Types.ObjectId(byId) : undefined, note: extra?.note, at: new Date() } },
    },
    { new: true }
  );
  if (!updated) return { ok: false, code: 409, message: 'The order changed — please refresh and retry' };

  // Reserve stock when an order becomes paid (covers the dev/test auto-pay path;
  // the real payment path reserves in applyPaymentEffect). The atomic move above
  // guarantees this runs once per order.
  if (to === 'paid') await reserveStock(updated.items);

  // Cancelling/refunding a post-paid order releases the reserved stock (always)
  // and refunds the held funds (when a real payment backed it).
  if (shouldRefund(from, to)) {
    await restoreStock(updated.items);
    if (updated.payment_id) {
      const payment = await Payment.findById(updated.payment_id);
      if (payment && payment.status === 'paid') {
        await refundPayment(payment);
        await Order.updateOne({ _id: updated._id }, { $set: { refund_reference: payment.reference } });
      }
    }
  }

  return { ok: true, code: 200, order: updated };
}

async function notify(userId: Types.ObjectId, title: string, message: string) {
  await Notification.create({ user_id: userId, type: 'reward', title, message }).catch(() => {});
}

// --- Create + read ---------------------------------------------------------

/** POST /orders — place an order for one merchant's products. */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const raw = Array.isArray(req.body?.items) ? req.body.items : [];
    if (raw.length === 0) {
      res.status(400).json({ success: false, message: 'An order needs at least one item' });
      return;
    }

    // Resolve products, enforce a single merchant per order, snapshot prices.
    const wanted = raw
      .map((i: any) => ({ product_id: String(i.product_id), quantity: Math.max(1, Math.floor(Number(i.quantity) || 1)) }))
      .filter((i: any) => Types.ObjectId.isValid(i.product_id));
    const products = await Product.find({ _id: { $in: wanted.map((w: any) => w.product_id) }, is_active: true });
    const byId = new Map(products.map((p) => [String(p._id), p]));

    let merchantId: string | null = null;
    const items = [];
    let subtotal = 0;
    for (const w of wanted) {
      const p = byId.get(w.product_id);
      if (!p) {
        res.status(400).json({ success: false, message: 'A product is unavailable' });
        return;
      }
      if (merchantId && merchantId !== String(p.merchant_id)) {
        res.status(400).json({ success: false, message: 'All items must be from the same merchant' });
        return;
      }
      merchantId = String(p.merchant_id);
      if (p.stock != null && p.stock < w.quantity) {
        res.status(409).json({ success: false, message: `Not enough stock for ${p.name}` });
        return;
      }
      items.push({ product_id: p._id, name: p.name, unit_price_minor: p.price_minor, quantity: w.quantity });
      subtotal += p.price_minor * w.quantity;
    }

    if (!merchantId || items.length === 0) {
      res.status(400).json({ success: false, message: 'No valid products in the order' });
      return;
    }
    if (merchantId === req.user!.userId) {
      res.status(400).json({ success: false, message: 'You cannot order your own products' });
      return;
    }

    // Apply the configured VAT (admin/env-driven, see utils/commerce-settings).
    const settings = await getCommerceSettings();
    const totals = computeOrderTotals(subtotal, settings);

    const contact = req.body?.contact || {};
    const order = await Order.create({
      buyer_id: req.user!.userId,
      merchant_id: merchantId,
      items,
      subtotal_minor: totals.subtotal_minor,
      tax_minor: totals.tax_minor,
      total_minor: totals.total_minor,
      currency: products[0]?.currency || 'GHS',
      status: 'created',
      contact: {
        name: String(contact.name ?? '').trim(),
        phone: String(contact.phone ?? '').trim(),
        address: String(contact.address ?? '').trim(),
        city: String(contact.city ?? '').trim(),
      },
      history: [{ status: 'created', actor: 'buyer', by: req.user!.userId, at: new Date() }],
    });

    res.status(201).json(success(serialize(order.toObject()), 'Order placed'));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /orders?role=buyer|merchant|admin&status= — the caller's orders.
 * `role=admin` (admins only) lists across all orders, optionally by status —
 * the dispute console uses `role=admin&status=disputed`.
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const filter: Record<string, unknown> = {};
    if (req.query.role === 'admin' && req.user!.role === 'admin') {
      // whole-platform view
    } else if (req.query.role === 'merchant') {
      filter.merchant_id = req.user!.userId;
    } else {
      filter.buyer_id = req.user!.userId;
    }
    if (typeof req.query.status === 'string' && ORDER_STATUSES.includes(req.query.status as OrderStatus)) {
      filter.status = req.query.status;
    }
    const [rows, total] = await Promise.all([
      Order.find(filter).sort({ created_at: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);
    res.json(paginated(rows.map(serialize), total, page, limit));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** GET /orders/:id — a single order (buyer, its merchant, or admin). */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order || !actorFor(order, req.user!.userId, req.user!.role)) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }
    res.json(success(serialize(order.toObject())));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- Payment ---------------------------------------------------------------

/** POST /orders/:id/pay — start payment for a created order (buyer). */
router.post('/:id/pay', authMiddleware, async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order || String(order.buyer_id) !== req.user!.userId) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }
    if (order.status !== 'created') {
      res.status(409).json({ success: false, message: `Order is ${order.status}` });
      return;
    }

    if (paymentsEnabled()) {
      const moved = await doTransition(order, 'payment_pending', 'buyer', req.user!.userId);
      if (!moved.ok) {
        res.status(moved.code).json({ success: false, message: moved.message });
        return;
      }
      try {
        const { authorization_url, reference } = await createCharge({
          userId: req.user!.userId,
          email: req.user!.email,
          purpose: 'order_payment',
          amount_minor: order.total_minor,
          metadata: { order_id: String(order._id) },
        });
        res.json(success({ requires_payment: true, authorization_url, reference }));
      } catch {
        // Roll the order back so the buyer can retry.
        await Order.updateOne({ _id: order._id, status: 'payment_pending' }, { $set: { status: 'created' } });
        res.status(502).json({ success: false, message: 'Could not start the payment. Please try again.' });
      }
      return;
    }

    if (process.env.NODE_ENV === 'production') {
      res.status(503).json({ success: false, message: 'Payments are not available yet' });
      return;
    }
    // Dev/test: no PSP, so simulate an instant successful payment.
    await doTransition(order, 'payment_pending', 'buyer', req.user!.userId);
    const paid = await Order.findById(order._id);
    await doTransition(paid!, 'paid', 'system', undefined, { note: 'Dev auto-pay' });
    res.json(success({ requires_payment: false, status: 'paid' }));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- Lifecycle actions -----------------------------------------------------

/** Wire a simple action endpoint that transitions to `to` for the given actors. */
function action(path: string, to: OrderStatus, allow: OrderActor[]) {
  router.post(`/:id/${path}`, authMiddleware, async (req: Request, res: Response) => {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
      }
      const actor = actorFor(order, req.user!.userId, req.user!.role);
      if (!actor || !allow.includes(actor)) {
        res.status(403).json({ success: false, message: 'Not permitted' });
        return;
      }
      const result = await doTransition(order, to, actor, req.user!.userId, { note: req.body?.note });
      if (!result.ok) {
        res.status(result.code).json({ success: false, message: result.message });
        return;
      }
      // Notify the counterpart.
      const counterpart = actor === 'buyer' ? result.order!.merchant_id : result.order!.buyer_id;
      await notify(counterpart, 'Order update', `An order is now ${to}.`);
      res.json(success(serialize(result.order!.toObject()), `Order ${to}`));
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
}

action('accept', 'accepted', ['merchant', 'admin']);
action('prepare', 'preparing', ['merchant', 'admin']);
action('ship', 'shipped', ['merchant', 'admin']);
action('deliver', 'delivered', ['merchant', 'admin', 'buyer']);
action('confirm', 'completed', ['buyer', 'admin']); // buyer confirms receipt → release
action('cancel', 'cancelled', ['buyer', 'merchant', 'admin']);

/** POST /orders/:id/dispute — the buyer raises a dispute with evidence. */
router.post('/:id/dispute', authMiddleware, async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order || String(order.buyer_id) !== req.user!.userId) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }
    const dispute = {
      reason: String(req.body?.reason ?? '').trim() || 'unspecified',
      detail: String(req.body?.detail ?? '').trim(),
      // Only keep http(s) evidence URLs — a javascript:/data: link would be an
      // XSS vector when a reviewer opens it.
      evidence: (Array.isArray(req.body?.evidence) ? req.body.evidence : [])
        .slice(0, 8)
        .map(String)
        .filter((u: string) => /^https?:\/\//i.test(u.trim())),
      opened_at: new Date(),
      opened_by: new Types.ObjectId(req.user!.userId),
    };
    const result = await doTransition(order, 'disputed', 'buyer', req.user!.userId, {
      note: dispute.reason,
      set: { dispute },
    });
    if (!result.ok) {
      res.status(result.code).json({ success: false, message: result.message });
      return;
    }
    await notify(result.order!.merchant_id, 'Order disputed', 'A buyer opened a dispute on an order.');
    res.json(success(serialize(result.order!.toObject()), 'Dispute opened'));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** POST /orders/:id/resolve — an admin resolves a dispute (refund or release). */
router.post('/:id/resolve', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Admin only' });
      return;
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }
    const resolution = req.body?.resolution === 'refunded' ? 'refunded' : req.body?.resolution === 'released' ? 'released' : null;
    if (!resolution) {
      res.status(400).json({ success: false, message: "resolution must be 'refunded' or 'released'" });
      return;
    }
    const to: OrderStatus = resolution === 'refunded' ? 'refunded' : 'completed';
    const result = await doTransition(order, to, 'admin', req.user!.userId, {
      note: `dispute ${resolution}`,
      set: {
        'dispute.resolution': resolution,
        'dispute.resolution_note': String(req.body?.note ?? '').trim(),
        'dispute.resolved_at': new Date(),
        'dispute.resolved_by': new Types.ObjectId(req.user!.userId),
      },
    });
    if (!result.ok) {
      res.status(result.code).json({ success: false, message: result.message });
      return;
    }
    await notify(result.order!.buyer_id, 'Dispute resolved', `Your dispute was ${resolution === 'refunded' ? 'refunded' : 'closed'}.`);
    await notify(result.order!.merchant_id, 'Dispute resolved', `A dispute was ${resolution === 'refunded' ? 'refunded to the buyer' : 'resolved in your favour'}.`);
    res.json(success(serialize(result.order!.toObject()), `Dispute ${resolution}`));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
