
import { useState } from 'react';
import { useGenerateCreatives, useSaveCreatives, useRefineCreatives, type CreativeVariation } from '@/hooks/useAICreative';
import { LANGUAGES } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
  const [language, setLanguage] = useState('en');

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
        language,
        numVariations,
      });
      setVariations(result.variations);
    } catch (error) {
      console.error('Failed to generate creatives:', error);
    }
  };

  const handleRefine = async () => {
    if (!feedback.trim()) return;
    try {
      const result = await refineMutation.mutateAsync({
        campaignId,
        feedback,
        variations,
      });
      setVariations(result.variations);
      setFeedback('');
    } catch (error) {
      console.error('Failed to refine creatives:', error);
    }
  };

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({
        campaignId,
        variations,
        language,
      });
      onSave?.(variations);
      setVariations([]);
    } catch (error) {
      console.error('Failed to save creatives:', error);
    }
  };

  const selectedLanguage = LANGUAGES.find(l => l.value === language);

  const isGenerating = generateMutation.isPending;
  const isRefining = refineMutation.isPending;
  const isSaving = saveMutation.isPending;
  const isLoading = isGenerating || isRefining || isSaving;

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
                      : 'border-gray-300 text-gray-700 hover:border-blue-400 disabled:opacity-50'
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
              onChange={(e) => setGoal(e.target.value as 'awareness' | 'consideration' | 'conversion')}
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

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Refine with feedback (optional)</label>
            <textarea
              placeholder="e.g., Make it more playful, focus on sustainability, reduce urgency..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="h-24 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              disabled={isLoading}
            />
            <Button
              onClick={handleRefine}
              disabled={!feedback.trim() || isLoading}
              variant="outline"
              className="w-full"
            >
              {isRefining ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Refining...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refine Creatives
                </>
              )}
            </Button>
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
