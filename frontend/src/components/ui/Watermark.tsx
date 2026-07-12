import React from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WatermarkProps {
  className?: string;
  icon?: React.ReactNode;
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  rotate?: number;
}

const sizes = {
  sm: 'w-24 h-24 text-6xl',
  md: 'w-40 h-40 text-8xl',
  lg: 'w-64 h-64 text-[10rem]',
  xl: 'w-96 h-96 text-[14rem]',
};

export function Watermark({
  className,
  icon,
  text = 'AdPlatform',
  size = 'md',
  rotate = -12,
}: WatermarkProps) {
  return (
    <div
      className={cn(
        'pointer-events-none select-none absolute opacity-[0.06] dark:opacity-[0.045]',
        sizes[size],
        className
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      {icon ? (
        <div className="w-full h-full flex items-center justify-center">{icon}</div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 font-bold tracking-tight text-primary-700 dark:text-primary-300">
          <Zap className="w-1/2 h-1/2" strokeWidth={1} />
          <span className="text-[0.18em]">{text}</span>
        </div>
      )}
    </div>
  );
}

function makeWatermarkPattern(text: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280" viewBox="0 0 280 280"><text x="50%" y="50%" fill="currentColor" font-size="16" font-family="Outfit, sans-serif" font-weight="700" letter-spacing="0.12em" text-anchor="middle" dominant-baseline="middle" transform="rotate(-30 140 140)">${text}</text></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function WatermarkPattern({
  className,
  text = 'AdPlatform',
}: {
  className?: string;
  text?: string;
}) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 opacity-[0.055] dark:opacity-[0.04]',
        className
      )}
      style={{
        backgroundImage: makeWatermarkPattern(text),
        backgroundSize: '280px 280px',
      }}
      aria-hidden="true"
    />
  );
}

/** @deprecated Use WatermarkPattern for solid-color watermark backgrounds */
export function WatermarkGrid({ className }: { className?: string }) {
  return <WatermarkPattern className={className} />;
}

export function WatermarkBanner({
  className,
  text = 'AdPlatform',
  align = 'right',
}: {
  className?: string;
  text?: string;
  align?: 'left' | 'right';
}) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute select-none overflow-hidden',
        align === 'right' ? 'right-0 bottom-0' : 'left-0 bottom-0',
        className
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          'text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none',
          'opacity-[0.06] dark:opacity-[0.045] text-white whitespace-nowrap',
          align === 'right' ? '-rotate-12 translate-x-8 translate-y-6' : 'rotate-12 -translate-x-8 translate-y-6'
        )}
      >
        {text}
      </div>
    </div>
  );
}
