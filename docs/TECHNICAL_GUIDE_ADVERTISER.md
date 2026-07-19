# DAADD — Technical Guide for Advertisers

**Platform:** DAADD (Two-Sided AdTech Platform)  
**Role:** Advertiser (Campaign Creator & Manager)  
**Last Updated:** May 2026  
**Audience:** Non-technical and technical advertisers managing ad campaigns

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Campaign Management Workflows](#campaign-management-workflows)
4. [Budget & Spend Tracking](#budget--spend-tracking)
5. [Analytics & Performance](#analytics--performance)
6. [AI-Powered Optimization](#ai-powered-optimization)
7. [Creative Management](#creative-management)
8. [Team Collaboration](#team-collaboration)
9. [API Reference for Advertisers](#api-reference-for-advertisers)
10. [Integration Examples](#integration-examples)
11. [Troubleshooting](#troubleshooting)

---

## Getting Started

### What You Can Do as an Advertiser

As an advertiser on DAADD, you can:

- **Create and manage ad campaigns** — Define audience, budget, creative assets, and timelines
- **Track performance in real-time** — View impressions, clicks, conversions, and ROI metrics
- **Use AI optimization** — Receive automatic recommendations to improve campaign performance
- **Manage team access** — Invite team members with role-based permissions
- **Set up integrations** — Connect external tools via webhooks, pixels, and API endpoints
- **A/B test creatives** — Run multiple variations and see which performs best
- **Receive alerts** — Get notified of budget thresholds, anomalies, and important events

### Platform Access

**Web Dashboard:** `https://daadd.example.com/dashboard`  
**Mobile App:** Available on iOS/Android (view-only for analytics; campaign creation on web)  
**API Base URL:** `https://daadd.example.com/api/v1`

---

## Authentication

### 1. Register Your Account

**Endpoint:** `POST /api/v1/auth/register`

```bash
curl -X POST https://daadd.example.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "advertiser@company.com",
    "password": "securePassword123!",
    "full_name": "John Advertiser",
    "company_name": "My Ad Agency",
    "role": "advertiser"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "user_123",
    "email": "advertiser@company.com",
    "role": "advertiser",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login

**Endpoint:** `POST /api/v1/auth/login`

```bash
curl -X POST https://daadd.example.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "advertiser@company.com",
    "password": "securePassword123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": "user_123",
      "email": "advertiser@company.com",
      "role": "advertiser",
      "company_name": "My Ad Agency"
    }
  }
}
```

### 3. Reset Password

**Forgot Password:** `POST /api/v1/auth/forgot-password`

```bash
curl -X POST https://daadd.example.com/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "advertiser@company.com"
  }'
```

Check your email for a reset link. Click it to enter a new password.

### 4. Using Your Token

All authenticated requests require the `Authorization` header:

```bash
curl -X GET https://daadd.example.com/api/v1/campaigns \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Token Storage (Frontend):**
```javascript
// After login, store token in localStorage
localStorage.setItem('daadd_token', response.data.token);

// For all future requests, include it
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('daadd_token')}`
};
```

---

## Campaign Management Workflows

### Workflow 1: Create Your First Campaign

#### Step 1: Prepare Campaign Details

Gather the following information:

- **Campaign Name** — e.g., "Summer Sale 2026"
- **Budget** — Total amount to spend (e.g., $5,000)
- **Duration** — Start and end dates
- **Target Audience** — Platforms (web, mobile), locations, demographics
- **Creative Assets** — Ad title, description, image/video URL
- **Reward Value** — Amount to offer users for actions (optional, e.g., $0.50 per click)

#### Step 2: Create Campaign via API

**Endpoint:** `POST /api/v1/campaigns`

```bash
curl -X POST https://daadd.example.com/api/v1/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Sale 2026",
    "description": "Promote our summer collection with exclusive offers",
    "advertiser_id": "user_123",
    "budget_total": 5000,
    "budget_spent": 0,
    "start_date": "2026-06-01T00:00:00Z",
    "end_date": "2026-08-31T23:59:59Z",
    "status": "DRAFT",
    "platforms": ["web", "mobile"],
    "targeting": {
      "countries": ["US", "UK"],
      "min_age": 18,
      "max_age": 65
    },
    "reward_value": 0.50,
    "creative": {
      "title": "Exclusive Summer Deals",
      "description": "Get up to 50% off on selected items",
      "image_url": "https://cdn.example.com/summer-sale.jpg",
      "call_to_action": "Shop Now"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "campaign_id": "camp_456",
    "name": "Summer Sale 2026",
    "status": "DRAFT",
    "created_at": "2026-05-17T10:30:00Z",
    "url": "https://daadd.example.com/dashboard/campaigns/camp_456"
  }
}
```

#### Step 3: Review & Launch

Once created, your campaign is in **DRAFT** status. Review it on the dashboard, then launch:

**Endpoint:** `PATCH /api/v1/campaigns/camp_456`

```bash
curl -X PATCH https://daadd.example.com/api/v1/campaigns/camp_456 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ACTIVE"
  }'
```

Your campaign is now live and collecting impressions.

### Workflow 2: Edit an Existing Campaign

**Endpoint:** `PATCH /api/v1/campaigns/:campaignId`

```bash
curl -X PATCH https://daadd.example.com/api/v1/campaigns/camp_456 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "budget_total": 7500,
    "end_date": "2026-09-30T23:59:59Z",
    "description": "Updated: Summer Sale extended through September"
  }'
```

**Note:** You cannot edit active campaigns' core targeting. Pause the campaign, edit, then reactivate.

### Workflow 3: Pause a Campaign

**Endpoint:** `PATCH /api/v1/campaigns/:campaignId`

```bash
curl -X PATCH https://daadd.example.com/api/v1/campaigns/camp_456 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PAUSED"
  }'
