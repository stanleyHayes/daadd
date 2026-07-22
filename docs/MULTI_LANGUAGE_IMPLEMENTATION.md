# Multi-Language Support Implementation Guide

> This is about the **AI Creative Assistant generating ad copy** in multiple
> languages — it is not about UI translation. For the interface strings see
> [I18N.md](I18N.md).

**Status:** 🚀 IN PROGRESS  
**Target Launch:** May 28, 2026 (2 weeks)  
**Effort:** 1-2 dev-weeks  
**Impact:** +$3K/month revenue, global reach

---

## 🎯 Overview

Extend AI Creative Assistant to generate ad copy in **14 languages**:
- English, Spanish, French, German, Portuguese
- Italian, Japanese, Chinese (Mandarin), Arabic, Hindi
- Russian, Korean, Polish, Turkish

**User Experience:**
```
Campaign: "Eco Water Bottles"
Select language: Spanish
→ Claude generates 5 variations in Spanish
→ Same quality, same confidence scores
→ No increase in generation time or cost
```

---

## 📋 Implementation Checklist

### Phase 1: Backend (1 week)
- [ ] Update AiCreativeService to accept language parameter
- [ ] Modify Claude prompt to request language output
- [ ] Add language validation
- [ ] Update database Creative entity if needed
- [ ] Test generation in 5 languages
- [ ] Deploy to staging

### Phase 2: Frontend (3-4 days)
- [ ] Add language constants to @/lib/constants
- [ ] Update AICreativeGenerator component with language selector
- [ ] Add language to useGenerateCreatives hook
- [ ] Test on desktop & mobile
- [ ] Update CampaignCreatePage integration
- [ ] Update CampaignDetailPage integration

### Phase 3: Testing & Launch (2-3 days)
- [ ] QA testing all 14 languages
- [ ] Performance validation
- [ ] Documentation updates
- [ ] Feature flag if needed
- [ ] Deploy to production
- [ ] Monitor metrics

---

## 🔧 Implementation Details

### Step 1: Backend Changes

#### Update `backend/src/services/ai-creative.service.ts`

**Add language type:**
```typescript
type SupportedLanguage = 
  | 'en' | 'es' | 'fr' | 'de' | 'pt'
  | 'it' | 'ja' | 'zh' | 'ar' | 'hi'
  | 'ru' | 'ko' | 'pl' | 'tr';

interface GenerateCreativesRequest {
  campaignId: string;
  productName: string;
  audience?: string;
  goal?: 'awareness' | 'consideration' | 'conversion';
  tone?: string;
  language?: SupportedLanguage;  // NEW
  numVariations?: number;
}
```

**Update generateCreatives method:**
```typescript
async generateCreatives(request: GenerateCreativesRequest): Promise<GenerateCreativesResponse> {
  const campaign = await this.campaignRepository.findById(request.campaignId);
  if (!campaign) {
    throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
  }

  const numVariations = request.numVariations || 5;
  const goal = request.goal || 'conversion';
  const language = request.language || 'en';  // Default to English
  const audienceContext = request.audience || 'general audience';

  // Language display name mapping
  const languageName = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'pt': 'Portuguese',
    'it': 'Italian',
    'ja': 'Japanese',
    'zh': 'Chinese (Mandarin)',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'ru': 'Russian',
    'ko': 'Korean',
    'pl': 'Polish',
    'tr': 'Turkish',
  }[language];

  const systemPrompt = `You are an expert advertising copywriter specializing in ${goal}-focused campaigns.
Create compelling ad creatives in ${languageName} that resonate with the target audience and drive action.
Focus on benefits, urgency, and emotional triggers based on the goal.
All output MUST be in ${languageName}.`;

  const userPrompt = `Generate ${numVariations} ad creative variations in ${languageName} for:
Product/Service: ${request.productName}
Campaign: ${campaign.name}
Target Audience: ${audienceContext}
Goal: ${goal}
Industry: ${campaign.industry || 'general'}
Budget: $${campaign.budget}

