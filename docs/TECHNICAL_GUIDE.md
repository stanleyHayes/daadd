# DAADD Platform — Complete Technical Guide
**For Advertisers, Consumers, Developers, Admins & Merchants**

**Last Updated:** May 17, 2026  
**Version:** 2.1

---

## 📋 TABLE OF CONTENTS

1. [Platform Overview](#platform-overview)
2. [Advertiser Guide](#advertiser-guide)
3. [Consumer/User Guide](#consumeruser-guide)
4. [Developer Guide](#developer-guide)
5. [Admin Guide](#admin-guide)
6. [Merchant Guide](#merchant-guide)
7. [Common Tasks](#common-tasks)
8. [API Reference](#api-reference)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 PLATFORM OVERVIEW

**DAADD** is a two-sided AdTech platform where:
- **Advertisers** create campaigns, manage budgets, and track performance across Google Ads, Meta, TikTok, LinkedIn, and Pinterest
- **Consumers** view ads and earn rewards (USD balance)
- **Developers** integrate the platform into their systems via REST API
- **Admins** manage teams, configure system settings, and audit activity
- **Merchants** approve QR code redemptions and manage reward claims

### Key Features
- ✅ Unified metrics aggregation (5 platforms)
- ✅ AI-powered optimization recommendations
- ✅ Real-time budget alerts (75%, 90%, 100%)
- ✅ A/B testing framework for creatives
- ✅ QR code reward redemption (one-time use, HMAC-signed)
- ✅ First-party CDP for audience segmentation
- ✅ Webhook system for external integrations
- ✅ Role-based access control (RBAC)

**Base URLs:**
- Backend API: `https://api.daadd.com/api/v1` (prod) or `http://localhost:4000/api/v1` (local)
- Frontend App: `https://app.daadd.com` (prod) or `http://localhost:3000` (local)
- Mobile App: Expo SDK 55 (iOS/Android via EAS Build)

---

# 👔 ADVERTISER GUIDE

## Getting Started as an Advertiser

### 1. Registration & Authentication

**Register a new advertiser account:**
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "advertiser@company.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "role": "advertiser"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_abc123",
    "email": "advertiser@company.com",
    "name": "John Doe",
    "role": "advertiser"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_xyz789"
}
```

**Login:**
```bash
POST /auth/login
{
  "email": "advertiser@company.com",
  "password": "SecurePassword123!"
}
```

**Token expires in:** 1 hour  
**Refresh token:** Use to get new token without re-entering password
```bash
POST /auth/refresh
Authorization: Bearer <refresh_token>
```

### 2. Connect Your Advertising Platforms

Connect accounts from Google Ads, Meta, TikTok, LinkedIn, or Pinterest to sync metrics automatically.

#### Step 1: Get Authorization URL
```bash
GET /oauth/authorize/google
Authorization: Bearer <token>
```

**Response:**
```json
{
  "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...",
  "state": "state_token_123"
}
```

#### Step 2: User Clicks Link & Grants Permission
The platform redirects back to: `https://app.daadd.com/oauth/callback/google?code=...&state=...`

#### Step 3: Platform Exchanges Code for Token (automatic)
Our system stores the token **encrypted** (AES-256-GCM) at rest. Tokens refresh automatically every 24 hours.

#### View Connected Accounts:
```bash
GET /platform-accounts
Authorization: Bearer <token>
```

**Response:**
```json
{
  "data": [
    {
      "id": "pa_google_001",
      "platform": "google",
      "platform_account_id": "123-456-789",
      "platform_account_name": "My Google Ads Account",
      "status": "connected",
      "is_active": true,
      "sync_frequency": "realtime",
      "last_synced": "2026-05-17T14:32:00Z",
      "created_at": "2026-05-15T10:00:00Z"
    }
  ]
}
```

**Statuses:**
- `connected` — Token valid, syncing metrics
- `pending` — OAuth in progress
- `sync_error` — Last sync failed; check error_message
- `revoked` — User revoked access on platform; re-authorize needed

### 3. Create Your First Campaign

**Create a new campaign:**
```bash
POST /campaigns
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Summer Sale Campaign 2026",
  "description": "Drive traffic to summer product launch",
  "industry": "Retail",
  "start_date": "2026-06-01T00:00:00Z",
  "end_date": "2026-08-31T23:59:59Z",
  "budget_total": 5000.00,
  "reward_value": 2.50,
  "is_age_restricted": false,
  "enable_ai_optimization": true,
  "language": "en",
  "platform_ids": ["pa_google_001", "pa_meta_001"],
  "targeting_config": {
    "regions": ["US", "CA"],
    "devices": ["desktop", "mobile"],
    "languages": ["en"]
  }
}
```

**Response:**
```json
{
  "id": "camp_summer_2026",
  "name": "Summer Sale Campaign 2026",
  "status": "DRAFT",
  "advertiser_id": "user_abc123",
  "budget_total": 5000.00,
  "budget_spent": 0,
  "created_at": "2026-05-17T15:00:00Z"
}
```

**Campaign Status Machine:**
- `DRAFT` → (click "Launch") → `ACTIVE` → (end date/budget) → `COMPLETED` or `PAUSED`

### 4. Upload Creative Assets

**Add images/videos to your campaign:**
```bash
POST /campaigns/camp_summer_2026/creatives
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <image.jpg or video.mp4>
```

**Supported formats:**
- Images: JPG, PNG, WebP (max 10MB)
- Videos: MP4, WebM, MOV (max 100MB)

**Response:**
```json
{
  "id": "creative_img_001",
  "campaign_id": "camp_summer_2026",
  "type": "image",
  "url": "https://cdn.daadd.com/creatives/img_001.jpg",
  "format": "jpg",
  "file_size": 2048000
}
```

### 5. Monitor Campaign Performance

#### Unified Metrics Dashboard
```bash
GET /dashboard/unified-metrics?startDate=2026-06-01&endDate=2026-06-30
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total_metrics": {
    "impressions": 125000,
    "clicks": 3750,
    "conversions": 187,
    "spend": 1250.00,
    "ctr": 3.0,
    "cpc": 0.33,
    "cpa": 6.68,
    "roas": 1.5
  },
  "by_platform": {
    "google": { "impressions": 75000, "clicks": 2250, ... },
    "meta": { "impressions": 50000, "clicks": 1500, ... }
  },
  "daily_breakdown": [
    { "date": "2026-06-01", "impressions": 4000, "clicks": 120, ... },
    ...
  ]
}
```

#### Campaign-Specific Metrics
```bash
GET /campaigns/camp_summer_2026/analytics
Authorization: Bearer <token>
```

### 6. Receive Budget Alerts

When your campaign reaches spending thresholds, you'll receive:
1. **75% spent** → Email alert
2. **90% spent** → Email + in-app notification
3. **100% spent** → Campaign auto-paused + notification

**Check notifications in-app:**
```bash
GET /notifications
Authorization: Bearer <token>

# Mark as read:
PATCH /notifications/notif_001
{ "is_read": true }
```

### 7. Enable AI Optimization

Get automatic recommendations on budget allocation, creative optimization, and scaling strategies.

**Get AI recommendations:**
```bash
GET /ai/recommendations?campaignId=camp_summer_2026
Authorization: Bearer <token>
```

**Response:**
```json
{
  "recommendations": [
    {
      "id": "rec_001",
      "type": "scale_winning_platform",
      "campaign_id": "camp_summer_2026",
      "title": "Scale Google Ads (High ROAS)",
      "description": "Google Ads has 3x ROAS. Increase budget by $500.",
      "impact_potential": 85,
      "action": {
        "type": "increase_budget",
        "platform": "google",
        "amount": 500
      }
    }
  ]
}
```

**Apply a recommendation:**
```bash
POST /ai/apply/rec_001
Authorization: Bearer <token>

# Recommendation is auto-applied and logged in audit trail
```

### 8. A/B Test Your Creatives

**Create A/B test:**
```bash
POST /campaigns/camp_summer_2026/ab-test/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "campaignId": "camp_summer_2026",
  "controlCreativeId": "creative_img_001",
  "variantCreativeIds": ["creative_img_002", "creative_img_003"],
  "trafficAllocation": 20
}
```

**Get test results:**
```bash
GET /campaigns/camp_summer_2026/ab-test/results
Authorization: Bearer <token>
```

**Response:**
```json
{
  "testId": "test_ab_001",
  "campaignId": "camp_summer_2026",
  "controlCreative": {
    "id": "creative_img_001",
    "metrics": {
      "impressions": 10000,
      "clicks": 300,
      "ctr": 3.0
    }
  },
  "variantCreatives": [
    {
      "id": "creative_img_002",
      "metrics": {
        "impressions": 10000,
        "clicks": 400,
        "ctr": 4.0
      }
    }
  ],
  "winner": {
    "creativeId": "creative_img_002",
    "ctr": 4.0
  }
}
```

### 9. Clone & Reuse Successful Campaigns

**Clone a campaign:**
```bash
POST /campaigns/camp_summer_2026/clone
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "camp_summer_2026_copy",
  "name": "Summer Sale Campaign 2026 (Copy)",
  "status": "DRAFT",
  "budget_total": 5000.00,
  "budget_spent": 0,
  "creatives": [
    // All creatives from original copied
  ]
}
```

### 10. Issue QR Code Rewards

Allow consumers to scan QR codes and claim rewards.

**Generate QR code:**
```bash
POST /redemption/generate-qr
Authorization: Bearer <token>
Content-Type: application/json

{
  "campaign_id": "camp_summer_2026",
  "amount": 2.50,
  "quantity": 100
}
```

**Response:**
```json
{
  "qr_codes": [
    {
      "id": "qr_001",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "qr_image_url": "https://cdn.daadd.com/qr/qr_001.png",
      "amount": 2.50,
      "is_redeemed": false,
      "expires_at": "2026-05-17T16:02:00Z",
      "created_at": "2026-05-17T16:00:00Z"
    }
  ]
}
```

**QR Code Security:**
- HMAC-SHA256 signed tokens (cannot be forged)
- 2-minute expiry (single-use)
- Consumer scans → Automatic balance credit

---

# 📱 CONSUMER/USER GUIDE

## Getting Started as a Consumer

### 1. Registration & Mobile App Setup

**Download the mobile app** via Expo or app store, then register:

**Register:**
```bash
POST /auth/register
{
  "email": "consumer@example.com",
  "password": "SecurePassword123!",
  "name": "Alice Johnson",
  "role": "consumer"
}
```

**Login:**
```bash
POST /auth/login
{
  "email": "consumer@example.com",
  "password": "SecurePassword123!"
}
```

**Store token securely:**
- Mobile: `expo-secure-store` (encrypted keychain)
- Web: httpOnly cookie (server-set)

### 2. Browse Available Ads

**Get featured ads:**
```bash
GET /ads?featured=true
(No auth required — public endpoint)
```

**Response:**
```json
{
  "data": [
    {
      "id": "ad_summer_001",
      "advertiser": {
        "id": "advertiser_123",
        "name": "Summer Brand Co.",
        "logo": "https://cdn.daadd.com/logos/summer_brand.png"
      },
      "title": "Summer Collection 2026",
      "description": "Shop our new summer line",
      "creative_url": "https://cdn.daadd.com/creatives/summer.jpg",
      "reward_amount": 2.50,
      "is_age_restricted": false,
      "category": "Retail",
      "ctr": 3.5,
      "average_rating": 4.2,
      "review_count": 156
    }
  ]
}
```

### 3. View Ad Details & Reviews

**Get ad details:**
```bash
GET /ads/ad_summer_001
```

**Response:**
```json
{
  "id": "ad_summer_001",
  "title": "Summer Collection 2026",
  "reward_amount": 2.50,
  "reviews": [
    {
      "id": "review_001",
      "user_name": "Bob Smith",
      "rating": 5,
      "comment": "Great quality products!",
      "created_at": "2026-05-10T12:00:00Z"
    }
  ],
  "rating_summary": {
    "average": 4.2,
    "total_reviews": 156,
    "distribution": {
      "5_star": 120,
      "4_star": 25,
      "3_star": 8,
      "2_star": 2,
      "1_star": 1
    }
  }
}
```

### 4. View Ads & Earn Impressions

**Track ad view (impression):**
```bash
POST /events/track
Authorization: Bearer <token>
Content-Type: application/json

{
  "event_type": "IMPRESSION",
  "campaign_id": "camp_summer_2026",
  "ad_id": "ad_summer_001",
  "user_id": "user_consumer_123"
}
```

**Track viewable impression (ad visible for 1+ second):**
```bash
POST /events/track
{
  "event_type": "VIEWABLE_IMPRESSION",
  "campaign_id": "camp_summer_2026",
  "ad_id": "ad_summer_001",
  "user_id": "user_consumer_123"
}
```

### 5. Click & Convert

**Track click:**
```bash
POST /events/track
{
  "event_type": "CLICK",
  "campaign_id": "camp_summer_2026",
  "ad_id": "ad_summer_001",
  "user_id": "user_consumer_123"
}
```

**Track conversion (purchase/action on advertiser site):**
```bash
POST /events/track
{
  "event_type": "CONVERSION",
  "campaign_id": "camp_summer_2026",
  "ad_id": "ad_summer_001",
  "user_id": "user_consumer_123",
  "metadata": {
    "conversion_value": 50.00,
    "purchase_id": "order_12345"
  }
}
```

### 6. Claim Rewards via QR Code

**Scan QR code with mobile app:**
The app extracts the token from the QR code and sends:

```bash
POST /rewards/claim
Authorization: Bearer <token>
Content-Type: application/json

{
  "qr_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "reward_amount": 2.50,
  "new_balance": 25.50,
  "message": "Reward claimed! Check your balance in the app."
}
```

**Error cases:**
- `"Invalid or expired QR code"` — Token expired (2 min) or already redeemed
- `"Already claimed"` — QR code was used before (one-time only)
- `"Invalid token"` — QR was tampered with (HMAC mismatch)

### 7. Check Your Reward Balance

**Get reward balance:**
```bash
GET /rewards/balance
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total_balance": 25.50,
  "currency": "USD",
  "recent_claims": [
    {
      "id": "claim_001",
      "campaign_id": "camp_summer_2026",
      "amount": 2.50,
      "claimed_at": "2026-05-17T14:00:00Z"
    }
  ]
}
```

### 8. Write Reviews

**Submit a review for an ad:**
```bash
POST /reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "campaign_id": "camp_summer_2026",
  "rating": 5,
  "comment": "Amazing product quality! Would buy again."
}
```

**Response:**
```json
{
  "id": "review_user_001",
  "campaign_id": "camp_summer_2026",
  "user_id": "user_consumer_123",
  "rating": 5,
  "comment": "Amazing product quality! Would buy again.",
  "created_at": "2026-05-17T15:30:00Z"
}
```

**Constraints:**
- One review per campaign per user
- Edit/delete not allowed (immutable)
- Only eligible if you've claimed a reward from that campaign

### 9. Age Verification for Restricted Content

Some ads are age-restricted. You'll be prompted to verify.

**Request OTP:**
```bash
POST /auth/age-verify/request
Authorization: Bearer <token>
```

**Response:**
```json
{
  "expires_in": 600,
  "message": "OTP sent to your registered email"
}
```

**Verify OTP:**
```bash
POST /auth/age-verify/confirm
Authorization: Bearer <token>
{
  "otp": "123456"
}
```

### 10. Manage Your Profile

**Get profile:**
```bash
GET /users/me
Authorization: Bearer <token>
```

**Update profile:**
```bash
PATCH /users/me
Authorization: Bearer <token>
{
  "name": "Alice Johnson",
  "email": "alice.new@example.com"
}
```

---

# 💻 DEVELOPER GUIDE

## API Integration & Authentication

### 1. Authentication Flow

All API endpoints (except public ones like `/ads`, `/pixel`) require:

```bash
Authorization: Bearer <JWT_TOKEN>
```

**JWT Token Structure:**
```json
{
  "sub": "user_abc123",
  "email": "developer@example.com",
  "role": "advertiser",
  "iat": 1716000000,
  "exp": 1716003600
}
```

**Token Expiry:** 1 hour  
**Refresh:** Use `/auth/refresh` endpoint

### 2. Webhook Integration

Set up real-time event notifications to your HTTPS endpoint.

**Register webhook:**
```bash
POST /webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://your-api.example.com/webhooks/daadd",
  "events": [
    "campaign.anomaly_detected",
    "campaign.budget_threshold",
    "campaign.completed",
    "conversion.received"
  ]
}
```

**Response:**
```json
{
  "id": "webhook_001",
  "url": "https://your-api.example.com/webhooks/daadd",
  "secret": "whsec_abc123xyz789...",
  "events": ["campaign.anomaly_detected", ...],
  "is_active": true
}
```

**Receive webhook payload:**
```json
{
  "event": "campaign.budget_threshold",
  "timestamp": "2026-05-17T14:30:00Z",
  "data": {
    "campaign_id": "camp_summer_2026",
    "campaign_name": "Summer Sale Campaign 2026",
    "threshold": 75,
    "spent": 3750.00,
    "budget": 5000.00
  },
  "signature": "t=1716000000,v1=1234567890abcdef..."
}
```

**Verify webhook signature (HMAC-SHA256):**
```javascript
const crypto = require('crypto');
const secret = 'whsec_abc123xyz789...';
const [timestamp, signature] = req.headers['x-daadd-signature'].split(',');

const signed = crypto
  .createHmac('sha256', secret)
  .update(`${timestamp}.${JSON.stringify(req.body)}`)
  .digest('hex');

if (signed !== signature) {
  throw new Error('Invalid webhook signature');
}
```

### 3. Conversion Pixel Integration

Use for server-to-server conversion tracking (affiliate/partner sites).

**Post conversion:**
```bash
POST /pixel/camp_summer_2026?uid=user_123&ev=conversion&val=50&ref=affiliate.com
(No auth required — public endpoint)
```

**Parameters:**
- `uid` (optional) — User ID for cross-device tracking
- `ev` (required) — Event type (only "conversion" supported)
- `val` (optional) — Conversion value in cents (e.g., 50 = $0.50)
- `ref` (optional) — Referrer domain

**Response:** 1×1 transparent GIF (standard pixel format)

**Rate limits:** 100 requests/minute per campaign

### 4. Analytics API

**Get unified metrics:**
```bash
GET /dashboard/unified-metrics?startDate=2026-06-01&endDate=2026-06-30
Authorization: Bearer <token>
```

**Get campaign breakdown:**
```bash
GET /analytics/dashboard?campaignId=camp_summer_2026
Authorization: Bearer <token>
```

**Get creative A/B test metrics:**
```bash
GET /analytics/creatives/camp_summer_2026
Authorization: Bearer <token>
```

**Export to CSV:**
```bash
GET /analytics/export/csv?format=csv&campaignId=camp_summer_2026
Authorization: Bearer <token>
```

**Export to PDF:**
```bash
GET /analytics/export/pdf?format=pdf&campaignId=camp_summer_2026
Authorization: Bearer <token>
```

### 5. OAuth2 Integration (for platforms)

Connect to Google Ads, Meta, TikTok, LinkedIn, or Pinterest.

**Get authorization URL:**
```bash
GET /oauth/authorize/{platform}
Authorization: Bearer <token>
```

**Supported platforms:** `google`, `meta`, `tiktok`, `linkedin`, `pinterest`

**Platform redirects back with code:**
```
https://app.daadd.com/oauth/callback/{platform}?code=...&state=...
```

**Our system exchanges code for token (automatic):**
- Token stored encrypted (AES-256-GCM)
- Auto-refreshes 24 hours before expiry

### 6. Error Handling

All errors follow this format:

```json
{
  "error": {
    "message": "Campaign not found",
    "code": "NOT_FOUND",
    "status": 404
  }
}
```

**Common error codes:**
- `INVALID_INPUT` (400) — Validation failed
- `UNAUTHORIZED` (401) — Missing/invalid token
- `FORBIDDEN` (403) — Insufficient permissions
- `NOT_FOUND` (404) — Resource doesn't exist
- `CONFLICT` (409) — Resource state conflict
- `RATE_LIMITED` (429) — Too many requests
- `INTERNAL_ERROR` (500) — Server error

### 7. Pagination

List endpoints support pagination:

```bash
GET /campaigns?page=1&limit=20&sort=created_at&order=desc
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### 8. Rate Limiting

API rate limits:
- **Standard endpoints:** 1000 req/hour per API key
- **Pixel endpoint:** 100 req/minute per campaign
- **Webhook delivery:** 3 retry attempts with exponential backoff

**Rate limit headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1716003600
```

---

# 🔐 ADMIN GUIDE

## System Administration

### 1. User Management

**List all users:**
```bash
GET /users
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "data": [
    {
      "id": "user_abc123",
      "email": "advertiser@company.com",
      "name": "John Doe",
      "role": "advertiser",
      "created_at": "2026-05-15T10:00:00Z",
      "last_login": "2026-05-17T14:00:00Z"
    }
  ]
}
```

**Create user (admin-only):**
```bash
POST /users
Authorization: Bearer <admin_token>
{
  "email": "newuser@company.com",
  "password": "TempPassword123!",
  "name": "Jane Smith",
  "role": "campaign_manager"
}
```

**Update user role:**
```bash
PATCH /users/user_abc123
Authorization: Bearer <admin_token>
{
  "role": "admin"
}
```

**Deactivate user:**
```bash
DELETE /users/user_abc123
Authorization: Bearer <admin_token>
```

### 2. Team Management

**Create team:**
```bash
POST /teams
Authorization: Bearer <admin_token>
{
  "name": "Marketing Team",
  "description": "Handles all campaign management"
}
```

**Invite team member:**
```bash
POST /teams/team_001/invite
Authorization: Bearer <admin_token>
{
  "email": "team_member@company.com",
  "role": "campaign_manager"
}
```

**Role-based permissions:**
- `admin` — Full system access, user management, team configuration
- `campaign_manager` — Create/edit campaigns, view analytics
- `viewer` — View-only access to dashboards

### 3. Audit Logging

**Get audit logs:**
```bash
GET /audit-logs?type=campaign_created&startDate=2026-05-01
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "data": [
    {
      "id": "audit_001",
      "action": "campaign_created",
      "user_id": "user_abc123",
      "resource_id": "camp_summer_2026",
      "timestamp": "2026-05-17T15:00:00Z",
      "details": {
        "campaign_name": "Summer Sale Campaign 2026",
        "budget": 5000.00
      }
    }
  ]
}
```

**Audit event types:**
- `campaign_created`, `campaign_updated`, `campaign_deleted`
- `oauth_connected`, `oauth_revoked`
- `user_invited`, `user_role_changed`
- `ai_recommendation_applied`
- `anomaly_detected`

### 4. System Configuration

**Update system settings:**
```bash
PATCH /system/settings
Authorization: Bearer <admin_token>
{
  "cors_origins": ["https://app.daadd.com", "https://staging.daadd.com"],
  "email_provider": "resend",
  "max_campaign_budget": 100000.00,
  "otp_expiry_minutes": 10
}
```

**Check system health:**
```bash
GET /system/health
(No auth required)
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-05-17T15:00:00Z",
  "services": {
    "api": "operational",
    "mongodb": "operational",
    "redis": "operational",
    "email_service": "operational",
    "oauth_providers": {
      "google": "operational",
      "meta": "operational"
    }
  }
}
```

### 5. Analytics & Reporting

**Get platform-wide metrics:**
```bash
GET /admin/metrics?startDate=2026-05-01&endDate=2026-05-17
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "total_advertisers": 234,
  "total_consumers": 12450,
  "active_campaigns": 89,
  "total_spend": 125000.00,
  "total_rewards_issued": 15000.00,
  "total_impressions": 5000000,
  "total_conversions": 50000
}
```

---

# 🛍️ MERCHANT GUIDE

## Managing Reward Redemptions

### 1. Approve/Reject QR Code Claims

Merchants review and approve reward claims from consumers.

**Get pending redemptions:**
```bash
GET /redemption/pending
Authorization: Bearer <merchant_token>
```

**Response:**
```json
{
  "data": [
    {
      "id": "redemption_001",
      "qr_code_id": "qr_001",
      "campaign_id": "camp_summer_2026",
      "consumer_id": "user_consumer_123",
      "amount": 2.50,
      "status": "pending",
      "claimed_at": "2026-05-17T14:30:00Z"
    }
  ]
}
```

**Approve redemption:**
```bash
POST /redemption/approve
Authorization: Bearer <merchant_token>
{
  "redemption_id": "redemption_001",
  "action": "approve"
}
```

**Reject redemption:**
```bash
POST /redemption/approve
Authorization: Bearer <merchant_token>
{
  "redemption_id": "redemption_001",
  "action": "reject",
  "reason": "Invalid purchase proof"
}
```

### 2. Dynamic Redemption Control

Control how rewards are redeemed in real-time.

**Set redemption rules:**
```bash
POST /merchant/redemption-control
Authorization: Bearer <merchant_token>
{
  "campaign_id": "camp_summer_2026",
  "min_purchase_amount": 50.00,
  "max_daily_redemptions": 100,
  "require_purchase_proof": true,
  "proof_submission_method": "email"
}
```

**Response:**
```json
{
  "id": "control_001",
  "campaign_id": "camp_summer_2026",
  "is_active": true,
  "created_at": "2026-05-17T10:00:00Z"
}
```

### 3. Redemption History & Reporting

**Get redemption history:**
```bash
GET /merchant/redemptions?status=approved&startDate=2026-05-01
Authorization: Bearer <merchant_token>
```

**Response:**
```json
{
  "data": [
    {
      "id": "redemption_001",
      "consumer_name": "Alice Johnson",
      "amount": 2.50,
      "status": "approved",
      "approved_at": "2026-05-17T14:45:00Z"
    }
  ],
  "summary": {
    "total_approved": 500,
    "total_rejected": 10,
    "total_amount_approved": 1250.00
  }
}
```

---

# ⚙️ COMMON TASKS

## Task: Export Campaign Analytics as PDF

```javascript
// Backend example
const campaignId = 'camp_summer_2026';
const response = await fetch(
  `https://api.daadd.com/api/v1/analytics/export/pdf?campaignId=${campaignId}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/pdf'
    }
  }
);
const pdfBuffer = await response.arrayBuffer();

// Save or send via email
```

## Task: Integrate Conversion Pixel into E-Commerce Site

```html
<!-- On checkout success page -->
<img src="https://api.daadd.com/api/v1/pixel/camp_summer_2026?uid=user_123&ev=conversion&val=5000&ref=mystore.com" width="1" height="1" />

<!-- Alternative: JSON POST via JavaScript -->
<script>
  const campaignId = 'camp_summer_2026';
  const userId = getCookie('daadd_user_id'); // Set when user clicks ad
  const orderValue = 50.00 * 100; // Convert to cents
  
  fetch(`https://api.daadd.com/api/v1/pixel/${campaignId}?uid=${userId}&ev=conversion&val=${orderValue}`, {
    method: 'POST'
  });
</script>
```

## Task: Automate Daily Campaign Reports via Webhook

```javascript
// Your backend receives webhook
app.post('/webhooks/daadd', (req, res) => {
  const { event, data } = req.body;
  
  if (event === 'campaign.completed') {
    // Send final report email
    sendEmail(advertiserEmail, `Campaign ${data.campaign_name} completed`, {
      total_spend: data.total_spend,
      total_conversions: data.total_conversions,
      roi: data.roas
    });
  }
  
  res.json({ received: true });
});
```

## Task: Set Up Automated Budget Pacing Alerts

```javascript
// Webhook receives budget threshold events automatically
// You can then integrate with Slack, PagerDuty, etc.

app.post('/webhooks/daadd', async (req, res) => {
  const { event, data } = req.body;
  
  if (event === 'campaign.budget_threshold') {
    const slackMessage = {
      text: `Budget Alert: ${data.campaign_name} is ${data.threshold}% spent`,
      blocks: [{
        type: "section",
        text: {
          type: "mrkdwn",
          text: `💰 *${data.campaign_name}*\n` +
                `Spent: $${data.spent.toFixed(2)} / $${data.budget.toFixed(2)}`
        }
      }]
    };
    
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify(slackMessage)
    });
  }
  
  res.json({ received: true });
});
```

---

# 📚 API REFERENCE

## Authentication Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/auth/register` | None | Create new account |
| POST | `/auth/login` | None | Login and get token |
| POST | `/auth/refresh` | Refresh Token | Get new access token |
| PATCH | `/auth/change-password` | Bearer | Change password |
| POST | `/auth/forgot-password` | None | Request password reset |
| POST | `/auth/reset-password` | None | Reset password with token |
| GET | `/auth/me` | Bearer | Get current user |

## Campaign Management

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/campaigns` | Bearer | List campaigns |
| GET | `/campaigns/:id` | Bearer | Get campaign details |
| POST | `/campaigns` | Bearer | Create campaign |
| PATCH | `/campaigns/:id` | Bearer | Update campaign |
| DELETE | `/campaigns/:id` | Bearer | Delete campaign |
| POST | `/campaigns/:id/clone` | Bearer | Clone campaign |
| PATCH | `/campaigns/:id/status` | Bearer | Update status |

## Platform Accounts

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/platform-accounts` | Bearer | List connected accounts |
| POST | `/oauth/authorize/:platform` | Bearer | Get OAuth authorization URL |
| GET | `/oauth/callback/:platform` | None | OAuth callback (auto-handled) |
| PATCH | `/platform-accounts/:id` | Bearer | Update account settings |
| DELETE | `/platform-accounts/:id` | Bearer | Disconnect account |

## Analytics & Reporting

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/dashboard/unified-metrics` | Bearer | Get unified metrics |
| GET | `/analytics/dashboard` | Bearer | Campaign breakdown |
| GET | `/analytics/creatives/:campaignId` | Bearer | A/B test metrics |
| GET | `/analytics/export/csv` | Bearer | Export CSV |
| GET | `/analytics/export/pdf` | Bearer | Export PDF |

## AI Optimization

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/ai/recommendations` | Bearer | Get AI recommendations |
| POST | `/ai/apply/:recommendationId` | Bearer | Apply recommendation |

## Rewards & Redemption

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/rewards/claim` | Bearer | Claim reward via QR |
| GET | `/rewards/balance` | Bearer | Get reward balance |
| POST | `/redemption/generate-qr` | Bearer | Generate QR codes |
| POST | `/redemption/approve` | Bearer | Approve/reject claims |

## Webhooks

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/webhooks` | Bearer | Register webhook |
| GET | `/webhooks` | Bearer | List webhooks |
| PATCH | `/webhooks/:id` | Bearer | Update webhook |
| DELETE | `/webhooks/:id` | Bearer | Delete webhook |

## Public Endpoints (No Auth)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/ads` | Browse ads |
| GET | `/ads/:id` | Get ad details |
| POST | `/pixel/:campaignId` | Server-to-server conversion tracking |
| GET | `/system/health` | System health status |

---

# 🆘 TROUBLESHOOTING

## Common Issues & Solutions

### "Invalid or expired token"
**Cause:** JWT token expired (1 hour) or malformed  
**Solution:** Call `/auth/refresh` with refresh token to get new access token

### "Campaign not found"
**Cause:** Campaign ID doesn't exist or belongs to another user  
**Solution:** Double-check campaign ID; verify you're accessing your own campaigns

### "Budget alert not received"
**Cause:** Email service down or address marked as spam  
**Solution:** Check email spam folder; verify email address in account settings

### "QR code invalid or expired"
**Cause:** Code expired (2 min) or was already redeemed  
**Solution:** Generate new QR code; each code is single-use

### "Webhook not receiving events"
**Cause:** URL unreachable, signature verification failed, or wrong events subscribed  
**Solution:** Verify HTTPS endpoint is public; check webhook logs; verify secret

### "OAuth token refresh failed"
**Cause:** Platform revoked access; user changed password  
**Solution:** Re-authorize the platform via `/oauth/authorize/{platform}`

### "Rate limit exceeded"
**Cause:** Too many requests in short time  
**Solution:** Implement exponential backoff; check rate limit headers

### "Conversion not attributed to campaign"
**Cause:** Pixel fired after attribution window (default 30 days)  
**Solution:** Adjust attribution window via `/attribution/window/:campaignId`

---

## Support & Resources

- **API Documentation:** https://api.daadd.com/api/docs
- **Status Page:** https://status.daadd.com
- **Support Email:** support@daadd.com
- **Slack Channel:** #daadd-developers (for team members)
- **GitHub:** https://github.com/daadd/platform (open-source components)

---

**Document Version:** 2.1  
**Last Updated:** May 17, 2026  
**Maintained By:** DAADD Platform Team
