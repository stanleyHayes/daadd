import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, MerchantMetrics } from '@/types';

/** Merchant performance dashboard metrics (Area 13). */
export function useMerchantMetrics() {
  return useQuery({
    queryKey: ['merchantMetrics'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<MerchantMetrics>>('/analytics/merchant');
      return res.data.data;
    },
  });
}
