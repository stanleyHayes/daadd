import { Types } from 'mongoose';
import { Order, Payment, Product, User, MerchantVerification, UserRole } from '../models';
import { canTransition, allowedTransitions, isTerminal, shouldRefund } from '../utils/order-state';
import { autoReleaseOrders, expireStaleOrders } from '../utils/order-sweep';
import { generateToken } from '../middleware/auth';
import { request, connectTestDb, resetTestDb, closeTestDb } from '../test-helpers';

const PRODUCTS = '/api/v1/products';
const ORDERS = '/api/v1/orders';

const ORIGINAL_ENV = { ...process.env };
beforeAll(() => {
  // Ensure the dev auto-pay path (no PSP configured) for lifecycle tests.
  delete process.env.PAYSTACK_SECRET_KEY;
  process.env.PAYMENTS_ENABLED = 'false';
});
afterAll(() => {
  process.env = ORIGINAL_ENV;
});

let seq = 0;
async function makeUser(role: UserRole = 'end_user') {
  seq += 1;
  const email = `ord-${seq}@example.com`;
  const u = await User.create({ name: `Ord ${seq}`, email, password_hash: 'x' });
  if (role !== 'end_user') await User.findByIdAndUpdate(u._id, { role });
  return { id: String(u._id), email, token: generateToken({ userId: String(u._id), email, role }) };
}
async function verifiedMerchant() {
  const m = await makeUser('merchant');
  await MerchantVerification.create({ merchant_id: m.id, status: 'verified' });
  return m;
}
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

// ---------------------------------------------------------------------------
// State machine (unit)
// ---------------------------------------------------------------------------

describe('order state machine', () => {
  it('allows the happy path and forbids illegal jumps', () => {
    expect(canTransition('created', 'payment_pending', 'buyer')).toBe(true);
    expect(canTransition('payment_pending', 'paid', 'system')).toBe(true);
    expect(canTransition('paid', 'accepted', 'merchant')).toBe(true);
    expect(canTransition('delivered', 'completed', 'buyer')).toBe(true);
    // illegal / wrong-actor
    expect(canTransition('paid', 'accepted', 'buyer')).toBe(false);
    expect(canTransition('created', 'completed', 'buyer')).toBe(false);
    expect(canTransition('delivered', 'completed', 'merchant')).toBe(false);
    expect(canTransition('completed', 'refunded', 'admin')).toBe(false); // terminal
  });

  it('knows terminal states and refund-triggering transitions', () => {
    expect(isTerminal('completed')).toBe(true);
    expect(isTerminal('paid')).toBe(false);
    expect(shouldRefund('paid', 'cancelled')).toBe(true);
    expect(shouldRefund('disputed', 'refunded')).toBe(true);
    expect(shouldRefund('created', 'cancelled')).toBe(false); // never paid
    expect(shouldRefund('delivered', 'completed')).toBe(false); // release, not refund
    expect(allowedTransitions('disputed', 'admin').sort()).toEqual(['completed', 'refunded']);
  });
});

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

