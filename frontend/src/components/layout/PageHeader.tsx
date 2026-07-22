import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

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
        'dashboard-page-header relative overflow-hidden rounded-[28px] bg-[#07142f] text-white shadow-[0_18px_50px_rgba(7,20,49,0.14)]',
        size === 'lg' ? 'p-7 md:p-9' : 'p-6 md:p-8',
        className
      )}
    >
      <div className="auth-panel-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-secondary-400/20 blur-[80px]" />
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-secondary-300"><Sparkles className="h-3.5 w-3.5" /> Workspace intelligence</p>
          <h1 className={cn('font-black tracking-[-0.04em]', size === 'lg' ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl')}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm leading-6 text-white/55 mt-2 max-w-2xl">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
