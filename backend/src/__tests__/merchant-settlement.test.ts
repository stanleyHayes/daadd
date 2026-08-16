jest.mock('axios');
import axios from 'axios';

import { MerchantVerification, User, UserRole } from '../models';
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
    if (url.includes('/bank')) return Promise.resolve({ data: { data: [{ name: 'Test Bank', code: '001' }, { name: 'MTN MoMo', code: 'MTN' }] } }) as any;
    // transaction verify (unused here)
    return Promise.resolve({ data: { data: { status: 'success', amount: 0, currency: 'GHS' } } }) as any;
  });
  mockedAxios.post.mockImplementation((url: string, body: any) => {
    if (url.includes('/subaccount')) return Promise.resolve({ data: { data: { subaccount_code: 'ACCT_test123', account_name: 'Ama Owusu' } } }) as any;
    if (url.includes('/transaction/initialize'))
      return Promise.resolve({ data: { data: { authorization_url: 'https://checkout.paystack.test/x', reference: body.reference } } }) as any;
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

describe('merchant settlement (subaccount) self-service', () => {
  beforeAll(async () => await connectTestDb());
  beforeEach(async () => {
    await resetTestDb();
    seq = 0;
  });
  afterAll(async () => await closeTestDb());

  it('lists banks and resolves an account name', async () => {
    const merchant = await verifiedMerchant();
    const banks = await request.get(`${MERCHANTS}/settlement/banks`).set(auth(merchant.token));
    expect(banks.status).toBe(200);
    expect(banks.body.data).toEqual(expect.arrayContaining([{ name: 'Test Bank', code: '001' }]));

    const resolve = await request.post(`${MERCHANTS}/settlement/resolve`).set(auth(merchant.token)).send({ account_number: '0123456789', bank_code: '001' });
    expect(resolve.status).toBe(200);
    expect(resolve.body.data.account_name).toBe('Ama Owusu');
  });

  it('connects a subaccount, storing the code + masked account (never the full number)', async () => {
    const merchant = await verifiedMerchant();
    const res = await request.post(`${MERCHANTS}/settlement/connect`).set(auth(merchant.token)).send({ account_number: '0123456789', bank_code: '001', provider: 'Test Bank' });
    expect(res.status).toBe(200);
    expect(res.body.data.settlement_connected).toBe(true);
    expect(res.body.data.settlement_account_name).toBe('Ama Owusu');

    const stored: any = await MerchantVerification.findOne({ merchant_id: merchant.id }).lean();
    expect(stored.subaccount_code).toBe('ACCT_test123');
    expect(stored.settlement_account_last4).toBe('6789');
    // The full account number is never persisted.
    expect(JSON.stringify(stored)).not.toContain('0123456789');
    // The subaccount was created with the platform fee as the percentage charge.
    const subCall = mockedAxios.post.mock.calls.find((c) => String(c[0]).includes('/subaccount'));
    expect(subCall![1]).toMatchObject({ percentage_charge: 5, settlement_bank: '001', account_number: '0123456789' });
  });

  it('non-merchants cannot connect settlement', async () => {
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
    expect(pay.body.data.requires_payment).toBe(true);

    // The Paystack initialize call carried the merchant's subaccount for the split.
    const initCall = mockedAxios.post.mock.calls.find((c) => String(c[0]).includes('/transaction/initialize'));
    expect(initCall![1]).toMatchObject({ subaccount: 'ACCT_test123' });
  });
});
