# AI Creative Assistant - Integration Testing Guide

## Testing Checklist

### ✅ Installation & Setup

- [ ] Backend: `npm install @ai-sdk/openai` completed
- [ ] Frontend: `useAICreative` hook created and integrated
- [ ] UI Component: `AICreativeGenerator` component created and ready
- [ ] Environment: Add `VERCEL_AI_GATEWAY_TOKEN` to `.env`

**Setup Commands:**
```bash
# Backend setup
cd backend
npm install

# Frontend setup
cd ../frontend
npm install

# Start dev servers
cd ../backend && npm run dev  # Terminal 1 - Port 4000
cd frontend && npm run dev     # Terminal 2 - Port 3000
```

---

### 🧪 Integration Test Scenarios

#### Test 1: Campaign Creation with AI Creatives

**Goal:** Test AI creative generation during campaign creation flow

**Steps:**
1. Navigate to `/dashboard/campaigns/create`
2. **Step 0 (Basic Info):**
   - Name: "Test AI Campaign"
   - Industry: "Technology"
   - Description: "AI-generated test campaign"
   - Dates: Select start and end dates
   - Click **Next**

3. **Step 1 (Budget & Targeting):**
   - Budget: $1,000
   - Reward Value: $2
   - Age Range: 18-65
   - Devices: Select Desktop, Mobile
   - Languages: English
   - Click **Next**

4. **Step 2 (Creatives) - AI Generator Mode:**
   - Toggle to **"AI Generator"** tab
   - The AICreativeGenerator should appear
   - Product Name: "Premium Wireless Headphones" (auto-filled from description)
   - Audience: "Tech enthusiasts, remote workers"
   - Goal: "Conversion"
   - Number of Variations: 5
   - Click **"Generate Creatives"**

5. **Expected Result:**
   - Component shows loading state (~8-10 seconds)
   - 5 creative variations appear with:
     - Headline (60 chars max)
     - Body text (200 chars max)
     - CTA button (30 chars max)
     - Tone badge (casual, professional, playful, urgent, emotional)
     - Confidence score (0-100)
   - Example output:
     ```
     Variation 1:
     Headline: "Crystal Clear Sound, All Day Battery"
     Body: "Premium noise cancellation with 8-hour playtime"
     CTA: "Get Your Pair Today"
     Tone: Casual
     Confidence: 94%
     ```

6. **Test Refinement (Optional):**
   - Feedback: "Make it more urgent and focus on speed"
   - Click **"Refine Creatives"**
   - Component shows loading state (~5s)
   - Variations should be updated with urgency

7. **Test Save:**
   - Click **"Save Creatives"**
   - Success toast: "5 creatives generated! Review in the next step."
   - Variations clear from UI

8. **Step 3 (Review & Launch):**
   - Verify campaign details shown
   - Click **"Save as Draft"** to save without launching

---

#### Test 2: Campaign Detail with AI Creatives

**Goal:** Test AI creative generation from existing campaign detail page

**Steps:**
1. Navigate to `/dashboard/campaigns/:id` (existing campaign)
2. Click **"Creatives"** tab
3. AICreativeGenerator component appears
4. Follow same generation/refinement/save flow as Test 1

**Expected Result:**
- All functionality works same as campaign creation
- Creative suggestions match campaign name/industry

---

#### Test 3: Both Upload & AI Modes

**Goal:** Test using both file upload AND AI generation

**Steps:**
1. In Campaign Create Step 2, set mode to **"Both Options"**
2. Upload an image/video file
3. Generate 3 AI variations
4. Both should be visible in the UI
5. Proceed to next step with both file + AI creatives

**Expected Result:**
- Upload section visible above AI generator
- Both upload and generation work independently
- Can save both together

---

### 🔍 Error Handling Tests

#### Test 4: API Error Handling

**Scenario:** No VERCEL_AI_GATEWAY_TOKEN set

**Steps:**
1. Remove/comment out `VERCEL_AI_GATEWAY_TOKEN` from `.env`
2. Try to generate creatives
3. Should show error: "Failed to generate creatives"

**Expected Result:**
- Clear error message displayed
- No crash or blank screen
- User can try again after fixing token

---

#### Test 5: Timeout Handling

**Scenario:** Generation takes >30 seconds

**Steps:**
1. Network throttling: Set to Slow 3G (DevTools → Network)
2. Click "Generate Creatives"
3. Wait and observe

**Expected Result:**
- Should timeout gracefully
- Error message: "Generation request timed out, please try again"
- Button remains clickable for retry

---

#### Test 6: Empty/Invalid Input

**Scenario:** Missing required fields

**Steps:**
1. Clear productName field (if possible)
2. Click "Generate Creatives"

**Expected Result:**
- Validation prevents empty submissions
- Clear error on required fields

---

### 📊 Performance Tests

#### Test 7: Generation Speed

**Measure:** How long does generation take?

**Steps:**
1. Open DevTools → Network tab
2. Click "Generate Creatives"
3. Look for `/ai/creative/generate` POST request
4. Measure total time (should be ~8-10s)

**Expected Result:**
- Backend: ~5-7s (Claude generation)
- Network: ~1-2s
- Total: ~6-9s

---

#### Test 8: UI Responsiveness During Loading

**Steps:**
1. Generate creatives
2. While generating, try to:
   - Close/move the browser window
   - Scroll the page
   - Interact with other UI elements

