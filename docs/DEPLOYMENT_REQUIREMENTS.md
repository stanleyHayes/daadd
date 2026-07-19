# 🚀 DAADD Deployment Requirements

**Last Updated:** May 19, 2026  
**Status:** Production-Ready

---

## 📋 Quick Checklist

### Before Going Live, You Need:

**Required Services:**
- [ ] MongoDB Atlas or self-hosted instance
- [ ] Redis server (Cloud or self-hosted)
- [ ] Vercel (Frontend) or equivalent hosting
- [ ] Node.js hosting (Backend) - Heroku, Railway, EC2, etc.
- [ ] Domain name(s)
- [ ] SSL/TLS Certificate (usually automatic)

**Required API Keys & Credentials:**
- [ ] Resend API Key (for email)
- [ ] Cloudinary account OR AWS S3 (for file storage)
- [ ] Google Maps API Key (optional, for heatmaps)
- [ ] Anthropic API Key (for AI features)
- [ ] Google OAuth credentials
- [ ] Meta OAuth credentials
- [ ] TikTok OAuth credentials
- [ ] Pinterest OAuth credentials

**Required Configuration:**
- [ ] Production .env files (backend + frontend)
- [ ] Database backups configured
- [ ] Error tracking (Sentry recommended)
- [ ] Analytics (Mixpanel recommended)
- [ ] Monitoring & alerts
- [ ] CI/CD pipeline

---

## 🎯 Environment Variables Setup

### Backend (.env file)

```bash
# ===== DATABASE =====
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/daadd?retryWrites=true&w=majority
REDIS_HOST=redis.example.com      # or localhost for self-hosted
REDIS_PORT=6379                   # default, change if different
REDIS_PASSWORD=your_redis_password # if required
REDIS_URL=redis://:password@host:6379  # alternative single-var format

# ===== SERVER =====
NODE_ENV=production
PORT=4000
APP_NAME=DAADD

# ===== AUTHENTICATION =====
JWT_SECRET=generate-a-long-random-string-here-min-32-chars
JWT_REFRESH_SECRET=another-long-random-string-min-32-chars
JWT_EXPIRATION=7d
JWT_REFRESH_EXPIRATION=30d

# ===== FRONTEND =====
FRONTEND_URL=https://app.yourdomain.com
BACKEND_URL=https://api.yourdomain.com

# ===== CORS =====
CORS_ORIGINS=https://app.yourdomain.com,https://www.yourdomain.com

# ===== EMAIL DELIVERY =====
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx  # from Resend dashboard
FROM_EMAIL=noreply@yourdomain.com

# ===== FILE STORAGE (Cloudinary only) =====
STORAGE_PROVIDER=cloudinary

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_FOLDER=daadd

# ===== OAUTH INTEGRATIONS =====
GOOGLE_OAUTH_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your_google_secret
GOOGLE_OAUTH_REDIRECT_URI=https://api.yourdomain.com/api/v1/oauth/callback/google

META_OAUTH_APP_ID=123456789
META_OAUTH_APP_SECRET=your_meta_secret
META_OAUTH_REDIRECT_URI=https://api.yourdomain.com/api/v1/oauth/callback/meta

TIKTOK_OAUTH_CLIENT_ID=your_tiktok_id
TIKTOK_OAUTH_CLIENT_SECRET=your_tiktok_secret
TIKTOK_OAUTH_REDIRECT_URI=https://api.yourdomain.com/api/v1/oauth/callback/tiktok

PINTEREST_OAUTH_CLIENT_ID=your_pinterest_id
PINTEREST_OAUTH_CLIENT_SECRET=your_pinterest_secret
PINTEREST_OAUTH_REDIRECT_URI=https://api.yourdomain.com/api/v1/oauth/callback/pinterest

# ===== AI / ANTHROPIC =====
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx

# ===== MAPS (Optional) =====
GOOGLE_MAPS_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxx

# ===== LOGGING & MONITORING =====
LOG_LEVEL=info              # debug, info, warn, error
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/123456  # optional

# ===== STRIPE (Optional - for payments) =====
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Frontend (.env file)

```bash
VITE_API_URL=https://api.yourdomain.com/api/v1
VITE_APP_NAME=DAADD
```

### Mobile (EAS Build config)

```json
{
  "expo": {
    "name": "DAADD",
    "build": {
      "production": {
        "env": {
          "API_URL": "https://api.yourdomain.com/api/v1"
        }
      }
    }
  }
}
```

---

## 🏗️ Hosting Options

### Option A: Vercel (Recommended for Frontend + Edge Functions)
**Cost:** $20/month (Pro) + usage  
**Best for:** React frontend, Edge Functions, global CDN

**Setup:**
1. Push code to GitHub
2. Connect repo to Vercel
3. Set environment variables
4. Deploy frontend
5. Configure domain

```bash
# Push to GitHub first
git add .
git commit -m "Production deployment"
git push origin main

