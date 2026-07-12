import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface MetricsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: number;
  iconColor?: string;
  iconBg?: string;
  className?: string;
}

export function MetricsCard({ icon, label, value, change, iconColor, iconBg, className }: MetricsCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <Card className={cn('flex items-start gap-4', className)}>
      <div className={cn('flex items-center justify-center w-12 h-12 rounded-xl shrink-0', iconBg || 'bg-gray-50 dark:bg-slate-700')}>
        <span className={iconColor || 'text-gray-600 dark:text-slate-400'}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{label}</p>
        <motion.p
          className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {value}
        </motion.p>
        {change !== undefined && (
          <div className={cn('flex items-center gap-1 mt-1', isPositive ? 'text-accent-600' : 'text-danger-600')}>
            {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            <span className="text-xs font-medium">{Math.abs(change).toFixed(1)}%</span>
            <span className="text-xs text-gray-400 dark:text-slate-500">vs last period</span>
          </div>
        )}
      </div>
    </Card>
  );
}