describe('products', () => {
  beforeAll(async () => await connectTestDb());
  beforeEach(async () => {
    await resetTestDb();
    seq = 0;
  });
  afterAll(async () => await closeTestDb());

  it('lets a verified merchant create a product and lists it publicly', async () => {
    const merchant = await verifiedMerchant();
    const res = await request.post(PRODUCTS).set(auth(merchant.token)).send({ name: 'Kente Cloth', price_minor: 15000, category: 'fashion' });
    expect(res.status).toBe(201);
    expect(res.body.data.price_minor).toBe(15000);

    const list = await request.get(PRODUCTS);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
  });

  it('refuses an unverified merchant', async () => {
    const merchant = await makeUser('merchant'); // no verification
    expect((await request.post(PRODUCTS).set(auth(merchant.token)).send({ name: 'X', price_minor: 100 })).status).toBe(403);
  });

  it('only the owner can edit or delete', async () => {
    const m1 = await verifiedMerchant();
    const m2 = await verifiedMerchant();
    const p = await request.post(PRODUCTS).set(auth(m1.token)).send({ name: 'P', price_minor: 100 });
    const id = p.body.data.id;
    expect((await request.patch(`${PRODUCTS}/${id}`).set(auth(m2.token)).send({ name: 'Hacked' })).status).toBe(404);
    expect((await request.delete(`${PRODUCTS}/${id}`).set(auth(m1.token))).status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Order lifecycle
// ---------------------------------------------------------------------------

describe('order lifecycle', () => {
  beforeAll(async () => await connectTestDb());
  beforeEach(async () => {
    await resetTestDb();
    seq = 0;
  });
  afterAll(async () => await closeTestDb());

  async function seedProduct(merchant: { token: string }, over: Record<string, unknown> = {}) {
    const res = await request.post(PRODUCTS).set(auth(merchant.token)).send({ name: 'Item', price_minor: 10000, ...over });
    return res.body.data.id as string;
  }

  it('places an order, snapshots price, and blocks ordering your own products', async () => {
    const merchant = await verifiedMerchant();
    const buyer = await makeUser();
    const productId = await seedProduct(merchant);

    const res = await request.post(ORDERS).set(auth(buyer.token)).send({ items: [{ product_id: productId, quantity: 2 }] });
    expect(res.status).toBe(201);
    expect(res.body.data.total_minor).toBe(20000);
    expect(res.body.data.status).toBe('created');

    // The merchant cannot buy their own product.
    expect((await request.post(ORDERS).set(auth(merchant.token)).send({ items: [{ product_id: productId, quantity: 1 }] })).status).toBe(400);
  });

  it('runs the full happy path to completed (buyer confirms)', async () => {
    const merchant = await verifiedMerchant();
    const buyer = await makeUser();
    const productId = await seedProduct(merchant);
    const order = (await request.post(ORDERS).set(auth(buyer.token)).send({ items: [{ product_id: productId, quantity: 1 }] })).body.data;

    // Dev auto-pay (no PSP) → paid.
    const pay = await request.post(`${ORDERS}/${order.id}/pay`).set(auth(buyer.token));
    expect(pay.body.data.status).toBe('paid');

    const step = async (path: string, token: string, expected: string) => {
      const r = await request.post(`${ORDERS}/${order.id}/${path}`).set(auth(token));
      expect(r.status).toBe(200);
      expect(r.body.data.status).toBe(expected);
    };
    await step('accept', merchant.token, 'accepted');
    await step('prepare', merchant.token, 'preparing');
    await step('ship', merchant.token, 'shipped');
    await step('deliver', merchant.token, 'delivered');
    await step('confirm', buyer.token, 'completed');

    const finalOrder = await Order.findById(order.id).lean();
    expect(finalOrder!.status).toBe('completed');
    expect(finalOrder!.history.map((h) => h.status)).toEqual(
      expect.arrayContaining(['created', 'payment_pending', 'paid', 'accepted', 'preparing', 'shipped', 'delivered', 'completed'])
    );
  });

  it('rejects wrong-actor and out-of-order transitions', async () => {
    const merchant = await verifiedMerchant();
    const buyer = await makeUser();
    const productId = await seedProduct(merchant);
    const order = (await request.post(ORDERS).set(auth(buyer.token)).send({ items: [{ product_id: productId, quantity: 1 }] })).body.data;
    await request.post(`${ORDERS}/${order.id}/pay`).set(auth(buyer.token));

    // Buyer cannot accept; merchant cannot confirm; cannot ship before preparing.
    expect((await request.post(`${ORDERS}/${order.id}/accept`).set(auth(buyer.token))).status).toBe(403);
    expect((await request.post(`${ORDERS}/${order.id}/confirm`).set(auth(merchant.token))).status).toBe(403);
    expect((await request.post(`${ORDERS}/${order.id}/ship`).set(auth(merchant.token))).status).toBe(409);
    // A stranger can't even see it.
    const stranger = await makeUser();
    expect((await request.get(`${ORDERS}/${order.id}`).set(auth(stranger.token))).status).toBe(404);
  });

  it('refunds the buyer when a paid order is cancelled', async () => {
    const merchant = await verifiedMerchant();
    const buyer = await makeUser();
    // Seed a paid order backed by a paid Payment.
    const payment = await Payment.create({
      user_id: buyer.id,
      provider: 'paystack',
      reference: 'ref-cancel-1',
      amount_minor: 10000,
      currency: 'GHS',
      status: 'paid',
      purpose: 'order_payment',
    });
    const order = await Order.create({
      buyer_id: buyer.id,
      merchant_id: merchant.id,
      items: [{ product_id: new Types.ObjectId(), name: 'X', unit_price_minor: 10000, quantity: 1 }],
      subtotal_minor: 10000,
      total_minor: 10000,
      status: 'paid',
      payment_id: payment._id,
      history: [{ status: 'paid', actor: 'system', at: new Date() }],
    });

    const res = await request.post(`${ORDERS}/${order._id}/cancel`).set(auth(merchant.token));
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('cancelled');
    expect((await Payment.findById(payment._id).lean())!.status).toBe('refunded');
    expect((await Order.findById(order._id).lean())!.refund_reference).toBe('ref-cancel-1');
  });

  it('handles a dispute and an admin resolution (refund)', async () => {
    const merchant = await verifiedMerchant();
    const buyer = await makeUser();
    const admin = await makeUser('admin');
    const payment = await Payment.create({
      user_id: buyer.id, provider: 'paystack', reference: 'ref-dispute-1',
      amount_minor: 10000, currency: 'GHS', status: 'paid', purpose: 'order_payment',
    });
    const order = await Order.create({
      buyer_id: buyer.id, merchant_id: merchant.id,
      items: [{ product_id: new Types.ObjectId(), name: 'X', unit_price_minor: 10000, quantity: 1 }],
      subtotal_minor: 10000, total_minor: 10000, status: 'delivered', payment_id: payment._id,
      history: [{ status: 'delivered', actor: 'merchant', at: new Date() }],
    });

    const dispute = await request.post(`${ORDERS}/${order._id}/dispute`).set(auth(buyer.token)).send({ reason: 'not_as_described', detail: 'wrong item', evidence: ['http://x/img.jpg'] });
    expect(dispute.status).toBe(200);
    expect(dispute.body.data.status).toBe('disputed');
    expect(dispute.body.data.dispute.evidence).toHaveLength(1);

    // Only an admin resolves.
    expect((await request.post(`${ORDERS}/${order._id}/resolve`).set(auth(merchant.token)).send({ resolution: 'refunded' })).status).toBe(403);

    const resolve = await request.post(`${ORDERS}/${order._id}/resolve`).set(auth(admin.token)).send({ resolution: 'refunded', note: 'buyer is right' });
    expect(resolve.status).toBe(200);
    expect(resolve.body.data.status).toBe('refunded');
    expect((await Payment.findById(payment._id).lean())!.status).toBe('refunded');
  });

  it('reserves stock on payment and restores it on cancel', async () => {
    const merchant = await verifiedMerchant();
    const buyer = await makeUser();
    const productId = (await request.post(PRODUCTS).set(auth(merchant.token)).send({ name: 'Stocked', price_minor: 10000, stock: 5 })).body.data.id;

    const order = (await request.post(ORDERS).set(auth(buyer.token)).send({ items: [{ product_id: productId, quantity: 2 }] })).body.data;
    await request.post(`${ORDERS}/${order.id}/pay`).set(auth(buyer.token)); // dev auto-pay → paid
    expect((await Product.findById(productId).lean())!.stock).toBe(3); // 5 - 2 reserved

    await request.post(`${ORDERS}/${order.id}/cancel`).set(auth(merchant.token));
    expect((await Product.findById(productId).lean())!.stock).toBe(5); // restored
  });

  it('expires orders that were never paid', async () => {
    const merchant = await verifiedMerchant();
    const buyer = await makeUser();
    const productId = (await request.post(PRODUCTS).set(auth(merchant.token)).send({ name: 'X', price_minor: 100 })).body.data.id;
    const order = await Order.create({
      buyer_id: buyer.id, merchant_id: merchant.id,
      items: [{ product_id: productId, name: 'X', unit_price_minor: 100, quantity: 1 }],
      subtotal_minor: 100, total_minor: 100, status: 'created',
      history: [{ status: 'created', actor: 'buyer', at: new Date() }],
    });
    // timestamps override created_at on create, so backdate via the raw driver (2h ago; TTL is 60m).
    await Order.collection.updateOne({ _id: order._id }, { $set: { created_at: new Date(Date.now() - 2 * 3600 * 1000) } });

    const n = await expireStaleOrders();
    expect(n).toBe(1);
    expect((await Order.findById(order._id).lean())!.status).toBe('expired');
    expect(await expireStaleOrders()).toBe(0); // idempotent
  });

  it('drops non-http evidence URLs from a dispute (XSS guard)', async () => {
    const merchant = await verifiedMerchant();
    const buyer = await makeUser();
    const order = await Order.create({
      buyer_id: buyer.id, merchant_id: merchant.id,
      items: [{ product_id: new Types.ObjectId(), name: 'X', unit_price_minor: 100, quantity: 1 }],
      subtotal_minor: 100, total_minor: 100, status: 'delivered',
      history: [{ status: 'delivered', actor: 'merchant', at: new Date() }],
    });
    const res = await request.post(`${ORDERS}/${order._id}/dispute`).set(auth(buyer.token)).send({
      reason: 'bad',
      evidence: ['https://ok.example/img.jpg', 'javascript:alert(1)', 'data:text/html,x'],
    });
    expect(res.status).toBe(200);
    expect(res.body.data.dispute.evidence).toEqual(['https://ok.example/img.jpg']);
  });

  it('auto-releases a delivered order past its window', async () => {
    const merchant = await verifiedMerchant();
    const buyer = await makeUser();
    const order = await Order.create({
      buyer_id: buyer.id, merchant_id: merchant.id,
      items: [{ product_id: new Types.ObjectId(), name: 'X', unit_price_minor: 10000, quantity: 1 }],
      subtotal_minor: 10000, total_minor: 10000, status: 'delivered',
      auto_release_at: new Date(Date.now() - 1000),
      history: [{ status: 'delivered', actor: 'merchant', at: new Date() }],
    });

    const n = await autoReleaseOrders();
    expect(n).toBe(1);
    expect((await Order.findById(order._id).lean())!.status).toBe('completed');
    // Idempotent.
    expect(await autoReleaseOrders()).toBe(0);
  });
});