```

Paused campaigns stop collecting impressions but resume where they left off.

### Workflow 4: Clone a Campaign

Duplicate a successful campaign and launch a new variant:

**Endpoint:** `POST /api/v1/campaigns/:campaignId/clone`

```bash
curl -X POST https://daadd.example.com/api/v1/campaigns/camp_456/clone \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Sale 2026 - Variant B"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "campaign_id": "camp_789",
    "name": "Summer Sale 2026 - Variant B",
    "status": "DRAFT"
  }
}
```

### Workflow 5: View All Your Campaigns

**Endpoint:** `GET /api/v1/campaigns?page=1&limit=20`

```bash
curl -X GET "https://daadd.example.com/api/v1/campaigns?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "campaign_id": "camp_456",
      "name": "Summer Sale 2026",
      "status": "ACTIVE",
      "budget_total": 5000,
      "budget_spent": 1250.50,
      "impressions": 45000,
      "clicks": 890,
      "conversions": 45,
      "created_at": "2026-05-17T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

---

## Budget & Spend Tracking

### Real-Time Budget Monitoring

Your campaign budget is tracked in real-time. Each event (impression, click, conversion) costs:

- **Impression** — Free (no charge)
- **Click** — $0.50 CPC (Cost Per Click)
- **Conversion** — $5.00 CPA (Cost Per Action)

### Budget Alerts

You receive notifications at three thresholds:

1. **75% spent** — "You've used $3,750 of your $5,000 budget"
2. **90% spent** — "You've used $4,500 of your $5,000 budget"
3. **100% spent** — "Budget exhausted. Campaign paused."

**Alerts are sent via:**
- Email notification
- In-app dashboard notification
- Mobile app push (if enabled)

### Check Current Spend

**Endpoint:** `GET /api/v1/campaigns/:campaignId`

```bash
curl -X GET https://daadd.example.com/api/v1/campaigns/camp_456 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response snippet:**
```json
{
  "data": {
    "campaign_id": "camp_456",
    "budget_total": 5000,
    "budget_spent": 2145.75,
    "budget_remaining": 2854.25,
    "spend_rate": "Daily average: $125.34",
    "estimated_days_remaining": 22.8
  }
}
```

### Set Daily Budget Caps (Advanced)

To prevent overspending, set a daily maximum:

**Endpoint:** `PATCH /api/v1/campaigns/:campaignId`

```bash
curl -X PATCH https://daadd.example.com/api/v1/campaigns/camp_456 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "daily_budget_cap": 250
  }'
