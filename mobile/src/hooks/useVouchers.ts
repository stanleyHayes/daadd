import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export type VoucherStatus = 'issued' | 'claimed' | 'redeemed' | 'expired' | 'revoked';

export interface Voucher {
  id: string;
  code: string;
  amount_tokens: number;
  amount: number;
  status: VoucherStatus;
  message: string;
  direction: 'sent' | 'received';
  expires_at: string;
  claimed_at?: string;
  redeemed_at?: string;
  created_at: string;
}

/** Vouchers the signed-in user has sent or received. */
export function useMyVouchers() {
  return useQuery({
    queryKey: ['vouchers'],
    queryFn: async (): Promise<{ sent: Voucher[]; received: Voucher[] }> => {
      const res = await api.get('/vouchers');
      const d = res.data?.data || {};
      return { sent: d.sent || [], received: d.received || [] };
    },
    staleTime: 60 * 1000,
  });
}

export function useIssueVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { amount_tokens: number; message?: string }): Promise<Voucher> => {
      const res = await api.post('/vouchers', input);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vouchers'] });
      qc.invalidateQueries({ queryKey: ['rewards'] });
      qc.invalidateQueries({ queryKey: ['rewardBalance'] });
    },
  });
}

export function useClaimVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string): Promise<Voucher> => {
      const res = await api.post('/vouchers/claim', { code });
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vouchers'] }),
  });
}

export interface VoucherRedeemResult {
  voucher_id: string;
  discount: number;
  original_amount: number | null;
  final_amount: number | null;
  amount_tokens: number;
}

export function useRedeemVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { code: string; purchase_amount?: number }): Promise<VoucherRedeemResult> => {
      const res = await api.post('/vouchers/redeem', input);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vouchers'] }),
  });
}

/** Human-friendly extraction of an API error message. */
export function voucherError(err: any): string {
  return err?.response?.data?.message || 'Something went wrong. Please try again.';
}
