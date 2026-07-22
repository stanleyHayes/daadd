import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [aggregation, setAggregation] = useState<'city' | 'country'>('city');
  const { data: heatmapData, isLoading, error } = useHeatmapData(campaignId || undefined);
  const { data: campaignsData } = useCampaigns();
  const campaigns = campaignsData?.data || [];

  const topRegions = heatmapData?.top_regions || [];

  return (
    <PageTransition>
    <div className="max-w-[1500px] mx-auto space-y-6">
      <PageHeader title={t('dashboard.heatmap.title')} subtitle={t('dashboard.heatmap.subtitle')} />

      {campaignId && heatmapData && !isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricsCard icon={<Eye className="h-5 w-5" />} label={t('dashboard.heatmap.totalViews')} value={formatNumber(heatmapData.total_views)} iconColor="text-primary-600" iconBg="bg-primary-50 dark:bg-primary-900/30" />
          <MetricsCard icon={<MapPin className="h-5 w-5" />} label={t('dashboard.heatmap.activeRegions')} value={String(heatmapData.active_regions ?? heatmapData.top_regions?.length ?? 0)} iconColor="text-secondary-600" iconBg="bg-secondary-50 dark:bg-secondary-900/30" />
          <MetricsCard icon={<TrendingUp className="h-5 w-5" />} label={t('dashboard.heatmap.avgCtr')} value={formatPercentage(heatmapData.avg_ctr)} iconColor="text-accent-600" iconBg="bg-accent-50 dark:bg-accent-900/30" />
        </div>
      )}

      <Card shape="soft" className="border-white/80 p-5 shadow-[0_14px_40px_rgba(7,20,49,0.055)] dark:border-slate-800">
      <div className="mb-4"><p className="text-sm font-bold text-primary-900 dark:text-white">Geographic scope</p><p className="text-xs text-text-muted">Select the campaign and how locations should be grouped.</p></div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
        <div className="flex-1">
          <Select
            label={t('dashboard.common.campaign')}
            placeholder={t('dashboard.common.selectCampaign')}
            options={campaigns.map((c) => ({ value: c.id, label: c.name }))}
            value={campaignId}
            onChange={setCampaignId}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">{t('dashboard.heatmap.aggregation')}</label>
          <div className="flex h-[42px] rounded-[14px] border border-gray-300 bg-white p-1 dark:border-slate-600 dark:bg-slate-800 overflow-hidden">
            <button
              className={cn('rounded-[10px] px-5 text-sm font-bold transition-colors', aggregation === 'city' ? 'bg-primary-900 text-white shadow-sm dark:bg-secondary-400 dark:text-primary-900' : 'text-gray-600 dark:text-slate-400')}
              onClick={() => setAggregation('city')}
            >
              {t('dashboard.heatmap.city')}
            </button>
            <button
              className={cn('rounded-[10px] px-5 text-sm font-bold transition-colors', aggregation === 'country' ? 'bg-primary-900 text-white shadow-sm dark:bg-secondary-400 dark:text-primary-900' : 'text-gray-600 dark:text-slate-400')}
              onClick={() => setAggregation('country')}
            >
              {t('dashboard.heatmap.country')}
            </button>
          </div>
        </div>
      </div>
      </Card>

      {!campaignId ? (
        <Card shape="soft" className="overflow-hidden border-white/80 p-0 shadow-[0_16px_50px_rgba(7,20,49,0.06)] dark:border-slate-800">
          <div className="grid min-h-[360px] lg:grid-cols-[0.72fr_1.28fr]">
            <div className="flex flex-col justify-center bg-[#07142f] p-8 text-white sm:p-10"><span className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-secondary-400 text-primary-900"><MapPin className="h-5 w-5" /></span><h3 className="text-2xl font-black tracking-[-0.035em]">{t('dashboard.common.selectCampaignTitle')}</h3><p className="mt-3 max-w-sm text-sm leading-6 text-white/55">{t('dashboard.heatmap.selectPrompt')}</p></div>
            <div className="relative flex items-center justify-center overflow-hidden bg-[#eef3f1] p-8 dark:bg-slate-900">
              <div className="absolute h-52 w-72 rounded-[45%] border-2 border-dashed border-primary-900/10 dark:border-white/10" /><div className="absolute h-32 w-48 -rotate-12 rounded-[45%] border border-primary-900/10 dark:border-white/10" />
              <div className="relative">{[[0,0,44],[-92,34,22],[95,52,30],[48,-58,18],[-72,-64,15]].map(([x,y,size], i) => <span key={i} className="absolute rounded-full bg-secondary-400/80 ring-8 ring-secondary-400/15" style={{ width: size, height: size, transform: `translate(${x - size / 2}px, ${y - size / 2}px)` }} />)}<Map className="h-20 w-20 text-primary-900/10 dark:text-white/10" /></div>
            </div>
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
            <p className="text-sm text-gray-500 dark:text-slate-400">{t('dashboard.heatmap.loadError')}</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <HeatmapView campaignId={campaignId} aggregation={aggregation} data={heatmapData?.points || []} />
          </div>

          <div className="space-y-4">
            <Card shape="soft">
              <CardHeader title={t('dashboard.heatmap.summary')} />
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(heatmapData?.total_views || 0)}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{t('dashboard.heatmap.totalViews')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-accent-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatPercentage(heatmapData?.avg_ctr || 0)}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{t('dashboard.heatmap.avgCtrByRegion')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary-50 dark:bg-secondary-900/30 flex items-center justify-center">
                    <Users className="h-5 w-5 text-secondary-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{heatmapData?.active_regions || 0}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{t('dashboard.heatmap.activeRegions')}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card shape="soft">
              <CardHeader title={t('dashboard.heatmap.topRegions')} />
              {topRegions.length === 0 ? (
                <EmptyState
                  icon={<Map className="h-10 w-10" />}
                  title={t('dashboard.heatmap.noRegionTitle')}
                  description={t('dashboard.heatmap.noRegionDesc')}
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
