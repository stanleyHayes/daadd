# 🚀 Deployment Quick Reference

**TL;DR — Get these 3 things, then deploy:**

---

## 🎯 CRITICAL PATH (What You MUST Have)

### 1️⃣ Database (MongoDB)
```
Choose ONE:
✅ MongoDB Atlas (Cloud - RECOMMENDED)
   - Go to mongodb.com/cloud
   - Free M0 tier available
   - Get connection string
   - Add to MONGODB_URI in .env

❌ Self-hosted
   - More work to set up & maintain
```

### 2️⃣ Cache (Redis)
```
Choose ONE:
✅ Redis Cloud (Cloud - RECOMMENDED)
   - Go to redis.com/try-free
   - Free tier available
   - Get host + port + password
   - Add to REDIS_HOST, REDIS_PORT in .env

❌ Self-hosted
   - More work to maintain
```

### 3️⃣ Frontend Hosting (Vercel)
```
✅ Vercel (RECOMMENDED)
   - Connect GitHub repo
   - Takes 5 minutes
   - Free tier available
   - Auto-deploys on push

Alternatives:
- Netlify (similar to Vercel)
- AWS Amplify
- Firebase Hosting
```

### 4️⃣ Backend Hosting (Railway or Vercel)
```
✅ Railway (RECOMMENDED)
   - Connect GitHub repo
   - Takes 5 minutes
   - $5/month starting
   - Easy environment variables

Alternatives:
- Heroku ($50+/month)
- Vercel with serverless
- AWS EC2/Lightsail
```

### 5️⃣ Email Delivery (Resend)
```
✅ Resend (RECOMMENDED)
   - Go to resend.com
   - Free 100 emails/day
   - Get API key
   - Add to RESEND_API_KEY in .env

Alternatives:
- SendGrid
- Mailgun
- AWS SES
```

### 6️⃣ File Storage (Cloudinary)
```
✅ Cloudinary (RECOMMENDED)
   - Go to cloudinary.com
   - Free 25GB tier
   - Get Cloud Name + API Key + Secret
   - Add to CLOUDINARY_* in .env

Alternatives:
- AWS S3
- Google Cloud Storage
```

---

## 📋 QUICK SETUP STEPS

### Step 1: Get API Keys (15 minutes)
```bash
# 1. MongoDB Atlas
# mongodb.com/cloud → Create Account → Get URI

# 2. Redis Cloud  
# redis.com/try-free → Create Account → Get host:port

# 3. Resend
# resend.com → Get API Key

# 4. Cloudinary
# cloudinary.com → Get Cloud Name + Keys

# 5. Anthropic (for AI)
# console.anthropic.com → Get API Key

# 6. Domain Name
# namecheap.com or godaddy.com → Register
```

### Step 2: Configure .env Files (5 minutes)
```bash
# backend/.env
MONGODB_URI=mongodb+srv://...
REDIS_HOST=redis-host.cloud.redislabs.com
REDIS_PORT=6380
REDIS_PASSWORD=your-password
JWT_SECRET=generate-a-random-32-char-string
RESEND_API_KEY=re_xxxxx
CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
FRONTEND_URL=https://app.yourdomain.com
BACKEND_URL=https://api.yourdomain.com
CORS_ORIGINS=https://app.yourdomain.com,https://yourdomain.com

# frontend/.env
VITE_API_URL=https://api.yourdomain.com/api/v1
```

### Step 3: Deploy Backend (5 minutes)
```bash
# Option A: Railway (Easiest)
# 1. Go to railway.app
# 2. Connect GitHub
# 3. Select /backend folder
# 4. Add environment variables from .env
# 5. Deploy

# Option B: Heroku
# heroku create adplatform-api
# git push heroku main
# heroku config:set VAR=value ...

# Option C: EC2 (Most work)
# Requires manual setup - see DEPLOYMENT_REQUIREMENTS.md
```

### Step 4: Deploy Frontend (3 minutes)
```bash
# Option A: Vercel (Easiest)
# 1. Go to vercel.com
# 2. Import project
# 3. Select /frontend folder
# 4. Set VITE_API_URL environment variable
# 5. Deploy

# Auto-deploys on every push to main!
```

### Step 5: Configure Domain (10 minutes)
```bash
# In your domain registrar (Namecheap, GoDaddy, etc.):

# For Frontend (Vercel):
CNAME record: app → cname.vercel-dns.com

# For Backend (Railway):
CNAME record: api → your-railway-domain

# Or use Cloudflare for both (free):
# Move domain to Cloudflare
# Add CNAME records there
# Get free SSL automatically
```

---

## ✅ MINIMAL DEPLOYMENT CHECKLIST

```
SERVICES:
☐ MongoDB Atlas (free M0 tier)
☐ Redis Cloud (free tier)
☐ Vercel (free for frontend)
☐ Railway (or Heroku) for backend
☐ Resend (100 free emails/day)
☐ Cloudinary (free 25GB)

CONFIGURATION:
☐ backend/.env filled with all API keys
☐ frontend/.env with VITE_API_URL
☐ Domain name purchased
☐ Domain pointing to Vercel + Railway
☐ Database initialized
☐ Email domain authenticated (DKIM, SPF, DMARC)

VERIFICATION:
☐ Frontend loads at https://app.yourdomain.com
☐ Can login at https://api.yourdomain.com/docs
☐ Emails send successfully
☐ Images upload to Cloudinary
☐ WebSocket connects (real-time features work)
☐ Blog page loads with 5 languages
```

