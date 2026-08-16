/**
 * k6 load/smoke test for DAADD (Phase 7 launch-readiness).
 *
 * Run:  k6 run -e BASE_URL=https://daadd-backend.onrender.com backend/loadtest/smoke.js
 * Local: k6 run -e BASE_URL=http://localhost:5000 backend/loadtest/smoke.js
 *
 * This covers the UNAUTHENTICATED hot paths (health, readiness, public
 * catalogue). To load-test authed paths (redemption qr→confirm, order pay),
 * extend `setup()` to register/login a pool of users and pass their tokens into
 * the scenarios — see backend/src/__tests__ for the exact request shapes.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:5000';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // ramp up
    { duration: '1m', target: 20 }, // steady
    { duration: '20s', target: 0 }, // ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // <1% errors
    http_req_duration: ['p(95)<800'], // 95% under 800ms
  },
};

export default function () {
  const health = http.get(`${BASE}/health`);
  check(health, { 'health 200': (r) => r.status === 200 });

  const ready = http.get(`${BASE}/health/ready`);
  check(ready, { 'ready 200/503': (r) => r.status === 200 || r.status === 503 });

  const catalogue = http.get(`${BASE}/api/v1/products?limit=20`);
  check(catalogue, { 'catalogue 200': (r) => r.status === 200 });

  const ads = http.get(`${BASE}/api/v1/ads?limit=20`);
  check(ads, { 'ads ok': (r) => r.status === 200 || r.status === 401 });

  sleep(1);
}
