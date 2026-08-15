import { Types } from 'mongoose';
import { User, Reward, MerchantVerification, UserRole } from '../models';
import { generateToken } from '../middleware/auth';
import { activateReferral, generateReferralCode } from '../utils/referral';
import { request, connectTestDb, resetTestDb, closeTestDb } from '../test-helpers';

const AUTH = '/api/v1/auth';
const REFERRALS = '/api/v1/referrals';
const REDEMPTION = '/api/v1/redemption';

const BONUS_TOKENS = 100;
const TOKEN_VALUE = 0.05;
const ORIGINAL_ENV = { ...process.env };
beforeAll(() => {
  process.env.TOKEN_VALUE = String(TOKEN_VALUE);
  process.env.REFERRAL_BONUS_TOKENS = String(BONUS_TOKENS);
});
afterAll(() => {
  process.env = ORIGINAL_ENV;
});

let seq = 0;
async function makeUser(role: UserRole = 'end_user', extra: Record<string, unknown> = {}) {
  seq += 1;
  const email = `ref-${seq}@example.com`;
  const u = await User.create({ name: `Ref ${seq}`, email, password_hash: 'x', ...extra });
  if (role !== 'end_user') await User.findByIdAndUpdate(u._id, { role });
  return { id: String(u._id), email, token: generateToken({ userId: String(u._id), email, role }) };
}

async function fund(userId: string, tokens: number) {
  await Reward.create({ user_id: userId, amount: tokens * TOKEN_VALUE, status: 'approved', type: 'ad_reward', note: 'seed' });
}

