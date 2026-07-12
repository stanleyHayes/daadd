import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse } from '@/types';

export interface ABTestMetrics {
  creativeId: string;
  variant: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions?: number;
}

export interface CreativeBase {
  id: string;
  title?: string;
  description?: string;
}

export interface ABTestResults {
  testId: string;
  campaignId: string;
  controlCreative: CreativeBase & { metrics: ABTestMetrics };
  variantCreatives: (CreativeBase & { metrics: ABTestMetrics })[];
  winner?: { creativeId: string; variant: string };
  isComplete: boolean;
}

export interface CreateABTestRequest {
  campaignId: string;
  controlCreativeId: string;
  variantCreativeIds: string[];
  trafficAllocation?: number;
}

export function useCreateABTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: CreateABTestRequest) => {
      const { data } = await api.post(
        `/campaigns/${request.campaignId}/ab-test/create`,
        {
          controlCreativeId: request.controlCreativeId,
          variantCreativeIds: request.variantCreativeIds,
          trafficAllocation: request.trafficAllocation,
        }
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-test'] });
      queryClient.invalidateQueries({ queryKey: ['creatives'] });
    },
  });
}

export function useABTestResults(campaignId: string | null) {
  return useQuery({
    queryKey: ['ab-test', 'results', campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      const { data } = await api.get<ApiResponse<ABTestResults>>(
        `/campaigns/${campaignId}/ab-test/results`
      );
      return data.data;
    },
    enabled: !!campaignId,
  });
}

export function useMarkWinner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ testId, creativeId }: { testId: string; creativeId: string }) => {
      const { data } = await api.post('/campaigns/ab-test/mark-winner', {
        testId,
        creativeId,
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-test'] });
    },
  });
}

export function useABMetrics(campaignId: string | null) {
  return useQuery({
    queryKey: ['ab-test', 'metrics', campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      const { data } = await api.get<ApiResponse<{ metrics: ABTestMetrics[] }>>(
        `/campaigns/${campaignId}/ab-test/metrics`
      );
      return data.data.metrics;
    },
    enabled: !!campaignId,
  });
}
