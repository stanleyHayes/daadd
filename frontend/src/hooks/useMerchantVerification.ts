import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse } from '@/types';

/**
 * Merchant verification (KYC). A merchant submits their business + owner details
 * once and an admin reviews them. Until the status is `verified`, the merchant
 * cannot confirm redemptions — the gate lives on the backend (utils/merchant-gate)
 * and is surfaced here as `gate.can_transact`.
 */
export type VerificationStatus = 'pending' | 'verified' | 'restricted' | 'suspended';

export const ID_TYPES = ['ghana_card', 'passport', 'drivers_licence', 'voter_id', 'other'] as const;
export type IdType = (typeof ID_TYPES)[number];

export interface MerchantVerification {
  status: VerificationStatus;
  business_name: string;
  business_registration_number: string;
  business_address: string;
  business_city: string;
  contact_phone: string;
  owner_name: string;
  owner_id_type: IdType;
  owner_id_last4: string;
  settlement_provider: string;
  settlement_account_last4: string;
  settlement_bank_code?: string;
  settlement_account_name?: string;
  settlement_connected?: boolean;
  review_notes: string;
  submitted_at?: string;
  reviewed_at?: string;
}

export interface Bank {
  name: string;
  code: string;
  type?: string;
}

export interface MerchantGate {
  gated: boolean;
  status: VerificationStatus;
  can_transact: boolean;
  reason: string;
}

/** The full form. Sensitive fields are masked to last-4 the moment they land. */
export interface VerificationSubmission {
  business_name: string;
  business_registration_number: string;
  business_address: string;
  business_city: string;
  contact_phone: string;
  owner_name: string;
  owner_id_type: IdType;
  owner_id_number: string;
  settlement_provider: string;
  settlement_account: string;
}

export function useMyVerification() {
  return useQuery({
    queryKey: ['merchantVerification', 'me'],
    queryFn: async () => {
      const res = await api.get<
        ApiResponse<{ verification: MerchantVerification | null; gate: MerchantGate }>
      >('/merchants/verification');
      return res.data.data;
    },
  });
}

export function useSubmitVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<VerificationSubmission>) => {
      const res = await api.put<ApiResponse<MerchantVerification>>('/merchants/verification', input);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['merchantVerification', 'me'] }),
  });
}

// --- Admin review ---------------------------------------------------------

export interface MerchantQueueItem extends MerchantVerification {
  _id: string;
  merchant_id: string;
  merchant?: { _id: string; name: string; email: string } | null;
}

export function useMerchantQueue(status: VerificationStatus) {
  return useQuery({
    queryKey: ['merchantQueue', status],
    queryFn: async () => {
      const res = await api.get<ApiResponse<MerchantQueueItem[]>>(
        `/merchants/admin?status=${status}`
      );
      return res.data.data;
    },
  });
}

export function useSetMerchantStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: VerificationStatus; review_notes?: string }) => {
      const res = await api.patch<ApiResponse<MerchantQueueItem>>(
        `/merchants/admin/${input.id}`,
        { status: input.status, review_notes: input.review_notes }
      );
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['merchantQueue'] }),
  });
}

// --- Settlement (self-service PSP subaccount) ------------------------------

export function useSettlementBanks(enabled: boolean) {
  return useQuery({
    queryKey: ['settlementBanks'],
    enabled,
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const res = await api.get<ApiResponse<Bank[]>>('/merchants/settlement/banks');
      return res.data.data;
    },
  });
}

export function useResolveAccount() {
  return useMutation({
    mutationFn: async (input: { bank_code: string; account_number: string }) => {
      const res = await api.post<ApiResponse<{ account_name: string }>>('/merchants/settlement/resolve', input);
      return res.data.data;
    },
  });
}

export function useConnectSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { bank_code: string; account_number: string; provider?: string; type?: string }) => {
      const res = await api.post<ApiResponse<MerchantVerification>>('/merchants/settlement/connect', input);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['merchantVerification', 'me'] }),
  });
}
