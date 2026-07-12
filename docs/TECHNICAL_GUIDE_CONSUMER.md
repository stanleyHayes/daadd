# AdPlatform/DAADD — Technical Guide for Consumers & Users

**Platform:** AdPlatform/DAADD (Two-Sided AdTech Platform)  
**Role:** Consumer/User (Ad Viewer & Reward Earner)  
**Last Updated:** May 2026  
**Audience:** Mobile and web users engaging with ads and earning rewards

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication & Account Setup](#authentication--account-setup)
3. [Viewing Ads & Earning Rewards](#viewing-ads--earning-rewards)
4. [Rewards System](#rewards-system)
5. [QR Code Redemption](#qr-code-redemption)
6. [Cross-Device Tracking](#cross-device-tracking)
7. [Privacy & Data](#privacy--data)
8. [Mobile App Guide](#mobile-app-guide)
9. [Web Platform Guide](#web-platform-guide)
10. [API Reference for Consumers](#api-reference-for-consumers)
11. [Troubleshooting](#troubleshooting)

---

## Getting Started

### What You Can Do as a Consumer

AdPlatform/DAADD lets you:

- **View ads and earn rewards** — See sponsored content and get paid for engagement
- **Claim QR-based rewards** — Use special codes to redeem offers at partner merchants
- **Track your earnings** — Monitor reward balance and redemption history
- **Write reviews** — Share feedback on products you've purchased via ads
- **Manage your profile** — Control your personal data and preferences
- **Save favorite ads** — Bookmark ads you're interested in
- **Multi-device support** — Switch between mobile and web seamlessly

### Age Requirements

To use AdPlatform/DAADD, you must be:
- **Minimum 13 years old** (with parental consent)
- **18+ to claim certain rewards** (alcohol, mature products)

Age verification happens during signup and before accessing restricted content.

---

## Authentication & Account Setup

### 1. Register Your Account (Mobile)

**In the AdPlatform mobile app:**

1. Tap **"Sign Up"**
2. Enter your **email address** and **password**
3. Confirm your **age** (must be 13+)
4. (Optional) Connect social accounts for faster signup:
   - Google
   - Apple ID
   - Facebook

**Response from mobile app:**
```json
{
  "success": true,
  "data": {
    "user_id": "user_123",
    "email": "yourname@example.com",
    "full_name": "Your Name",
    "age_verified": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Verify Your Age

Some campaigns require additional age verification (legal compliance for certain products).

**Age Verification Flow:**

1. When you encounter an age-restricted ad, tap **"Verify Age"**
2. Enter your **date of birth**
3. (Optional) Provide **government ID** for manual verification
4. System confirms you meet the age requirement

**API endpoint (if using age-verify in custom app):**

```javascript
// POST /api/v1/auth/verify-age
const response = await fetch('https://adplatform.example.com/api/v1/auth/verify-age', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    date_of_birth: '2000-05-15',
    country: 'US'
  })
});
```

### 3. Social Login (Faster Setup)

**Option A: Google Login**

```javascript
// On web or mobile app with OAuth support
const googleAuth = await signInWithGoogle({
  clientId: 'YOUR_GOOGLE_CLIENT_ID',
  redirectUrl: 'https://adplatform.example.com/auth/callback'
});

// AdPlatform exchanges Google token for AdPlatform token
const adplatformToken = googleAuth.token;
localStorage.setItem('adplatform_token', adplatformToken);
```

**Option B: Apple Login (iOS)**

```javascript
// In Expo/React Native
import * as AppleAuthentication from 'expo-apple-authentication';

const credential = await AppleAuthentication.signInAsync({
  requestedScopes: [
    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
    AppleAuthentication.AppleAuthenticationScope.EMAIL,
  ],
});

// Use credential.identityToken to get AdPlatform token
```

### 4. Login to Existing Account

**Mobile app:**
1. Tap **"Log In"**
2. Enter **email** and **password**
3. (Optional) Use biometric login (fingerprint/face recognition)

**Web:**
```javascript
// POST /api/v1/auth/login
const response = await fetch('https://adplatform.example.com/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'yourname@example.com',
    password: 'securePassword123!'
  })
});

const { token } = await response.json();
localStorage.setItem('adplatform_token', token);
```

### 5. Forgot Password

**Web:**
1. On login page, click **"Forgot Password?"**
2. Enter your **email**
3. Check your inbox for a reset link
4. Click the link and enter a **new password**

**Mobile:**
1. On login screen, tap **"Forgot Password?"**
2. Enter your email
3. Check email and follow the reset link (opens in browser)
4. Return to app; you're now logged in with new password

---

## Viewing Ads & Earning Rewards

### Workflow 1: View Available Ads (Mobile)

**Home Screen:**

The AdPlatform mobile app shows ads in a **Featured Carousel** at the top:

1. **Swipe left/right** to browse featured campaigns
2. **Tap an ad card** to see full details
3. **Read the description** and see the reward amount
4. **Tap "View Ad"** to engage with the content

**Featured ads rotate hourly and are handpicked for you based on your viewing history.**

### Workflow 2: Search for Ads

**Mobile Search Tab:**

1. Navigate to the **Search tab** (magnifying glass icon)
2. **Filter by category:** Technology, Fashion, Food, Travel, etc.
3. **Sort by:** Newest, Trending, Highest Reward, or Best Rating
4. **Scroll** to see more ads or use infinite scroll (auto-loads when you reach bottom)

**Web Platform:**

Visit `https://adplatform.example.com/ads` to browse all campaigns in a grid view.

### Workflow 3: Engage with an Ad

When you **tap "View Ad"** on an ad card:

1. **Impression recorded** — System logs that you saw the ad (no reward yet)
2. **Click/Interact** — If you click a link or button, it's logged as a click
3. **Conversion** — If you complete an action (purchase, signup, etc.), it's logged as a conversion
4. **Reward earned** — Based on the action:
   - Impression only: No direct reward (advertisers pay for impressions)
   - Click: You may earn a small reward (e.g., $0.01)
   - Conversion: Larger reward (e.g., $2.00)

**Reward is credited to your account instantly.**

### How Rewards Work

| Action | Reward | Notes |
|--------|--------|-------|
| **Impression** (View) | $0.00 | You see the ad; no action needed |
| **Click** | $0.25–$1.00 | You click the ad link |
| **Conversion** | $1.00–$5.00 | You complete purchase or signup |
| **QR Redemption** | $5.00–$50.00 | You use a special QR code at a store |

**Example:** You view a Nike campaign offering $5 per purchase. You click the ad, buy shoes, and earn $5.

### Workflow 4: Fatigue & Ad Limits

To keep your experience fresh, AdPlatform limits how often you see the **same ad**:

- **Maximum:** 5 views per user per ad, per 24 hours
- **After limit:** That specific ad won't show in your feed again until 24 hours pass
- **Still viewing others:** You'll see different ads from other campaigns

**Why this exists:** If you've already seen a Nike ad 5 times today, seeing it again won't help Nike, and it won't help you.

---

## Rewards System

### Check Your Reward Balance

**Mobile App:**

1. Tap **Profile** (bottom right icon)
2. See your **current balance** at the top

**Web:**

1. Go to `https://adplatform.example.com/dashboard`
2. Click **"Rewards"** in the sidebar
3. View **Total Balance** and **Available to Claim**

**API endpoint:**

```javascript
const response = await fetch('https://adplatform.example.com/api/v1/rewards/balance', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('adplatform_token')}`
  }
});

const { balance, pending, available } = await response.json();
console.log(`Balance: $${balance}`);
console.log(`Pending: $${pending}`);
console.log(`Available to claim: $${available}`);
```

### Reward States

Your rewards have three states:

| State | Description | Can Use? |
|-------|-------------|----------|
| **Pending** | You earned it but haven't claimed yet | No (after 7 days, auto-claims) |
| **Available** | Claimed and ready to use | Yes |
| **Redeemed** | Used at a merchant or transferred out | No (archived) |

### Workflow: Claim Your Rewards

**Automatic Claiming:**
Rewards automatically claim after **7 days** of earning.

**Manual Claiming (Mobile):**

1. Tap **Profile**
2. Tap **Rewards**
3. See pending rewards with **"Claim"** button
4. Tap **"Claim"** to finalize
5. Reward moves to **Available** balance

**API endpoint:**

```javascript
const response = await fetch('https://adplatform.example.com/api/v1/rewards/claim', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('adplatform_token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reward_event_id: 'ev_123'
  })
});

