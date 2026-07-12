
import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn, formatPercentage } from '@/lib/utils';
import { useApplyRecommendation } from '@/hooks/useAI';
import toast from 'react-hot-toast';
import { DollarSign, Clock, Users, Palette, CheckCircle, X, Sparkles } from 'lucide-react';

interface Recommendation {
  id: string;
  type: 'budget_reallocation' | 'scheduling' | 'audience_expansion' | 'creative_optimization';
  title: string;
  description: string;
  expected_impact: string;
  confidence: number;
  campaign_id: string;
  status: 'pending' | 'applied' | 'dismissed';
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  autoMode?: boolean;
}

const typeConfig = {
  budget_reallocation: { icon: DollarSign, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/30', label: 'Budget' },
  scheduling: { icon: Clock, color: 'text-secondary-600', bg: 'bg-secondary-50 dark:bg-secondary-900/30', label: 'Scheduling' },
  audience_expansion: { icon: Users, color: 'text-accent-600', bg: 'bg-accent-50 dark:bg-accent-900/30', label: 'Audience' },
  creative_optimization: { icon: Palette, color: 'text-warning-600', bg: 'bg-warning-50 dark:bg-warning-900/30', label: 'Creative' },
};

export function RecommendationCard({ recommendation, autoMode: _autoMode }: RecommendationCardProps) {
  const [status, setStatus] = useState(recommendation.status);
  const applyMutation = useApplyRecommendation();
  const config = typeConfig[recommendation.type];
  const Icon = config.icon;

  const handleApply = async () => {
    try {
      await applyMutation.mutateAsync({ recommendationId: recommendation.id, campaignId: recommendation.campaign_id });
      setStatus('applied');
      toast.success('Recommendation applied successfully');
    } catch {
      toast.error('Failed to apply recommendation');
    }
  };

  const handleDismiss = () => {
    setStatus('dismissed');
    toast.success('Recommendation dismissed');
  };

  if (status === 'dismissed') return null;

  return (
    <Card className={cn(status === 'applied' && 'border-accent-200 dark:border-accent-800 bg-accent-50/30 dark:bg-accent-900/10')}>
      <div className="flex items-start gap-4">
        <div className={cn('flex items-center justify-center w-10 h-10 rounded-xl shrink-0', config.bg)}>
          <Icon className={cn('h-5 w-5', config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{recommendation.title}</h3>
            <Badge variant="purple">{config.label}</Badge>
            {status === 'applied' && <Badge variant="green">Applied</Badge>}
          </div>
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">{recommendation.description}</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent-500" />
              <span className="text-xs font-medium text-accent-700 dark:text-accent-400">Expected: {recommendation.expected_impact}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary-500 rounded-full"
                  style={{ width: `${recommendation.confidence * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-slate-400">{formatPercentage(recommendation.confidence * 100, 0)} confidence</span>
            </div>
          </div>
        </div>
        {status === 'pending' && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={handleApply}
              loading={applyMutation.isPending}
              icon={<CheckCircle className="h-3.5 w-3.5" />}
            >
              Apply
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss} icon={<X className="h-3.5 w-3.5" />}>
              Dismiss
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
