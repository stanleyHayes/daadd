import { Campaign, User } from '../models';
import type { UserRole } from '../models/User';
import { generateToken } from '../middleware/auth';
import { request, connectTestDb, resetTestDb, closeTestDb } from '../test-helpers';

const REVIEWS = '/api/v1/reviews';
const BENCHMARKS = '/api/v1/benchmarks';

let seq = 0;

async function makeUser(role: UserRole = 'end_user') {
  seq += 1;
  const user = await User.create({
    name: `RB User ${seq}`,
    email: `rb-user-${seq}@example.com`,
    password_hash: 'irrelevant-in-tests',
    role,
  });
  const token = generateToken({ userId: user._id.toString(), email: user.email, role: user.role });
  return { id: user._id.toString(), token };
}

async function makeCampaign(ownerId: string, industry = 'technology') {
  const campaign = await Campaign.create({ name: 'Benchmark Campaign', industry, owner: ownerId });
  return campaign._id.toString();
}

describe('reviews + benchmarks guards', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it('allows one review per user per campaign, then 409s on duplicates', async () => {
    const user = await makeUser();
    const campaignId = await makeCampaign(user.id);

    const first = await request
      .post(REVIEWS)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ campaign_id: campaignId, rating: 5, comment: 'Great' });
    expect(first.status).toBe(201);

    const second = await request
      .post(REVIEWS)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ campaign_id: campaignId, rating: 1, comment: 'Changed my mind' });
    expect(second.status).toBe(409);
  });

  it('rejects reviews with a malformed campaign id', async () => {
    const user = await makeUser();
    const res = await request
      .post(REVIEWS)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ campaign_id: 'not-an-object-id', rating: 3 });
    expect(res.status).toBe(400);
  });

  it('gates benchmark aggregates below 3 advertisers in the industry', async () => {
    const owner = await makeUser('advertiser');
    const campaignId = await makeCampaign(owner.id);

    const res = await request
      .get(`${BENCHMARKS}/${campaignId}`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.gated).toBe(true);
    expect(res.body.data.comparisons).toEqual([]);
    expect(res.body.data.advertiser_count).toBe(1);
  });

  it('returns benchmark aggregates once 3+ advertisers are in the industry', async () => {
    const owners = await Promise.all([
      makeUser('advertiser'),
      makeUser('advertiser'),
      makeUser('advertiser'),
    ]);
    const campaignId = await makeCampaign(owners[0].id);
    await makeCampaign(owners[1].id);
    await makeCampaign(owners[2].id);

    const res = await request
      .get(`${BENCHMARKS}/${campaignId}`)
      .set('Authorization', `Bearer ${owners[0].token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.gated).toBeUndefined();
    expect(res.body.data.advertiser_count).toBe(3);
    expect(res.body.data.comparisons.length).toBeGreaterThan(0);
  });
});
