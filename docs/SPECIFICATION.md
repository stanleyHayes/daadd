# SmartDeals Technical Specification

## 1. Overview

**SmartDeals** (Data-driven Ad Analytics & Decision Dashboard) is a two-sided AdTech platform for managing, analyzing, and optimizing advertising campaigns across multiple digital channels.

**Users:**
- **Advertisers:** Create campaigns, connect platform accounts, monitor metrics, receive AI-driven optimization recommendations
- **Consumers/Publishers:** View available ads, claim rewards via QR code redemption

**Core Value Proposition:**
- Unified metrics aggregation across Google Ads, Meta, TikTok, LinkedIn, Pinterest
- AI-powered optimization recommendations (budget allocation, underperformer detection, winner scaling)
- First-party CDP for audience segmentation and activation
- Creative A/B testing with automatic winner detection
- Real-time anomaly detection with auto-pause capabilities
- Geo-targeted campaign management with multi-language support

---

## 2. Architecture (high-level)

```
┌─────────────────────────────────────────────────────────────┐
│                    SmartDeals Platform                     │
├─────────────────────────────────────────────────────────────┤
│
├─ Backend (Express.js + Node.js + MongoDB)
│  ├─ Services (21 total)
│  │  ├─ Campaign management
│  │  ├─ Analytics aggregation (unified dashboard)
│  │  ├─ AI optimization
│  │  ├─ Anomaly detection
│  │  ├─ CDP (first-party data)
│  │  ├─ Platform OAuth + token management
│  │  ├─ Webhook event dispatch
│  │  └─ [... 14 more services]
│  ├─ Queues (Bull + Redis)
│  │  ├─ Campaign lifecycle automation
│  │  ├─ Token refresh (hourly)
│  │  ├─ Anomaly checks (async)
│  │  └─ Report generation
│  ├─ Platform Adapters (metrics + audience export)
│  │  ├─ Google Ads
│  │  ├─ Meta
│  │  ├─ TikTok
│  │  ├─ LinkedIn
│  │  └─ Pinterest
│  └─ Auth (JWT + OTP verification)
│
├─ Frontend (React + Vite + React Router)
│  ├─ Pages (23 total)
│  │  ├─ Dashboard (campaigns, analytics, AI optimization)
│  │  ├─ Platform accounts settings
│  │  ├─ CDP audience management
│  │  ├─ Reports & exports
│  │  └─ [... 18 more pages]
│  ├─ State (Zustand + TanStack Query v5)
│  ├─ Components (atomic design)
│  └─ Hooks (custom data fetching)
│
├─ Mobile (Expo + React Native)
│  ├─ Consumer-facing (view ads, claim rewards)
│  ├─ Auth flow
│  └─ Ad detail + reward tracking
│
└─ Infrastructure
   ├─ MongoDB (campaigns, users, events)
   ├─ Redis (cache, queues, rate limiting)
   ├─ Email (Resend API)
   └─ External platform APIs (Google, Meta, TikTok, LinkedIn, Pinterest)
```

---

## 3. Product Requirements

### 3.1 Core Campaigns Module

- Create, read, update, delete campaigns
- Campaign status machine: DRAFT → ACTIVE → COMPLETED/PAUSED
- Budget tracking (spent vs. total)
- Date-based lifecycle (start_date, end_date)
- AI optimization toggle (on/off per campaign)
- Creative attachment (multiple creatives per campaign)
- Campaign cloning (duplicate with reset budget)
- A/B testing (assign creatives to variants, auto-detect winner after 10K impressions)
- Multi-language support (14 languages)

### 3.2 Analytics Dashboard

- Unified metrics aggregation (all platforms combined)
- Per-platform breakdown (Google, Meta, TikTok, LinkedIn, Pinterest)
- Per-campaign breakdown
- Metrics: impressions, clicks, spend, conversions, CTR, CPC, CPA, ROAS
- Date range filtering
- CSV/PDF export
- Funnel analysis (impression → click → conversion)
- Device & geographic heatmaps (100-view gate)

