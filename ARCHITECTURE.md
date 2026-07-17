# FonAd/DAADD Architecture Document

## 1. System Overview

This is the authoritative code map for FonAd/DAADD. It describes the code **as it exists** — not planned or removed architecture. (The former DI/repository layer — `container.ts`, `entities/`, `repositories/`, platform adapters, Bull queues — was dead code importing ~45 nonexistent modules and was deleted in July 2026. Live routes use Mongoose models directly.)

> **Honesty note:** several read-heavy endpoints still return deterministic synthetic data (see §6). Those are marked below.

```
daadd/                              (npm-workspaces monorepo)
├── backend/                        (Express 5 + Node 20 + Mongoose 9)
│   ├── src/
│   │   ├── server.ts              (entry: env checks, Mongo connect, seed guard, 5-min anomaly scan via setInterval)
│   │   ├── app.ts                 (Express app: helmet, CORS allow-list, rate limits, routes, JSON 404 + error handler)
│   │   ├── seed.ts                (dev seed; insert-only via $setOnInsert; skipped in production unless SEED_DATABASE=true)
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts            (JWT access 1h + refresh 7d, authMiddleware, refresh-token issue/verify)
│   │   │   └── rateLimit.ts       (in-memory sliding window; per-process)
│   │   │
│   │   ├── models/                (Mongoose — all DB access goes through these)
│   │   │   ├── User.ts            (roles: admin, advertiser, campaign_manager, analyst, end_user, merchant)
│   │   │   ├── Campaign.ts        (status: draft/active/paused/completed/archived; owner ObjectId)
│   │   │   ├── Ad.ts              (doubles as creative)
│   │   │   ├── ABTest.ts          (variants; winner marked manually)
│   │   │   ├── AIRecommendation.ts, AIAuditLog.ts, AICreative.ts
│   │   │   ├── Anomaly.ts         (7 types incl. cpa_spike, conversion_collapse; partial unique index on active alerts)
│   │   │   ├── PlatformAccount.ts (metadata only — no OAuth tokens stored yet)
│   │   │   ├── Reward.ts          (ledger: claim credits + redemption debits; unique partial index per (user, ad) claim)
│   │   │   ├── Redemption.ts      (QR state machine: pending→scanned→validated→completed|rejected|expired)
│   │   │   ├── Review.ts, Notification.ts, Event.ts, DeviceEvent.ts, AdView.ts
│   │   │   ├── TeamMember.ts, TeamAuditLog.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── routes/                (all mounted under /api/v1 via routes/index.ts)
│   │   │   ├── auth.ts            (register [role forced end_user], login, refresh, me, change-password, age-verify OTP, forgot/reset)
│   │   │   ├── campaigns.ts       (CRUD + clone + toggle-ai + creatives + A/B tests; owner-or-admin guarded; whitelisted updates)
│   │   │   ├── ads.ts             (public catalog, trending, featured; regex-escaped filters)
│   │   │   ├── analytics.ts       (dashboard + per-campaign + CSV/PDF export — SYNTHETIC data, accepts start_date/end_date)
│   │   │   ├── heatmaps.ts        (SYNTHETIC seeded geo points)
│   │   │   ├── attribution.ts     (SYNTHETIC)
│   │   │   ├── benchmarks.ts      (SYNTHETIC; 3-advertiser gate)
│   │   │   ├── ai.ts              (recommendations apply/dismiss/mode + audit log — recommendations are seeded pseudo-random)
│   │   │   ├── anomalies.ts       (list/scan/resolve — detection engine is real, input series synthetic)
│   │   │   ├── rewards.ts         (balance, ledger list, claim/:adId with unique-index race guard)
│   │   │   ├── redemption.ts      (qr/scan/validate/confirm/reject; HMAC-SHA256 + timing-safe compare; atomic transitions; merchant roles)
│   │   │   ├── teams.ts           (invites, roles viewer/editor/admin, TeamAuditLog)
│   │   │   ├── notifications.ts
│   │   │   ├── reviews.ts
│   │   │   ├── events.ts          (authenticated event ingest)
│   │   │   ├── oauth.ts           (authorize URL stub — no callback/token exchange yet)
│   │   │   ├── platformAccounts.ts (list/delete/test — no create; created via OAuth in the future)
│   │   │   └── storyteller.ts     (AI narrative export)
│   │   │
│   │   ├── services/              (the only business-logic services)
│   │   │   ├── anomaly-detection.service.ts (spec §3.6 rules vs 7-day baseline: ctr_drop −20%, cpa_spike +25%, spend_anomaly ±30%, conversion_collapse −30%; auto-pause; TeamAuditLog entries)
│   │   │   ├── fatigue.service.ts (ad fatigue scoring)
│   │   │   ├── mailer.ts          (Resend; dev fallbacks when no key)
│   │   │   └── storage.service.ts (local uploads/; S3 branch activates when SDK + env present)
│   │   │
│   │   ├── utils/
│   │   │   ├── response.ts        ({success,data} and paginated {data, pagination:{total,page,limit,totalPages,hasNext,hasPrev}})
│   │   │   ├── ownership.ts       (canManageCampaign / findManageableCampaign — the IDOR guard)
│   │   │   ├── regex.ts           (escapeRegExp for $regex filters)
│   │   │   └── seeded.ts          (deterministic synthetic-data generators)
│   │   │
│   │   └── __tests__/             (Jest + supertest + mongodb-memory-server; 9 suites)
│   │
│   └── Dockerfile
│
├── frontend/                       (React 19 + Vite 8 + React Router 7)
│   └── src/
│       ├── App.tsx                (33 routes: 14 public, 4 auth, 15 dashboard)
│       ├── lib/api.ts             (axios instance; JWT interceptor with single-flight refresh on 401)
│       ├── stores/                (Zustand: auth.store [token + refreshToken], theme.store)
│       ├── hooks/                 (16 TanStack Query v5 hooks, one per API domain)
│       ├── pages/public|auth|dashboard/
│       └── i18n/                  (5 locales: en, es, fr, de, pt — spec wants 14)
│
├── mobile/                         (Expo SDK 57 + Expo Router)
│   └── src/
│       ├── app/                   ((auth), (tabs), ad/[id], redeem, merchant-scan, notifications, edit-profile, dashboard)
│       ├── lib/api.ts             (axios; SecureStore tokens; single-flight refresh on 401)
│       ├── stores/auth.store.ts
│       └── hooks/                 (useAds, useAuth, useRewards, useDashboard — paginated via response.pagination)
│
├── shared/                         (shared TS types; built via npm run build:shared)
└── .github/workflows/              (ci.yml → _backend (lint, typecheck, build, test w/ mongo service), _frontend, _mobile (tsc), _docker, _commitlint)
```

