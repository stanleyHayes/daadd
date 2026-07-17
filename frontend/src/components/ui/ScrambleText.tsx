import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

const GLYPHS = '!<>-_\\/[]{}—=+*^?#ABCDEF0123456789';

interface ScrambleTextProps {
  text: string;
  className?: string;
  /** Total reveal duration in ms. */
  duration?: number;
}

/**
 * Decrypt/scramble effect: random glyphs resolve into the final text
 * left-to-right when scrolled into view (hacker/AI vibe). Reduced motion
 * shows the final text immediately.
 */
export function ScrambleText({ text, className, duration = 1200 }: ScrambleTextProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (reduceMotion || !isInView) {
      setDisplay(text);
      return;
    }

    const start = performance.now();
    const id = setInterval(() => {
      const progress = Math.min(1, (performance.now() - start) / duration);
      const settled = Math.floor(progress * text.length);

      let out = text.slice(0, settled);
      for (let i = settled; i < text.length; i++) {
        out += text[i] === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      setDisplay(out);

      if (progress >= 1) {
        setDisplay(text);
        clearInterval(id);
      }
    }, 40);

    return () => clearInterval(id);
  }, [isInView, text, duration, reduceMotion]);

  return (
    <span ref={ref} className={cn('inline-block', className)} aria-label={text}>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
