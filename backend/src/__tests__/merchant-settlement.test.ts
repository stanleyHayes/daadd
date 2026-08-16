jest.mock('axios');
import axios from 'axios';
import { Types } from 'mongoose';

import { MerchantVerification, Order, User, UserRole } from '../models';
import { generateToken } from '../middleware/auth';
import { request, connectTestDb, resetTestDb, closeTestDb } from '../test-helpers';

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MERCHANTS = '/api/v1/merchants';
const PRODUCTS = '/api/v1/products';
const ORDERS = '/api/v1/orders';
const SECRET = 'sk_test_settlement';

const ORIGINAL_ENV = { ...process.env };
beforeAll(() => {
  process.env.PAYSTACK_SECRET_KEY = SECRET;
  process.env.PAYSTACK_BASE_URL = 'https://api.paystack.test';
  process.env.PLATFORM_FEE_PERCENT = '5';
  delete process.env.PAYMENTS_ENABLED;
});
afterAll(() => {
  process.env = ORIGINAL_ENV;
});
beforeEach(() => {
  jest.clearAllMocks();
  mockedAxios.get.mockImplementation((url: string) => {
    if (url.includes('/bank/resolve')) return Promise.resolve({ data: { data: { account_number: '0123456789', account_name: 'Ama Owusu' } } }) as any;
    if (url.includes('/bank')) return Promise.resolve({ data: { data: [{ name: 'Test Bank', code: '001', type: 'ghipss' }, { name: 'MTN MoMo', code: 'MTN', type: 'mobile_money' }] } }) as any;
    return Promise.resolve({ data: { data: { status: 'success', amount: 0, currency: 'GHS' } } }) as any;
  });
  mockedAxios.post.mockImplementation((url: string, body: any) => {
    if (url.includes('/subaccount')) return Promise.resolve({ data: { data: { subaccount_code: 'ACCT_test123', account_name: 'Ama Owusu' } } }) as any;
    if (url.includes('/transferrecipient')) return Promise.resolve({ data: { data: { recipient_code: 'RCP_test123' } } }) as any;
    if (url.includes('/transfer')) return Promise.resolve({ data: { data: { status: 'success', transfer_code: 'TRF_test' } } }) as any;
    if (url.includes('/transaction/initialize')) return Promise.resolve({ data: { data: { authorization_url: 'https://checkout.paystack.test/x', reference: body.reference } } }) as any;
    return Promise.resolve({ data: { data: {} } }) as any;
  });
});

let seq = 0;
async function makeUser(role: UserRole = 'end_user') {
  seq += 1;
  const email = `set-${seq}@example.com`;
  const u = await User.create({ name: `Set ${seq}`, email, password_hash: 'x' });
  if (role !== 'end_user') await User.findByIdAndUpdate(u._id, { role });
  return { id: String(u._id), email, token: generateToken({ userId: String(u._id), email, role }) };
}
async function verifiedMerchant() {
  const m = await makeUser('merchant');
  await MerchantVerification.create({ merchant_id: m.id, status: 'verified', business_name: 'Kejetia Foods' });
  return m;
}
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
const transferCalls = () => mockedAxios.post.mock.calls.filter((c) => String(c[0]).includes('/transfer') && !String(c[0]).includes('/transferrecipient'));

// ---------------------------------------------------------------------------
// Split mode
// ---------------------------------------------------------------------------

