# SmartAdDeals

## Overview

SmartAdDeals is a two-sided AdTech and analytics platform. It connects advertisers with publishers through intelligent campaign management, real-time analytics, geographic heatmaps, AI-powered optimization, and cross-device attribution. The platform ships as three packages: an Express.js API server, a React web dashboard, and a React Native mobile app -- all sharing a common TypeScript type layer.

## Recent Updates (May 2026)

### Security Audit & Hardening
A comprehensive security audit was performed across all layers. Critical and high-severity issues were patched:

- **JWT & Encryption:** Removed all hardcoded fallback secrets. `JWT_SECRET` and `ENCRYPTION_SECRET` are now strictly required at startup.
- **Auth:** Fixed WebSocket JWT verification, added ownership checks to campaign status/AI toggle endpoints, stripped `role`/`is_active` from user profile updates to prevent privilege escalation.
- **Rate Limiting:** Added strict rate limits to auth endpoints (10 attempts / 5 min) and event tracking endpoints (60/min per IP).
- **Password Reset:** Replaced `Math.random()` with `crypto.randomBytes(32)` for cryptographically secure tokens.
- **Email XSS:** Added HTML escaping to all dynamic values in email templates.
- **Webhook SSRF:** Blocked private IP ranges, localhost, and internal hostnames from webhook registrations.
- **Pixel Tracking:** Removed client-controllable `ip` query parameter to prevent IP spoofing.
- **Error Handling:** Defaulted error responses to safe mode — stack traces only leak in `development`.

### Bug Fixes
- **Frontend:** Fixed runtime crash on Platform Accounts page, XSS vulnerability in blog posts, broken Select handler in Campaign Edit, missing Error Boundaries, case-sensitive import issues, and raw `fetch` calls bypassing the API client.
- **Mobile:** Fixed missing `updateUser` store method, undefined `colors.bg` references, null user crash in edit-profile, missing `initialPageParam` in infinite query, age verification bypass, 401 logout handling, and notification hook cleanup.
- **Backend:** Fixed malformed cron job in campaign lifecycle queue, batch track missing validation/fatigue checks, and email send failures being silently swallowed.

### Marketing Site Redesign
The public-facing marketing site was completely redesigned for a more polished, modern feel:
- **Landing Page:** Added animated floating blobs, social proof badges, animated stat counters, testimonial carousel, trust logos, and refined CTAs.
- **Navigation:** Scroll-aware header shadow, functional search bar, animated mobile menu, and a floating back-to-top button.
- **Footer:** Rich 4-column footer with newsletter signup.
- **About Page:** Animated counters, journey timeline, and improved team cards.
- **Blog:** Hover-lift cards with read-more reveals and category badges.
- **Browse Ads:** Grid/List view toggle and improved pagination.
- **Global:** Smooth scrolling, custom selection colors, and better focus rings.

## Tech Stack

| Layer          | Technologies                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------- |
| Backend        | Express.js, TypeScript, MongoDB (Mongoose), Passport JWT, Zod, Cloudinary (media storage), Resend (email) |
| Frontend       | React 18, Vite 5, TypeScript, Tailwind CSS, React Router 6, React Query, Recharts, Framer Motion, Zustand, Zod, Leaflet |
| Mobile         | React Native 0.73, Expo 50, TypeScript, React Navigation, Reanimated, Expo Router                |
| Infrastructure | Docker Compose, MongoDB 7, Cloudinary (media storage). Deploys to Render (backend) + Vercel (frontend). Redis & Elasticsearch containers are bundled in Docker Compose for future use but are not required by the live server. |

## Project Structure

```
daadd/
├── shared/                  # Shared TypeScript types, constants, validators
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── models/          # Mongoose schemas & models
│   │   ├── middleware/      # Auth, error handling, rate limiting
│   │   ├── routes/          # Route definitions (auth, campaigns, analytics, ...)
│   │   ├── services/        # Business logic (storage, mailer, ...)
│   │   ├── scripts/         # One-off scripts (seed, maintenance)
│   │   ├── utils/           # Shared helpers
│   │   ├── types/           # Shared backend types
│   │   ├── app.ts           # Express app setup
│   │   └── server.ts        # Entry point (connects to MongoDB)
│   ├── Dockerfile
│   └── package.json
├── frontend/                # React web application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route-level page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── stores/          # Zustand state stores
│   │   ├── services/        # API client layer
│   │   └── utils/           # Helpers, formatters, constants
│   ├── Dockerfile
│   └── package.json
├── mobile/                  # React Native mobile app (Expo)
│   ├── app/                 # Expo Router file-based routes
│   ├── components/          # Shared mobile components
│   ├── hooks/               # Custom hooks
│   ├── stores/              # Zustand state stores
│   ├── services/            # API client layer
│   ├── app.json             # Expo configuration
│   └── package.json
├── docker-compose.yml       # Full-stack orchestration
└── package.json             # Workspace root (npm workspaces)
```

