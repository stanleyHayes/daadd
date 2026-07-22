import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { MetricsCard } from '@/components/analytics/MetricsCard';
import { TimeSeriesChart } from '@/components/analytics/TimeSeriesChart';
import { FunnelChart } from '@/components/analytics/FunnelChart';
import { DeviceBreakdown } from '@/components/analytics/DeviceBreakdown';
import { useDashboardMetrics, useTimeSeries, useFunnelData, useDeviceBreakdown, useExportCSV, useExportPDF } from '@/hooks/useAnalytics';
import { useCampaigns } from '@/hooks/useCampaigns';
import { formatNumber, formatPercentage, formatCurrency } from '@/lib/utils';
import {
  Eye, MousePointerClick, TrendingUp, ArrowDownRight, Target, DollarSign, CreditCard,
  Download, FileText, AlertTriangle,
} from 'lucide-react';
import { subDays } from 'date-fns';
import { PageTransition } from '@/components/ui/PageTransition';
import { Skeleton, SkeletonMetric, SkeletonCard } from '@/components/ui/Skeleton';
import { hasPermission } from '@/lib/rbac';
import { useAuthStore } from '@/stores/auth.store';
import type { FilterOptions } from '@/types';

export function AnalyticsPage() {
  const [campaignId, setCampaignId] = useState('');
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState({ start: subDays(new Date(), 30), end: new Date() });
  const exportCSV = useExportCSV();
  const exportPDF = useExportPDF();
  const authUser = useAuthStore((s) => s.user);
  const canExport = hasPermission(authUser?.role || 'end_user', 'EXPORT_REPORTS');

  const { data: campaignsData } = useCampaigns();
  const campaigns = campaignsData?.data || [];

  const dateFilters: FilterOptions = {
    start_date: dateRange.start.toISOString(),
    end_date: dateRange.end.toISOString(),
  };

  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useDashboardMetrics(campaignId || undefined, dateFilters);
  const { data: timeSeriesData, isLoading: timeSeriesLoading } = useTimeSeries(campaignId || undefined, dateFilters);
  const { data: funnelData, isLoading: funnelLoading } = useFunnelData(campaignId || undefined);
  const { data: deviceData, isLoading: deviceLoading } = useDeviceBreakdown(campaignId || undefined);

  return (
    <PageTransition>
    <div className="max-w-[1500px] mx-auto space-y-6">
      <PageHeader
        title={t('dashboard.analytics.title')}
        subtitle={t('dashboard.analytics.subtitle')}
        action={
          canExport && campaignId && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" icon={<FileText className="h-4 w-4" />} onClick={() => exportPDF.mutate({ campaignId, filters: dateFilters })} loading={exportPDF.isPending}>
                {t('dashboard.common.exportPdf')}
              </Button>
              <Button variant="outline" size="sm" icon={<Download className="h-4 w-4" />} onClick={() => exportCSV.mutate({ campaignId, filters: dateFilters })} loading={exportCSV.isPending}>
                {t('dashboard.common.exportCsv')}
              </Button>
            </div>
          )
        }
      />

      <Card shape="soft" className="border-white/80 p-5 shadow-[0_14px_40px_rgba(7,20,49,0.055)] dark:border-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <div><p className="text-sm font-bold text-primary-900 dark:text-white">Analysis scope</p><p className="text-xs text-text-muted">Choose the campaign and reporting window you want to investigate.</p></div>
        <span className="hidden rounded-full bg-secondary-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-secondary-800 dark:bg-secondary-400/10 dark:text-secondary-300 sm:block">Live reporting</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label={t('dashboard.common.campaign')}
          placeholder={t('dashboard.common.selectCampaign')}
          options={campaigns.map((c) => ({ value: c.id, label: c.name }))}
          value={campaignId}
          onChange={setCampaignId}
        />
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>
      </Card>

      {!campaignId ? (
        <Card shape="soft" className="overflow-hidden border-white/80 p-0 shadow-[0_16px_50px_rgba(7,20,49,0.06)] dark:border-slate-800">
          <div className="grid min-h-[360px] lg:grid-cols-[0.72fr_1.28fr]">
            <div className="flex flex-col justify-center bg-[#07142f] p-8 text-white sm:p-10">
              <span className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-secondary-400 text-primary-900"><Eye className="h-5 w-5" /></span>
              <h3 className="text-2xl font-black tracking-[-0.035em]">{t('dashboard.common.selectCampaignTitle')}</h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">{t('dashboard.analytics.selectPrompt')}</p>
            </div>
            <div className="relative flex items-center justify-center overflow-hidden bg-white p-8 dark:bg-slate-900">
              <div className="marketing-grid absolute inset-0 opacity-40 dark:opacity-10" />
              <div className="relative grid w-full max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
                {[['Reach', '—'], ['Engagement', '—'], ['Conversion', '—'], ['Cost', '—'], ['Devices', '—'], ['Funnel', '—']].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-800"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p><p className="mt-5 text-2xl font-black text-primary-900 dark:text-white">{value}</p></div>)}
              </div>
            </div>
          </div>
        </Card>
      ) : metricsLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonMetric key={i} />
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonMetric key={i} />
            ))}
          </div>
          <SkeletonCard>
            <Skeleton variant="text" className="h-5 w-48 mb-4" />
            <Skeleton variant="card" className="h-80" />
          </SkeletonCard>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonCard>
              <Skeleton variant="text" className="h-5 w-40 mb-4" />
              <Skeleton variant="card" className="h-56" />
            </SkeletonCard>
            <SkeletonCard>
              <Skeleton variant="text" className="h-5 w-40 mb-4" />
              <Skeleton variant="card" className="h-56" />
            </SkeletonCard>
          </div>
        </div>
      ) : metricsError ? (
        <Card>
          <div className="text-center py-12">
            <AlertTriangle className="h-8 w-8 text-danger-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-slate-400">{t('dashboard.analytics.loadError')}</p>
          </div>
        </Card>
      ) : (
        <>
          {metrics && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricsCard icon={<Eye className="h-4 w-4" />} label={t('dashboard.metrics.impressions')} value={formatNumber(metrics.totalImpressions)} change={metrics.impressionChange} iconColor="text-primary-600" iconBg="bg-primary-50 dark:bg-primary-900/30" />
                <MetricsCard icon={<MousePointerClick className="h-4 w-4" />} label={t('dashboard.metrics.clicks')} value={formatNumber(metrics.totalClicks || 0)} change={metrics.clickChange || 0} iconColor="text-secondary-600" iconBg="bg-secondary-50 dark:bg-secondary-900/30" />
                <MetricsCard icon={<TrendingUp className="h-4 w-4" />} label={t('dashboard.metrics.ctr')} value={formatPercentage(metrics.avgCTR)} change={metrics.ctrChange} iconColor="text-accent-600" iconBg="bg-accent-50 dark:bg-accent-900/30" />
                <MetricsCard icon={<ArrowDownRight className="h-4 w-4" />} label={t('dashboard.metrics.bounceRate')} value={formatPercentage(metrics.bounceRate || 0)} change={metrics.bounceRateChange || 0} iconColor="text-danger-600" iconBg="bg-danger-50 dark:bg-danger-900/30" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <MetricsCard icon={<Target className="h-4 w-4" />} label={t('dashboard.metrics.convRate')} value={formatPercentage(metrics.conversionRate || 0)} change={metrics.conversionRateChange || 0} iconColor="text-primary-600" iconBg="bg-primary-50 dark:bg-primary-900/30" />
                <MetricsCard icon={<DollarSign className="h-4 w-4" />} label={t('dashboard.metrics.cpc')} value={formatCurrency(metrics.cpc || 0)} change={metrics.cpcChange || 0} iconColor="text-warning-600" iconBg="bg-warning-50 dark:bg-warning-900/30" />
                <MetricsCard icon={<CreditCard className="h-4 w-4" />} label={t('dashboard.metrics.cpa')} value={formatCurrency(metrics.cpa || 0)} change={metrics.cpaChange || 0} iconColor="text-accent-600" iconBg="bg-accent-50 dark:bg-accent-900/30" />
              </div>
            </>
          )}

          <Card shape="soft">
            <CardHeader title={t('dashboard.analytics.seriesTitle')} subtitle={t('dashboard.analytics.seriesSubtitle')} />
            {timeSeriesLoading ? (
              <Skeleton variant="card" className="h-80" />
            ) : timeSeriesData && timeSeriesData.length > 0 ? (
              <TimeSeriesChart
                data={timeSeriesData}
                lines={[
                  { dataKey: 'impressions', color: '#2563EB', name: t('dashboard.metrics.impressions') },
                  { dataKey: 'clicks', color: '#7C3AED', name: t('dashboard.metrics.clicks') },
                  { dataKey: 'conversions', color: '#10B981', name: t('dashboard.metrics.conversions') },
                ]}
                xKey="date"
                height={320}
              />
            ) : (
              <EmptyState
                icon={<TrendingUp className="h-12 w-12" />}
                title={t('dashboard.analytics.noSeriesTitle')}
                description={t('dashboard.analytics.noSeriesDesc')}
                size="md"
              />
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card shape="soft">
              <CardHeader title={t('dashboard.analytics.funnelTitle')} />
              {funnelLoading ? (
                <Skeleton variant="card" className="h-56" />
              ) : funnelData && funnelData.length > 0 ? (
                <FunnelChart steps={funnelData} />
              ) : (
                <EmptyState
                  icon={<Eye className="h-12 w-12" />}
                  title={t('dashboard.analytics.noFunnelTitle')}
                  description={t('dashboard.analytics.noFunnelDesc')}
                  size="md"
                />
              )}
            </Card>

            <Card shape="soft">
              <CardHeader title={t('dashboard.analytics.devicesTitle')} />
              {deviceLoading ? (
                <Skeleton variant="card" className="h-56" />
              ) : deviceData && deviceData.length > 0 ? (
                <DeviceBreakdown data={deviceData} />
              ) : (
                <EmptyState
                  icon={<Target className="h-12 w-12" />}
                  title={t('dashboard.analytics.noDevicesTitle')}
                  description={t('dashboard.analytics.noDevicesDesc')}
                  size="md"
                />
              )}
            </Card>
          </div>
        </>
      )}
    </div>
    </PageTransition>
  );
}
