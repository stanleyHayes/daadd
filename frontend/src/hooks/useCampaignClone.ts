import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useCampaignClone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (campaignId: string) => {
      const { data } = await api.post(`/campaigns/${campaignId}/clone`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}
