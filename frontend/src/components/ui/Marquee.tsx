import { ReactNode, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface MarqueeProps {
  children: ReactNode;
  className?: string;
  /** Seconds for one full loop; larger = slower. */
  duration?: number;
  /** Pause the loop while hovered. */
  pauseOnHover?: boolean;
}

/**
 * Infinite horizontal marquee. Content is rendered twice and translated
 * -50%, so the loop is seamless; the duplicate is aria-hidden. Animation
 * stops under prefers-reduced-motion via the global CSS guard.
 */
export function Marquee({ children, className, duration = 40, pauseOnHover = true }: MarqueeProps) {
  return (
    <div className={cn('overflow-hidden', pauseOnHover && 'marquee-paused', className)}>
      <div
        className="animate-marquee flex w-max items-center"
        style={{ '--marquee-duration': `${duration}s` } as CSSProperties}
      >
        <div className="flex items-center">{children}</div>
        <div className="flex items-center" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
