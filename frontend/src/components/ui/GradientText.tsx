import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GradientTextProps {
  children: ReactNode;
  /** Tailwind gradient stops, e.g. 'from-accent-300 via-secondary-300 to-accent-300'. */
  className?: string;
}

/**
 * Text with an endlessly shifting gradient (Stripe-style). The gradient must
 * loop visually, so start and end with the same stop.
 */
export function GradientText({ children, className }: GradientTextProps) {
  return (
    <span
      className={cn(
        'text-transparent bg-clip-text bg-gradient-to-r animate-gradient-text',
        className
      )}
    >
      {children}
    </span>
  );
}
