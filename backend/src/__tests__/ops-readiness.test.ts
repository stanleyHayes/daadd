import { alertOps, _resetAlertThrottle } from '../services/alerting';
import { request, connectTestDb, closeTestDb } from '../test-helpers';

describe('ops alerting', () => {
  beforeEach(() => {
    _resetAlertThrottle();
    delete process.env.OPS_ALERT_EMAIL; // dev path: logs, no send
  });

  it('dispatches once then throttles the same subject', async () => {
    expect(await alertOps('payment webhook error', 'boom')).toBe(true);
    // A second alert with the same subject inside the window is throttled.
    expect(await alertOps('payment webhook error', 'boom again')).toBe(false);
    // A different subject is not throttled.
    expect(await alertOps('scheduled scan failed', 'x')).toBe(true);
  });
});

describe('readiness endpoint', () => {
  beforeAll(async () => await connectTestDb());
  afterAll(async () => await closeTestDb());

  it('reports ready while the database is connected', async () => {
    const res = await request.get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(true);
  });

  it('/health is always live', async () => {
    const res = await request.get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
