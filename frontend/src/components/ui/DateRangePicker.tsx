import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Calendar, ChevronDown } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const presets = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(format(value.start, 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(value.end, 'yyyy-MM-dd'));

  const handlePreset = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    onChange({ start, end });
    setCustomStart(format(start, 'yyyy-MM-dd'));
    setCustomEnd(format(end, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    onChange({ start: new Date(customStart), end: new Date(customEnd) });
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)}>
      <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Date Range</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 whitespace-nowrap"
      >
        <Calendar className="h-4 w-4 text-gray-400 dark:text-slate-500" />
        <span>
          {format(value.start, 'MMM d, yyyy')} - {format(value.end, 'MMM d, yyyy')}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400 dark:text-slate-500" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg z-20 w-72 p-4"
            >
              <div className="space-y-1 mb-4">
                {presets.map((preset) => (
                  <button
                    key={preset.days}
                    onClick={() => handlePreset(preset.days)}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-2">Custom Range</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-2 py-1.5 text-sm"
                  />
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-2 py-1.5 text-sm"
                  />
                </div>
                <button
                  onClick={handleCustomApply}
                  className="w-full px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
