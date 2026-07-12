import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { WatermarkBanner } from '@/components/ui/Watermark';

export function SplashScreen() {
  return (
    <motion.div
      key="splash"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: 'easeInOut' }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-cream-50 dark:bg-primary-900"
      aria-hidden="true"
    >
      <WatermarkBanner className="text-primary-200/30 dark:text-white/10" />

      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.08, opacity: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center text-center"
      >
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-700 shadow-lg shadow-primary-900/20 dark:bg-secondary-500 dark:shadow-secondary-500/20">
          <Sparkles className="h-10 w-10 text-secondary-400 dark:text-primary-900" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-primary-900 dark:text-white sm:text-4xl">
          AdPlatform
        </h1>
        <p className="mt-2 text-sm font-medium text-primary-600 dark:text-primary-200">
          AI-powered campaign intelligence
        </p>

        <div className="mt-8 h-1.5 w-40 overflow-hidden rounded-full bg-primary-200 dark:bg-primary-800">
          <motion.div
            className="h-full bg-secondary-500 dark:bg-secondary-400"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
