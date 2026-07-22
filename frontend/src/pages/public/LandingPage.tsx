import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight, Eye, Gift, TrendingUp, BarChart3, Cpu, ShoppingBag,
  Film, Trophy, Heart, MapPin, ArrowUpRight, ChevronDown, Shield,
  MousePointerClick, Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/ui/PageTransition';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFeaturedAds } from '@/hooks/usePublicAds';
import { AdCard } from '@/components/ads/AdCard';
import { SkeletonAdCard } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

const categories = [
  { key: 'entertainment', icon: Film },
  { key: 'sports', icon: Trophy },
  { key: 'retail', icon: ShoppingBag },
  { key: 'technology', icon: Cpu },
  { key: 'health', icon: Heart },
  { key: 'finance', icon: BarChart3 },
] as const;

const features = [
  { icon: Zap, key: 'ai' },
  { icon: MapPin, key: 'heatmaps' },
  { icon: Shield, key: 'anomalies' },
  { icon: MousePointerClick, key: 'attribution' },
] as const;

const steps = [
  { step: 1, key: 'browse', icon: Eye },
  { step: 2, key: 'engage', icon: TrendingUp },
  { step: 3, key: 'earn', icon: Gift },
] as const;

const FAQ_KEYS = [1, 2, 3, 4, 5] as const;

export function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: featuredAds, isLoading: featuredLoading } = useFeaturedAds();

  return (
    <PageTransition>
      <div>
        {/* Hero */}
        <section className="bg-primary-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
            <div className="max-w-2xl">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-balance">
                {t('landing.hero.title')}
              </h1>
              <p className="mt-6 text-lg text-primary-100 leading-relaxed">
                {t('landing.hero.blurb')}
              </p>
              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate('/ads')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold px-7 py-3.5 text-base bg-white text-primary-700 hover:bg-gray-50 active:scale-[0.98] transition-all"
                >
                  {t('common.browseAds')} <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold px-7 py-3.5 text-base border-2 border-white/30 text-white hover:bg-white/10 active:scale-[0.97] transition-all"
                >
                  {t('landing.hero.ctaAdvertiser')}
                </button>
              </div>
              <p className="mt-5 text-sm text-primary-200">{t('landing.hero.noCard')}</p>
            </div>
          </div>
        </section>

        {/* Featured ads — real campaigns, so this section is the proof */}
        <section className="py-20 bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t('landing.featured.title')}
                </h2>
                <p className="text-gray-500 dark:text-slate-400 mt-2">
                  {t('landing.featured.subtitle')}
                </p>
              </div>
              <Link
                to="/ads"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                {t('common.viewAll')} <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            {featuredLoading ? (
              <div className="flex gap-6 overflow-x-auto pb-6 pt-2 -mx-2 px-2 scrollbar-thin">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex-none w-72 sm:w-80">
                    <SkeletonAdCard />
                  </div>
                ))}
              </div>
            ) : featuredAds && featuredAds.length > 0 ? (
              <div className="flex gap-6 overflow-x-auto pb-6 pt-2 -mx-2 px-2 scrollbar-thin">
                {featuredAds.map((ad) => (
                  <div key={ad.id} className="flex-none w-72 sm:w-80">
                    <AdCard ad={ad} featured />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Gift className="h-12 w-12" />}
                title={t('landing.featured.emptyTitle')}
                description={t('landing.featured.emptyDesc')}
                actionLabel={t('landing.featured.emptyAction')}
                onAction={() => navigate('/ads')}
                size="md"
              />
            )}
          </div>
        </section>

        {/* How it works — a genuine three-step sequence, so the numbers carry information */}
        <section className="py-20 bg-gray-50 dark:bg-slate-800/40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('landing.how.title')}
              </h2>
              <p className="text-gray-500 dark:text-slate-400 mt-3">{t('landing.how.subtitle')}</p>
            </div>

            <ol className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {steps.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.li
                    key={item.step}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: item.step * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                        {item.step}
                      </span>
                      <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {t(`landing.how.${item.key}.title`)}
                    </h3>
                    <p className="text-gray-500 dark:text-slate-400 leading-relaxed">
                      {t(`landing.how.${item.key}.desc`)}
                    </p>
                  </motion.li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* What advertisers get */}
        <section className="py-20 bg-white dark:bg-slate-900">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('landing.features.title')}
              </h2>
              <p className="text-gray-500 dark:text-slate-400 mt-3">
                {t('landing.features.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-9">
              {features.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.key} className="flex gap-4">
                    <Icon className="h-5 w-5 shrink-0 mt-1 text-primary-600 dark:text-primary-400" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5">
                        {t(`landing.features.${feat.key}.title`)}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                        {t(`landing.features.${feat.key}.desc`)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-20 bg-gray-50 dark:bg-slate-800/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-10">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('landing.categories.title')}
              </h2>
              <p className="text-gray-500 dark:text-slate-400 mt-3">
                {t('landing.categories.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.key}
                    to={`/ads?industry=${cat.key}`}
                    className={cn(
                      'group flex flex-col items-center gap-3 rounded-xl border p-5 transition-colors',
                      'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/50',
                      'dark:border-slate-700 dark:bg-slate-800 dark:hover:border-primary-700 dark:hover:bg-slate-700/60'
                    )}
                  >
                    <Icon className="h-6 w-6 text-gray-400 transition-colors group-hover:text-primary-600 dark:text-slate-500 dark:group-hover:text-primary-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                      {t(`landing.categories.${cat.key}`)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-white dark:bg-slate-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('landing.faq.title')}
              </h2>
              <p className="text-gray-500 dark:text-slate-400 mt-3">{t('landing.faq.subtitle')}</p>
            </div>

            <div className="divide-y divide-gray-200 border-y border-gray-200 dark:divide-slate-700 dark:border-slate-700">
              {FAQ_KEYS.map((n) => (
                <details key={n} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-semibold text-gray-900 dark:text-white">
                    {t(`landing.faq.q${n}`)}
                    <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="pb-4 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                    {t(`landing.faq.a${n}`)}
                  </p>
                </details>
              ))}
            </div>

            <p className="mt-8 text-sm text-gray-500 dark:text-slate-400">
              {t('landing.faq.stillHaveQuestions')}{' '}
              <Link
                to="/contact"
                className="font-semibold text-primary-600 transition-colors hover:text-primary-700"
              >
                {t('landing.faq.contactUs')}
              </Link>
            </p>
          </div>
        </section>

        {/* Close */}
        <section className="bg-primary-700 text-white">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold">{t('landing.finalCta.title')}</h2>
            <p className="mt-3 text-primary-100">{t('landing.finalCta.desc')}</p>
            <button
              onClick={() => navigate('/register')}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-primary-700 transition-all hover:bg-gray-50 active:scale-[0.98]"
            >
              {t('landing.finalCta.primary')} <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