const { success, new_balance } = await response.json();
console.log(`Claimed! New balance: $${new_balance}`);
```

### Withdraw Rewards (Cash Out)

**Mobile:**

1. Tap **Profile** → **Rewards**
2. Tap **"Withdraw"** (if balance ≥ $5.00)
3. Choose method:
   - **PayPal** — Instant transfer
   - **Bank Transfer** — 2-3 business days
   - **Digital Wallet** (Apple Pay, Google Pay) — Instant
4. Confirm amount and bank/account details
5. Funds arrive in 2-3 business days

**Minimums:**
- Withdrawal minimum: **$5.00**
- Withdrawal maximum: **$5,000 per month** (to prevent fraud)

**Fees:**
- PayPal: 2.2% + $0.30
- Bank Transfer: Free
- Digital Wallet: Free

### Reward History

**Mobile:**

1. Tap **Profile** → **Rewards**
2. Scroll through **Recent Activity**
3. Tap any transaction for details

**Web:**

Visit `https://adplatform.example.com/rewards/history` to see detailed transaction logs with dates, amounts, and descriptions.

**API endpoint:**

```javascript
const response = await fetch('https://adplatform.example.com/api/v1/rewards/history?page=1&limit=20', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('adplatform_token')}`
  }
});

const { transactions, pagination } = await response.json();
transactions.forEach(t => {
  console.log(`${t.event_type}: +$${t.amount} on ${t.created_at}`);
});
```

---

## QR Code Redemption

### What Are Redemptions?

Some campaigns offer **physical rewards** via QR codes. You can:

1. **Receive a QR code** — Advertiser sends you a unique code
2. **Show code at store** — Scan at participating merchant
3. **Claim reward** — Receive discount, free item, or cash
4. **Earn platform reward** — You also get AdPlatform tokens for redeeming

### Workflow: Redeem a QR Code

**Step 1: Find a QR Code**

QR codes come from:
- **Email campaigns** — Advertiser sends code directly
- **SMS** — Text message with redeemable code
- **App notifications** — Push notification with code
- **Printable** — Download and print from dashboard

**Step 2: Open QR Code (Mobile)**

```javascript
// User taps a QR code in the AdPlatform app
// System opens QR reader
// User points camera at code
// System scans automatically
```

**Step 3: Verify Redemption**

```javascript
// POST /api/v1/redemptions/verify
const response = await fetch('https://adplatform.example.com/api/v1/redemptions/verify', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    qr_code: 'CAMP_456_USR_123_ABC123'
  })
});

