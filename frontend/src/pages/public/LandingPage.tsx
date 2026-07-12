import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
 ArrowRight, Eye, Gift, TrendingUp, BarChart3, Cpu, ShoppingBag,
 Film, Trophy, Heart, Sparkles, Star, Quote, ChevronLeft,
 ChevronRight, CheckCircle2, Shield, Zap, MousePointerClick,
 MapPin, ArrowUpRight, Globe
} from 'lucide-react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { PageTransition } from '@/components/ui/PageTransition';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFeaturedAds } from '@/hooks/usePublicAds';
import { AdCard } from '@/components/ads/AdCard';
import { cn } from '@/lib/utils';
import { SkeletonAdCard } from '@/components/ui/Skeleton';
import { PROGRAMMATIC_PARTNERS } from '@/lib/constants';

const categories = [
 { name: 'Entertainment', icon: Film, gradient: 'from-secondary-500 to-secondary-700', glow: 'shadow-secondary-500/30', iconColor: 'text-secondary-600 dark:text-secondary-400' },
 { name: 'Sports', icon: Trophy, gradient: 'from-danger-500 to-rose-600', glow: 'shadow-danger-500/30', iconColor: 'text-danger-600 dark:text-danger-400' },
 { name: 'Retail', icon: ShoppingBag, gradient: 'from-warning-400 to-orange-500', glow: 'shadow-warning-500/30', iconColor: 'text-warning-600 dark:text-warning-400' },
 { name: 'Technology', icon: Cpu, gradient: 'from-primary-500 to-primary-700', glow: 'shadow-primary-500/30', iconColor: 'text-primary-600 dark:text-primary-400' },
 { name: 'Health', icon: Heart, gradient: 'from-pink-500 to-rose-500', glow: 'shadow-pink-500/30', iconColor: 'text-pink-600 dark:text-pink-400' },
 { name: 'Finance', icon: BarChart3, gradient: 'from-accent-500 to-emerald-600', glow: 'shadow-accent-500/30', iconColor: 'text-accent-600 dark:text-accent-400' },
];

const features = [
 {
 icon: Zap,
 title: 'AI-Powered Optimization',
 desc: 'Machine learning algorithms continuously optimize bids, budgets, and targeting to maximize your ROAS.',
 color: 'from-primary-500 to-primary-600',
 bg: 'bg-primary-50 dark:bg-primary-900/20',
 iconColor: 'text-primary-600 dark:text-primary-400',
 },
 {
 icon: MapPin,
 title: 'Geographic Heatmaps',
 desc: 'Visualize ad performance across regions with interactive heatmaps powered by real-time location data.',
 color: 'from-secondary-500 to-secondary-600',
 bg: 'bg-secondary-50 dark:bg-secondary-900/20',
 iconColor: 'text-secondary-600 dark:text-secondary-400',
 },
 {
 icon: Shield,
 title: 'Anomaly Detection',
 desc: 'Get instant alerts for unusual spikes or drops in metrics. Catch issues before they cost you money.',
 color: 'from-accent-500 to-accent-600',
 bg: 'bg-accent-50 dark:bg-accent-900/20',
 iconColor: 'text-accent-600 dark:text-accent-400',
 },
 {
 icon: MousePointerClick,
 title: 'Cross-Device Attribution',
 desc: 'Track user journeys across desktop, mobile, and tablet to attribute conversions accurately.',
 color: 'from-warning-500 to-warning-600',
 bg: 'bg-warning-50 dark:bg-warning-900/20',
 iconColor: 'text-warning-600 dark:text-warning-400',
 },
];

const testimonials = [
 {
 name: 'Jessica Park',
 role: 'CMO, FitLife',
 avatar: 'JP',
 text: 'We increased conversions by 340% using AdPlatform\'s AI optimization. The reward-based engagement model completely changed how we think about advertising.',
 rating: 5,
 },
 {
 name: 'Marcus Chen',
 role: 'Growth Lead, TechStart',
 avatar: 'MC',
 text: 'The geographic heatmaps and real-time anomaly detection saved us thousands in ad spend. Best analytics platform we\'ve ever used.',
 rating: 5,
 },
 {
 name: 'Sarah Williams',
 role: 'Head of Digital, RetailMax',
 avatar: 'SW',
 text: 'Our team loves the Ad Journey Storyteller. It turns dry campaign data into compelling narratives we actually want to share with stakeholders.',
 rating: 5,
 },
];

