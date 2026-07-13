import { Notification } from '../models';
import { request, connectTestDb, resetTestDb, closeTestDb } from '../test-helpers';

const AUTH = '/api/v1/auth';
const NOTIFICATIONS = '/api/v1/notifications';

interface TestUser {
  id: string;
  token: string;
}

async function registerUser(email: string): Promise<TestUser> {
  const res = await request.post(`${AUTH}/register`).send({
    name: email.split('@')[0],
    email,
    password: 'super-secret-password',
  });
  return { id: String(res.body.data.user.id), token: res.body.data.token };
}

async function notify(userId: string, title: string) {
  const doc = await Notification.create({
    user_id: userId,
    type: 'reward',
    title,
    message: `${title} message`,
  });
  return String(doc._id);
}

describe('notification routes', () => {
  let userA: TestUser;
  let userB: TestUser;

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
    userA = await registerUser('notif-a@example.com');
    userB = await registerUser('notif-b@example.com');
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it("returns 404 when a user tries to mark another user's notification as read", async () => {
    const bNotification = await notify(userB.id, 'For B only');

    const res = await request
      .patch(`${NOTIFICATIONS}/${bNotification}/read`)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(res.status).toBe(404);

    const doc = await Notification.findById(bNotification).lean();
    expect(doc!.read).toBe(false);
  });

  it('marks the caller’s own notification as read', async () => {
    const aNotification = await notify(userA.id, 'For A');

    const res = await request
      .patch(`${NOTIFICATIONS}/${aNotification}/read`)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.read).toBe(true);
  });

  it('mark-read-all only touches the caller’s notifications', async () => {
    await notify(userA.id, 'A1');
    await notify(userA.id, 'A2');
    const bNotification = await notify(userB.id, 'B1');

    const res = await request
      .patch(`${NOTIFICATIONS}/read-all`)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.updated).toBe(2);

    const aUnread = await Notification.countDocuments({ user_id: userA.id, read: false });
    expect(aUnread).toBe(0);

    const bDoc = await Notification.findById(bNotification).lean();
    expect(bDoc!.read).toBe(false);
  });

  it('requires authentication', async () => {
    expect((await request.get(NOTIFICATIONS)).status).toBe(401);
    expect((await request.patch(`${NOTIFICATIONS}/read-all`)).status).toBe(401);
  });
});
