import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse } from '@/types';

/**
 * The signed-in user's referral code, share link, and activation stats
 * (Phase 3.2). Counts only — invitee identities are never exposed.
 */
export interface ReferralInfo {
  code: string;
  share_url: string;
  activated_count: number;
  pending_count: number;
  bonus_tokens: number;
}

export function useReferral() {
  return useQuery({
    queryKey: ['referral', 'me'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ReferralInfo>>('/referrals/me');
      return res.data.data;
    },
  });
}
