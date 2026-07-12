import React from 'react';
import { cn } from '@/lib/utils';
import { WatermarkBanner } from '@/components/ui/Watermark';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  size?: 'md' | 'lg';
}

export function PageHeader({ title, subtitle, action, className, size = 'md' }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-primary-700 text-white',
        size === 'lg' ? 'p-6 md:p-8' : 'p-5 md:p-6',
        className
      )}
    >
      <WatermarkBanner className="opacity-40" />
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={cn('font-bold tracking-tight', size === 'lg' ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl')}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-primary-100 mt-1 max-w-2xl">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
