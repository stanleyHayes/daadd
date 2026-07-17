import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CursorGlowProps {
  /** Tailwind size + color, e.g. 'w-[500px] h-[500px] bg-accent-400/20'. */
  className?: string;
}

/**
 * A soft radial glow that follows the cursor inside its (position:relative)
 * parent — Raycast-style spotlight. Hidden under reduced motion.
 */
export function CursorGlow({ className }: CursorGlowProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const springX = useSpring(x, { stiffness: 120, damping: 20, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 120, damping: 20, mass: 0.5 });

  useEffect(() => {
    if (reduceMotion) return;
    const parent = ref.current?.parentElement;
    if (!parent) return;

    function onMove(e: MouseEvent) {
      const rect = parent!.getBoundingClientRect();
      x.set(e.clientX - rect.left - 250);
      y.set(e.clientY - rect.top - 250);
    }
    function onLeave() {
      x.set(-400);
      y.set(-400);
    }

    parent.addEventListener('mousemove', onMove);
    parent.addEventListener('mouseleave', onLeave);
    return () => {
      parent.removeEventListener('mousemove', onMove);
      parent.removeEventListener('mouseleave', onLeave);
    };
  }, [x, y, reduceMotion]);

  if (reduceMotion) return null;

  return (
    <motion.div
      ref={ref}
      aria-hidden="true"
      style={{ x: springX, y: springY }}
      className={cn(
        'pointer-events-none absolute top-0 left-0 w-[500px] h-[500px] rounded-full blur-3xl',
        className
      )}
    />
  );
}
