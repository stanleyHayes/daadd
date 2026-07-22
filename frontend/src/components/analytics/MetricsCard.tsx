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
    <Card shape="soft" className={cn('group relative flex min-h-40 overflow-hidden flex-col justify-between border-white/80 p-5 shadow-[0_12px_35px_rgba(7,20,49,0.055)] hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(7,20,49,0.09)] dark:border-slate-800', className)}>
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary-50 opacity-70 transition-transform group-hover:scale-125 dark:bg-white/[0.025]" />
      <div className="relative flex items-start justify-between">
      <div className={cn('flex items-center justify-center w-11 h-11 rounded-[15px] shrink-0', iconBg || 'bg-gray-50 dark:bg-slate-700')}>
        <span className={iconColor || 'text-gray-600 dark:text-slate-400'}>{icon}</span>
      </div>
      <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-300 dark:text-slate-600">Live</span>
      </div>
      <div className="relative mt-5 min-w-0">
        <p className="text-[11px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-[0.1em]">{label}</p>
        <motion.p
          className="text-3xl font-black tracking-[-0.045em] text-primary-900 dark:text-white mt-1"
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
