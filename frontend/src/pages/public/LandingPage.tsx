import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
 ArrowRight, Eye, Gift, TrendingUp, BarChart3, Cpu, ShoppingBag,
 Film, Trophy, Heart, Sparkles, Star, Quote, ChevronLeft,
 ChevronRight, CheckCircle2, Shield, Zap, MousePointerClick,
 MapPin, ArrowUpRight, Globe, ChevronDown, Code, Mail
} from 'lucide-react';
import toast from 'react-hot-toast';
import { WatermarkBanner } from '@/components/ui/Watermark';
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
          <WatermarkBanner icon={<Zap />} />
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

 {/* ========== LATEST BLOG ========== */}
    <section className="py-20 bg-gray-50 dark:bg-slate-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Latest from the Blog</h2>
            <p className="text-gray-500 dark:text-slate-400 mt-2">Insights, case studies, and platform updates from our team.</p>
          </div>
          <Link
            to="/blog"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            View all articles <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              id: 3,
              title: 'How FitLife Increased Conversions by 340% with AdPlatform',
              excerpt: 'A deep dive into how a fitness brand leveraged AI optimization and reward-based engagement.',
              date: 'February 28, 2026',
              category: 'Case Studies',
            },
            {
              id: 1,
              title: 'The Future of Geo-Targeted Advertising in 2026',
              excerpt: 'Privacy-first targeting and new technologies reshaping local advertising at scale.',
              date: 'March 10, 2026',
              category: 'AdTech Trends',
            },
            {
              id: 2,
              title: 'Introducing the Ad Journey Storyteller',
              excerpt: 'Turn raw campaign analytics into compelling narratives for stakeholders.',
              date: 'March 5, 2026',
              category: 'Platform Updates',
            },
          ].map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(`/blog/${post.id}`)}
              className="group bg-white dark:bg-slate-800 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-900/30 mb-4">
                {post.category}
              </span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-700 dark:group-hover:text-secondary-400 transition-colors">
                {post.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4">
                {post.excerpt}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-400 dark:text-slate-500">
                <span>{post.date}</span>
                <span className="flex items-center gap-1 text-primary-600 dark:text-secondary-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Read more <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="mt-10 text-center sm:hidden">
          <Link
            to="/blog"
            className="inline-flex items-center justify-center gap-1 rounded-md px-4 py-2 text-sm font-medium bg-primary-700 text-white hover:bg-primary-800 transition-colors"
          >
            View all articles <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
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

 {/* ========== CASE STUDIES ========== */}
    <section className="py-20 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Success Stories</h2>
            <p className="text-gray-500 dark:text-slate-400 mt-2">See how brands are winning with AI-powered advertising.</p>
          </div>
          <Link
            to="/blog?category=Case Studies"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Read case studies <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              brand: 'FitLife',
              metric: '+340%',
              metricLabel: 'conversion lift',
              quote: "AdPlatform's AI optimization and reward-based engagement completely changed how we think about advertising.",
              author: 'Jessica Park, CMO',
              color: 'from-accent-500 to-accent-600',
            },
            {
              brand: 'TechStart',
              metric: '4.8x',
              metricLabel: 'return on ad spend',
              quote: 'The geographic heatmaps and real-time anomaly detection saved us thousands in ad spend.',
              author: 'Marcus Chen, Growth Lead',
              color: 'from-primary-500 to-primary-600',
            },
          ].map((study, i) => (
            <motion.div
              key={study.brand}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative overflow-hidden rounded-2xl bg-primary-700 text-white p-8"
            >
              <div className={cn('absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30', study.color)} />
              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-sm text-primary-200 font-medium uppercase tracking-wider">{study.brand}</p>
                    <p className="text-5xl font-extrabold mt-1">{study.metric}</p>
                    <p className="text-sm text-primary-200">{study.metricLabel}</p>
                  </div>
                  <Quote className="h-8 w-8 text-white/30" />
                </div>
                <p className="text-lg text-white/90 leading-relaxed mb-6">"{study.quote}"</p>
                <p className="text-sm text-primary-200">— {study.author}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center sm:hidden">
          <Link
            to="/blog?category=Case Studies"
            className="inline-flex items-center justify-center gap-1 rounded-md px-4 py-2 text-sm font-medium bg-primary-700 text-white hover:bg-primary-800 transition-colors"
          >
            Read case studies <ArrowUpRight className="h-4 w-4" />
          </Link>
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

 {/* ========== FAQ ========== */}
    <section className="py-20 bg-white dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-3">Everything you need to know about earning rewards and advertising with us.</p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'How do I earn rewards from ads?',
              a: 'Simply browse ads that interest you, view the content, and claim the reward shown. Rewards are credited to your account and can be cashed out once you reach the minimum balance.',
            },
            {
              q: 'Is it free for advertisers to join?',
              a: 'Yes. Creating an advertiser account is free. You only pay for the ad budget you allocate to campaigns, plus a small platform fee based on performance.',
            },
            {
              q: 'What makes AdPlatform different from other ad networks?',
              a: 'We combine AI-powered optimization, privacy-first targeting, geographic heatmaps, and a reward-based engagement model that values user attention.',
            },
            {
              q: 'How does the AI optimization work?',
              a: 'Our machine learning engine analyzes campaign performance in real time and recommends adjustments to bids, budgets, audiences, and creatives to improve ROAS.',
            },
            {
              q: 'Can I integrate AdPlatform with my existing ad accounts?',
              a: 'Yes. We offer integrations with major programmatic platforms and ad exchanges. Visit our developer docs to learn more about API and OAuth connections.',
            },
          ].map((item, i) => (
            <details
              key={i}
              className="group bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 open:bg-white dark:open:bg-slate-800 transition-colors"
            >
              <summary className="flex items-center justify-between cursor-pointer p-5 text-left font-semibold text-gray-900 dark:text-white list-none">
                {item.q}
                <span className="ml-4 shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 flex items-center justify-center group-open:rotate-180 transition-transform">
                  <ChevronDown className="h-4 w-4" />
                </span>
              </summary>
              <div className="px-5 pb-5 text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                {item.a}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Still have questions? Contact us <ArrowRight className="h-4 w-4" />
          </Link>
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

 {/* ========== API / DEVELOPER TEASER ========== */}
    <section className="py-20 bg-gray-50 dark:bg-slate-800/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-primary-800 dark:bg-primary-900 p-8 md:p-12">
          <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl" />
          <div className="relative grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold uppercase tracking-wider mb-4">
                <Code className="h-3.5 w-3.5" />
                Developer Ready
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Built for Integrations</h2>
              <p className="text-primary-100 leading-relaxed mb-6">
                Connect your existing programmatic stack, sync campaign data, and build custom workflows with our REST API, webhooks, and OAuth-enabled platform accounts.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold bg-secondary-500 text-primary-900 hover:bg-secondary-400 transition-colors"
                >
                  Get API Access
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold border border-white/30 text-white hover:bg-white/10 transition-colors"
                >
                  Talk to Engineering
                </Link>
              </div>
            </div>
            <div className="bg-black/30 rounded-xl p-5 font-mono text-xs sm:text-sm text-green-300 overflow-hidden">
              <p className="text-white/50 mb-2">// Fetch campaign performance</p>
              <p>GET /api/v1/campaigns/&#123;campaignId&#125;/analytics</p>
              <p className="mt-2 text-white/70">Authorization: Bearer &#123;token&#125;</p>
              <div className="mt-4 space-y-1 text-white/80">
                <p>&#123;</p>
                <p className="pl-4">"impressions": 2450000,</p>
                <p className="pl-4">"clicks": 48200,</p>
                <p className="pl-4">"ctr": 1.97,</p>
                <p className="pl-4">"conversions": 1840</p>
                <p>&#125;</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ========== NEWSLETTER ========== */}
    <section className="py-16 bg-primary-700 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Mail className="h-8 w-8 mx-auto mb-4 text-secondary-400" />
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">Stay Ahead of AdTech</h2>
        <p className="text-primary-100 mb-6 max-w-xl mx-auto">
          Get the latest platform updates, case studies, and advertising tips delivered to your inbox every two weeks.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast.success('Thanks for subscribing!');
          }}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            required
            placeholder="Enter your email"
            className="flex-1 px-4 py-3 rounded-md bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-secondary-500/50"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-md font-semibold bg-secondary-500 text-primary-900 hover:bg-secondary-400 transition-colors"
          >
            Subscribe
          </button>
        </form>
        <p className="text-xs text-primary-200 mt-3">No spam. Unsubscribe anytime.</p>
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
