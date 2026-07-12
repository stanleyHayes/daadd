# AI Creative Assistant Implementation Guide

## Overview

The AI Creative Assistant is a new feature that leverages Claude AI to generate compelling ad copy variations. It helps advertisers create professional, conversion-focused creatives in seconds instead of hours.

**Status:** ✅ IMPLEMENTATION COMPLETE (Backend + Frontend hooks + UI components)

---

## What Was Built

### Backend (Node.js + Express)

#### Service: `AiCreativeService`
**File:** `backend/src/services/ai-creative.service.ts`

**Methods:**

1. **`generateCreatives(request)`** - Generate 3-10 ad creative variations
   - Input: Campaign ID, product name, target audience, goal, tone preference, number of variations
   - Output: Array of creative variations with headline, body text, CTA, tone, and confidence score
   - Uses: Vercel AI Gateway → Claude 3.5 Sonnet
   - Example:
     ```
     Input: {
       campaignId: "camp_123",
       productName: "Eco-friendly water bottle",
       audience: "Young professionals",
       goal: "conversion",
       numVariations: 5
     }
     
     Output: {
       variations: [
         {
           headline: "Stay hydrated, save the planet",
           bodyText: "Reusable eco bottles trusted by 50K+ users",
           cta: "Get yours today",
           tone: "casual",
           confidence: 92
         },
         ...
       ]
     }
     ```

2. **`saveGeneratedCreatives(campaignId, variations, advertiserId)`** - Save AI-generated creatives to database
   - Stores as draft status with AI metadata
   - Marks with `ai_generated: true` and `ai_confidence` score
   - Returns saved creative entities

3. **`refineCreatives(campaignId, feedback, previousVariations)`** - Iteratively improve variations based on feedback
   - Input: User feedback like "Make it more playful" or "Focus on sustainability"
   - Output: Refined variations addressing the feedback
   - Maintains core benefits while applying requested changes

4. **`analyzeCreativePerformance(campaignId)`** - Analyze AI-generated creatives
   - Tracks: Total AI creatives, average confidence, best performing creative
   - Provides: Recommendations for improvement
   - Example output:
     ```
     {
       bestPerformer: "creative_id_123",
       aiGeneratedStats: {
         total: 5,
         avgConfidence: 88
       },
       recommendations: [
         "Generate more variations to find winner",
         "Refine with specific feedback to improve quality"
       ]
     }
     ```

#### Routes: `/ai/creative/*` (integrated into `ai.routes.ts`)

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/creative/generate` | Generate new creatives |
| POST | `/creative/save` | Save variations to campaign |
| POST | `/creative/refine` | Refine with feedback |
| GET | `/creative/performance/:campaignId` | Analyze creative performance |

**Authentication:** All routes require `authenticate` middleware + `authorize(['advertiser', 'admin'])`

#### Database Schema Updates

**Creative Entity** (`backend/src/entities/creative.entity.ts`)
- Added `ai_generated: boolean` - Flag for AI-generated creatives
- Added `ai_confidence: number` - AI confidence score (0-100)
- Added `title: string` - Creative headline
- Added `description: string` - Body text
- Added `cta: string` - Call-to-action
- Added `status: CreativeStatus` - draft, active, paused, archived
- Added `metadata: Record<string, any>` - Flexible storage (tone, generation params, etc.)

#### Environment Configuration

**New env vars** (in `.env.example`):
```
VERCEL_AI_GATEWAY_TOKEN=  # Required: Vercel AI Gateway auth token
ANTHROPIC_API_KEY=        # Alternative: Direct Anthropic API key (not recommended)
```

---

### Frontend (React + TypeScript)

#### Hook: `useAICreative.ts`

**File:** `frontend/src/hooks/useAICreative.ts`

**Exported Hooks:**

1. **`useGenerateCreatives()`** - TanStack Query mutation
   ```typescript
   const mutation = useGenerateCreatives();
   await mutation.mutateAsync({
     campaignId: "camp_123",
     productName: "Blue light glasses",
     audience: "Remote workers",
     goal: "conversion",
     numVariations: 5
   });
   // Returns: GenerateCreativesResponse
   ```

2. **`useSaveCreatives()`** - Save variations to database
   ```typescript
   const mutation = useSaveCreatives();
   await mutation.mutateAsync({
     campaignId: "camp_123",
     variations: [...]
   });
   // Invalidates: ['creatives'], ['campaigns'], ['campaign-performance']
   ```

3. **`useRefineCreatives()`** - Refine variations with feedback
   ```typescript
   const mutation = useRefineCreatives();
   await mutation.mutateAsync({
     campaignId: "camp_123",
     feedback: "Make it more playful and urgent",
     variations: [...]
   });
   ```

4. **`useCreativePerformance(campaignId)`** - Query hook for performance analytics
   ```typescript
   const { data, isLoading } = useCreativePerformance(campaignId);
   // Returns: CreativePerformance | null
   ```

#### Component: `AICreativeGenerator.tsx`

**File:** `frontend/src/components/ai/AICreativeGenerator.tsx`

**Features:**

- **Generation UI:** 
  - Select goal (Awareness / Consideration / Conversion)
  - Input target audience
  - Choose number of variations (3, 5, or 10)
  - Real-time loading states

- **Variation Display:**
  - Show headline, body text, CTA, tone for each variation
  - Display confidence score
  - Easy-to-read card layout

- **Refinement UI:**
  - Text area for feedback
  - One-click refinement with loading state
  - Non-blocking (keep current variations until refine completes)

- **Save & Actions:**
  - Save creatives to campaign
  - Generate new batch
  - Error handling with user-friendly messages

**Props:**
```typescript
interface AICreativeGeneratorProps {
  campaignId: string;        // Required
  productName: string;       // Required
  onSave?: (variations) => void;  // Optional callback
}
```

**Usage:**
```typescript
<AICreativeGenerator
  campaignId="camp_123"
  productName="Eco water bottle"
  onSave={(variations) => {
    console.log('Saved:', variations);
    // Update UI, close modal, etc.
  }}
