
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

import { Star, Send, Loader2, MessageSquareText, ImagePlus, Gift, X } from 'lucide-react';
import { useReviews, useReviewSummary, useSubmitReview } from '@/hooks/useReviews';
import { useAuthStore } from '@/stores/auth.store';
import { formatDate } from '@/lib/utils';
import { SkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

interface ReviewsSectionProps {
  campaignId: string;
}

function StarRating({ rating, onRate }: { rating: number; onRate: (r: number) => void }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onRate(star)}
          className="focus:outline-none transition-colors"
        >
          <Star
            className={`h-6 w-6 ${
              star <= rating ? 'fill-secondary-500 text-secondary-500' : 'text-text-muted'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

interface Review {
  user?: { name?: string };
  created_at: string;
  rating: number;
  comment?: string;
  photo_url?: string;
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="border-b border-border-color pb-4 last:border-b-0">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900 ring-2 ring-card-bg shadow-sm flex items-center justify-center">
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-300">
              {(review.user?.name?.charAt(0) || 'A').toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {review.user?.name || 'Anonymous'}
            </p>
            <p className="text-xs text-text-secondary">
              {formatDate(review.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < review.rating
                  ? 'fill-secondary-500 text-secondary-500'
                  : 'text-text-muted'
              }`}
            />
          ))}
        </div>
      </div>
      {review.comment && (
        <p className="text-sm text-text-secondary mt-2">{review.comment}</p>
      )}
      {review.photo_url && (
        <img
          src={review.photo_url}
          alt="Reviewer's photo"
          loading="lazy"
          className="mt-3 max-h-56 rounded-lg border border-border-color object-cover"
        />
      )}
    </div>
  );
}

export function ReviewsSection({ campaignId }: ReviewsSectionProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { summary, isLoading: summaryLoading } = useReviewSummary(campaignId);
  const { reviews, isLoading: reviewsLoading } = useReviews(campaignId);
  const submitReview = useSubmitReview();

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const photoPreview = photo ? URL.createObjectURL(photo) : null;

  const resetForm = () => {
    setRating(0);
    setComment('');
    setPhoto(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!rating) return;
    await submitReview.mutateAsync({
      campaign_id: campaignId,
      rating,
      comment: comment || undefined,
      photo,
    });
    resetForm();
  };

  return (
    <Card className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Reviews</h3>
          {!summaryLoading && summary && summary.total_reviews > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(summary.average_rating)
                        ? 'fill-secondary-500 text-secondary-500'
                        : 'text-text-muted'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-text-primary">
                {summary.average_rating.toFixed(1)}
              </span>
              <span className="text-sm text-text-secondary">
                ({summary.total_reviews} {summary.total_reviews === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
        </div>
        {isAuthenticated && !showForm && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowForm(true)}
          >
            Write Review
          </Button>
        )}
      </div>

      {showForm && isAuthenticated && (
        <Card className="mb-6 bg-bg-secondary border border-border-color">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Rating
              </label>
              <StarRating rating={rating} onRate={setRating} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Comment (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this ad..."
                className="w-full px-3 py-2 border border-border-color rounded-lg bg-card-bg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Photo (optional)
              </label>
              {photoPreview ? (
                <div className="relative inline-block">
                  <img
                    src={photoPreview}
                    alt="Your review"
                    className="h-28 w-28 rounded-lg object-cover border border-border-color"
                  />
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-danger-600 text-white flex items-center justify-center shadow"
                    aria-label="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border-color px-4 py-2.5 text-sm text-text-secondary hover:border-primary-400 hover:text-text-primary transition-colors">
                  <ImagePlus className="h-4 w-4" />
                  Add a photo of the place
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                  />
                </label>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-secondary-600 dark:text-secondary-400">
              <Gift className="h-3.5 w-3.5" /> Earn 3 tokens for reviewing — +2 more with a photo.
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSubmit}
                disabled={!rating || submitReview.isPending}
                icon={
                  submitReview.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )
                }
              >
                Submit Review
              </Button>
              <button
                onClick={resetForm}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      {reviewsLoading ? (
        <div className="py-4">
          <SkeletonList items={3} />
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquareText className="h-full w-full" />}
          title="No reviews yet"
          description="Be the first to share your thoughts on this ad."
          actionLabel={isAuthenticated ? 'Write a Review' : undefined}
          onAction={isAuthenticated ? () => setShowForm(true) : undefined}
          size="sm"
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </Card>
  );
}
