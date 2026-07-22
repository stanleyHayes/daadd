import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionLabel2?: string;
  onAction?: () => void;
  onAction2?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  /** default: bordered card · bordered: dashed card · plain: no border/bg (for embedding in cards/tables) */
  variant?: 'default' | 'bordered' | 'plain';
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionLabel2,
  onAction,
  onAction2,
  className,
  size = 'md',
  variant = 'default',
}: EmptyStateProps) {
  const isBordered = variant === 'bordered';
  const isPlain = variant === 'plain';
  const sizeClasses = {
    sm: 'py-7 px-4',
    md: 'py-10 px-6',
    lg: 'py-14 px-8',
  };

  const iconSizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-14 w-14',
    lg: 'h-18 w-18',
  };

  const iconWrapperSizeClasses = {
    sm: 'p-2.5',
    md: 'p-3.5',
    lg: 'p-4',
  };

  const titleSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const descriptionSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[24px] text-center',
        !isPlain && 'bg-gradient-to-br from-white to-slate-50/70 dark:from-slate-900 dark:to-slate-900',
        isBordered && 'border-2 border-dashed border-border-color',
        !isPlain && !isBordered && 'border border-border-color',
        sizeClasses[size],
        className
      )}
    >
      {!isPlain && <div className="marketing-grid pointer-events-none absolute inset-0 opacity-35 dark:opacity-10" />}
      <div className="relative">
        {icon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className={cn(
              'inline-flex items-center justify-center rounded-[18px] bg-primary-900 text-secondary-300 shadow-[0_10px_25px_rgba(0,27,80,0.15)] dark:bg-secondary-400 dark:text-primary-900 mb-4',
              iconWrapperSizeClasses[size]
            )}
          >
            <motion.div
              className={cn(iconSizeClasses[size])}
            >
              {icon}
            </motion.div>
          </motion.div>
        )}

        <motion.h3
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(titleSizeClasses[size], 'font-black tracking-[-0.025em] text-text-primary mb-2')}
        >
          {title}
        </motion.h3>

        {description && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(descriptionSizeClasses[size], 'text-text-secondary max-w-sm mx-auto mb-6')}
          >
            {description}
          </motion.p>
        )}

        {(actionLabel || actionLabel2) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            {actionLabel && onAction && (
              <Button
                onClick={onAction}
                size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
                variant="primary"
                shape="pill"
              >
                {actionLabel}
              </Button>
            )}
            {actionLabel2 && onAction2 && (
              <Button
                onClick={onAction2}
                size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
                variant="outline"
                shape="pill"
              >
                {actionLabel2}
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