```

The campaign automatically pauses if daily spend exceeds this amount.

---

## Analytics & Performance

### Workflow: View Campaign Analytics

**Endpoint:** `GET /api/v1/analytics/dashboard/:campaignId`

```bash
curl -X GET https://daadd.example.com/api/v1/analytics/dashboard/camp_456 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "campaign_id": "camp_456",
    "name": "Summer Sale 2026",
    "period": "2026-05-01 to 2026-05-17",
    "metrics": {
      "impressions": 45000,
      "clicks": 890,
      "click_through_rate": 1.98,
      "conversions": 45,
      "conversion_rate": 5.06,
      "total_spent": 2145.75,
      "cost_per_conversion": 47.68,
      "revenue": 12500,
      "roi": 483,
      "viewable_impressions": 38250,
      "viewability_rate": 85
    },
    "timeseries": [
      {
        "date": "2026-05-10",
        "impressions": 3200,
        "clicks": 65,
        "conversions": 3,
        "spent": 147.50
      }
    ],
    "top_devices": [
      { "device": "mobile", "clicks": 567, "ctr": 2.15 },
      { "device": "desktop", "clicks": 323, "ctr": 1.75 }
    ],
    "top_regions": [
      { "country": "US", "clicks": 650, "conversions": 35 },
      { "country": "UK", "clicks": 240, "conversions": 10 }
    ]
  }
}
```

### Key Metrics Explained

| Metric | Formula | What It Means |
|--------|---------|---------------|
| **CTR (Click-Through Rate)** | (Clicks / Impressions) × 100 | % of people who saw your ad and clicked |
| **Conversion Rate** | (Conversions / Clicks) × 100 | % of clickers who completed the action |
| **Cost Per Conversion (CPA)** | Total Spent / Conversions | Average cost per conversion |
| **ROI** | ((Revenue - Spent) / Spent) × 100 | Return on your ad spend |
| **Viewability Rate** | (Viewable Impressions / Impressions) × 100 | % of impressions that were actually seen |

### Filter Analytics by Date Range

**Endpoint:** `GET /api/v1/analytics/dashboard/:campaignId?start_date=2026-05-01&end_date=2026-05-17`

```bash
curl -X GET "https://daadd.example.com/api/v1/analytics/dashboard/camp_456?start_date=2026-05-01&end_date=2026-05-17" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Export Analytics as PDF

**Endpoint:** `GET /api/v1/analytics/export/:campaignId?format=pdf`

```bash
curl -X GET "https://daadd.example.com/api/v1/analytics/export/camp_456?format=pdf" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o campaign_report.pdf
```

### View Geographic Heatmap

See which regions are performing best:

**Endpoint:** `GET /api/v1/analytics/heatmap/:campaignId`

```bash
curl -X GET https://daadd.example.com/api/v1/analytics/heatmap/camp_456 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## AI-Powered Optimization

### How AI Optimization Works

DAADD uses machine learning to analyze your campaign performance and suggest improvements. AI reviews:

- Click-through rates by device, region, and time
- Conversion rates by audience segment
- Budget allocation efficiency
- Competitive benchmarks

### Workflow: View AI Recommendations

**Endpoint:** `GET /api/v1/ai/recommendations/:campaignId`

```bash
curl -X GET https://daadd.example.com/api/v1/ai/recommendations/camp_456 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "campaign_id": "camp_456",
    "recommendations": [
      {
        "id": "rec_001",
        "type": "budget_reallocation",
        "title": "Increase Mobile Budget",
        "description": "Mobile users convert 23% better. Recommend increasing mobile budget from 40% to 55%.",
        "impact": "Expected 18% improvement in ROI",
        "severity": "high",
        "data": {
          "current_mobile_ctr": 2.15,
          "current_desktop_ctr": 1.75,
          "lift": "23%"
        }
      },
      {
        "id": "rec_002",
        "type": "creative_refresh",
        "title": "Update Creative Copy",
        "description": "Similar campaigns in your category show 12% higher CTR with action-oriented headlines.",
        "impact": "Expected 5% improvement in CTR",
        "severity": "medium"
      },
      {
        "id": "rec_003",
        "type": "targeting_adjustment",
        "title": "Expand Age Range",
        "description": "Data shows 25-35 age group converts well but is underrepresented. Recommend adding this segment.",
        "impact": "Expected 8% increase in conversions",
        "severity": "medium"
      }
    ],
    "ai_confidence": 0.87,
    "last_updated": "2026-05-17T08:00:00Z"
  }
}
```

### Workflow: Apply a Recommendation

**Endpoint:** `POST /api/v1/ai/recommendations/:campaignId/:recommendationId/apply`

```bash
curl -X POST https://daadd.example.com/api/v1/ai/recommendations/camp_456/rec_001/apply \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "auto_apply": true
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendation_id": "rec_001",
    "status": "applied",
    "changes": {
      "mobile_budget_percentage": "55%",
      "desktop_budget_percentage": "45%"
    },
    "applied_at": "2026-05-17T14:30:00Z"
  }
}
```

### View AI Optimization History

**Endpoint:** `GET /api/v1/ai/audit-log/:campaignId`

```bash
curl -X GET https://daadd.example.com/api/v1/ai/audit-log/camp_456 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