**Expected Result:**
- UI remains responsive
- No freezing
- Loading spinner smooth
- Can cancel generation if needed

---

### 🔐 Security Tests

#### Test 9: Authorization Check

**Steps:**
1. Log out of the app
2. Try to access `/dashboard/campaigns/create`
3. Should redirect to login

**Expected Result:**
- Auth middleware prevents unauthorized access
- Redirects to login page

---

#### Test 10: CORS & API Access

**Steps:**
1. Open DevTools → Network tab
2. Generate creatives
3. Check `/ai/creative/generate` request

**Expected Result:**
- Request includes proper auth headers
- CORS headers present
- No 401/403 errors

---

### 📱 Mobile Testing

#### Test 11: Responsive Design

**Steps:**
1. Open DevTools → Device Emulation
2. Select iPhone 12 Pro
3. Navigate to campaign create
4. Test AI Generator on mobile viewport

**Expected Result:**
- All UI elements readable
- Buttons easily clickable (>48px)
- Text variations don't overflow
- Modal/component properly sized

---

#### Test 12: Touch Interactions

**Steps:**
1. On mobile device or touch-enabled simulator:
   - Tap "Generate Creatives" button
   - Swipe through variations (if applicable)
   - Tap text area for feedback

**Expected Result:**
- All touch interactions work
- No hover-dependent UI
- Buttons respond immediately

---

### 🎨 UI/UX Tests

#### Test 13: Visual Consistency

**Steps:**
1. Generate creatives
2. Check styling matches:
   - Campaign create page theme
   - Dark mode colors correct
   - Spacing and alignment
   - Icon consistency

**Expected Result:**
- Component integrates seamlessly
- No visual glitches
- Consistent with design system

---

#### Test 14: Loading States

**Steps:**
1. Generate creatives
2. Observe:
   - Loading spinner animation
   - Button disabled state
   - Opacity of disabled inputs

**Expected Result:**
- Smooth animations
- Clear "loading" indication
- Prevented double-submission

---

### 📈 Analytics Verification

#### Test 15: Track Generated Creatives

**Steps:**
1. Generate 5 creatives
2. Save them to campaign
3. Navigate to campaign detail
4. Check performance analytics

**Expected Result:**
- Created 5 Creative entities in DB
- `ai_generated: true` field set
- `ai_confidence` values stored (80-95)
- Creatives queryable via API

---

## Browser Testing Matrix

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Failed to generate creatives" | Missing API token | Set `VERCEL_AI_GATEWAY_TOKEN` in `.env` |
| Creatives not saved | Database error | Check MongoDB connection |
| Button stays "Loading" | Request timeout | Increase timeout or retry |
| UI looks broken | CSS not loading | Clear browser cache, npm run build |
| Auth errors | Token expired | Log out and back in |

---

## Manual Testing Workflow

**Recommended order (30-45 minutes):**

1. Test 1: Campaign Create with AI (5 min)
2. Test 2: Campaign Detail with AI (3 min)
3. Test 3: Both Upload & AI (3 min)
4. Test 4: Error Handling (3 min)
5. Test 13: Visual Consistency (5 min)
6. Test 7: Generation Speed (2 min)
7. Test 11: Mobile Responsive (5 min)
8. Test 15: Analytics Verification (5 min)

**Total:** ~30 minutes for happy path + key scenarios

---

## Post-Testing Checklist

- [ ] No console errors (DevTools)
- [ ] No network 5xx errors
- [ ] Creatives appear in DB (MongoDB)
- [ ] All loading states work
- [ ] Error messages display correctly
- [ ] Mobile responsive
- [ ] Dark mode works
- [ ] Auth/permissions enforced
- [ ] Performance acceptable (<10s generation)

---

## Test Data

**Test Campaign:**
```json
{
  "name": "AI Test Campaign",
  "description": "Testing AI creative generation features",
  "industry": "technology",
  "budget": 1000,
  "reward_value": 2,
  "start_date": "2026-05-17",
  "end_date": "2026-06-17",
  "age_min": 18,
  "age_max": 65,
  "devices": ["desktop", "mobile"],
  "localized": false,
  "ai_enabled": true
}
```

**Test AI Generation Input:**
```json
{
  "campaignId": "test_camp_123",
  "productName": "Premium Wireless Headphones",
  "audience": "Tech enthusiasts, remote workers, fitness enthusiasts",
  "goal": "conversion",
  "tone": "casual",
  "numVariations": 5
}
```

---

## Success Criteria

✅ **Test is PASSED when:**
- All 15 tests complete without errors
- Generation takes <15 seconds
- No console errors
- UI responsive on mobile & desktop
- Creatives save to database
- Error handling is graceful
- Performance acceptable

❌ **Test is FAILED if:**
- Any critical functionality broken
- Generation fails consistently
- API errors not handled
- Database not updated
- Mobile layout broken
- Auth not enforced

---

## Regression Testing

After fixes/changes, re-test:
1. Test 1 (Core functionality)
2. Test 4 (Error handling)
3. Test 13 (UI consistency)

---

## Sign-Off

Tested by: _____________________
Date: _____________________
Status: [ ] PASS  [ ] FAIL

Comments/Issues:
```
[Space for notes]
```

---

**Next Step:** After passing all tests, the feature is ready for production deployment!
