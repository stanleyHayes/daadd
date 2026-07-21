import { User } from '../models';
import { generateToken } from '../middleware/auth';
import { request, connectTestDb, resetTestDb, closeTestDb } from '../test-helpers';

const AUTH = '/api/v1/auth';
const SUPPORT = '/api/v1/support';

let seq = 0;

async function registerUser(role?: string) {
  seq += 1;
  const email = `support-user-${seq}@example.com`;
  const res = await request.post(`${AUTH}/register`).send({
    name: `Support User ${seq}`,
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

describe('support centre', () => {
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

  it('serves the FAQ without authentication', async () => {
    const res = await request.get(`${SUPPORT}/faq`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('q');
  });

  it('accepts a ticket from a signed-out visitor', async () => {
    const res = await request.post(`${SUPPORT}/tickets`).send({
      name: 'Ama',
      email: 'ama@example.com',
      category: 'fraud',
      subject: 'Suspicious merchant',
      message: 'A merchant scanned my code twice.',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.category).toBe('fraud');
    expect(res.body.data.status).toBe('open');
    expect(res.body.data.user_id).toBeUndefined();
  });

  it('validates the email, subject and message', async () => {
    const badEmail = await request
      .post(`${SUPPORT}/tickets`)
      .send({ email: 'not-an-email', subject: 'x', message: 'y' });
    expect(badEmail.status).toBe(400);

    const noSubject = await request
      .post(`${SUPPORT}/tickets`)
      .send({ email: 'ok@example.com', subject: '  ', message: 'y' });
    expect(noSubject.status).toBe(400);
  });

  it('falls back to the general desk for an unknown category', async () => {
    const res = await request
      .post(`${SUPPORT}/tickets`)
      .send({ email: 'ok@example.com', subject: 'Hi', message: 'Hello', category: 'nonsense' });
    expect(res.status).toBe(201);
    expect(res.body.data.category).toBe('general');
  });

  it('links a ticket to the signed-in user and lists only their own', async () => {
    const user = await registerUser();
    const other = await registerUser();

    await request
      .post(`${SUPPORT}/tickets`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ email: user.email, subject: 'Mine', message: 'My issue', category: 'problem' });

    const mine = await request.get(`${SUPPORT}/tickets`).set('Authorization', `Bearer ${user.token}`);
    expect(mine.body.data).toHaveLength(1);
    expect(mine.body.data[0].subject).toBe('Mine');

    // Another user must not see it.
    const theirs = await request
      .get(`${SUPPORT}/tickets`)
      .set('Authorization', `Bearer ${other.token}`);
    expect(theirs.body.data).toHaveLength(0);
  });

  it('restricts the full queue and ticket updates to admins', async () => {
    const customer = await registerUser();
    const admin = await registerUser('admin');

    const created = await request
      .post(`${SUPPORT}/tickets`)
      .send({ email: 'x@example.com', subject: 'Queue me', message: 'Please help' });

    const forbiddenList = await request
      .get(`${SUPPORT}/tickets/all`)
      .set('Authorization', `Bearer ${customer.token}`);
    expect(forbiddenList.status).toBe(403);

    const forbiddenPatch = await request
      .patch(`${SUPPORT}/tickets/${created.body.data._id}`)
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ status: 'resolved' });
    expect(forbiddenPatch.status).toBe(403);

    const list = await request
      .get(`${SUPPORT}/tickets/all`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);

    const updated = await request
      .patch(`${SUPPORT}/tickets/${created.body.data._id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'resolved', response: 'Sorted, thanks for flagging.' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.status).toBe('resolved');
    expect(updated.body.data.response).toBe('Sorted, thanks for flagging.');
  });
});