### 3.3 AI-Driven Optimization

- Auto-detect high-ROAS platforms, suggest budget reallocation
- Detect underperformers, recommend pause/optimization
- Scale winning campaigns (>3x ROAS)
- Platform-specific adjustments (targeting, bidding, creative)
- Recommendation impact scoring (0-100% expected ROAS improvement)
- Auto-apply with audit trail
- Manual dismiss capability

### 3.4 First-Party Data Platform (CDP)

**Phase 1 — Data Collection:**
- Pixel endpoint for conversion tracking (public, rate-limited)
- CSV import for email lists
- Cross-device user unification (deterministic hashing)
- User profile enrichment (behavioral metrics, segments)

**Phase 2 — Audience Activation:**
- Segment audiences with rule-based targeting (field/operator/value)
- Export to platform custom audiences (hashed email/phone)
- Activation tracking per platform
- Sync status monitoring

**Phase 3 — CRM Integrations:**
- Connect Shopify, Salesforce, Klaviyo
- Sync customer data (order history, revenue, recency)
- Predictive scoring (churn risk, LTV, engagement, conversion probability)
- Lookalike audience generation (similarity-based)

### 3.5 Platform Integrations

**OAuth Flow:**
- Authorization URL generation per platform
- Callback handling + token exchange
- Token encryption (AES-256-GCM) at rest
- Automatic refresh (hourly check, refresh 24h before expiry)

**Metrics Syncing:**
- Fetch last 30 days of metrics from each platform
- Aggregate into unified view
- Manual sync trigger (`/dashboard/sync-now`)
- Configurable sync frequency (realtime, hourly, daily)

**Supported Platforms:**
- Google Ads (API v15)
- Meta (Graph API v18)
- TikTok (Business API)
- LinkedIn (Campaign Manager v2)
- Pinterest (Ads API v5)

### 3.6 Anomaly Detection

**Auto-trigger on:**
- CTR drops >20% vs 7-day average
- CPA spikes >25% vs 7-day average
- Spend anomalies (>30% variance)
- Conversion rate collapse

**Actions:**
- Auto-pause campaign (optional)
- Notify advertiser (email + in-app)
- Webhook dispatch
- Audit log entry

### 3.7 Rewards & Redemption

- Advertiser-issued reward credits
- QR code generation (HMAC-SHA256 signed, 2-min TTL)
- One-time redemption per QR code
- FIFO balance deduction
- Merchant redemption workflow (approve/reject)

### 3.8 Team Collaboration

- Role-based access (admin, campaign_manager, viewer)
- Invitation workflow
- Audit logging of all actions
- Permissions enforcement on sensitive operations

---

## 4. Technical Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Backend** | Node.js + Express.js | 20.x / 7.x |
| **Backend DI** | tsyringe | 4.x |
| **Database** | MongoDB + Mongoose | 8.x |
| **Cache** | Redis | 7.x |
| **Task Queue** | Bull | 4.x |
| **Auth** | JWT (jsonwebtoken) | 9.x |
| **Email** | Resend API | v1 |
| **Frontend** | React + Vite | 18.x / 5.x |
| **Frontend Router** | React Router | 6.x |
| **State** | Zustand + TanStack Query | 4.x / 5.x |
| **Mobile** | Expo + React Native | SDK 55 |
| **Validation** | Zod | 3.x |

---

## 5. API Endpoints (RESTful)

**Base:** `/api/v1`

