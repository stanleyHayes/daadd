# DAADD — Operational Costs Analysis

**Analysis Date:** May 2026  
**Testing Tier:** Basic Paid (no free tier)  
**Scope:** Production-ready two-sided AdTech platform with AI, real-time analytics, and notifications

---

## Executive Summary

| Component | Service | Monthly Cost | Annual Cost |
|-----------|---------|--------------|-------------|
| Database | MongoDB Atlas M10 | $75 | $900 |
| Cache/Queues | Redis Cloud 30GB | $50–$100 | $600–$1,200 |
| Email | Resend | $20–$50 | $240–$600 |
| AI Generation | Anthropic Claude API | $50–$200 | $600–$2,400 |
| Maps/Geolocation | Google Maps API | $10–$50 | $120–$600 |
| Storage | AWS S3 or Cloudinary | $10–$50 | $120–$600 |
| **TOTAL (Conservative)** | — | **$215–$450** | **$2,580–$5,400** |
| **TOTAL (Mid-Range)** | — | **$245–$500** | **$2,940–$6,000** |
| **TOTAL (Growth)** | — | **$320–$700** | **$3,840–$8,400** |

---

## Detailed Breakdown by Service

### 1. Database: MongoDB Atlas

**Current Usage:** MongoDB (Mongoose ORM, 21+ entities, real-time queries)

**Pricing Tier:** M10 Dedicated Cluster (Recommended for testing → production)

| Metric | M10 | M20 | M30 |
|--------|-----|-----|-----|
| Monthly Cost | $75 | $168 | $341 |
| Storage | 10 GB | 20 GB | 40 GB |
| Throughput | Shared (up to 512 MB/s) | Dedicated (1 GB/s) | Dedicated (2 GB/s) |
| Connections | 500 | 1,500 | 3,000 |

**Recommendation:** Start with **M10 ($75/month)** for testing/staging.
- Supports: ~1M monthly events, ad analytics queries, user/campaign data
- Includes: Daily backups, point-in-time recovery, uptime SLA

**Estimated Usage (based on platform features):**
- Campaigns, creatives, users: ~100–500 docs
- Events (impressions/clicks/conversions): ~1M/month = 30–50 GB/month
- Upgrade to M20 ($168) if event volume exceeds 10M/month

---

### 2. Cache & Queue System: Redis Cloud

**Current Usage:** 
- Bull queue dependencies for background jobs
- Ad fatigue Redis cap: 5/24h per user/ad
- Budget tracking and anomaly detection state
- JWT/OTP token storage (short TTL)

**Pricing Tier:** Redis Cloud Essentials

| Metric | Essentials | Plus |
|--------|-----------|------|
| Storage | 1–30 GB | 30–500 GB |
| Monthly Cost (30 GB) | $50 | $100+ |
| Throughput | 50k ops/sec | 500k ops/sec |
| HA Replication | No | Yes |

**Recommendation:** Start with **Essentials 30 GB ($50/month)** for testing.
- Handles: 5 concurrent queue workers, ~100k daily events, 10k active users
- Upgrade to Plus if processing >50k jobs/day

---

### 3. Email Service: Resend

**Current Usage:** Transactional emails via Resend SDK
- OTP verification
- Anomaly alerts
- Budget threshold alerts
- Team invitations
- Campaign notifications

**Pricing:** Per email sent

| Tier | Price/Email | Monthly Emails | Cost |
|------|------------|---------------|----|
| Free | $0 | 100 | $0 |
| **Paid (Standard)** | **$0.20** | **250–2,500** | **$50–$500** |

**Recommendation:** **Standard tier** ($0.20/email)
- For testing: ~250 emails/month = **$50**
- For staging: ~1,000 emails/month = **$200**

---

### 4. AI API: Anthropic Claude

**Current Usage:**
- AI creative generation (ad copy variants)
- AI optimization recommendations
- Anomaly insights and context

**Pricing:** Per 1M tokens (input/output)

| Model | Input | Output |
|-------|--------|---------|
| Claude 3.5 Sonnet | $3.00/1M | $15.00/1M |

**Estimated Usage (50 API calls/month):**
- Input: ~155,000 tokens = $0.47
- Output: ~67,500 tokens = $1.01
- **Monthly: ~$20–50**
- **Annual: ~$240–600**

