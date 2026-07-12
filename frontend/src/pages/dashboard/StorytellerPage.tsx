import React, { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { MetricsCard } from '@/components/analytics/MetricsCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { StoryChapter, type Chapter } from '@/components/storyteller/StoryChapter';
import { MoneyFlowToggle } from '@/components/storyteller/MoneyFlowToggle';
import { Select } from '@/components/ui/Select';
import { useStory, useExportStoryPDF, useExportStoryHTML } from '@/hooks/useStoryteller';
import { useCampaigns } from '@/hooks/useCampaigns';
import { FileText, Code, Lightbulb, ArrowRight, Clock, AlertTriangle, BookOpen, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageTransition } from '@/components/ui/PageTransition';
import { Skeleton, SkeletonCard, SkeletonText, SkeletonList } from '@/components/ui/Skeleton';

export function StorytellerPage() {
  const [campaignId, setCampaignId] = useState('');
  const [moneyFlowMode, setMoneyFlowMode] = useState(false);
  const { data: story, isLoading, error } = useStory(campaignId || undefined);
  const exportPDF = useExportStoryPDF();
  const exportHTML = useExportStoryHTML();
  const { data: campaignsData } = useCampaigns();
  const campaigns = campaignsData?.data || [];

  const chapters = story?.chapters || [];
  const insights = story?.key_insights || [];
  const recommendations = story?.recommendations || [];
  const campaignAge = story?.campaign_age_hours;

  return (
    <PageTransition>
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Ad Journey Storyteller"
        subtitle="The narrative of your campaign's journey"
        action={
          campaignId && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" icon={<FileText className="h-4 w-4" />} onClick={() => { exportPDF.mutate(campaignId); toast.success('Exporting PDF...'); }} loading={exportPDF.isPending}>
                Export PDF
              </Button>
              <Button variant="outline" size="sm" icon={<Code className="h-4 w-4" />} onClick={() => { exportHTML.mutate(campaignId); toast.success('Exporting HTML...'); }} loading={exportHTML.isPending}>
                Export HTML
              </Button>
            </div>
          )
        }
      />

      {campaignId && story && !isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricsCard icon={<BookOpen className="h-5 w-5" />} label="Chapters" value={String(chapters.length)} iconColor="text-primary-600" iconBg="bg-primary-50 dark:bg-primary-900/30" />
          <MetricsCard icon={<Lightbulb className="h-5 w-5" />} label="Key Insights" value={String(insights.length)} iconColor="text-secondary-600" iconBg="bg-secondary-50 dark:bg-secondary-900/30" />
          <MetricsCard icon={<ArrowRight className="h-5 w-5" />} label="Recommendations" value={String(recommendations.length)} iconColor="text-accent-600" iconBg="bg-accent-50 dark:bg-accent-900/30" />
          <MetricsCard icon={<Clock className="h-5 w-5" />} label="Campaign Age" value={campaignAge ? `${Math.round(campaignAge)}h` : 'N/A'} iconColor="text-warning-600" iconBg="bg-warning-50 dark:bg-warning-900/30" />
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
        <div className="sm:self-end">
          <MoneyFlowToggle enabled={moneyFlowMode} onToggle={setMoneyFlowMode} />
        </div>
      </div>

      {!campaignId ? (
        <Card>
          <div className="text-center py-16">
            <BookOpen className="h-10 w-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Select a Campaign</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">Choose a campaign above to view its story.</p>
          </div>
        </Card>
      ) : isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i}>
              <div className="flex items-start gap-4">
                <Skeleton variant="circle" className="h-10 w-10" />
                <div className="flex-1 space-y-3">
                  <Skeleton variant="text" className="h-5 w-1/3" />
                  <SkeletonText lines={3} />
                  <div className="flex gap-2 pt-2">
                    <Skeleton variant="text" className="h-3 w-16" />
                    <Skeleton variant="text" className="h-3 w-20" />
                  </div>
                </div>
              </div>
            </SkeletonCard>
          ))}
          <SkeletonCard>
            <Skeleton variant="text" className="h-5 w-40 mb-4" />
            <SkeletonList items={3} />
          </SkeletonCard>
          <SkeletonCard>
            <Skeleton variant="text" className="h-5 w-48 mb-4" />
            <SkeletonList items={3} />
          </SkeletonCard>
        </div>
      ) : error ? (
        <Card>
          <div className="text-center py-12">
            <AlertTriangle className="h-8 w-8 text-danger-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-slate-400">Failed to load story data. Please try again later.</p>
          </div>
        </Card>
      ) : campaignAge !== undefined && campaignAge < 24 ? (
        <Card className="bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-primary-600 shrink-0" />
            <div>
              <h3 className="font-semibold text-primary-800 dark:text-primary-300">Preliminary Insights</h3>
              <p className="text-sm text-primary-700 dark:text-primary-400 mt-1">
                Your campaign is less than 24 hours old. Full story chapters will be available once more data is collected. Here's what we know so far...
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {chapters.length > 0 ? (
            <div className="space-y-6">
              {chapters.map((chapter, i) => (
                <StoryChapter
                  key={chapter.id}
                  chapter={chapter as unknown as Chapter}
                  index={i}
                  moneyFlowMode={moneyFlowMode}
                />
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState
                icon={<Sparkles className="h-12 w-12" />}
                title="No Story Yet"
                description="Generate an AI-powered narrative of your campaign's performance. Stories are created once campaigns have collected sufficient performance data."
                size="md"
              />
            </Card>
          )}

          {insights.length > 0 && (
            <Card>
              <CardHeader title="Key Insights" />
              <div className="space-y-3">
                {insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Lightbulb className="h-4 w-4 text-warning-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-700 dark:text-slate-300">{insight}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {recommendations.length > 0 && (
            <Card>
              <CardHeader title="Recommendations" />
              <div className="space-y-3">
                {recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <ArrowRight className="h-4 w-4 text-primary-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-700 dark:text-slate-300">{rec}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
    </PageTransition>
  );
}
