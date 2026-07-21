import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export interface Review {
  id: string;
  user_id: string;
  campaign_id: string;
  rating: number;
  comment?: string;
  expectation?: string;
  reality?: string;
  redemption_id?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ReviewSummary {
  average_rating: number;
  total_reviews: number;
  distribution: Record<number, number>;
}

export interface ReviewsResponse {
  success: boolean;
  data: Review[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ReviewSummaryResponse {
  success: boolean;
  data: ReviewSummary;
}

export function useReviews(campaignId: string, page = 1, limit = 10) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['reviews', campaignId, page, limit],
    queryFn: async () => {
      const res = await api.get<ReviewsResponse>(`/reviews/campaign/${campaignId}`, {
        params: { page, limit },
      });
      return res.data;
    },
    enabled: !!campaignId,
  });

  return { reviews: data?.data || [], total: data?.pagination?.total || 0, isLoading, error };
}

export function useReviewSummary(campaignId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['reviewSummary', campaignId],
    queryFn: async () => {
      const res = await api.get<ReviewSummaryResponse>(`/reviews/campaign/${campaignId}/summary`);
      return res.data;
    },
    enabled: !!campaignId,
  });

  return { summary: data?.data, isLoading, error };
}

/** Record BEFORE-visit expectations so they can be compared with reality. */
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
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.campaign_id] });
      toast.success('Expectations saved — tell us how it went after your visit!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
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
      photo?: File | null;
      video?: File | null;
      // After-visit reality ratings (V2 Area 9).
      satisfaction?: number;
      product_rating?: number;
      service_rating?: number;
      reality_experience?: number;
    }) => {
      const form = new FormData();
      form.append('campaign_id', data.campaign_id);
      form.append('rating', String(data.rating));
      if (data.comment) form.append('comment', data.comment);
      if (data.photo) form.append('photo', data.photo);
      if (data.video) form.append('video', data.video);
      for (const key of ['satisfaction', 'product_rating', 'service_rating', 'reality_experience'] as const) {
        if (data[key]) form.append(key, String(data[key]));
      }
      // Let axios set the multipart boundary (the client default is JSON).
      const res = await api.post('/reviews', form, { headers: { 'Content-Type': undefined } });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.campaign_id] });
      queryClient.invalidateQueries({ queryKey: ['reviewSummary', variables.campaign_id] });
      toast.success('Review submitted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
