import React, { useState } from 'react';
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
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Deep dive into your advertising performance"
        action={
          canExport && campaignId && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" icon={<FileText className="h-4 w-4" />} onClick={() => exportPDF.mutate({ campaignId, filters: dateFilters })} loading={exportPDF.isPending}>
                Export PDF
              </Button>
              <Button variant="outline" size="sm" icon={<Download className="h-4 w-4" />} onClick={() => exportCSV.mutate({ campaignId, filters: dateFilters })} loading={exportCSV.isPending}>
                Export CSV
              </Button>
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label="Campaign"
          placeholder="Select a campaign"
          options={campaigns.map((c) => ({ value: c.id, label: c.name }))}
          value={campaignId}
          onChange={setCampaignId}
        />
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {!campaignId ? (
        <Card>
          <div className="text-center py-16">
            <Eye className="h-10 w-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Select a Campaign</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">Choose a campaign above to view its analytics.</p>
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
            <p className="text-sm text-gray-500 dark:text-slate-400">Failed to load analytics data. Please try again later.</p>
          </div>
        </Card>
      ) : (
        <>
          {metrics && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricsCard icon={<Eye className="h-4 w-4" />} label="Impressions" value={formatNumber(metrics.totalImpressions)} change={metrics.impressionChange} iconColor="text-primary-600" iconBg="bg-primary-50 dark:bg-primary-900/30" />
                <MetricsCard icon={<MousePointerClick className="h-4 w-4" />} label="Clicks" value={formatNumber(metrics.totalClicks || 0)} change={metrics.clickChange || 0} iconColor="text-secondary-600" iconBg="bg-secondary-50 dark:bg-secondary-900/30" />
                <MetricsCard icon={<TrendingUp className="h-4 w-4" />} label="CTR" value={formatPercentage(metrics.avgCTR)} change={metrics.ctrChange} iconColor="text-accent-600" iconBg="bg-accent-50 dark:bg-accent-900/30" />
                <MetricsCard icon={<ArrowDownRight className="h-4 w-4" />} label="Bounce Rate" value={formatPercentage(metrics.bounceRate || 0)} change={metrics.bounceRateChange || 0} iconColor="text-danger-600" iconBg="bg-danger-50 dark:bg-danger-900/30" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <MetricsCard icon={<Target className="h-4 w-4" />} label="Conv. Rate" value={formatPercentage(metrics.conversionRate || 0)} change={metrics.conversionRateChange || 0} iconColor="text-primary-600" iconBg="bg-primary-50 dark:bg-primary-900/30" />
                <MetricsCard icon={<DollarSign className="h-4 w-4" />} label="CPC" value={formatCurrency(metrics.cpc || 0)} change={metrics.cpcChange || 0} iconColor="text-warning-600" iconBg="bg-warning-50 dark:bg-warning-900/30" />
                <MetricsCard icon={<CreditCard className="h-4 w-4" />} label="CPA" value={formatCurrency(metrics.cpa || 0)} change={metrics.cpaChange || 0} iconColor="text-accent-600" iconBg="bg-accent-50 dark:bg-accent-900/30" />
              </div>
            </>
          )}

          <Card>
            <CardHeader title="Performance Over Time" subtitle="Impressions, clicks, and conversions" />
            {timeSeriesLoading ? (
              <Skeleton variant="card" className="h-80" />
            ) : timeSeriesData && timeSeriesData.length > 0 ? (
              <TimeSeriesChart
                data={timeSeriesData}
                lines={[
                  { dataKey: 'impressions', color: '#2563EB', name: 'Impressions' },
                  { dataKey: 'clicks', color: '#7C3AED', name: 'Clicks' },
                  { dataKey: 'conversions', color: '#10B981', name: 'Conversions' },
                ]}
                xKey="date"
                height={320}
              />
            ) : (
              <EmptyState
                icon={<TrendingUp className="h-12 w-12" />}
                title="No Time Series Data"
                description="Performance trends will appear here as your campaigns run and collect events over time."
                size="md"
              />
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader title="Conversion Funnel" />
              {funnelLoading ? (
                <Skeleton variant="card" className="h-56" />
              ) : funnelData && funnelData.length > 0 ? (
                <FunnelChart steps={funnelData} />
              ) : (
                <EmptyState
                  icon={<Eye className="h-12 w-12" />}
                  title="No Funnel Data"
                  description="Your conversion funnel will display here once campaigns have collected conversion data."
                  size="md"
                />
              )}
            </Card>

            <Card>
              <CardHeader title="Device Breakdown" />
              {deviceLoading ? (
                <Skeleton variant="card" className="h-56" />
              ) : deviceData && deviceData.length > 0 ? (
                <DeviceBreakdown data={deviceData} />
              ) : (
                <EmptyState
                  icon={<Target className="h-12 w-12" />}
                  title="No Device Data"
                  description="Device breakdown analytics will appear here once you have campaign impressions from different devices."
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
