import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Reward, ApiResponse } from '@/types';

export function useRewards() {
  return useQuery({
    queryKey: ['rewards'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Reward[]>>('/rewards');
      return res.data.data;
    },
  });
}

export function useClaimReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (adId: string) => {
      const res = await api.post<ApiResponse<Reward>>(`/rewards/claim/${adId}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['rewardBalance'] });
    },
  });
}

export function useRewardBalance() {
  return useQuery({
    queryKey: ['rewardBalance'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ balance: number; total_earned: number }>>('/rewards/balance');
      return res.data.data;
    },
  });
}