async function balance(userId: string): Promise<number> {
  const rows = await Reward.aggregate([
    { $match: { user_id: new Types.ObjectId(userId), status: { $in: ['approved', 'paid'] } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return rows[0]?.total || 0;
}

describe('referral code generation', () => {
  beforeAll(async () => await connectTestDb());
  afterEach(async () => await resetTestDb());
  afterAll(async () => await closeTestDb());

  it('produces unambiguous 8-char codes', async () => {
    const code = await generateReferralCode();
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
  });
});

describe('registration captures a referral', () => {
  beforeAll(async () => await connectTestDb());
  afterEach(async () => await resetTestDb());
  afterAll(async () => await closeTestDb());

  it('assigns a code and links referred_by for a valid code', async () => {
    const referrer = await request.post(`${AUTH}/register`).send({
      name: 'Referrer',
      email: 'referrer@example.com',
      password: 'super-secret-password',
    });
    const code = referrer.body.data.user.referral_code;
    expect(code).toBeTruthy();

    const invitee = await request.post(`${AUTH}/register`).send({
      name: 'Invitee',
      email: 'invitee@example.com',
      password: 'super-secret-password',
      referral_code: code,
    });
    expect(invitee.status).toBe(201);
    expect(invitee.body.data.user.referral_code).toBeTruthy();

    const stored = await User.findById(invitee.body.data.user.id).select('referred_by referral_activated').lean();
    expect(String(stored!.referred_by)).toBe(String(referrer.body.data.user.id));
    expect(stored!.referral_activated).toBe(false);
  });

  it('ignores an unknown code without failing registration', async () => {
    const res = await request.post(`${AUTH}/register`).send({
      name: 'NoRef',
      email: 'noref@example.com',
      password: 'super-secret-password',
      referral_code: 'ZZZZZZZZ',
    });
    expect(res.status).toBe(201);
    const stored = await User.findById(res.body.data.user.id).select('referred_by').lean();
    expect(stored!.referred_by).toBeUndefined();
  });
});

describe('activateReferral', () => {
  beforeAll(async () => await connectTestDb());
  beforeEach(async () => {
    await resetTestDb();
    seq = 0;
  });
  afterAll(async () => await closeTestDb());

  it('mints the referrer a fresh bonus exactly once and never touches the invitee', async () => {
    const referrer = await makeUser();
    const invitee = await makeUser('end_user', { referred_by: new Types.ObjectId(referrer.id) });

    const inviteeBefore = await balance(invitee.id);

    await activateReferral(invitee.id);
    await activateReferral(invitee.id); // idempotent — must not double-pay

    const rewards = await Reward.find({ user_id: referrer.id, type: 'referral_reward' }).lean();
    expect(rewards).toHaveLength(1);
    expect(rewards[0].amount).toBeCloseTo(BONUS_TOKENS * TOKEN_VALUE, 2);
    expect(rewards[0].status).toBe('approved');

    // Compliance: the bonus is a fresh mint to the referrer, NOT a transfer of
    // the invitee's tokens — the invitee's balance is unchanged.
    expect(await balance(invitee.id)).toBe(inviteeBefore);

    const inviteeDoc = await User.findById(invitee.id).select('referral_activated').lean();
    expect(inviteeDoc!.referral_activated).toBe(true);
  });

  it('does nothing for a user with no referrer', async () => {
    const solo = await makeUser();
    await activateReferral(solo.id);
    expect(await Reward.countDocuments({ type: 'referral_reward' })).toBe(0);
  });

  it('never pays a self-referral', async () => {
    // A user somehow pointing at themselves must not be paid.
    const u = await makeUser();
    await User.findByIdAndUpdate(u.id, { referred_by: new Types.ObjectId(u.id) });
    await activateReferral(u.id);
    expect(await Reward.countDocuments({ user_id: u.id, type: 'referral_reward' })).toBe(0);
  });
});

describe('GET /referrals/me', () => {
  beforeAll(async () => await connectTestDb());
  beforeEach(async () => {
    await resetTestDb();
    seq = 0;
  });
  afterAll(async () => await closeTestDb());

  it('returns a code (assigned lazily) and activation counts', async () => {
    const referrer = await makeUser();
    // Two invitees: one activated, one pending.
    await makeUser('end_user', { referred_by: new Types.ObjectId(referrer.id), referral_activated: true });
    await makeUser('end_user', { referred_by: new Types.ObjectId(referrer.id), referral_activated: false });

    const res = await request.get(`${REFERRALS}/me`).set('Authorization', `Bearer ${referrer.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.code).toMatch(/^[A-HJ-NP-Z2-9]+$/);
    expect(res.body.data.activated_count).toBe(1);
    expect(res.body.data.pending_count).toBe(1);
    expect(res.body.data.bonus_tokens).toBe(BONUS_TOKENS);
    expect(res.body.data.share_url).toContain(res.body.data.code);
  });

  it('requires auth', async () => {
    expect((await request.get(`${REFERRALS}/me`)).status).toBe(401);
  });
});

describe('referral pays out on a real first redemption', () => {
  beforeAll(async () => await connectTestDb());
  beforeEach(async () => {
    await resetTestDb();
    seq = 0;
  });
  afterAll(async () => await closeTestDb());

  it('pays the referrer once when the invitee completes their first redemption', async () => {
    const referrer = await makeUser();
    const invitee = await makeUser('end_user', { referred_by: new Types.ObjectId(referrer.id) });
    const merchant = await makeUser('merchant');
    await MerchantVerification.create({ merchant_id: merchant.id, status: 'verified' });
    await fund(invitee.id, 20);

    async function redeem() {
      const qr = await request.post(`${REDEMPTION}/qr`).set('Authorization', `Bearer ${invitee.token}`).send({ tokens: 5 });
      expect(qr.status).toBe(200);
      const scan = await request
        .post(`${REDEMPTION}/scan`)
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({ qr: qr.body.data.qr, signature: qr.body.data.signature });
      expect(scan.status).toBe(200);
      await request
        .post(`${REDEMPTION}/validate`)
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({ redemption_id: qr.body.data.redemption_id, purchase_amount: 100 });
      const confirm = await request
        .post(`${REDEMPTION}/confirm`)
        .set('Authorization', `Bearer ${merchant.token}`)
        .send({ redemption_id: qr.body.data.redemption_id });
      expect(confirm.status).toBe(200);
    }

    await redeem();
    await redeem(); // a second redemption must NOT pay the referrer again

    const rewards = await Reward.find({ user_id: referrer.id, type: 'referral_reward' }).lean();
    expect(rewards).toHaveLength(1);
    expect(rewards[0].amount).toBeCloseTo(BONUS_TOKENS * TOKEN_VALUE, 2);
  });
});
