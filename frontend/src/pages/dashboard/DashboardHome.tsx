import React from 'react';
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
  const { data: campaignsData, isLoading: campaignsLoading, error: campaignsError } = useCampaigns({ limit: 5 });
  const recentCampaigns = campaignsData?.data || [];

  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useAggregateDashboard();
  const firstCampaignId = recentCampaigns.length > 0 ? recentCampaigns[0].id : undefined;
  const { data: timeSeriesData, isLoading: timeSeriesLoading } = useTimeSeries(firstCampaignId);

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Dashboard"
          subtitle="Overview of your advertising performance"
          action={
            <Link to="/dashboard/campaigns/new">
              <Button icon={<Plus className="h-4 w-4" />}>New Campaign</Button>
            </Link>
          }
        />

        <AdvertiserOnboarding />

        {metricsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonMetric key={i} />
            ))}
          </div>
        ) : metricsError ? (
          <Card>
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 text-danger-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-slate-400">Failed to load dashboard metrics. Please try again later.</p>
            </div>
          </Card>
        ) : metrics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Megaphone className="h-5 w-5" />, label: 'Impressions', value: formatNumber(metrics.totalImpressions), iconColor: 'text-primary-600', iconBg: 'bg-primary-50 dark:bg-primary-900/30' },
              { icon: <Eye className="h-5 w-5" />, label: 'Clicks', value: formatNumber(metrics.totalClicks ?? 0), iconColor: 'text-secondary-600', iconBg: 'bg-secondary-50 dark:bg-secondary-900/30' },
              { icon: <MousePointerClick className="h-5 w-5" />, label: 'CTR', value: formatPercentage(metrics.avgCTR), iconColor: 'text-accent-600', iconBg: 'bg-accent-50 dark:bg-accent-900/30' },
              { icon: <DollarSign className="h-5 w-5" />, label: 'Total Spend', value: formatCurrency(metrics.totalSpend), iconColor: 'text-warning-600', iconBg: 'bg-warning-50 dark:bg-warning-900/30' },
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
              title="No Campaigns Yet"
              description="Start by creating your first campaign to see performance metrics and insights on this dashboard."
              actionLabel="Create Campaign"
              onAction={() => window.location.href = '/dashboard/campaigns/new'}
              size="md"
            />
          </Card>
        )}

        <Card>
          <CardHeader title="Performance (Last 30 Days)" subtitle="Impressions, clicks, and conversions over time" />
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
              description="Performance data will appear here once your campaigns start running and collecting events."
              size="md"
            />
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card padding={false}>
              <div className="px-6 pt-6">
                <CardHeader
                  title="Recent Campaigns"
                  action={
                    <Link to="/dashboard/campaigns" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                      View all <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  }
                />
              </div>
              {campaignsLoading ? (
                <SkeletonTable rows={5} columns={5} />
              ) : campaignsError ? (
                <div className="text-center py-8 px-6">
                  <AlertTriangle className="h-6 w-6 text-danger-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-slate-400">Failed to load campaigns.</p>
                </div>
              ) : recentCampaigns.length === 0 ? (
                <EmptyState
                  size="sm"
                  variant="plain"
                  icon={<Megaphone />}
                  title="No campaigns yet"
                  description="Create your first campaign to get started."
                  actionLabel="New Campaign"
                  onAction={() => (window.location.href = '/dashboard/campaigns/new')}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Campaign</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Industry</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Budget</th>
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
            <Card>
              <CardHeader title="Quick Actions" />
              <div className="space-y-3">
                {[
                  { to: '/dashboard/campaigns/new', icon: Plus, iconBg: 'bg-primary-50 dark:bg-primary-900/30', iconColor: 'text-primary-600', title: 'Create Campaign', desc: 'Launch a new ad campaign' },
                  { to: '/dashboard/analytics', icon: BarChart3, iconBg: 'bg-accent-50 dark:bg-accent-900/30', iconColor: 'text-accent-600', title: 'View Analytics', desc: 'Deep dive into performance' },
                  { to: '/dashboard/anomalies', icon: AlertTriangle, iconBg: 'bg-danger-50 dark:bg-danger-900/30', iconColor: 'text-danger-600', title: 'Check Anomalies', desc: 'Monitor campaign health' },
                  { to: '/dashboard/ai-optimization', icon: Brain, iconBg: 'bg-secondary-50 dark:bg-secondary-900/30', iconColor: 'text-secondary-600', title: 'AI Insights', desc: 'Review AI recommendations' },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.to} to={action.to} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      <div className={`w-10 h-10 rounded-lg ${action.iconBg} flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 ${action.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{action.title}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{action.desc}</p>
                      </div>
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