const { success, offer, merchant, reward } = await response.json();
console.log(`Valid! Offer: ${offer} at ${merchant.name}`);
console.log(`You'll earn: $${reward}`);
```

**Step 4: Claim at Merchant**

1. **Show QR code** to cashier (or scan if merchant has QR reader)
2. **Receive discount/offer** (e.g., $10 off purchase)
3. **Complete transaction** with merchant
4. **Reward credited** to your AdPlatform account

**Step 5: Approval (if needed)**

Some redemptions require **merchant approval**:

1. Merchant scans your QR code at register
2. You complete purchase
3. Merchant approves in AdPlatform dashboard
4. Reward credited to your account (usually within 24 hours)

### One-Time Use Security

QR codes are **cryptographically signed** and **one-time use only**:

- **Each code** is valid for **exactly one redemption**
- **Valid for 2 minutes** after generation
- **Cannot be forged** (HMAC-SHA256 signature)
- **Cannot be reused** (even if you screenshot it)

**If you lose a code:**
1. Request a new one from the advertiser
2. Old code becomes invalid

### View Redemption History

**Mobile:**

1. Tap **Profile** → **Redemptions**
2. See past and pending redemptions
3. Tap any redemption for proof/receipt

**Web:**

Visit `https://adplatform.example.com/redemptions/history`

