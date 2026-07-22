import React from 'react';
import { cn } from '@/lib/utils';

type CardShape = 'default' | 'soft' | 'sharp' | 'pill';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  /** Corner treatment. `default` is the house style; the rest are opt-in. */
  shape?: CardShape;
  /**
   * Makes the card a full-height flex column. Combined with `<CardActions>`,
   * this is what keeps every card in a grid row the same height with its
   * buttons aligned along the bottom, however much text each one holds.
   */
  stretch?: boolean;
}

const cardShapes: Record<CardShape, string> = {
  default: 'rounded-xl',
  soft: 'rounded-3xl',
  sharp: 'rounded-none',
  pill: 'rounded-[2rem]',
};

export function Card({
  children,
  className,
  padding = true,
  shape = 'default',
  stretch = false,
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-card-bg border border-border-color shadow-sm hover:shadow-md transition-shadow duration-200',
        cardShapes[shape],
        padding && 'p-6',
        stretch && 'flex h-full flex-col',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Docks its children to the bottom of a `stretch` card. The `mt-auto` is the
 * whole trick: the content above takes what it needs and this absorbs the rest,
 * so action rows line up across a grid instead of floating at different heights.
 */
export function CardActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mt-auto flex items-center gap-2 pt-4', className)}>{children}</div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <div>
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('pt-4 mt-4 border-t border-border-color flex items-center justify-end gap-3', className)}>
      {children}
    </div>
  );
}
