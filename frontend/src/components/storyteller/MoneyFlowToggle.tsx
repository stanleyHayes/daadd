import React from 'react';
import { cn } from '@/lib/utils';
import { DollarSign } from 'lucide-react';

interface MoneyFlowToggleProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
}

export function MoneyFlowToggle({ enabled, onToggle }: MoneyFlowToggleProps) {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
        enabled
          ? 'bg-accent-50 dark:bg-accent-900/20 border-accent-300 dark:border-accent-700 text-accent-700 dark:text-accent-400'
          : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
      )}
    >
      <DollarSign className="h-4 w-4" />
      Money Flow
      <div
        className={cn(
          'w-8 h-5 rounded-full relative transition-colors',
          enabled ? 'bg-accent-500' : 'bg-gray-300 dark:bg-slate-600'
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
            enabled ? 'translate-x-3.5' : 'translate-x-0.5'
          )}
        />
      </div>
    </button>
  );
}
