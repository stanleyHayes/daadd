import { Link, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  Cpu,
  Eye,
  Film,
  Gift,
  Heart,
  MapPin,
  MousePointerClick,
  Play,
  Shield,
  ShoppingBag,
  Sparkles,
  Trophy,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFeaturedAds } from '@/hooks/usePublicAds';
import { AdCard } from '@/components/ads/AdCard';
import { SkeletonAdCard } from '@/components/ui/Skeleton';

const categories = [
  { key: 'entertainment', icon: Film, tone: 'bg-fuchsia-100 text-fuchsia-700' },
  { key: 'sports', icon: Trophy, tone: 'bg-orange-100 text-orange-700' },
  { key: 'retail', icon: ShoppingBag, tone: 'bg-blue-100 text-blue-700' },
  { key: 'technology', icon: Cpu, tone: 'bg-violet-100 text-violet-700' },
  { key: 'health', icon: Heart, tone: 'bg-rose-100 text-rose-700' },
  { key: 'finance', icon: BarChart3, tone: 'bg-emerald-100 text-emerald-700' },
] as const;

const features = [
  { icon: Zap, key: 'ai', number: '01' },
  { icon: MapPin, key: 'heatmaps', number: '02' },
  { icon: Shield, key: 'anomalies', number: '03' },
  { icon: MousePointerClick, key: 'attribution', number: '04' },
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
      <div className="marketing-home">
        <section className="relative isolate overflow-hidden bg-[#f7f5ef] dark:bg-slate-950">
          <div className="absolute inset-0 marketing-grid opacity-60 dark:opacity-20" />
          <div className="absolute -right-20 top-10 h-80 w-80 rounded-full bg-secondary-300/25 blur-[90px]" />
          <div className="mx-auto grid min-h-[720px] max-w-[1440px] items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-10 lg:py-20">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="relative z-10 max-w-3xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary-900/10 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-800 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-secondary-300">
                <Sparkles className="h-3.5 w-3.5 text-secondary-600" /> Advertising, rebalanced
              </div>
              <h1 className="max-w-3xl text-[clamp(3.25rem,7vw,6.8rem)] font-black leading-[0.88] tracking-[-0.075em] text-primary-900 dark:text-white">
                Ads worth <span className="relative inline-block text-secondary-600 dark:text-secondary-400">your time.<svg className="absolute -bottom-3 left-1 h-3 w-[92%]" viewBox="0 0 320 18" fill="none" aria-hidden="true"><path d="M3 14C79 3 221 2 317 8" stroke="currentColor" strokeWidth="7" strokeLinecap="round" /></svg></span>
              </h1>
              <p className="mt-9 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300 sm:text-xl">{t('landing.hero.blurb')}</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => navigate('/ads')} className="group inline-flex h-14 items-center justify-center gap-3 rounded-full bg-primary-900 px-7 text-sm font-bold text-white shadow-[0_18px_40px_rgba(0,27,80,0.2)] transition hover:-translate-y-0.5 hover:bg-primary-700 dark:bg-secondary-400 dark:text-primary-900">
                  {t('common.browseAds')} <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 transition-transform group-hover:translate-x-1"><ArrowRight className="h-4 w-4" /></span>
                </button>
                <button onClick={() => navigate('/register')} className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/60 px-7 text-sm font-bold text-primary-900 backdrop-blur transition hover:border-primary-900 hover:bg-white dark:border-slate-700 dark:bg-white/5 dark:text-white dark:hover:border-secondary-400">
                  <Play className="h-4 w-4 fill-current" /> {t('landing.hero.ctaAdvertiser')}
                </button>
              </div>
              <div className="mt-8 flex items-center gap-5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <div className="flex -space-x-2"><span className="avatar-dot bg-[#ff8f70]">A</span><span className="avatar-dot bg-[#8fc7ff]">M</span><span className="avatar-dot bg-[#98dfb0]">K</span></div>
                <span>{t('landing.hero.noCard')}</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.94, rotate: 1.5 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ delay: 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="relative mx-auto w-full max-w-[610px] lg:mx-0">
              <div className="absolute -inset-8 rounded-[56px] bg-primary-900/5 blur-2xl" />
              <div className="relative overflow-hidden rounded-[36px] border-[10px] border-white bg-primary-900 p-5 shadow-[0_32px_90px_rgba(0,27,80,0.25)] dark:border-slate-800 sm:p-7">
                <div className="flex items-center justify-between text-white">
                  <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Your attention wallet</p><p className="mt-1 text-2xl font-extrabold">GHS 128.40</p></div>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary-400 text-primary-900"><Zap className="h-5 w-5 fill-current" /></span>
                </div>
                <div className="mt-6 grid min-h-[310px] grid-cols-[0.84fr_1.16fr] gap-3">
                  <div className="flex flex-col justify-between rounded-[24px] bg-secondary-400 p-5 text-primary-900">
                    <div><span className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-65">Live reward</span><h3 className="mt-3 text-2xl font-black leading-[0.95] tracking-[-0.04em]">Watch.<br />React.<br />Earn.</h3></div>
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-primary-900 text-white"><Play className="h-4 w-4 fill-current" /></div>
                  </div>
                  <div className="relative overflow-hidden rounded-[24px] bg-[#dbe9e5] p-5 text-primary-900">
                    <div className="absolute -bottom-12 -right-10 h-52 w-52 rounded-full border-[28px] border-[#8bb8aa]" />
                    <div className="absolute bottom-12 right-10 h-24 w-24 rotate-12 rounded-3xl bg-[#ff7f5c] shadow-xl" />
                    <div className="relative"><span className="rounded-full bg-white/70 px-3 py-1 text-[9px] font-bold uppercase tracking-wider">Featured now</span><p className="mt-4 max-w-[130px] text-lg font-black leading-tight">Discover something worth sharing.</p></div>
                    <div className="absolute bottom-5 left-5 rounded-full bg-white px-3 py-2 text-xs font-extrabold shadow-lg">+ GHS 2.50</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {[['12', 'ads seen'], ['8', 'rewards'], ['4.9', 'rating']].map(([value, label]) => <div key={label} className="rounded-2xl bg-white/[0.07] px-3 py-3 text-white"><p className="text-lg font-black">{value}</p><p className="text-[9px] uppercase tracking-wider text-white/40">{label}</p></div>)}
                </div>
              </div>
              <div className="absolute -bottom-5 -left-3 rounded-2xl border border-white bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:-left-10"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><TrendingUp className="h-5 w-5" /></span><div><p className="text-xs font-bold text-slate-900 dark:text-white">Reward received</p><p className="text-[10px] text-slate-500">Just now · verified</p></div></div></div>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-slate-400 sm:px-6 lg:px-10">
            <span className="text-primary-900 dark:text-white">One platform for</span><span>People</span><span className="text-secondary-500">×</span><span>Advertisers</span><span className="text-secondary-500">×</span><span>Merchants</span><span className="text-secondary-500">×</span><span>Communities</span>
          </div>
        </section>

        <section className="marketing-section bg-white dark:bg-slate-900">
          <div className="marketing-shell">
            <SectionHeading eyebrow="Live opportunities" title={t('landing.featured.title')} description={t('landing.featured.subtitle')} action={<Link to="/ads" className="inline-flex items-center gap-2 text-sm font-bold text-primary-800 dark:text-secondary-300">{t('common.viewAll')} <ArrowUpRight className="h-4 w-4" /></Link>} />
            {featuredLoading ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonAdCard key={i} />)}</div> : featuredAds?.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{featuredAds.slice(0, 4).map((ad) => <AdCard key={ad.id} ad={ad} featured />)}</div> : <EmptyState icon={<Gift className="h-12 w-12" />} title={t('landing.featured.emptyTitle')} description={t('landing.featured.emptyDesc')} actionLabel={t('landing.featured.emptyAction')} onAction={() => navigate('/ads')} size="md" />}
          </div>
        </section>

        <section className="marketing-section relative overflow-hidden bg-[#07142f] text-white">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-secondary-400/10 blur-[100px]" />
          <div className="marketing-shell relative">
            <SectionHeading dark eyebrow="Simple by design" title={t('landing.how.title')} description={t('landing.how.subtitle')} />
            <ol className="grid gap-4 lg:grid-cols-3">
              {steps.map((item) => { const Icon = item.icon; return <motion.li key={item.step} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: item.step * 0.08 }} className="group relative min-h-72 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.055] p-7 transition hover:-translate-y-1 hover:border-secondary-400/40">
                <span className="absolute right-5 top-1 text-[6rem] font-black tracking-[-0.08em] text-white/[0.045]">0{item.step}</span><div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary-400 text-primary-900"><Icon className="h-5 w-5" /></div><h3 className="mt-20 text-2xl font-extrabold tracking-[-0.03em]">{t(`landing.how.${item.key}.title`)}</h3><p className="mt-3 max-w-xs text-sm leading-6 text-white/55">{t(`landing.how.${item.key}.desc`)}</p>
              </motion.li>; })}
            </ol>
          </div>
        </section>

        <section className="marketing-section bg-[#f7f5ef] dark:bg-slate-950">
          <div className="marketing-shell">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div className="lg:sticky lg:top-32"><SectionHeading eyebrow="Intelligence with a purpose" title={t('landing.features.title')} description={t('landing.features.subtitle')} /><Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-primary-900 px-6 py-3 text-sm font-bold text-white dark:bg-secondary-400 dark:text-primary-900">Start building <ArrowRight className="h-4 w-4" /></Link></div>
              <div className="grid gap-4 sm:grid-cols-2">{features.map((feature) => { const Icon = feature.icon; return <div key={feature.key} className="group min-h-64 rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_35px_rgba(7,20,49,0.05)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(7,20,49,0.09)] dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-50 text-primary-700 dark:bg-secondary-400 dark:text-primary-900"><Icon className="h-5 w-5" /></span><span className="text-xs font-black tracking-widest text-slate-300">{feature.number}</span></div><h3 className="mt-12 text-xl font-extrabold tracking-[-0.03em] text-primary-900 dark:text-white">{t(`landing.features.${feature.key}.title`)}</h3><p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{t(`landing.features.${feature.key}.desc`)}</p></div>; })}</div>
            </div>
          </div>
        </section>

        <section className="marketing-section bg-white dark:bg-slate-900">
          <div className="marketing-shell">
            <SectionHeading eyebrow="Find your thing" title={t('landing.categories.title')} description={t('landing.categories.subtitle')} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{categories.map((category) => { const Icon = category.icon; return <Link key={category.key} to={`/ads?industry=${category.key}`} className="group rounded-[24px] border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-primary-900 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-secondary-400"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${category.tone}`}><Icon className="h-5 w-5" /></span><p className="mt-8 flex items-center justify-between text-sm font-bold text-slate-800 dark:text-white">{t(`landing.categories.${category.key}`)}<ArrowUpRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" /></p></Link>; })}</div>
          </div>
        </section>

        <section className="marketing-section bg-[#f7f5ef] dark:bg-slate-950">
          <div className="marketing-shell grid gap-12 lg:grid-cols-[0.72fr_1.28fr]">
            <SectionHeading eyebrow="Questions, answered" title={t('landing.faq.title')} description={t('landing.faq.subtitle')} />
            <div className="space-y-3">{FAQ_KEYS.map((number) => <details key={number} className="group rounded-[22px] border border-slate-200 bg-white px-5 open:border-secondary-400 dark:border-slate-800 dark:bg-slate-900"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left font-bold text-primary-900 dark:text-white">{t(`landing.faq.q${number}`)}<span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 dark:bg-slate-800"><ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" /></span></summary><p className="max-w-2xl pb-5 text-sm leading-7 text-slate-500 dark:text-slate-400">{t(`landing.faq.a${number}`)}</p></details>)}<p className="px-2 pt-4 text-sm text-slate-500">{t('landing.faq.stillHaveQuestions')} <Link to="/contact" className="font-bold text-primary-800 underline decoration-secondary-400 decoration-2 underline-offset-4 dark:text-secondary-300">{t('landing.faq.contactUs')}</Link></p></div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-secondary-400 text-primary-900">
          <div className="marketing-grid absolute inset-0 opacity-20" />
          <div className="marketing-shell relative py-20 text-center sm:py-24"><p className="text-xs font-black uppercase tracking-[0.22em]">Ready when you are</p><h2 className="mx-auto mt-5 max-w-4xl text-4xl font-black tracking-[-0.055em] sm:text-6xl">{t('landing.finalCta.title')}</h2><p className="mx-auto mt-5 max-w-xl text-base leading-7 text-primary-900/70">{t('landing.finalCta.desc')}</p><button onClick={() => navigate('/register')} className="mt-8 inline-flex h-14 items-center gap-3 rounded-full bg-primary-900 px-8 text-sm font-bold text-white shadow-xl transition hover:-translate-y-1">{t('landing.finalCta.primary')} <ArrowRight className="h-4 w-4" /></button></div>
        </section>
      </div>
    </PageTransition>
  );
}

function SectionHeading({ eyebrow, title, description, action, dark = false }: { eyebrow: string; title: string; description: string; action?: ReactNode; dark?: boolean }) {
  return <div className="mb-11 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-2xl"><p className={`mb-4 text-[11px] font-black uppercase tracking-[0.22em] ${dark ? 'text-secondary-300' : 'text-secondary-700 dark:text-secondary-300'}`}>{eyebrow}</p><h2 className={`text-3xl font-black tracking-[-0.045em] sm:text-5xl ${dark ? 'text-white' : 'text-primary-900 dark:text-white'}`}>{title}</h2><p className={`mt-4 max-w-xl text-base leading-7 ${dark ? 'text-white/55' : 'text-slate-500 dark:text-slate-400'}`}>{description}</p></div>{action}</div>;
}
