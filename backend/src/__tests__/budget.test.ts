import { Ad, Campaign, User } from '../models';
import { generateToken } from '../middleware/auth';
import { request, connectTestDb, resetTestDb, closeTestDb } from '../test-helpers';

const AUTH = '/api/v1/auth';
const REWARDS = '/api/v1/rewards';
const CAMPAIGNS = '/api/v1/campaigns';

let seq = 0;

async function registerCustomer() {
  seq += 1;
  const email = `budget-user-${seq}@example.com`;
  const res = await request.post(`${AUTH}/register`).send({
    name: `Budget User ${seq}`,
    email,
    password: 'super-secret-password',
  });
  return { id: String(res.body.data.user.id), token: res.body.data.token, email };
}

async function registerAdvertiser() {
  const u = await registerCustomer();
  await User.findByIdAndUpdate(u.id, { role: 'advertiser' });
  return { ...u, token: generateToken({ userId: u.id, email: u.email, role: 'advertiser' }) };
}

/** A campaign with an explicit token pool + per-view grant, and one ad on it. */
async function seedCampaignWithAd(ownerId: string, overrides: Record<string, unknown> = {}) {
  const campaign = await Campaign.create({
    name: 'Budget Campaign',
    industry: 'retail',
    owner: ownerId,
    status: 'active',
    reward_per_view: 10,
    max_tokens: 25,
    ...overrides,
  });
  const ad = await Ad.create({
    title: 'Budget Ad',
    brand: 'Budget Brand',
    industry: 'retail',
    campaign_id: campaign._id,
    reward_amount: 0.5,
  });
  return { campaign, ad };
}

describe('campaign reward budget', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
    seq = 0;
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it('grants the campaign-configured tokens and tracks them against the pool', async () => {
    const advertiser = await registerAdvertiser();
    const { campaign, ad } = await seedCampaignWithAd(advertiser.id);
    const customer = await registerCustomer();

    const res = await request
      .post(`${REWARDS}/claim/${ad._id}`)
      .set('Authorization', `Bearer ${customer.token}`);
    expect(res.status).toBe(201);
    // 10 tokens x $0.05 = $0.50 credited in the dollar-denominated ledger.
    expect(res.body.data.amount).toBeCloseTo(0.5, 2);

    const after = await Campaign.findById(campaign._id).lean();
    expect(after?.tokens_issued).toBe(10);
  });

  it('refuses the claim and auto-pauses the campaign once the pool is exhausted', async () => {
    const advertiser = await registerAdvertiser();
    // Pool of 25 with 10 per view: two claims fit, the third must not.
    const { campaign, ad } = await seedCampaignWithAd(advertiser.id);

    const a = await registerCustomer();
    const b = await registerCustomer();
    const c = await registerCustomer();

    const first = await request.post(`${REWARDS}/claim/${ad._id}`).set('Authorization', `Bearer ${a.token}`);
    const second = await request.post(`${REWARDS}/claim/${ad._id}`).set('Authorization', `Bearer ${b.token}`);
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);

    const third = await request.post(`${REWARDS}/claim/${ad._id}`).set('Authorization', `Bearer ${c.token}`);
    expect(third.status).toBe(409);
    expect(third.body.message).toMatch(/exhausted/i);

    const after = await Campaign.findById(campaign._id).lean();
    expect(after?.tokens_issued).toBe(20); // never exceeds the 25 cap
    expect(after?.status).toBe('paused'); // auto-paused
  });

  it('treats max_tokens = 0 as an uncapped pool', async () => {
    const advertiser = await registerAdvertiser();
    const { campaign, ad } = await seedCampaignWithAd(advertiser.id, { max_tokens: 0 });
    const customer = await registerCustomer();

    const res = await request
      .post(`${REWARDS}/claim/${ad._id}`)
      .set('Authorization', `Bearer ${customer.token}`);
    expect(res.status).toBe(201);

    const after = await Campaign.findById(campaign._id).lean();
    expect(after?.status).toBe('active');
  });

  it('tops up the pool and clears the low-budget warning flag', async () => {
    const advertiser = await registerAdvertiser();
    const { campaign } = await seedCampaignWithAd(advertiser.id);
    await Campaign.findByIdAndUpdate(campaign._id, { budget_alert_sent: true });

    const res = await request
      .post(`${CAMPAIGNS}/${campaign._id}/top-up`)
      .set('Authorization', `Bearer ${advertiser.token}`)
      .send({ tokens: 100, budget: 50 });
    expect(res.status).toBe(200);
    expect(res.body.data.max_tokens).toBe(125);

    const after = await Campaign.findById(campaign._id).lean();
    expect(after?.budget_alert_sent).toBe(false);
    expect(after?.budget_total).toBe(50);
  });

  it('rejects an empty top-up and another advertiser topping up your campaign', async () => {
    const advertiser = await registerAdvertiser();
    const { campaign } = await seedCampaignWithAd(advertiser.id);

    const empty = await request
      .post(`${CAMPAIGNS}/${campaign._id}/top-up`)
      .set('Authorization', `Bearer ${advertiser.token}`)
      .send({ tokens: 0, budget: 0 });
    expect(empty.status).toBe(400);

    const outsider = await registerAdvertiser();
    const foreign = await request
      .post(`${CAMPAIGNS}/${campaign._id}/top-up`)
      .set('Authorization', `Bearer ${outsider.token}`)
      .send({ tokens: 10 });
    expect(foreign.status).toBe(404);
  });
});