| Feature | Endpoint | Auth | Methods |
|---------|----------|------|---------|
| Auth | `/auth/register`, `/auth/login`, `/auth/refresh` | None | POST |
| Campaigns | `/campaigns` | JWT | GET, POST, PATCH, DELETE |
| Creatives | `/campaigns/:id/creatives` | JWT | GET, POST |
| Analytics | `/analytics/dashboard`, `/analytics/:campaignId` | JWT | GET |
| Heatmaps | `/heatmaps/:campaignId` | JWT | GET |
| AI Optimization | `/ai/recommendations`, `/ai/apply/:recommendationId` | JWT | GET, POST |
| Anomalies | `/anomalies/:campaignId` | JWT | GET |
| Conversion Pixel | `/pixel/:campaignId` | None (public) | POST |
| Platform Accounts | `/platform-accounts` | JWT | GET, POST, PATCH, DELETE |
| OAuth | `/oauth/authorize/:platform`, `/oauth/callback/:platform` | Token-aware | GET |
| CDP (Data) | `/cdp/pixel`, `/cdp/import-csv`, `/cdp/profiles` | JWT | POST, GET |
| CDP (Audiences) | `/cdp/audiences` | JWT | GET, POST |
| CRM Integration | `/cdp-advanced/crm/integrate`, `/cdp-advanced/crm/sync` | JWT | POST, GET |
| Webhooks | `/webhooks` | JWT | GET, POST, DELETE |
| Unified Dashboard | `/dashboard/unified-metrics`, `/dashboard/sync-now` | JWT | GET, POST |
| Rewards | `/rewards/balance`, `/rewards/claim` | JWT | GET, POST |
| Redemption | `/redemption/generate-qr`, `/redemption/approve` | JWT | POST |

---

## 6. Database Schema (core entities)

- **User** — advertiser + admin accounts
- **Campaign** — advertising campaigns
- **Creative** — ad creatives (images, copy)
- **AdEvent** — impressions, clicks, conversions, viewability
- **PlatformAccount** — OAuth tokens for Google, Meta, TikTok, LinkedIn, Pinterest
- **UserProfile** — CDP unified user records
- **Audience** — segmented user lists
- **AudienceActivation** — per-platform audience sync status
- **Reward** — advertiser-issued credits
- **Redemption** — QR code redemptions
- **Review** — user reviews of campaigns
- **TeamMember** — RBAC assignments
- **AnomalyAlert** — detected anomalies + notifications
- **AiAuditLog** — recommendation application history
- **Webhook** — advertiser-configured event webhooks

---

## 7. Quality Standards

Per **PROMPT_PLAYBOOK.md**:

### 7.1 Commits

