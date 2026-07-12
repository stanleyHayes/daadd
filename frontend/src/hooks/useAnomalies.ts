import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Anomaly, ApiResponse } from '@/types';

export function useAnomalies(campaignId?: string) {
  return useQuery({
    queryKey: ['anomalies', campaignId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Anomaly[]>>(`/anomalies/${campaignId}`);
      return res.data.data;
    },
    enabled: !!campaignId,
  });
}

export function useResolveAnomaly() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (anomalyId: string) => {
      const res = await api.post(`/anomalies/${anomalyId}/resolve`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomalies'] });
    },
  });
}
