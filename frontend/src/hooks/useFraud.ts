import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse } from '@/types';

/**
 * Admin fraud review. Signals are raised by the backend fraud detector from real
 * money-path events; here an admin scans, reviews, and resolves them. Acting on a
 * merchant (restrict/suspend) is done from the merchant verification queue.
 */
export type FraudStatus = 'open' | 'reviewing' | 'dismissed' | 'actioned';
export type FraudSeverity = 'low' | 'medium' | 'high' | 'critical';
export type FraudType = 'redemption_velocity' | 'merchant_surge' | 'collusion' | 'reward_farming';

export interface FraudSignal {
  _id: string;
  subject_type: 'user' | 'merchant' | 'pair';
  subject_id: string;
  subject_label: string;
  type: FraudType;
  severity: FraudSeverity;
  metric: string;
  value: number;
  threshold: number;
  window_hours: number;
  evidence: Record<string, unknown>;
  description: string;
  status: FraudStatus;
  review_notes: string;
  detected_at: string;
}

export function useFraudSignals(status: FraudStatus) {
  return useQuery({
    queryKey: ['fraud', status],
    queryFn: async () => {
      const res = await api.get<ApiResponse<FraudSignal[]>>(`/fraud?status=${status}`);
      return res.data.data;
    },
  });
}

export function useScanFraud() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiResponse<{ created: number; refreshed: number }>>('/fraud/scan');
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fraud'] }),
  });
}

export function useSetFraudStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: FraudStatus; review_notes?: string }) => {
      const res = await api.patch<ApiResponse<FraudSignal>>(`/fraud/${input.id}`, {
        status: input.status,
        review_notes: input.review_notes,
      });
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fraud'] }),
  });
}
