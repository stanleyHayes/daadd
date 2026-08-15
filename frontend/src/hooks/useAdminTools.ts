import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse } from '@/types';
import toast from 'react-hot-toast';

export interface PendingReview {
  _id: string;
  campaign_id: string;
  rating: number;
  comment: string;
  photo_url?: string;
  video_url?: string;
  media_status: 'none' | 'pending' | 'approved' | 'rejected';
  created_at: string;
  user?: { _id: string; name: string; avatar_url?: string };
}

export interface VipCriteria {
  min_merchant_visits: number;
  min_purchases: number;
  min_reviews: number;
  min_engagement_score: number;
}

/** Reviews whose uploaded media is awaiting moderation. */
export function useModerationQueue() {
  return useQuery({
    queryKey: ['moderationQueue'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PendingReview[]>>('/reviews/moderation');
      return res.data.data;
    },
  });
}

export function useModerateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const res = await api.post(`/reviews/${id}/moderate`, { approve });
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['moderationQueue'] });
      toast.success(variables.approve ? 'Media approved — bonus released' : 'Media rejected');
    },
    onError: () => toast.error('Could not moderate that review'),
  });
}

export function useVipCriteria() {
  return useQuery({
    queryKey: ['vipCriteria'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ criteria: VipCriteria; defaults: VipCriteria }>>(
        '/admin/vip-criteria'
      );
      return res.data.data;
    },
  });
}

export function useUpdateVipCriteria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (criteria: Partial<VipCriteria>) => {
      const res = await api.put<ApiResponse<{ criteria: VipCriteria }>>(
        '/admin/vip-criteria',
        criteria
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vipCriteria'] });
      queryClient.invalidateQueries({ queryKey: ['vip'] });
      toast.success('VIP criteria updated');
    },
    onError: () => toast.error('Could not update the criteria'),
  });
}

export interface StreakTier {
  min: number;
  multiplier: number;
}

export interface MultiplierRules {
  streak_tiers: StreakTier[];
  vip_multiplier: number;
  bonus_threshold: number;
}

export interface MultiplierLimits {
  max_streak_multiplier: number;
  max_vip_multiplier: number;
  max_effective_multiplier: number;
}

/** Admin-configurable reward-multiplier rules (Phase 3.3). */
export function useMultiplierRules() {
  return useQuery({
    queryKey: ['multiplierRules'],
    queryFn: async () => {
      const res = await api.get<
        ApiResponse<{ rules: MultiplierRules; defaults: MultiplierRules; limits: MultiplierLimits }>
      >('/admin/multiplier-rules');
      return res.data.data;
    },
  });
}

export function useUpdateMultiplierRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rules: MultiplierRules) => {
      const res = await api.put<ApiResponse<{ rules: MultiplierRules }>>(
        '/admin/multiplier-rules',
        rules
      );
      return res.data.data;
    },
    onSuccess: () => {
      // The server re-clamps, so trust its response for what actually persisted.
      queryClient.invalidateQueries({ queryKey: ['multiplierRules'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });
      queryClient.invalidateQueries({ queryKey: ['vip'] });
      toast.success('Multiplier rules updated');
    },
    onError: () => toast.error('Could not update multiplier rules'),
  });
}
