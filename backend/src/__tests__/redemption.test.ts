import { Redemption, Reward, User } from '../models';
import { generateToken } from '../middleware/auth';
import { request, connectTestDb, resetTestDb, closeTestDb } from '../test-helpers';

const AUTH = '/api/v1/auth';
const REDEMPTION = '/api/v1/redemption';
const REWARDS = '/api/v1/rewards';

// Keep in sync with src/test-setup.ts.
const TOKEN_VALUE = 0.05;
const MAX_DISCOUNT_PCT = 0.15;

interface TestUser {
  id: string;
  token: string;
}

let userSeq = 0;

async function registerUser(): Promise<TestUser> {
  userSeq += 1;
  const res = await request.post(`${AUTH}/register`).send({
    name: `Redemption User ${userSeq}`,
    email: `redemption-user-${userSeq}@example.com`,
    password: 'super-secret-password',
  });
  if (res.status !== 201) throw new Error(`register failed: ${JSON.stringify(res.body)}`);
  return { id: String(res.body.data.user.id), token: res.body.data.token };
}

// Registration always yields end_user (by design), so merchant fixtures are
// promoted in the DB and handed a freshly minted merchant-role token.
async function registerMerchant(): Promise<TestUser> {
  const user = await registerUser();
  await User.findByIdAndUpdate(user.id, { role: 'merchant' });
  const token = generateToken({
    userId: user.id,
    email: `redemption-user-${userSeq}@example.com`,
    role: 'merchant',
  });
  return { id: user.id, token };
}

async function fund(userId: string, amount: number): Promise<void> {
  await Reward.create({
    user_id: userId,
    amount,
    status: 'approved',
    type: 'ad_reward',
    note: 'test seed',
  });
}

async function requestQr(customer: TestUser, tokens: number) {
  return request
    .post(`${REDEMPTION}/qr`)
    .set('Authorization', `Bearer ${customer.token}`)
    .send({ tokens });
}

async function scan(merchant: TestUser, qr: string, signature: string) {
  return request
    .post(`${REDEMPTION}/scan`)
    .set('Authorization', `Bearer ${merchant.token}`)
    .send({ qr, signature });
}

/** Drive a redemption from qr → scan and return the ids for validate/confirm. */
async function scanRedemption(customer: TestUser, merchant: TestUser, tokens: number) {
  const qrRes = await requestQr(customer, tokens);
  if (qrRes.status !== 200) throw new Error(`qr failed: ${JSON.stringify(qrRes.body)}`);
  const { redemption_id, qr, signature } = qrRes.body.data;

  const scanRes = await scan(merchant, qr, signature);
  if (scanRes.status !== 200) throw new Error(`scan failed: ${JSON.stringify(scanRes.body)}`);

  return { redemptionId: redemption_id as string, qr: qr as string, signature: signature as string };
}