See all recommendations applied, when they were applied, and the impact.

---

## Creative Management

### Add or Update Creative Assets

**Endpoint:** `POST /api/v1/campaigns/:campaignId/creatives`

```bash
curl -X POST https://daadd.example.com/api/v1/campaigns/camp_456/creatives \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Limited Time Offer",
    "description": "Get 50% off on all summer items",
    "image_url": "https://cdn.example.com/summer-50off.jpg",
    "video_url": null,
    "call_to_action": "Shop Now",
    "is_active": true
  }'
```

### A/B Test Two Creatives

Create two versions of your creative and let the platform track which performs better:

```bash
# Creative A
curl -X POST https://daadd.example.com/api/v1/campaigns/camp_456/creatives \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Limited Time Offer",
    "description": "Get 50% off today",
    "is_control": true
  }'

# Creative B
curl -X POST https://daadd.example.com/api/v1/campaigns/camp_456/creatives \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Exclusive: 50% Off Summer Sale",
    "description": "Ends Sunday. Shop now.",
    "is_control": false
  }'
```

### View Creative Performance

**Endpoint:** `GET /api/v1/analytics/creatives/:campaignId`

```bash
curl -X GET https://daadd.example.com/api/v1/analytics/creatives/camp_456 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "creatives": [
      {
        "creative_id": "cr_001",
        "title": "Limited Time Offer",
        "is_control": true,
        "impressions": 22500,
        "clicks": 445,
        "ctr": 1.98,
        "conversions": 22,
        "conversion_rate": 4.94
      },
      {
        "creative_id": "cr_002",
        "title": "Exclusive: 50% Off Summer Sale",
        "is_control": false,
        "impressions": 22500,
        "clicks": 445,
        "ctr": 1.98,
        "conversions": 23,
        "conversion_rate": 5.17
      }
    ],
    "winner": "cr_002",
    "lift": "4.6% higher conversion rate"
  }
}
```

---

## Team Collaboration

### Invite Team Members

**Endpoint:** `POST /api/v1/teams/invite`

```bash
curl -X POST https://daadd.example.com/api/v1/teams/invite \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "colleague@company.com",
    "role": "campaign_manager",
    "permissions": ["view_campaigns", "edit_campaigns", "view_analytics"]
  }'
```

**Available Roles:**
- `admin` — Full access to all campaigns and settings
- `campaign_manager` — Can create, edit, and pause campaigns
- `analyst` — Can view campaigns and analytics (read-only)
- `viewer` — Can view campaigns only (read-only)

### View Team Members

**Endpoint:** `GET /api/v1/teams`

```bash
curl -X GET https://daadd.example.com/api/v1/teams \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Remove Team Member

**Endpoint:** `DELETE /api/v1/teams/:memberId`

```bash
curl -X DELETE https://daadd.example.com/api/v1/teams/tm_789 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## API Reference for Advertisers

