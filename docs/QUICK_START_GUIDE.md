# DAADD — Quick Start Guide

**Status:** ✅ Fully Operational  
**Last Updated:** May 19, 2026

---

## 🚀 Current System Status

| Component | Status | URL | Port |
|-----------|--------|-----|------|
| Backend API | ✅ Running | http://localhost:4000 | 4000 |
| Frontend Web | ✅ Running | http://localhost:3000 | 3000 |
| Mobile App | Ready | Expo tunnel | 8082 |
| Blog System | ✅ Implemented | `/blog` & `/blog/:id` | 3000 |
| i18n (5 langs) | ✅ Implemented | Header switcher | 3000 |
| Database | Configured | MongoDB | 27017 |
| Cache | Configured | Redis | 6380 |

---

## 📝 Blog System — What's New

### Access the Blog
```
Frontend: http://localhost:3000/blog
```

### Blog Pages
- **Blog List** (`/blog`) — View all 6 posts with category filtering
- **Blog Post Detail** (`/blog/:id`) — Full article view
  - `/blog/1` — Geo-Targeting in 2026
  - `/blog/2` — Ad Journey Storyteller
  - `/blog/3` — FitLife Case Study
  - `/blog/4` — High-Converting Copy Tips
  - `/blog/5` — Privacy-First Advertising
  - `/blog/6` — Anomaly Detection Update

### Features
- ✅ Category filtering (AdTech Trends, Platform Updates, Case Studies, Tips & Guides)
- ✅ Clickable cards with smooth navigation
- ✅ Related posts sidebar
- ✅ Share and Save buttons
- ✅ Author profiles
- ✅ Responsive mobile design

---

## 🌍 Internationalization (i18n) — What's New

### Supported Languages
- 🇺🇸 English (en)
- 🇪🇸 Spanish (es)
- 🇫🇷 French (fr)
- 🇩🇪 German (de)
- 🇵🇹 Portuguese (pt)

### How to Switch Languages
1. Click the **globe icon** in the top navigation bar
2. Select your preferred language from the dropdown
3. The entire site translates instantly
4. Your choice is saved in browser storage

### Translated Elements
- Navigation menu (Browse Ads, About, Blog)
- Blog page (title, subtitle, filters)
- Blog post detail (back button, related posts)
- Footer (copyright, legal links)
- Header buttons (Get Started, Sign up)

---

## 💻 System Architecture

### Backend Stack
- **Framework:** Express.js (Node.js 20)
- **Database:** MongoDB with Mongoose ORM
- **Caching:** Redis (port 6380)
- **Job Queue:** Bull (async task processing)
- **Authentication:** JWT + OTP
- **DI Container:** Tsyringe
- **API:** RESTful with ~20 route files, ~21 services

### Frontend Stack
- **Framework:** React 18 with Vite
- **Routing:** React Router v6
- **Data Fetching:** TanStack Query v5
- **State Management:** Zustand
- **Styling:** Tailwind CSS
- **Internationalization:** i18next + react-i18next
- **Icons:** Lucide React
- **Animations:** Framer Motion

### Mobile Stack
- **Framework:** React Native (Expo)
- **Routing:** Expo Router
- **Storage:** SecureStore (token), AsyncStorage (prefs)
- **Runtime:** Expo SDK 55

---

## 🔧 Development Commands

### Start Everything
```bash
# Terminal 1 — Backend
cd backend
npm install  # if needed
npm run dev

# Terminal 2 — Frontend
cd frontend
npm install  # if needed
npm run dev

# Terminal 3 — Mobile (optional)
cd mobile
npx expo start
```

### Backend
```bash
npm run dev     # Start dev server with hot reload
npm run build   # Build for production
npm run seed    # Seed database (if available)
```

### Frontend
```bash
npm run dev     # Start Vite dev server
npm run build   # Build for production
npm run preview # Preview production build
npm run lint    # Check TypeScript & ESLint
```

