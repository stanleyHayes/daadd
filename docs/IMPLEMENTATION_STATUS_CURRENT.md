# Implementation Status — Current (July 17, 2026)

> **This document supersedes all previous status docs.** The May 2026 versions (including the former content of this file and `COMPLETION_SUMMARY_MAY_2026.md`) described queues, services, DTOs, repositories, and endpoints that never existed in this tree. This version was verified file-by-file against the code.

## Verified Status

### ✅ Real and tested

| Area | Evidence |
|---|---|
| Auth: register/login/refresh/me/change-password/age-OTP/forgot/reset | `routes/auth.ts`, `middleware/auth.ts`; 1h access + 7d rotating refresh; registration forced to `end_user`; CSPRNG OTP with attempt limits |
| Campaigns CRUD + clone + toggle-ai + creatives + A/B tests | `routes/campaigns.ts`; owner-or-admin guarded; whitelisted mass-assignment guard |
| Ads catalog, reviews, teams (viewer/editor/admin) + TeamAuditLog, notifications | `routes/ads.ts`, `reviews.ts`, `teams.ts`, `notifications.ts` |
| Rewards ledger + claim (unique-index race guard) | `routes/rewards.ts`, `models/Reward.ts` |
| QR redemption: qr/scan/validate/confirm/reject | `routes/redemption.ts`; HMAC-SHA256 (timing-safe, dedicated secret), 120s TTL, atomic transitions, merchant-role guard |
| Anomaly detection (spec §3.6 rules) | `services/anomaly-detection.service.ts`; ctr_drop −20%, cpa_spike +25%, spend_anomaly ±30%, conversion_collapse −30% vs 7-day baseline; auto-pause; TeamAuditLog; 5-min `setInterval` scan in `server.ts` |
| Fatigue scoring, mailer (Resend), storage (local/S3-optional) | `services/fatigue.service.ts`, `mailer.ts`, `storage.service.ts` |
| Tests | 9 Jest suites / 92 tests, mongodb-memory-server; backend `tsc --noEmit` green; CI runs lint + typecheck + build + test |
| Frontend | 33 routes; refresh-token axios interceptor; wired date filters, AI-mode + AI toggles; lint/tests/build green |
| Mobile | Full consumer flow (feed, detail, claim, QR, merchant scan); fixed pagination + refresh tokens; tsc green |

### 🟡 Exists but returns synthetic data (plumbing real, data fake)

- `/analytics/*` (dashboard, per-campaign, CSV/PDF export) — `utils/seeded.ts`
- `/heatmaps/*` — frontend enforces the 100-view gate; backend does not
- `/attribution/*`, `/benchmarks/*` (benchmarks enforces the 3-advertiser gate)
- `/ai/*` recommendations (apply/dismiss/audit plumbing is real)
- A/B variant metrics (winner marked manually; no 10K/7-day auto-trigger)
- Anomaly metric series input

### 🔴 Not implemented (spec features — future work, not bugs)

- Platform OAuth: callback, token exchange, AES-256-GCM storage, hourly refresh (`/oauth/authorize` is a stub)
- Platform metrics syncing + unified dashboard (`/dashboard/unified-metrics`, `/sync-now`)
- Public conversion pixel (`/pixel/:campaignId`)
- CDP phases 1–3 (`/cdp/*`, CRM integrations)
- Webhooks (`/webhooks` + dispatch)
- Bull/Redis queues (anomaly scan runs on `setInterval`; exports are synchronous)
- 14-language support (5 locales exist: en, es, fr, de, pt)
- GDPR right-to-be-forgotten endpoints

### 🗑️ Deleted in the July 2026 fix pass

`container.ts`, `dtos/`, `middleware/validation.middleware.ts`, `queues/`, `services/event.service.ts`, `services/budget-pacing.service.ts`, `services/email.service.ts` — a dead parallel architecture importing ~45 nonexistent modules; nothing referenced it at runtime. It is the reason older docs list services/queues/DTOs that don't exist.

## Security posture (July 2026 fix pass)

Closed: self-assignable admin registration; seeder resetting prod passwords; systemic IDOR on all mutating campaign/team/AI/anomaly routes; mass assignment (`budget_spent` reset); redemption double-spend race; QR HMAC key reuse + non-constant-time compare; 7-day JWT default; `dev-secret` fallback in production; CORS `*` fallback; unescaped `$regex`; duplicate reward claims and reviews; orphaned docs on campaign delete.

Outstanding (needs the user): `credentials.txt` and `backend/.env.backup` are git-tracked with real-looking secrets — they are now gitignored, but must be purged from history and rotated.
