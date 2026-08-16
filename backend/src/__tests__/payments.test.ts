import crypto from 'crypto';

jest.mock('axios');
import axios from 'axios';

import { Payment, WebhookEvent, User, Reward, UserRole } from '../models';
import { generateToken } from '../middleware/auth';
import {
  resolveProvider,
  paymentsEnabled,
} from '../services/payment.service';
import { request, connectTestDb, resetTestDb, closeTestDb } from '../test-helpers';

const mockedAxios = axios as jest.Mocked<typeof axios>;
const PAY = '/api/v1/payments';
const SECRET = 'sk_test_secret_key';

const ORIGINAL_ENV = { ...process.env };
beforeAll(() => {
  process.env.PAYSTACK_SECRET_KEY = SECRET;
  process.env.PAYSTACK_BASE_URL = 'https://api.paystack.test';
  process.env.PSP_PROVIDER = 'paystack';
  process.env.BILLING_SETUP_MINOR = '5000';
  process.env.PAYMENTS_CURRENCY = 'GHS';
  delete process.env.PAYMENTS_ENABLED;
});
afterAll(() => {
  process.env = ORIGINAL_ENV;
});
beforeEach(() => {
  jest.clearAllMocks();
  // Default: initialize echoes the reference; verify reports a matching success.
  mockedAxios.post.mockImplementation((_url: string, body: any) =>
    Promise.resolve({ data: { data: { authorization_url: 'https://checkout.paystack.test/abc', reference: body.reference } } }) as any
  );
  mockedAxios.get.mockImplementation((url: string) => {
    const reference = decodeURIComponent(String(url).split('/').pop() || '');
    return Promise.resolve({
      data: { data: { status: 'success', amount: 5000, currency: 'GHS', reference, gateway_response: 'Successful' } },
    }) as any;
  });
});

let seq = 0;
async function makeUser(role: UserRole = 'advertiser') {
  seq += 1;
  const email = `pay-${seq}@example.com`;
  const u = await User.create({ name: `Pay ${seq}`, email, password_hash: 'x' });
  if (role !== 'end_user') await User.findByIdAndUpdate(u._id, { role });
  return { id: String(u._id), email, token: generateToken({ userId: String(u._id), email, role }) };
}

function signed(body: object): { raw: string; sig: string } {
  const raw = JSON.stringify(body);
  const sig = crypto.createHmac('sha512', SECRET).update(raw).digest('hex');
  return { raw, sig };
}

// ---------------------------------------------------------------------------
// Provider unit
// ---------------------------------------------------------------------------

describe('payment provider (paystack adapter)', () => {
  it('verifies a genuine HMAC-SHA512 webhook signature and rejects a forged one', () => {
    const provider = resolveProvider();
    const { raw, sig } = signed({ event: 'charge.success', data: { reference: 'r1' } });
    expect(provider.verifyWebhookSignature(Buffer.from(raw), sig)).toBe(true);
    expect(provider.verifyWebhookSignature(Buffer.from(raw), 'deadbeef')).toBe(false);
    expect(provider.verifyWebhookSignature(Buffer.from('{}'), undefined)).toBe(false);
  });

  it('parses a paystack webhook into a stable event identity', () => {
    const parsed = resolveProvider().parseWebhook({
      event: 'charge.success',
      data: { id: 999, reference: 'ref-xyz', status: 'success', amount: 5000, currency: 'GHS' },
    });
    expect(parsed).toEqual({
      event_id: 'charge.success:999',
      event_type: 'charge.success',
      reference: 'ref-xyz',
      status: 'success',
      amount_minor: 5000,
      currency: 'GHS',
    });
  });

  it('reports enabled only when the secret is present', () => {
    expect(paymentsEnabled()).toBe(true);
    process.env.PAYMENTS_ENABLED = 'false';
    expect(paymentsEnabled()).toBe(false);
    delete process.env.PAYMENTS_ENABLED;
  });
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

describe('payment routes', () => {
  beforeAll(async () => await connectTestDb());
  beforeEach(async () => {
    await resetTestDb();
    seq = 0;
  });
  afterAll(async () => await closeTestDb());

  it('initializes a pending payment and returns a checkout URL', async () => {
    const adv = await makeUser('advertiser');
    const res = await request.post(`${PAY}/initialize`).set('Authorization', `Bearer ${adv.token}`).send({ purpose: 'advertiser_billing' });
    expect(res.status).toBe(200);
    expect(res.body.data.authorization_url).toContain('checkout.paystack');
    const payment = await Payment.findOne({ reference: res.body.data.reference }).lean();
    expect(payment!.status).toBe('pending');
    expect(payment!.amount_minor).toBe(5000);
    expect(payment!.currency).toBe('GHS');
  });

  it('forbids a non-advertiser from advertiser billing and rejects unknown purposes', async () => {
    const consumer = await makeUser('end_user');
    expect(
      (await request.post(`${PAY}/initialize`).set('Authorization', `Bearer ${consumer.token}`).send({ purpose: 'advertiser_billing' })).status
    ).toBe(403);
    const adv = await makeUser('advertiser');
    expect(
      (await request.post(`${PAY}/initialize`).set('Authorization', `Bearer ${adv.token}`).send({ purpose: 'nonsense' })).status
    ).toBe(400);
  });

  it('verify reconciles a matching success to paid and unlocks billing_ready — without touching the token ledger', async () => {
    const adv = await makeUser('advertiser');
    const init = await request.post(`${PAY}/initialize`).set('Authorization', `Bearer ${adv.token}`).send({ purpose: 'advertiser_billing' });
    const reference = init.body.data.reference;

    const verify = await request.get(`${PAY}/verify/${reference}`).set('Authorization', `Bearer ${adv.token}`);
    expect(verify.status).toBe(200);
    expect(verify.body.data.status).toBe('paid');

    const user = await User.findById(adv.id).lean();
    expect(user!.billing_ready).toBe(true);

    // Real money must never write to the token ledger.
    expect(await Reward.countDocuments({ user_id: adv.id })).toBe(0);
    expect(await Reward.countDocuments({})).toBe(0);
  });

  it('refuses to grant value when the charged amount does not match', async () => {
    const adv = await makeUser('advertiser');
    const init = await request.post(`${PAY}/initialize`).set('Authorization', `Bearer ${adv.token}`).send({ purpose: 'advertiser_billing' });
    const reference = init.body.data.reference;
    // Provider reports a different amount than we asked for.
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: { status: 'success', amount: 100, currency: 'GHS', reference, gateway_response: 'Successful' } },
    } as any);

    const verify = await request.get(`${PAY}/verify/${reference}`).set('Authorization', `Bearer ${adv.token}`);
    expect(verify.body.data.status).toBe('failed');
    const user = await User.findById(adv.id).lean();
    expect(user!.billing_ready).not.toBe(true);
  });

  it('does not let one user verify another user’s payment', async () => {
    const adv = await makeUser('advertiser');
    const other = await makeUser('advertiser');
    const init = await request.post(`${PAY}/initialize`).set('Authorization', `Bearer ${adv.token}`).send({ purpose: 'advertiser_billing' });
    const reference = init.body.data.reference;
    expect((await request.get(`${PAY}/verify/${reference}`).set('Authorization', `Bearer ${other.token}`)).status).toBe(404);
  });

  it('returns 503 when payments are not enabled', async () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    const adv = await makeUser('advertiser');
    expect((await request.post(`${PAY}/initialize`).set('Authorization', `Bearer ${adv.token}`).send({ purpose: 'advertiser_billing' })).status).toBe(503);
    process.env.PAYSTACK_SECRET_KEY = SECRET;
  });
});