/>
```

---

## Integration Points

### Where to Add the Component

#### 1. Campaign Creation Flow
**File:** `frontend/src/pages/dashboard/CampaignCreatePage.tsx`

Add a new step/section:
```typescript
{currentStep === 4 && (
  <div className="space-y-6">
    <h2>Create Ad Creatives</h2>
    <AICreativeGenerator
      campaignId={campaign.id}
      productName={campaign.name}
      onSave={(variations) => {
        // Move to next step or show success
        setCurrentStep(5);
      }}
    />
    <Button onClick={() => setCurrentStep(5)}>Skip AI Generation</Button>
  </div>
)}
```

#### 2. Campaign Detail/Edit Page
**File:** `frontend/src/pages/dashboard/CampaignDetailPage.tsx` or `CampaignEditPage.tsx`

Add a collapsible section:
```typescript
<Accordion>
  <AccordionItem title="AI Creative Generator">
    <AICreativeGenerator
      campaignId={campaignId}
      productName={campaign.name}
      onSave={() => {
        toast.success('Creatives saved!');
        queryClient.invalidateQueries(['campaign', campaignId]);
      }}
    />
  </AccordionItem>
</Accordion>
```

#### 3. Standalone Creative Management
**File:** `frontend/src/pages/dashboard/CreativesPage.tsx` (new page)

Full-page creative manager with AI assistant.

---

## How It Works (Technical Flow)

### Generation Flow

```
User Input
  ↓
AICreativeGenerator (UI)
  ↓
useGenerateCreatives mutation
  ↓
POST /api/v1/ai/creative/generate
  ↓
AiCreativeService.generateCreatives()
  ↓
Vercel AI Gateway
  ↓
Claude 3.5 Sonnet (Anthropic)
  ↓
Structured Output (Zod schema)
  ↓
Return 5 variations with confidence scores
  ↓
Display in UI
  ↓
User refines or saves
```

### Save Flow

```
User clicks "Save Creatives"
  ↓
useSaveCreatives mutation
  ↓
POST /api/v1/ai/creative/save
  ↓
AiCreativeService.saveGeneratedCreatives()
  ↓
Iterate variations → Create Creative entities
  ↓
Save to MongoDB with metadata
  ↓
Invalidate ['creatives'], ['campaigns'] queries
  ↓
