import { Types } from 'mongoose';
import { Redemption, Reward, User, FraudSignal } from '../models';
import { generateToken } from '../middleware/auth';
import { runFraudScan } from '../services/fraud-detection.service';
import { request, connectTestDb, resetTestDb, closeTestDb } from '../test-helpers';

const FRAUD = '/api/v1/fraud';
const AUTH = '/api/v1/auth';

// Low thresholds so tests seed a handful of events, not dozens.
const ORIGINAL_ENV = { ...process.env };
beforeAll(() => {
  process.env.FRAUD_REDEMPTION_VELOCITY = '3';
  process.env.FRAUD_MERCHANT_SURGE = '4';
  process.env.FRAUD_COLLUSION = '3';
  process.env.FRAUD_REWARD_FARMING_TOKENS = '50';
  process.env.TOKEN_VALUE = '0.05';
});
afterAll(() => {
  process.env = ORIGINAL_ENV;
});

let nonceSeq = 0;
async function redemption(
  userId: Types.ObjectId | string,
  merchantId: Types.ObjectId | string,
  opts: { usedAt?: Date; discount?: number } = {}
) {
  nonceSeq += 1;
  return Redemption.create({
    user_id: userId,
    merchant_id: merchantId,
    tokens: 10,
    discount_amount: opts.discount ?? 0.5,
    nonce: `nonce-${nonceSeq}`,
    status: 'completed',
    used_at: opts.usedAt ?? new Date(),
    expires_at: new Date(Date.now() + 120000),
  });
}

describe('fraud-detection service (real money-path events)', () => {
  beforeAll(async () => {
    await connectTestDb();
  });
  afterEach(async () => {
    await resetTestDb();
  });
  afterAll(async () => {
    await closeTestDb();
  });

  it('raises redemption_velocity when a customer redeems past the threshold', async () => {
    const user = new Types.ObjectId();
    // Three redemptions, each at a different merchant, so only the per-user rule trips.
    for (let i = 0; i < 3; i++) await redemption(user, new Types.ObjectId());

    const result = await runFraudScan();
    expect(result.created).toBeGreaterThanOrEqual(1);

    const signal = await FraudSignal.findOne({ subject_id: String(user), type: 'redemption_velocity' }).lean();
    expect(signal).not.toBeNull();
    expect(signal!.value).toBe(3);
    expect(signal!.status).toBe('open');
    expect(signal!.evidence.redemptions).toBe(3);
  });

  it('raises merchant_surge for a merchant confirming too many redemptions', async () => {
    const merchant = new Types.ObjectId();
    for (let i = 0; i < 4; i++) await redemption(new Types.ObjectId(), merchant);

    await runFraudScan();

    const signal = await FraudSignal.findOne({ subject_id: String(merchant), type: 'merchant_surge' }).lean();
    expect(signal).not.toBeNull();
    expect(signal!.subject_type).toBe('merchant');
    expect(signal!.value).toBe(4);
  });

  it('raises collusion for a repeated customer+merchant pair', async () => {
    const user = new Types.ObjectId();
    const merchant = new Types.ObjectId();
    for (let i = 0; i < 3; i++) await redemption(user, merchant);

    await runFraudScan();

    const pair = await FraudSignal.findOne({ subject_id: `${user}:${merchant}`, type: 'collusion' }).lean();
    expect(pair).not.toBeNull();
    expect(pair!.subject_type).toBe('pair');
    expect(pair!.evidence.merchant_id).toBe(String(merchant));
  });

  it('raises reward_farming from the token ledger', async () => {
    const user = new Types.ObjectId();
    // $5 of ad_reward at $0.05/token = 100 tokens, over the 50-token threshold.
    await Reward.create({ user_id: user, amount: 5, type: 'ad_reward', status: 'approved' });

    await runFraudScan();

    const signal = await FraudSignal.findOne({ subject_id: String(user), type: 'reward_farming' }).lean();
    expect(signal).not.toBeNull();
    expect(signal!.value).toBe(100);
    expect(signal!.metric).toBe('tokens');
  });

  it('ignores events outside the window', async () => {
    const user = new Types.ObjectId();
    const old = new Date(Date.now() - 72 * 3600 * 1000); // 3 days ago, window is 24h
    for (let i = 0; i < 5; i++) await redemption(user, new Types.ObjectId(), { usedAt: old });

    const result = await runFraudScan();
    expect(result.created).toBe(0);
    expect(await FraudSignal.countDocuments({})).toBe(0);
  });

  it('raises nothing when there are no events', async () => {
    const result = await runFraudScan();
    expect(result).toEqual({ created: 0, refreshed: 0, signals: [] });
  });

  it('refreshes an open signal on rescan rather than duplicating it', async () => {
    const user = new Types.ObjectId();
    for (let i = 0; i < 3; i++) await redemption(user, new Types.ObjectId());

    const first = await runFraudScan();
    expect(first.created).toBeGreaterThanOrEqual(1);

    // A fourth redemption then a rescan: same open signal, updated value.
    await redemption(user, new Types.ObjectId());
    const second = await runFraudScan();
    expect(second.refreshed).toBeGreaterThanOrEqual(1);

    const signals = await FraudSignal.find({ subject_id: String(user), type: 'redemption_velocity' }).lean();
    expect(signals).toHaveLength(1);
    expect(signals[0].value).toBe(4);
  });

  it('resolves the display label from a real user email', async () => {
    const u = await User.create({ name: 'Kwame', email: 'kwame@example.com', password_hash: 'x' });
    for (let i = 0; i < 3; i++) await redemption(u._id, new Types.ObjectId());

    await runFraudScan();
    const signal = await FraudSignal.findOne({ subject_id: String(u._id), type: 'redemption_velocity' }).lean();
    expect(signal!.subject_label).toBe('kwame@example.com');
  });
});