- **Format:** Conventional Commits (`feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `build`, `ci`)
- **Body:** Detailed — explain WHY, not WHAT
- **No AI authorship:** Never include "Built with Claude" or similar in messages
- **Atomic:** One concern per commit
- **Frequency:** Small, logically-grouped changes

### 7.2 Tests

- **Unit tests:** Mock external dependencies, use Jest
- **Integration tests:** Real database/Redis via testcontainers (when applicable)
- **End-to-end:** Smoke tests for new API endpoints
- **Coverage:** Aim for >75% on critical paths (auth, payment, data mutation)

### 7.3 Documentation

- **Doc comments:** Every exported function, class, interface, constant
- **Architecture doc:** ARCHITECTURE.md — live code map, updated per commit
- **Contributing guide:** CONTRIBUTING.md — workflow, testing, deployment
- **Specification:** This file — product + tech decisions

### 7.4 Design Patterns

- **Dependency Injection (tsyringe):** All services injectable, composition-root in `container.ts`
- **Repository pattern:** All DB access goes through repository interfaces
- **Adapter pattern:** Platform integrations (OAuth, metrics, audience export)
- **Strategy pattern:** Swappable storage providers (Cloudinary, S3, local)
- **Provider pattern:** External services (email, AI) behind interfaces with stub + real impl

### 7.5 Linting

- **ESLint:** Configured in `backend/.eslintrc.json` and `frontend/.eslintrc.json`
- **Prettier:** Format enforcement
- **TypeScript:** `strict: true`
- **Pre-commit hooks:** Lint + format check before commit (configured in `.husky/pre-commit`)

---

## 8. Deployment

### 8.1 Environments

| Env | Backend | Frontend | Mobile | Notes |
|-----|---------|----------|--------|-------|
| **Dev** | localhost:4000 | localhost:3000 | Expo dev server | Local MongoDB, Redis |
| **Staging** | Render | Vercel | EAS Build preview | Cloud MongoDB, Redis |
| **Production** | Render | Vercel | EAS Build release | Production DBs, stripe mode |

### 8.2 CI/CD

- **GitHub Actions:** Lint + test on PR
- **Pre-merge gate:** All tests + lints must pass
- **Auto-deploy:** Merge to `main` triggers Vercel (frontend), Render (backend)

### 8.3 Environment Variables

**Backend (.env):**
```
NODE_ENV=production
DATABASE_URL=mongodb+srv://...
REDIS_URL=redis://...
JWT_SECRET=<strong-random>
ENCRYPTION_SECRET=<strong-random>
RESEND_API_KEY=<from Resend>
GOOGLE_OAUTH_CLIENT_ID=<from Google Cloud>
GOOGLE_OAUTH_CLIENT_SECRET=<...>
META_OAUTH_APP_ID=<from Meta Developer>
META_OAUTH_APP_SECRET=<...>
TIKTOK_OAUTH_CLIENT_ID=<from TikTok>
TIKTOK_OAUTH_CLIENT_SECRET=<...>
LINKEDIN_OAUTH_CLIENT_ID=<from LinkedIn>
LINKEDIN_OAUTH_CLIENT_SECRET=<...>
PINTEREST_OAUTH_CLIENT_ID=<from Pinterest>
PINTEREST_OAUTH_CLIENT_SECRET=<...>
CORS_ORIGINS=https://app.daadd.com,https://staging.daadd.com
BACKEND_URL=https://api.daadd.com
FRONTEND_URL=https://app.daadd.com
STRIPE_SECRET_KEY=<if using Stripe>
ANTHROPIC_API_KEY=<for AI Creative generation>
```

**Frontend (.env):**
```
VITE_API_URL=https://api.daadd.com/api/v1
VITE_APP_NAME=SmartDeals
```

---

## 9. Non-Functional Requirements

- **Performance:** API responses <200ms p95, dashboard load <1.5s (with 500+ campaigns)
- **Availability:** 99.5% uptime SLA
- **Scalability:** Support 10K advertisers, 1M campaigns, 10B events
- **Security:** OAuth 2.0, JWT with 1-hour expiry, password hashing (bcrypt), encrypted tokens at rest
- **Compliance:** GDPR right-to-be-forgotten, CCPA compliance, no PII in logs
- **Observability:** Structured logging, error tracking (Sentry), monitoring (DataDog)

---

## 10. Known Constraints & Decisions

1. **Conversion value:** Assumed $50 per conversion for ROAS calculation (configurable per advertiser in future)
2. **Attribution window:** 30-day lookback for cohort analysis (configurable per campaign)
3. **A/B test winner:** Auto-declared after 10K impressions or 7 days, whichever comes first
4. **QR code TTL:** 2 minutes (security trade-off vs. convenience)
5. **Anomaly detection:** Triggered on 7-day moving average baseline (not hard thresholds)
6. **OAuth token storage:** Encrypted with AES-256-GCM, decrypted only when making API calls
7. **Email delivery:** Resend API (replaced legacy Nodemailer setup for reliability)

---

## 11. Open Questions (None — all decided via PROMPT_PLAYBOOK decision-making)

---

## 12. Future Roadmap

- **Phase 2:** Real-time WebSocket metrics streaming
- **Phase 3:** Programmatic RTB bidding
- **Phase 4:** Connected TV (CTV) ad management
- **Phase 5:** Audio advertising (Spotify, Podcast APIs)
- **Phase 6:** Retail Media Networks (Amazon, Walmart, Target)

---

**Last Updated:** May 17, 2026  
**Maintained By:** Development Team  
**Status:** Active
