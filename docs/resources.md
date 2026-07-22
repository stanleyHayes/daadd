# SmartAdDeals — Resources Guide

Every external account, API key, platform, and local dependency needed to run this monorepo (backend + frontend + mobile) end-to-end. Split by "required to boot" vs "required for specific features" vs "production-only."

---

## Repository layout

| App | Path | Runtime | Local port |
|---|---|---|---|
| Backend (Express + TypeORM) | `backend/` | Node ≥20 | **4000** |
| Frontend (Vite + React) | `frontend/` | Node ≥20 | **3000** |
| Mobile (Expo + React Native) | `mobile/` | Node ≥20 + Expo | **8082** (Metro) |
| Shared types | `shared/` | — | — |

---

## 1. Required to boot (the minimum)

These **must** exist for `npm run dev` to start cleanly. Everything below is free.

### 1.1 Node.js
- Version: `>=20.0.0`, npm `>=10.0.0` (enforced in root `package.json`)
- Managed here via `nvm` (`v23.11.0` currently installed)

### 1.2 Docker Desktop
- Source: https://www.docker.com/products/docker-desktop
- Used for: MongoDB, Redis, and (optionally) Elasticsearch containers
- Alternatively, install MySQL 8 and Redis 7 natively and skip Docker

### 1.3 MySQL 8.0
- **Required**: yes — primary data store
- Docker compose already provisions it on host port **3307**
- Native alternative: `brew install mysql@8.4 && brew services start mysql@8.4`
- Backend env keys: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`

### 1.4 Redis 7
- **Required**: yes — used by Bull queues and session cache
- Docker compose provisions it on host port **6380**
- Native alternative: `brew install redis && brew services start redis`
- Backend env keys: `REDIS_HOST`, `REDIS_PORT`

### 1.5 JWT secret
- **Required**: yes — generates and verifies auth tokens
- Generate: `openssl rand -hex 64`
- Backend env key: `JWT_SECRET` (change from the default `daadd-jwt-secret-change-in-production`)

---

## 2. Required for specific features

Skip these if you're not using the feature — the app will still boot without them.

### 2.1 Google Maps JavaScript API key
- **Feature**: Heatmap page ([frontend/src/components/heatmap/HeatmapView.tsx](frontend/src/components/heatmap/HeatmapView.tsx)) and any map-based visualization
- **Platform**: https://console.cloud.google.com/
  1. Create a project → Enable **Maps JavaScript API** + **Places API**
  2. APIs & Services → Credentials → Create API key
  3. Restrict to `HTTP referrers` for `localhost:3000` (dev) and your prod domain
- **Env keys**:
  - Frontend: `VITE_GOOGLE_MAPS_KEY` (in `frontend/.env`)
  - Backend: `GOOGLE_MAPS_API_KEY` (for geocoding in events)
- **Cost**: free tier = $200/month credit, enough for small-to-medium projects

### 2.2 Cloudinary (creatives upload)
- **Feature**: `POST /campaigns/:id/creatives` — image/video uploads shown across the ad catalog
- **Setup**: https://cloudinary.com
  1. Create a free account and note your **cloud name**, **API key**, and **API secret**
  2. Set `STORAGE_PROVIDER=cloudinary` and fill `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  3. (Optional) Set `CLOUDINARY_UPLOAD_FOLDER=daadd` to group uploads
- **Cost**: free tier covers generous storage/bandwidth for development and early production

### 2.3 Elasticsearch (analytics search)
- **Feature**: Currently referenced in config but not actively consumed — can be left off in dev
- Docker compose provisions it on port **9200**
- Env key: `ELASTICSEARCH_URL`

### 2.4 Mobile push notifications
- **Feature**: `expo-notifications` plugin (already in `mobile/app.json`)
- **Platform**: https://expo.dev — register an account, create a project, run `eas build`
- **Env key**: Expo Access Token (for `eas` CLI), plus push credentials for iOS (APNs cert) and Android (FCM server key) when you build native
- Not needed for Expo Go dev

---

## 3. Production-only (when you're ready to ship)

