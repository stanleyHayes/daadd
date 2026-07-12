import { useState } from 'react';
import { useCreateABTest, useABTestResults, useMarkWinner, type ABTestMetrics } from '@/hooks/useABTesting';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AlertCircle, Zap, TrendingUp, CheckCircle, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

interface CreativeOption {
  id: string;
  title?: string;
  description?: string;
}

interface ABTestManagerProps {
  campaignId: string;
  creatives: CreativeOption[];
}

export function ABTestManager({ campaignId, creatives }: ABTestManagerProps) {
  const [controlCreativeId, setControlCreativeId] = useState<string>('');
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);

  const createABTest = useCreateABTest();
  const testResults = useABTestResults(campaignId);
  const markWinner = useMarkWinner();

  const hasExistingTest = testResults.data;

  const handleCreateTest = async () => {
    if (!controlCreativeId || selectedVariants.length === 0) {
      toast.error('Select a control creative and at least one variant');
      return;
    }

    try {
      await createABTest.mutateAsync({
        campaignId,
        controlCreativeId,
        variantCreativeIds: selectedVariants,
      });
      toast.success('A/B test created!');
      setControlCreativeId('');
      setSelectedVariants([]);
      setShowForm(false);
    } catch {
      toast.error('Failed to create A/B test');
    }
  };

  const handleMarkWinner = async (creativeId: string) => {
    if (!hasExistingTest) return;

    try {
      await markWinner.mutateAsync({
        testId: hasExistingTest.testId,
        creativeId,
      });
      toast.success('Winner marked!');
    } catch {
      toast.error('Failed to mark winner');
    }
  };

  if (hasExistingTest) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader title="Active A/B Test" />
          <div className="space-y-4">
            {/* Control Creative */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                Control
              </h4>
              <CreativeMetricsCard
                creative={hasExistingTest.controlCreative}
                metrics={hasExistingTest.controlCreative.metrics}
                isWinner={hasExistingTest.winner?.creativeId === hasExistingTest.controlCreative.id}
                onMarkWinner={() => handleMarkWinner(hasExistingTest.controlCreative.id)}
              />
            </div>

            {/* Variant Creatives */}
            {hasExistingTest.variantCreatives.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  Variants
                </h4>
                <div className="space-y-2">
                  {hasExistingTest.variantCreatives.map((creative: { id: string; metrics: ABTestMetrics }) => (
                    <CreativeMetricsCard
                      key={creative.id}
                      creative={creative}
                      metrics={creative.metrics}
                      isWinner={hasExistingTest.winner?.creativeId === creative.id}
                      onMarkWinner={() => handleMarkWinner(creative.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Test Status */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {hasExistingTest.isComplete ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900 dark:text-green-100">Test Complete</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">Test In Progress</span>
                  </>
                )}
              </div>
              {hasExistingTest.winner && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Winner: {hasExistingTest.winner.variant} ({hasExistingTest.winner.creativeId})
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader title="A/B Testing" subtitle="Test multiple creative variations" />

      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="w-full">
          <Zap className="mr-2 h-4 w-4" />
          Create A/B Test
        </Button>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Control Creative
            </label>
            <select
              value={controlCreativeId}
              onChange={(e) => setControlCreativeId(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select control creative...</option>
              {creatives.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title || c.description || `Creative ${c.id.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Variants (select 1-4)
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {creatives
                .filter((c) => c.id !== controlCreativeId)
                .map((c) => (
                  <label key={c.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedVariants.includes(c.id)}
                      onChange={(e) => {
                        if (e.target.checked && selectedVariants.length < 4) {
                          setSelectedVariants([...selectedVariants, c.id]);
                        } else {
                          setSelectedVariants(selectedVariants.filter((id) => id !== c.id));
                        }
                      }}
                      disabled={selectedVariants.length >= 4 && !selectedVariants.includes(c.id)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {c.title || c.description || `Creative ${c.id.slice(0, 8)}`}
                    </span>
                  </label>
                ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setShowForm(false)}
              variant="outline"
              disabled={createABTest.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTest}
              disabled={createABTest.isPending || !controlCreativeId || selectedVariants.length === 0}
              className="flex-1"
            >
              {createABTest.isPending ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Creating...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Create Test
                </>
              )}
            </Button>
          </div>

          {createABTest.isError && (
            <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-100">Failed to create test</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function CreativeMetricsCard({
  creative,
  metrics,
  isWinner,
  onMarkWinner,
}: {
  creative: { id: string; title?: string; description?: string };
  metrics: ABTestMetrics;
  isWinner: boolean;
  onMarkWinner: () => void;
}) {
  return (
    <div className={`p-4 rounded-lg border ${isWinner ? 'bg-green-50 dark:bg-green-900/20 border-green-300' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h5 className="font-medium text-gray-900 dark:text-white text-sm">
            {creative.title || creative.description || `Creative ${creative.id.slice(0, 8)}`}
          </h5>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Variant: <span className="font-mono uppercase">{metrics.variant}</span>
          </p>
        </div>
        {isWinner && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/40 rounded">
            <Trophy className="h-3.5 w-3.5 text-green-600" />
            <span className="text-xs font-semibold text-green-700 dark:text-green-100">Winner</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Impressions</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{metrics.impressions.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Clicks</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{metrics.clicks.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">CTR</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{metrics.ctr.toFixed(2)}%</p>
        </div>
      </div>

      {!isWinner && (
        <Button onClick={onMarkWinner} variant="outline" size="sm" className="w-full">
          Mark as Winner
        </Button>
      )}
    </div>
  );
}