## 2. Request Lifecycle (backend)

1. `app.ts` middleware chain: helmet → CORS (env allow-list; localhost:3000 in dev; blocked in prod when unset) → compression → morgan → JSON body parsing → global rate limit (200/min) + stricter `/api/v1/auth` limit (20/min).
2. `routes/index.ts` mounts routers under `/api/v1`.
3. Protected routes run `authMiddleware` (verifies access JWT, rejects refresh tokens, sets `req.user = {userId, email, role}`).
4. Mutating routes on owned resources call `findManageableCampaign`/`canManageCampaign` (owner or admin, else 404).
5. Responses use `utils/response.ts` shapes; unmatched `/api` paths get JSON 404; errors go to the JSON `errorHandler` (CastError→400, Validation→400, JWT→401, 11000→409, else 500).

## 3. Auth Model

- Register always creates `end_user`; privileged roles are assigned out-of-band (seed/admin).
- Access token: JWT, 1h default (`JWT_EXPIRATION`). Refresh token: JWT `type:'refresh'` + `jti`, 7d default (`JWT_REFRESH_EXPIRATION`), rotated by `POST /auth/refresh`. Refresh tokens are rejected as access tokens (and vice versa).
- Production boot fails fast without `JWT_SECRET`.
- OTP (age verify) and password-reset tokens: CSPRNG (`crypto.randomInt`/`randomBytes`), 10-min TTL, 5-attempt lockout, in-memory (single-instance only).

## 4. Money Flow (rewards/redemption)

- Rewards are a ledger: positive `type:'ad_reward'` rows (unique per user+ad via partial index) and negative `type:'redemption'` debit rows. Balance = sum of approved/paid rows.
- QR: `POST /redemption/qr` creates a pending Redemption + HMAC-SHA256 signature (`QR_SIGNING_SECRET` fallback `JWT_SECRET`), 120s TTL.
- Merchant flow (`merchant`/`advertiser`/`admin` only): scan → validate → confirm, each an **atomic** `findOneAndUpdate` on the expected status — concurrent confirms yield exactly one debit. `reject` releases scanned/validated redemptions.

## 5. Anomaly Detection

`server.ts` runs `scanAllActiveCampaigns()` every 5 min (non-overlapping, connection-guarded). Rules compare the latest day against the 7-day baseline mean (spec §3.6); zero baselines are skipped. Detections create an `Anomaly` (unique active index dedupes), a `Notification`, an email, and a `TeamAuditLog` entry; `critical` bot-traffic auto-pauses the campaign. Input metric series is still synthesized — wiring it to real `Event`/`DeviceEvent` aggregation is future work.

## 6. Known Synthetic Areas (not bugs — unimplemented data pipelines)

| Area | Status |
|---|---|
| `/analytics/*` metrics | Synthetic (seeded random); exports work off the same data |
| `/heatmaps/*` | Synthetic; 100-view gate is frontend-only |
| `/attribution/*`, `/benchmarks/*` | Synthetic (benchmarks enforces the 3-advertiser gate) |
| `/ai/*` recommendations | Seeded pseudo-random; apply/dismiss/audit plumbing is real |
| A/B variant metrics | Synthetic; winner is marked manually (no 10K auto-trigger) |
| Anomaly metric series | Synthetic; detection rules are real |
| `/oauth/authorize/:platform` | Stub URLs; no callback/token storage/encryption yet |
| Platform metrics sync, CDP, webhooks, unified dashboard, Bull queues | **Not implemented** (see SPECIFICATION.md §12 candidates) |

## 7. Testing & Quality Gates

- Backend: `npm run test --workspace=backend` (9 suites, mongodb-memory-server), `npm run typecheck --workspace=backend` (green, enforced in CI), `npm run lint --workspace=backend`.
- Frontend: vitest (3 lib suites) + `tsc && vite build`; mobile: `tsc --noEmit` (no test runner yet).
- Pre-commit: `.husky/pre-commit` runs workspace lint; commit-msg runs commitlint. Prettier config exists (`.prettierrc.json`) but the tree has not been bulk-formatted — run `npm run format` deliberately, not mid-feature.

**Last Updated:** July 17, 2026 — rewritten to match the live tree after the security/reliability fix pass.
