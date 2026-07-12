import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Gift, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RewardClaimButtonProps {
  amount: number;
  onClaim: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function RewardClaimButton({ amount, onClaim, disabled, className }: RewardClaimButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'claimed'>('idle');
  const [showConfetti, setShowConfetti] = useState(false);

  const handleClaim = async () => {
    if (state !== 'idle') return;
    setState('loading');
    try {
      await onClaim();
      setState('claimed');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    } catch {
      setState('idle');
    }
  };

  return (
    <div className={cn('relative flex flex-col items-center', className)}>
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(12)].map((_, i) => {
              const hash = ((i * 9301 + 49297) % 233280) / 233280;
              const hash2 = (((i + 100) * 9301 + 49297) % 233280) / 233280;
              return (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ['#001b50', '#0d1b3d', '#d4af37', '#f4c20d', '#fff8dc'][i % 5],
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: (hash - 0.5) * 200,
                    y: (hash2 - 0.5) * 200 - 50,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleClaim}
        disabled={disabled || state !== 'idle'}
        whileHover={state === 'idle' ? { scale: 1.02 } : {}}
        whileTap={state === 'idle' ? { scale: 0.98 } : {}}
        className={cn(
          'relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all w-full',
          state === 'claimed'
            ? 'bg-secondary-600 text-white flex-col py-4'
            : disabled
            ? 'bg-gradient-to-r from-primary-700 to-primary-600 text-white/90 dark:from-secondary-600 dark:to-secondary-500 dark:text-primary-900 shadow-lg opacity-80 cursor-not-allowed'
            : 'bg-gradient-to-r from-primary-700 to-primary-600 text-white hover:from-primary-800 hover:to-primary-700 dark:from-secondary-500 dark:to-secondary-400 dark:text-primary-900 dark:hover:from-secondary-400 dark:hover:to-secondary-300 shadow-lg hover:shadow-xl',
          state === 'loading' && 'opacity-80 cursor-not-allowed'
        )}
      >
        {state === 'claimed' ? (
          <>
            <Check className="h-6 w-6" />
            <span className="text-lg">Reward Claimed!</span>
            <span className="text-xs font-medium opacity-90">
              +${amount.toFixed(2)} added to your balance
            </span>
          </>
        ) : state === 'loading' ? (
          <>
            <Sparkles className="h-5 w-5 animate-spin" />
            <span>Claiming...</span>
          </>
        ) : (
          <>
            <Gift className="h-5 w-5" />
            <span>Claim ${amount.toFixed(2)} Reward</span>
          </>
        )}
      </motion.button>
    </div>
  );
}
