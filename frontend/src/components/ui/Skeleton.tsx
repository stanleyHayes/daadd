import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'card' | 'circle' | 'button';
  width?: string;
  height?: string;
}

export function Skeleton({
  variant = 'default',
  width,
  height,
  className,
  style,
  ...props
}: SkeletonProps) {
  const base = 'relative overflow-hidden rounded-md bg-bg-tertiary dark:bg-primary-900/30';

  const variants = {
    default: '',
    text: 'h-4 w-full',
    card: 'h-32 w-full rounded-xl',
    circle: 'rounded-full',
    button: 'h-10 w-28 rounded-lg',
  };

  return (
    <div
      className={cn(base, variants[variant], className)}
      style={{ width, height, ...style }}
      aria-hidden="true"
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-skeleton-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-white/10" />
    </div>
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={i === lines - 1 ? 'w-3/4' : undefined}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn('rounded-xl border border-border-color p-4 space-y-3', className)}>
      {children || (
        <>
          <Skeleton variant="text" className="h-5 w-1/3" />
          <Skeleton variant="card" className="h-24" />
          <SkeletonText lines={2} />
        </>
      )}
    </div>
  );
}

export function SkeletonMetric({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border-color p-4 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Skeleton variant="circle" className="h-10 w-10" />
        <Skeleton variant="text" className="h-4 w-12" />
      </div>
      <Skeleton variant="text" className="h-7 w-2/3" />
      <Skeleton variant="text" className="h-3 w-1/2" />
    </div>
  );
}

export function SkeletonAdCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border-color dark:border-slate-700 overflow-hidden space-y-3', className)}>
      <Skeleton variant="card" className="h-40 rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Skeleton variant="text" className="h-5 w-2/3" />
          <Skeleton variant="circle" className="h-6 w-6" />
        </div>
        <Skeleton variant="text" className="h-3 w-1/2" />
        <Skeleton variant="text" className="h-3 w-3/4" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton variant="text" className="h-4 w-16" />
          <Skeleton variant="button" className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonAdListItem({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col sm:flex-row gap-4 bg-card-bg rounded-2xl border border-border-color p-3 sm:p-4', className)}>
      <Skeleton variant="card" className="h-32 sm:h-28 w-full sm:w-48 rounded-xl shrink-0" />
      <div className="flex-1 space-y-3 py-1 sm:py-2">
        <div className="flex items-center gap-2">
          <Skeleton variant="text" className="h-5 w-20" />
          <Skeleton variant="text" className="h-4 w-12" />
        </div>
        <Skeleton variant="text" className="h-6 w-2/3" />
        <Skeleton variant="text" className="h-4 w-1/3" />
      </div>
      <div className="hidden sm:flex flex-col justify-center gap-2 w-24">
        <Skeleton variant="button" className="h-9 w-20" />
        <Skeleton variant="text" className="h-4 w-16" />
      </div>
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  columns = 5,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('w-full', className)}>
      <div className="border-b border-border-color dark:border-slate-700">
        <div className="flex gap-4 px-4 py-3">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`h-${i}`} variant="text" className="h-3 flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border-color dark:divide-slate-700">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`r-${r}`} className="flex items-center gap-4 px-4 py-4">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton
                key={`c-${r}-${c}`}
                variant="text"
                className={cn('h-3 flex-1', c === 0 && 'w-1/5')}
                style={{ width: c === 0 ? '20%' : undefined }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ items = 3, className }: { items?: number; className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton variant="circle" className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-4 w-1/3" />
            <Skeleton variant="text" className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonMap({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'w-full h-[500px] rounded-xl bg-bg-secondary border border-border-color overflow-hidden relative',
        className
      )}
    >
      <div className="absolute inset-0 opacity-30">
        <Skeleton className="w-full h-full rounded-none" />
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
        <Skeleton variant="text" className="h-2 w-24" />
        <Skeleton variant="text" className="h-2 flex-1" />
        <Skeleton variant="text" className="h-2 w-16" />
      </div>
    </div>
  );
}