## Prerequisites

- **Node.js** >= 20
- **npm** >= 10
- **Docker** & **Docker Compose**
- **Expo CLI** (for mobile development)

## Quick Start

### Option 1: Docker (Recommended)

1. **Clone the repository**

   ```bash
   git clone <repo-url> && cd daadd
   ```

2. **Copy environment files**

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   cp mobile/.env.example mobile/.env
   ```

3. **Start all services**

   ```bash
   docker-compose up -d
   ```

   This starts MongoDB, the backend (port 4000), and the frontend (port 3000). (Redis and Elasticsearch containers are also defined but are not required by the live server.)

4. **Wait for services to be healthy**

   ```bash
   docker-compose ps
   ```

   All containers should report a healthy status before proceeding.

5. **Seed the database**

   ```bash
   docker exec daadd-backend npm run seed
   ```

6. **Open the app**

   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Swagger API docs: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
   - Health check: [http://localhost:4000/health](http://localhost:4000/health)

### Option 2: Local Development

1. **Install dependencies** (from the repo root -- installs all workspaces)

   ```bash
   npm install
   ```

2. **Start the database**

   ```bash
   docker-compose up -d mongodb
   ```

   (Media uploads go to Cloudinary, an external service — no local container needed.)

3. **Copy and configure environment files**

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

   Edit the `.env` files if you need to change any defaults.

4. **Terminal 1 -- start the backend**

   ```bash
   npm run dev:backend
   ```

   Express starts on [http://localhost:4000](http://localhost:4000).

5. **Terminal 2 -- start the frontend**

   ```bash
   npm run dev:frontend
   ```

   Vite starts on [http://localhost:3000](http://localhost:3000).

6. **Seed the database**

   ```bash
   cd backend && npm run seed
   ```

### Running the Mobile App

1. **Install Expo CLI globally**

   ```bash
   npm install -g expo-cli
   ```

2. **Install mobile dependencies**

   ```bash
   cd mobile && npm install
   ```

3. **Configure the API URL**

   Edit `mobile/.env` and set `API_URL` to your machine's local IP address (not `localhost`) so physical devices can reach the backend:

   ```
   API_URL=http://192.168.x.x:4000/api
   ```

4. **Start the Expo dev server**

   ```bash
   npm start
   ```

5. **Run on a device or simulator**

   - Scan the QR code with the **Expo Go** app (iOS / Android)
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator

## Environment Variables

### Backend (`backend/.env`)

| Variable            | Description                                                  | Default                                  |
| ------------------- | ----------------------------------------------------------- | ---------------------------------------- |
| `MONGODB_URI`       | MongoDB connection string                                   | `mongodb://localhost:27017/daadd`        |
| `PORT` / `APP_PORT` | Port the Express server listens on                          | `4000`                                   |
| `JWT_SECRET`        | Secret for signing JWTs (**required** in production)        | _(none — boot fails if unset in prod)_   |
| `JWT_EXPIRATION`    | Access-token lifetime                                        | `1h`                                     |
| `JWT_REFRESH_EXPIRATION` | Refresh-token lifetime                                  | `7d`                                     |
| `STORAGE_PROVIDER`  | Upload backend: `cloudinary` \| `s3` \| `local`             | `cloudinary`                             |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name                                   | _(empty)_                                |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                                      | _(empty)_                                |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                                   | _(empty)_                                |
| `RESEND_API_KEY`    | Resend API key for transactional email                      | _(empty — dev logs tokens inline)_       |
| `FROM_EMAIL`        | Sender address for outgoing email                           | `onboarding@resend.dev`                  |
| `CORS_ORIGINS`      | Comma-separated allow-list (production blocks all if unset) | `http://localhost:3000`                  |

### Frontend (`frontend/.env`)

| Variable              | Description                        | Default                             |
| --------------------- | ---------------------------------- | ----------------------------------- |
| `VITE_API_URL`        | Backend API base URL               | `http://localhost:4000/api/v1`      |

### Mobile (`mobile/.env`)

| Variable   | Description              | Default                         |
| ---------- | ------------------------ | ------------------------------- |
| `API_URL`  | Backend API base URL     | `http://localhost:3000/api`     |

## API Documentation

