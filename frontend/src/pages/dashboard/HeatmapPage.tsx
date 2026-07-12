import React, { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { MetricsCard } from '@/components/analytics/MetricsCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { HeatmapView } from '@/components/heatmap/HeatmapView';
import { Select } from '@/components/ui/Select';
import { useHeatmapData } from '@/hooks/useHeatmap';
import { useCampaigns } from '@/hooks/useCampaigns';
import { formatNumber, formatPercentage } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { MapPin, Eye, TrendingUp, Users, AlertTriangle, Map } from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { Skeleton, SkeletonMap, SkeletonCard, SkeletonMetric, SkeletonList } from '@/components/ui/Skeleton';

export function HeatmapPage() {
  const [campaignId, setCampaignId] = useState('');
  const [aggregation, setAggregation] = useState<'city' | 'country'>('city');
  const { data: heatmapData, isLoading, error } = useHeatmapData(campaignId || undefined);
  const { data: campaignsData } = useCampaigns();
  const campaigns = campaignsData?.data || [];

  const topRegions = heatmapData?.top_regions || [];

  return (
    <PageTransition>
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader title="Heatmaps" subtitle="Geographic engagement visualization" />

      {campaignId && heatmapData && !isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricsCard icon={<Eye className="h-5 w-5" />} label="Total Views" value={formatNumber(heatmapData.total_views)} iconColor="text-primary-600" iconBg="bg-primary-50 dark:bg-primary-900/30" />
          <MetricsCard icon={<MapPin className="h-5 w-5" />} label="Active Regions" value={String(heatmapData.active_regions ?? heatmapData.top_regions?.length ?? 0)} iconColor="text-secondary-600" iconBg="bg-secondary-50 dark:bg-secondary-900/30" />
          <MetricsCard icon={<TrendingUp className="h-5 w-5" />} label="Avg CTR" value={formatPercentage(heatmapData.avg_ctr)} iconColor="text-accent-600" iconBg="bg-accent-50 dark:bg-accent-900/30" />
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
          <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Aggregation</label>
          <div className="flex rounded-lg border border-gray-300 dark:border-slate-600 overflow-hidden">
            <button
              className={cn('px-4 py-2 text-sm font-medium transition-colors', aggregation === 'city' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700')}
              onClick={() => setAggregation('city')}
            >
              City
            </button>
            <button
              className={cn('px-4 py-2 text-sm font-medium transition-colors', aggregation === 'country' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700')}
              onClick={() => setAggregation('country')}
            >
              Country
            </button>
          </div>
        </div>
      </div>

      {!campaignId ? (
        <Card>
          <div className="text-center py-16">
            <MapPin className="h-10 w-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Select a Campaign</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">Choose a campaign above to view its geographic heatmap.</p>
          </div>
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SkeletonMap />
          </div>
          <div className="space-y-4">
            <SkeletonCard>
              <Skeleton variant="text" className="h-5 w-32 mb-4" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonMetric key={i} />
                ))}
              </div>
            </SkeletonCard>
            <SkeletonCard>
              <Skeleton variant="text" className="h-5 w-32 mb-4" />
              <SkeletonList items={4} />
            </SkeletonCard>
          </div>
        </div>
      ) : error ? (
        <Card>
          <div className="text-center py-12">
            <AlertTriangle className="h-8 w-8 text-danger-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-slate-400">Failed to load heatmap data. Please try again later.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <HeatmapView campaignId={campaignId} aggregation={aggregation} data={heatmapData?.points || []} />
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader title="Summary" />
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(heatmapData?.total_views || 0)}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Total Views</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-accent-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatPercentage(heatmapData?.avg_ctr || 0)}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Avg CTR by Region</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary-50 dark:bg-secondary-900/30 flex items-center justify-center">
                    <Users className="h-5 w-5 text-secondary-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{heatmapData?.active_regions || 0}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Active Regions</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Top Regions" />
              {topRegions.length === 0 ? (
                <EmptyState
                  icon={<Map className="h-10 w-10" />}
                  title="No Region Data"
                  description="Geographic data will appear once your campaign reaches 100+ impressions across regions."
                  size="sm"
                />
              ) : (
                <div className="space-y-3">
                  {topRegions.map((region, i) => (
                    <div key={region.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                      <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{region.name}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{region.demographic}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{formatNumber(region.views)}</p>
                        <p className="text-xs text-accent-600">{formatPercentage(region.ctr)} CTR</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
    </PageTransition>
  );
}