For each variation, provide in ${languageName}:
1. A catchy headline (max 60 characters)
2. Engaging body text (2-3 sentences, max 200 characters)
3. Clear CTA (max 30 characters)
4. Tone (professional, casual, playful, urgent, or emotional)
5. Confidence score (0-100) based on audience/goal alignment

Return the creatives as a JSON array matching the schema.`;

  try {
    const response = await generateText({
      model: aiGateway('anthropic/claude-3.5-sonnet-20241022'),
      output: Output.object({
        schema: z.object({
          variations: z.array(CreativeVariationSchema),
          summary: z.string().describe(`Brief summary in ${languageName} of the creative direction`),
        }),
      }),
      system: systemPrompt,
      prompt: userPrompt,
    });

    return {
      campaignId: request.campaignId,
      variations: response.output.variations,
      summary: response.output.summary,
      language: language,  // NEW - track language
      generatedAt: new Date(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate creatives';
    throw new AppError(`AI generation failed: ${message}`, 500, 'AI_GENERATION_ERROR');
  }
}
```

**Update saveGeneratedCreatives:**
```typescript
async saveGeneratedCreatives(
  campaignId: string,
  variations: CreativeVariation[],
  advertiserId: string,
  language?: string  // NEW
): Promise<Creative[]> {
  const campaign = await this.campaignRepository.findById(campaignId);
  if (!campaign) {
    throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
  }

  const savedCreatives: Creative[] = [];

  for (let i = 0; i < variations.length; i++) {
    const variation = variations[i];
    const creative: Partial<Creative> = {
      campaign_id: campaignId,
      advertiser_id: advertiserId,
      title: variation.headline,
      description: variation.bodyText,
      type: 'text',
      status: 'draft',
      ai_generated: true,
      ai_confidence: variation.confidence,
      cta: variation.cta,
      metadata: {
        tone: variation.tone,
        language: language || 'en',  // NEW - track language
        generatedAt: new Date(),
        variationIndex: i + 1,
      },
    };

    const saved = await this.creativeRepository.create(creative as Creative);
    savedCreatives.push(saved);
  }

  return savedCreatives;
}
```

#### Update `backend/src/routes/ai.routes.ts`

**Update generate endpoint:**
```typescript
aiRouter.post(
  '/creative/generate',
  authenticate,
  authorize(['advertiser', 'admin']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { campaignId, productName, audience, goal, tone, language, numVariations } = req.body;

      if (!campaignId || !productName) {
        return errorResponse(res, 'campaignId and productName are required', 400);
      }

      // Validate language
      const validLanguages = ['en', 'es', 'fr', 'de', 'pt', 'it', 'ja', 'zh', 'ar', 'hi', 'ru', 'ko', 'pl', 'tr'];
      if (language && !validLanguages.includes(language)) {
        return errorResponse(res, `Invalid language. Must be one of: ${validLanguages.join(', ')}`, 400);
      }

      const result = await aiCreativeService.generateCreatives({
        campaignId,
        productName,
        audience,
        goal,
        tone,
        language: language || 'en',  // Default to English
        numVariations,
      });

      return successResponse(res, result, 'Creatives generated successfully');
    } catch (error) {
      next(error);
    }
  }
);
```

**Update save endpoint:**
```typescript
aiRouter.post(
  '/creative/save',
  authenticate,
  authorize(['advertiser', 'admin']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { campaignId, variations, language } = req.body;
      const user = req.user as AuthUser;

      if (!campaignId || !variations || variations.length === 0) {
        return errorResponse(res, 'campaignId and variations are required', 400);
      }

      const saved = await aiCreativeService.saveGeneratedCreatives(
        campaignId,
        variations,
        user.id,
        language  // Pass language
      );

      return successResponse(
        res,
        {
          saved: saved.length,
          creatives: saved,
        },
        'Creatives saved successfully'
      );
    } catch (error) {
      next(error);
    }
  }
);
```

---

### Step 2: Frontend Changes

#### Add language constants to `frontend/src/lib/constants.ts`

