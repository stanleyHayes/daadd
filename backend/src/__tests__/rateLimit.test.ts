import express from 'express';
import supertest from 'supertest';

import { rateLimit } from '../middleware/rateLimit';

function buildApp(max: number) {
  const app = express();
  app.use(rateLimit({ windowMs: 60_000, max }));
  app.get('/ping', (_req, res) => {
    res.json({ ok: true });
  });
  return app;
}

describe('rateLimit middleware', () => {
  it('allows requests under the limit', async () => {
    const agent = supertest(buildApp(3));

    for (let i = 0; i < 3; i++) {
      const res = await agent.get('/ping');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    }
  });

  it('returns 429 with a sane payload once the limit is exceeded', async () => {
    const agent = supertest(buildApp(3));

    for (let i = 0; i < 3; i++) {
      await agent.get('/ping');
    }

    const res = await agent.get('/ping');

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(typeof res.body.message).toBe('string');
    expect(res.body.message).toMatch(/too many requests/i);

    const retryAfter = Number(res.headers['retry-after']);
    expect(Number.isInteger(retryAfter)).toBe(true);
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });

  it('keeps blocking further requests past the limit', async () => {
    const agent = supertest(buildApp(2));

    expect((await agent.get('/ping')).status).toBe(200);
    expect((await agent.get('/ping')).status).toBe(200);
    expect((await agent.get('/ping')).status).toBe(429);
    expect((await agent.get('/ping')).status).toBe(429);
  });
});
