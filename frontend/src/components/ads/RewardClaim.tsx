
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle, Sparkles } from 'lucide-react';

interface RewardClaimProps {
  amount: number;
}

export function RewardClaim({ amount }: RewardClaimProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary-50 dark:bg-secondary-900/30 mb-4"
      >
        <CheckCircle className="h-8 w-8 text-secondary-600" />
      </motion.div>

      <motion.h3
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-lg font-bold text-text-primary mb-1"
      >
        Reward Claimed!
      </motion.h3>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-center gap-1 text-2xl font-bold text-secondary-600 mb-2">
          <Sparkles className="h-5 w-5 text-secondary-500" />
          {formatCurrency(amount)}
          <Sparkles className="h-5 w-5" />
        </div>
        <p className="text-xs text-text-secondary">has been added to your wallet</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-4 p-3 rounded-lg bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-200 dark:border-secondary-800"
      >
        <p className="text-xs text-secondary-700 dark:text-secondary-400">
          Your reward will be available for withdrawal within 24 hours.
        </p>
      </motion.div>
    </motion.div>
  );
}
