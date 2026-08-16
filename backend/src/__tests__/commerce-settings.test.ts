import { PlatformSetting, MerchantVerification, User, UserRole } from '../models';
import { generateToken } from '../middleware/auth';
import {
  computeOrderTotals,
  sanitizeCommerceSettings,
  getCommerceSettings,
  DEFAULT_COMMERCE_SETTINGS,
  COMMERCE_SETTINGS_KEY,
  CommerceSettings,
} from '../utils/commerce-settings';
import { request, connectTestDb, resetTestDb, closeTestDb } from '../test-helpers';

const ADMIN = '/api/v1/admin';
const PRODUCTS = '/api/v1/products';
const ORDERS = '/api/v1/orders';

const incl = (over: Partial<CommerceSettings> = {}): CommerceSettings =>
  sanitizeCommerceSettings({ vat_rate: 0.2, vat_inclusive: true, auto_release_days: 7, payment_ttl_minutes: 60, ...over });

// ---------------------------------------------------------------------------
// VAT math + clamping (unit)
// ---------------------------------------------------------------------------

describe('computeOrderTotals', () => {
  it('adds VAT on top when exclusive', () => {
    expect(computeOrderTotals(10000, incl({ vat_inclusive: false }))).toEqual({ subtotal_minor: 10000, tax_minor: 2000, total_minor: 12000 });
  });
  it('extracts VAT from the price when inclusive', () => {
    expect(computeOrderTotals(12000, incl({ vat_inclusive: true }))).toEqual({ subtotal_minor: 10000, tax_minor: 2000, total_minor: 12000 });
  });
  it('is a no-op when the rate is zero', () => {
    expect(computeOrderTotals(9999, incl({ vat_rate: 0 }))).toEqual({ subtotal_minor: 9999, tax_minor: 0, total_minor: 9999 });
  });
});

describe('sanitizeCommerceSettings', () => {
  it('clamps out-of-range values', () => {
    const s = sanitizeCommerceSettings({ vat_rate: 5, auto_release_days: 999, payment_ttl_minutes: 1 });
    expect(s.vat_rate).toBe(1);
    expect(s.auto_release_days).toBe(90);
    expect(s.payment_ttl_minutes).toBe(5);
  });
  it('coerces vat_inclusive to a boolean', () => {
    expect(sanitizeCommerceSettings({ vat_inclusive: false }).vat_inclusive).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// DB + routes
// ---------------------------------------------------------------------------

let seq = 0;
async function makeUser(role: UserRole = 'end_user') {
  seq += 1;
  const email = `cs-${seq}@example.com`;
  const u = await User.create({ name: `CS ${seq}`, email, password_hash: 'x' });
  if (role !== 'end_user') await User.findByIdAndUpdate(u._id, { role });
  return { id: String(u._id), email, token: generateToken({ userId: String(u._id), email, role }) };
}
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

describe('commerce settings (DB + admin routes)', () => {
  beforeAll(async () => await connectTestDb());
  beforeEach(async () => {
    await resetTestDb();
    seq = 0;
  });
  afterAll(async () => await closeTestDb());

  it('returns defaults when unset and re-sanitises a poisoned store', async () => {
    expect(await getCommerceSettings()).toEqual(DEFAULT_COMMERCE_SETTINGS);
    await PlatformSetting.create({ key: COMMERCE_SETTINGS_KEY, value: { vat_rate: 99, auto_release_days: 9999 } });
    const s = await getCommerceSettings();
    expect(s.vat_rate).toBe(1);
    expect(s.auto_release_days).toBe(90);
  });

  it('admin can read and update; non-admin cannot', async () => {
    const admin = await makeUser('admin');
    const get = await request.get(`${ADMIN}/commerce-settings`).set(auth(admin.token));
    expect(get.status).toBe(200);
    expect(get.body.data.settings).toBeDefined();

    const put = await request.put(`${ADMIN}/commerce-settings`).set(auth(admin.token)).send({ vat_rate: 0.15, vat_inclusive: false });
    expect(put.status).toBe(200);
    expect(put.body.data.settings.vat_rate).toBe(0.15);
    expect(put.body.data.settings.vat_inclusive).toBe(false);

    const consumer = await makeUser('end_user');
    expect((await request.get(`${ADMIN}/commerce-settings`).set(auth(consumer.token))).status).toBe(403);
  });

  it('applies the configured VAT to a new order', async () => {
    const merchant = await makeUser('merchant');
    await MerchantVerification.create({ merchant_id: merchant.id, status: 'verified' });
    const buyer = await makeUser();
    const productId = (await request.post(PRODUCTS).set(auth(merchant.token)).send({ name: 'X', price_minor: 12000 })).body.data.id;

    // Exclusive VAT at 20%: a 12000 item → 12000 + 2400 = 14400 total.
    await PlatformSetting.create({ key: COMMERCE_SETTINGS_KEY, value: { vat_rate: 0.2, vat_inclusive: false } });
    const order = (await request.post(ORDERS).set(auth(buyer.token)).send({ items: [{ product_id: productId, quantity: 1 }] })).body.data.orders[0];
    expect(order.subtotal_minor).toBe(12000);
    expect(order.tax_minor).toBe(2400);
    expect(order.total_minor).toBe(14400);
  });
});
