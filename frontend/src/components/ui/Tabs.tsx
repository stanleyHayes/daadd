import React from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (key: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('overflow-x-auto rounded-2xl border border-white bg-white p-1.5 shadow-[0_10px_30px_rgba(7,20,49,0.05)] dark:border-slate-800 dark:bg-slate-900', className)}>
      <nav className="flex gap-1" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors whitespace-nowrap',
              activeTab === tab.key
                ? 'bg-primary-900 text-white shadow-sm dark:bg-secondary-400 dark:text-primary-900'
                : 'text-gray-500 dark:text-slate-400 hover:bg-slate-50 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
