import { Types } from 'mongoose';
import { DiscountVoucher, Reward, User, MerchantVerification, UserRole } from '../models';
import { generateToken } from '../middleware/auth';
import { expireVouchers } from '../utils/voucher';
import { request, connectTestDb, resetTestDb, closeTestDb } from '../test-helpers';

const VOUCHERS = '/api/v1/vouchers';
const TOKEN_VALUE = 0.05;

const ORIGINAL_ENV = { ...process.env };
beforeAll(() => {
  process.env.TOKEN_VALUE = String(TOKEN_VALUE);
  process.env.VOUCHER_MAX_TOKENS = '2000';
  process.env.VOUCHER_TTL_DAYS = '30';
});
afterAll(() => {
  process.env = ORIGINAL_ENV;
});

let seq = 0;
async function makeUser(role: UserRole = 'end_user') {
  seq += 1;
  const email = `vch-${seq}@example.com`;
  const u = await User.create({ name: `Vch ${seq}`, email, password_hash: 'x' });
  if (role !== 'end_user') await User.findByIdAndUpdate(u._id, { role });
  return { id: String(u._id), email, token: generateToken({ userId: String(u._id), email, role }) };
}
async function verifiedMerchant() {
  const m = await makeUser('merchant');
  await MerchantVerification.create({ merchant_id: m.id, status: 'verified' });
  return m;
}
async function fund(userId: string, tokens: number) {
  await Reward.create({ user_id: userId, amount: tokens * TOKEN_VALUE, status: 'approved', type: 'ad_reward', note: 'seed' });
}
async function balance(userId: string): Promise<number> {
  const rows = await Reward.aggregate([
    { $match: { user_id: new Types.ObjectId(userId), status: { $in: ['approved', 'paid'] } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return Math.round((rows[0]?.total || 0) * 100) / 100;
}
const auth = (tok: string) => ({ Authorization: `Bearer ${tok}` });

async function issue(user: { token: string }, tokens: number, message?: string) {
  return request.post(VOUCHERS).set(auth(user.token)).send({ amount_tokens: tokens, message });
}

describe('voucher issue (debits the sender, mints a separate instrument)', () => {
  beforeAll(async () => await connectTestDb());
  beforeEach(async () => {
    await resetTestDb();
    seq = 0;
  });
  afterAll(async () => await closeTestDb());

  it('debits the issuer and mints an issued voucher', async () => {
    const sender = await makeUser();
    await fund(sender.id, 200); // $10.00

    const res = await issue(sender, 100); // $5.00 voucher
    expect(res.status).toBe(201);
    expect(res.body.data.code).toMatch(/^GV-/);
    expect(res.body.data.status).toBe('issued');
    expect(res.body.data.amount).toBeCloseTo(5, 2);

    // The issuer's balance dropped by the voucher value.
    expect(await balance(sender.id)).toBeCloseTo(5, 2);
    const debit = await Reward.findOne({ user_id: sender.id, type: 'voucher_issue' }).lean();
    expect(debit!.amount).toBeCloseTo(-5, 2);
  });

  it('refuses to issue beyond the balance', async () => {
    const sender = await makeUser();
    await fund(sender.id, 10); // $0.50
    const res = await issue(sender, 100); // wants $5.00
    expect(res.status).toBe(409);
    expect(await DiscountVoucher.countDocuments({})).toBe(0);
    expect(await Reward.countDocuments({ type: 'voucher_issue' })).toBe(0);
  });

  it('rejects an over-cap amount', async () => {
    const sender = await makeUser();
    await fund(sender.id, 100000);
    expect((await issue(sender, 5000)).status).toBe(400);
  });
});

describe('voucher claim + token-policy compliance', () => {
  beforeAll(async () => await connectTestDb());
  beforeEach(async () => {
    await resetTestDb();
    seq = 0;
  });
  afterAll(async () => await closeTestDb());

  it('lets a recipient claim, and NEVER credits the recipient tokens', async () => {
    const sender = await makeUser();
    const recipient = await makeUser();
    await fund(sender.id, 200);
    const recipientBefore = await balance(recipient.id);

    const issued = await issue(sender, 100);
    const code = issued.body.data.code;

    const claim = await request.post(`${VOUCHERS}/claim`).set(auth(recipient.token)).send({ code });
    expect(claim.status).toBe(200);
    expect(claim.body.data.status).toBe('claimed');
    expect(claim.body.data.direction).toBe('received');

    // Compliance: the transfer moved a VOUCHER, not tokens. The recipient's
    // token balance is untouched, and no positive reward row was written to them.
    expect(await balance(recipient.id)).toBe(recipientBefore);
    expect(await Reward.countDocuments({ user_id: recipient.id })).toBe(0);
  });

  it('rejects claiming your own voucher and double-claims', async () => {
    const sender = await makeUser();
    const recipient = await makeUser();
    await fund(sender.id, 200);
    const code = (await issue(sender, 100)).body.data.code;

    expect((await request.post(`${VOUCHERS}/claim`).set(auth(sender.token)).send({ code })).status).toBe(400);

    expect((await request.post(`${VOUCHERS}/claim`).set(auth(recipient.token)).send({ code })).status).toBe(200);
    // Second claim by anyone loses — already claimed.
    const other = await makeUser();
    expect((await request.post(`${VOUCHERS}/claim`).set(auth(other.token)).send({ code })).status).toBe(409);
  });

  it('previews a voucher by code', async () => {
    const sender = await makeUser();
    const viewer = await makeUser();
    await fund(sender.id, 200);
    const code = (await issue(sender, 100, 'enjoy!')).body.data.code;

    const res = await request.get(`${VOUCHERS}/code/${code}`).set(auth(viewer.token));
    expect(res.status).toBe(200);
    expect(res.body.data.amount_tokens).toBe(100);
    expect(res.body.data.message).toBe('enjoy!');
    expect(res.body.data.expired).toBe(false);
  });
});

describe('voucher redeem at a verified merchant', () => {
  beforeAll(async () => await connectTestDb());
  beforeEach(async () => {
    await resetTestDb();
    seq = 0;
  });
  afterAll(async () => await closeTestDb());

  async function issuedClaimed(tokens: number) {
    const sender = await makeUser();
    const recipient = await makeUser();
    await fund(sender.id, tokens * 4);
    const code = (await issue(sender, tokens)).body.data.code;
    await request.post(`${VOUCHERS}/claim`).set(auth(recipient.token)).send({ code });
    return { sender, recipient, code };
  }

  it('applies the discount and flips to redeemed, with no ledger change at redeem', async () => {
    const merchant = await verifiedMerchant();
    const { code } = await issuedClaimed(100); // $5.00
    const ledgerBefore = await Reward.countDocuments({ type: { $in: ['voucher_issue', 'voucher_refund'] } });

    const res = await request
      .post(`${VOUCHERS}/redeem`)
      .set(auth(merchant.token))
      .send({ code, purchase_amount: 100 });
    expect(res.status).toBe(200);
    expect(res.body.data.discount).toBeCloseTo(5, 2);
    expect(res.body.data.final_amount).toBeCloseTo(95, 2);

    const voucher = await DiscountVoucher.findOne({ code }).lean();
    expect(voucher!.status).toBe('redeemed');
    expect(String(voucher!.merchant_id)).toBe(merchant.id);
    // No new ledger rows at redeem — the value was pre-funded at issue.
    expect(await Reward.countDocuments({ type: { $in: ['voucher_issue', 'voucher_refund'] } })).toBe(ledgerBefore);
  });

  it('caps the discount at the bill (no negative total)', async () => {
    const merchant = await verifiedMerchant();
    const { code } = await issuedClaimed(100); // $5.00 voucher
    const res = await request
      .post(`${VOUCHERS}/redeem`)
      .set(auth(merchant.token))
      .send({ code, purchase_amount: 3 }); // bill smaller than the voucher
    expect(res.status).toBe(200);
    expect(res.body.data.discount).toBeCloseTo(3, 2);
    expect(res.body.data.final_amount).toBeCloseTo(0, 2);
  });

  it('refuses an unverified merchant and a non-merchant', async () => {
    const { code } = await issuedClaimed(100);
    const unverified = await makeUser('merchant');
    expect((await request.post(`${VOUCHERS}/redeem`).set(auth(unverified.token)).send({ code })).status).toBe(403);

    const endUser = await makeUser();
    const { code: code2 } = await issuedClaimed(100);
    expect((await request.post(`${VOUCHERS}/redeem`).set(auth(endUser.token)).send({ code: code2 })).status).toBe(403);
  });

  it('cannot redeem an unclaimed voucher or redeem twice', async () => {
    const merchant = await verifiedMerchant();
    const sender = await makeUser();
    await fund(sender.id, 400);
    const code = (await issue(sender, 100)).body.data.code; // issued, not claimed
    expect((await request.post(`${VOUCHERS}/redeem`).set(auth(merchant.token)).send({ code })).status).toBe(409);

    const { code: claimedCode } = await issuedClaimed(100);
    expect((await request.post(`${VOUCHERS}/redeem`).set(auth(merchant.token)).send({ code: claimedCode })).status).toBe(200);
    expect((await request.post(`${VOUCHERS}/redeem`).set(auth(merchant.token)).send({ code: claimedCode })).status).toBe(409);
  });
});

describe('voucher expiry refunds the issuer (value conservation)', () => {
  beforeAll(async () => await connectTestDb());
  beforeEach(async () => {
    await resetTestDb();
    seq = 0;
  });
  afterAll(async () => await closeTestDb());

  it('lapses an expired unclaimed voucher and returns the tokens, once', async () => {
    const sender = await makeUser();
    await fund(sender.id, 200); // $10
    await issue(sender, 100); // debit $5 → balance $5
    expect(await balance(sender.id)).toBeCloseTo(5, 2);

    // Force expiry into the past.
    await DiscountVoucher.updateMany({}, { $set: { expires_at: new Date(Date.now() - 1000) } });

    const n = await expireVouchers();
    expect(n).toBe(1);
    // The issuer is made whole.
    expect(await balance(sender.id)).toBeCloseTo(10, 2);
    const voucher = await DiscountVoucher.findOne({}).lean();
    expect(voucher!.status).toBe('expired');

    // Idempotent — a second sweep must not refund again.
    expect(await expireVouchers()).toBe(0);
    expect(await balance(sender.id)).toBeCloseTo(10, 2);
  });
});
