import { User, MerchantVerification, maskLast } from '../models';
import { merchantGate } from '../utils/merchant-gate';
import { generateToken } from '../middleware/auth';
import { request, connectTestDb, resetTestDb, closeTestDb } from '../test-helpers';

const AUTH = '/api/v1/auth';
const MERCHANTS = '/api/v1/merchants';
const REDEMPTION = '/api/v1/redemption';

interface TestUser {
  id: string;
  email: string;
  token: string;
}

let userSeq = 0;

async function registerUser(): Promise<TestUser> {
  userSeq += 1;
  const email = `merchant-test-${userSeq}@example.com`;
  const res = await request.post(`${AUTH}/register`).send({
    name: `Merchant Test ${userSeq}`,
    email,
    password: 'super-secret-password',
  });
  if (res.status !== 201) throw new Error(`register failed: ${JSON.stringify(res.body)}`);
  return { id: String(res.body.data.user.id), email, token: res.body.data.token };
}

/** Promote a freshly registered user to a role and mint a matching token. */
async function registerAs(role: string): Promise<TestUser> {
  const user = await registerUser();
  await User.findByIdAndUpdate(user.id, { role });
  const token = generateToken({ userId: user.id, email: user.email, role });
  return { ...user, token };
}

// ---------------------------------------------------------------------------
// Unit: the gate + masking
// ---------------------------------------------------------------------------

describe('merchantGate', () => {
  it('lets a verified merchant transact', () => {
    const gate = merchantGate({ role: 'merchant', status: 'verified' });
    expect(gate.can_transact).toBe(true);
    expect(gate.reason).toBe('');
  });

  it('blocks a merchant with no record (treated as pending)', () => {
    const gate = merchantGate({ role: 'merchant', status: null });
    expect(gate.gated).toBe(true);
    expect(gate.status).toBe('pending');
    expect(gate.can_transact).toBe(false);
    expect(gate.reason).toMatch(/under review/i);
  });

  it.each(['pending', 'restricted', 'suspended'] as const)(
    'blocks a %s merchant',
    (status) => {
      expect(merchantGate({ role: 'merchant', status }).can_transact).toBe(false);
    }
  );

  it.each(['advertiser', 'admin', 'end_user'] as const)(
    'never gates a %s actor',
    (role) => {
      const gate = merchantGate({ role, status: null });
      expect(gate.gated).toBe(false);
      expect(gate.can_transact).toBe(true);
    }
  );
});

