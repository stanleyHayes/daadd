import jwt from 'jsonwebtoken';
import { request, connectTestDb, resetTestDb, closeTestDb } from '../test-helpers';
import { User } from '../models';
import { generateToken, generateRefreshToken, JWT_SECRET } from '../middleware/auth';

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

    it('honors a self-service role from the request body', async () => {
      const res = await request
        .post(`${AUTH}/register`)
        .send({ ...baseUser, role: 'advertiser' });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('advertiser');
    });

    it('falls back to end_user for privileged or unknown roles', async () => {
      const res = await request.post(`${AUTH}/register`).send({ ...baseUser, role: 'admin' });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('end_user');
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

    it('invalidates the code after 5 failed attempts', async () => {
      const token = await registerAndGetToken();

      const otp = await request
        .post(`${AUTH}/age-verify/request`)
        .set('Authorization', `Bearer ${token}`);
      const devCode = otp.body.data.dev_code;

      for (let i = 0; i < 4; i++) {
        const res = await request
          .post(`${AUTH}/age-verify/confirm`)
          .set('Authorization', `Bearer ${token}`)
          .send({ code: '000000' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Invalid verification code/);
      }

      const fifth = await request
        .post(`${AUTH}/age-verify/confirm`)
        .set('Authorization', `Bearer ${token}`)
        .send({ code: '000000' });
      expect(fifth.status).toBe(400);
      expect(fifth.body.message).toMatch(/Too many failed attempts/);

      // Even the correct code is rejected once the code has been invalidated.
      const correct = await request
        .post(`${AUTH}/age-verify/confirm`)
        .set('Authorization', `Bearer ${token}`)
        .send({ code: devCode });
      expect(correct.status).toBe(400);
    });

    it('expires codes after 10 minutes', async () => {
      const token = await registerAndGetToken();

      const otp = await request
        .post(`${AUTH}/age-verify/request`)
        .set('Authorization', `Bearer ${token}`);

      const spy = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 11 * 60 * 1000);
      try {
        const res = await request
          .post(`${AUTH}/age-verify/confirm`)
          .set('Authorization', `Bearer ${token}`)
          .send({ code: otp.body.data.dev_code });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/missing or expired/);
      } finally {
        spy.mockRestore();
      }
    });
  });

  describe('registration hardening', () => {
    it('ignores a privileged role passed in the body and creates an end_user', async () => {
      const res = await request
        .post(`${AUTH}/register`)
        .send({ ...baseUser, role: 'admin' });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('end_user');

      const stored = await User.findOne({ email: baseUser.email });
      expect(stored!.role).toBe('end_user');
    });

    it('rejects a password shorter than 8 characters', async () => {
      const res = await request
        .post(`${AUTH}/register`)
        .send({ ...baseUser, password: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/8 characters/);

      expect(await User.findOne({ email: baseUser.email })).toBeNull();
    });
  });

  describe('refresh tokens', () => {
    async function registerAndGetTokens(): Promise<{ token: string; refreshToken: string }> {
      const res = await request.post(`${AUTH}/register`).send(baseUser);
      return { token: res.body.data.token, refreshToken: res.body.data.refreshToken };
    }

    it('register and login return a refreshToken alongside the token', async () => {
      const reg = await request.post(`${AUTH}/register`).send(baseUser);
      expect(reg.status).toBe(201);
      expect(reg.body.data.token).toBeDefined();
      expect(reg.body.data.refreshToken).toBeDefined();

      const login = await request
        .post(`${AUTH}/login`)
        .send({ email: baseUser.email, password: baseUser.password });
      expect(login.status).toBe(200);
      expect(login.body.data.token).toBeDefined();
      expect(login.body.data.refreshToken).toBeDefined();
    });

    it('exchanges a refresh token for a rotated token pair', async () => {
      const { refreshToken } = await registerAndGetTokens();

      const res = await request.post(`${AUTH}/refresh`).send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.refreshToken).not.toBe(refreshToken);

      // The new access token authenticates requests.
      const me = await request
        .get(`${AUTH}/me`)
        .set('Authorization', `Bearer ${res.body.data.token}`);
      expect(me.status).toBe(200);
      expect(me.body.data.email).toBe(baseUser.email);
    });

    it('rejects an access token presented as a refresh token (wrong type)', async () => {
      const { token } = await registerAndGetTokens();

      const res = await request.post(`${AUTH}/refresh`).send({ refreshToken: token });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects a garbage token', async () => {
      const res = await request.post(`${AUTH}/refresh`).send({ refreshToken: 'not-a-real-token' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects an expired refresh token', async () => {
      const { refreshToken } = await registerAndGetTokens();
      const { userId } = jwt.decode(refreshToken) as { userId: string };
      const expired = jwt.sign(
        {
          userId,
          role: 'end_user',
          type: 'refresh',
          exp: Math.floor(Date.now() / 1000) - 60,
        },
        JWT_SECRET
      );

      const res = await request.post(`${AUTH}/refresh`).send({ refreshToken: expired });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects a refresh token for a deleted user', async () => {
      const { refreshToken } = await registerAndGetTokens();
      await User.deleteOne({ email: baseUser.email });

      const res = await request.post(`${AUTH}/refresh`).send({ refreshToken });

      expect(res.status).toBe(401);
    });

    it('does not accept a refresh token as an access token', async () => {
      const { refreshToken } = await registerAndGetTokens();

      const res = await request
        .get(`${AUTH}/me`)
        .set('Authorization', `Bearer ${refreshToken}`);

      expect(res.status).toBe(401);
    });

    it('signs access tokens with a 1-hour default expiry', () => {
      const saved = process.env.JWT_EXPIRATION;
      delete process.env.JWT_EXPIRATION;
      try {
        const token = generateToken({ userId: 'u1', email: 'x@example.com', role: 'end_user' });
        const decoded = jwt.decode(token) as { iat: number; exp: number };
        expect(decoded.exp - decoded.iat).toBe(3600);
      } finally {
        if (saved !== undefined) process.env.JWT_EXPIRATION = saved;
      }
    });

    it('signs refresh tokens with type=refresh and a 7-day default expiry', () => {
      const saved = process.env.JWT_REFRESH_EXPIRATION;
      delete process.env.JWT_REFRESH_EXPIRATION;
      try {
        const token = generateRefreshToken({ userId: 'u1', role: 'end_user' });
        const decoded = jwt.decode(token) as { iat: number; exp: number; type: string };
        expect(decoded.type).toBe('refresh');
        expect(decoded.exp - decoded.iat).toBe(7 * 24 * 3600);
      } finally {
        if (saved !== undefined) process.env.JWT_REFRESH_EXPIRATION = saved;
      }
    });
  });

  describe('reset token hardening', () => {
    it('expires reset tokens after 10 minutes', async () => {
      await request.post(`${AUTH}/register`).send(baseUser);
      const fp = await request.post(`${AUTH}/forgot-password`).send({ email: baseUser.email });
      const token = fp.body.data.dev_reset_token;

      const spy = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 11 * 60 * 1000);
      try {
        const res = await request
          .post(`${AUTH}/reset-password`)
          .send({ token, newPassword: 'brand-new-password' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Invalid or expired/);
      } finally {
        spy.mockRestore();
      }
    });

    it('invalidates a reset token after 5 failed attempts', async () => {
      await request.post(`${AUTH}/register`).send(baseUser);
      const fp = await request.post(`${AUTH}/forgot-password`).send({ email: baseUser.email });
      const token = fp.body.data.dev_reset_token;

      for (let i = 0; i < 5; i++) {
        await request.post(`${AUTH}/reset-password`).send({ token, newPassword: 'short' });
      }

      const res = await request
        .post(`${AUTH}/reset-password`)
        .send({ token, newPassword: 'brand-new-password' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid or expired/);
    });
  });
});