UI updates with saved creatives
```

---

## API Reference

### POST /api/v1/ai/creative/generate

**Request:**
```json
{
  "campaignId": "camp_123",
  "productName": "Wireless Earbuds",
  "audience": "Tech-savvy professionals",
  "goal": "conversion",
  "tone": "casual",
  "numVariations": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "campaignId": "camp_123",
    "variations": [
      {
        "headline": "Crystal clear sound, zero distractions",
        "bodyText": "Premium noise cancellation + 8-hour battery",
        "cta": "Hear the difference",
        "tone": "casual",
        "confidence": 94
      }
    ],
    "summary": "Generated 5 conversion-focused variations emphasizing...",
    "generatedAt": "2026-05-16T14:30:00Z"
  }
}
```

### POST /api/v1/ai/creative/save

**Request:**
```json
{
  "campaignId": "camp_123",
  "variations": [...]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "saved": 5,
    "creatives": [
      {
        "id": "creative_456",
        "campaign_id": "camp_123",
        "title": "...",
        "status": "draft",
        "ai_generated": true,
        "ai_confidence": 94
      }
    ]
  }
}
```

### POST /api/v1/ai/creative/refine

**Request:**
```json
{
  "campaignId": "camp_123",
  "feedback": "Make these more urgent and playful",
  "variations": [...]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "refined": 5,
    "variations": [...]
  }
}
```

### GET /api/v1/ai/creative/performance/:campaignId

**Response:**
```json
{
  "success": true,
  "data": {
    "bestPerformer": "creative_456",
    "aiGeneratedStats": {
      "total": 5,
      "avgConfidence": 91
    },
    "recommendations": [
      "Test variations with A/B testing",
      "Refine with user feedback"
    ]
  }
}
```

---

## Configuration

### Environment Setup

1. **Backend** (`.env`):
   ```
   VERCEL_AI_GATEWAY_TOKEN=vercel_ai_gateway_xxxxx
   # OR
   ANTHROPIC_API_KEY=sk-ant-xxxxx
   ```

2. **Frontend** (`.env.local`):
   ```
   VITE_API_URL=http://localhost:4000/api/v1
   ```

### Model Configuration

**Current:** Claude 3.5 Sonnet via Vercel AI Gateway

**To change provider/model:**
```typescript
// In ai-creative.service.ts
const response = await generateText({
  model: aiGateway('openai/gpt-4o'),  // Switch to OpenAI
  // OR
  model: aiGateway('google/gemini-2-flash'),  // Switch to Google
  // ... rest of config
});
```

---

## Testing Checklist

- [ ] Install dependencies: `npm install`
- [ ] Set `VERCEL_AI_GATEWAY_TOKEN` env var
- [ ] Start backend: `npm run dev`
- [ ] Start frontend: `cd frontend && npm run dev`
- [ ] Test generation with 3-5 variations
- [ ] Test refinement with sample feedback
- [ ] Test saving creatives to campaign
- [ ] Verify creatives appear in campaign detail page
- [ ] Check MongoDB records have `ai_generated: true`
- [ ] Test error handling (network failures, etc.)

---

## Performance Considerations

- **Generation time:** ~5-10 seconds for 5 variations
- **Refinement time:** ~3-5 seconds
- **Token usage:** ~2K-3K tokens per generation (Claude Sonnet)
- **Cost:** ~$0.02-0.05 per generation (with Vercel AI Gateway)

---

## Future Enhancements

1. **A/B Testing Integration** - Automatically create A/B test variants
2. **Creative Scoring** - Score creatives by CTR, engagement, conversions
3. **Brand Voice Training** - Fine-tune AI to brand tone/style
4. **Bulk Generation** - Generate for multiple campaigns at once
5. **Creative Library** - Save templates and reuse patterns
6. **Multi-language Support** - Generate creatives in 20+ languages

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check `VERCEL_AI_GATEWAY_TOKEN` is set correctly |
| Timeout (>30s) | Reduce `numVariations` or check network |
| Low confidence (<60) | Provide more specific audience/feedback |
| Can't save creatives | Verify campaign ID is valid and user has permission |

---

## Files Created/Modified

**New Files:**
- `backend/src/services/ai-creative.service.ts` - Core service
- `backend/src/routes/ai-creative.routes.ts` - API routes (merged into ai.routes.ts)
- `frontend/src/hooks/useAICreative.ts` - React hooks
- `frontend/src/components/ai/AICreativeGenerator.tsx` - UI component

**Modified Files:**
- `backend/src/container.ts` - Register AiCreativeService in DI
- `backend/src/routes/ai.routes.ts` - Add creative routes
- `backend/src/entities/creative.entity.ts` - Add AI-related fields
- `backend/.env.example` - Add VERCEL_AI_GATEWAY_TOKEN

---

## Next Steps

1. **Integration Phase:**
   - Add AICreativeGenerator to CampaignCreatePage
   - Add AICreativeGenerator to CampaignDetailPage
   - Test end-to-end flow

2. **Enhancement Phase:**
   - Add A/B test integration
   - Implement creative performance metrics
   - Add usage analytics/billing

3. **Production Phase:**
   - Set up proper error monitoring (Sentry)
   - Implement rate limiting per user/campaign
   - Add caching for frequently requested creatives
   - Set up cost tracking via Vercel AI Gateway dashboard

---

**Document Created:** 2026-05-16  
**Feature Status:** Ready for Integration Testing
