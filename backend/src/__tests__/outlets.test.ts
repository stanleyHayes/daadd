import { User } from '../models';
import { generateToken } from '../middleware/auth';
import { request, connectTestDb, resetTestDb, closeTestDb } from '../test-helpers';

const AUTH = '/api/v1/auth';
const OUTLETS = '/api/v1/outlets';
const REDEMPTION = '/api/v1/redemption';

interface TestUser {
  id: string;
  token: string;
  email: string;
}

let userSeq = 0;

async function registerAdvertiser(): Promise<TestUser> {
  userSeq += 1;
  const email = `outlet-user-${userSeq}@example.com`;
  const res = await request.post(`${AUTH}/register`).send({
    name: `Outlet User ${userSeq}`,
    email,
    password: 'super-secret-password',
  });
  if (res.status !== 201) throw new Error(`register failed: ${JSON.stringify(res.body)}`);
  const id = String(res.body.data.user.id);
  await User.findByIdAndUpdate(id, { role: 'advertiser' });
  return { id, email, token: generateToken({ userId: id, email, role: 'advertiser' }) };
}

function createOutlet(user: TestUser, body: Record<string, unknown>) {
  return request.post(OUTLETS).set('Authorization', `Bearer ${user.token}`).send(body);
}

describe('outlets routes', () => {
  let advertiser: TestUser;

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
    userSeq = 0;
    advertiser = await registerAdvertiser();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it('requires authentication to create an outlet', async () => {
    const res = await request.post(OUTLETS).send({ name: 'Osu Branch' });
    expect(res.status).toBe(401);
  });

  it('rejects an outlet without a name', async () => {
    const res = await createOutlet(advertiser, { city: 'Accra' });
    expect(res.status).toBe(400);
  });

  it('creates and lists the advertiser own outlets', async () => {
    const created = await createOutlet(advertiser, { name: 'Osu Branch', city: 'Accra' });
    expect(created.status).toBe(201);
    expect(created.body.data.name).toBe('Osu Branch');
    // owner must be server-set, never taken from the body
    expect(created.body.data.owner).toBe(advertiser.id);

    const list = await request.get(OUTLETS).set('Authorization', `Bearer ${advertiser.token}`);
    expect(list.body.data).toHaveLength(1);
  });

  it('ignores a client-supplied owner (no mass assignment)', async () => {
    const other = await registerAdvertiser();
    const created = await createOutlet(advertiser, { name: 'Spoofed', owner: other.id });
    expect(created.status).toBe(201);
    expect(created.body.data.owner).toBe(advertiser.id);
  });

  it("forbids editing or deleting another advertiser's outlet", async () => {
    const mine = await createOutlet(advertiser, { name: 'Mine' });
    const outsider = await registerAdvertiser();

    const patched = await request
      .patch(`${OUTLETS}/${mine.body.data.id}`)
      .set('Authorization', `Bearer ${outsider.token}`)
      .send({ name: 'Hijacked' });
    expect(patched.status).toBe(404);

    const deleted = await request
      .delete(`${OUTLETS}/${mine.body.data.id}`)
      .set('Authorization', `Bearer ${outsider.token}`);
    expect(deleted.status).toBe(404);
  });

  it('exposes only ACTIVE outlets on the public advertiser listing', async () => {
    await createOutlet(advertiser, { name: 'Open Branch' });
    const hidden = await createOutlet(advertiser, { name: 'Closed Branch' });
    await request
      .patch(`${OUTLETS}/${hidden.body.data.id}`)
      .set('Authorization', `Bearer ${advertiser.token}`)
      .send({ is_active: false });

    const publicList = await request.get(`${OUTLETS}/advertiser/${advertiser.id}`);
    expect(publicList.status).toBe(200);
    expect(publicList.body.data.map((o: any) => o.name)).toEqual(['Open Branch']);
  });
});

describe('purchase history', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
    userSeq = 0;
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it('requires authentication', async () => {
    const res = await request.get(`${REDEMPTION}/history`);
    expect(res.status).toBe(401);
  });

  it('returns an empty history for a user with no completed redemptions', async () => {
    const user = await registerAdvertiser();
    const res = await request.get(`${REDEMPTION}/history`).set('Authorization', `Bearer ${user.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});
