import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  DashboardKpis,
  DashboardCampaign,
  AIRecommendationItem,
  AnomalyItem,
  BenchmarkData,
  CampaignStory,
  TeamMemberItem,
  AttributionData,
  PaginatedResponse,
} from '@/types';

export function useDashboardKpis() {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: async (): Promise<DashboardKpis> => {
      const res = await api.get('/analytics/dashboard');
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCampaignKpis(campaignId: string) {
  return useQuery({
    queryKey: ['dashboard', 'kpis', campaignId],
    queryFn: async (): Promise<DashboardKpis> => {
      const res = await api.get(`/analytics/dashboard/${campaignId}`);
      return res.data.data;
    },
    enabled: !!campaignId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCampaigns(params?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: ['campaigns', params],
    queryFn: async (): Promise<PaginatedResponse<DashboardCampaign>> => {
      const query: Record<string, string> = { limit: '50' };
      if (params?.status) query.status = params.status;
      if (params?.search) query.search = params.search;

      const res = await api.get('/campaigns', { params: query });
      return res.data.data
        ? {
            data: res.data.data,
            total: res.data.total,
            page: res.data.page,
            limit: res.data.limit,
            hasMore: res.data.page * res.data.limit < res.data.total,
          }
        : { data: [], total: 0, page: 1, limit: 50, hasMore: false };
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async (): Promise<DashboardCampaign> => {
      const res = await api.get(`/campaigns/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useUpdateCampaign(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<DashboardCampaign>): Promise<DashboardCampaign> => {
      const res = await api.patch(`/campaigns/${id}`, updates);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useAIRecommendations(campaignId: string) {
  return useQuery({
    queryKey: ['aiRecommendations', campaignId],
    queryFn: async (): Promise<AIRecommendationItem[]> => {
      const res = await api.get(`/ai/recommendations/${campaignId}`);
      return res.data.data || [];
    },
    enabled: !!campaignId,
  });
}

export function useApplyRecommendation(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recId: string): Promise<AIRecommendationItem> => {
      const res = await api.post(`/ai/apply/${campaignId}/${recId}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiRecommendations', campaignId] });
    },
  });
}

export function useDismissRecommendation(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recId: string): Promise<AIRecommendationItem> => {
      const res = await api.delete(`/ai/recommendations/${campaignId}/${recId}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiRecommendations', campaignId] });
    },
  });
}

export function useAnomalies(campaignId: string) {
  return useQuery({
    queryKey: ['anomalies', campaignId],
    queryFn: async (): Promise<AnomalyItem[]> => {
      const res = await api.get(`/anomalies/${campaignId}`);
      return res.data.data || [];
    },
    enabled: !!campaignId,
  });
}

export function useResolveAnomaly(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (anomalyId: string): Promise<AnomalyItem> => {
      const res = await api.post(`/anomalies/${anomalyId}/resolve`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomalies', campaignId] });
    },
  });
}

export function useBenchmarks(campaignId: string) {
  return useQuery({
    queryKey: ['benchmarks', campaignId],
    queryFn: async (): Promise<BenchmarkData> => {
      const res = await api.get(`/benchmarks/${campaignId}`);
      return res.data.data;
    },
    enabled: !!campaignId,
  });
}

export function useCampaignStory(campaignId: string) {
  return useQuery({
    queryKey: ['story', campaignId],
    queryFn: async (): Promise<CampaignStory> => {
      const res = await api.get(`/storyteller/${campaignId}`);
      return res.data.data;
    },
    enabled: !!campaignId,
  });
}

export function useCampaignTeam(campaignId: string) {
  return useQuery({
    queryKey: ['team', campaignId],
    queryFn: async (): Promise<TeamMemberItem[]> => {
      const res = await api.get(`/teams/campaign/${campaignId}`);
      return res.data.data || [];
    },
    enabled: !!campaignId,
  });
}

const EMPTY_ATTRIBUTION: AttributionData = { devices: [], paths: [] };

export function useAttributionDevices(campaignId: string) {
  return useQuery({
    queryKey: ['attribution', campaignId],
    queryFn: async (): Promise<AttributionData> => {
      // This endpoint may not exist yet — fail soft with an empty state.
      try {
        const res = await api.get(`/attribution/devices/${campaignId}`);
        const data = res.data?.data;
        if (data && Array.isArray(data.devices) && Array.isArray(data.paths)) {
          return data;
        }
        return EMPTY_ATTRIBUTION;
      } catch {
        return EMPTY_ATTRIBUTION;
      }
    },
    enabled: !!campaignId,
    retry: false,
  });
}
