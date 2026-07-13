import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Reward, RewardStatus } from '@/types';

/** Maps a raw backend reward document (snake_case) to the mobile Reward shape. */
function normalizeReward(raw: any): Reward {
  const isRedemption = raw.type === 'redemption' || (raw.amount ?? 0) < 0;
  const statusMap: Record<string, RewardStatus> = {
    pending: 'pending',
    approved: 'credited',
    paid: 'credited',
    redeemed: 'redeemed',
    expired: 'expired',
  };
  return {
    id: String(raw._id || raw.id),
    amount: raw.amount ?? 0,
    currency: raw.currency || 'USD',
    campaignName: raw.campaign_name || raw.campaignName || (isRedemption ? 'Wallet' : ''),
    adTitle: raw.ad_title || raw.adTitle || raw.note || (isRedemption ? 'Token Redemption' : ''),
    status: isRedemption ? 'redeemed' : (statusMap[raw.status] || 'pending'),
    claimedAt: raw.created_at || raw.claimedAt || new Date().toISOString(),
    creditedAt: raw.credited_at || raw.creditedAt,
    redeemedAt: raw.redeemed_at || raw.redeemedAt || (isRedemption ? raw.created_at : undefined),
  };
}

export function useRewards() {
  return useQuery({
    queryKey: ['rewards'],
    queryFn: async (): Promise<Reward[]> => {
      const res = await api.get('/rewards', { params: { limit: 100 } });
      const list = res.data?.data || [];
      return (Array.isArray(list) ? list : []).map(normalizeReward);
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
      const res = await api.post(`/rewards/claim/${adId}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['rewardBalance'] });
    },
  });
}