describe('redemption routes', () => {
  let customer: TestUser;
  let merchant: TestUser;

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
    customer = await registerUser();
    merchant = await registerMerchant();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it('completes the full qr → scan → validate → confirm flow and deducts the balance', async () => {
    await fund(customer.id, 10); // $10.00 == 200 tokens

    const { redemptionId } = await scanRedemption(customer, merchant, 10);

    const validate = await request
      .post(`${REDEMPTION}/validate`)
      .set('Authorization', `Bearer ${merchant.token}`)
      .send({ redemption_id: redemptionId, purchase_amount: 100 });

    expect(validate.status).toBe(200);
    // min(10 tokens * $0.05, $100 * 15%) = $0.50
    expect(validate.body.data.discount).toBeCloseTo(0.5);
    expect(validate.body.data.final_amount).toBeCloseTo(99.5);
    expect(validate.body.data.tokens_used).toBe(10);

    const confirm = await request
      .post(`${REDEMPTION}/confirm`)
      .set('Authorization', `Bearer ${merchant.token}`)
      .send({ redemption_id: redemptionId });

    expect(confirm.status).toBe(200);
    expect(confirm.body.data.tokens_used).toBe(10);
    expect(confirm.body.data.discount).toBeCloseTo(0.5);
    expect(confirm.body.data.new_balance).toBeCloseTo(9.5);

    // A negative redemption Reward is written and the redemption completes.
    const debit = await Reward.findOne({ user_id: customer.id, type: 'redemption' }).lean();
    expect(debit).not.toBeNull();
    expect(debit!.amount).toBeCloseTo(-0.5);
    expect(debit!.status).toBe('paid');

    const doc = await Redemption.findById(redemptionId).lean();
    expect(doc!.status).toBe('completed');
    expect(doc!.used_at).toBeDefined();
  });

  it('rejects a tampered signature at scan', async () => {
    await fund(customer.id, 10);

    const qrRes = await requestQr(customer, 5);
    const { qr, signature } = qrRes.body.data;
    const tampered = signature.replace(/.$/, signature.endsWith('a') ? 'b' : 'a');

    const res = await scan(merchant, qr, tampered);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/signature/i);
  });

  it('rejects confirming the same redemption twice', async () => {
    await fund(customer.id, 10);

    const { redemptionId } = await scanRedemption(customer, merchant, 5);
    await request
      .post(`${REDEMPTION}/validate`)
      .set('Authorization', `Bearer ${merchant.token}`)
      .send({ redemption_id: redemptionId, purchase_amount: 100 });

    const first = await request
      .post(`${REDEMPTION}/confirm`)
      .set('Authorization', `Bearer ${merchant.token}`)
      .send({ redemption_id: redemptionId });
    expect(first.status).toBe(200);

    const second = await request
      .post(`${REDEMPTION}/confirm`)
      .set('Authorization', `Bearer ${merchant.token}`)
      .send({ redemption_id: redemptionId });
    expect(second.status).toBe(409);
    expect(second.body.message).toMatch(/completed/);
  });

  it('rejects scanning an expired QR', async () => {
    await fund(customer.id, 10);

    const qrRes = await requestQr(customer, 5);
    const { redemption_id, qr, signature } = qrRes.body.data;

    // Force expiry in the past instead of waiting out QR_EXPIRY_SECONDS.
    await Redemption.findByIdAndUpdate(redemption_id, {
      expires_at: new Date(Date.now() - 1000),
    });

    const res = await scan(merchant, qr, signature);

    expect(res.status).toBe(410);
    const doc = await Redemption.findById(redemption_id).lean();
    expect(doc!.status).toBe('expired');
  });

  it('rejects the qr step when the balance is insufficient', async () => {
    // No rewards seeded: balance $0 → maxTokens 0.
    const res = await requestQr(customer, 1);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/insufficient balance/i);
    expect(await Redemption.countDocuments()).toBe(0);
  });

  it('caps the discount at tokens × TOKEN_VALUE when the purchase is large', async () => {
    await fund(customer.id, 10);

    const { redemptionId } = await scanRedemption(customer, merchant, 10); // $0.50 of tokens

    const validate = await request
      .post(`${REDEMPTION}/validate`)
      .set('Authorization', `Bearer ${merchant.token}`)
      .send({ redemption_id: redemptionId, purchase_amount: 1000 });

    expect(validate.status).toBe(200);
    // min(10 * 0.05, 1000 * 0.15) = $0.50 (token side of the min)
    expect(validate.body.data.discount).toBeCloseTo(10 * TOKEN_VALUE);
    expect(validate.body.data.final_amount).toBeCloseTo(999.5);
    expect(validate.body.data.tokens_used).toBe(10);
  });

  it('caps the discount at MAX_DISCOUNT_PCT of the purchase when tokens are plentiful', async () => {
    await fund(customer.id, 100); // $100 == 2000 tokens

    const { redemptionId } = await scanRedemption(customer, merchant, 1000); // $50 of tokens

    const validate = await request
      .post(`${REDEMPTION}/validate`)
      .set('Authorization', `Bearer ${merchant.token}`)
      .send({ redemption_id: redemptionId, purchase_amount: 100 });

    expect(validate.status).toBe(200);
    // min(1000 * 0.05, 100 * 0.15) = $15 (percentage side of the min)
    const expectedDiscount = 100 * MAX_DISCOUNT_PCT;
    expect(validate.body.data.discount).toBeCloseTo(expectedDiscount);
    expect(validate.body.data.final_amount).toBeCloseTo(85);
    expect(validate.body.data.tokens_used).toBe(Math.ceil(expectedDiscount / TOKEN_VALUE));
  });

  it('rejects non-integer or non-positive token amounts at the qr step', async () => {
    await fund(customer.id, 10);

    const fractional = await requestQr(customer, 1.5);
    expect(fractional.status).toBe(400);

    const negative = await requestQr(customer, -3);
    expect(negative.status).toBe(400);
  });

  it('requires authentication on every endpoint', async () => {
    expect((await request.post(`${REDEMPTION}/qr`).send({ tokens: 1 })).status).toBe(401);
    expect((await request.post(`${REDEMPTION}/scan`).send({})).status).toBe(401);
    expect((await request.post(`${REDEMPTION}/validate`).send({})).status).toBe(401);
    expect((await request.post(`${REDEMPTION}/confirm`).send({})).status).toBe(401);
  });
});
