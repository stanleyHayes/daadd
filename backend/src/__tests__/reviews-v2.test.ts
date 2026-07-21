import { Campaign, Review, Reward, User } from '../models';
import { generateToken } from '../middleware/auth';
import { request, connectTestDb, resetTestDb, closeTestDb } from '../test-helpers';

const AUTH = '/api/v1/auth';
const REVIEWS = '/api/v1/reviews';
const TOKEN_VALUE = 0.05;
const REVIEW_REWARD_TOKENS = 3;
const REVIEW_PHOTO_BONUS_TOKENS = 2;

let seq = 0;

async function registerUser(role?: string) {
  seq += 1;
  const email = `rv2-user-${seq}@example.com`;
  const res = await request.post(`${AUTH}/register`).send({
    name: `RV2 User ${seq}`,
    email,
    password: 'super-secret-password',
  });
  const id = String(res.body.data.user.id);
  if (role) {
    await User.findByIdAndUpdate(id, { role });
    return { id, email, token: generateToken({ userId: id, email, role }) };
  }
  return { id, email, token: res.body.data.token };
}

async function seedCampaign(ownerId: string) {
  return Campaign.create({ name: 'RV2 Campaign', industry: 'retail', owner: ownerId });
}

/** Sum of the user's review-reward tokens, derived from the dollar ledger. */
async function reviewTokens(userId: string): Promise<number> {
  const rows = await Reward.find({ user_id: userId, type: 'review_reward' }).lean();
  return Math.round(rows.reduce((n, r) => n + (r.amount || 0), 0) / TOKEN_VALUE);
}

describe('reviews v2 — expectations, reality, moderation', () => {
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

  it('records before-visit expectations without counting as a rating', async () => {
    const advertiser = await registerUser('advertiser');
    const campaign = await seedCampaign(advertiser.id);
    const customer = await registerUser();

    const res = await request
      .post(`${REVIEWS}/expectations`)
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ campaign_id: String(campaign._id), experience: 5, service: 4, product: 5, planned_purchase: 'Coffee' });
    expect(res.status).toBe(201);
    expect(res.body.data.rating).toBe(0);
    expect(res.body.data.expectation.experience).toBe(5);

    // An expectations-only row must not skew the campaign's average rating.
    const summary = await request.get(`${REVIEWS}/campaign/${campaign._id}/summary`);
    expect(summary.body.data.totalReviews).toBe(0);
  });

  it('completes the expectation row with the after-visit review (no false duplicate)', async () => {
    const advertiser = await registerUser('advertiser');
    const campaign = await seedCampaign(advertiser.id);
    const customer = await registerUser();

    await request
      .post(`${REVIEWS}/expectations`)
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ campaign_id: String(campaign._id), experience: 5 });

    const reviewed = await request
      .post(REVIEWS)
      .set('Authorization', `Bearer ${customer.token}`)
      .send({
        campaign_id: String(campaign._id),
        rating: 4,
        comment: 'Good but busy',
        satisfaction: 4,
        product_rating: 5,
        service_rating: 3,
        reality_experience: 3,
      });
    expect(reviewed.status).toBe(201);

    const stored = await Review.findOne({ campaign_id: campaign._id, user: customer.id }).lean();
    // Expectation is preserved alongside the recorded reality.
    expect(stored?.expectation?.experience).toBe(5);
    expect(stored?.reality?.experience).toBe(3);
    expect(stored?.reality?.product).toBe(5);
    expect(stored?.rating).toBe(4);

    const summary = await request.get(`${REVIEWS}/campaign/${campaign._id}/summary`);
    expect(summary.body.data.totalReviews).toBe(1);
  });

  it('still rejects a second real review for the same campaign', async () => {
    const advertiser = await registerUser('advertiser');
    const campaign = await seedCampaign(advertiser.id);
    const customer = await registerUser();

    const first = await request
      .post(REVIEWS)
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ campaign_id: String(campaign._id), rating: 5 });
    expect(first.status).toBe(201);

    const second = await request
      .post(REVIEWS)
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ campaign_id: String(campaign._id), rating: 1 });
    expect(second.status).toBe(409);
  });

  it('grants only the base tokens up front, holding the media bonus for moderation', async () => {
    const advertiser = await registerUser('advertiser');
    const campaign = await seedCampaign(advertiser.id);
    const customer = await registerUser();
    const admin = await registerUser('admin');

    await request
      .post(REVIEWS)
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ campaign_id: String(campaign._id), rating: 5, photo_url: 'https://cdn.test/p.jpg' });

    // Base tokens only while the media is pending.
    expect(await reviewTokens(customer.id)).toBe(REVIEW_REWARD_TOKENS);
    const pendingRow = await Review.findOne({ campaign_id: campaign._id }).lean();
    expect(pendingRow?.media_status).toBe('pending');

    const queue = await request.get(`${REVIEWS}/moderation`).set('Authorization', `Bearer ${admin.token}`);
    expect(queue.body.data).toHaveLength(1);

    const approved = await request
      .post(`${REVIEWS}/${pendingRow!._id}/moderate`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ approve: true });
    expect(approved.status).toBe(200);
    expect(await reviewTokens(customer.id)).toBe(REVIEW_REWARD_TOKENS + REVIEW_PHOTO_BONUS_TOKENS);

    // Re-approving must not pay the bonus twice.
    const again = await request
      .post(`${REVIEWS}/${pendingRow!._id}/moderate`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ approve: true });
    expect(again.status).toBe(409);
    expect(await reviewTokens(customer.id)).toBe(REVIEW_REWARD_TOKENS + REVIEW_PHOTO_BONUS_TOKENS);
  });

  it('rejects media without paying a bonus, and forbids non-admin moderation', async () => {
    const advertiser = await registerUser('advertiser');
    const campaign = await seedCampaign(advertiser.id);
    const customer = await registerUser();
    const admin = await registerUser('admin');

    await request
      .post(REVIEWS)
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ campaign_id: String(campaign._id), rating: 5, photo_url: 'https://cdn.test/bad.jpg' });
    const row = await Review.findOne({ campaign_id: campaign._id }).lean();

    const forbidden = await request
      .post(`${REVIEWS}/${row!._id}/moderate`)
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ approve: true });
    expect(forbidden.status).toBe(403);

    const rejected = await request
      .post(`${REVIEWS}/${row!._id}/moderate`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ approve: false });
    expect(rejected.status).toBe(200);

    const after = await Review.findById(row!._id).lean();
    expect(after?.media_status).toBe('rejected');
    expect(after?.photo_url).toBe('');
    expect(await reviewTokens(customer.id)).toBe(REVIEW_REWARD_TOKENS);
  });
});
