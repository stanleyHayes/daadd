import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardHeader } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { MetricsCard } from '@/components/analytics/MetricsCard';
import { TimeSeriesChart } from '@/components/analytics/TimeSeriesChart';
import { PageTransition } from '@/components/ui/PageTransition';
import { AdvertiserOnboarding } from '@/components/onboarding/AdvertiserOnboarding';
import {
  Megaphone, Eye, MousePointerClick, DollarSign, Plus, BarChart3, Brain, ArrowRight, AlertTriangle, TrendingUp,
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import { useCampaigns } from '@/hooks/useCampaigns';
import { Skeleton, SkeletonMetric, SkeletonTable } from '@/components/ui/Skeleton';
import { useAggregateDashboard, useTimeSeries } from '@/hooks/useAnalytics';

export function DashboardHome() {
  const { t } = useTranslation();
  const { data: campaignsData, isLoading: campaignsLoading, error: campaignsError } = useCampaigns({ limit: 5 });
  const recentCampaigns = campaignsData?.data || [];

  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useAggregateDashboard();
  const firstCampaignId = recentCampaigns.length > 0 ? recentCampaigns[0].id : undefined;
  const { data: timeSeriesData, isLoading: timeSeriesLoading } = useTimeSeries(firstCampaignId);

  return (
    <PageTransition>
      <div className="relative mx-auto max-w-[1500px] space-y-6">
        <PageHeader
          title={t('dashboard.home.title')}
          subtitle={t('dashboard.home.subtitle')}
          action={
            <Link to="/dashboard/campaigns/new">
              <Button shape="pill" className="bg-secondary-400! px-5! text-primary-900! hover:bg-secondary-300!" icon={<Plus className="h-4 w-4" />}>{t('dashboard.home.newCampaign')}</Button>
            </Link>
          }
        />

        <AdvertiserOnboarding />

        {metricsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonMetric key={i} />
            ))}
          </div>
        ) : metricsError ? (
          <Card>
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 text-danger-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-slate-400">{t('dashboard.home.loadError')}</p>
            </div>
          </Card>
        ) : metrics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { icon: <Megaphone className="h-5 w-5" />, label: t('dashboard.metrics.impressions'), value: formatNumber(metrics.totalImpressions), iconColor: 'text-primary-600', iconBg: 'bg-primary-50 dark:bg-primary-900/30' },
              { icon: <Eye className="h-5 w-5" />, label: t('dashboard.metrics.clicks'), value: formatNumber(metrics.totalClicks ?? 0), iconColor: 'text-secondary-600', iconBg: 'bg-secondary-50 dark:bg-secondary-900/30' },
              { icon: <MousePointerClick className="h-5 w-5" />, label: t('dashboard.metrics.ctr'), value: formatPercentage(metrics.avgCTR), iconColor: 'text-accent-600', iconBg: 'bg-accent-50 dark:bg-accent-900/30' },
              { icon: <DollarSign className="h-5 w-5" />, label: t('dashboard.metrics.totalSpend'), value: formatCurrency(metrics.totalSpend), iconColor: 'text-warning-600', iconBg: 'bg-warning-50 dark:bg-warning-900/30' },
            ].map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
              >
                <MetricsCard {...kpi} />
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={<Megaphone className="h-12 w-12" />}
              title={t('dashboard.home.emptyTitle')}
              description={t('dashboard.home.emptyDesc')}
              actionLabel={t('dashboard.home.actions.createCampaign')}
              onAction={() => window.location.href = '/dashboard/campaigns/new'}
              size="md"
            />
          </Card>
        )}

        <Card shape="soft" className="border-white/80 p-6 shadow-[0_14px_40px_rgba(7,20,49,0.06)] dark:border-slate-800">
          <CardHeader title={t('dashboard.home.chartTitle')} subtitle={t('dashboard.home.chartSubtitle')} />
          {timeSeriesLoading ? (
            <Skeleton variant="card" className="h-80" />
          ) : timeSeriesData && timeSeriesData.length > 0 ? (
            <TimeSeriesChart
              data={timeSeriesData}
              lines={[
                { dataKey: 'impressions', color: '#2563EB', name: t('dashboard.metrics.impressions') },
                { dataKey: 'clicks', color: '#7C3AED', name: t('dashboard.metrics.clicks') },
                { dataKey: 'conversions', color: '#10B981', name: 'Conversions' },
              ]}
              xKey="date"
              height={320}
            />
          ) : (
            <EmptyState
              icon={<TrendingUp className="h-12 w-12" />}
              title={t('dashboard.home.noSeriesTitle')}
              description={t('dashboard.home.noSeriesDesc')}
              size="md"
            />
          )}
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <Card padding={false} shape="soft" className="overflow-hidden border-white/80 shadow-[0_14px_40px_rgba(7,20,49,0.06)] dark:border-slate-800">
              <div className="px-6 pt-6">
                <CardHeader
                  title={t('dashboard.home.recentTitle')}
                  action={
                    <Link to="/dashboard/campaigns" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                      {t('dashboard.common.viewAll')} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  }
                />
              </div>
              {campaignsLoading ? (
                <SkeletonTable rows={5} columns={5} />
              ) : campaignsError ? (
                <div className="text-center py-8 px-6">
                  <AlertTriangle className="h-6 w-6 text-danger-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-slate-400">{t('dashboard.home.campaignsError')}</p>
                </div>
              ) : recentCampaigns.length === 0 ? (
                <EmptyState
                  size="sm"
                  variant="plain"
                  icon={<Megaphone />}
                  title={t('dashboard.home.recentEmptyTitle')}
                  description={t('dashboard.home.recentEmptyDesc')}
                  actionLabel={t('dashboard.home.newCampaign')}
                  onAction={() => (window.location.href = '/dashboard/campaigns/new')}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">{t('dashboard.common.campaign')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">{t('dashboard.common.industry')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">{t('dashboard.common.status')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">{t('dashboard.common.budget')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">CTR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                      {recentCampaigns.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            <Link to={`/dashboard/campaigns/${c.id}`} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">{c.name}</Link>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">{c.industry}</td>
                          <td className="px-6 py-4"><StatusBadge status={c.status} /></td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-slate-200">
                            {formatCurrency(c.budget_spent)} / {formatCurrency(c.budget_total)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-slate-200">{(c.ctr ?? 0) > 0 ? formatPercentage(c.ctr!) : '--'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            <Card shape="soft" className="border-white/80 shadow-[0_14px_40px_rgba(7,20,49,0.06)] dark:border-slate-800">
              <CardHeader title={t('dashboard.home.quickActions')} />
              <div className="space-y-3">
                {[
                  { to: '/dashboard/campaigns/new', icon: Plus, iconBg: 'bg-primary-50 dark:bg-primary-900/30', iconColor: 'text-primary-600', title: t('dashboard.home.actions.createCampaign'), desc: t('dashboard.home.actions.createCampaignDesc') },
                  { to: '/dashboard/analytics', icon: BarChart3, iconBg: 'bg-accent-50 dark:bg-accent-900/30', iconColor: 'text-accent-600', title: t('dashboard.home.actions.viewAnalytics'), desc: t('dashboard.home.actions.viewAnalyticsDesc') },
                  { to: '/dashboard/anomalies', icon: AlertTriangle, iconBg: 'bg-danger-50 dark:bg-danger-900/30', iconColor: 'text-danger-600', title: t('dashboard.home.actions.checkAnomalies'), desc: t('dashboard.home.actions.checkAnomaliesDesc') },
                  { to: '/dashboard/ai-optimization', icon: Brain, iconBg: 'bg-secondary-50 dark:bg-secondary-900/30', iconColor: 'text-secondary-600', title: t('dashboard.home.actions.aiInsights'), desc: t('dashboard.home.actions.aiInsightsDesc') },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.to} to={action.to} className="group flex items-center gap-3 rounded-2xl border border-gray-200 p-3.5 transition-all hover:-translate-y-0.5 hover:border-secondary-400 hover:bg-secondary-50/40 dark:border-slate-700 dark:hover:bg-slate-800">
                      <div className={`w-10 h-10 rounded-[13px] ${action.iconBg} flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 ${action.iconColor}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{action.title}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{action.desc}</p>
                      </div><ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-primary-900 dark:group-hover:text-secondary-300" />
                    </Link>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
