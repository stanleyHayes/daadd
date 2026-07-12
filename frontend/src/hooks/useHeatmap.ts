import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { HeatmapData, ApiResponse } from '@/types';

export function useHeatmapData(campaignId?: string) {
  return useQuery({
    queryKey: ['heatmap', campaignId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<HeatmapData>>(`/heatmaps/${campaignId}`);
      return res.data.data;
    },
    enabled: !!campaignId,
  });
}
