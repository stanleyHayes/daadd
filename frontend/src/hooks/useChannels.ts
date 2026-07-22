import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse } from '@/types';

/**
 * Ad channels — the buying surface for roadmap phases 3-6 (RTB, connected TV,
 * audio, retail media). Only channels an admin has enabled come back, because
 * a channel with no supply agreement behind it should not look purchasable.
 */
export type AdChannelType = 'display' | 'rtb' | 'ctv' | 'audio' | 'retail_media';
export type PricingModel = 'cpm' | 'cpc' | 'cpcv' | 'cpa' | 'flat';

export interface AdChannel {
  _id: string;
  type: AdChannelType;
  name: string;
  provider: string;
  pricing_model: PricingModel;
  base_rate: number;
  specs: Record<string, unknown>;
  is_enabled: boolean;
  billable_unit: string;
}

export interface SpendEstimate {
  channel: string;
  pricing_model: PricingModel;
  billable_unit: string;
  base_rate: number;
  units: Record<string, number>;
  spend: number;
  /** null when there are no impressions to normalise against. */
  effective_cpm: number | null;
}

export interface AuctionSummary {
  submitted: number;
  won: number;
  lost: number;
  timeouts: number;
  /** null when we have not bid at all — not the same as a 0% win rate. */
  winRate: number | null;
  spend: number;
  recent: {
    _id: string;
    exchange: string;
    bid_cpm: number;
    clearing_cpm: number;
    status: string;
    created_at: string;
  }[];
}

export function useChannels() {
  return useQuery({
    queryKey: ['channels'],
    queryFn: async () => (await api.get<ApiResponse<AdChannel[]>>('/channels')).data.data,
  });
}

export function useAuctions(campaignId?: string) {
  return useQuery({
    queryKey: ['channels', 'auctions', campaignId],
    enabled: !!campaignId,
    queryFn: async () =>
      (await api.get<ApiResponse<AuctionSummary>>(`/channels/auctions/${campaignId}`)).data.data,
  });
}

export function useEstimateSpend() {
  return useMutation({
    mutationFn: async (input: {
      channel_id: string;
      impressions?: number;
      clicks?: number;
      completedViews?: number;
      conversions?: number;
    }) => (await api.post<ApiResponse<SpendEstimate>>('/channels/estimate', input)).data.data,
  });
}

export function useUpdateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<AdChannel> & { id: string }) =>
      (await api.patch<ApiResponse<AdChannel>>(`/channels/${id}`, input)).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channels'] }),
  });
}
