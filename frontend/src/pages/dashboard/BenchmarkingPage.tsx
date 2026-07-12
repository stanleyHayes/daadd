import React, { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { useBenchmarkData } from '@/hooks/useBenchmarks';
import { Select } from '@/components/ui/Select';
import { useCampaigns } from '@/hooks/useCampaigns';
import { formatPercentage, formatCurrency, cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, AlertCircle, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { PageTransition } from '@/components/ui/PageTransition';
import { useThemeStore } from '@/stores/theme.store';
import { SkeletonMetric, SkeletonCard, Skeleton } from '@/components/ui/Skeleton';

export function BenchmarkingPage() {
  const [campaignId, setCampaignId] = useState('');
  const { data: benchmark, isLoading, error } = useBenchmarkData(campaignId || undefined);
  const { data: campaignsData } = useCampaigns();
  const campaigns = campaignsData?.data || [];
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const comparisons = benchmark?.comparisons || [];
  const advertiserCount = benchmark?.advertiser_count || 0;

  return (
    <PageTransition>
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Benchmarking</h1>
        <p className="page-subtitle">Compare your performance against industry averages</p>
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
            <TrendingUp className="h-10 w-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Select a Campaign</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">Choose a campaign above to view its benchmarks.</p>
          </div>
        </Card>
      ) : isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonMetric key={i} />
            ))}
          </div>
          <SkeletonCard>
            <Skeleton variant="text" className="h-5 w-56 mb-4" />
            <Skeleton variant="card" className="h-80" />
          </SkeletonCard>
        </div>
      ) : error ? (
        <Card>
          <div className="text-center py-12">
            <AlertCircle className="h-8 w-8 text-danger-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-slate-400">Failed to load benchmark data. Please try again later.</p>
          </div>
        </Card>
      ) : advertiserCount < 3 ? (
        <Card className="bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-warning-600 shrink-0" />
            <div>
              <h3 className="font-semibold text-warning-800 dark:text-warning-300">Insufficient Data</h3>
              <p className="text-sm text-warning-700 dark:text-warning-400 mt-1">
                At least 3 advertisers in your industry are required for meaningful benchmarking. Currently {advertiserCount} advertiser(s) available.
              </p>
            </div>
          </div>
        </Card>
      ) : comparisons.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BarChart3 className="h-12 w-12" />}
            title="No Benchmark Data"
            description="Benchmark comparison requires at least 3 advertiser campaigns with similar data. More advertisers will unlock competitive insights."
            size="md"
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {comparisons.map((comp) => {
              const isGood = comp.is_above_avg;
              return (
                <Card key={comp.metric}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400">{comp.metric}</h3>
                    {isGood ? (
                      <TrendingUp className="h-4 w-4 text-accent-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-danger-500" />
                    )}
                  </div>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {comp.metric.includes('Rate') || comp.metric === 'CTR' ? formatPercentage(comp.your_value) : formatCurrency(comp.your_value)}
                    </span>
                    <span className="text-sm text-gray-500 mb-0.5">
                      vs {comp.metric.includes('Rate') || comp.metric === 'CTR' ? formatPercentage(comp.industry_avg) : formatCurrency(comp.industry_avg)} avg
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', isGood ? 'bg-accent-500' : 'bg-danger-500')}
                        style={{ width: `${Math.min(100, comp.percentile)}%` }}
                      />
                    </div>
                    <Badge variant={isGood ? 'green' : 'red'} size="sm">
                      {comp.percentile}th pctl
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader title="Your Metrics vs Industry Average" />
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={comparisons}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f3f4f6'} />
                  <XAxis dataKey="metric" tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#9ca3af' }} />
                  <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`, borderRadius: '0.75rem', color: isDark ? '#f1f5f9' : undefined }} />
                  <Legend />
                  <Bar dataKey="your_value" fill="#2563EB" name="Your Value" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="industry_avg" fill="#D1D5DB" name="Industry Avg" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </div>
    </PageTransition>
  );
}
