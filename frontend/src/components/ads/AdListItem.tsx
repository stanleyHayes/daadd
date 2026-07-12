import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Flame, Gift, Star, BadgeCheck, ChevronRight } from 'lucide-react';
import { INDUSTRY_COLOR_MAP } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { PublicAd } from '@/hooks/usePublicAds';

interface AdListItemProps {
  ad: PublicAd;
  className?: string;
}

export function AdListItem({ ad, className }: AdListItemProps) {
  const industryColor = INDUSTRY_COLOR_MAP[ad.industry] || 'gray';
  const reward = (ad.rewardAmount || 0).toFixed(2);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={cn('group', className)}
    >
      <Link
        to={`/ads/${ad.id}`}
        className="flex flex-col sm:flex-row gap-4 bg-card-bg rounded-2xl border border-border-color p-3 sm:p-4 shadow-sm hover:shadow-md transition-all"
      >
        {/* Thumbnail */}
        <div className="relative w-full sm:w-48 h-32 sm:h-28 rounded-xl overflow-hidden bg-primary-50 dark:bg-primary-900/20 shrink-0">
          {ad.creativeUrl ? (
            <img
              src={ad.creativeUrl}
              alt={ad.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary-50 dark:bg-primary-900/30">
              <span className="text-4xl font-black text-primary-200 dark:text-primary-700/50">
                {ad.title.charAt(0)}
              </span>
            </div>
          )}

          {ad.isTrending && (
            <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 dark:bg-card-bg/95 text-danger-600 dark:text-danger-400 text-[10px] font-semibold shadow-sm ring-1 ring-border-color">
              <Flame className="h-3 w-3" />
              Trending
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge
              variant={industryColor as 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo'}
              size="sm"
            >
              {ad.industry.replace('_', ' ')}
            </Badge>
            {ad.rating > 0 && (
              <div className="flex items-center gap-1 text-secondary-600 dark:text-secondary-400 text-xs font-semibold">
                <Star className="h-3 w-3 fill-current" />
                <span>{ad.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <h3 className="text-lg font-bold text-text-primary leading-tight line-clamp-1 group-hover:text-primary-700 dark:group-hover:text-secondary-400 transition-colors mb-1">
            {ad.title}
          </h3>

          <div className="flex items-center gap-1.5 text-sm text-text-secondary">
            <span className="truncate max-w-[12rem]">
              {ad.advertiser?.name || 'Advertiser'}
            </span>
            {ad.advertiser?.verified && (
              <BadgeCheck className="h-3.5 w-3.5 text-secondary-600 flex-none" />
            )}
          </div>
        </div>

        {/* Meta / CTA */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 min-w-[7rem] border-t sm:border-t-0 border-border-color pt-3 sm:pt-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-50 dark:bg-secondary-900/20 text-secondary-700 dark:text-secondary-400 text-sm font-bold">
            <Gift className="h-3.5 w-3.5" />
            ${reward}
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 dark:text-secondary-400 group-hover:translate-x-1 transition-transform">
            View
            <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
