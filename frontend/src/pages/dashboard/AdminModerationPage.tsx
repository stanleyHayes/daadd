import { Skeleton } from '@/components/ui/Skeleton';
import { Card, CardHeader } from '@/components/ui/Card';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useModerationQueue, useModerateReview } from '@/hooks/useAdminTools';
import { formatDate } from '@/lib/utils';
import { ShieldCheck, Check, X, Star } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageTransition } from '@/components/ui/PageTransition';

export function AdminModerationPage() {
  const { t } = useTranslation();
  const { data: queue = [], isLoading } = useModerationQueue();
  const moderate = useModerateReview();

  return (
    <PageTransition><div className="mx-auto max-w-[1500px] space-y-6">
      <PageHeader title={t('dashboard.adminModeration.title')} subtitle={t('dashboard.adminModeration.subtitle')} />

      <Card shape="soft" className="border-white/80 shadow-[0_14px_40px_rgba(7,20,49,0.055)] dark:border-slate-800">
        <CardHeader
          title={t('dashboard.adminModeration.pendingMedia')}
          subtitle={t('dashboard.adminModeration.awaitingReview', { count: queue.length })}
        />
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : queue.length === 0 ? (
          <EmptyState
            variant="plain"
            icon={<ShieldCheck />}
            title={t('dashboard.adminModeration.emptyTitle')}
            description={t('dashboard.adminModeration.emptyDesc')}
          />
        ) : (
          <ul className="space-y-4">
            {queue.map((review) => (
              <li
                key={review._id}
                className="flex flex-col gap-4 rounded-[22px] border border-border-color bg-bg-secondary/50 p-4 transition hover:border-secondary-400 sm:flex-row sm:items-start dark:bg-slate-800/40"
              >
                {review.photo_url ? (
                  <img
                    src={review.photo_url}
                    alt=""
                    className="h-24 w-24 shrink-0 rounded-lg object-cover"
                  />
                ) : review.video_url ? (
                  <video src={review.video_url} controls className="h-24 w-40 shrink-0 rounded-lg" />
                ) : null}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary">
                      {review.user?.name || t('dashboard.common.user')}
                    </p>
                    <span className="flex items-center gap-0.5 text-xs text-text-muted">
                      <Star className="h-3 w-3 fill-secondary-500 text-secondary-500" />
                      {review.rating}
                    </span>
                    <span className="text-xs text-text-muted">{formatDate(review.created_at)}</span>
                  </div>
                  {review.comment && (
                    <p className="mt-1 text-sm text-text-secondary">{review.comment}</p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    onClick={() => moderate.mutate({ id: review._id, approve: true })}
                    loading={moderate.isPending}
                  >
                    <Check className="h-4 w-4 mr-1" /> {t('dashboard.common.approve')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moderate.mutate({ id: review._id, approve: false })}
                    loading={moderate.isPending}
                  >
                    <X className="h-4 w-4 mr-1" /> {t('dashboard.common.reject')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div></PageTransition>
  );
}
