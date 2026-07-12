import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdCard } from '@/components/ads/AdCard';
import { AdListItem } from '@/components/ads/AdListItem';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { Search, SlidersHorizontal, AlertTriangle, EyeOff, LayoutGrid, List } from 'lucide-react';
import { INDUSTRIES } from '@/lib/constants';
import { PageTransition } from '@/components/ui/PageTransition';
import { WatermarkBanner } from '@/components/ui/Watermark';
import { usePublicAds } from '@/hooks/usePublicAds';
import { motion } from 'framer-motion';
import { SkeletonAdCard, SkeletonAdListItem } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

const industryTabs = [
  { value: '', label: 'All' },
  ...INDUSTRIES.map((i) => ({ value: i.value, label: i.label })),
];

const sortOptions = [
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest' },
  { value: 'reward', label: 'Highest Reward' },
];

export function AdCatalogPage() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [sortBy, setSortBy] = useState('trending');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const perPage = 8;

  useEffect(() => {
    const sort = searchParams.get('sort');
    const industry = searchParams.get('industry');
    const search = searchParams.get('search');
    if (sort) setSortBy(sort);
    if (industry) setSelectedIndustry(industry);
    if (search) setSearchQuery(search);
  }, [searchParams]);

  const { data: ads, isLoading, error } = usePublicAds({
    industry: selectedIndustry || undefined,
    search: searchQuery || undefined,
    sort: sortBy || undefined,
  });

  const allAds = ads || [];
  const totalPages = Math.ceil(allAds.length / perPage);
  const paged = allAds.slice((page - 1) * perPage, page * perPage);

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-bg-secondary">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 mb-10 px-4 sm:px-6 lg:px-8 py-12 bg-primary-700 text-white overflow-hidden rounded-b-2xl sm:rounded-b-3xl">
            <WatermarkBanner />
            <div className="relative">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Browse Ads
              </h1>
              <p className="text-primary-100 mt-2 max-w-2xl">
                Discover premium campaigns and earn rewards for your engagement.
              </p>
              <div className="mt-4 h-1 w-20 bg-secondary-500 rounded-full" />
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-8">
            <div className="flex-1">
              <Input
                placeholder="Search ads by name, brand, or keyword..."
                leftIcon={<Search className="h-4 w-4 text-text-muted" />}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="w-full bg-card-bg border-border-color h-11"
              />
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {/* View toggle */}
              <div className="flex items-center bg-card-bg border border-border-color rounded-xl p-1 h-11 shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  className={cn(
                    'h-9 w-9 rounded-lg flex items-center justify-center transition-colors',
                    viewMode === 'grid'
                      ? 'bg-primary-700 text-white shadow-sm'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-secondary'
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  className={cn(
                    'h-9 w-9 rounded-lg flex items-center justify-center transition-colors',
                    viewMode === 'list'
                      ? 'bg-primary-700 text-white shadow-sm'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-secondary'
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2 bg-card-bg border border-border-color rounded-xl px-3 h-11 shadow-sm min-w-[11rem]">
                <SlidersHorizontal className="h-4 w-4 text-text-muted shrink-0" />
                <Select
                  options={sortOptions}
                  value={sortBy}
                  onChange={setSortBy}
                  className="w-full [&>button]:border-0 [&>button]:bg-transparent [&>button]:px-0 [&>button]:shadow-none"
                />
              </div>
            </div>
          </div>

          {/* Industry Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-border-color">
            {industryTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setSelectedIndustry(tab.value); setPage(1); }}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all border',
                  selectedIndustry === tab.value
                    ? 'bg-primary-700 text-white border-primary-700 shadow-sm'
                    : 'bg-card-bg text-text-secondary border-border-color hover:border-primary-300 hover:text-primary-700'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-text-secondary">
              <span className="font-semibold text-text-primary">{allAds.length}</span> ads found
            </p>
          </div>

          {/* Loading */}
          {isLoading ? (
            <div className={cn('py-4', viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'flex flex-col gap-4')}>
              {Array.from({ length: 8 }).map((_, i) => (
                viewMode === 'grid' ? <SkeletonAdCard key={i} /> : <SkeletonAdListItem key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-card-bg rounded-2xl border border-border-color">
              <AlertTriangle className="h-12 w-10 text-danger-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-text-primary mb-1">Failed to load ads</h3>
              <p className="text-sm text-text-secondary">Please try again later.</p>
            </div>
          ) : paged.length === 0 ? (
            <EmptyState
              icon={<EyeOff className="h-full w-full" />}
              title="No ads found"
              description="Try adjusting your search or filters to find what you're looking for."
              actionLabel="Clear filters"
              onAction={() => {
                setSearchQuery('');
                setSelectedIndustry('');
                setSortBy('trending');
                setPage(1);
              }}
              size="md"
            />
          ) : (
            <motion.div
              layout
              className={cn(
                'py-4',
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'flex flex-col gap-4'
              )}
            >
              {paged.map((ad, i) => (
                <motion.div
                  key={ad.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {viewMode === 'grid' ? (
                    <AdCard ad={ad} />
                  ) : (
                    <AdListItem ad={ad} />
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-12 gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 h-10 rounded-lg text-sm font-medium border border-border-color text-text-secondary hover:bg-card-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-card-bg"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'w-10 h-10 rounded-lg text-sm font-medium transition-colors border',
                    p === page
                      ? 'bg-primary-700 text-white border-primary-700 shadow-sm'
                      : 'bg-card-bg border-border-color text-text-secondary hover:bg-bg-secondary'
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 h-10 rounded-lg text-sm font-medium border border-border-color text-text-secondary hover:bg-card-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-card-bg"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