---

## Cross-Device Tracking

### How Attribution Works

AdPlatform tracks your journey **across devices** so advertisers can understand how you interact with their ads.

**Example:**
1. You see a Nike ad on mobile (impression)
2. You click it and visit Nike's site on mobile (click)
3. You close the app and come back the next day on desktop
4. You search for Nike shoes on desktop and buy them (conversion)

AdPlatform attributes this entire journey to the original Nike ad, even though it spanned 2 devices and 1 day. This is called **attribution**.

### Attribution Window

By default, AdPlatform tracks interactions for **30 days** after you see an ad.

**Example:**
- Day 0: You see Airbnb ad on mobile
- Day 5: You search Airbnb on desktop and book a trip
- **Attribution:** Recorded (within 30-day window)

- Day 0: You see Airbnb ad on mobile
- Day 35: You book on desktop
- **Attribution:** Not recorded (outside 30-day window)

### Device Identity

AdPlatform links your devices through:

1. **Login** — If you're logged in on both devices, AdPlatform knows it's you
2. **Device ID** — Unique identifier on each phone
3. **IP Address** — Approximate location matching
4. **Heuristics** — Similar click patterns, user-agent info

**All methods use privacy-preserving hashing; no raw PII is stored.**

### View Your Attribution Profile

**Web:**

Visit `https://adplatform.example.com/dashboard/attribution` to see:
- Devices associated with your account
- Attribution window
- Sample journeys (anonymized)

**API endpoint:**

```javascript
const response = await fetch('https://adplatform.example.com/api/v1/attribution/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('adplatform_token')}`
  }
});