### Mobile
```bash
npx expo start                    # Start Expo (interactive mode)
npx expo start --tunnel          # Tunnel mode for remote testing
npx expo prebuild                # Prebuild before EAS build
npx eas build --platform ios     # Build for iOS (requires Apple account)
npx eas build --platform android # Build for Android (requires Play Store)
```

---

## 📊 Project Statistics

- **Total Code:** 50,000+ lines
- **Backend Services:** 21 (Auth, Campaign, Analytics, AI Optimization, Heatmap, Anomaly Detection, Attribution, Rewards, Redemption, Team, Webhook, Email, Storage, etc.)
- **API Routes:** 20+ route files
- **Database Entities:** 13 (Campaign, Ad Event, User, Creative, Platform Account, etc.)
- **Frontend Pages:** 23 (Dashboard + Public pages)
- **Translation Keys:** 50+ in 5 languages
- **Blog Posts:** 6 with full content
- **Mobile Screens:** 8+ (Auth, Home, Search, Ad Detail, Profile, Rewards)

---

## 🎯 Key Features Implemented

### Campaign Management
- ✅ Create, read, update, delete campaigns
- ✅ Multi-status lifecycle (DRAFT → ACTIVE → PAUSED → COMPLETED)
- ✅ Budget tracking and controls
- ✅ Date-based scheduling
- ✅ Creative management with A/B testing

### Analytics & Insights
- ✅ Real-time dashboard with timeseries charts
- ✅ Funnel analysis (impressions → clicks → conversions)
- ✅ Device & regional breakdowns
- ✅ CSV & PDF export
- ✅ Anomaly detection with alerts
- ✅ Competitive benchmarking

### AI & Optimization
- ✅ 4 recommendation types (budget, audience, creative, creative-analysis)
- ✅ Automatic recommendation application
- ✅ Audit log for all changes
- ✅ Creative A/B testing insights
- ✅ 48-hour optimization gate

### Engagement & Rewards
- ✅ Reward catalog for consumers
- ✅ QR code redemption (HMAC-signed, 2-min TTL, one-time use)
- ✅ Reward balance tracking (FIFO deduction)
- ✅ Redemption merchant integrations
- ✅ Reward claim tracking

### Platform Features
- ✅ Geographic heatmaps (100-view gate, city/country fallback)
- ✅ Ad fatigue management (5 per 24h cap)
- ✅ Cross-device attribution (device journeys)
- ✅ Ad Journey Storyteller (5-chapter PDF/HTML export)
- ✅ Role-based access control (5 roles)
- ✅ Team collaboration & audit logs

### Localization
- ✅ 10 supported currencies with live rates
- ✅ 14 language options
- ✅ Region-specific CTR suggestions
- ✅ Timezone-aware scheduling

---

## 📍 Key Endpoints

### Blog
```
GET  /blog              # Blog list page
GET  /blog/:id          # Individual blog post
```

