import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MetricsCard } from '@/components/analytics/MetricsCard';
import { Select } from '@/components/ui/Select';
import { useAnomalies, useResolveAnomaly } from '@/hooks/useAnomalies';
import { useCampaigns } from '@/hooks/useCampaigns';
import { formatRelativeTime } from '@/lib/utils';
import { AlertTriangle, CheckCircle, PauseCircle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageTransition } from '@/components/ui/PageTransition';
import { hasPermission } from '@/lib/rbac';
import { useAuthStore } from '@/stores/auth.store';
import type { AnomalySeverity } from '@/types';
import { Skeleton, SkeletonMetric, SkeletonCard, SkeletonText } from '@/components/ui/Skeleton';

const severityConfig: Record<AnomalySeverity, { variant: 'blue' | 'yellow' | 'red'; label: string }> = {
  low: { variant: 'blue', label: 'LOW' },
  medium: { variant: 'yellow', label: 'MEDIUM' },
  high: { variant: 'red', label: 'HIGH' },
  critical: { variant: 'red', label: 'CRITICAL' },
};

export function AnomaliesPage() {
  const [campaignId, setCampaignId] = useState('');
  const { data: anomalies, isLoading, error } = useAnomalies(campaignId || undefined);
  const resolveMutation = useResolveAnomaly();
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role || 'end_user';
  const canResolve = hasPermission(userRole, 'ANOMALY_RESOLVE');

  const { data: campaignsData } = useCampaigns();
  const campaigns = campaignsData?.data || [];

  const activeAnomalies = anomalies || [];
  const autoPaused = activeAnomalies.filter((a) => a.auto_paused).length;

  const handleResolve = async (id: string) => {
    try {
      await resolveMutation.mutateAsync(id);
      toast.success('Anomaly resolved');
    } catch {
      toast.error('Failed to resolve anomaly');
    }
  };

  return (
    <PageTransition>
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Anomaly Detection</h1>
        <p className="page-subtitle">Monitor and respond to campaign anomalies</p>
      </div>

      <div className="w-56">
        <Select
          label="Campaign"
          placeholder="Select a campaign"
          options={campaigns.map((c) => ({ value: c.id, label: c.name }))}
          value={campaignId}
          onChange={setCampaignId}
        />
      </div>

      {!campaignId ? (
        <Card>
          <div className="text-center py-16">
            <Shield className="h-10 w-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Select a Campaign</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">Choose a campaign above to view its anomalies.</p>
          </div>
        </Card>
      ) : isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonMetric key={i} />
            ))}
          </div>
          <SkeletonCard>
            <div className="flex items-start gap-4">
              <Skeleton variant="circle" className="h-10 w-10" />
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Skeleton variant="text" className="h-4 w-16" />
                  <Skeleton variant="text" className="h-4 w-24" />
                </div>
                <Skeleton variant="text" className="h-5 w-1/3" />
                <SkeletonText lines={2} />
              </div>
            </div>
          </SkeletonCard>
          <SkeletonCard>
            <div className="flex items-start gap-4">
              <Skeleton variant="circle" className="h-10 w-10" />
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Skeleton variant="text" className="h-4 w-16" />
                  <Skeleton variant="text" className="h-4 w-24" />
                </div>
                <Skeleton variant="text" className="h-5 w-1/3" />
                <SkeletonText lines={2} />
              </div>
            </div>
          </SkeletonCard>
        </div>
      ) : error ? (
        <Card>
          <div className="text-center py-12">
            <AlertTriangle className="h-8 w-8 text-danger-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-slate-400">Failed to load anomalies. Please try again later.</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricsCard
              icon={<AlertTriangle className="h-5 w-5" />}
              label="Active Anomalies"
              value={activeAnomalies.length.toString()}
              iconColor="text-danger-600"
              iconBg="bg-danger-50 dark:bg-danger-900/30"
            />
            <MetricsCard
              icon={<CheckCircle className="h-5 w-5" />}
              label="Resolved"
              value={activeAnomalies.filter((a) => a.resolved_at).length.toString()}
              iconColor="text-accent-600"
              iconBg="bg-accent-50 dark:bg-accent-900/30"
            />
            <MetricsCard
              icon={<PauseCircle className="h-5 w-5" />}
              label="Auto-Paused"
              value={autoPaused.toString()}
              iconColor="text-warning-600"
              iconBg="bg-warning-50 dark:bg-warning-900/30"
            />
          </div>

          {activeAnomalies.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <CheckCircle className="h-10 w-10 text-accent-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">All Clear</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">No anomalies detected for this campaign.</p>
              </div>
            </Card>
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Anomalies</h2>
              <div className="space-y-4">
                {activeAnomalies.map((anomaly) => {
                  const config = severityConfig[anomaly.severity];
                  return (
                    <Card key={anomaly.id}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-danger-50 dark:bg-danger-900/30 flex items-center justify-center shrink-0">
                            <Shield className="h-5 w-5 text-danger-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={config.variant}>{config.label}</Badge>
                              <span className="text-xs text-gray-500 capitalize">{anomaly.type.replace('_', ' ')}</span>
                              {anomaly.auto_paused && <Badge variant="yellow" size="sm">Auto-Paused</Badge>}
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{anomaly.campaign_name}</h3>
                            <p className="text-xs text-gray-500 mt-1">{anomaly.description}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-gray-500">
                                {anomaly.metric}: <span className="font-medium text-danger-600">{anomaly.current_value}</span> (threshold: {anomaly.threshold_value})
                              </span>
                              <span className="text-xs text-gray-400">Detected {formatRelativeTime(anomaly.detected_at)}</span>
                            </div>
                          </div>
                        </div>
                        {canResolve && (
                          <Button size="sm" variant="outline" onClick={() => handleResolve(anomaly.id)} loading={resolveMutation.isPending}>
                            Resolve
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
    </PageTransition>
  );
}