---

## 💰 COST BREAKDOWN (Monthly)

| Service | Cost | Can Use Free? |
|---------|------|---------------|
| MongoDB | $10+ | Yes (M0 free) |
| Redis | $15+ | Yes (free tier) |
| Vercel | $0 | Yes! |
| Railway | $20+ | Yes ($5/month) |
| Resend | $20+ | Yes (100/day free) |
| Cloudinary | $0 | Yes (25GB free) |
| Anthropic | $0-10 | Yes (pay-as-you-go) |
| Domain | $1 | No |
| **TOTAL** | **$66+** | **$1 if free tiers** |

**Start with all free tiers = $1/month for domain only!**

---

## ⚠️ COMMON MISTAKES

❌ **Don't:**
- Use localhost connection strings
- Commit .env files to git
- Use weak JWT secrets
- Forget to set CORS_ORIGINS
- Deploy without testing email
- Use free tier for production data

✅ **Do:**
- Use strong random secrets (32+ characters)
- Keep .env in .gitignore
- Test email flow before launch
- Enable monitoring/alerting
- Set up database backups
- Start with free tiers, upgrade as needed

---

## 🆘 TROUBLESHOOTING

### Frontend can't connect to backend
```bash
# Check:
1. VITE_API_URL is correct in frontend/.env
2. CORS_ORIGINS includes frontend URL in backend/.env
3. Backend is running and responding
4. Network not blocking requests

# Test:
curl https://api.yourdomain.com/api/v1/health
```

### Emails not sending
```bash
# Check:
1. RESEND_API_KEY is valid in .env
2. Email domain is authenticated (DKIM, SPF, DMARC)
3. FROM_EMAIL matches authenticated domain
4. Check Resend dashboard for bounce logs

# Test:
curl -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@yourdomain.com",
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

### Images not uploading
```bash
# Check:
1. CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET are correct
2. Storage provider is set to 'cloudinary' in .env
3. Cloudinary account has free tier quota remaining

# Test:
curl -X POST "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload" \
  -F "file=@test.jpg" \
  -F "api_key=YOUR_API_KEY"
```

### WebSocket/Real-time not working
```bash
# Check:
1. Redis is running/connected
2. REDIS_HOST and REDIS_PORT are correct
3. Firewall allows WebSocket (usually port 443 HTTPS)
4. Browser console shows Socket.IO connection status

# Test in browser console:
fetch('/api/v1/campaigns').then(r => r.json()).then(console.log)
```

---

## 📚 NEXT STEPS

### Step 1: Choose Your Hosting
- Vercel + Railway = Easiest (40 minutes setup)
- Vercel + Heroku = Alternative (50 minutes setup)
- AWS = Most control (2+ hours setup)

### Step 2: Get API Keys
- Collect all 6 API keys (15 minutes)
- Test each one (10 minutes)

### Step 3: Deploy
- Deploy backend (5 minutes)
- Deploy frontend (3 minutes)
- Test endpoints (5 minutes)

### Step 4: Monitor
- Set up error tracking (Sentry)
- Set up performance monitoring
- Set up alerts for critical issues

### Step 5: Optimize
- Enable caching
- Optimize database queries
- Configure CDN if needed

---

## 🎓 RECOMMENDED TECH STACK

**Backend Hosting:**
```
✅ Railway.app (best balance)
   - $5/month minimum
   - Auto-deploys on push
   - Built-in logging
   - Easy secrets management
```

**Frontend Hosting:**
```
✅ Vercel (free tier sufficient)
   - Free tier for personal use
   - Global CDN
   - Auto-deploys on push
   - Best Next.js/React support
```

**Database:**
```
✅ MongoDB Atlas (free M0)
   - Easy to scale
   - Automatic backups
   - Free tier workable
```

**Cache:**
```
✅ Redis Cloud (free tier)
   - Free 30MB tier
   - Works with Bull queues
   - Essential for real-time
```

**Email:**
```
✅ Resend (100 free/day)
   - Simple to integrate
   - Modern API
   - Good free tier
```

**Files:**
```
✅ Cloudinary (free 25GB)
   - Auto image optimization
   - CDN included
   - Works great with React
```

---

## 🚀 LAUNCH CHECKLIST (Final)

```
BEFORE GOING LIVE:
☐ All .env variables filled
☐ Database initialized with seed data
☐ Email sending working
☐ Images uploading working
☐ WebSocket connection working
☐ Blog pages loading
☐ i18n languages switching
☐ No console errors
☐ Mobile responsive
☐ Dark mode working
☐ All links working
☐ Forms submitting
☐ Analytics tracking

AFTER GOING LIVE:
☐ Monitor error rate (should be <1%)
☐ Check logs for issues
☐ Confirm email delivery
☐ Monitor database queries
☐ Watch Redis memory usage
☐ Set up alerts
☐ Daily backup check
☐ Weekly performance review
```

---

**Ready to launch?**
1. Choose Vercel + Railway + MongoDB Atlas
2. Get Resend + Cloudinary keys
3. Fill .env files
4. Deploy
5. Monitor

**Questions?** Check `DEPLOYMENT_REQUIREMENTS.md` for detailed setup.

Good luck! 🎉