### Authentication
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/verify-otp
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
```

### Campaigns
```
GET    /api/v1/campaigns
POST   /api/v1/campaigns
GET    /api/v1/campaigns/:id
PATCH  /api/v1/campaigns/:id
DELETE /api/v1/campaigns/:id
POST   /api/v1/campaigns/:id/clone
```

### Analytics
```
GET /api/v1/analytics/dashboard
GET /api/v1/analytics/timeseries
GET /api/v1/analytics/funnel
GET /api/v1/analytics/devices
GET /api/v1/analytics/regions
GET /api/v1/analytics/export-csv
GET /api/v1/analytics/export-pdf
```

### AI & Optimization
```
GET  /api/v1/ai/recommendations
POST /api/v1/ai/recommendations/apply
GET  /api/v1/ai/recommendations/:id
```

### Heatmaps
```
GET /api/v1/heatmaps/:campaignId
```

### Anomalies
```
GET /api/v1/anomalies
GET /api/v1/anomalies/:campaignId
```

### Storyteller
```
GET  /api/v1/storyteller/:campaignId
POST /api/v1/storyteller/:campaignId/generate
```

### Events & Tracking
```
POST /api/v1/events/track
POST /api/v1/events/batch
GET  /api/v1/events/:campaignId
```

### Rewards & Redemption
```
GET    /api/v1/rewards
GET    /api/v1/rewards/balance/:userId
POST   /api/v1/rewards/claim
GET    /api/v1/redemptions
POST   /api/v1/redemptions/validate
POST   /api/v1/redemptions/approve
```

### Team & Roles
```
GET    /api/v1/team
POST   /api/v1/team/invite
GET    /api/v1/team/audit-log
```

### Webhooks
```
GET    /api/v1/webhooks
POST   /api/v1/webhooks
DELETE /api/v1/webhooks/:id
```

---

## 🔐 Security Features

- ✅ JWT authentication with refresh tokens
- ✅ OTP age verification (2-year minimum)
- ✅ HMAC-SHA256 signed QR codes
- ✅ Role-based access control (RBAC)
- ✅ Input validation middleware
- ✅ Token encryption (at-rest)
- ✅ CORS configured
- ✅ Rate limiting (pixel endpoint)

---

## 🌐 Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/daadd
REDIS_URL=redis://localhost:6380
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
BACKEND_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000
RESEND_API_KEY=your-resend-key (optional)
ANTHROPIC_API_KEY=your-anthropic-key (for AI features)
GOOGLE_OAUTH_CLIENT_ID=...
META_OAUTH_APP_ID=...
TIKTOK_OAUTH_CLIENT_ID=...
PINTEREST_OAUTH_CLIENT_ID=...
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:4000/api/v1
```

---

## 📖 Documentation

- **API Docs:** `/docs` (if Swagger is enabled)
- **Architecture:** See project comments and README files
- **Blog Implementation:** `BLOG_AND_I18N_IMPLEMENTATION.md`
- **Operational Costs:** `OPERATIONAL_COSTS.md`
- **Deployment:** `DEPLOYMENT_CHECKLIST.md`
- **Feature Status:** `PROJECT_STATUS_MAY_2026.md`

---

## ✅ What's Working Now

**Backend:** All services operational  
**Frontend:** All pages functional with theme toggle  
**Mobile:** Ready for testing (Expo)  
**Blog:** Fully functional with 6 articles  
**i18n:** 5 languages implemented  
**Dark Mode:** Full support across all pages  
**Responsive Design:** Mobile, tablet, desktop optimized  
**Real-time Features:** WebSocket, notifications (Redis-based)  

---

## 🚧 Known Limitations

- Email delivery: Requires Resend API key (currently returns OTP in response for dev)
- OAuth: Requires platform credentials (Google, Meta, TikTok, Pinterest)
- SMS delivery: Not yet implemented
- Stripe payments: Not yet integrated
- Advanced analytics exports: Available (CSV/PDF)
- Mobile push notifications: Not yet implemented

---

## 💡 Next Steps

1. **Production Deployment:** Follow `DEPLOYMENT_CHECKLIST.md`
2. **Environment Configuration:** Set all .env variables for production
3. **Domain Setup:** Point custom domain to Vercel (frontend) and backend host
4. **Email Service:** Configure Resend or another provider
5. **OAuth Credentials:** Register apps on Google, Meta, TikTok, Pinterest
6. **Payment Processing:** Integrate Stripe for affiliate payouts (if needed)
7. **Monitoring:** Set up error tracking (Sentry) and analytics (Mixpanel)
8. **CI/CD:** Configure GitHub Actions or similar
9. **Testing:** Run full integration test suite
10. **Go Live:** Deploy to production following the checklist

---

## 📞 Support

For questions or issues:
1. Check the relevant documentation file
2. Review the code comments in the specific service/page
3. Check the console for error messages
4. Review git history for recent changes

---

**Built with ❤️ on DAADD**  
*Intelligent Ad Management Platform*
