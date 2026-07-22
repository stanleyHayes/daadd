import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSiteContent } from '@/hooks/useSiteContent';
import { Skeleton } from '@/components/ui/Skeleton';
import DOMPurify from 'dompurify';
import { ArrowLeft, Clock, Share2, Bookmark, Calendar, Newspaper } from 'lucide-react';
import { WatermarkBanner } from '@/components/ui/Watermark';
import { PageTransition } from '@/components/ui/PageTransition';

import { cn } from '@/lib/utils';

const HEADER_TINTS = ['bg-primary-700', 'bg-primary-800', 'bg-slate-800'] as const;

export function BlogPostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: posts = [], isLoading } = useSiteContent('blog_post');

  const row = posts.find((p) => p._id === id);
  const post = row
    ? {
        title: row.title,
        author: row.name,
        category: row.category,
        readTime: row.read_time,
        content: row.body,
        image: HEADER_TINTS[posts.indexOf(row) % HEADER_TINTS.length],
        date: row.published_at
          ? new Date(row.published_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : '',
      }
    : null;

  if (isLoading) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-4xl space-y-4 px-4 py-16">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton variant="card" className="h-96" />
        </div>
      </PageTransition>
    );
  }

  if (!post) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-bg-secondary">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 text-text-primary">Post Not Found</h1>
            <button
              onClick={() => navigate('/blog')}
              className="text-primary-700 hover:text-primary-800 font-medium flex items-center gap-2 mx-auto"
            >
              <ArrowLeft className="h-5 w-5" />
              {t('blog.allPosts')}
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-bg-secondary">
        {/* Header */}
        <section className={cn('relative overflow-hidden py-16 sm:py-20', post.image)}>
          <div className="absolute inset-0 bg-primary-700/90 dark:bg-primary-900/90" />
          <WatermarkBanner className="opacity-40" icon={<Newspaper />} />
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-secondary-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-white/10 blur-3xl" />

          <div className="relative max-w-4xl mx-auto px-4">
            <button
              onClick={() => navigate('/blog')}
              className="inline-flex items-center gap-2 mb-8 text-white/80 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </button>

            <div className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border mb-4',
              'bg-white/10 text-white border-white/20'
            )}>
              {post.category}
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-6 tracking-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold">
                  {post.author?.charAt(0) || '?'}
                </div>
                <span className="font-medium text-white">{post.author}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{post.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {post.readTime}
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-4xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-card-bg rounded-2xl border border-border-color p-6 sm:p-8 shadow-sm">
                <div className="prose dark:prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />
                </div>
              </div>

              {/* Share Section */}
              <div className="mt-8 bg-card-bg rounded-2xl border border-border-color p-6 shadow-sm">
                <p className="text-sm font-medium text-text-primary mb-4">Share this post:</p>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors text-sm font-medium border border-primary-100 dark:border-primary-900/30">
                    <Share2 className="h-4 w-4" />
                    {t('blog.readMore')}
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cream-50 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300 hover:bg-cream-100 dark:hover:bg-primary-900/30 transition-colors text-sm font-medium border border-secondary-200 dark:border-primary-900/30">
                    <Bookmark className="h-4 w-4" />
                    Save
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 bg-card-bg rounded-2xl p-6 border border-border-color shadow-sm">
                <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-500" />
                  About the Author
                </h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-xl">
                    {post.author?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{post.author}</p>
                    <p className="text-xs text-text-secondary">SmartAdDeals Team</p>
                  </div>
                </div>
                <p className="text-sm text-text-secondary mb-6">
                  Expert insights from the SmartAdDeals team on advertising trends, platform updates, and industry best practices.
                </p>

                <div className="h-px bg-border-color mb-6" />

                <h4 className="font-semibold text-text-primary mb-3 text-sm">More from this category</h4>
                <div className="space-y-3 text-sm">
                  {posts
                    .filter((p) => p.category === post.category && p._id !== id)
                    .slice(0, 3)
                    .map((p) => (
                      <button
                        key={p._id}
                        onClick={() => navigate(`/blog/${p._id}`)}
                        className="block text-left leading-snug text-text-secondary transition-colors hover:text-primary-700 dark:hover:text-secondary-400"
                      >
                        {p.title}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
