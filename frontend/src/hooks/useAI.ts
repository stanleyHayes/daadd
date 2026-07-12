import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { AIRecommendation, AIAuditLog, ApiResponse } from '@/types';

export function useRecommendations(campaignId?: string) {
  return useQuery({
    queryKey: ['aiRecommendations', campaignId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<AIRecommendation[]>>(`/ai/recommendations/${campaignId}`);
      return res.data.data;
    },
    enabled: !!campaignId,
  });
}

export function useApplyRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campaignId, recommendationId }: { campaignId: string; recommendationId: string }) => {
      const res = await api.post(`/ai/apply/${campaignId}/${recommendationId}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiRecommendations'] });
      queryClient.invalidateQueries({ queryKey: ['aiAuditLog'] });
    },
  });
}

export function useAIAuditLog(campaignId?: string) {
  return useQuery({
    queryKey: ['aiAuditLog', campaignId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<AIAuditLog[]>>(`/ai/audit-log/${campaignId}`);
      return res.data.data;
    },
    enabled: !!campaignId,
  });
}

// Alias for backward compatibility
export const useAuditLog = useAIAuditLog;

export function useDismissRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campaignId, recommendationId }: { campaignId: string; recommendationId: string }) => {
      const res = await api.delete(`/ai/recommendations/${campaignId}/${recommendationId}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiRecommendations'] });
      queryClient.invalidateQueries({ queryKey: ['aiAuditLog'] });
    },
  });
}

export function useUpdateAIMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campaignId, mode }: { campaignId: string; mode: string }) => {
      const res = await api.patch(`/ai/mode/${campaignId}`, { mode });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign'] });
    },
  });
}