- **Swagger UI** is available at [http://localhost:4000/api/docs](http://localhost:4000/api/docs) after starting the backend.
- See `docs/openapi.yaml` for the full OpenAPI 3.0 specification.
- Import `docs/daadd-postman-collection.json` into Postman for a ready-to-use API collection.

### API Route Groups

All routes are prefixed with `/api/v1`:

| Prefix          | Description                      |
| --------------- | -------------------------------- |
| `/auth`         | Authentication (login, register, refresh) |
| `/users`        | User management                  |
| `/campaigns`    | Campaign CRUD and lifecycle      |
| `/analytics`    | Aggregated analytics and reports |
| `/events`       | Raw event ingestion and queries  |
| `/heatmaps`     | Geographic heatmap data          |
| `/ai`           | AI-powered optimization          |
| `/anomalies`    | Anomaly detection alerts         |
| `/benchmarks`   | Competitive benchmarking         |
| `/attribution`  | Cross-device attribution         |
| `/storyteller`  | Ad journey storytelling          |
| `/rewards`      | Rewards system                   |
| `/teams`        | Team collaboration               |
| `/notifications`| In-app notifications             |

## Available Scripts

Run these from the repository root:

| Script                | Description                                            |
| --------------------- | ------------------------------------------------------ |
| `npm run dev:backend`  | Start the backend in dev mode (hot reload)            |
| `npm run dev:frontend` | Start the frontend Vite dev server                    |
| `npm run dev:mobile`   | Start the Expo mobile dev server                      |
| `npm run build:shared` | Build the shared types package                        |
| `npm run build:backend`| Compile backend TypeScript to `dist/`                 |
| `npm run build:frontend`| Build the frontend for production                    |
| `npm run build:all`   | Build shared, backend, and frontend in sequence        |
| `npm run test:backend` | Run backend tests (Jest)                              |
| `npm run test:frontend`| Run frontend tests                                    |
| `npm run lint`        | Lint all workspaces                                    |
| `npm run docker:up`   | Start all Docker Compose services                      |
| `npm run docker:down` | Stop all Docker Compose services                       |
| `npm run db:seed`     | Seed the database with sample data                     |

## Architecture

The platform is organized into the following feature modules:

- **Auth & RBAC** -- JWT-based authentication with role-based access control (Admin, Advertiser, Campaign Manager, Analyst, End User).
- **Campaign Management** -- Full campaign lifecycle: create, configure targeting, set budgets, schedule flights, upload creatives (stored in Cloudinary).
- **Analytics & Reporting** -- Real-time and historical analytics with exportable PDF/CSV reports. Powered by MongoDB aggregation pipelines.
- **Geographic Heatmaps** -- Leaflet + OpenStreetMap for visualizing ad impressions, clicks, and conversions by location (no map API key required).
- **AI Optimization** -- Machine-learning-driven bid and budget recommendations to maximize ROAS.
- **Anomaly Detection** -- Automated detection of unusual metric spikes or drops with configurable alert thresholds.
- **Competitive Benchmarking** -- Compare campaign performance against industry averages and competitors.
- **Ad Fatigue Management** -- Monitor creative fatigue signals and recommend rotation strategies.
- **Cross-Device Attribution** -- Track user journeys across desktop, mobile, and tablet to attribute conversions accurately.
- **Ad Journey Storyteller** -- Narrative visualization of how users interact with ads from first impression to conversion.
- **Rewards System** -- Gamified incentives for platform engagement and campaign milestones.
- **Team Collaboration** -- Shared workspaces, role assignments, and in-app notifications for team coordination.

## Design System

| Property    | Value                                                                 |
| ----------- | --------------------------------------------------------------------- |
| Font        | [Outfit](https://fonts.google.com/specimen/Outfit) (Google Fonts) |
| Theme       | Dark / Light mode toggle, persisted to `localStorage` (web) and `AsyncStorage` (mobile) |
| Animations  | Framer Motion (web), React Native Reanimated (mobile)                 |
| Primary     | `#2563EB`                                                             |
| Secondary   | `#7C3AED`                                                             |
| Accent      | `#10B981`                                                             |
| Warning     | `#F59E0B`                                                             |
| Danger      | `#EF4444`                                                             |

## Default Seed Data Credentials

After running the seed script (`npm run db:seed`), the following accounts are available:

| Role              | Email                      | Password       |
| ----------------- | -------------------------- | -------------- |
| Admin             | admin@daadd.com            | password123    |
| Advertiser        | advertiser@daadd.com       | password123    |
| Campaign Manager  | manager@daadd.com          | password123    |
| Analyst           | analyst@daadd.com          | password123    |
| End User          | user@daadd.com             | password123    |

> **Warning:** These credentials are for local development only. Never use them in production.

## Useful Ports

| Service            | Port  |
| ------------------ | ----- |
| Frontend (Vite)    | 3000  |
| Backend API        | 4000  |
| MongoDB            | 27017 |


## License

MIT
