import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface RedemptionQR {
  redemption_id: string;
  qr: string;
  signature: string;
  expires_at: string;
}

export interface ScanResult {
  redemption_id: string;
  customer_name: string;
  tokens: number;
  expires_at: string;
}

export interface ValidateResult {
  purchase_amount: number;
  discount: number;
  final_amount: number;
  tokens_used: number;
  customer_name: string;
}

export interface ConfirmResult {
  tokens_used: number;
  discount: number;
  new_balance: number;
}

export function useGenerateRedemptionQR() {
  return useMutation({
    mutationFn: async (tokens: number): Promise<RedemptionQR> => {
      const res = await api.post('/redemption/qr', { tokens });
      return res.data.data;
    },
  });
}

export function useScanRedemption() {
  return useMutation({
    mutationFn: async (payload: {
      qr: string;
      signature: string;
    }): Promise<ScanResult> => {
      const res = await api.post('/redemption/scan', payload);
      return res.data.data;
    },
  });
}

export function useValidateRedemption() {
  return useMutation({
    mutationFn: async (payload: {
      redemption_id: string;
      purchase_amount: number;
    }): Promise<ValidateResult> => {
      const res = await api.post('/redemption/validate', payload);
      return res.data.data;
    },
  });
}

export function useConfirmRedemption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (redemptionId: string): Promise<ConfirmResult> => {
      const res = await api.post('/redemption/confirm', {
        redemption_id: redemptionId,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewardBalance'] });
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
    },
  });
}

export function extractApiError(error: unknown, fallback: string): string {
  const message = (error as any)?.response?.data?.message;
  return typeof message === 'string' && message ? message : fallback;
}
