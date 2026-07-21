import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  items?: ReceiptItem[];
  receipt_no?: string;
}

export interface ConfirmResult {
  tokens_used: number;
  discount: number;
  new_balance: number;
}

export interface OutletOption {
  id: string;
  name: string;
  city: string;
  address: string;
  business: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unit_price: number;
}

export interface Receipt {
  receipt_no: string;
  status: string;
  date: string;
  customer_name: string;
  merchant_name: string;
  campaign: string;
  outlet: { name: string; address: string; city: string; phone: string } | null;
  items: ReceiptItem[];
  purchase_amount: number;
  discount_amount: number;
  final_amount: number;
  tokens_used: number;
}

/** Search active outlets so the customer can name the branch they're in. */
export function useOutletSearch(query: string) {
  return useQuery({
    queryKey: ['outletSearch', query],
    queryFn: async (): Promise<OutletOption[]> => {
      const res = await api.get('/outlets/search', { params: query ? { q: query } : {} });
      return res.data.data || [];
    },
    staleTime: 60 * 1000,
  });
}

/** Digital receipt for a completed redemption (either participant). */
export function useReceipt(redemptionId?: string) {
  return useQuery({
    queryKey: ['receipt', redemptionId],
    enabled: !!redemptionId,
    queryFn: async (): Promise<Receipt> => {
      const res = await api.get(`/redemption/${redemptionId}/receipt`);
      return res.data.data;
    },
  });
}

export function useGenerateRedemptionQR() {
  return useMutation({
    mutationFn: async (payload: {
      tokens: number;
      outlet_id?: string;
      purchase_amount?: number;
    }): Promise<RedemptionQR> => {
      const res = await api.post('/redemption/qr', payload);
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
      // Optional: which of the merchant's active campaigns this sale counts
      // toward. Server verifies ownership and falls back when omitted/invalid.
      campaign_id?: string;
      // Optional itemised basket; the bill can be derived from it.
      items?: ReceiptItem[];
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
