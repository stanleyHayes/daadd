import { User } from '../models';
import { generateToken } from '../middleware/auth';
import { multiplierForStreak, advanceStreak, bumpStreak } from '../utils/streak';
import { engagementScore, qualifiesForVip, DEFAULT_VIP_CRITERIA } from '../utils/vip';
import { request, connectTestDb, resetTestDb, closeTestDb } from '../test-helpers';

const AUTH = '/api/v1/auth';
const REWARDS = '/api/v1/rewards';
const ADMIN = '/api/v1/admin';

let seq = 0;

async function registerUser(role?: string) {
  seq += 1;
  const email = `loyalty-user-${seq}@example.com`;
  const res = await request.post(`${AUTH}/register`).send({
    name: `Loyalty User ${seq}`,
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

describe('streak tiers (unit)', () => {
  it('awards progressively larger multipliers', () => {
    expect(multiplierForStreak(0)).toBe(1);
    expect(multiplierForStreak(2)).toBe(1);
    expect(multiplierForStreak(3)).toBe(1.25);
    expect(multiplierForStreak(7)).toBe(1.5);
    expect(multiplierForStreak(14)).toBe(1.75);
    expect(multiplierForStreak(30)).toBe(2);
    expect(multiplierForStreak(365)).toBe(2);
  });

  it('extends on consecutive days, holds same-day and resets after a gap', () => {
    const day1 = new Date('2026-03-01T10:00:00Z');
    const day2 = new Date('2026-03-02T10:00:00Z');
    const day5 = new Date('2026-03-05T10:00:00Z');

    const first = advanceStreak({}, day1);
    expect(first.streak_count).toBe(1);

    const sameDay = advanceStreak(
      { streak_count: first.streak_count, last_reward_date: day1 },
      new Date('2026-03-01T23:00:00Z')
    );
    expect(sameDay.streak_count).toBe(1);

    const next = advanceStreak({ streak_count: 1, last_reward_date: day1 }, day2);
    expect(next.streak_count).toBe(2);

    const afterGap = advanceStreak({ streak_count: 2, last_reward_date: day2 }, day5);
    expect(afterGap.streak_count).toBe(1);
  });

  it('tracks each activity streak independently', () => {
    const user: any = {};
    bumpStreak(user, 'ad', new Date('2026-03-01T10:00:00Z'));
    bumpStreak(user, 'ad', new Date('2026-03-02T10:00:00Z'));
    bumpStreak(user, 'review', new Date('2026-03-02T10:00:00Z'));

    expect(user.streaks.ad.count).toBe(2);
    expect(user.streaks.review.count).toBe(1);
    expect(user.streaks.merchant).toBeUndefined();
  });
});

describe('VIP qualification (unit)', () => {
  const engaged = {
    merchant_visits: 4,
    purchases: 6,
    reviews: 3,
    ads_viewed: 20,
    longest_streak: 5,
  };

  it('scores real-world actions above passive views', () => {
    expect(engagementScore(engaged)).toBe(4 * 5 + 6 * 5 + 3 * 4 + 20 + 5 * 2);
  });

  it('qualifies an engaged user and rejects a passive one', () => {
    expect(qualifiesForVip(engaged, DEFAULT_VIP_CRITERIA)).toBe(true);
    const passive = { merchant_visits: 0, purchases: 0, reviews: 0, ads_viewed: 500, longest_streak: 0 };
    // A high score alone must not qualify when the activity minimums are unmet.
    expect(qualifiesForVip(passive, DEFAULT_VIP_CRITERIA)).toBe(false);
  });
});

describe('loyalty routes', () => {
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

  it('returns per-activity streaks with their multipliers', async () => {
    const user = await registerUser();
    await User.findByIdAndUpdate(user.id, {
      streak_count: 7,
      streaks: { ad: { count: 14, last_at: new Date() } },
    });

    const res = await request.get(`${REWARDS}/streak`).set('Authorization', `Bearer ${user.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.bonus_multiplier).toBe(1.5); // 7-day daily streak
    expect(res.body.data.streaks.ad.count).toBe(14);
    expect(res.body.data.streaks.ad.multiplier).toBe(1.75);
    expect(res.body.data.tiers.length).toBeGreaterThan(0);
  });

  it('serves each leaderboard type without error', async () => {
    const user = await registerUser();
    for (const type of ['earner', 'active', 'reviews', 'visits', 'streak']) {
      const res = await request
        .get(`${REWARDS}/leaderboard?type=${type}&period=week`)
        .set('Authorization', `Bearer ${user.token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    }
  });

  it('ranks the longest-streak board by current streak', async () => {
    const a = await registerUser();
    const b = await registerUser();
    await User.findByIdAndUpdate(a.id, { streak_count: 3 });
    await User.findByIdAndUpdate(b.id, { streak_count: 9 });

    const res = await request
      .get(`${REWARDS}/leaderboard?type=streak`)
      .set('Authorization', `Bearer ${a.token}`);
    expect(res.body.data[0].user_id).toBe(b.id);
    expect(res.body.data[0].value).toBe(9);
  });

  it('reports VIP status and criteria for a fresh user', async () => {
    const user = await registerUser();
    const res = await request.get(`${REWARDS}/vip`).set('Authorization', `Bearer ${user.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.tier).toBe('none');
    expect(res.body.data.multiplier).toBe(1);
    expect(res.body.data.criteria.min_reviews).toBe(DEFAULT_VIP_CRITERIA.min_reviews);
  });

  it('lets an admin retune the VIP criteria but forbids everyone else', async () => {
    const admin = await registerUser('admin');
    const customer = await registerUser();

    const forbidden = await request
      .put(`${ADMIN}/vip-criteria`)
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ min_reviews: 99 });
    expect(forbidden.status).toBe(403);

    const updated = await request
      .put(`${ADMIN}/vip-criteria`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ min_reviews: 7, min_engagement_score: 120 });
    expect(updated.status).toBe(200);
    expect(updated.body.data.criteria.min_reviews).toBe(7);

    // The new criteria must be what the VIP endpoint evaluates against.
    const vip = await request.get(`${REWARDS}/vip`).set('Authorization', `Bearer ${customer.token}`);
    expect(vip.body.data.criteria.min_reviews).toBe(7);
    expect(vip.body.data.criteria.min_engagement_score).toBe(120);
  });
});
