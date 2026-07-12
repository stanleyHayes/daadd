# AdPlatform/DAADD — Technical Guide for Merchants

**Platform:** AdPlatform/DAADD (Two-Sided AdTech Platform)  
**Role:** Merchant (Redemption Management & Dynamic Control)  
**Last Updated:** May 2026  
**Audience:** Merchants managing customer redemptions and reward offers

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Merchant Dashboard](#merchant-dashboard)
3. [QR Code Redemption Workflow](#qr-code-redemption-workflow)
4. [Approve & Deny Redemptions](#approve--deny-redemptions)
5. [Redemption History & Analytics](#redemption-history--analytics)
6. [Dynamic Redemption Control](#dynamic-redemption-control)
7. [Campaign Integration](#campaign-integration)
8. [Point-of-Sale Integration](#point-of-sale-integration)
9. [Fraud Prevention](#fraud-prevention)
10. [API Reference for Merchants](#api-reference-for-merchants)
11. [Troubleshooting](#troubleshooting)

---

## Getting Started

### What Merchants Do on AdPlatform

As a Merchant, you:

1. **Manage Offers** — Define discounts, rewards, and incentives for campaigns
2. **Approve Redemptions** — Verify customer purchases and approve rewards
3. **Track Sales** — See revenue generated from AdPlatform-attributed customers
4. **Control Inventory** — Pause redemptions if supplies are low
5. **Monitor Performance** — Track conversion rates and customer satisfaction
6. **Integrate Systems** — Connect your POS, e-commerce, or inventory systems

### Merchant vs Advertiser

| Role | Focus | Actions |
|------|-------|---------|
| **Advertiser** | Campaign creation & optimization | Create ads, set budgets, manage targeting |
| **Merchant** | Fulfilling customer orders | Approve redemptions, process returns, track sales |

A merchant is typically the **brand** or **business** offering the product/service. An advertiser is the **agency** or **marketer** promoting the product.

**Example:** Nike (merchant) offers 30% discount. Ad agency (advertiser) creates ad campaign. Customers see ad and claim discount at Nike store.

---

## Merchant Dashboard

### Access Your Dashboard

**URL:** `https://adplatform.example.com/dashboard/merchant`

**Key Sections:**

1. **Overview** — Real-time stats and pending items
2. **Redemptions** — Queue of redemptions to approve/deny
3. **History** — Past redemptions and analytics
4. **Offers** — Active campaigns and their terms
5. **Settings** — Integration keys and merchant info
6. **Reports** — Revenue and conversion tracking

### Dashboard Overview

**Example Overview Card:**

```json
{
  "success": true,
  "data": {
    "pending_approvals": 12,
    "approved_today": 47,
    "total_revenue_today": 1450.50,
    "active_campaigns": 3,
    "fulfillment_rate": 98.5,
    "customer_satisfaction": 4.7,
    "inventory_status": "healthy"
  }
}
```

### Real-Time Metrics

```bash
GET /api/v1/merchant/dashboard/metrics?period=today
```

**Response:**

```json
{
  "success": true,
  "data": {
    "period": "2026-05-17",
    "metrics": {
      "total_redemptions": 127,
      "approved_redemptions": 125,
      "denied_redemptions": 2,
      "total_revenue": 3750.50,
      "average_transaction_value": 29.53,
      "fulfillment_time_avg": 2.3,
      "customer_satisfaction_score": 4.8,
      "repeat_customer_rate": 32
    }
  }
}
```

---

## QR Code Redemption Workflow

### How Redemptions Work

**Step 1: Customer Receives Offer**
- Customer sees a AdPlatform campaign with an offer (e.g., "30% off Nike shoes")
- They receive a unique QR code valid for 2 minutes

**Step 2: Customer Visits Store**
- Customer goes to your physical store or website
- Shows QR code at checkout or enters code

**Step 3: You Scan/Enter Code**
- Scan QR code with mobile device or POS terminal
- Or enter code manually
- System verifies code is valid and not already used

**Step 4: Customer Completes Purchase**
- Customer pays (with or without discount applied)
- Transaction is recorded

**Step 5: You Approve Redemption**
- Review purchase details
- Confirm customer used the discount/reward
- Tap **"Approve"** in AdPlatform dashboard

**Step 6: Payment Settled**
- AdPlatform deducts reward cost from advertiser's account
- You receive payment (less AdPlatform fee)

### Verify a QR Code

**Mobile App (POS):**

1. Open AdPlatform Merchant app
2. Tap **"Scan QR"**
3. Point camera at code
4. System shows:
   - Customer name
   - Offer details
   - Discount amount
   - Offer validity

**Web Dashboard:**

1. Go to **Redemptions** → **New**
2. Paste QR code or enter code manually
3. System validates code

**API:**

```bash
POST /api/v1/redemptions/verify
```

**Request:**

```json
{
  "qr_code": "CAMP_456_USR_123_ABC123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "redemption_id": "red_123",
    "qr_code": "CAMP_456_USR_123_ABC123",
    "status": "valid",
    "customer": {
      "user_id": "user_123",
      "name": "John Customer"
    },
    "offer": {
      "campaign_id": "camp_456",
      "campaign_name": "30% Off Nike Shoes",
      "discount_amount": 29.99,
      "discount_type": "percentage",
      "discount_value": 30
    },
    "validity": {
      "created_at": "2026-05-17T14:00:00Z",
      "expires_at": "2026-05-17T14:02:00Z",
      "remaining_seconds": 45
    }
  }
}
```

---

## Approve & Deny Redemptions

### View Pending Redemptions

**Dashboard:** Merchant → **Redemptions** (pending tab)

Or via API:

```bash
GET /api/v1/redemptions?status=pending&limit=50
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "redemption_id": "red_001",
      "qr_code": "CAMP_456_USR_123_ABC123",
      "customer_name": "John Customer",
      "offer": "30% Off Nike Shoes",
      "discount_amount": 29.99,
      "transaction_date": "2026-05-17T14:30:00Z",
      "status": "pending_approval",
      "verified_at": "2026-05-17T14:30:05Z"
    },
    {
      "redemption_id": "red_002",
      "qr_code": "CAMP_789_USR_456_DEF456",
      "customer_name": "Jane Buyer",
      "offer": "Free Shipping",
      "discount_amount": 5.99,
      "transaction_date": "2026-05-17T13:45:00Z",
      "status": "pending_approval",
      "verified_at": "2026-05-17T13:45:20Z"
    }
  ]
}
```

### Approve a Redemption

**Dashboard:** Click **"Approve"** on pending item

Or via API:

```bash
POST /api/v1/redemptions/red_001/approve
```

**Request:**

```json
{
  "notes": "Customer purchased Nike Air Max 90 for $99.99; applied 30% discount"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "redemption_id": "red_001",
    "status": "approved",
    "approved_at": "2026-05-17T14:32:00Z",
    "reward_payout": {
      "advertiser": "Nike",
      "advertiser_cost": 29.99,
      "merchant_payout": 28.49,
      "adplatform_fee": 1.50,
      "settlement_date": "2026-05-24"
    }
  }
}
```

### Deny a Redemption

**Dashboard:** Click **"Deny"** button

Or via API:

```bash
POST /api/v1/redemptions/red_001/deny
```

**Request:**

```json
{
  "reason": "customer_no_show",
  "notes": "Customer did not complete purchase; returned items"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "redemption_id": "red_001",
    "status": "denied",
    "denied_at": "2026-05-17T14:32:00Z",
    "reason": "customer_no_show",
    "notes": "Customer did not complete purchase; returned items"
  }
}
```

### Denial Reasons

| Reason | Description |
|--------|-------------|
| `code_invalid` | Code already used or invalid |
| `customer_no_show` | Customer didn't complete purchase |
| `fraud_suspected` | Suspicious activity detected |
| `duplicate_claim` | Customer already claimed this offer |
| `expired_code` | Code expired |
| `not_applicable` | Offer doesn't apply to this product |

### Batch Approve Redemptions

```bash
POST /api/v1/redemptions/batch-approve
```

**Request:**

```json
{
  "redemption_ids": ["red_001", "red_002", "red_003"],
  "notes": "Processed on 2026-05-17 at register 3"
}
```

---

## Redemption History & Analytics

### View All Redemptions

```bash
GET /api/v1/redemptions?page=1&limit=100
```

**Filter options:**
- `status` — pending, approved, denied
- `campaign_id` — Filter by campaign
- `start_date` — Filter by date range
- `end_date`
- `min_amount` — Filter by discount amount
- `max_amount`

### Get Redemption Details

```bash
GET /api/v1/redemptions/red_001
```

**Response:**

```json
{
  "success": true,
  "data": {
    "redemption_id": "red_001",
    "qr_code": "CAMP_456_USR_123_ABC123",
    "campaign": {
      "campaign_id": "camp_456",
      "campaign_name": "30% Off Nike Shoes",
      "advertiser": "Nike Inc.",
      "offer_type": "percentage_discount",
      "offer_value": 30,
      "max_redemptions": 500,
      "redemptions_count": 287
    },
    "customer": {
      "user_id": "user_123",
      "email": "john@example.com",
      "phone": "555-0123"
    },
    "transaction": {
      "amount": 99.99,
      "currency": "USD",
      "items": [
        {
          "name": "Nike Air Max 90",
          "quantity": 1,
          "unit_price": 99.99
        }
      ],
      "discount_applied": 29.99,
      "total_after_discount": 70.00
    },
    "status": "approved",
    "verified_at": "2026-05-17T14:30:05Z",
    "approved_at": "2026-05-17T14:32:00Z",
    "settlement_date": "2026-05-24",
    "notes": "Customer satisfied; may return for loyalty program"
  }
}
```

### Analytics: Revenue by Campaign

```bash
GET /api/v1/redemptions/analytics/by-campaign?period=month
```

**Response:**

```json
{
  "success": true,
  "data": {
    "period": "May 2026",
    "total_revenue": 12450.50,
    "campaigns": [
      {
        "campaign_name": "30% Off Nike Shoes",
        "advertiser": "Nike",
        "redemptions": 287,
        "total_discount_given": 8625.13,
        "revenue_attributed": 2247.50,
        "profit": 1869.49
      },
      {
        "campaign_name": "Free Shipping",
        "advertiser": "Amazon",
        "redemptions": 145,
        "total_discount_given": 869.55,
        "revenue_attributed": 4321.75,
        "profit": 4000.00
      }
    ]
  }
}
```

### Daily Redemption Summary

```bash
GET /api/v1/redemptions/summary?date=2026-05-17
```

**Response:**

```json
{
  "success": true,
  "data": {
    "date": "2026-05-17",
    "total_redemptions": 127,
    "total_approvals": 125,
    "total_denials": 2,
    "approval_rate": 98.4,
    "total_discount_given": 2150.75,
    "total_revenue": 3750.50,
    "average_transaction": 29.53,
    "peak_hour": "12:00-13:00",
    "peak_hour_redemptions": 23
  }
}
```

### Export Redemption Report

```bash
GET /api/v1/redemptions/export?format=csv&start_date=2026-05-01&end_date=2026-05-31
```

**Formats:**
- `csv` — For spreadsheets
- `pdf` — For sharing with accountant
- `json` — For system integration

---

## Dynamic Redemption Control

### Pause Campaign Redemptions

If you run out of inventory or want to stop accepting a specific offer:

```bash
PATCH /api/v1/redemptions/campaign/camp_456/control
```

**Request:**

```json
{
  "accepting_redemptions": false,
  "reason": "Out of stock",
  "pause_until": "2026-05-20T00:00:00Z"
}
```

Customers can still see the campaign, but can't claim new QR codes.

### Resume Campaign Redemptions

```bash
PATCH /api/v1/redemptions/campaign/camp_456/control
```

**Request:**

```json
{
  "accepting_redemptions": true
}
```

### Set Redemption Limits

```bash
PATCH /api/v1/redemptions/campaign/camp_456/control
```

**Request:**

```json
{
  "daily_limit": 50,
  "daily_limit_per_customer": 1,
  "max_discount_per_transaction": 100
}
```

Now:
- Maximum 50 redemptions per day
- Each customer can redeem max 1 time per day
- Each discount capped at $100

### Check Redemption Status

```bash
GET /api/v1/redemptions/campaign/camp_456/status
```

**Response:**

```json
{
  "success": true,
  "data": {
    "campaign_id": "camp_456",
    "campaign_name": "30% Off Nike Shoes",
    "accepting_redemptions": true,
    "daily_limit": 50,
    "redemptions_today": 47,
    "remaining_capacity": 3,
    "status_message": "Only 3 slots remaining for today",
    "daily_limit_per_customer": 1,
    "max_discount_per_transaction": 100
  }
}
```

### Auto-Pause on Low Inventory

Set up automatic pause when inventory threshold is reached:

```bash
POST /api/v1/redemptions/campaign/camp_456/auto-pause
```

**Request:**

```json
{
  "inventory_tracking": true,
  "low_inventory_threshold": 10,
  "inventory_item_sku": "SKU-NIKE-AIR-MAX-90",
  "action": "auto_pause"
}
```

When inventory drops below 10 units, campaign auto-pauses and you're notified.

---

## Campaign Integration

### View Your Active Campaigns

```bash
GET /api/v1/merchant/campaigns?status=active
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "campaign_id": "camp_456",
      "name": "30% Off Nike Shoes",
      "advertiser": "Nike Inc.",
      "status": "ACTIVE",
      "budget": 5000,
      "budget_spent": 2850,
      "budget_remaining": 2150,
      "offer_type": "percentage_discount",
      "offer_value": 30,
      "start_date": "2026-05-01",
      "end_date": "2026-05-31",
      "redemptions_total": 287,
      "redemptions_approved": 285,
      "redemptions_denied": 2,
      "revenue_attributed": 8625,
      "customer_satisfaction": 4.8
    }
  ]
}
```

### Update Campaign Offer Terms

Some campaigns allow you to modify offer terms dynamically:

```bash
PATCH /api/v1/merchant/campaigns/camp_456
```

**Request:**

```json
{
  "offer_value": 25,
  "max_redemptions": 200,
  "valid_products": ["SKU-001", "SKU-002"]
}
```

Not all campaigns allow modification (depends on advertiser settings).

### View Campaign Performance

```bash
GET /api/v1/merchant/campaigns/camp_456/performance
```

**Response:**

```json
{
  "success": true,
  "data": {
    "campaign_id": "camp_456",
    "period": "May 2026",
    "impressions": 45000,
    "clicks": 890,
    "click_through_rate": 1.98,
    "redemptions": 287,
    "redemption_rate": 32.2,
    "revenue_total": 8625,
    "revenue_attributed": 5000,
    "customer_acquisition_cost": 2.50,
    "customer_satisfaction": 4.8,
    "repeat_purchase_rate": 28
  }
}
```

---

## Point-of-Sale Integration

### Integrate with Your POS System

If you have a POS terminal (register), integrate AdPlatform redemptions:

#### Option 1: QR Code Scanner

Most modern POS systems can scan QR codes. Simply point the camera at the code.

#### Option 2: Manual Code Entry

If scanner isn't available, customer can provide the code:

```bash
POST /api/v1/redemptions/verify-by-code
```

**Request:**

```json
{
  "code": "CAMP456USR123ABC123"
}
```

#### Option 3: API Integration

If you have a custom POS system, integrate via API:

```javascript
// Node.js example
const axios = require('axios');

async function verifyAdPlatformCode(code) {
  const response = await axios.post(
    'https://adplatform.example.com/api/v1/redemptions/verify-by-code',
    { code },
    {
      headers: {
        'Authorization': `Bearer ${process.env.MERCHANT_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const { offer, discount_amount, customer_name } = response.data.data;
  
  // Display to cashier
  console.log(`Offer: ${offer}`);
  console.log(`Discount: -$${discount_amount}`);
  console.log(`Customer: ${customer_name}`);
  
  return response.data.data;
}

// In checkout flow
const redemption = await verifyAdPlatformCode(customerProvidedCode);
applyDiscount(redemption.discount_amount);
```

#### Option 4: Web Dashboard

Simple and fastest: use web dashboard to scan/approve on a tablet.

---

## Fraud Prevention

### Fraud Detection System

AdPlatform automatically flags suspicious redemption patterns:

```bash
GET /api/v1/redemptions/fraud-alerts
```

**Response:**

```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "alert_id": "fraud_001",
        "severity": "high",
        "type": "duplicate_code_attempt",
        "description": "Code CAMP456... attempted to be redeemed twice within 1 minute",
        "redemption_id": "red_001",
        "timestamp": "2026-05-17T14:30:00Z",
        "action": "auto_denied",
        "status": "resolved"
      },
      {
        "alert_id": "fraud_002",
        "severity": "medium",
        "type": "bulk_redemptions",
        "description": "Customer redeemed 5 codes in 10 minutes from different campaigns",
        "customer_id": "user_789",
        "redemption_count": 5,
        "action": "flagged_for_review",
        "status": "pending_review"
      }
    ]
  }
}
```

### Common Fraud Patterns (Automatically Blocked)

| Pattern | Detection | Action |
|---------|-----------|--------|
| **Duplicate Code** | Code scanned twice | Auto-deny second attempt |
| **Expired Code** | Code beyond 2-min window | Auto-deny |
| **Bulk Redemptions** | 10+ codes in 1 hour | Flag customer for review |
| **High-Value Stacking** | Multiple high-value codes in short time | Flag for approval |
| **VPN/Proxy** | Non-residential IP | Flag customer |

### Approve Suspicious Redemptions

If a flagged redemption is legitimate:

```bash
POST /api/v1/redemptions/red_001/approve-with-review
```

**Request:**

```json
{
  "reviewed_by": "merchant@store.com",
  "review_status": "legitimate",
  "notes": "Customer is corporate buyer; bulk redemption for team event"
}
```

### Report Fraudulent Activity

```bash
POST /api/v1/redemptions/report-fraud
```

**Request:**

```json
{
  "redemption_id": "red_001",
  "fraud_type": "stolen_code",
  "description": "Customer showed ID that didn't match the account",
  "action_taken": "denied_redemption"
}
```

---

## API Reference for Merchants

### Redemption Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/redemptions` | GET | List redemptions (pending, approved, denied) |
| `/api/v1/redemptions/:redId` | GET | Get redemption details |
| `/api/v1/redemptions/verify` | POST | Verify QR code |
| `/api/v1/redemptions/verify-by-code` | POST | Verify by code string |
| `/api/v1/redemptions/:redId/approve` | POST | Approve redemption |
| `/api/v1/redemptions/:redId/deny` | POST | Deny redemption |
| `/api/v1/redemptions/batch-approve` | POST | Approve multiple |

### Dynamic Control

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/redemptions/campaign/:campId/control` | PATCH | Pause/resume campaign |
| `/api/v1/redemptions/campaign/:campId/status` | GET | Check redemption status |
| `/api/v1/redemptions/campaign/:campId/auto-pause` | POST | Set auto-pause rules |

### Analytics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/redemptions/analytics/by-campaign` | GET | Revenue by campaign |
| `/api/v1/redemptions/summary` | GET | Daily summary |
| `/api/v1/redemptions/export` | GET | Export data (CSV/PDF) |

### Campaign Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/merchant/campaigns` | GET | List your campaigns |
| `/api/v1/merchant/campaigns/:campId/performance` | GET | Campaign performance |

### Fraud

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/redemptions/fraud-alerts` | GET | View fraud alerts |
| `/api/v1/redemptions/report-fraud` | POST | Report fraudulent activity |

---

## Troubleshooting

### Issue: QR Code Won't Scan

**Possible Causes:**
1. Code expired (2-minute window)
2. Code already redeemed
3. Camera quality issues
4. Code damaged/pixelated

**Solution:**
1. Request new code from customer
2. Enter code manually instead of scanning
3. Ensure good lighting and steady camera
4. Try manual code entry: `POST /api/v1/redemptions/verify-by-code`

### Issue: Redemption Stuck as Pending

**Possible Causes:**
1. System waiting for your approval
2. Fraud flag under investigation
3. Connection error during submission

**Solution:**
```bash
# Check redemption status
curl -X GET https://adplatform.example.com/api/v1/redemptions/red_001 \
  -H "Authorization: Bearer MERCHANT_TOKEN"

# Force approve if legitimate
curl -X POST https://adplatform.example.com/api/v1/redemptions/red_001/approve \
  -H "Authorization: Bearer MERCHANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Manual approval after review"}'
```

### Issue: High Fraud Alerts

**Possible Causes:**
1. Customers redeeming multiple codes legitimately
2. Corporate/bulk orders
3. Suspicious patterns that are false positives

**Solution:**
1. Review fraud alert details
2. If legitimate, approve and add note
3. If persistent, contact AdPlatform support to adjust fraud thresholds

### Issue: Payment Not Received

**Possible Causes:**
1. Redemptions not yet approved
2. Settlement period (5-7 business days)
3. Account verification pending
4. Payment method issue

**Solution:**
```bash
# Check settlement status
curl -X GET https://adplatform.example.com/api/v1/merchant/settlements \
  -H "Authorization: Bearer MERCHANT_TOKEN"

# View bank account on file
curl -X GET https://adplatform.example.com/api/v1/merchant/payment-methods \
  -H "Authorization: Bearer MERCHANT_TOKEN"
```

### Issue: Campaign Not Showing in My List

**Possible Causes:**
1. Campaign not yet approved by advertiser
2. Campaign targeting doesn't include your store/location
3. Campaign status is not ACTIVE

**Solution:**
```bash
# Check all campaigns (including inactive)
curl -X GET "https://adplatform.example.com/api/v1/merchant/campaigns?status=all" \
  -H "Authorization: Bearer MERCHANT_TOKEN"

# Check campaign details
curl -X GET https://adplatform.example.com/api/v1/merchant/campaigns/camp_456 \
  -H "Authorization: Bearer MERCHANT_TOKEN"
```

---

## Best Practices

### Efficiency

1. **Batch Approvals** — Process pending redemptions in batches at end of day
2. **Set Auto-Pause** — Enable auto-pause when inventory is low
3. **Use POS Integration** — Integrate with register to speed up checkout
4. **Keyboard Shortcuts** — Approve/deny with arrow keys

### Fraud Prevention

1. **Verify ID** — Ask for photo ID on high-value redemptions
2. **Spot Patterns** — Monitor for bulk redemption attempts
3. **Report Suspicious** — Flag unusual activity immediately
4. **Set Limits** — Use daily/per-customer limits to prevent abuse

### Customer Service

1. **Be Quick** — Approve within 1 hour for best customer experience
2. **Be Transparent** — Explain any denials clearly
3. **Check Stock** — Ensure product is available before approval
4. **Get Feedback** — Ask customers about their AdPlatform experience

### Compliance

1. **Keep Records** — Export and archive redemption reports monthly
2. **Track Revenue** — Reconcile AdPlatform payouts with your sales
3. **Honor Terms** — Follow agreed discount terms exactly
4. **Report Issues** — Notify AdPlatform of fraud or system issues

---

## Support

**Merchant Docs:** https://adplatform.example.com/docs/merchant  
**Integration Guide:** https://adplatform.example.com/guides/pos-integration  
**Email Support:** merchant-support@adplatform.example.com  
**Live Chat:** Available 9 AM - 6 PM UTC, 7 days a week

---

**Last Updated:** May 2026  
**Version:** 1.0
