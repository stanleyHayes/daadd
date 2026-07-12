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
 <div className={cn('relative', className)}>
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
 whileHover={state === 'idle' ? { scale: 1.05 } : {}}
 whileTap={state === 'idle' ? { scale: 0.95 } : {}}
 className={cn(
 'relative flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all',
 state === 'claimed'
 ? 'bg-secondary-600 text-white'
 : disabled
 ? 'bg-gradient-to-r from-primary-700 to-primary-600 text-white/90 dark:from-secondary-600 dark:to-secondary-500 dark:text-primary-900 shadow-lg opacity-80 cursor-not-allowed'
 : 'bg-gradient-to-r from-primary-700 to-primary-600 text-white hover:from-primary-800 hover:to-primary-700 dark:from-secondary-500 dark:to-secondary-400 dark:text-primary-900 dark:hover:from-secondary-400 dark:hover:to-secondary-300 shadow-lg hover:shadow-xl',
 state === 'loading' && 'opacity-80 cursor-not-allowed'
 )}
 >
 {state === 'claimed' ? (
 <>
 <Check className="h-6 w-6" />
 <span>Reward Claimed!</span>
 </>
 ) : state === 'loading' ? (
 <>
 <Sparkles className="h-6 w-6 animate-spin" />
 <span>Claiming...</span>
 </>
 ) : (
 <>
 <Gift className="h-6 w-6" />
 <span>Claim ${amount.toFixed(2)} Reward</span>
 </>
 )}
 </motion.button>

 {state === 'claimed' && (
 <motion.p
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="text-center text-sm text-secondary-600 dark:text-secondary-400 font-medium mt-3"
 >
 +${amount.toFixed(2)} added to your balance
 </motion.p>
 )}
 </div>
 );
}
