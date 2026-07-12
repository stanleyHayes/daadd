import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Campaign, PaginatedResponse, ApiResponse, FilterOptions } from '@/types';

export function useCampaigns(filters?: FilterOptions) {
  return useQuery({
    queryKey: ['campaigns', filters],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Campaign>>('/campaigns', { params: filters });
      return res.data;  // { success, data: Campaign[], pagination: {...} }
    },
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Campaign>>(`/campaigns/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Campaign>) => {
      const res = await api.post<ApiResponse<Campaign>>('/campaigns', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Campaign> }) => {
      const res = await api.patch<ApiResponse<Campaign>>(`/campaigns/${id}`, data);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', variables.id] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useToggleAI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, enabled, mode }: { id: string; enabled: boolean; mode?: string }) => {
      const res = await api.patch<ApiResponse<Campaign>>(`/campaigns/${id}/toggle-ai`, { enabled, mode });
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', variables.id] });
    },
  });
}

export function useUploadCreative() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campaignId, formData }: { campaignId: string; formData: FormData }) => {
      const res = await api.post(`/campaigns/${campaignId}/creatives`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', variables.campaignId] });
    },
  });
}