# Then on Vercel dashboard:
# 1. Import project
# 2. Set environment variables
# 3. Deploy
```

### Option B: Railway (Recommended for Backend)
**Cost:** $5+ per month (pay-as-you-go)  
**Best for:** Node.js backend, databases, Redis

**Setup:**
1. Connect GitHub repo
2. Create new service (Backend)
3. Set environment variables
4. Deploy
5. Configure domain

### Option C: AWS EC2 (Self-managed)
**Cost:** $10-50+/month depending on instance  
**Best for:** Full control, custom setup

**Setup:**
```bash
# SSH into instance
ssh -i key.pem ec2-user@your-instance.amazonaws.com

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs

# Install PM2 for process management
npm install -g pm2

# Clone repo
git clone https://github.com/yourusername/daadd.git
cd daadd

# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install

# Set environment variables
echo "MONGODB_URI=..." > backend/.env
# ... add all variables

# Start with PM2
pm2 start "npm run dev" --name "daadd-api"
pm2 save
pm2 startup

# Set up Nginx reverse proxy
sudo apt install nginx
# Configure /etc/nginx/sites-available/default
```

### Option D: Heroku (Easiest but more expensive)
**Cost:** $50+/month  
**Best for:** Quick deployment, simple setup

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create daadd-api

# Set environment variables
heroku config:set MONGODB_URI=...
heroku config:set JWT_SECRET=...
# ... add all variables

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

---

## 📦 Database Setup

### MongoDB Atlas (Cloud - Recommended)

**Steps:**
1. Go to [mongodb.com/cloud](https://mongodb.com/cloud)
2. Create free account
3. Create cluster (M0 free tier OK for starting)
4. Create database user with strong password
5. Add IP whitelist
6. Get connection string
7. Update `.env` with `MONGODB_URI`

**Connection String Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

**Production Recommendations:**
- Use M10+ cluster size (10GB+ storage)
- Enable backup snapshots
- Set up alerts for storage/connections
- Configure encryption at rest
- Use private endpoint (if using VPC)

### Self-hosted MongoDB

```bash
# Using Docker
docker run -d \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:latest
```

---

## 💾 Redis Setup

### Redis Cloud (Recommended - Free tier available)

**Steps:**
1. Go to [redis.com/try-free](https://redis.com/try-free)
2. Create free account
3. Create database (Free tier: 30MB)
4. Get connection details
5. Update `.env` with `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

**Connection String Format:**
```
redis://:password@host:port
```

### Self-hosted Redis

```bash
# Using Docker
docker run -d \
  -p 6379:6379 \
  -v redis_data:/data \
  redis:latest redis-server --appendonly yes

# Or install on Ubuntu/Debian
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
```

---

## 🔑 API Keys & Services

### Resend (Email Delivery)
**Cost:** Free tier: 100 emails/day; Paid: $20/month  

