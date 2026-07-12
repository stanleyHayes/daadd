import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  gray: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  green: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400',
  yellow: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
  red: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
  purple: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
};

const dotStyles: Record<BadgeVariant, string> = {
  gray: 'bg-gray-500',
  blue: 'bg-blue-500',
  green: 'bg-accent-500',
  yellow: 'bg-warning-500',
  red: 'bg-danger-500',
  purple: 'bg-secondary-500',
  indigo: 'bg-indigo-500',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
};

export function Badge({ variant = 'gray', size = 'md', children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotStyles[variant])} />}
      {children}
    </span>
  );
}
