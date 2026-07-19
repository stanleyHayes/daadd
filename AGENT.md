# DAADD — AI Agent Coordination Guide

> **START HERE.** Master handoff for any AI agent working on this codebase. Describes the tree **as it is** — verified against the code on 2026-07-17. When this file and the code disagree, believe the code and update this file.

---

## What You're Working With

**DAADD** is a two-sided AdTech platform (npm-workspaces monorepo: `backend/` + `frontend/` + `mobile/` + `shared/`).

**Read `ARCHITECTURE.md` first** — it is the authoritative code map. Key facts:

- Backend is Express 5 + Mongoose 9. Routes use models directly. **There is no DI container, no repository layer, no Bull queues** — that dead tree was deleted in July 2026; docs referencing `tsyringe`, `entities/`, `repositories/`, `services/*.service.ts` beyond the 4 live ones are stale.
- Live backend services: `anomaly-detection.service.ts`, `fatigue.service.ts`, `mailer.ts`, `storage.service.ts`.
- Several read endpoints return deterministic **synthetic data** (analytics, heatmaps, attribution, benchmarks, AI recommendations, A/B variant metrics, anomaly input series). See `ARCHITECTURE.md` §6 before "fixing" numbers.
- Not yet implemented (spec features, not bugs): platform OAuth callback/token storage, metrics syncing, CDP (`/cdp/*`), webhooks, unified dashboard, public conversion pixel, Bull/Redis queues, A/B auto-winner job.

## Current Status (2026-07-17)

| Area | State |
|---|---|
| Auth (register/login/refresh/OTP/reset) | ✅ Real, tested. Registration always yields `end_user`. 1h access + 7d rotating refresh tokens |
| Campaigns/ads/reviews/teams/notifications | ✅ Real, owner-or-admin guarded (`utils/ownership.ts`) |
| Rewards + QR redemption | ✅ Real, tested: atomic state machine, HMAC-SHA256 (timing-safe), merchant roles, reject endpoint |
| Anomaly detection | ✅ Spec §3.6 rules (ctr −20%, cpa +25%, spend ±30%, cvr collapse) vs 7-day baseline; input series synthetic |
| Backend tests | ✅ 9 suites / 92 tests green; `tsc --noEmit` green; CI runs lint+typecheck+build+test |
| Frontend | ✅ 33 pages, lint/tests/build green; refresh-token interceptor wired |
| Mobile | ✅ tsc green; pagination, age-gate, refresh tokens fixed |
| Security | ✅ July 2026 fix pass closed: self-admin registration, seeder prod reset, systemic IDOR, mass assignment, redemption double-spend, CORS/JWT defaults |

## Quick Start (Local Dev)

```bash
npm install                 # root (workspaces: shared, backend, frontend)
cd mobile && npm install    # mobile has its own lockfile
docker-compose up -d mongodb   # or a local mongod; Redis not required by live code
npm run dev                 # backend :4000 + frontend :3000
cd mobile && npx expo start # mobile, in another terminal
```

- Dev seeding runs automatically outside production (`backend/src/seed.ts`, insert-only). Demo logins incl. `admin@example.com` / `merchant@daadd.com` — password is in the seed file.
- Health: `GET http://localhost:4000/health` (NOT `/api/v1/health`).

## Key Code Patterns (Copy These!)

### Add a backend route

```typescript
// backend/src/routes/myfeature.ts
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { success, paginated } from '../utils/response';
import { findManageableCampaign } from '../utils/ownership';

const router = Router();

router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaign = await findManageableCampaign(req.params.id as string, req.user!);
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }
    // ... mutate via the model; NEVER spread req.body into an update — whitelist fields
    res.json(success(campaign, 'Updated'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
});

export default router;
// then mount it in backend/src/routes/index.ts
```

Rules that are enforced by review (and were once bugs):
- **Every** mutating route on an owned resource checks ownership (`utils/ownership.ts`) — 404, not 403.
- Updates whitelist fields explicitly (see `normalizeCampaignBody` in `routes/campaigns.ts`).
- Money/state transitions are atomic `findOneAndUpdate` with the expected status in the filter.
- `$regex` filters go through `escapeRegExp` (`utils/regex.ts`); path ids validated before queries.

### Add a frontend data hook

```typescript
// frontend/src/hooks/useMyFeature.ts — TanStack Query v5 object syntax
export function useMyFeature(id: string) {
  return useQuery({
    queryKey: ['my-feature', id],
    queryFn: async () => (await api.get(`/my-feature/${id}`)).data.data,
  });
}
```

Auth tokens live in `stores/auth.store.ts` (token + refreshToken, localStorage); the axios interceptor in `lib/api.ts` refreshes single-flight on 401. Don't hand-roll fetch calls.

### Add a mobile screen

File-based routes in `mobile/src/app/` (Expo Router). Use `mobile/src/hooks/` + `lib/api.ts`; pagination shape is `res.data.pagination` (`hasNext`, `totalPages`), never top-level `res.data.total`.

## Environment Variables

`backend/.env.example` is aligned with the code and spec §8.3 — copy it. Highlights:
- `JWT_SECRET` — **required in production** (boot fails fast without it).
- `JWT_EXPIRATION=1h`, `JWT_REFRESH_EXPIRATION=7d`, `QR_SIGNING_SECRET` (falls back to JWT_SECRET).
- `CORS_ORIGINS` — production blocks cross-origin requests when unset.
- `SEED_DATABASE=true` — the only way to seed in production.
- OAuth platform vars exist for future adapters; nothing reads them yet.

## Testing Checklist (Before Committing)

```bash
npm run lint                                # all workspaces
npm run typecheck --workspace=backend       # must stay green (CI enforces)
npm run test --workspace=backend            # 9 suites, mongodb-memory-server
npm run build --workspace=frontend          # tsc + vite
cd mobile && npx tsc --noEmit               # mobile gate
```

Behavioral changes need tests — backend suites live in `backend/src/__tests__/` (see `redemption.test.ts` for the merchant-fixture pattern: registration always yields `end_user`, so promote in DB + mint a role token directly).

## Roadmap (in dependency order)

1. **Real event pipeline** — aggregate `Event`/`DeviceEvent` into analytics/heatmaps/anomaly series (replaces all synthetic reads).
2. **Platform OAuth** — callback route, AES-256-GCM token storage, hourly refresh job, then metrics sync adapters (env vars already documented).
3. **Public conversion pixel** (`POST /api/v1/pixel/:campaignId`, rate-limited, 1×1 GIF).
4. **Webhooks** — model + registration routes + dispatch from anomaly/redemption flows.
5. **CDP phases 1–3** (spec §3.4), **unified dashboard** (`/dashboard/unified-metrics`, `/sync-now`), **Bull queues** for lifecycle/reports/token-refresh.
6. **A/B auto-winner job** (10K impressions or 7 days, spec §10.3) and i18n completion (5→14 locales).

---

**Maintained by:** Development Team — update with every structural change.