const { devices, attribution_window, journeys } = await response.json();
console.log(`Tracked devices: ${devices.length}`);
console.log(`Attribution window: ${attribution_window} days`);
journeys.forEach(j => {
  console.log(`${j.start_device} → ${j.end_device}: ${j.event_count} interactions`);
});
```

---

## Privacy & Data

### What Data We Collect

AdPlatform collects:

| Data | Purpose | Retention |
|------|---------|-----------|
| **Email & Password** | Authentication | Until account deletion |
| **Age/DOB** | Legal compliance (age verification) | Until account deletion |
| **Device Info** | Cross-device attribution | 90 days |
| **IP Address** | Location detection, fraud prevention | 30 days |
| **Viewing History** | Reward tracking, personalization | 1 year |
| **Clicks & Conversions** | Attribution, analytics | 2 years |

### What We Don't Collect

AdPlatform **never**:
- Sells your personal data to third parties
- Stores passwords in plain text (hashed with bcrypt)
- Tracks across non-AdPlatform sites (no cross-site tracking)
- Collects health, financial, or sensitive data
- Stores video/audio recordings of you

### Privacy Controls (Mobile)

1. **Profile** → **Privacy Settings**
2. Toggle these options:
   - **Personalized ads** — Show ads based on your history (on by default)
   - **Cross-device tracking** — Link your devices (on by default)
   - **Location tracking** — Use your location for targeting (off by default)
3. **Delete my data** — Removes all history; keeps account active

### Opt-Out of Ads

You can **pause ad recommendations** temporarily:

```javascript
// PATCH /api/v1/users/:userId/settings
const response = await fetch('https://adplatform.example.com/api/v1/users/user_123/settings', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ads_enabled: false,
    pause_until: new Date(Date.now() + 7*24*60*60*1000).toISOString() // Pause for 7 days
  })
});
```

---

## Mobile App Guide

### Getting the App

**iOS:**
- Visit App Store and search "AdPlatform"
- Tap **"Get"** and authenticate with Face ID/Apple ID
- Launch and sign up

**Android:**
- Visit Google Play and search "AdPlatform"
- Tap **"Install"**
- Launch and sign up

### App Features

**Home Tab:**
- Featured carousel of trending ads
- Personalized recommendations
- Quick balance check
- "View More" link to browse all

**Search Tab:**
- Filter by category (Tech, Fashion, Food, Travel, etc.)
- Sort by (Newest, Trending, Highest Reward)
- Search by brand name
- Infinite scroll (auto-load more as you scroll)

**Rewards Tab:**
- Current balance
- Pending rewards
- Claim button
- Withdrawal options
- Transaction history

**Profile Tab:**
- Name and email
- Age verification status
- Settings
- Edit profile
- Notifications
- Privacy controls
- Support & FAQ

### Biometric Login

**iOS (Face ID/Touch ID):**

1. After first login, iOS prompts: "Save password for AdPlatform?"
2. Tap **"Save"**
3. Next time, just tap the app and use Face ID/Touch ID

**Android (Fingerprint):**

1. After first login, system offers to save password
2. Tap **"Save"**
3. Next time, authenticate with fingerprint

### Offline Mode

Some features work **offline**:
- View cached ad list
- Read your reward history (syncs when online)
- Update profile locally (syncs when online)

Features that require **online**:
- View new ads
- Claim rewards
- Redeem QR codes

---

## Web Platform Guide

### Accessing the Web App

Visit `https://adplatform.example.com` and **log in** with your account.

**Key Pages:**

| Page | URL | What You Do |
|------|-----|-----------|
| **Home** | `/` | Browse featured ads |
| **Browse All Ads** | `/ads` | Search, filter, sort all campaigns |
| **Ad Details** | `/ads/:id` | View full ad, ratings, reviews |
| **Dashboard** | `/dashboard` | Your rewards, history, settings |
| **Rewards** | `/dashboard/rewards` | Check balance, claim, withdraw |
| **Redemptions** | `/redemptions` | QR codes and redemption history |
| **Settings** | `/dashboard/settings` | Privacy, notifications, profile |

### Responsive Design

The web app works on:
- **Desktop** (1920px+)
- **Tablet** (768px–1920px)
- **Mobile browsers** (320px–768px) — but native app recommended

---

## API Reference for Consumers

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | Sign up |
| `/api/v1/auth/login` | POST | Log in |
| `/api/v1/auth/forgot-password` | POST | Request password reset |
| `/api/v1/auth/reset-password` | POST | Complete password reset |
| `/api/v1/auth/verify-age` | POST | Verify age for restricted content |

### Ads

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/ads` | GET | List all ads (paginated) |
| `/api/v1/ads/:adId` | GET | Get ad details |
| `/api/v1/ads/trending` | GET | Get trending ads |
| `/api/v1/ads/featured` | GET | Get featured ads |

### Events

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/events/track` | POST | Log impression/click/conversion |
| `/api/v1/events/user/:userId` | GET | Get your event history |

### Rewards

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/rewards/balance` | GET | Check your balance |
| `/api/v1/rewards/history` | GET | View reward history |
| `/api/v1/rewards/claim` | POST | Manually claim pending rewards |
| `/api/v1/rewards/withdraw` | POST | Cash out to bank/PayPal |

### Redemptions

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/redemptions/verify` | POST | Verify a QR code |
| `/api/v1/redemptions/approve` | POST | Approve redemption (for merchants) |
| `/api/v1/redemptions/history` | GET | View redemption history |