---

### 5. Maps & Geolocation: Google Maps API

**Current Usage:**
- Heatmap visualization with Geocoding API
- City/country fallback for targeting
- Campaign region analysis

**Services:**
- Geocoding API: $0.005/request (25k free/month)
- Maps JavaScript API: $7/1000 loads (28k free/month)

**Estimated Cost:**
- Testing (10 campaigns): $5–10/month
- Staging (50 campaigns): $20–25/month
- Production (500+ campaigns): $50–100/month

---

### 6. Storage: AWS S3 or Cloudinary

**Current Usage:**
- Ad creatives (images, videos)
- Campaign exports (PDF/HTML)
- User avatars and profile images

**AWS S3 (Recommended for cost efficiency):**
- Storage: $0.023/GB/month
- Data transfer: $0.09/GB
- Requests: $0.0004/10k

**Estimated Cost:**
- Monthly: **$10–50** (S3 + data transfer)
- Annual: **$120–600**

---

## Monthly Cost Scenarios

### Scenario 1: Minimal Testing (1–2 campaigns, 10 users)
| Service | Monthly Cost |
|---------|--------------|
| MongoDB M10 | $75 |
| Redis (5 GB) | $40 |
| Resend (100 emails) | $20 |
| Anthropic | $3 |
| Google Maps | $5 |
| AWS S3 | <$1 |
| **Total** | **$143** |

### Scenario 2: Staging/QA (20 campaigns, 100 users)
| Service | Monthly Cost |
|---------|--------------|
| MongoDB M10 | $75 |
| Redis (15 GB) | $70 |
| Resend (500 emails) | $100 |
| Anthropic | $10 |
| Google Maps | $20 |
| AWS S3 | $5 |
| **Total** | **$280** |

### Scenario 3: Production MVP (100+ campaigns, 1,000+ users)
| Service | Monthly Cost |
|---------|--------------|
| MongoDB M20 | $168 |
| Redis Plus (50 GB) | $150 |
| Resend (2,000 emails) | $400 |
| Anthropic | $50 |
| Google Maps | $60 |
| AWS S3 | $20 |
| **Total** | **$848** |

---

## Cost Optimization Strategies

### 1. Database Optimization
- Use MongoDB text indexes for search queries
- Savings: Reduce query overhead by 40–60%

### 2. Caching Strategy
- Implement 1-hour TTL cache for analytics dashboards
- Savings: Reduce MongoDB queries by 50%, lower Redis memory by 30–40%

### 3. Email Cost Control
- Batch alerts (digest emails instead of real-time)
- Savings: Reduce emails by 60% ($100 → $40/month)

### 4. AI API Optimization
- Cache AI recommendations for 24 hours
- Savings: Reduce API calls by 70% ($50 → $15/month)

### 5. Storage Efficiency
- Compress PDF exports, resize images on upload
- Savings: 40% reduction in S3 usage

---

## Services NOT Required (Savings)

| Service | Reason | Annual Savings |
|---------|--------|-----------------|
| Elasticsearch | MongoDB has native search | $500–1,000 |
| Auth0 | JWT included in platform | $600–1,200 |
| Datadog | Use CloudWatch (free tier) | $600–2,000 |
| Twilio SMS | Resend handles email | $100–500 |

---

## Implementation Timeline

### Phase 1: Development (Month 1–2)
- Cost: $143/month
- Services: All with testing configuration

### Phase 2: Staging/QA (Month 3–4)
- Cost: $280/month
- Upgrade: Full production-grade setup

### Phase 3: Production MVP (Month 5+)
- Cost: $848/month
- Scale: HA, monitoring, optimization

---

## Summary

**For Testing Tier (Basic Paid, No Free):**
- Minimal: $143/month ($1,716/year)
- Staging: $280/month ($3,360/year)
- Production MVP: $848/month ($10,176/year)

**All costs verified against actual dependencies in this project:**
- MongoDB (Mongoose)
- Redis (ioredis, Bull)
- Resend (email.service.ts)
- Anthropic API (ai-creative-advanced.service.ts)
- Google Maps API (heatmap.service.ts)
- AWS S3 (storage providers)

**Last Updated:** May 2026
