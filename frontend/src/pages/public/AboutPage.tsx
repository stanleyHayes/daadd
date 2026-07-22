import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageTransition } from '@/components/ui/PageTransition';
import {
  Zap, Target, Users, Shield, Brain,
  ArrowRight, Heart, Lightbulb, Rocket
} from 'lucide-react';
import { WatermarkBanner } from '@/components/ui/Watermark';
import { motion, useInView, useMotionValue, animate } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Copy for these lives in the locale files; only the non-translatable bits
// (numbers, icons, gradients, initials) stay here.
const stats = [
  { value: 12500, suffix: '+', key: 'campaigns' },
  { value: 2.3, suffix: 'M', key: 'adsDaily' },
  { value: 150, suffix: '+', key: 'countries' },
  { value: 98, suffix: '%', key: 'uptime' },
] as const;

const values = [
  { icon: Target, key: 'precision' },
  { icon: Shield, key: 'transparency' },
  { icon: Brain, key: 'innovation' },
  { icon: Users, key: 'community' },
  { icon: Heart, key: 'trust' },
  { icon: Lightbulb, key: 'creativity' },
] as const;

const team = [
  { name: 'Alex Chen', roleKey: 'ceo', avatar: 'AC', color: 'from-primary-500 to-primary-700' },
  { name: 'Sarah Okafor', roleKey: 'cto', avatar: 'SO', color: 'from-secondary-500 to-secondary-700' },
  { name: 'James Park', roleKey: 'vpEng', avatar: 'JP', color: 'from-accent-500 to-accent-700' },
  { name: 'Maria Silva', roleKey: 'headProduct', avatar: 'MS', color: 'from-warning-500 to-warning-700' },
  { name: 'David Mensah', roleKey: 'headAi', avatar: 'DM', color: 'from-danger-500 to-rose-700' },
  { name: 'Priya Sharma', roleKey: 'headDesign', avatar: 'PS', color: 'from-pink-500 to-rose-600' },
] as const;

const milestones = [
  { year: '2024', key: 'beginning' },
  { year: '2024', key: 'beta' },
  { year: '2025', key: 'global' },
  { year: '2025', key: 'creative' },
  { year: '2026', key: 'scale' },
] as const;

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionValue, value, { duration: 2, ease: 'easeOut' });
      const unsub = motionValue.on('change', (v) => {
        setDisplay(value < 10 ? v.toFixed(1) : Math.floor(v).toLocaleString());
      });
      return () => { controls.stop(); unsub(); };
    }
  }, [isInView, value, motionValue]);

  return <span ref={ref}>{display}{suffix}</span>;
}

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <PageTransition>
      <div>
        {/* Hero */}
        <section className="relative overflow-hidden bg-primary-700 text-white py-24">
          <WatermarkBanner icon={<Rocket />} />
          <div className="max-w-4xl mx-auto px-4 text-center relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium mb-8"
            >
              <Rocket className="h-4 w-4 text-accent-300" />
              <span>{t('about.eyebrow')}</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight"
            >
              {t('about.title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-primary-100 max-w-2xl mx-auto leading-relaxed"
            >
              {t('about.subtitle')}
            </motion.p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 bg-gray-50 dark:bg-slate-900">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((s) => (
                <motion.div
                  key={s.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <p className="text-4xl font-extrabold text-gray-900 dark:text-white">
                    <AnimatedCounter value={s.value} suffix={s.suffix} />
                  </p>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">{t(`about.stats.${s.key}`)}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{t('about.missionTitle')}</h2>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-4">
                  {t('about.missionP1')}
                </p>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                  {t('about.missionP2')}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="aspect-square rounded-3xl bg-primary-500 p-1">
                  <div className="w-full h-full rounded-[22px] bg-white dark:bg-slate-900 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="w-24 h-24 rounded-2xl bg-primary-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary-500/25">
                        <Zap className="h-12 w-12 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('about.sloganLine1')}</h3>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('about.sloganLine2')}</h3>
                      <h3 className="text-2xl font-bold gradient-text">{t('about.sloganLine3')}</h3>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-gray-50 dark:bg-slate-800/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('about.valuesTitle')}</h2>
              <p className="text-gray-500 dark:text-slate-400 mt-3">{t('about.valuesSubtitle')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {values.map((v, i) => {
                const Icon = v.icon;
                return (
                  <motion.div
                    key={v.key}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">{t(`about.values.${v.key}.title`)}</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{t(`about.values.${v.key}.desc`)}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('about.journeyTitle')}</h2>
              <p className="text-gray-500 dark:text-slate-400 mt-3">{t('about.journeySubtitle')}</p>
            </div>
            <div className="relative">
              <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-primary-500" />
              {milestones.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative flex items-start gap-8 mb-10 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                >
                  <div className={`flex-1 ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm">
                      <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">{m.year}</span>
                      <h3 className="font-bold text-gray-900 dark:text-white mt-1 mb-1">{t(`about.milestones.${m.key}.title`)}</h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400">{t(`about.milestones.${m.key}.desc`)}</p>
                    </div>
                  </div>
                  <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary-500 border-4 border-white dark:border-slate-900 z-10" />
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-20 bg-gray-50 dark:bg-slate-800/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('about.teamTitle')}</h2>
              <p className="text-gray-500 dark:text-slate-400 mt-3">{t('about.teamSubtitle')}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
              {team.map((member, i) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="text-center group"
                >
                  <div className={`w-24 h-24 rounded-full overflow-hidden bg-primary-600 ${member.color} ring-4 ring-white dark:ring-slate-900 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg group-hover:scale-105 transition-transform`}>
                    {member.avatar}
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">{member.name}</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{t(`about.roles.${member.roleKey}`)}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-20 bg-primary-600 text-white text-center overflow-hidden">
          <div className="relative max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-4">{t('about.ctaTitle')}</h2>
            <p className="text-primary-100 mb-8 max-w-xl mx-auto">
              {t('about.ctaDesc')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold px-8 py-4 text-base bg-white text-primary-700 hover:bg-gray-50 shadow-xl active:scale-[0.97] transition-all"
              >
                {t('about.ctaPrimary')} <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/ads"
                className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold px-8 py-4 text-base border-2 border-white/40 text-white hover:bg-white/15 active:scale-[0.97] transition-all"
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
