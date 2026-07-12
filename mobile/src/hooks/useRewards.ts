import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Reward } from '@/types';

export function useRewards() {
  return useQuery({
    queryKey: ['rewards'],
    queryFn: async (): Promise<Reward[]> => {
      const res = await api.get('/rewards');
      return res.data.data || [];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useRewardBalance() {
  return useQuery({
    queryKey: ['rewardBalance'],
    queryFn: async (): Promise<{ balance: number; currency: string }> => {
      const res = await api.get('/rewards/balance');
      return res.data.data || { balance: 0, currency: 'USD' };
    },
    staleTime: 1 * 60 * 1000,
  });
}

export function useClaimReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (adId: string): Promise<Reward> => {
      const res = await api.post('/rewards/claim', { adId });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['rewardBalance'] });
    },
  });
}
