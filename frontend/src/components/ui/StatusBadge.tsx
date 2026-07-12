import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from './Badge';
import type { CampaignStatus } from '@/types';

interface StatusBadgeProps {
  status: CampaignStatus;
}

const statusConfig: Record<CampaignStatus, { label: string; variant: 'gray' | 'green' | 'yellow' | 'blue' | 'red' }> = {
  draft: { label: 'Draft', variant: 'gray' },
  active: { label: 'Active', variant: 'green' },
  paused: { label: 'Paused', variant: 'yellow' },
  completed: { label: 'Completed', variant: 'blue' },
  suspended: { label: 'Suspended', variant: 'red' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;
  return (
    <Badge variant={config.variant} dot className={cn(status === 'active' && 'animate-pulse-slow')}>
      {config.label}
    </Badge>
  );
}