// ---------------------------------------------------------------------------
// Webhook (signature-verified, exactly-once)
// ---------------------------------------------------------------------------

describe('payment webhook', () => {
  beforeAll(async () => await connectTestDb());
  beforeEach(async () => {
    await resetTestDb();
    // resetTestDb drops the DB (and its indexes); rebuild the exactly-once index
    // the webhook relies on. In production it is built once at startup and persists.
    await WebhookEvent.ensureIndexes();
    seq = 0;
  });
  afterAll(async () => await closeTestDb());

  async function pendingPayment() {
    const adv = await makeUser('advertiser');
    const init = await request.post(`${PAY}/initialize`).set('Authorization', `Bearer ${adv.token}`).send({ purpose: 'advertiser_billing' });
    return { adv, reference: init.body.data.reference as string };
  }

  it('rejects an unsigned or wrongly-signed webhook', async () => {
    const { reference } = await pendingPayment();
    const { raw } = signed({ event: 'charge.success', data: { id: 1, reference, status: 'success', amount: 5000, currency: 'GHS' } });
    const res = await request.post(`${PAY}/webhook`).set('Content-Type', 'application/json').set('x-paystack-signature', 'forged').send(raw);
    expect(res.status).toBe(401);
    expect((await Payment.findOne({ reference }).lean())!.status).toBe('pending');
  });

  it('processes a signed charge.success once, and is idempotent on redelivery', async () => {
    const { adv, reference } = await pendingPayment();
    const { raw, sig } = signed({ event: 'charge.success', data: { id: 55, reference, status: 'success', amount: 5000, currency: 'GHS' } });

    const first = await request.post(`${PAY}/webhook`).set('Content-Type', 'application/json').set('x-paystack-signature', sig).send(raw);
    expect(first.status).toBe(200);
    expect((await Payment.findOne({ reference }).lean())!.status).toBe('paid');
    expect((await User.findById(adv.id).lean())!.billing_ready).toBe(true);

    // Redelivery of the exact same event: acked as a duplicate, no re-processing.
    const second = await request.post(`${PAY}/webhook`).set('Content-Type', 'application/json').set('x-paystack-signature', sig).send(raw);
    expect(second.status).toBe(200);
    expect(second.body.duplicate).toBe(true);
    expect(await WebhookEvent.countDocuments({ event_id: 'charge.success:55' })).toBe(1);
    // The re-verify (axios.get) ran once, for the first delivery only.
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    // No token-ledger rows from a real-money payment.
    expect(await Reward.countDocuments({})).toBe(0);
  });
});