**Setup:**
1. Go to [resend.com](https://resend.com)
2. Create account
3. Add sending domain (DKIM, DMARC, SPF records)
4. Get API key
5. Add to `.env`: `RESEND_API_KEY=re_xxxx`

**Test:**
```bash
curl -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from":"noreply@yourdomain.com","to":"test@example.com","subject":"Test","html":"Test"}'
```

### Cloudinary (Image Storage)
**Cost:** Free tier: 25GB; Paid: $99+/month  

**Setup:**
1. Go to [cloudinary.com](https://cloudinary.com)
2. Create account
3. Get Cloud Name, API Key, API Secret from Dashboard
4. Add to `.env`:
   ```
   CLOUDINARY_CLOUD_NAME=xxx
   CLOUDINARY_API_KEY=xxx
   CLOUDINARY_API_SECRET=xxx
   ```

### Anthropic (AI Features)
**Cost:** Pay-as-you-go (~$0.003 per 1K tokens)  

**Setup:**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create account
3. Get API key from Settings
4. Add to `.env`: `ANTHROPIC_API_KEY=sk-ant-xxx`

### Google OAuth (for advertiser login)
**Cost:** Free  

**Setup:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project
3. Enable "Google+ API"
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `https://api.yourdomain.com/api/v1/oauth/callback/google`
6. Get Client ID and Secret
7. Add to `.env`:
   ```
   GOOGLE_OAUTH_CLIENT_ID=xxx
   GOOGLE_OAUTH_CLIENT_SECRET=xxx
   ```

### Meta/Facebook OAuth
**Cost:** Free  

**Setup:**
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create app
3. Add "Facebook Login" product
4. Configure OAuth redirect URI: `https://api.yourdomain.com/api/v1/oauth/callback/meta`
5. Get App ID and Secret
6. Add to `.env`:
   ```
   META_OAUTH_APP_ID=xxx
   META_OAUTH_APP_SECRET=xxx
   ```

---

## 🌐 Domain & SSL Setup

### Domain Registration
- **Registrars:** Namecheap, GoDaddy, Route53, Cloudflare
- **Cost:** $10-15/year

### DNS Configuration

**For Vercel Frontend:**
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

**For Backend (Railway example):**
```
Type: CNAME
Name: api
Value: railway.app
```

**Or use Cloudflare (recommended):**
1. Move domain to Cloudflare (free)
2. Create CNAME records pointing to your hosts
3. Enable SSL/TLS (free with Cloudflare)
4. Enable auto-redirect HTTP → HTTPS

### SSL/TLS Certificate
- **Vercel:** Automatic (free)
- **Railway:** Automatic (free)
- **Self-hosted:** Let's Encrypt (free, automatic with Certbot)

```bash
# On EC2/self-hosted with Nginx:
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
sudo systemctl restart nginx
```

---

## 🔍 Monitoring & Logging

### Error Tracking (Sentry)
**Cost:** Free tier; Paid: $29/month  

```bash
npm install --save @sentry/node @sentry/tracing

# In backend/src/app.ts
import * as Sentry from "@sentry/node";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.errorHandler());
}
```

### Application Monitoring
- **Datadog:** $15/month (infrastructure + APM)
- **New Relic:** Free tier available
- **AWS CloudWatch:** ~$0.30/day

### Recommended Alerts
```
API Error Rate > 5%          → Slack notification
Response Time p95 > 500ms    → Slack notification
Database CPU > 80%           → Email alert
Redis Memory > 80%           → Slack notification
Disk Space < 10%             → Email alert
```

---

## 📊 Scaling Checklist

**When you hit 1,000 users:**
- [ ] Enable database query caching
- [ ] Set up Redis connection pooling
- [ ] Configure CDN for static assets
- [ ] Set up multi-region deployment
- [ ] Enable API rate limiting by tier

**When you hit 10,000 users:**
- [ ] Implement database sharding/clustering
- [ ] Set up load balancing
- [ ] Implement caching strategy
- [ ] Configure auto-scaling
- [ ] Move to dedicated database instance (M30+)

**When you hit 100,000 users:**
- [ ] Consider microservices architecture
- [ ] Implement message queues (RabbitMQ, Kafka)
- [ ] Set up analytics data warehouse
- [ ] Global CDN with edge servers
- [ ] Multi-region deployment strategy

---

## 🧪 Pre-Launch Testing

```bash
# 1. Type checking
cd backend && npx tsc --noEmit
cd ../frontend && npx tsc --noEmit

# 2. Build
npm run build:all

# 3. Start services
docker-compose up -d  # MongoDB & Redis
npm run dev          # Backend
npm run dev          # Frontend (in another terminal)

# 4. Manual testing
# - Create account
# - Create campaign
# - View analytics
# - Test AI recommendations
# - Test anomaly detection
# - Test blog and i18n

# 5. Load testing
npm install -g artillery
artillery quick --count 100 --num 10 https://api.yourdomain.com/api/v1/campaigns

# 6. Security scan
npm audit
npx snyk test

# 7. Lighthouse audit
npx lighthouse https://app.yourdomain.com --view
```

---

## 📈 Cost Estimate (First Year - Basic Tier)

| Service | Monthly | Notes |
|---------|---------|-------|
| MongoDB Atlas | $10-50 | M10 cluster |
| Redis Cloud | $15 | 1GB |
| Resend | $20 | 100K emails/month |
| Cloudinary | $0-99 | 25GB free tier |
| Vercel Frontend | $20 | Pro plan |
| Railway Backend | $20 | ~500 hours compute |
| Domain | $1 | $12/year |
| CDN/Edges | $10 | Optional |
| Monitoring | $15 | Sentry + Datadog lite |
| **TOTAL** | **~$111/month** | **~$1,332/year** |

---

## 🚀 Deployment Checklist

### 1 Week Before Launch
- [ ] All environment variables configured
- [ ] Database backups tested
- [ ] SSL certificates ready
- [ ] Domains pointing correctly
- [ ] Email domain authenticated (DKIM, DMARC, SPF)

### Day Before Launch
- [ ] Final code review
- [ ] Database migration tested
- [ ] Load test passed
- [ ] Error tracking configured
- [ ] Analytics configured

### Launch Day
- [ ] Deploy to staging first
- [ ] Run smoke tests
- [ ] Monitor error rate (should be <0.5%)
- [ ] Monitor performance metrics
- [ ] Have rollback plan ready

### After Launch
- [ ] Monitor for 24 hours
- [ ] Check error logs
- [ ] Verify email delivery
- [ ] Test webhook delivery
- [ ] Confirm payments processed (if applicable)

---

## 🔗 Useful Links

- **MongoDB Atlas:** https://cloud.mongodb.com
- **Redis Cloud:** https://redis.com/try-free
- **Vercel:** https://vercel.com
- **Railway:** https://railway.app
- **Resend:** https://resend.com
- **Cloudinary:** https://cloudinary.com
- **Sentry:** https://sentry.io
- **Google Cloud Console:** https://console.cloud.google.com
- **Meta Developers:** https://developers.facebook.com
- **Anthropic Console:** https://console.anthropic.com

---

## 💡 Pro Tips

1. **Use environment-specific configs** — Dev, staging, production
2. **Rotate secrets regularly** — Every 90 days
3. **Keep backups** — Test restore monthly
4. **Monitor costs** — Set up billing alerts
5. **Plan for scale** — From day 1
6. **Document everything** — Future you will thank present you
7. **Use Redis for sessions** — Not MongoDB
8. **Cache aggressively** — But invalidate smartly
9. **Test email flow** — Use sandbox credentials first
10. **Set up monitoring first** — Before issues happen

**Ready to launch? Start with MongoDB Atlas + Vercel + Railway!**
