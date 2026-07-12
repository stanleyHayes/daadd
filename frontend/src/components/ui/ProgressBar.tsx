import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'accent' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colorStyles = {
  primary: 'bg-primary-600',
  accent: 'bg-accent-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
};

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = false,
  color = 'primary',
  size = 'md',
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const autoColor = percentage >= 90 ? 'danger' : percentage >= 75 ? 'warning' : color;

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</span>}
          {showPercentage && <span className="text-sm text-gray-500 dark:text-slate-400">{percentage.toFixed(0)}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden', sizeStyles[size])}>
        <div
          className={cn('rounded-full transition-all duration-500 ease-out', sizeStyles[size], colorStyles[autoColor])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