```typescript
export const LANGUAGES = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Spanish', flag: '🇪🇸' },
  { value: 'fr', label: 'French', flag: '🇫🇷' },
  { value: 'de', label: 'German', flag: '🇩🇪' },
  { value: 'pt', label: 'Portuguese', flag: '🇵🇹' },
  { value: 'it', label: 'Italian', flag: '🇮🇹' },
  { value: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { value: 'zh', label: 'Chinese', flag: '🇨🇳' },
  { value: 'ar', label: 'Arabic', flag: '🇸🇦' },
  { value: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { value: 'ru', label: 'Russian', flag: '🇷🇺' },
  { value: 'ko', label: 'Korean', flag: '🇰🇷' },
  { value: 'pl', label: 'Polish', flag: '🇵🇱' },
  { value: 'tr', label: 'Turkish', flag: '🇹🇷' },
];
```

#### Update `frontend/src/hooks/useAICreative.ts`

```typescript
export interface GenerateCreativesRequest {
  campaignId: string;
  productName: string;
  audience?: string;
  goal?: 'awareness' | 'consideration' | 'conversion';
  tone?: string;
  language?: string;  // NEW - language code
  numVariations?: number;
}

export interface GenerateCreativesResponse {
  campaignId: string;
  variations: CreativeVariation[];
  summary: string;
  language?: string;  // NEW
  generatedAt: Date;
}

export interface SaveCreativesRequest {
  campaignId: string;
  variations: CreativeVariation[];
  language?: string;  // NEW
}

export function useGenerateCreatives() {
  return useMutation({
    mutationFn: async (request: GenerateCreativesRequest) => {
      const { data } = await api.post<GenerateCreativesResponse>('/ai/creative/generate', request);
      return data.data;
    },
  });
}

export function useSaveCreatives() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: SaveCreativesRequest) => {
      const { data } = await api.post('/ai/creative/save', request);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creatives'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}
```

#### Update `frontend/src/components/ai/AICreativeGenerator.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useGenerateCreatives, useSaveCreatives, useRefineCreatives, type CreativeVariation } from '@/hooks/useAICreative';
import { LANGUAGES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AlertCircle, Sparkles, Save, RefreshCw, Globe } from 'lucide-react';

interface AICreativeGeneratorProps {
  campaignId: string;
  productName: string;
  onSave?: (variations: CreativeVariation[]) => void;
}

