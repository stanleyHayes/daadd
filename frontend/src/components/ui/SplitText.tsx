import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SplitTextProps {
  text: string;
  className?: string;
  /** Split granularity: 'words' keeps wrapping natural, 'chars' gives the typewriter-cascade look. */
  mode?: 'words' | 'chars';
  /** Seconds between each unit's reveal. */
  stagger?: number;
  /** Initial delay in seconds. */
  delay?: number;
}

/**
 * Staggered text reveal: each word/char slides up out of an overflow mask.
 * Renders plain text when the user prefers reduced motion.
 */
export function SplitText({ text, className, mode = 'words', stagger = 0.06, delay = 0 }: SplitTextProps) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <span className={className}>{text}</span>;

  const units = mode === 'chars' ? text.split('') : text.split(' ');

  return (
    <span className={cn('inline', className)} aria-label={text}>
      {units.map((unit, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom" aria-hidden="true">
          <motion.span
            className="inline-block will-change-transform"
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            transition={{ duration: 0.55, delay: delay + i * stagger, ease: [0.22, 1, 0.36, 1] }}
          >
            {unit}
            {mode === 'words' && i < units.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
