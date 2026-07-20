import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse } from '@/types';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  avatar_url?: string;
  streak: number;
  tokens: number;
}

export interface StreakInfo {
  streak: number;
  last_reward_date: string | null;
  bonus_active: boolean;
  bonus_threshold: number;
  bonus_multiplier: number;
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<LeaderboardEntry[]>>('/rewards/leaderboard');
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