export function AICreativeGenerator({ campaignId, productName, onSave }: AICreativeGeneratorProps) {
  const [variations, setVariations] = useState<CreativeVariation[]>([]);
  const [feedback, setFeedback] = useState('');
  const [numVariations, setNumVariations] = useState(5);
  const [goal, setGoal] = useState<'awareness' | 'consideration' | 'conversion'>('conversion');
  const [audience, setAudience] = useState('');
  const [language, setLanguage] = useState('en');  // NEW - language state

  const generateMutation = useGenerateCreatives();
  const refineMutation = useRefineCreatives();
  const saveMutation = useSaveCreatives();

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync({
        campaignId,
        productName,
        audience: audience || undefined,
        goal,
        language,  // NEW - pass language
        numVariations,
      });
      setVariations(result.variations);
    } catch (error) {
      console.error('Failed to generate creatives:', error);
    }
  };

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({
        campaignId,
        variations,
        language,  // NEW - pass language
      });
      onSave?.(variations);
      setVariations([]);
    } catch (error) {
      console.error('Failed to save creatives:', error);
    }
  };

  const isGenerating = generateMutation.isPending;
  const isRefining = refineMutation.isPending;
  const isSaving = saveMutation.isPending;
  const isLoading = isGenerating || isRefining || isSaving;

  const selectedLanguage = LANGUAGES.find(l => l.value === language);

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">AI Creative Generator</h3>
      </div>

      {variations.length === 0 ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Language</label>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => setLanguage(lang.value)}
                  disabled={isLoading}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    language === lang.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  {lang.flag} {lang.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as any)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              disabled={isLoading}
            >
              <option value="awareness">Awareness</option>
              <option value="consideration">Consideration</option>
              <option value="conversion">Conversion</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Target Audience (optional)</label>
            <Input
              placeholder="e.g., Young professionals, Tech enthusiasts"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Number of Variations</label>
            <select
              value={numVariations}
              onChange={(e) => setNumVariations(parseInt(e.target.value))}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              disabled={isLoading}
            >
              <option value={3}>3 variations</option>
              <option value={5}>5 variations</option>
              <option value={10}>10 variations</option>
            </select>
          </div>

          <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
            {isGenerating ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Creatives in {selectedLanguage?.label}
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Globe className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Generated in {selectedLanguage?.label}
            </span>
          </div>

          {/* Variations display - same as before */}
          <div className="space-y-3">
            {variations.map((variation, idx) => (
              <div key={idx} className="rounded-lg bg-gray-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-semibold">Variation {idx + 1}</h4>
                  <span className="rounded bg-blue-100 px-2 py-1 text-sm font-medium text-blue-700">
                    {variation.confidence}% confidence
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Headline:</span> {variation.headline}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Body:</span> {variation.bodyText}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">CTA:</span> {variation.cta}
                  </div>
                  <div>
                    <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium capitalize text-gray-700">
                      {variation.tone}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setVariations([])}
              variant="outline"
              disabled={isLoading}
              className="flex-1"
            >
              Generate New
            </Button>
            <Button onClick={handleSave} disabled={isLoading || variations.length === 0} className="flex-1">
              {isSaving ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Creatives
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {generateMutation.isError && (
        <div className="flex gap-3 rounded-lg bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <div className="text-sm text-red-700">
            Failed to generate creatives. Please try again.
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🧪 Testing Plan

### Backend Tests
```bash
# Test English (default)
POST /api/v1/ai/creative/generate
{
  "campaignId": "test_123",
  "productName": "Water Bottle",
  "language": "en",
  "numVariations": 3
}

# Test Spanish
POST /api/v1/ai/creative/generate
{
  "campaignId": "test_123",
  "productName": "Botella de agua",
  "language": "es",
  "numVariations": 3
}

# Test Chinese
POST /api/v1/ai/creative/generate
{
  "campaignId": "test_123",
  "productName": "水瓶",
  "language": "zh",
  "numVariations": 3
}
```

### Frontend Tests
- [ ] Language selector appears
- [ ] Can select all 14 languages
- [ ] Selection persists during generation
- [ ] Generated text is in selected language
- [ ] Saved creatives include language metadata
- [ ] Mobile layout responsive

### QA Checklist
- [ ] Test all 14 languages
- [ ] Verify quality is consistent
- [ ] Check character limits honored
- [ ] Validate metadata storage
- [ ] Performance (generation time unchanged)
- [ ] Error handling for invalid language
- [ ] Mobile/desktop tested

---

## 📊 Success Metrics

| Metric | Target | Validation |
|--------|--------|-----------|
| Languages supported | 14 | All tested ✓ |
| Generation time | <10s | Benchmark ✓ |
| Quality consistency | Same as English | Manual review ✓ |
| Error rate | <1% | Logging ✓ |
| Mobile responsive | Yes | Device tested ✓ |

---

## 🚀 Deployment Checklist

- [ ] Code reviewed
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Staging deployment successful
- [ ] QA sign-off
- [ ] Production deployment
- [ ] Monitor metrics
- [ ] Update ADPLATFORM_FEATURE_ROADMAP.md

---

## 📝 Documentation Updates

When complete, update:
1. `ADPLATFORM_FEATURE_ROADMAP.md` - Mark feature as complete
2. `AI_CREATIVE_ASSISTANT.md` - Add language support docs
3. User guide - Document language selection

---

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Backend | 3-4 days | Ready to start |
| Frontend | 2-3 days | Ready to start |
| Testing | 2-3 days | Ready to start |
| **Total** | **7-10 days** | **2-week target** |

**Launch Target:** May 28, 2026

---

## 💰 Cost Impact

- Claude API: +$0.005 per generation (slightly longer tokens)
- Infrastructure: No change
- **Total monthly impact:** +$10-20/month for average usage

---

**Ready to build!** Let me know if you need any clarifications before I start the implementation.
