import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { formatNumber, formatCurrency } from '@/lib/utils';
import { MapPin, DollarSign, Eye, MousePointerClick } from 'lucide-react';

export interface Chapter {
  id: string;
  title: string;
  narrative: string;
  stats: { impressions: number; clicks: number; spend: number };
  visualization: string;
}

interface StoryChapterProps {
  chapter: Chapter;
  index: number;
  moneyFlowMode: boolean;
}

const visualizationColors = ['#2563EB', '#7C3AED', '#10B981', '#F59E0B'];

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const childFadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export function StoryChapter({ chapter, index, moneyFlowMode }: StoryChapterProps) {
  const color = visualizationColors[index % visualizationColors.length];
  const barCount = Math.min(8, Math.ceil(chapter.stats.impressions / 70000));
  const barHeights = useMemo(
    () => Array.from({ length: barCount }, (_, i) => `${20 + (((i * 9301 + 49297) % 233280) / 233280) * 60}px`),
    [barCount]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      <Card className="overflow-hidden">
        <motion.div variants={staggerChildren} initial="initial" whileInView="animate" viewport={{ once: true }}>
          <motion.div variants={childFadeIn} className="flex items-start gap-4 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
              style={{ backgroundColor: color }}
            >
              {index + 1}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{chapter.title}</h3>
            </div>
          </motion.div>

          <motion.p variants={childFadeIn} className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed mb-6">{chapter.narrative}</motion.p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <motion.div
              className="p-3 rounded-lg bg-gray-50 dark:bg-slate-700 text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Eye className="h-4 w-4 text-gray-400 dark:text-slate-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900 dark:text-white">{formatNumber(chapter.stats.impressions)}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Impressions</p>
            </motion.div>
            <motion.div
              className="p-3 rounded-lg bg-gray-50 dark:bg-slate-700 text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <MousePointerClick className="h-4 w-4 text-gray-400 dark:text-slate-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900 dark:text-white">{formatNumber(chapter.stats.clicks)}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Clicks</p>
            </motion.div>
            <motion.div
              className="p-3 rounded-lg bg-gray-50 dark:bg-slate-700 text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <DollarSign className="h-4 w-4 text-gray-400 dark:text-slate-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(chapter.stats.spend)}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{moneyFlowMode ? 'Money Flow' : 'Spend'}</p>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className="rounded-lg overflow-hidden"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <div
            className="h-32 flex items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}10`, borderLeft: `4px solid ${color}` }}
          >
            {moneyFlowMode ? (
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <DollarSign className="h-6 w-6 mx-auto" style={{ color }} />
                  <p className="text-xs font-medium text-gray-600 dark:text-slate-400 mt-1">Budget In</p>
                  <p className="text-sm font-bold" style={{ color }}>{formatCurrency(chapter.stats.spend)}</p>
                </div>
                <div className="flex items-center">
                  <div className="w-16 h-0.5" style={{ backgroundColor: color }} />
                  <div className="w-2 h-2 rotate-45 border-t-2 border-r-2 -ml-1" style={{ borderColor: color }} />
                </div>
                <div className="text-center">
                  <MapPin className="h-6 w-6 mx-auto" style={{ color }} />
                  <p className="text-xs font-medium text-gray-600 dark:text-slate-400 mt-1">Reach</p>
                  <p className="text-sm font-bold" style={{ color }}>{formatNumber(chapter.stats.impressions)}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex gap-1 items-end">
                  {barHeights.map((height, i) => (
                    <motion.div
                      key={i}
                      className="w-3 rounded-t-sm"
                      style={{ backgroundColor: color }}
                      initial={{ height: 0 }}
                      whileInView={{ height }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.6 + i * 0.05 }}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400">Engagement trend for this chapter</p>
              </div>
            )}
          </div>
        </motion.div>

        <div className="mt-4 flex flex-wrap gap-2">
          {['New York', 'Los Angeles', 'Chicago', 'Houston', 'London'].slice(0, index + 2).map((city) => (
            <button
              key={city}
              className="px-3 py-1.5 text-xs font-medium rounded-full border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-700 dark:hover:text-primary-400 transition-colors"
            >
              <MapPin className="h-3 w-3 inline mr-1" />
              {city}
            </button>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
