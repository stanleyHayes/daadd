import React from 'react';
import { AlertCircle, AlertTriangle, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface BudgetPacingIndicatorProps {
  budgetSpent: number;
  budgetTotal: number;
  showLabels?: boolean;
}

export function BudgetPacingIndicator({ budgetSpent, budgetTotal, showLabels = true }: BudgetPacingIndicatorProps) {
  const percentage = Math.min(100, (budgetSpent / budgetTotal) * 100);
  const remaining = budgetTotal - budgetSpent;

  const getStatus = (): { level: 'safe' | 'warning' | 'critical'; icon: React.ReactNode; label: string; color: string } => {
    if (percentage >= 100) {
      return { level: 'critical', icon: <AlertCircle className="h-5 w-5" />, label: 'Budget Exhausted', color: 'red' };
    }
    if (percentage >= 90) {
      return { level: 'critical', icon: <AlertCircle className="h-5 w-5" />, label: '90% Spent', color: 'red' };
    }
    if (percentage >= 75) {
      return { level: 'warning', icon: <AlertTriangle className="h-5 w-5" />, label: '75% Spent', color: 'yellow' };
    }
    return { level: 'safe', icon: <DollarSign className="h-5 w-5" />, label: 'On Track', color: 'green' };
  };

  const status = getStatus();
  const colorMap = {
    green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-100', icon: 'text-green-600' },
    yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-100', icon: 'text-yellow-600' },
    red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-100', icon: 'text-red-600' },
  };

  const colorClasses = colorMap[status.color as keyof typeof colorMap];
  const progressColor = status.color === 'green' ? 'bg-green-500' : status.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-3">
      {/* Progress Bar with Milestones */}
      <div className="space-y-2">
        <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          {/* Progress Bar */}
          <div
            className={`${progressColor} h-full transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />

          {/* Milestone Markers */}
          <div className="absolute inset-0 flex">
            {/* 75% Marker */}
            <div
              className="w-px bg-gray-400 dark:bg-gray-500 opacity-50"
              style={{ left: '75%' }}
              title="75% threshold"
            />
            {/* 90% Marker */}
            <div
              className="w-px bg-gray-400 dark:bg-gray-500 opacity-50"
              style={{ left: '90%' }}
              title="90% threshold"
            />
          </div>

          {/* Text Label */}
          {showLabels && percentage > 5 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-white drop-shadow">{Math.round(percentage)}%</span>
            </div>
          )}
        </div>

        {/* Milestone Labels */}
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
          <span>0%</span>
          <span>75%</span>
          <span>90%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Status Badge */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${colorClasses.bg}`}>
        <div className={colorClasses.icon}>{status.icon}</div>
        <div>
          <p className={`text-sm font-medium ${colorClasses.text}`}>{status.label}</p>
          <p className={`text-xs ${colorClasses.text} opacity-75`}>
            {percentage >= 100
              ? 'Budget depleted'
              : `${formatCurrency(remaining)} remaining`}
          </p>
        </div>
      </div>

      {/* Spent vs Total */}
      {showLabels && (
        <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
          <span>Spent: {formatCurrency(budgetSpent)}</span>
          <span>Total: {formatCurrency(budgetTotal)}</span>
        </div>
      )}
    </div>
  );
}
