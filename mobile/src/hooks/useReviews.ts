import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Review } from '@/types';

export interface ReviewSummary {
  average_rating: number;
  total_reviews: number;
  distribution: Record<number, number>;
}

export function useReviews(campaignId: string) {
  return useQuery({
    queryKey: ['reviews', campaignId],
    queryFn: async (): Promise<Review[]> => {
      const res = await api.get(`/reviews/campaign/${campaignId}?limit=10`);
      return res.data.data || [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!campaignId,
  });
}

export function useReviewSummary(campaignId: string) {
  return useQuery({
    queryKey: ['reviewSummary', campaignId],
    queryFn: async (): Promise<ReviewSummary> => {
      const res = await api.get(`/reviews/campaign/${campaignId}/summary`);
      return res.data.data || { average_rating: 0, total_reviews: 0, distribution: {} };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!campaignId,
  });
}

/** Record BEFORE-visit expectations to compare against the actual visit. */
export function useSubmitExpectations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      campaign_id: string;
      experience?: number;
      service?: number;
      product?: number;
      planned_purchase?: string;
    }) => {
      const res = await api.post('/reviews/expectations', data);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.campaign_id] });
    },
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      campaign_id: string;
      rating: number;
      comment?: string;
      // After-visit reality ratings (V2 Area 9).
      satisfaction?: number;
      product_rating?: number;
      service_rating?: number;
      reality_experience?: number;
    }) => {
      const res = await api.post('/reviews', data);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.campaign_id] });
      queryClient.invalidateQueries({ queryKey: ['reviewSummary', variables.campaign_id] });
    },
  });
}
