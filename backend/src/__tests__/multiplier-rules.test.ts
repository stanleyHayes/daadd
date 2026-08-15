import { Ad, Campaign, User, PlatformSetting, Reward, UserRole } from '../models';
import { generateToken } from '../middleware/auth';
import {
  sanitizeMultiplierRules,
  effectiveMultiplier,
  getMultiplierRules,
  DEFAULT_MULTIPLIER_RULES,
  MULTIPLIER_RULES_KEY,
  MAX_STREAK_MULTIPLIER,
  MAX_VIP_MULTIPLIER,
  MAX_EFFECTIVE_MULTIPLIER,
} from '../utils/multiplier-rules';
import { request, connectTestDb, resetTestDb, closeTestDb } from '../test-helpers';

const ADMIN = '/api/v1/admin';
const REWARDS = '/api/v1/rewards';

// ---------------------------------------------------------------------------
// Unit: sanitising + clamping (the abuse guard)
// ---------------------------------------------------------------------------

describe('sanitizeMultiplierRules', () => {
  it('clamps each streak multiplier to the hard ceiling', () => {
    const r = sanitizeMultiplierRules({ streak_tiers: [{ min: 5, multiplier: 100 }] });
    expect(r.streak_tiers[0].multiplier).toBe(MAX_STREAK_MULTIPLIER);
  });

  it('clamps the VIP multiplier to the hard ceiling', () => {
    expect(sanitizeMultiplierRules({ vip_multiplier: 50 }).vip_multiplier).toBe(MAX_VIP_MULTIPLIER);
    expect(sanitizeMultiplierRules({ vip_multiplier: 0 }).vip_multiplier).toBe(1); // floor
  });

  it('sorts tiers highest-min-first and dedupes by min', () => {
    const r = sanitizeMultiplierRules({
      streak_tiers: [
        { min: 3, multiplier: 1.25 },
        { min: 30, multiplier: 2 },
        { min: 3, multiplier: 1.5 }, // duplicate min — last wins
        { min: 7, multiplier: 1.5 },
      ],
    });
    expect(r.streak_tiers.map((t) => t.min)).toEqual([30, 7, 3]);
    expect(r.streak_tiers.find((t) => t.min === 3)!.multiplier).toBe(1.5);
  });

  it('floors min to at least 1 and bonus_threshold to at least 1', () => {
    const r = sanitizeMultiplierRules({ streak_tiers: [{ min: 0, multiplier: 2 }], bonus_threshold: 0 });
    expect(r.streak_tiers[0].min).toBe(1);
    expect(r.bonus_threshold).toBe(1);
  });

  it('falls back to defaults for an empty or malformed tier list', () => {
    expect(sanitizeMultiplierRules({ streak_tiers: [] }).streak_tiers).toEqual(
      DEFAULT_MULTIPLIER_RULES.streak_tiers
    );
    expect(sanitizeMultiplierRules(undefined).streak_tiers).toEqual(
      DEFAULT_MULTIPLIER_RULES.streak_tiers
    );
  });
});

