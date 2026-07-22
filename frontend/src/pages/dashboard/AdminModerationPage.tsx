import { Card, CardHeader } from '@/components/ui/Card';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useModerationQueue, useModerateReview } from '@/hooks/useAdminTools';
import { formatDate } from '@/lib/utils';
import { ShieldCheck, Check, X, Star } from 'lucide-react';

export function AdminModerationPage() {
  const { t } = useTranslation();
  const { data: queue = [], isLoading } = useModerationQueue();
  const moderate = useModerateReview();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('dashboard.adminModeration.title')}</h1>
        <p className="text-sm text-text-secondary mt-1">{t('dashboard.adminModeration.subtitle')}</p>
      </div>

      <Card>
        <CardHeader
          title={t('dashboard.adminModeration.pendingMedia')}
          subtitle={t('dashboard.adminModeration.awaitingReview', { count: queue.length })}
        />
        {isLoading ? (
          <p className="py-8 text-center text-sm text-text-muted">{t('dashboard.common.loading')}</p>
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
                className="flex flex-col gap-3 rounded-xl border border-border-color p-4 sm:flex-row sm:items-start"
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
    </div>
  );
}
