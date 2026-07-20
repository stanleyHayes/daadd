import { User } from '../models';
import { generateToken } from '../middleware/auth';
import { request, connectTestDb, resetTestDb, closeTestDb } from '../test-helpers';

const AUTH = '/api/v1/auth';
const MESSAGES = '/api/v1/messages';

interface TestUser {
  id: string;
  token: string;
  email: string;
}

let userSeq = 0;

async function registerUser(): Promise<TestUser> {
  userSeq += 1;
  const email = `msg-user-${userSeq}@example.com`;
  const res = await request.post(`${AUTH}/register`).send({
    name: `Msg User ${userSeq}`,
    email,
    password: 'super-secret-password',
  });
  if (res.status !== 201) throw new Error(`register failed: ${JSON.stringify(res.body)}`);
  return { id: String(res.body.data.user.id), token: res.body.data.token, email };
}

/** Registration always yields end_user; promote to advertiser for company fixtures. */
async function registerAdvertiser(): Promise<TestUser> {
  const user = await registerUser();
  await User.findByIdAndUpdate(user.id, { role: 'advertiser' });
  const token = generateToken({ userId: user.id, email: user.email, role: 'advertiser' });
  return { ...user, token };
}

function start(customer: TestUser, advertiserId: string, body: string, extra: Record<string, unknown> = {}) {
  return request
    .post(`${MESSAGES}/conversations`)
    .set('Authorization', `Bearer ${customer.token}`)
    .send({ advertiser_id: advertiserId, body, ...extra });
}

function listConversations(user: TestUser) {
  return request.get(`${MESSAGES}/conversations`).set('Authorization', `Bearer ${user.token}`);
}

function thread(user: TestUser, conversationId: string) {
  return request
    .get(`${MESSAGES}/conversations/${conversationId}`)
    .set('Authorization', `Bearer ${user.token}`);
}

function reply(user: TestUser, conversationId: string, body: string) {
  return request
    .post(`${MESSAGES}/conversations/${conversationId}`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({ body });
}

describe('messages routes', () => {
  let customer: TestUser;
  let advertiser: TestUser;

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
    userSeq = 0;
    customer = await registerUser();
    advertiser = await registerAdvertiser();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it('starts a conversation and posts the first message', async () => {
    const res = await start(customer, advertiser.id, 'Hi, is this promo still on?');
    expect(res.status).toBe(201);
    expect(res.body.data.conversation_id).toBeTruthy();
    expect(res.body.data.message.body).toBe('Hi, is this promo still on?');
  });

  it('is idempotent per (customer, advertiser) — one thread per company', async () => {
    const first = await start(customer, advertiser.id, 'First', { ad_id: undefined });
    const second = await start(customer, advertiser.id, 'Second question');
    expect(first.body.data.conversation_id).toBe(second.body.data.conversation_id);

    const convos = await listConversations(customer);
    expect(convos.body.data).toHaveLength(1);
  });

  it('rejects messaging a non-advertiser (end_user) with 404', async () => {
    const otherCustomer = await registerUser();
    const res = await start(customer, otherCustomer.id, 'hello');
    expect(res.status).toBe(404);
  });

  it('rejects messaging yourself with 400', async () => {
    const advToken = advertiser;
    const res = await request
      .post(`${MESSAGES}/conversations`)
      .set('Authorization', `Bearer ${advToken.token}`)
      .send({ advertiser_id: advertiser.id, body: 'self' });
    expect(res.status).toBe(400);
  });

  it('rejects an empty body with 400', async () => {
    const res = await start(customer, advertiser.id, '   ');
    expect(res.status).toBe(400);
  });

  it('forbids a non-participant from reading or replying (403)', async () => {
    const started = await start(customer, advertiser.id, 'Question');
    const convId = started.body.data.conversation_id;
    const outsider = await registerAdvertiser();

    const read = await thread(outsider, convId);
    expect(read.status).toBe(403);

    const post = await reply(outsider, convId, 'sneaky');
    expect(post.status).toBe(403);
  });

  it('lets the advertiser reply, and tracks unread via last_read', async () => {
    const started = await start(customer, advertiser.id, 'Do you deliver?');
    const convId = started.body.data.conversation_id;

    // Advertiser has an unread message from the customer.
    let advList = await listConversations(advertiser);
    expect(advList.body.data[0].unread).toBe(1);

    // Opening the thread marks it read and returns messages oldest→newest.
    const advThread = await thread(advertiser, convId);
    expect(advThread.body.data.map((m: any) => m.body)).toEqual(['Do you deliver?']);
    advList = await listConversations(advertiser);
    expect(advList.body.data[0].unread).toBe(0);

    // Advertiser replies → customer now has an unread + last_message updates.
    const replied = await reply(advertiser, convId, 'Yes, city-wide.');
    expect(replied.status).toBe(201);
    const custList = await listConversations(customer);
    expect(custList.body.data[0].unread).toBe(1);
    expect(custList.body.data[0].last_message).toBe('Yes, city-wide.');
  });

  it('requires authentication', async () => {
    const res = await request.get(`${MESSAGES}/conversations`);
    expect(res.status).toBe(401);
  });
});
