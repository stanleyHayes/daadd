import React from 'react';
import { cn } from '@/lib/utils';
import { formatNumber, formatPercentage } from '@/lib/utils';

interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

interface FunnelChartProps {
  steps: FunnelStep[];
  className?: string;
}

export function FunnelChart({ steps, className }: FunnelChartProps) {
  const maxValue = steps[0]?.value || 1;

  return (
    <div className={cn('space-y-3', className)}>
      {steps.map((step, index) => {
        const widthPercent = Math.max(20, (step.value / maxValue) * 100);
        const dropOff = index > 0 ? ((steps[index - 1].value - step.value) / steps[index - 1].value) * 100 : 0;
        const conversionRate = (step.value / maxValue) * 100;

        return (
          <div key={step.label}>
            {index > 0 && (
              <div className="flex items-center gap-2 py-1 pl-4">
                <div className="w-px h-4 bg-gray-300 dark:bg-slate-600" />
                <span className="text-xs text-danger-500 font-medium">
                  {formatPercentage(dropOff)} drop-off
                </span>
              </div>
            )}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div
                  className="h-12 rounded-lg flex items-center px-4 transition-all duration-500"
                  style={{ width: `${widthPercent}%`, backgroundColor: step.color }}
                >
                  <span className="text-white font-semibold text-sm whitespace-nowrap">
                    {formatNumber(step.value)}
                  </span>
                </div>
              </div>
              <div className="w-32 text-right shrink-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{step.label}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{formatPercentage(conversionRate)} of total</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