### Campaigns

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/campaigns` | POST | Create a new campaign |
| `/api/v1/campaigns` | GET | List all your campaigns (paginated) |
| `/api/v1/campaigns/:campaignId` | GET | Get campaign details |
| `/api/v1/campaigns/:campaignId` | PATCH | Update campaign |
| `/api/v1/campaigns/:campaignId` | DELETE | Delete campaign (DRAFT only) |
| `/api/v1/campaigns/:campaignId/clone` | POST | Clone a campaign |

### Analytics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/analytics/dashboard/:campaignId` | GET | Get metrics dashboard |
| `/api/v1/analytics/heatmap/:campaignId` | GET | Get geographic heatmap |
| `/api/v1/analytics/creatives/:campaignId` | GET | Get creative performance |
| `/api/v1/analytics/export/:campaignId` | GET | Export analytics (PDF/CSV) |

### AI Optimization

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/ai/recommendations/:campaignId` | GET | Get recommendations |
| `/api/v1/ai/recommendations/:campaignId/:recId/apply` | POST | Apply recommendation |
| `/api/v1/ai/audit-log/:campaignId` | GET | View optimization history |

### Team Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/teams` | GET | List team members |
| `/api/v1/teams/invite` | POST | Invite team member |
| `/api/v1/teams/:memberId` | DELETE | Remove team member |

### Webhooks (Advanced)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/webhooks` | POST | Register webhook |
| `/api/v1/webhooks` | GET | List webhooks |
| `/api/v1/webhooks/:webhookId` | DELETE | Delete webhook |

---

## Integration Examples

### Example 1: Set Up Webhook for Campaign Events

Get real-time notifications when your campaign reaches budget thresholds or detects anomalies:

**Endpoint:** `POST /api/v1/webhooks`

```bash
curl -X POST https://daadd.example.com/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-server.com/webhooks/daadd",
    "secret": "your_webhook_secret_key",
    "events": [
      "campaign.budget_threshold",
      "campaign.anomaly_detected",
      "campaign.auto_paused",
      "campaign.completed"
    ],
    "is_active": true
  }'
```

**Receiving Webhook Events:**

When DAADD sends a webhook, it will be a POST request to your URL with a signed payload:

```json
{
  "event": "campaign.budget_threshold",
  "timestamp": "2026-05-17T14:30:00Z",
  "data": {
    "campaign_id": "camp_456",
    "campaign_name": "Summer Sale 2026",
    "threshold": 75,
    "budget_spent": 3750,
    "budget_total": 5000
  },
  "signature": "sha256=abcdef1234567890"
}
```

**Verify webhook signature in your code:**

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return `sha256=${hash}` === signature;
}

// In your webhook handler
if (verifyWebhookSignature(req.body, req.headers['x-daadd-signature'], process.env.WEBHOOK_SECRET)) {
  // Process webhook
} else {
  res.status(401).send('Unauthorized');
}
```

### Example 2: Set Up Conversion Pixel for Your Merchant Site

If you're a merchant selling products and want to track when users complete a purchase after clicking your DAADD ad:

**Add this pixel to your thank-you page:**

```html
<!-- After purchase is complete -->
<script>
  // Fire conversion pixel to DAADD
  const campaignId = 'camp_456';
  const userId = 'user_12345'; // Optional: your user ID
  const conversionValue = 99.99;
  
  const pixelUrl = `https://daadd.example.com/api/v1/pixel/${campaignId}?uid=${userId}&ev=conversion&val=${conversionValue}`;
  
  const img = new Image();
  img.src = pixelUrl;
</script>
```

**Or use cURL if tracking server-side:**

```bash
curl -X POST "https://daadd.example.com/api/v1/pixel/camp_456?uid=user_12345&ev=conversion&val=99.99"
```

The pixel returns a 1×1 image, so it works even if you're embedding it in HTML.

### Example 3: Automate Daily Performance Reports to Slack

Send campaign metrics to Slack every morning:

```javascript
// Node.js script to run daily via cron
const axios = require('axios');

