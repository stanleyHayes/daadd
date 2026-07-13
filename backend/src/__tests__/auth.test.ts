import { request, connectTestDb, resetTestDb, closeTestDb } from '../test-helpers';

const AUTH = '/api/v1/auth';

const baseUser = {
  name: 'Test User',
  email: 'auth-test@example.com',
  password: 'super-secret-password',
};

describe('auth routes', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterEach(async () => {
    await resetTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  describe('POST /register', () => {
    it('registers a new user and returns a token', async () => {
      const res = await request.post(`${AUTH}/register`).send(baseUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(baseUser.email);
      expect(res.body.data.user.name).toBe(baseUser.name);
      expect(res.body.data.user.password_hash).toBeUndefined();
    });

    it('rejects a duplicate email', async () => {
      await request.post(`${AUTH}/register`).send(baseUser);

      const res = await request.post(`${AUTH}/register`).send(baseUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('rejects registration without required fields', async () => {
      const res = await request.post(`${AUTH}/register`).send({ email: 'x@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /login', () => {
    it('rejects a wrong password', async () => {
      await request.post(`${AUTH}/register`).send(baseUser);

      const res = await request
        .post(`${AUTH}/login`)
        .send({ email: baseUser.email, password: 'wrong-password' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('logs in with the correct password', async () => {
      await request.post(`${AUTH}/register`).send(baseUser);

      const res = await request
        .post(`${AUTH}/login`)
        .send({ email: baseUser.email, password: baseUser.password });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });
  });

  describe('POST /forgot-password', () => {
    it('returns success for an unknown email without leaking a token (no enumeration)', async () => {
      const res = await request
        .post(`${AUTH}/forgot-password`)
        .send({ email: 'nobody@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sent).toBe(true);
      expect(res.body.data.dev_reset_token).toBeUndefined();
    });

    it('returns a dev_reset_token for a known email when no mail provider is configured', async () => {
      await request.post(`${AUTH}/register`).send(baseUser);

      const res = await request
        .post(`${AUTH}/forgot-password`)
        .send({ email: baseUser.email });

      expect(res.status).toBe(200);
      expect(res.body.data.sent).toBe(true);
      expect(typeof res.body.data.dev_reset_token).toBe('string');
      expect(res.body.data.dev_reset_token.length).toBeGreaterThan(10);
    });
  });

  describe('POST /reset-password', () => {
    async function issueResetToken(email: string): Promise<string> {
      const res = await request.post(`${AUTH}/forgot-password`).send({ email });
      return res.body.data.dev_reset_token;
    }

    it('resets the password with a valid token and the new password works', async () => {
      await request.post(`${AUTH}/register`).send(baseUser);
      const token = await issueResetToken(baseUser.email);

      const res = await request
        .post(`${AUTH}/reset-password`)
        .send({ token, newPassword: 'brand-new-password' });

      expect(res.status).toBe(200);
      expect(res.body.data.reset).toBe(true);

      const login = await request
        .post(`${AUTH}/login`)
        .send({ email: baseUser.email, password: 'brand-new-password' });
      expect(login.status).toBe(200);

      const oldLogin = await request
        .post(`${AUTH}/login`)
        .send({ email: baseUser.email, password: baseUser.password });
      expect(oldLogin.status).toBe(401);
    });

    it('rejects reusing the same token (single-use)', async () => {
      await request.post(`${AUTH}/register`).send(baseUser);
      const token = await issueResetToken(baseUser.email);

      await request
        .post(`${AUTH}/reset-password`)
        .send({ token, newPassword: 'brand-new-password' });

      const res = await request
        .post(`${AUTH}/reset-password`)
        .send({ token, newPassword: 'another-password-123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects an invalid token', async () => {
      const res = await request
        .post(`${AUTH}/reset-password`)
        .send({ token: 'not-a-real-token', newPassword: 'brand-new-password' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects a password shorter than 8 characters', async () => {
      await request.post(`${AUTH}/register`).send(baseUser);
      const token = await issueResetToken(baseUser.email);

      const res = await request
        .post(`${AUTH}/reset-password`)
        .send({ token, newPassword: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/8 characters/);

      // Token must still be usable afterwards (rejected before consumption).
      const retry = await request
        .post(`${AUTH}/reset-password`)
        .send({ token, newPassword: 'brand-new-password' });
      expect(retry.status).toBe(200);
    });
  });

  describe('age verification OTP', () => {
    async function registerAndGetToken(): Promise<string> {
      const res = await request.post(`${AUTH}/register`).send(baseUser);
      return res.body.data.token;
    }

    it('returns a dev_code and rejects a wrong confirmation code', async () => {
      const token = await registerAndGetToken();

      const otp = await request
        .post(`${AUTH}/age-verify/request`)
        .set('Authorization', `Bearer ${token}`);

      expect(otp.status).toBe(200);
      expect(otp.body.data.sent).toBe(true);
      expect(typeof otp.body.data.dev_code).toBe('string');

      const bad = await request
        .post(`${AUTH}/age-verify/confirm`)
        .set('Authorization', `Bearer ${token}`)
        .send({ code: '0' });

      expect(bad.status).toBe(400);
      expect(bad.body.success).toBe(false);
    });

    it('confirms with the correct code and marks the user verified', async () => {
      const token = await registerAndGetToken();

      const otp = await request
        .post(`${AUTH}/age-verify/request`)
        .set('Authorization', `Bearer ${token}`);

      const ok = await request
        .post(`${AUTH}/age-verify/confirm`)
        .set('Authorization', `Bearer ${token}`)
        .send({ code: otp.body.data.dev_code });

      expect(ok.status).toBe(200);
      expect(ok.body.data.verified).toBe(true);
    });

    it('requires authentication', async () => {
      const res = await request.post(`${AUTH}/age-verify/request`);
      expect(res.status).toBe(401);
    });
  });
});
