# AdPlatform/DAADD — AI Agent Coordination Guide

> **START HERE.** This document is the master handoff for any AI agent working on this codebase. It captures the complete state and next steps.

---

## What You're Working With

**AdPlatform/DAADD** is a two-sided AdTech platform (monorepo: `backend/` + `frontend/` + `mobile/` + `shared/`). It's substantially complete — all core PSD features are live. Remaining work is: bug fixes (done ✅), infrastructure hardening, and 6 research features to solidify market competitiveness.

### Current Status Summary

| Phase | Status | Notes |
|---|---|---|
| **Phase 1: Critical Bugs** | ✅ DONE | Mobile fonts copied to `mobile/assets/fonts/`, path + extension fixed in `_layout.tsx`. Frontend env port corrected (4004 → 4000) |
| **Phase 2a: Email Service** | ✅ DONE | `backend/src/services/email.service.ts` created + registered in container (TOKENS.EmailService). Resend installed. Methods: `sendOTP()`, `sendAnomaly()`, `sendBudgetAlert()`, `sendTeamInvite()`, `sendPasswordReset()`. Dev mode logs to console. |
| **Phase 2b: Bull Queues** | ✅ DONE | Campaign lifecycle, anomaly check, report generation, token refresh queues initialized in `app.ts`. Malformed cron job removed. |
| **Phase 2c: Validation DTOs** | ✅ DONE | `validateTrackEventDto` and `validateBatchTrackDto` applied to event routes. Auth rate limiting added. |
| **Phase 2d: Attribution Route** | 🔴 PENDING | Add `PATCH /attribution/window/:campaignId` |
| **Phase 2e: CORS Hardening** | ✅ DONE | Changed to env-based config with wildcard stripping when `credentials=true`. |
| **Phase 3a–f: Research Features** | 🟡 PARTIAL | Budget pacing service exists. Campaign clone endpoint exists. Pixel route exists with rate limiting. Webhooks service exists. Viewability and A/B test infra partially in place. |
| **Phase 4: Frontend Gaps** | ✅ DONE | PlatformAccountsPage imports fixed. BlogPostDetailPage XSS patched. CampaignEditPage Select handler fixed. Error boundaries added. Search wired up in public header. Reviews hook uses API client. |
| **Phase 5: Mobile Gaps** | ✅ DONE | `updateUser` added to auth store. `colors.bg` fixed. Edit-profile null guard added. `initialPageParam` added. Age verify calls backend. 401 triggers logout. Notification hook cleanup fixed. |
| **Security Audit** | ✅ DONE | See [Security Audit Results](#security-audit-results) |
| **Marketing Redesign** | ✅ DONE | LandingPage, AboutPage, BlogPage, AdCatalogPage, PublicLayout all redesigned with animations, social proof, and polished UX. |
| **Phase 6: AGENT.md** | ✅ DONE | This document updated |

---

## Security Audit Results

A full-stack security audit was completed on 2026-05-21. All critical and high-severity findings were patched.

### Critical Fixes Applied
| # | Issue | File(s) | Fix |
|---|-------|---------|-----|
| 1 | Hardcoded JWT fallback | `config/passport.ts`, `services/auth.service.ts` | Throws at startup if `JWT_SECRET` missing |
| 2 | Hardcoded encryption fallback | `utils/encryption.ts` | Throws at startup if `ENCRYPTION_SECRET` missing |
| 3 | WebSocket auth bypass | `services/websocket.service.ts` | Verifies JWT with `jsonwebtoken.verify()` |
| 4 | Campaign status unauthorized | `services/campaign.service.ts`, `routes/campaign.routes.ts` | Added ownership/team checks to `updateStatus()` and `toggleAI()` |
| 5 | Privilege escalation | `services/user.service.ts` | Strips `role`, `is_active`, `email_verified`, `created_at`, `updated_at` from updates |

### High Fixes Applied
| # | Issue | File(s) | Fix |
|---|-------|---------|-----|
| 6 | Weak reset token | `routes/auth.routes.ts` | `crypto.randomBytes(32).toString('hex')` |
| 7 | Event tracking abuse | `routes/event.routes.ts` | Rate limit 60/min per IP on `/track` and `/batch` |
| 8 | Batch track no validation | `services/event.service.ts` | Validates campaigns, checks fatigue, credits rewards, dispatches webhooks |
| 9 | Auth brute-force | `routes/auth.routes.ts` | Strict rate limiter: 10 attempts / 5 min on auth endpoints |
| 10 | Email HTML injection | `services/email.service.ts` | `escapeHtml()` helper applied to all dynamic template values |
| 11 | Webhook SSRF | `services/webhook.service.ts` | Blocks private IPs, localhost, `169.254.x.x` |
| 12 | Pixel IP spoofing | `routes/pixel.routes.ts` | Uses `req.ip` only; removed `ip` query param |
| 13 | Campaign lifecycle crash | `queues/campaign-lifecycle.queue.ts` | Removed malformed cron job with empty data |
| 14 | Role injection | `routes/auth.routes.ts` | Validates `role` against `UserRole` enum on registration |

### Medium / Low Fixes Applied
- CORS wildcard stripped when credentials enabled
- Swagger UI hidden in production
- Health check no longer exposes server timestamp
- Error handler defaults to safe mode (no stack traces unless `development`)
- OAuth state memory leak — `pendingStates` is still in-memory (recommend Redis with TTL for production)
- Logger sanitization — consider adding log injection protection

---

## Architecture Overview

### Backend (`backend/src/`)
- **Runtime:** Node 20, Express, MongoDB, Redis, tsyringe DI
- **Services:** 21 services (auth, campaigns, analytics, AI, anomaly, heatmap, storyteller, rewards, redemption, etc.)
- **Routes:** 20 route files, all under `/api/v1/`
- **Patterns:** Repository pattern (interface + Mongo impl), `@injectable()` services, tsyringe container registration
- **Key files:**
  - `app.ts` — Express setup, middleware, error handling
  - `container.ts` — DI registration (add new services here + tokens.ts)
  - `routes/index.ts` — route registration (new routes registered here)
  - `services/*.service.ts` — all business logic

### Frontend (`frontend/src/`)
- **Runtime:** Vite + React 18, TypeScript
- **State:** Zustand (auth store, theme store), TanStack Query v5 (server state)
- **API layer:** `lib/api.ts` (Axios instance) + `hooks/use*.ts` (all data fetching)
- **Routing:** React Router v6, `components/auth/ProtectedRoute.tsx` for RBAC
- **23 Pages:** Landing, auth, 12 dashboard pages (campaigns, analytics, heatmap, AI, anomalies, benchmarking, storyteller, team, settings)
- **Key files:**
  - `App.tsx` — route definitions, `<ProtectedRoute>` wrappers
  - `stores/*.store.ts` — Zustand stores
  - `hooks/use*.ts` — all API calls (one hook file per domain)

### Mobile (`mobile/src/`)
- **Runtime:** Expo SDK 55, React Native, Expo Router file-based
- **Consumer-facing only:** Browse ads, earn rewards, view profile (no advertiser dashboard)
- **Storage:** `expo-secure-store` (token), AsyncStorage (theme/prefs)
- **Key files:**
  - `app/_layout.tsx` — root layout, font loading, auth/theme init
  - `app/(tabs)/` — 4-tab navigation (home, search, rewards, profile)
  - `app/ad/[id].tsx` — ad detail with parallax, reward claim, age gate

### Shared (`shared/src/`)
- **Types:** Complete TypeScript interfaces for all entities
- **Enums:** UserRole, CampaignStatus, EventType, AnomalyType, RedemptionStatus, etc.
- **Constants:** Thresholds (MIN_VIEWS_FOR_HEATMAP=100, AD_FATIGUE_THRESHOLD=5, etc.)

---

## Quick Start (Local Dev)

```bash
# Install deps
npm install
cd mobile && npm install && cd ..

# Start infra
docker-compose up -d mongodb redis elasticsearch

# Start backend + frontend
npm run dev

# In another terminal: Start mobile
cd mobile && npx expo start
```

- Backend: http://localhost:4000, API docs: http://localhost:4000/api/docs
- Frontend: http://localhost:3000
- Mobile: Expo Metro on port 8082

---

## Implementation Roadmap

### Next: Phase 2b — Bull Queue Setup

**Goal:** Move expensive operations (campaign lifecycle, anomaly detection, PDF generation) off the request-response cycle into background queues.

**Files to create:**
1. `backend/src/queues/index.ts` — queue exports
2. `backend/src/queues/campaign-lifecycle.queue.ts` — cron job to auto-pause/complete campaigns
3. `backend/src/queues/anomaly-check.queue.ts` — async anomaly detection after events
4. `backend/src/queues/report-generation.queue.ts` — async PDF/HTML exports

**Implementation notes:**
- Use `bull` (already installed)
- All queues should initialize in `app.ts` on startup
- Campaign lifecycle: every 5 minutes, scan ACTIVE campaigns for:
  - `budget_spent >= budget_total` → status = COMPLETED
  - `end_date < now()` → status = COMPLETED
  - Fire webhook + in-app notification on transition
- Anomaly check: triggered after batch event track, runs `AnomalyDetectionService.checkCampaignAnomalies()` async

**See plan file:** `/Users/shayford/.claude/plans/immutable-crunching-reef.md` — Section "Phase 2b: Bull queue workers" for exact implementation details.

### Then: Phase 2c–e (Infrastructure Hardening)

All three are **independent** and can be done in any order:
- **2c:** DTOs — create `backend/src/dtos/*.dto.ts`, apply `validateBody()` middleware to campaign create/update, event track, QR generate, redemption approve
- **2d:** Attribution window — add `PATCH /attribution/window/:campaignId` route handler
- **2e:** CORS — change `origin: true` to `origin: process.env.CORS_ORIGINS?.split(',')`

### Then: Phase 3 — 6 Research Features

These should be done in dependency order:

1. **3a: Budget pacing alerts** (depends on email service ✅)
   - After every event budget-spend increment, check if `budget_spent/budget_total` crosses 75%, 90%, 100%
   - Use Redis key `budget_alert:{campaignId}:{threshold}` to deduplicate
   - Fire `EmailService.sendBudgetAlert()` + in-app notification
   - See plan file Section 3a

2. **3b: Campaign cloning** (standalone)
   - `POST /campaigns/:id/clone` → copies campaign to DRAFT with " (Copy)" suffix
   - See plan file Section 3b

3. **3c: Viewability tracking** (requires shared types + backend + frontend)
   - Add `VIEWABLE_IMPRESSION` to EventType enum (shared + backend)
   - Frontend/Mobile: fire `POST /events/track` with `event_type: 'viewable_impression'` when ad visible for 1 sec
   - Backend analytics: compute `viewability_rate = viewable_impressions / impressions`
   - See plan file Section 3c

4. **3d: Creative A/B testing** (depends on event infrastructure)
   - Add `is_control` boolean to Creative entity
   - Extend event tracking to record which creative was viewed
   - Add `GET /analytics/creatives/:campaignId` → per-creative CTR
   - See plan file Section 3d

5. **3e: Conversion tracking pixel** (standalone)
   - `POST /api/v1/pixel/:campaignId` (public, no auth)
   - Returns 1×1 transparent GIF
   - Creates CONVERSION event
   - Rate-limited 100/min per campaignId
   - See plan file Section 3e

6. **3f: Webhook system** (depends on email + Bull for dispatch)
   - Create webhook entity, service, routes
   - Support events: `campaign.anomaly_detected`, `campaign.budget_threshold`, etc.
   - Wire dispatch calls into anomaly service, campaign lifecycle queue, event service
   - See plan file Section 3f

### Then: Phase 4 & 5 — Frontend + Mobile Gaps

**Phase 4 (Frontend):**
- Campaign edit page (mirrors create page structure)
- Reviews on AdDetailPage (remove "coming soon" placeholder)
- Forgot password flow (2 new pages + backend routes)
- Campaign list pagination (server-side, add page/limit params)
- Dashboard search wire-up (navigate to campaigns with `?search=X`)
- AI dismiss recommendation (backend DELETE route + frontend mutation)

**Phase 5 (Mobile):**
- Real reward claim (call mutation instead of alert)
- Real reviews (remove MOCK_REVIEWS, call API)
- Profile editing screen
- Notifications list screen
- Search infinite scroll

See plan file Sections 4 & 5 for exact file paths and implementation details.

---

## Key Code Patterns (Copy These!)

### Add a New Service (Backend)

```typescript
// 1. Create service file: backend/src/services/my-feature.service.ts
import { container, inject, injectable } from 'tsyringe';
import { TOKENS } from '../repositories/tokens';

@injectable()
export class MyFeatureService {
  constructor(
    @inject(TOKENS.SomeRepository) private readonly someRepo: IRepository<SomeEntity>
  ) {}

  async doSomething(id: string): Promise<SomeEntity> {
    return this.someRepo.findOne({ id } as Partial<SomeEntity>);
  }
}

// 2. Add token: backend/src/repositories/tokens.ts
export const TOKENS = {
  // ... existing ...
  MyFeatureService: Symbol.for('MyFeatureService'),
};

// 3. Register in container: backend/src/container.ts
import { MyFeatureService } from './services/my-feature.service';
// ...
container.registerSingleton(TOKENS.MyFeatureService, MyFeatureService);

// 4. Use in another service:
@injectable()
export class OtherService {
  constructor(
    @inject(TOKENS.MyFeatureService) private readonly myFeature: MyFeatureService
  ) {}
}
```

### Add a Frontend Data Fetch Hook

```typescript
// frontend/src/hooks/useMyFeature.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useMyFeatureList() {
  return useQuery({
    queryKey: ['myFeatures'],
    queryFn: async () => {
      const { data } = await api.get('/my-features');
      return data;
    },
    staleTime: 60_000,
  });
}

export function useCreateMyFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ICreateMyFeaturePayload) => {
      const { data } = await api.post('/my-features', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myFeatures'] });
    },
  });
}
```

### Add a Mobile Screen (Expo Router)

```typescript
// mobile/src/app/my-screen.tsx
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';

export default function MyScreen() {
  const colors = useColors();
  const { data, isLoading } = useQuery({
    queryKey: ['myData'],
    queryFn: async () => {
      const { data } = await api.get('/my-data');
      return data;
    },
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* content */}
    </View>
  );
}
```

---

## Environment Variables (for devs to add)

**Backend** (`backend/.env`):
```bash
# Required — the app will throw at startup if these are missing:
JWT_SECRET=your-256-bit-secret-key-change-in-production
ENCRYPTION_SECRET=your-256-bit-encryption-key-change-in-production

# Add these if not present:
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=noreply@adplatform.local
REDIS_QUEUE_URL=redis://localhost:6380
CORS_ORIGINS=http://localhost:3000
```

**Frontend** (`frontend/.env`):
```bash
# Already correct:
VITE_API_URL=http://localhost:4000/api/v1
VITE_GOOGLE_MAPS_KEY=
```

**Mobile** (`mobile/.env`):
```bash
# Already correct:
EXPO_PUBLIC_API_URL=http://localhost:4000/api/v1
```

---

## Testing Checklist (Before Committing)

Run these smoke tests:

```bash
# 1. Backend starts without errors (requires JWT_SECRET and ENCRYPTION_SECRET)
npm run dev:backend

# 2. Frontend starts without errors
npm run dev:frontend

# 3. Mobile font loads without crash
cd mobile && npx expo start

# 4. Email service logs correctly in dev
# After creating an anomaly, check backend logs for "[DEV] Anomaly alert..."

# 5. Type checking passes
npm run build:all

# 6. Critical routes respond
curl http://localhost:4000/health
curl http://localhost:4000/api/v1/ads

# 7. Security checks
# - Verify Swagger is NOT accessible in production (only in dev)
# - Verify auth endpoints are rate-limited (10 attempts / 5 min)
# - Verify event tracking endpoints are rate-limited (60 / min)
# - Verify password reset tokens are 64-char hex strings
```

---

## Git Workflow (For This Session)

When committing completed phases:

```bash
# Example commit for Phase 2a (Email Service)
git add backend/src/services/email.service.ts backend/src/container.ts backend/src/repositories/tokens.ts
git commit -m "feat(email): Resend integration for OTP, anomaly alerts, budget thresholds, team invites, password reset

- Create EmailService with sendOTP, sendAnomaly, sendBudgetAlert, sendTeamInvite, sendPasswordReset methods
- Support dev mode (console logging) and production Resend API
- Register in tsyringe container with TOKENS.EmailService
- Install resend@latest dependency

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Common Issues & Solutions

| Issue | Solution |
|---|---|
| `JWT_SECRET environment variable is required` | Add `JWT_SECRET` to `backend/.env` |
| `ENCRYPTION_SECRET environment variable is required` | Add `ENCRYPTION_SECRET` to `backend/.env` |
| `EmailService` not found error | Check that TOKENS.EmailService is registered in container.ts and imported |
| Font files still not found in mobile | Verify files copied to `mobile/assets/fonts/` and `require()` paths use correct relative path (../../assets/) |
| `PORT 4000 in use` | Kill process: `lsof -i :4000 \| grep LISTEN \| awk '{print $2}' \| xargs kill -9` |
| Redux/Zustand not defined | Always use `import { useMyStore } from '@/stores/my.store'` (aliases in tsconfig) |
| Queue jobs not running | Ensure Redis is running (`docker-compose up redis`), Bull queue is initialized in app.ts |
| `colors.bg` undefined in mobile | Use `colors.background` (primary) or `colors.surfaceSecondary` (secondary) instead |
| `updateUser is not a function` | The auth store now has `updateUser`. Ensure you're on the latest version. |
| Case-sensitive import errors on Linux CI | Use PascalCase for component imports: `@/components/ui/Button` not `button` |

---

## Reference: Master Plan Location

All implementation details live in: `/Users/shayford/.claude/plans/immutable-crunching-reef.md`

This AGENT.md summarizes progress + next steps. The plan file contains:
- Full audit of what's done vs. missing
- Step-by-step implementation details for each phase
- Critical files to create/modify for each task
- Verification checklist after all phases

**When you start a new phase, read the corresponding section in the plan file.**

---

## Questions or Blockers?

If you encounter:
- **Type errors:** Check `shared/src/types/` for entity definitions
- **Route not wired:** Check `backend/src/routes/index.ts` (imports + registration)
- **Service not injectable:** Check `container.ts` (registered + TOKENS defined)
- **Frontend hook error:** Check that API endpoint exists (`GET /api/v1/...`)

Reach out in the project context or check the plan file for detailed guidance on any phase.

---

**Last Updated:** 2026-05-21  
**Next Phase:** Attribution window route (`PATCH /attribution/window/:campaignId`)  
**Status:** ✅ Security audit complete, marketing redesign complete, critical/high bugs fixed
