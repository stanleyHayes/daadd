import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse } from '@/types';

export type LeaderboardType = 'earner' | 'active' | 'reviews' | 'visits' | 'streak';
export type LeaderboardPeriod = 'week' | 'month' | 'all';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  avatar_url?: string;
  streak: number;
  vip?: boolean;
  value: number;
  unit: string;
  tokens: number;
}

export interface StreakDetail {
  count: number;
  last_at: string | null;
  multiplier: number;
}

export interface StreakInfo {
  streak: number;
  last_reward_date: string | null;
  bonus_active: boolean;
  bonus_threshold: number;
  bonus_multiplier: number;
  tiers: { min: number; multiplier: number }[];
  streaks: Record<string, StreakDetail>;
}

export interface VipStatus {
  tier: 'none' | 'vip';
  since: string | null;
  multiplier: number;
  engagement_score: number;
  metrics: {
    merchant_visits: number;
    purchases: number;
    reviews: number;
    ads_viewed: number;
    longest_streak: number;
  };
  criteria: {
    min_merchant_visits: number;
    min_purchases: number;
    min_reviews: number;
    min_engagement_score: number;
  };
}

export function useLeaderboard(
  type: LeaderboardType = 'earner',
  period: LeaderboardPeriod = 'all'
) {
  return useQuery({
    queryKey: ['leaderboard', type, period],
    queryFn: async () => {
      const res = await api.get<ApiResponse<LeaderboardEntry[]>>('/rewards/leaderboard', {
        params: { type, period },
      });
      return res.data.data;
    },
  });
}

export function useStreak() {
  return useQuery({
    queryKey: ['streak'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<StreakInfo>>('/rewards/streak');
      return res.data.data;
    },
  });
}

export function useVipStatus() {
  return useQuery({
    queryKey: ['vip'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<VipStatus>>('/rewards/vip');
      return res.data.data;
    },
  });
}