describe('settlement — split mode (subaccount)', () => {
  beforeAll(async () => {
    process.env.SETTLEMENT_MODE = 'split';
    await connectTestDb();
  });
  beforeEach(async () => {
    await resetTestDb();
    seq = 0;
  });
  afterAll(async () => await closeTestDb());

  it('lists banks and resolves an account name', async () => {
    const merchant = await verifiedMerchant();
    const banks = await request.get(`${MERCHANTS}/settlement/banks`).set(auth(merchant.token));
    expect(banks.status).toBe(200);
    expect(banks.body.data[0]).toMatchObject({ name: 'Test Bank', code: '001' });
    const resolve = await request.post(`${MERCHANTS}/settlement/resolve`).set(auth(merchant.token)).send({ account_number: '0123456789', bank_code: '001' });
    expect(resolve.body.data.account_name).toBe('Ama Owusu');
  });

  it('connects a subaccount, storing the code + masked account only', async () => {
    const merchant = await verifiedMerchant();
    const res = await request.post(`${MERCHANTS}/settlement/connect`).set(auth(merchant.token)).send({ account_number: '0123456789', bank_code: '001' });
    expect(res.status).toBe(200);
    expect(res.body.data.settlement_connected).toBe(true);
    const stored: any = await MerchantVerification.findOne({ merchant_id: merchant.id }).lean();
    expect(stored.subaccount_code).toBe('ACCT_test123');
    expect(stored.settlement_account_last4).toBe('6789');
    expect(JSON.stringify(stored)).not.toContain('0123456789');
    const subCall = mockedAxios.post.mock.calls.find((c) => String(c[0]).includes('/subaccount'));
    expect(subCall![1]).toMatchObject({ percentage_charge: 5, settlement_bank: '001' });
  });

  it('non-merchants cannot connect', async () => {
    const consumer = await makeUser('end_user');
    expect((await request.post(`${MERCHANTS}/settlement/connect`).set(auth(consumer.token)).send({ account_number: '1', bank_code: '1' })).status).toBe(403);
  });

  it('splits an order charge to the connected merchant subaccount', async () => {
    const merchant = await verifiedMerchant();
    await request.post(`${MERCHANTS}/settlement/connect`).set(auth(merchant.token)).send({ account_number: '0123456789', bank_code: '001' });
    const buyer = await makeUser();
    const productId = (await request.post(PRODUCTS).set(auth(merchant.token)).send({ name: 'Item', price_minor: 10000 })).body.data.id;
    const order = (await request.post(ORDERS).set(auth(buyer.token)).send({ items: [{ product_id: productId, quantity: 1 }] })).body.data.orders[0];
    const pay = await request.post(`${ORDERS}/${order.id}/pay`).set(auth(buyer.token));
    expect(pay.status).toBe(200);
    const initCall = mockedAxios.post.mock.calls.find((c) => String(c[0]).includes('/transaction/initialize'));
    expect(initCall![1]).toMatchObject({ subaccount: 'ACCT_test123' });
  });
});

// ---------------------------------------------------------------------------
// Escrow mode
// ---------------------------------------------------------------------------

describe('settlement — escrow mode (hold + transfer on completion)', () => {
  beforeAll(async () => {
    process.env.SETTLEMENT_MODE = 'escrow';
    await connectTestDb();
  });
  beforeEach(async () => {
    await resetTestDb();
    seq = 0;
  });
  afterAll(async () => {
    await closeTestDb();
    delete process.env.SETTLEMENT_MODE;
  });

  async function connectedMerchant() {
    const m = await verifiedMerchant();
    await MerchantVerification.updateOne({ merchant_id: m.id }, { $set: { settlement_connected: true, recipient_code: 'RCP_test123' } });
    return m;
  }
  async function heldOrder(buyerId: string, merchantId: string, status: 'delivered' | 'paid') {
    return Order.create({
      buyer_id: buyerId, merchant_id: merchantId,
      items: [{ product_id: new Types.ObjectId(), name: 'X', unit_price_minor: 10000, quantity: 1 }],
      subtotal_minor: 10000, total_minor: 10000, status, settlement_status: 'held',
      history: [{ status, actor: 'system', at: new Date() }],
    });
  }

  it('connects a transfer recipient (not a subaccount)', async () => {
    const merchant = await verifiedMerchant();
    const res = await request.post(`${MERCHANTS}/settlement/connect`).set(auth(merchant.token)).send({ account_number: '0123456789', bank_code: '001', type: 'ghipss' });
    expect(res.status).toBe(200);
    const stored: any = await MerchantVerification.findOne({ merchant_id: merchant.id }).lean();
    expect(stored.recipient_code).toBe('RCP_test123');
    expect(stored.subaccount_code).toBe('');
    const rcpCall = mockedAxios.post.mock.calls.find((c) => String(c[0]).includes('/transferrecipient'));
    expect(rcpCall![1]).toMatchObject({ type: 'ghipss', bank_code: '001' });
  });

  it('transfers the merchant share on completion (buyer confirm)', async () => {
    const merchant = await connectedMerchant();
    const buyer = await makeUser();
    const order = await heldOrder(buyer.id, merchant.id, 'delivered');

    const res = await request.post(`${ORDERS}/${order._id}/confirm`).set(auth(buyer.token));
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');

    const fresh = await Order.findById(order._id).lean();
    expect(fresh!.settlement_status).toBe('released');
    // The merchant's share (total − 5% fee) was transferred to their recipient.
    const transfers = transferCalls();
    expect(transfers).toHaveLength(1);
    expect(transfers[0][1]).toMatchObject({ recipient: 'RCP_test123', amount: 9500 });
  });

  it('does NOT transfer when a held order is refunded before completion', async () => {
    const merchant = await connectedMerchant();
    const buyer = await makeUser();
    const order = await heldOrder(buyer.id, merchant.id, 'paid');

    const res = await request.post(`${ORDERS}/${order._id}/cancel`).set(auth(merchant.token));
    expect(res.status).toBe(200);
    const fresh = await Order.findById(order._id).lean();
    expect(fresh!.settlement_status).toBe('refunded');
    expect(transferCalls()).toHaveLength(0);
  });
});