async function sendSlackReport(campaignId) {
  // Get campaign metrics
  const analyticsRes = await axios.get(
    `https://daadd.example.com/api/v1/analytics/dashboard/${campaignId}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.ADPLATFORM_TOKEN}`
      }
    }
  );

  const metrics = analyticsRes.data.data.metrics;

  // Format for Slack
  const slackMessage = {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Daily Report: ${analyticsRes.data.data.name}*\n\n` +
                `Impressions: ${metrics.impressions}\n` +
                `Clicks: ${metrics.clicks} (CTR: ${metrics.click_through_rate}%)\n` +
                `Conversions: ${metrics.conversions} (CPA: $${metrics.cost_per_conversion})\n` +
                `Spent: $${metrics.total_spent}\n` +
                `ROI: ${metrics.roi}%`
        }
      }
    ]
  };

  // Send to Slack
  await axios.post(process.env.SLACK_WEBHOOK_URL, slackMessage);
}

// Run daily at 9 AM
const cron = require('node-cron');
cron.schedule('0 9 * * *', () => {
  sendSlackReport('camp_456');
});
```

---

## Troubleshooting

### Issue: Campaign Not Receiving Impressions

**Possible Causes:**
1. Campaign status is not ACTIVE
2. End date has passed
3. Budget is exhausted
4. Targeting is too narrow (no users match criteria)

**Solution:**
```bash
# Check campaign status
curl -X GET https://daadd.example.com/api/v1/campaigns/camp_456 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Verify it's ACTIVE and budget remaining > 0
# If targeting is the issue, adjust and relaunch
```

### Issue: Higher-Than-Expected CPA

**Possible Causes:**
1. Conversion event not firing correctly (pixel not on thank-you page)
2. Audience misaligned with product
3. Creative copy doesn't match landing page
4. Competitive campaigns in same niche

**Solution:**
- Check that conversion pixel is installed on your merchant's thank-you page
- Review top-converting regions and adjust targeting
- Run AI recommendations to identify improvements
- View creative A/B test results to optimize messaging

### Issue: Webhook Not Receiving Events

**Possible Causes:**
1. Webhook URL is unreachable
2. Your server is returning error status (5xx)
3. Signature verification is failing

**Solution:**
```bash
# Check webhook delivery logs
curl -X GET https://daadd.example.com/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_TOKEN"

# Re-register with correct URL and make sure your server responds with 200 OK
# Verify signature using correct secret key
```

### Issue: AI Recommendations Not Showing

**Possible Causes:**
1. Campaign is too new (needs 7+ days of data)
2. Insufficient impression volume (needs 1000+ impressions)
3. AI is still analyzing (check `last_updated` timestamp)

**Solution:**
```bash
# Check when recommendations were last updated
curl -X GET https://daadd.example.com/api/v1/ai/recommendations/camp_456 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Wait 24 hours if `last_updated` is recent
# Check campaign age and impression volume
```

### Issue: Budget Alerts Not Received

**Possible Causes:**
1. Email address not verified
2. Notification settings disabled on dashboard
3. Budget thresholds already reached before enabling alerts

**Solution:**
1. Check email is verified in account settings
2. Go to Dashboard → Settings → Notifications and enable budget alerts
3. If budget is already at 75%+, next alert triggers at 90%, then 100%

### Issue: Can't Update Campaign

**Possible Causes:**
1. Campaign is ACTIVE (can't edit core targeting while active)
2. Campaign is COMPLETED or ARCHIVED (read-only)
3. User doesn't have permission

**Solution:**
```bash
# Pause campaign before editing targeting
curl -X PATCH https://daadd.example.com/api/v1/campaigns/camp_456 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "PAUSED"}'

# Now edit
curl -X PATCH https://daadd.example.com/api/v1/campaigns/camp_456 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targeting": {...}}'

# Reactivate
curl -X PATCH https://daadd.example.com/api/v1/campaigns/camp_456 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "ACTIVE"}'
```

---

## Support

**Platform Docs:** https://daadd.example.com/docs  
**API Status:** https://status.daadd.example.com  
**Email Support:** support@daadd.example.com  
**Live Chat:** Available weekdays 9 AM - 5 PM UTC

**Community Slack:** https://daadd-community.slack.com  
**Video Tutorials:** https://daadd.example.com/learn

---

**Last Updated:** May 2026  
**Version:** 1.0
