import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, Outlet } from '@/types';

export type OutletInput = Partial<
  Pick<Outlet, 'name' | 'address' | 'city' | 'phone' | 'opening_hours' | 'is_active'>
>;

/** The signed-in advertiser's own branches (including inactive). */
export function useOutlets() {
  return useQuery({
    queryKey: ['outlets'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Outlet[]>>('/outlets');
      return res.data.data;
    },
  });
}

/** Public: active branches for an advertiser (used at redemption time). */
export function useAdvertiserOutlets(advertiserId?: string) {
  return useQuery({
    queryKey: ['outlets', 'advertiser', advertiserId],
    enabled: !!advertiserId,
    queryFn: async () => {
      const res = await api.get<ApiResponse<Outlet[]>>(`/outlets/advertiser/${advertiserId}`);
      return res.data.data;
    },
  });
}

export function useCreateOutlet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: OutletInput) => {
      const res = await api.post<ApiResponse<Outlet>>('/outlets', input);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['outlets'] }),
  });
}

export function useUpdateOutlet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: OutletInput & { id: string }) => {
      const res = await api.patch<ApiResponse<Outlet>>(`/outlets/${id}`, input);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['outlets'] }),
  });
}

export function useDeleteOutlet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/outlets/${id}`);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['outlets'] }),
  });
}
