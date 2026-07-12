import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { BenchmarkData, ApiResponse } from '@/types';

export function useBenchmarkData(campaignId?: string) {
  return useQuery({
    queryKey: ['benchmarks', campaignId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<BenchmarkData>>(`/benchmarks/${campaignId}`);
      return res.data.data;
    },
    enabled: !!campaignId,
  });
}
