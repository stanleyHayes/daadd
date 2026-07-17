
import React, { useEffect, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { MetricsCard } from '@/components/analytics/MetricsCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { cn, formatDate } from '@/lib/utils';
import { useRecommendations, useApplyRecommendation, useAIAuditLog, useDismissRecommendation, useUpdateAIMode } from '@/hooks/useAI';
import { useCampaigns } from '@/hooks/useCampaigns';
import { TrendingUp, DollarSign, Image, Smartphone, Check, X, Brain, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageTransition } from '@/components/ui/PageTransition';
import { Skeleton, SkeletonCard, SkeletonText, SkeletonList } from '@/components/ui/Skeleton';

const typeIcons: Record<string, React.ReactNode> = {
  bid: <TrendingUp className="h-5 w-5" />,
  budget: <DollarSign className="h-5 w-5" />,
  creative: <Image className="h-5 w-5" />,
  device: <Smartphone className="h-5 w-5" />,
  targeting: <TrendingUp className="h-5 w-5" />,
};

const typeColors: Record<string, string> = {
  bid: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600',
  budget: 'bg-accent-50 dark:bg-accent-900/30 text-accent-600',
  creative: 'bg-secondary-50 dark:bg-secondary-900/30 text-secondary-600',
  device: 'bg-warning-50 dark:bg-warning-900/30 text-warning-600',
  targeting: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600',
};

export function AIOptimizationPage() {
  const [campaignId, setCampaignId] = useState('');
  const [aiMode, setAiMode] = useState<'auto_adjust' | 'recommendation_only'>('auto_adjust');

  const { data: campaignsData } = useCampaigns();
  const campaigns = campaignsData?.data || [];

  const { data: recommendations, isLoading: recsLoading, error: recsError } = useRecommendations(campaignId || undefined);
  const { data: auditLog, isLoading: logLoading } = useAIAuditLog(campaignId || undefined);
  const applyMutation = useApplyRecommendation();
  const dismissMutation = useDismissRecommendation();
  const updateAIModeMutation = useUpdateAIMode();

  // Reflect the selected campaign's current AI mode
  useEffect(() => {
    const selected = campaignsData?.data?.find((c) => c.id === campaignId);
    if (selected?.ai_mode) {
      setAiMode(selected.ai_mode);
    }
  }, [campaignId, campaignsData?.data]);

  const recs = recommendations || [];
  const logs = auditLog || [];

  const handleAIModeChange = async (mode: 'auto_adjust' | 'recommendation_only') => {
    if (mode === aiMode || updateAIModeMutation.isPending) return;
    if (!campaignId) {
      setAiMode(mode);
      return;
    }
    try {
      await updateAIModeMutation.mutateAsync({ campaignId, mode });
      setAiMode(mode);
      toast.success('AI mode updated');
    } catch {
      toast.error('Failed to update AI mode');
    }
  };

  const handleApply = async (id: string) => {
    if (!campaignId) return;
    try {
      await applyMutation.mutateAsync({ campaignId, recommendationId: id });
      toast.success('Recommendation applied');
    } catch {
      toast.error('Failed to apply recommendation');
    }
  };

  const handleDismiss = async (id: string) => {
    if (!campaignId) return;
    try {
      await dismissMutation.mutateAsync({ campaignId, recommendationId: id });
      toast.success('Recommendation dismissed');
    } catch {
      toast.error('Failed to dismiss recommendation');
    }
  };

  return (
    <PageTransition>
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="AI Optimization"
        subtitle="AI-powered recommendations for campaign performance"
      />

      {campaignId && !recsLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricsCard icon={<Brain className="h-5 w-5" />} label="Recommendations" value={String(recs.length)} iconColor="text-primary-600" iconBg="bg-primary-50 dark:bg-primary-900/30" />
          <MetricsCard icon={<CheckCircle className="h-5 w-5" />} label="Applied" value={String(recs.filter(r => r.status === 'applied').length)} iconColor="text-accent-600" iconBg="bg-accent-50 dark:bg-accent-900/30" />
          <MetricsCard icon={<XCircle className="h-5 w-5" />} label="Dismissed" value={String(recs.filter(r => r.status === 'dismissed').length)} iconColor="text-danger-600" iconBg="bg-danger-50 dark:bg-danger-900/30" />
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="sm:w-56">
          <Select
            label="Campaign"
            placeholder="Select a campaign"
            options={campaigns.map((c) => ({ value: c.id, label: c.name }))}
            value={campaignId}
            onChange={setCampaignId}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">AI Mode</label>
          <div className="flex rounded-lg border border-gray-300 dark:border-slate-600 overflow-hidden">
            <button
              className={cn('px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-50', aiMode === 'auto_adjust' ? 'bg-secondary-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700')}
              onClick={() => handleAIModeChange('auto_adjust')}
              disabled={updateAIModeMutation.isPending}
            >
              Auto-Adjust
            </button>
            <button
              className={cn('px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-50', aiMode === 'recommendation_only' ? 'bg-secondary-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700')}
              onClick={() => handleAIModeChange('recommendation_only')}
              disabled={updateAIModeMutation.isPending}
            >
              Recommendation Only
            </button>
          </div>
        </div>
      </div>

      {!campaignId ? (
        <Card>
          <div className="text-center py-16">
            <Brain className="h-10 w-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Select a Campaign</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">Choose a campaign above to view AI recommendations.</p>
          </div>
        </Card>
      ) : recsLoading ? (
        <div className="space-y-6">
          <div>
            <Skeleton variant="text" className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i}>
                  <div className="flex items-start gap-4">
                    <Skeleton variant="circle" className="h-12 w-12" />
                    <div className="flex-1 space-y-2">
                      <Skeleton variant="text" className="h-5 w-2/3" />
                      <SkeletonText lines={2} />
                      <div className="flex gap-2 pt-2">
                        <Skeleton variant="text" className="h-3 w-16" />
                        <Skeleton variant="text" className="h-3 w-24" />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Skeleton variant="button" className="h-8 w-16" />
                        <Skeleton variant="button" className="h-8 w-20" />
                      </div>
                    </div>
                  </div>
                </SkeletonCard>
              ))}
            </div>
          </div>
          <SkeletonCard>
            <Skeleton variant="text" className="h-5 w-40 mb-4" />
            <SkeletonList items={3} />
          </SkeletonCard>
        </div>
      ) : recsError ? (
        <Card>
          <div className="text-center py-12">
            <AlertTriangle className="h-8 w-8 text-danger-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-slate-400">Failed to load AI recommendations. Please try again later.</p>
          </div>
        </Card>
      ) : (
        <>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recommendations</h2>
            {recs.filter((r) => r.status === 'pending').length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <Check className="h-10 w-10 text-accent-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">All Caught Up</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">No pending AI recommendations for this campaign.</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recs.filter((r) => r.status === 'pending').map((rec) => (
                  <Card key={rec.id}>
                    <div className="flex items-start gap-4">
                      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', typeColors[rec.type] || 'bg-gray-50 text-gray-600')}>
                        {typeIcons[rec.type] || <TrendingUp className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{rec.title}</h3>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{rec.description}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="green" size="sm">{rec.expected_impact}</Badge>
                          <span className="text-xs text-gray-400">Confidence: {(rec.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                          <Button size="sm" onClick={() => handleApply(rec.id)} loading={applyMutation.isPending} icon={<Check className="h-3.5 w-3.5" />}>
                            Apply
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDismiss(rec.id)} icon={<X className="h-3.5 w-3.5" />}>
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Card>
            <CardHeader title="AI Audit Log" subtitle="History of AI-driven changes" />
            {logLoading ? (
              <div className="space-y-4 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton variant="circle" className="h-8 w-8" />
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Skeleton variant="text" className="h-4 w-32" />
                        <Skeleton variant="text" className="h-4 w-12" />
                      </div>
                      <Skeleton variant="text" className="h-3 w-1/2" />
                      <Skeleton variant="text" className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary-50 dark:bg-slate-700 flex items-center justify-center mb-4">
                  <Brain className="w-8 h-8 text-secondary-400 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No AI changes yet</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm">
                  Once AI recommendations are applied, a versioned history of all changes will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log, i) => (
                  <div key={log.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                        log.applied_by === 'ai' ? 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400' : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
                      )}>
                        v{log.version}
                      </div>
                      {i < logs.length - 1 && <div className="w-px flex-1 bg-gray-200 dark:bg-slate-700 mt-2" />}
                    </div>
                    <div className="pb-6">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{log.action}</p>
                        <Badge variant={log.applied_by === 'ai' ? 'purple' : 'gray'} size="sm">
                          {log.applied_by === 'ai' ? 'AI' : 'Manual'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        {log.field}: <span className="text-danger-500 line-through">{log.old_value}</span> → <span className="text-accent-600 font-medium">{log.new_value}</span>
                      </p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{formatDate(log.timestamp, 'MMM d, yyyy h:mm a')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
    </PageTransition>
  );
}
