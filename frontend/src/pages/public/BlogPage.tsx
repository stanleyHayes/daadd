import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSiteContent } from '@/hooks/useSiteContent';
import { Skeleton } from '@/components/ui/Skeleton';
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

export function BlogPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data: posts = [], isLoading } = useSiteContent('blog_post');

  // Shape the CMS rows into what the cards below already expect, so only the
  // data source changed rather than the whole page.
  const blogPosts = posts.map((post, i) => ({
    id: post._id,
    title: post.title,
    excerpt: post.excerpt,
    date: post.published_at
      ? new Date(post.published_at).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '',
    author: post.name,
    category: post.category,
    readTime: post.read_time,
    tint: headerTints[i % headerTints.length],
  }));

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
            {isLoading ? (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} variant="card" className="h-72" />
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12 bg-card-bg rounded-2xl border border-border-color">
                <p className="text-text-secondary">{t('blog.noResults')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-2 lg:grid-cols-3">
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
