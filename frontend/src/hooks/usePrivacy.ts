import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse } from '@/types';

/**
 * A user's data-protection rights (Ghana DPA): see and change consent, get a
 * copy of their data, request erasure. All operate on the signed-in account.
 */
export const CONSENT_PURPOSES = ['marketing', 'personalisation', 'location', 'analytics'] as const;
export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];

export type ConsentState = Record<ConsentPurpose, boolean>;

export function useConsents() {
  return useQuery({
    queryKey: ['privacy', 'consents'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ consents: ConsentState }>>('/privacy/consents');
      return res.data.data.consents;
    },
  });
}

export function useUpdateConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { purpose: ConsentPurpose; granted: boolean }) => {
      const res = await api.put<ApiResponse<ConsentState>>('/privacy/consents', input);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['privacy', 'consents'] }),
  });
}

/** Fetches the data export as a downloadable blob. */
export function useDataExport() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.get<ApiResponse<Record<string, unknown>>>('/privacy/export');
      return res.data.data;
    },
  });
}

export function useDeleteMyData() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiResponse<{ deleted: boolean }>>('/privacy/delete');
      return res.data.data;
    },
  });
}
