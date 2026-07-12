
import React from 'react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { Bot, UserCircle } from 'lucide-react';

interface AuditEntry {
  id: string;
  action: string;
  version: string;
  timestamp: string;
  type: 'auto' | 'manual';
}

interface AuditTimelineProps {
  entries: AuditEntry[];
}

export function AuditTimeline({ entries }: AuditTimelineProps) {
  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200 dark:bg-slate-700" />
      <div className="space-y-6">
        {entries.map((entry) => (
          <div key={entry.id} className="relative flex gap-4 pl-0">
            <div
              className={cn(
                'relative z-10 flex items-center justify-center w-10 h-10 rounded-full shrink-0 border-2 border-white dark:border-slate-800',
                entry.type === 'auto'
                  ? 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
              )}
            >
              {entry.type === 'auto' ? <Bot className="h-4 w-4" /> : <UserCircle className="h-4 w-4" />}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-medium text-secondary-600 dark:text-secondary-400 bg-secondary-50 dark:bg-secondary-900/30 px-1.5 py-0.5 rounded">
                  {entry.version}
                </span>
                <span className="text-xs text-gray-400 dark:text-slate-500">{formatRelativeTime(entry.timestamp)}</span>
                <span
                  className={cn(
                    'text-xs font-medium px-1.5 py-0.5 rounded',
                    entry.type === 'auto'
                      ? 'text-secondary-700 dark:text-secondary-400 bg-secondary-50 dark:bg-secondary-900/30'
                      : 'text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-700'
                  )}
                >
                  {entry.type === 'auto' ? 'AI Auto' : 'Manual'}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-slate-300">{entry.action}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