const stats = [
 { value: 12500, suffix: '+', label: 'Active Campaigns', icon: Zap },
 { value: 2.3, suffix: 'M', label: 'Daily Ad Impressions', icon: Eye },
 { value: 98, suffix: '%', label: 'Platform Uptime', icon: Shield },
 { value: 150, suffix: '+', label: 'Countries Reached', icon: Globe },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
 const ref = useRef<HTMLSpanElement>(null);
 const isInView = useInView(ref, { once: true });
 const motionValue = useMotionValue(0);
 const rounded = useTransform(motionValue, (v) => {
 if (value < 10) return v.toFixed(1);
 return Math.floor(v).toLocaleString();
 });
 const [display, setDisplay] = useState('0');

 useEffect(() => {
 if (isInView) {
 const controls = animate(motionValue, value, {
 duration: 2,
 ease: 'easeOut',
 });
 const unsub = rounded.on('change', (v) => setDisplay(String(v)));
 return () => {
 controls.stop();
 unsub();
 };
 }
 }, [isInView, value, motionValue, rounded]);

 return (
 <span ref={ref}>
 {display}
 {suffix}
 </span>
 );
}

function FloatingBlob({ className, delay = 0 }: { className?: string; delay?: number }) {
 return (
 <motion.div
 className={cn('absolute rounded-full blur-3xl opacity-30 pointer-events-none', className)}
 animate={{
 y: [0, -30, 0],
 x: [0, 15, 0],
 scale: [1, 1.1, 1],
 }}
 transition={{
 duration: 8,
 repeat: Infinity,
 delay,
 ease: 'easeInOut',
 }}
 />
 );
}

