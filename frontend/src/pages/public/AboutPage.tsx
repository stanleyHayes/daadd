import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/ui/PageTransition';
import { Target, Users, Shield, Brain, ArrowRight, Heart, Lightbulb } from 'lucide-react';
import { useSiteContent, useSiteStats } from '@/hooks/useSiteContent';
import { getInitials } from '@/lib/utils';

const values = [
  { icon: Target, key: 'precision' },
  { icon: Shield, key: 'transparency' },
  { icon: Brain, key: 'innovation' },
  { icon: Users, key: 'community' },
  { icon: Heart, key: 'trust' },
  { icon: Lightbulb, key: 'creativity' },
] as const;

export function AboutPage() {
  const { t } = useTranslation();
  const { data: stats } = useSiteStats();
  const { data: team = [] } = useSiteContent('team_member');
  const { data: milestones = [] } = useSiteContent('milestone');

  // Counts come from the database. A stat that is still zero is left out
  // rather than padded, so a young platform simply shows fewer numbers.
  const liveStats = [
    { key: 'campaigns', value: stats?.campaigns ?? 0 },
    { key: 'advertisers', value: stats?.advertisers ?? 0 },
    { key: 'adViews', value: stats?.adViews ?? 0 },
    { key: 'cities', value: stats?.cities ?? 0 },
  ].filter((s) => s.value > 0);

  return (
    <PageTransition>
      <div>
        {/* Hero */}
        <section className="bg-primary-700 text-white">
          <div className="mx-auto max-w-4xl px-4 py-20 sm:py-24">
            <h1 className="text-balance text-4xl font-extrabold leading-tight sm:text-5xl">
              {t('about.title')}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-primary-100">
              {t('about.subtitle')}
            </p>
          </div>
        </section>

        {liveStats.length > 0 && (
          <section className="border-b border-gray-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                {liveStats.map((s) => (
                  <div key={s.key}>
                    <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                      {s.value.toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                      {t(`about.stats.${s.key}`)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Mission */}
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
              {t('about.missionTitle')}
            </h2>
            <p className="mb-4 leading-relaxed text-gray-600 dark:text-slate-400">
              {t('about.missionP1')}
            </p>
            <p className="leading-relaxed text-gray-600 dark:text-slate-400">
              {t('about.missionP2')}
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="bg-gray-50 py-20 dark:bg-slate-800/40">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 max-w-2xl">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('about.valuesTitle')}
              </h2>
              <p className="mt-3 text-gray-500 dark:text-slate-400">{t('about.valuesSubtitle')}</p>
            </div>
            <div className="grid grid-cols-1 gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {values.map((v) => {
                const Icon = v.icon;
                return (
                  <div key={v.key} className="flex gap-4">
                    <Icon className="mt-1 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" />
                    <div>
                      <h3 className="mb-1.5 font-semibold text-gray-900 dark:text-white">
                        {t(`about.values.${v.key}.title`)}
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-500 dark:text-slate-400">
                        {t(`about.values.${v.key}.desc`)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Timeline — admin-managed, hidden until something is published */}
        {milestones.length > 0 && (
          <section className="py-20">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
              <div className="mb-12 max-w-2xl">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t('about.journeyTitle')}
                </h2>
                <p className="mt-3 text-gray-500 dark:text-slate-400">
                  {t('about.journeySubtitle')}
                </p>
              </div>
              <ol className="space-y-8 border-l border-gray-200 pl-6 dark:border-slate-700">
                {milestones.map((m, i) => (
                  <motion.li
                    key={m._id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    className="relative"
                  >
                    <span className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                      {m.year}
                    </span>
                    <h3 className="mb-1 mt-1 font-bold text-gray-900 dark:text-white">{m.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{m.body}</p>
                  </motion.li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* Team — admin-managed, hidden until someone is published */}
        {team.length > 0 && (
          <section className="bg-gray-50 py-20 dark:bg-slate-800/40">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="mb-12 max-w-2xl">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t('about.teamTitle')}
                </h2>
                <p className="mt-3 text-gray-500 dark:text-slate-400">{t('about.teamSubtitle')}</p>
              </div>
              <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                {team.map((member) => (
                  <div key={member._id}>
                    <div className="mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-lg font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        getInitials(member.name)
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">{member.name}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{member.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-primary-700 text-white">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center">
            <h2 className="mb-3 text-3xl font-bold">{t('about.ctaTitle')}</h2>
            <p className="mx-auto mb-8 max-w-xl text-primary-100">{t('about.ctaDesc')}</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-primary-700 transition-all hover:bg-gray-50 active:scale-[0.98]"
              >
                {t('about.ctaPrimary')} <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/ads"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 px-7 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10 active:scale-[0.97]"
              >
                {t('common.browseAds')}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
