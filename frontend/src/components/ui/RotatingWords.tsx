import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RotatingWordsProps {
  words: string[];
  /** Milliseconds each word stays on screen. */
  interval?: number;
  className?: string;
}

/**
 * Cycles through words with a slide/blur transition (e.g. "Earn Rewards /
 * Tokens / Gift Cards"). Static first word under reduced motion.
 */
export function RotatingWords({ words, interval = 2600, className }: RotatingWordsProps) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion || words.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [words.length, interval, reduceMotion]);

  if (reduceMotion) return <span className={className}>{words[0]}</span>;

  return (
    <span className={cn('relative inline-block overflow-hidden align-bottom', className)}>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          className="inline-block will-change-transform"
          initial={{ y: '60%', opacity: 0, filter: 'blur(6px)' }}
          animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: '-60%', opacity: 0, filter: 'blur(6px)' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