### User Profile

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/users/:userId` | GET | Get your profile |
| `/api/v1/users/:userId` | PATCH | Update profile |
| `/api/v1/users/:userId/settings` | GET | Get your settings |
| `/api/v1/users/:userId/settings` | PATCH | Update settings |

### Reviews

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/reviews/campaigns/:campaignId` | GET | Get reviews for an ad |
| `/api/v1/reviews` | POST | Post a review |
| `/api/v1/reviews/:reviewId` | DELETE | Delete your review |

---

## Troubleshooting

### Issue: Not Seeing Any Ads

**Possible Causes:**
1. Age not verified (required for some campaigns)
2. Location not supported by advertiser
3. Device/browser not in targeting criteria
4. Ads paused in settings

**Solution:**
1. Go to **Profile** → **Settings** and verify your age
2. Check if location targeting includes your country
3. Try a different device or browser
4. Go to **Settings** and enable "Personalized ads"

### Issue: Reward Balance Stuck on "Pending"

**Possible Causes:**
1. Less than 7 days have passed since earning
2. Advertiser hasn't approved conversion yet
3. Account flagged for review (rare)

**Solution:**
- Check the earning date; auto-claim happens after 7 days
- If advertiser-dependent (e.g., QR redemption), wait for merchant approval
- If stuck for >14 days, contact support

### Issue: QR Code Not Scanning

**Possible Causes:**
1. Code is damaged or pixelated
2. Camera permissions denied
3. Code is invalid or expired (2-minute window)
4. Code already redeemed

**Solution:**
1. Request a new code from advertiser
2. Ensure camera is enabled in app permissions (Settings → Privacy → Camera)
3. Redeem within 2 minutes of receiving code
4. Each code is one-time use; get a new code for another redemption

### Issue: Can't Log In

**Possible Causes:**
1. Wrong email or password
2. Account locked (too many failed attempts)
3. Email not verified
4. Device time is incorrect (affects token validation)

**Solution:**
1. Double-check email and password (case-sensitive)
2. Wait 30 minutes and try again
3. Check your email for verification link and click it
4. Ensure device time is correct (Settings → Date & Time → Automatic)

### Issue: Reward Balance Shows $0

**Possible Causes:**
1. No ads viewed yet
2. Impressions only; clicks/conversions required for reward
3. Reward limit reached (some campaigns have daily caps)
4. Account too new (first earnings may be held for 24 hours)

**Solution:**
- View and click some ads to start earning
- Not all impressions give rewards; focus on clicking and converting
- Check campaign details for reward amount
- If account is new (<24h), rewards will appear after verification

### Issue: Withdrawal Failing

**Possible Causes:**
1. Balance below $5.00 minimum
2. Bank account info incorrect
3. Too many withdrawals in a month (limit: $5,000/month)
4. Account flagged for verification

**Solution:**
1. Earn at least $5.00 before withdrawing
2. Verify bank details are correct (routing number, account number)
3. Wait until next calendar month to withdraw again
4. Complete any pending verification (email AdPlatform support)

### Issue: Ads Not Loading on Mobile

**Possible Causes:**
1. No internet connection
2. Ads disabled in app permissions
3. Cache corrupted
4. Outdated app version

**Solution:**
1. Check WiFi or mobile data connection
2. Go to **Settings** → **Privacy** and enable required permissions
3. Force close app: (iOS: swipe up; Android: long-press and close)
4. Reopen app and try again
5. Update AdPlatform to latest version from App Store/Google Play

---

## Support

**In-App Help:**
- Tap **Profile** → **Help & Support** for FAQs and contact options

**Email Support:**
- support@adplatform.example.com (responds within 24 hours)

**Live Chat:**
- Available weekdays 9 AM - 5 PM UTC (tap **Help** in app)

**Community:**
- Join our Slack: https://adplatform-community.slack.com

---

**Last Updated:** May 2026  
**Version:** 1.0
