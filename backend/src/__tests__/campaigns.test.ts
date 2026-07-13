import { Campaign } from '../models';
import { request, connectTestDb, resetTestDb, closeTestDb } from '../test-helpers';

const AUTH = '/api/v1/auth';
const CAMPAIGNS = '/api/v1/campaigns';

describe('campaign routes (localized targeting rules, spec §4.8)', () => {
  let token: string;

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
    const res = await request.post(`${AUTH}/register`).send({
      name: 'Advertiser',
      email: 'campaigns-test@example.com',
      password: 'super-secret-password',
      role: 'advertiser',
    });
    token = res.body.data.token;
  });

  afterAll(async () => {
    await closeTestDb();
  });

  const localizedBase = {
    name: 'Localized Campaign',
    industry: 'Retail',
    localized: true,
    regions: ['US'],
    languages: ['en'],
  };

  it('rejects localized targeting with a budget below $500', async () => {
    const res = await request
      .post(CAMPAIGNS)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...localizedBase, budget: 499 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/\$500/);
    expect(await Campaign.countDocuments()).toBe(0);
  });

  it('accepts localized targeting with a budget of exactly $500', async () => {
    const res = await request
      .post(CAMPAIGNS)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...localizedBase, budget: 500 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.budget_total).toBe(500);
    expect(res.body.data.targeting_config.localized).toBe(true);
    expect(res.body.data.targeting_config.regions).toEqual(['US']);
    expect(res.body.data.targeting_config.languages).toEqual(['en']);
  });

  it('rejects localized targeting without regions', async () => {
    const res = await request
      .post(CAMPAIGNS)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...localizedBase, regions: [], budget: 500 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/region/i);
  });

  it('rejects localized targeting without languages', async () => {
    const res = await request
      .post(CAMPAIGNS)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...localizedBase, languages: [], budget: 500 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/language/i);
  });

  it('rejects a non-3-letter currency code', async () => {
    const res = await request
      .post(CAMPAIGNS)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...localizedBase, budget: 500, currency: 'US' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/currency/i);
  });

  it('creates a plain (non-localized) campaign with any budget', async () => {
    const res = await request
      .post(CAMPAIGNS)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Plain Campaign', industry: 'Tech', budget_total: 50 });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Plain Campaign');
    expect(res.body.data.budget_total).toBe(50);
    expect(res.body.data.targeting_config).toBeNull();
  });

  it('requires authentication', async () => {
    const res = await request
      .post(CAMPAIGNS)
      .send({ name: 'Plain Campaign', industry: 'Tech', budget_total: 50 });

    expect(res.status).toBe(401);
  });
});
