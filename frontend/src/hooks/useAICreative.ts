import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse } from '@/types';

export interface CreativeVariation {
  headline: string;
  bodyText: string;
  cta: string;
  tone: 'professional' | 'casual' | 'playful' | 'urgent' | 'emotional';
  confidence: number;
}

export interface GenerateCreativesRequest {
  campaignId: string;
  productName: string;
  audience?: string;
  goal?: 'awareness' | 'consideration' | 'conversion';
  tone?: string;
  language?: string;
  numVariations?: number;
}

export interface GenerateCreativesResponse {
  campaignId: string;
  variations: CreativeVariation[];
  summary: string;
  language?: string;
  generatedAt: Date;
}

export interface RefineCreativesRequest {
  campaignId: string;
  feedback: string;
  variations: CreativeVariation[];
}

export interface SaveCreativesRequest {
  campaignId: string;
  variations: CreativeVariation[];
  language?: string;
}

export interface CreativePerformance {
  bestPerformer: string | null;
  aiGeneratedStats: {
    total: number;
    avgConfidence: number;
  };
  recommendations: string[];
}

export function useGenerateCreatives() {
  return useMutation({
    mutationFn: async (request: GenerateCreativesRequest) => {
      const { data } = await api.post<ApiResponse<GenerateCreativesResponse>>('/ai/creative/generate', request);
      return data.data;
    },
  });
}

export function useRefineCreatives() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: RefineCreativesRequest) => {
      const { data } = await api.post<ApiResponse<{ refined: number; variations: CreativeVariation[] }>>(
        '/ai/creative/refine',
        request
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-performance'] });
    },
  });
}

export function useSaveCreatives() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: SaveCreativesRequest) => {
      const { data } = await api.post('/ai/creative/save', request);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creatives'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useCreativePerformance(campaignId: string | null) {
  return useQuery({
    queryKey: ['creative-performance', campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      const { data } = await api.get<ApiResponse<CreativePerformance>>(`/ai/creative/performance/${campaignId}`);
      return data.data;
    },
    enabled: !!campaignId,
  });
}