describe('effectiveMultiplier', () => {
  it('passes a product within the ceiling through unchanged', () => {
    expect(effectiveMultiplier(2, 1.25)).toBeCloseTo(2.5);
  });
  it('clamps the product to the hard effective ceiling', () => {
    expect(effectiveMultiplier(MAX_STREAK_MULTIPLIER, MAX_VIP_MULTIPLIER)).toBe(MAX_EFFECTIVE_MULTIPLIER);
    expect(effectiveMultiplier(100, 100)).toBe(MAX_EFFECTIVE_MULTIPLIER);
  });
  it('never drops below 1', () => {
    expect(effectiveMultiplier(0, 0)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// DB + routes
// ---------------------------------------------------------------------------

// Mint users directly (not via /register) so this suite never draws on the
// auth rate-limit budget shared across the whole test process.
let seq = 0;
async function makeUser(role: UserRole = 'end_user') {
  seq += 1;
  const email = `mult-user-${seq}@example.com`;
  const u = await User.create({ name: `Mult User ${seq}`, email, password_hash: 'x' });
  if (role !== 'end_user') await User.findByIdAndUpdate(u._id, { role });
  return { id: String(u._id), token: generateToken({ userId: String(u._id), email, role }), email };
}
const registerCustomer = () => makeUser('end_user');
const registerAdmin = () => makeUser('admin');

describe('getMultiplierRules (DB)', () => {
  beforeAll(async () => await connectTestDb());
  afterEach(async () => await resetTestDb());
  afterAll(async () => await closeTestDb());

  it('returns defaults when unset', async () => {
    expect(await getMultiplierRules()).toEqual(DEFAULT_MULTIPLIER_RULES);
  });

  it('re-sanitises a maliciously stored value on read', async () => {
    // Poison the store directly, bypassing the PUT handler's sanitisation.
    await PlatformSetting.create({
      key: MULTIPLIER_RULES_KEY,
      value: { streak_tiers: [{ min: 1, multiplier: 100 }], vip_multiplier: 100, bonus_threshold: 1 },
    });
    const rules = await getMultiplierRules();
    expect(rules.streak_tiers[0].multiplier).toBe(MAX_STREAK_MULTIPLIER);
    expect(rules.vip_multiplier).toBe(MAX_VIP_MULTIPLIER);
  });
});

describe('admin multiplier-rules routes', () => {
  let admin: { token: string };

  beforeAll(async () => await connectTestDb());
  beforeEach(async () => {
    await resetTestDb();
    seq = 0;
    admin = await registerAdmin();
  });
  afterAll(async () => await closeTestDb());

  it('returns rules, defaults, and the hard limits', async () => {
    const res = await request.get(`${ADMIN}/multiplier-rules`).set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.rules).toEqual(DEFAULT_MULTIPLIER_RULES);
    expect(res.body.data.limits.max_effective_multiplier).toBe(MAX_EFFECTIVE_MULTIPLIER);
  });

  it('clamps a malicious update before persisting it', async () => {
    const res = await request
      .put(`${ADMIN}/multiplier-rules`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ streak_tiers: [{ min: 1, multiplier: 999 }], vip_multiplier: 999 });
    expect(res.status).toBe(200);
    expect(res.body.data.rules.streak_tiers[0].multiplier).toBe(MAX_STREAK_MULTIPLIER);
    expect(res.body.data.rules.vip_multiplier).toBe(MAX_VIP_MULTIPLIER);

    const stored = await getMultiplierRules();
    expect(stored.streak_tiers[0].multiplier).toBe(MAX_STREAK_MULTIPLIER);
  });

  it('forbids non-admins', async () => {
    const customer = await registerCustomer();
    expect(
      (await request.get(`${ADMIN}/multiplier-rules`).set('Authorization', `Bearer ${customer.token}`)).status
    ).toBe(403);
    expect(
      (await request.put(`${ADMIN}/multiplier-rules`).set('Authorization', `Bearer ${customer.token}`).send({})).status
    ).toBe(403);
  });
});

describe('reward claim respects the multiplier ceiling', () => {
  beforeAll(async () => await connectTestDb());
  beforeEach(async () => {
    await resetTestDb();
    seq = 0;
  });
  afterAll(async () => await closeTestDb());

  it('caps minted tokens even when the stored config is absurd', async () => {
    // A poisoned config: 100x streak, 100x VIP. Even so, the claim must mint at
    // most base × MAX_EFFECTIVE_MULTIPLIER, never 100×100.
    await PlatformSetting.create({
      key: MULTIPLIER_RULES_KEY,
      value: { streak_tiers: [{ min: 1, multiplier: 100 }], vip_multiplier: 100, bonus_threshold: 1 },
    });

    const advertiser = await registerCustomer();
    await User.findByIdAndUpdate(advertiser.id, { role: 'advertiser' });
    const campaign = await Campaign.create({
      name: 'Ceiling Campaign',
      industry: 'retail',
      owner: advertiser.id,
      status: 'active',
      reward_per_view: 10, // 10 base tokens per view
      max_tokens: 0, // uncapped pool, so only the multiplier ceiling bounds the mint
    });
    const ad = await Ad.create({
      title: 'Ceiling Ad',
      brand: 'Brand',
      industry: 'retail',
      campaign_id: campaign._id,
      reward_amount: 0.5,
    });

    const customer = await registerCustomer();
    // A fresh claim gives streak = 1 (qualifies for the min:1 tier); make them VIP
    // so the VIP multiplier is exercised too.
    await User.findByIdAndUpdate(customer.id, { vip_tier: 'vip' });

    const res = await request.post(`${REWARDS}/claim/${ad._id}`).set('Authorization', `Bearer ${customer.token}`);
    expect(res.status).toBe(201);

    // effective = min(clamp(100,·,5) × clamp(100,·,3), 10) = 10.
    // tokens = 10 base × 10 = 100 → $5.00. Never 10 × 100 × 100.
    expect(res.body.data.amount).toBeCloseTo(10 * MAX_EFFECTIVE_MULTIPLIER * 0.05, 2);

    const reward = await Reward.findOne({ user_id: customer.id, type: 'ad_reward' }).lean();
    expect(reward!.amount).toBeCloseTo(5, 2);
  });
});
