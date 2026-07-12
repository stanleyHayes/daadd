import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageTransition } from '@/components/ui/PageTransition';
import {
  Zap, Target, Users, Shield, Brain,
  ArrowRight, Heart, Lightbulb, Rocket
} from 'lucide-react';
import { WatermarkBanner } from '@/components/ui/Watermark';
import { motion, useInView, useMotionValue, animate } from 'framer-motion';

const stats = [
  { value: 12500, suffix: '+', label: 'Active Campaigns' },
  { value: 2.3, suffix: 'M', label: 'Ads Served Daily' },
  { value: 150, suffix: '+', label: 'Countries Reached' },
  { value: 98, suffix: '%', label: 'Platform Uptime' },
];

const values = [
  { icon: Target, title: 'Precision', desc: 'Every ad reaches the right audience through intelligent targeting and AI-driven optimization.' },
  { icon: Shield, title: 'Transparency', desc: 'Full audit trails, honest analytics, and no hidden fees. What you see is what you get.' },
  { icon: Brain, title: 'Innovation', desc: 'From the Ad Journey Storyteller to real-time anomaly detection, we push the boundaries of AdTech.' },
  { icon: Users, title: 'Community', desc: 'We believe users deserve value for their attention. Our reward system makes advertising a two-way street.' },
  { icon: Heart, title: 'Trust', desc: 'We protect advertiser data and user privacy with enterprise-grade security and compliance.' },
  { icon: Lightbulb, title: 'Creativity', desc: 'Our AI Creative Generator helps brands produce compelling ad variations at scale.' },
];

const team = [
  { name: 'Alex Chen', role: 'CEO & Co-founder', avatar: 'AC', color: 'from-primary-500 to-primary-700' },
  { name: 'Sarah Okafor', role: 'CTO & Co-founder', avatar: 'SO', color: 'from-secondary-500 to-secondary-700' },
  { name: 'James Park', role: 'VP of Engineering', avatar: 'JP', color: 'from-accent-500 to-accent-700' },
  { name: 'Maria Silva', role: 'Head of Product', avatar: 'MS', color: 'from-warning-500 to-warning-700' },
  { name: 'David Mensah', role: 'Head of AI/ML', avatar: 'DM', color: 'from-danger-500 to-rose-700' },
  { name: 'Priya Sharma', role: 'Head of Design', avatar: 'PS', color: 'from-pink-500 to-rose-600' },
];

const milestones = [
  { year: '2024', title: 'The Beginning', desc: 'AdPlatform founded with a mission to make advertising rewarding for everyone.' },
  { year: '2024', title: 'Beta Launch', desc: 'First 1,000 advertisers onboarded. AI optimization engine goes live.' },
  { year: '2025', title: 'Global Expansion', desc: 'Expanded to 50+ countries. Cross-device attribution launched.' },
  { year: '2025', title: 'AI Creative Suite', desc: 'Introduced AI-powered creative generation and A/B testing tools.' },
  { year: '2026', title: '2M+ Daily Impressions', desc: 'Reached 2.3 million daily ad impressions across 150+ countries.' },
];

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
              <span>Our Story</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight"
            >
              About AdPlatform
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-primary-100 max-w-2xl mx-auto leading-relaxed"
            >
              We're building the future of intelligent advertising — where brands connect with engaged audiences and users earn real value for their attention.
            </motion.p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 bg-gray-50 dark:bg-slate-900">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((s) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <p className="text-4xl font-extrabold text-gray-900 dark:text-white">
                    <AnimatedCounter value={s.value} suffix={s.suffix} />
                  </p>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">{s.label}</p>
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
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Our Mission</h2>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-4">
                  AdPlatform was born from a simple idea: advertising doesn't have to be intrusive, and attention has real value. We created a two-sided platform that empowers advertisers with AI-driven campaign management while rewarding users who choose to engage with content that interests them.
                </p>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                  Our platform combines advanced analytics — geographic heatmaps, cross-device attribution, anomaly detection, and competitive benchmarking — with a unique Ad Journey Storyteller that transforms raw data into compelling campaign narratives.
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
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Better Ads.</h3>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Better Rewards.</h3>
                      <h3 className="text-2xl font-bold gradient-text">Better World.</h3>
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
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Our Values</h2>
              <p className="text-gray-500 dark:text-slate-400 mt-3">The principles that guide everything we build.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {values.map((v, i) => {
                const Icon = v.icon;
                return (
                  <motion.div
                    key={v.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">{v.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{v.desc}</p>
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
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Our Journey</h2>
              <p className="text-gray-500 dark:text-slate-400 mt-3">From an idea to a global platform.</p>
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
                      <h3 className="font-bold text-gray-900 dark:text-white mt-1 mb-1">{m.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400">{m.desc}</p>
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
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Leadership Team</h2>
              <p className="text-gray-500 dark:text-slate-400 mt-3">The people building the future of advertising.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
              {team.map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="text-center group"
                >
                  <div className={`w-24 h-24 rounded-full overflow-hidden bg-primary-600 ${t.color} ring-4 ring-white dark:ring-slate-900 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg group-hover:scale-105 transition-transform`}>
                    {t.avatar}
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">{t.name}</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{t.role}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-20 bg-primary-600 text-white text-center overflow-hidden">
          <div className="relative max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-4">Join the AdPlatform Community</h2>
            <p className="text-primary-100 mb-8 max-w-xl mx-auto">
              Whether you're an advertiser looking for smarter campaigns or a user who wants to earn from ads, we've got you covered.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold px-8 py-4 text-base bg-white text-primary-700 hover:bg-gray-50 shadow-xl active:scale-[0.97] transition-all"
              >
                Get Started Free <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/ads"
                className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold px-8 py-4 text-base border-2 border-white/40 text-white hover:bg-white/15 active:scale-[0.97] transition-all"
              >
                Browse Ads
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
