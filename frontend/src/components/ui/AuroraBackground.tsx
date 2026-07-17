import { cn } from '@/lib/utils';

interface AuroraBackgroundProps {
  className?: string;
}

/**
 * Layered, slowly drifting aurora/mesh-gradient background (Vercel/Linear
 * style). Pure CSS — the keyframes live in index.css and honor the global
 * prefers-reduced-motion guard.
 */
export function AuroraBackground({ className }: AuroraBackgroundProps) {
  return (
    <div aria-hidden="true" className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      <div className="animate-aurora absolute -top-1/4 -left-1/4 w-[70%] h-[70%] rounded-full bg-accent-500/25 blur-3xl" />
      <div className="animate-aurora-slow absolute top-1/3 -right-1/4 w-[60%] h-[60%] rounded-full bg-secondary-500/25 blur-3xl" />
      <div
        className="animate-aurora absolute -bottom-1/3 left-1/4 w-[65%] h-[65%] rounded-full bg-primary-400/30 blur-3xl"
        style={{ animationDelay: '-9s' }}
      />
      {/* Fine noise texture so the gradients read as premium, not flat */}
      <div
        className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