describe('fraud routes (admin only)', () => {
  let admin: { token: string };
  let user: string;

  beforeAll(async () => {
    await connectTestDb();
  });
  afterEach(async () => {
    await resetTestDb();
  });
  afterAll(async () => {
    await closeTestDb();
  });

  async function makeAdmin() {
    const res = await request.post(`${AUTH}/register`).send({
      name: 'Admin',
      email: `admin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      password: 'super-secret-password',
    });
    const id = String(res.body.data.user.id);
    await User.findByIdAndUpdate(id, { role: 'admin' });
    return { token: generateToken({ userId: id, email: 'a@example.com', role: 'admin' }) };
  }

  beforeEach(async () => {
    admin = await makeAdmin();
    const u = new Types.ObjectId();
    user = String(u);
    for (let i = 0; i < 3; i++) await redemption(u, new Types.ObjectId());
  });

  it('forbids non-admins', async () => {
    const res = await request.post(`${AUTH}/register`).send({
      name: 'Nobody',
      email: `nobody-${Date.now()}@example.com`,
      password: 'super-secret-password',
    });
    const token = res.body.data.token;
    expect((await request.get(FRAUD).set('Authorization', `Bearer ${token}`)).status).toBe(403);
    expect((await request.post(`${FRAUD}/scan`).set('Authorization', `Bearer ${token}`)).status).toBe(403);
  });

  it('requires auth', async () => {
    expect((await request.get(FRAUD)).status).toBe(401);
  });

  it('scans, lists, and resolves a signal', async () => {
    const scan = await request.post(`${FRAUD}/scan`).set('Authorization', `Bearer ${admin.token}`);
    expect(scan.status).toBe(200);
    expect(scan.body.data.created).toBeGreaterThanOrEqual(1);

    const list = await request.get(`${FRAUD}?status=open`).set('Authorization', `Bearer ${admin.token}`);
    expect(list.status).toBe(200);
    const signal = list.body.data.find((s: any) => s.subject_id === user);
    expect(signal).toBeDefined();

    const patch = await request
      .patch(`${FRAUD}/${signal._id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'dismissed', review_notes: 'known loyal customer' });
    expect(patch.status).toBe(200);
    expect(patch.body.data.status).toBe('dismissed');
    expect(patch.body.data.resolved_at).toBeDefined();
  });

  it('surfaces the most severe signals first', async () => {
    // A second customer well past the threshold → critical (ratio ≥ 3).
    const heavy = new Types.ObjectId();
    for (let i = 0; i < 9; i++) await redemption(heavy, new Types.ObjectId());

    await request.post(`${FRAUD}/scan`).set('Authorization', `Bearer ${admin.token}`);
    const list = await request.get(`${FRAUD}?status=open`).set('Authorization', `Bearer ${admin.token}`);
    expect(list.status).toBe(200);
    expect(list.body.data[0].severity).toBe('critical');
    expect(list.body.data[0].subject_id).toBe(String(heavy));
  });

  it('rejects an unknown status', async () => {
    await request.post(`${FRAUD}/scan`).set('Authorization', `Bearer ${admin.token}`);
    const one = await FraudSignal.findOne({}).lean();
    const res = await request
      .patch(`${FRAUD}/${one!._id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'nonsense' });
    expect(res.status).toBe(400);
  });
});
