import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import type { User, ApiResponse, AdvertiserApproval } from '@/types';

async function refreshMe(setUser: (u: User) => void): Promise<User | undefined> {
  const res = await api.get<ApiResponse<User>>('/auth/me');
  if (res.data.data) setUser(res.data.data);
  return res.data.data;
}

/** Email verification — request a code (mirrors the age-verify OTP flow). */
export function useRequestEmailVerification() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiResponse<{ sent: boolean; dev_code?: string }>>(
        '/auth/verify-email/request'
      );
      return res.data.data;
    },
  });
}

/** Email verification — confirm the code; returns the refreshed user. */
export function useConfirmEmailVerification() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async (code: string) => {
      const res = await api.post<ApiResponse<User>>('/auth/verify-email/confirm', { code });
      return res.data.data;
    },
    onSuccess: (user) => {
      if (user) setUser(user);
    },
  });
}

/** Billing setup (stub for real payment integration); refreshes the user. */
export function useSetupBilling() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async () => {
      await api.post('/billing/setup');
      return refreshMe(setUser);
    },
  });
}

// ---- Admin: advertiser approval ----
export interface AdvertiserReview {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
  email_verified: boolean;
  advertiser_approval: AdvertiserApproval;
  billing_ready: boolean;
  created_at: string;
}

export function useAdvertiserReviews(status: AdvertiserApproval = 'pending') {
  return useQuery({
    queryKey: ['admin', 'advertisers', status],
    queryFn: async () => {
      const res = await api.get<ApiResponse<AdvertiserReview[]>>(
        `/admin/advertisers?status=${status}`
      );
      return res.data.data;
    },
  });
}

export function useSetAdvertiserApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' }) => {
      const res = await api.post<ApiResponse<AdvertiserReview>>(`/admin/advertisers/${id}/${action}`);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'advertisers'] });
    },
  });
}