export function LandingPage() {
 const navigate = useNavigate();
 const { data: featuredAds, isLoading: featuredLoading } = useFeaturedAds();
 const [activeTestimonial, setActiveTestimonial] = useState(0);

 const nextTestimonial = () => setActiveTestimonial((p) => (p + 1) % testimonials.length);
 const prevTestimonial = () => setActiveTestimonial((p) => (p - 1 + testimonials.length) % testimonials.length);

 return (
 <PageTransition>
 <div>
 {/* ========== HERO ========== */}
 <section className="relative overflow-hidden bg-primary-700 text-white">
 {/* Animated background blobs */}
 <FloatingBlob className="top-0 left-0 w-96 h-96 bg-accent-400" delay={0} />
 <FloatingBlob className="bottom-0 right-0 w-80 h-80 bg-secondary-400" delay={2} />
 <FloatingBlob className="top-1/2 left-1/2 w-64 h-64 bg-warning-400" delay={4} />


 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 relative">
 <div className="max-w-3xl">
 {/* Badge */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5 }}
 className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium mb-8"
 >
 <Sparkles className="h-4 w-4 text-accent-300" />
 <span>Now with AI Creative Generation</span>
 <ArrowRight className="h-4 w-4" />
 </motion.div>

 <motion.h1
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.6, delay: 0.1 }}
 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight"
 >
 Discover Ads.{" "}
 <span className="text-transparent bg-clip-text bg-accent-300">
 Earn Rewards.
 </span>
 </motion.h1>

 <motion.p
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.6, delay: 0.2 }}
 className="mt-6 text-lg sm:text-xl text-primary-100 max-w-2xl leading-relaxed"
 >
 The intelligent advertising platform that connects brands with engaged audiences.
 Browse curated ads and earn real rewards for your attention.
 </motion.p>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.6, delay: 0.3 }}
 className="mt-10 flex flex-col sm:flex-row gap-4"
 >
 <button
 onClick={() => navigate('/ads')}
 className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold px-8 py-4 text-base bg-white text-primary-700 hover:bg-gray-50 shadow-xl shadow-black/10 active:scale-[0.97] transition-all"
 >
 Browse Ads <ArrowRight className="h-5 w-5" />
 </button>
 <button
 onClick={() => navigate('/register')}
 className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold px-8 py-4 text-base border-2 border-white/30 text-white hover:bg-white/10 active:scale-[0.97] transition-all backdrop-blur-sm"
 >
 I'm an Advertiser
 </button>
 </motion.div>

 {/* Social proof mini */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ duration: 0.8, delay: 0.6 }}
 className="mt-10 flex items-center gap-4"
 >
 <div className="flex -space-x-3">
 {['JP', 'MC', 'SW', 'AC'].map((initials, i) => (
 <div
 key={i}
 className="w-10 h-10 rounded-full border-2 border-primary-600 flex items-center justify-center text-xs font-bold text-white bg-primary-400"
 >
 {initials}
 </div>
 ))}
 </div>
 <div className="text-sm">
 <div className="flex items-center gap-1">
 {Array.from({ length: 5 }).map((_, i) => (
 <Star key={i} className="h-4 w-4 fill-amber-300 text-amber-300" />
 ))}
 </div>
 <p className="text-primary-200">Trusted by 12,000+ advertisers</p>
 </div>
 </motion.div>
 </div>
 </div>

 {/* Bottom wave */}
 <div className="absolute bottom-0 left-0 right-0">
 <svg viewBox="0 0 1440 80" fill="none" className="w-full">
 <path
 d="M0 80V40C240 80 480 0 720 0C960 0 1200 80 1440 40V80H0Z"
 className="fill-gray-50 dark:fill-slate-900"
 />
 </svg>
 </div>
 </section>

 {/* ========== STATS BAR ========== */}
 <section className="bg-gray-50 dark:bg-slate-900 py-12">
 <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
 {stats.map((stat) => {
 const Icon = stat.icon;
 return (
 <motion.div
 key={stat.label}
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 className="text-center"
 >
 <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 mb-3">
 <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
 </div>
 <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
 <AnimatedCounter value={stat.value} suffix={stat.suffix} />
 </p>
 <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{stat.label}</p>
 </motion.div>
 );
 })}
 </div>
 </div>
 </section>

 {/* ========== FEATURED ADS ========== */}
 <section className="py-20 bg-white dark:bg-slate-900">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex items-end justify-between mb-10">
 <div>
 <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Featured Ads</h2>
 <p className="text-gray-500 dark:text-slate-400 mt-2">Hand-picked campaigns with the highest rewards</p>
 </div>
 <Link
 to="/ads"
 className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
 >
 View all <ArrowUpRight className="h-4 w-4" />
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
 icon={<Sparkles className="h-12 w-12" />}
 title="No Featured Ads Yet"
 description="Featured ads will appear here soon. Check back regularly or browse by category to discover ads right now!"
 actionLabel="Browse All Ads"
 onAction={() => navigate('/ads')}
 size="md"
 />
 )}
 </div>
 </section>

 {/* ========== FEATURES ========== */}
 <section className="py-20 bg-gray-50 dark:bg-slate-800/30">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="text-center max-w-2xl mx-auto mb-16">
 <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Everything You Need</h2>
 <p className="text-gray-500 dark:text-slate-400 mt-3">
 Powerful tools for advertisers and a rewarding experience for users — all in one platform.
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
 {features.map((feat, i) => {
 const Icon = feat.icon;
 return (
 <motion.div
 key={feat.title}
 initial={{ opacity: 0, y: 30 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: '-50px' }}
 transition={{ delay: i * 0.1 }}
 className="group relative bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-200/80 dark:border-slate-700/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
 >
 <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center mb-5', feat.bg)}>
 <Icon className={cn('h-7 w-7', feat.iconColor)} />
 </div>
 <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{feat.title}</h3>
 <p className="text-gray-500 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
 <div className={cn(
 'absolute top-8 right-8 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 bg-primary-600',
 feat.color
 )} />
 </motion.div>
 );
 })}
 </div>
 </div>
 </section>

 {/* ========== HOW IT WORKS ========== */}
 <section className="py-20 bg-white dark:bg-slate-900">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="text-center max-w-2xl mx-auto mb-16">
 <h2 className="text-3xl font-bold text-gray-900 dark:text-white">How It Works</h2>
 <p className="text-gray-500 dark:text-slate-400 mt-3">
 Three simple steps to start earning rewards from ads you actually care about.
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
 {/* Connecting line */}
 <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-primary-200 dark:from-primary-900/40 dark:/40 dark:to-accent-900/40" />

 {[
 { step: 1, title: 'Browse', desc: 'Explore a curated catalog of ads from top brands across various industries. Filter by what interests you.', icon: Eye, color: 'bg-primary-600', lightColor: 'bg-primary-50 dark:bg-primary-900/20', textColor: 'text-primary-600 dark:text-primary-400' },
 { step: 2, title: 'Engage', desc: 'View and interact with ads that match your interests. Your attention is valued and rewarded.', icon: TrendingUp, color: 'bg-secondary-600', lightColor: 'bg-secondary-50 dark:bg-secondary-900/20', textColor: 'text-secondary-600 dark:text-secondary-400' },
 { step: 3, title: 'Earn', desc: 'Receive real rewards for your engagement. Cash out anytime or reinvest in more premium experiences.', icon: Gift, color: 'bg-accent-600', lightColor: 'bg-accent-50 dark:bg-accent-900/20', textColor: 'text-accent-600 dark:text-accent-400' },
 ].map((item) => {
 const Icon = item.icon;
 return (
 <motion.div
 key={item.step}
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: item.step * 0.15 }}
 className="relative text-center"
 >
 <div className="relative inline-flex items-center justify-center mb-6">
 <div className={cn('w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg', item.color)}>
 <Icon className="h-9 w-9 text-white" />
 </div>
 <div className={cn('absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white', item.color)}>
 {item.step}
 </div>
 </div>
 <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
 <p className="text-gray-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">{item.desc}</p>
 </motion.div>
 );
 })}
 </div>
 </div>
 </section>

 {/* ========== CATEGORIES ========== */}
 <section className="py-20 bg-gray-50 dark:bg-slate-800/30">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="text-center max-w-2xl mx-auto mb-12">
 <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Browse by Category</h2>
 <p className="text-gray-500 dark:text-slate-400 mt-3">
 Find ads from industries you care about — from entertainment to finance.
 </p>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
 {categories.map((cat) => {
 const Icon = cat.icon;
 return (
 <Link
 key={cat.name}
 to={`/ads?industry=${cat.name.toLowerCase()}`}
 className="group relative overflow-hidden flex flex-col items-center gap-4 p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-gray-200/80 dark:border-slate-700/80 hover:border-transparent transition-all duration-300 hover:-translate-y-1"
 >
 <div className={cn('absolute inset-0 bg-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300', cat.gradient)} />
 <div className={cn('absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-xl', cat.glow)} />

 <div className="relative">
 <div className={cn('absolute inset-0 rounded-2xl blur-lg opacity-40 group-hover:opacity-0 transition-opacity bg-primary-600', cat.gradient)} />
 <div className={cn(
 'relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300',
 'bg-gray-50 to-white dark:from-slate-900 dark:to-slate-800',
 'ring-1 ring-gray-200/80 dark:ring-slate-700/80',
 'group-hover:ring-white/40 group-hover:bg-white/15 group-hover:from-white/15 group-hover:to-white/5',
 'group-hover:scale-110 group-hover:rotate-[-4deg]'
 )}>
 <Icon className={cn('h-7 w-7 transition-colors duration-300', cat.iconColor, 'group-hover:text-white')} />
 </div>
 </div>

 <span className="relative text-sm font-semibold text-gray-700 dark:text-slate-200 group-hover:text-white transition-colors duration-300">
 {cat.name}
 </span>

 <div className="relative flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-white/90 opacity-0 -mt-2 group-hover:opacity-100 group-hover:mt-0 transition-all duration-300">
 Explore <ArrowRight className="h-3 w-3" />
 </div>
 </Link>
 );
 })}
 </div>
 </div>
 </section>

 {/* ========== TESTIMONIALS ========== */}
 <section className="py-20 bg-white dark:bg-slate-900 overflow-hidden">
 <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="text-center max-w-2xl mx-auto mb-12">
 <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Loved by Advertisers</h2>
 <p className="text-gray-500 dark:text-slate-400 mt-3">
 See what industry leaders are saying about AdPlatform.
 </p>
 </div>

 <div className="relative">
 <div className="overflow-hidden">
 <motion.div
 className="flex"
 animate={{ x: `-${activeTestimonial * 100}%` }}
 transition={{ type: 'spring', stiffness: 300, damping: 30 }}
 >
 {testimonials.map((t, i) => (
 <div key={i} className="w-full flex-shrink-0 px-4">
 <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-8 md:p-10 border border-gray-200/80 dark:border-slate-700/80">
 <Quote className="h-10 w-10 text-primary-200 dark:text-primary-900 mb-4" />
 <p className="text-lg md:text-xl text-gray-700 dark:text-slate-300 leading-relaxed mb-6">
 {t.text}
 </p>
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-500 ring-2 ring-white dark:ring-slate-800 shadow-sm flex items-center justify-center text-white font-bold">
 {t.avatar}
 </div>
 <div>
 <p className="font-semibold text-gray-900 dark:text-white">{t.name}</p>
 <p className="text-sm text-gray-500 dark:text-slate-400">{t.role}</p>
 </div>
 <div className="ml-auto flex gap-0.5">
 {Array.from({ length: t.rating }).map((_, j) => (
 <Star key={j} className="h-5 w-5 fill-amber-400 text-amber-400" />
 ))}
 </div>
 </div>
 </div>
 </div>
 ))}
 </motion.div>
 </div>

 {/* Navigation */}
 <div className="flex items-center justify-center gap-3 mt-8">
 <button
 onClick={prevTestimonial}
 className="w-10 h-10 rounded-full border border-gray-300 dark:border-slate-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
 >
 <ChevronLeft className="h-5 w-5" />
 </button>
 <div className="flex gap-2">
 {testimonials.map((_, i) => (
 <button
 key={i}
 onClick={() => setActiveTestimonial(i)}
 className={cn(
 'h-2 rounded-full transition-all duration-300',
 i === activeTestimonial ? 'w-8 bg-primary-600' : 'w-2 bg-gray-300 dark:bg-slate-600'
 )}
 />
 ))}
 </div>
 <button
 onClick={nextTestimonial}
 className="w-10 h-10 rounded-full border border-gray-300 dark:border-slate-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
 >
 <ChevronRight className="h-5 w-5" />
 </button>
 </div>
 </div>
 </div>
 </section>

 {/* ========== PROGRAMMATIC PARTNERS ========== */}
 <section className="py-16 bg-gray-50 dark:bg-slate-800/30 border-y border-gray-200 dark:border-slate-700/50">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="text-center max-w-2xl mx-auto mb-10">
 <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
 Integrated with Leading Programmatic Platforms
 </h2>
 <p className="text-gray-500 dark:text-slate-400 mt-3">
 Our ecosystem connects with the world’s top demand-side platforms, supply-side platforms, and ad exchanges.
 </p>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
 {PROGRAMMATIC_PARTNERS.map((partner, i) => (
 <motion.div
 key={partner.name}
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.05 }}
 className="group flex flex-col items-center justify-center gap-3 rounded-xl bg-white dark:bg-slate-800/80 border border-gray-200/80 dark:border-slate-700/80 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
 >
 <div className="relative h-12 w-full flex items-center justify-center overflow-hidden rounded-md bg-primary-50 dark:bg-primary-900/20">
 <img
 src={partner.logo}
 alt={partner.name}
 loading="lazy"
 className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
 />
 </div>
 <span className="text-xs font-semibold text-center text-gray-700 dark:text-slate-300 line-clamp-2">
 {partner.name}
 </span>
 </motion.div>
 ))}
 </div>
 </div>
 </section>

 {/* ========== TRUST BADGES ========== */}
 <section className="py-16 bg-white dark:bg-slate-900">
 <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
 <p className="text-center text-sm font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-8">
 Trusted by teams at
 </p>
 <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-50 grayscale dark:opacity-40">
 {['FitLife', 'TechStart', 'RetailMax', 'GreenEnergy', 'MediaHub', 'CloudNine'].map((name) => (
 <span key={name} className="text-xl font-bold text-gray-700 dark:text-slate-300">
 {name}
 </span>
 ))}
 </div>
 </div>
 </section>

 {/* ========== CTA ========== */}
 <section className="relative py-24 overflow-hidden">
 <div className="absolute inset-0 bg-primary-600" />
 <FloatingBlob className="top-0 left-1/4 w-72 h-72 bg-white/10" delay={0} />
 <FloatingBlob className="bottom-0 right-1/4 w-64 h-64 bg-white/10" delay={3} />

 <div className="relative max-w-3xl mx-auto px-4 text-center">
 <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
 <p className="text-primary-100 text-lg mb-10 max-w-xl mx-auto">
 Join thousands of users already earning rewards on AdPlatform. It takes less than a minute to sign up.
 </p>
 <div className="flex flex-col sm:flex-row justify-center gap-4">
 <button
 onClick={() => navigate('/register')}
 className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold px-8 py-4 text-base bg-white text-primary-700 hover:bg-gray-50 shadow-xl active:scale-[0.97] transition-all"
 >
 Create Free Account
 </button>
 <button
 onClick={() => navigate('/ads')}
 className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold px-8 py-4 text-base border-2 border-white/40 text-white hover:bg-white/15 active:scale-[0.97] transition-all"
 >
 Browse Ads
 </button>
 </div>
 <div className="mt-8 flex items-center justify-center gap-6 text-sm text-primary-200">
 <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> No credit card required</span>
 <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Free forever</span>
 </div>
 </div>
 </section>
 </div>
 </PageTransition>
 );
}
