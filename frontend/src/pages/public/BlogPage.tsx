import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageTransition } from '@/components/ui/PageTransition';
import { Clock, ArrowUpRight, BookOpen, Filter } from 'lucide-react';
import { WatermarkBanner } from '@/components/ui/Watermark';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';


const categories = ['AdTech Trends', 'Platform Updates', 'Case Studies', 'Tips & Guides'] as const;

const categoryStyles: Record<string, { light: string; dark: string; solid: string }> = {
  'AdTech Trends': {
    light: 'bg-blue-50 text-blue-700 border-blue-100',
    dark: 'dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/30',
    solid: 'bg-blue-700',
  },
  'Platform Updates': {
    light: 'bg-purple-50 text-purple-700 border-purple-100',
    dark: 'dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-900/30',
    solid: 'bg-purple-700',
  },
  'Case Studies': {
    light: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    dark: 'dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/30',
    solid: 'bg-emerald-700',
  },
  'Tips & Guides': {
    light: 'bg-amber-50 text-amber-700 border-amber-100',
    dark: 'dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/30',
    solid: 'bg-amber-700',
  },
};

const headerTints = [
  'bg-primary-100 dark:bg-primary-900/20',
  'bg-secondary-100 dark:bg-secondary-900/20',
  'bg-cream-100 dark:bg-primary-900/20',
  'bg-blue-50 dark:bg-blue-900/20',
  'bg-purple-50 dark:bg-purple-900/20',
  'bg-emerald-50 dark:bg-emerald-900/20',
];

const blogPosts = [
  {
    id: 1,
    title: 'The Future of Geo-Targeted Advertising in 2026',
    excerpt: 'How advances in geographic data and privacy-first targeting are reshaping the way advertisers reach local audiences at scale.',
    date: 'March 10, 2026',
    author: 'Alex Chen',
    category: 'AdTech Trends' as const,
    readTime: '6 min read',
  },
  {
    id: 2,
    title: 'Introducing the Ad Journey Storyteller',
    excerpt: 'Our latest feature transforms raw campaign analytics into compelling narratives. Learn how it works and why it matters for your reporting.',
    date: 'March 5, 2026',
    author: 'Maria Silva',
    category: 'Platform Updates' as const,
    readTime: '4 min read',
  },
  {
    id: 3,
    title: 'How FitLife Increased Conversions by 340% with DAADD',
    excerpt: 'A deep dive into how a fitness brand leveraged our AI optimization engine and reward-based engagement to achieve record-breaking results.',
    date: 'February 28, 2026',
    author: 'David Mensah',
    category: 'Case Studies' as const,
    readTime: '8 min read',
  },
  {
    id: 4,
    title: '5 Tips for Writing High-Converting Ad Copy',
    excerpt: 'Practical advice on crafting ad copy that resonates with reward-motivated audiences. Includes real examples from top-performing campaigns.',
    date: 'February 20, 2026',
    author: 'Priya Sharma',
    category: 'Tips & Guides' as const,
    readTime: '5 min read',
  },
  {
    id: 5,
    title: 'Privacy-First Advertising: What GDPR Means for AdTech',
    excerpt: 'Navigating the evolving landscape of data privacy regulations while still delivering effective, personalized ad experiences.',
    date: 'February 15, 2026',
    author: 'Sarah Okafor',
    category: 'AdTech Trends' as const,
    readTime: '7 min read',
  },
  {
    id: 6,
    title: 'New Anomaly Detection Dashboard: What You Need to Know',
    excerpt: 'Our upgraded anomaly detection system now catches budget spikes, CTR drops, and suspicious activity in real time. Here is what changed.',
    date: 'February 8, 2026',
    author: 'James Park',
    category: 'Platform Updates' as const,
    readTime: '4 min read',
  },
];

export function BlogPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredPosts = selectedCategory
    ? blogPosts.filter((post) => post.category === selectedCategory)
    : blogPosts;

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-bg-secondary">
        {/* Hero */}
        <section className="relative bg-primary-700 text-white py-20 overflow-hidden">
          <WatermarkBanner icon={<BookOpen />} />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-secondary-500 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-white blur-3xl" />
          </div>
          <div className="max-w-4xl mx-auto px-4 text-center relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6"
            >
              <BookOpen className="h-4 w-4 text-secondary-400" />
              <span>{t('blog.title')}</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight"
            >
              {t('blog.title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-primary-100 max-w-2xl mx-auto"
            >
              {t('blog.subtitle')}
            </motion.p>
          </div>
        </section>

        {/* Category Filters */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="h-4 w-4 text-text-muted" />
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all border',
                selectedCategory === null
                  ? 'bg-primary-700 text-white border-primary-700 shadow-sm'
                  : 'bg-card-bg text-text-secondary border-border-color hover:border-primary-300 hover:text-primary-700'
              )}
            >
              {t('blog.allPosts')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all border',
                  selectedCategory === cat
                    ? `${categoryStyles[cat].solid} text-white border-transparent shadow-sm`
                    : 'bg-card-bg text-text-secondary border-border-color hover:border-primary-300 hover:text-primary-700'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Grid */}
        <section className="pb-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12 bg-card-bg rounded-2xl border border-border-color">
                <p className="text-text-secondary">{t('blog.noResults')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post, index) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    onClick={() => navigate(`/blog/${post.id}`)}
                    className="group bg-card-bg rounded-2xl border border-border-color shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  >
                    {/* Solid Color Header */}
                    <div className={cn('h-44 relative overflow-hidden', headerTints[index % headerTints.length])}>
                      <span className="absolute inset-0 flex items-center justify-center text-7xl font-black text-white/40 dark:text-white/20">
                        {post.id}
                      </span>
                      <div className="absolute top-4 left-4">
                        <span className={cn(
                          'inline-block px-2.5 py-1 rounded-full text-xs font-medium border',
                          categoryStyles[post.category].light,
                          categoryStyles[post.category].dark
                        )}>
                          {post.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Title */}
                      <h2 className="text-lg font-bold text-text-primary mb-3 line-clamp-2 group-hover:text-primary-700 dark:group-hover:text-secondary-400 transition-colors">
                        {post.title}
                      </h2>

                      {/* Excerpt */}
                      <p className="text-sm text-text-secondary mb-6 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center justify-between text-xs text-text-muted pt-5 border-t border-border-color">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-xs">
                            {post.author.charAt(0)}
                          </div>
                          <span className="font-medium text-text-secondary">{post.author}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span>{post.date}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.readTime}
                          </span>
                        </div>
                      </div>

                      {/* Read more */}
                      <div className="mt-5 flex items-center gap-1 text-sm font-semibold text-primary-700 dark:text-secondary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        Read article <ArrowUpRight className="h-4 w-4" />
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
