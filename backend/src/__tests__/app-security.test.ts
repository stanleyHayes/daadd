import { request, connectTestDb, resetTestDb, closeTestDb } from '../test-helpers';
import { errorHandler } from '../app';
import { seedDatabase } from '../seed';
import { User } from '../models';

function mockRes() {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
}

describe('app hardening', () => {
  describe('404 handler', () => {
    it('returns a JSON 404 for unmatched /api routes', async () => {
      const res = await request.get('/api/v1/no-such-route');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Not found');
    });
  });

  describe('error middleware', () => {
    it('returns JSON (not the Express HTML page) for malformed JSON bodies', async () => {
      const res = await request
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"not valid json');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('maps Mongoose CastError to 400', () => {
      const res = mockRes();
      errorHandler({ name: 'CastError' }, {} as any, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('maps Mongoose ValidationError to 400', () => {
      const res = mockRes();
      errorHandler({ name: 'ValidationError', message: 'bad field' }, {} as any, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'bad field' })
      );
    });

    it('maps JsonWebTokenError and TokenExpiredError to 401', () => {
      for (const name of ['JsonWebTokenError', 'TokenExpiredError']) {
        const res = mockRes();
        errorHandler({ name }, {} as any, res, jest.fn());
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
      }
    });

    it('maps MongoServerError 11000 to 409', () => {
      const res = mockRes();
      errorHandler({ name: 'MongoServerError', code: 11000 }, {} as any, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('hides the error message on 500 outside development', () => {
      const res = mockRes();
      errorHandler(new Error('sensitive internals'), {} as any, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });

  describe('CORS', () => {
    it('allows the development default origin', async () => {
      const res = await request.get('/health').set('Origin', 'http://localhost:3000');
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    it('does not allow arbitrary origins', async () => {
      const res = await request.get('/health').set('Origin', 'https://evil.example.com');
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('seedDatabase', () => {
    beforeAll(async () => {
      await connectTestDb();
    });

    afterEach(async () => {
      await resetTestDb();
    });

    afterAll(async () => {
      await closeTestDb();
    });

    it('inserts the demo accounts on an empty database', async () => {
      await seedDatabase();

      const admin = await User.findOne({ email: 'admin@example.com' });
      expect(admin).not.toBeNull();
      expect(admin!.role).toBe('admin');
      expect(await User.countDocuments()).toBeGreaterThanOrEqual(10);
    });

    it('never overwrites an existing user (insert-only, passwords preserved)', async () => {
      await User.create({
        name: 'Demo User',
        email: 'demo@example.com',
        password_hash: 'original-hash',
        role: 'end_user',
      });

      await seedDatabase();

      const user = await User.findOne({ email: 'demo@example.com' });
      expect(user!.password_hash).toBe('original-hash');
    });
  });
});
