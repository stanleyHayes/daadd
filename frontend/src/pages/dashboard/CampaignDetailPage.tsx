import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';

import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { MetricsCard } from '@/components/analytics/MetricsCard';
import { TimeSeriesChart } from '@/components/analytics/TimeSeriesChart';
import { AICreativeGenerator } from '@/components/ai/AICreativeGenerator';
import { ABTestManager } from '@/components/ab-testing/ABTestManager';
import { BudgetPacingIndicator } from '@/components/budget/BudgetPacingIndicator';
import { useCampaign } from '@/hooks/useCampaigns';
import { useDashboardMetrics, useTimeSeries } from '@/hooks/useAnalytics';
import { formatCurrency, formatNumber, formatPercentage, formatDate } from '@/lib/utils';
import { Eye, MousePointerClick, DollarSign, TrendingUp, Calendar, BarChart3, Map, Brain, Users, Sparkles, ArrowLeft, AlertTriangle } from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { Skeleton, SkeletonText, SkeletonMetric, SkeletonCard } from '@/components/ui/Skeleton';
import { hasPermission } from '@/lib/rbac';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';

const tabs = [
  { key: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
  { key: 'analytics', label: 'Analytics', icon: <TrendingUp className="h-4 w-4" /> },
  { key: 'creatives', label: 'Creatives', icon: <Sparkles className="h-4 w-4" /> },
  { key: 'heatmap', label: 'Heatmap', icon: <Map className="h-4 w-4" /> },
  { key: 'ai', label: 'AI Insights', icon: <Brain className="h-4 w-4" /> },
  { key: 'team', label: 'Team', icon: <Users className="h-4 w-4" /> },
];

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: campaign, isLoading, error } = useCampaign(id || '');
  const { data: metrics } = useDashboardMetrics(id);
  const { data: timeSeriesData, isLoading: tsLoading } = useTimeSeries(id);
  const [activeTab, setActiveTab] = useState('overview');
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role || 'end_user';
  const canToggleAI = hasPermission(userRole, 'CAMPAIGN_TOGGLE_AI');

  // Filter tabs based on role
  const visibleTabs = tabs.filter((tab) => {
    if (tab.key === 'ai' && !canToggleAI) return false;
    return true;
  });

  if (isLoading) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton variant="text" className="h-4 w-32" />
          <SkeletonCard>
            <div className="space-y-4">
              <Skeleton variant="text" className="h-8 w-1/3" />
              <Skeleton variant="text" className="h-4 w-48" />
              <Skeleton variant="text" className="h-3 w-full" />
            </div>
          </SkeletonCard>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonMetric key={i} />
            ))}
          </div>
          <SkeletonCard>
            <Skeleton variant="text" className="h-5 w-48 mb-4" />
            <Skeleton variant="card" className="h-48" />
          </SkeletonCard>
          <SkeletonCard>
            <Skeleton variant="text" className="h-5 w-40 mb-4" />
            <SkeletonText lines={3} />
          </SkeletonCard>
        </div>
      </PageTransition>
    );
  }

  if (error || !campaign) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto text-center py-16">
          <AlertTriangle className="h-10 w-10 text-danger-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Campaign Not Found</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">The campaign could not be loaded.</p>
          <Link to="/dashboard/campaigns" className="text-primary-600 hover:text-primary-700 text-sm font-medium">Back to campaigns</Link>
        </div>
      </PageTransition>
    );
  }

  const c = campaign;

  return (
    <PageTransition>
    <div className="max-w-7xl mx-auto space-y-6">
      <Link to="/dashboard/campaigns" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to campaigns
      </Link>
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{c.name}</h1>
              <StatusBadge status={c.status} />
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
              <Badge variant="blue">{c.industry}</Badge>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(c.start_date)} - {formatDate(c.end_date)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Budget Progress</span>
          </div>
          <BudgetPacingIndicator
            budgetSpent={c.budget_spent}
            budgetTotal={c.budget_total}
            showLabels={true}
          />
        </div>
      </Card>

      <Tabs tabs={visibleTabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {metrics ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricsCard icon={<Eye className="h-5 w-5" />} label="Impressions" value={formatNumber(metrics.totalImpressions)} change={metrics.impressionChange} iconColor="text-primary-600" iconBg="bg-primary-50 dark:bg-primary-900/30" />
              <MetricsCard icon={<MousePointerClick className="h-5 w-5" />} label="Clicks" value={formatNumber(metrics.totalClicks || 0)} change={metrics.clickChange || 0} iconColor="text-secondary-600" iconBg="bg-secondary-50 dark:bg-secondary-900/30" />
              <MetricsCard icon={<TrendingUp className="h-5 w-5" />} label="CTR" value={formatPercentage(metrics.avgCTR)} change={metrics.ctrChange} iconColor="text-accent-600" iconBg="bg-accent-50 dark:bg-accent-900/30" />
              <MetricsCard icon={<DollarSign className="h-5 w-5" />} label="CPC" value={formatCurrency(metrics.cpc || 0)} change={metrics.cpcChange || 0} iconColor="text-warning-600" iconBg="bg-warning-50 dark:bg-warning-900/30" />
            </div>
          ) : (
            <Card>
              <EmptyState
                icon={<BarChart3 className="h-12 w-12" />}
                title="No Metrics Yet"
                description="Campaign metrics will appear here once events are tracked and data is collected."
                size="sm"
              />
            </Card>
          )}

          <Card>
            <CardHeader title="Performance Over Time" />
            {tsLoading ? (
              <Skeleton variant="card" className="h-48" />
            ) : timeSeriesData && timeSeriesData.length > 0 ? (
              <TimeSeriesChart
                data={timeSeriesData}
                lines={[
                  { dataKey: 'impressions', color: '#2563EB', name: 'Impressions' },
                  { dataKey: 'clicks', color: '#7C3AED', name: 'Clicks' },
                  { dataKey: 'conversions', color: '#10B981', name: 'Conversions' },
                ]}
                xKey="date"
                height={280}
              />
            ) : (
              <EmptyState
                icon={<TrendingUp className="h-12 w-12" />}
                title="No Performance Data"
                description="Performance trends will display here once your campaign starts receiving impressions and clicks."
                size="md"
              />
            )}
          </Card>

          <Card>
            <CardHeader title="Campaign Info" />
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400 uppercase font-medium">Description</p>
                <p className="text-sm text-gray-900 dark:text-slate-200 mt-1">{c.description || 'No description'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400 uppercase font-medium">AI Optimization</p>
                <p className="text-sm text-gray-900 dark:text-slate-200 mt-1">{c.ai_optimization_enabled ? 'Enabled' : 'Disabled'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400 uppercase font-medium">Reward Value</p>
                <p className="text-sm text-gray-900 dark:text-slate-200 mt-1">{formatCurrency(c.reward_value)} per view</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'analytics' && (
        <Card>
          <CardHeader title="Detailed Analytics" subtitle="View comprehensive analytics on the Analytics page" />
          <p className="text-gray-500 dark:text-slate-400 text-sm">Detailed campaign analytics are available on the dedicated Analytics page with advanced filtering and export options.</p>
          <Link to="/dashboard/analytics" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium mt-4">
            Go to Analytics <TrendingUp className="h-3.5 w-3.5" />
          </Link>
        </Card>
      )}

      {activeTab === 'creatives' && (
        <div className="space-y-6">
          <AICreativeGenerator
            campaignId={c.id}
            productName={c.name}
            onSave={(variations) => {
              toast.success(`${variations.length} creatives generated! You can now launch the campaign or refine further.`);
            }}
          />
          <ABTestManager campaignId={c.id} creatives={c.creatives || []} />
        </div>
      )}

      {activeTab === 'heatmap' && (
        <Card>
          <CardHeader title="Geographic Heatmap" subtitle="View engagement heatmap on the Heatmaps page" />
          <p className="text-gray-500 dark:text-slate-400 text-sm">Geographic engagement data is available on the dedicated Heatmaps page.</p>
          <Link to="/dashboard/heatmaps" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium mt-4">
            Go to Heatmaps <Map className="h-3.5 w-3.5" />
          </Link>
        </Card>
      )}

      {activeTab === 'ai' && (
        <Card>
          <CardHeader title="AI Optimization" subtitle="View AI recommendations on the AI Optimization page" />
          <p className="text-gray-500 dark:text-slate-400 text-sm">AI-powered recommendations and audit logs are available on the dedicated AI Optimization page.</p>
          <Link to="/dashboard/ai-optimization" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium mt-4">
            Go to AI Optimization <Brain className="h-3.5 w-3.5" />
          </Link>
        </Card>
      )}

      {activeTab === 'team' && (
        <Card>
          <CardHeader title="Team" subtitle="Manage team on the Team page" />
          <p className="text-gray-500 dark:text-slate-400 text-sm">Team management features are available on the dedicated Team page.</p>
          <Link to="/dashboard/team" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium mt-4">
            Go to Team <Users className="h-3.5 w-3.5" />
          </Link>
        </Card>
      )}
    </div>
    </PageTransition>
  );
}