### 3.1 Domain + DNS
- Buy a domain (Namecheap, Cloudflare Registrar, Google Domains, etc.)
- Point A/AAAA or CNAME at your host (see 3.2)

### 3.2 Hosting
Pick one stack — the apps are cleanly separable:

| Component | Good fits |
|---|---|
| Frontend (static Vite build) | Vercel, Netlify, Cloudflare Pages, S3+CloudFront |
| Backend (Express) | Fly.io, Railway, Render, AWS ECS/App Runner, DigitalOcean App Platform |
| MySQL | PlanetScale, AWS RDS, DigitalOcean Managed MySQL, Railway |
| Redis | Upstash, AWS ElastiCache, Railway |
| Object storage | Cloudinary |
| Mobile | Expo EAS (builds + submission to App Store / Play Store) |

### 3.3 Email provider (not yet wired, but notifications table exists)
- Options: Resend (https://resend.com — simplest), SendGrid, AWS SES, Postmark
- Not required now — notifications are currently in-app only

### 3.4 Error/observability (recommended for prod)
- **Sentry** (https://sentry.io) — free tier covers small teams, one-line install
- **Better Stack** or **Logtail** — log aggregation
- **Plausible** / **PostHog** / **Google Analytics** — product analytics (not the ad analytics you built — the meta-layer)

### 3.5 CI/CD
- GitHub Actions (free for public repos) — workflow file should run: `npm ci && npm run build:all && npm test`
- Or: the hosting provider's built-in pipeline (Vercel, Railway, Fly — all have git-push-to-deploy)

---

## 4. Full env variable reference

### `backend/.env`
```bash
# Core — required
DATABASE_HOST=localhost
DATABASE_PORT=3307
DATABASE_NAME=daadd
DATABASE_USER=root
DATABASE_PASSWORD=daadd_root_2024
REDIS_HOST=localhost
REDIS_PORT=6380
JWT_SECRET=<generate-with-openssl-rand-hex-64>
JWT_EXPIRATION=7d
APP_PORT=4000
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Storage — Cloudinary is required for uploading creatives
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_FOLDER=daadd

# Optional
GOOGLE_MAPS_API_KEY=                # server-side geocoding
ELASTICSEARCH_URL=http://localhost:9200
QR_SECRET=<random-string>           # HMAC secret for redemption QR codes
NODE_ENV=development
```

### `frontend/.env`
```bash
VITE_API_URL=http://localhost:4000/api/v1
VITE_GOOGLE_MAPS_KEY=<your-browser-restricted-key>
```

### `mobile/.env`
```bash
EXPO_PUBLIC_API_URL=http://localhost:4000/api/v1
# For physical-device testing, swap localhost for your Mac's LAN IP (e.g. http://192.168.1.20:4000/api/v1)
```

---

## 5. Quick-start checklist

```bash
# 1. Clone + install
npm install

# 2. Copy env templates
cp backend/.env.example  backend/.env
cp frontend/.env.example frontend/.env
cp mobile/.env.example   mobile/.env

# 3. Infra up
docker-compose up -d mongodb redis elasticsearch

# 4. Seed demo data (12 users, 15 campaigns, ~5K events)
npm run db:seed

# 5. Run everything
npm run dev          # backend + frontend
npm run dev:all      # backend + frontend + mobile (Expo)
```

Credentials for seeded users are printed once by `npm run seed:team --workspace backend`
and are not stored in the repo. A `credentials.txt` was previously committed here; it has
been removed and everything in it must be rotated.

---

## 6. Cost estimate (dev vs small prod)

| Tier | Per-month cost |
|---|---|
| **Local dev** (Docker only) | $0 |
| **Hobby prod** (Railway + Cloudflare R2 + Upstash Redis + Vercel) | ~$5–$20 |
| **Small team prod** (managed DB + Redis + S3 + Sentry + custom domain) | ~$40–$100 |
| **Google Maps** (above free tier) | pay-as-you-go |

Everything above the free tier is optional — this stack can run at $0/mo in development indefinitely.