describe('maskLast', () => {
  it('keeps only the last four characters', () => {
    expect(maskLast('GHA-123456789-0')).toBe('89-0');
    expect(maskLast('1234567890')).toBe('7890');
  });

  it('strips whitespace before masking', () => {
    expect(maskLast('12 34 56 78')).toBe('5678');
  });

  it('returns short values unchanged and empty for blank', () => {
    expect(maskLast('12')).toBe('12');
    expect(maskLast('')).toBe('');
    expect(maskLast(undefined)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

describe('merchant verification routes', () => {
  let merchant: TestUser;
  let admin: TestUser;

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
    merchant = await registerAs('merchant');
    admin = await registerAs('admin');
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it('submits KYC, storing only masked identifiers and defaulting to pending', async () => {
    const res = await request
      .put(`${MERCHANTS}/verification`)
      .set('Authorization', `Bearer ${merchant.token}`)
      .send({
        business_name: 'Kejetia Foods',
        business_registration_number: 'CS-99887766',
        business_address: '12 Market St',
        business_city: 'Kumasi',
        contact_phone: '+233200000000',
        owner_name: 'Ama Owusu',
        owner_id_type: 'ghana_card',
        owner_id_number: 'GHA-123456789-0',
        settlement_provider: 'MTN MoMo',
        settlement_account: '0244123456',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.owner_id_last4).toBe('89-0');
    expect(res.body.data.settlement_account_last4).toBe('3456');

    // The full identifiers must never be persisted.
    const stored: any = await MerchantVerification.findOne({ merchant_id: merchant.id }).lean();
    expect(stored.owner_id_last4).toBe('89-0');
    expect(JSON.stringify(stored)).not.toContain('GHA-123456789-0');
    expect(JSON.stringify(stored)).not.toContain('0244123456');
  });

  it('re-submitting after verification drops back to pending', async () => {
    await MerchantVerification.create({ merchant_id: merchant.id, status: 'verified' });

    const res = await request
      .put(`${MERCHANTS}/verification`)
      .set('Authorization', `Bearer ${merchant.token}`)
      .send({ business_name: 'Changed Name' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('pending');
  });

  it('returns the merchant’s own record and gate', async () => {
    await MerchantVerification.create({ merchant_id: merchant.id, status: 'verified' });

    const res = await request
      .get(`${MERCHANTS}/verification`)
      .set('Authorization', `Bearer ${merchant.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.verification.status).toBe('verified');
    expect(res.body.data.gate.can_transact).toBe(true);
  });

  it('forbids non-merchants from submitting', async () => {
    const res = await request
      .put(`${MERCHANTS}/verification`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ business_name: 'X' });
    expect(res.status).toBe(403);
  });

  it('requires auth', async () => {
    expect((await request.get(`${MERCHANTS}/verification`)).status).toBe(401);
    expect((await request.put(`${MERCHANTS}/verification`).send({})).status).toBe(401);
  });

  it('lets an admin list the review queue with merchant details', async () => {
    await MerchantVerification.create({
      merchant_id: merchant.id,
      business_name: 'Kejetia Foods',
      status: 'pending',
    });

    const res = await request
      .get(`${MERCHANTS}/admin?status=pending`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].business_name).toBe('Kejetia Foods');
    expect(res.body.data[0].merchant.email).toBe(merchant.email);
  });

  it('lets an admin set status and rejects an unknown status', async () => {
    const record = await MerchantVerification.create({
      merchant_id: merchant.id,
      status: 'pending',
    });

    const bad = await request
      .patch(`${MERCHANTS}/admin/${record._id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'approved' });
    expect(bad.status).toBe(400);

    const ok = await request
      .patch(`${MERCHANTS}/admin/${record._id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'verified', review_notes: 'docs check out' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.status).toBe('verified');
    expect(ok.body.data.reviewed_by).toBeDefined();
  });

  it('forbids a merchant from reaching the admin queue', async () => {
    const res = await request
      .get(`${MERCHANTS}/admin`)
      .set('Authorization', `Bearer ${merchant.token}`);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Integration: the gate on the money-touching confirm
// ---------------------------------------------------------------------------

describe('verification gates redemption confirm', () => {
  let customer: TestUser;
  let merchant: TestUser;

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
    customer = await registerUser();
    merchant = await registerAs('merchant');
  });

  afterAll(async () => {
    await closeTestDb();
  });

  /** Drive qr → scan → validate and return the redemption id. */
  async function drySteps(tokens: number): Promise<string> {
    const { Reward } = await import('../models');
    await Reward.create({
      user_id: customer.id,
      amount: tokens * 0.05,
      status: 'approved',
      type: 'ad_reward',
      note: 'test seed',
    });

    const qr = await request
      .post(`${REDEMPTION}/qr`)
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ tokens });
    expect(qr.status).toBe(200);

    const scan = await request
      .post(`${REDEMPTION}/scan`)
      .set('Authorization', `Bearer ${merchant.token}`)
      .send({ qr: qr.body.data.qr, signature: qr.body.data.signature });
    expect(scan.status).toBe(200);

    const validate = await request
      .post(`${REDEMPTION}/validate`)
      .set('Authorization', `Bearer ${merchant.token}`)
      .send({ redemption_id: qr.body.data.redemption_id, purchase_amount: 100 });
    expect(validate.status).toBe(200);

    return qr.body.data.redemption_id as string;
  }

  it('blocks confirm for an unverified merchant, then allows it once verified', async () => {
    const redemptionId = await drySteps(10);

    // No verification record yet → pending → blocked.
    const blocked = await request
      .post(`${REDEMPTION}/confirm`)
      .set('Authorization', `Bearer ${merchant.token}`)
      .send({ redemption_id: redemptionId });
    expect(blocked.status).toBe(403);
    expect(blocked.body.message).toMatch(/under review/i);

    // An admin verifies the merchant.
    await MerchantVerification.create({ merchant_id: merchant.id, status: 'verified' });

    const ok = await request
      .post(`${REDEMPTION}/confirm`)
      .set('Authorization', `Bearer ${merchant.token}`)
      .send({ redemption_id: redemptionId });
    expect(ok.status).toBe(200);
    expect(ok.body.data.tokens_used).toBe(10);
  });

  it('blocks a suspended merchant', async () => {
    await MerchantVerification.create({ merchant_id: merchant.id, status: 'suspended' });
    const redemptionId = await drySteps(10);

    const res = await request
      .post(`${REDEMPTION}/confirm`)
      .set('Authorization', `Bearer ${merchant.token}`)
      .send({ redemption_id: redemptionId });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/suspended/i);
  });
});
