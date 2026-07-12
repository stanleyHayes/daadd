import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Flame, Gift, Star, BadgeCheck, Sparkles } from 'lucide-react';
import { INDUSTRY_COLOR_MAP } from '@/lib/constants';
import type { PublicAd } from '@/hooks/usePublicAds';

interface AdCardProps {
  ad: PublicAd;
  featured?: boolean;
  className?: string;
}

export function AdCard({ ad, featured = false, className }: AdCardProps) {
  const industryColor = INDUSTRY_COLOR_MAP[ad.industry] || 'gray';
  const reward = (ad.rewardAmount || 0).toFixed(2);

  if (featured) {
    return (
      <motion.div
        whileHover={{ y: -5 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className={cn('relative group', className)}
      >
        <Link
          to={`/ads/${ad.id}`}
          className="block bg-card-bg rounded-2xl border border-border-color shadow-sm overflow-hidden transition-shadow duration-300 group-hover:shadow-xl"
        >
          {/* Featured ribbon */}
          <div className="absolute top-0 left-0 z-10">
            <div className="bg-secondary-500 text-primary-900 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-br-lg flex items-center gap-1 shadow-sm">
              <Sparkles className="h-3 w-3" />
              Featured
            </div>
          </div>

          {/* Media area */}
          <div className="aspect-[4/5] relative overflow-hidden bg-primary-100 dark:bg-primary-900/20">
            {ad.creativeUrl ? (
              <img
                src={ad.creativeUrl}
                alt={ad.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary-700">
                <span className="text-8xl font-black text-white/20">
                  {ad.title.charAt(0)}
                </span>
              </div>
            )}

            {/* Subtle overlay for text legibility when image present */}
            {ad.creativeUrl && (
              <div className="absolute inset-0 bg-primary-900/20 group-hover:bg-primary-900/10 transition-colors" />
            )}

            {/* Reward pill */}
            <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 dark:bg-card-bg/95 text-primary-700 dark:text-secondary-400 text-sm font-bold shadow-sm ring-1 ring-border-color">
              <Gift className="h-3.5 w-3.5 text-secondary-600" />
              ${reward}
            </div>

            {ad.isTrending && (
              <div className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 dark:bg-card-bg/95 text-danger-600 dark:text-danger-400 text-[11px] font-semibold shadow-sm ring-1 ring-border-color">
                <Flame className="h-3 w-3" />
                Trending
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5 bg-card-bg">
            <div className="flex items-start justify-between gap-3 mb-3">
              <Badge
                variant={industryColor as 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo'}
                size="sm"
              >
                {ad.industry.replace('_', ' ')}
              </Badge>
              {ad.rating > 0 && (
                <div className="flex items-center gap-1 text-secondary-600 dark:text-secondary-400 text-sm font-semibold">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>{ad.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            <h3 className="text-lg font-bold text-text-primary leading-tight line-clamp-2 mb-3 group-hover:text-primary-700 dark:group-hover:text-secondary-400 transition-colors">
              {ad.title}
            </h3>

            <div className="flex items-center gap-1.5 text-sm text-text-secondary">
              <span className="font-medium truncate max-w-[10rem]">
                {ad.advertiser?.name || 'Advertiser'}
              </span>
              {ad.advertiser?.verified && (
                <BadgeCheck className="h-4 w-4 text-secondary-600 flex-none" />
              )}
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={cn('group relative', className)}
    >
      <Link
        to={`/ads/${ad.id}`}
        className="block bg-card-bg rounded-2xl border border-border-color shadow-sm overflow-hidden transition-all duration-300 group-hover:shadow-lg"
      >
        {/* Media area */}
        <div className="aspect-video relative overflow-hidden bg-primary-50 dark:bg-primary-900/20">
          {ad.creativeUrl ? (
            <img
              src={ad.creativeUrl}
              alt={ad.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary-50 dark:bg-primary-900/30">
              <span className="text-6xl font-black text-primary-200 dark:text-primary-700/50">
                {ad.title.charAt(0)}
              </span>
            </div>
          )}

          {/* Reward pill */}
          <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 dark:bg-card-bg/95 text-primary-700 dark:text-secondary-400 text-xs font-bold shadow-sm ring-1 ring-border-color">
            <Gift className="h-3.5 w-3.5 text-secondary-600" />
            ${reward}
          </div>

          {ad.isTrending && (
            <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/95 dark:bg-card-bg/95 text-danger-600 dark:text-danger-400 text-[11px] font-semibold shadow-sm ring-1 ring-border-color">
              <Flame className="h-3 w-3" />
              Trending
            </div>
          )}

          {/* Decorative watermark in media corner */}
          <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-secondary-500/10 dark:bg-secondary-500/10 pointer-events-none" />
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
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

          <h3 className="font-semibold text-text-primary mb-2 line-clamp-1 group-hover:text-primary-700 dark:group-hover:text-secondary-400 transition-colors">
            {ad.title}
          </h3>

          <div className="flex items-center gap-1.5 text-sm text-text-secondary">
            <span className="truncate">{ad.advertiser?.name || 'Advertiser'}</span>
            {ad.advertiser?.verified && (
              <BadgeCheck className="h-3.5 w-3.5 text-secondary-600 flex-none" />
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
