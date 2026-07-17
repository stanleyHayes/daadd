import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Ad, AdFilters, PaginatedResponse } from '@/types';

export function useAds(filters?: AdFilters) {
  return useQuery({
    queryKey: ['ads', filters],
    queryFn: async (): Promise<PaginatedResponse<Ad>> => {
      const params: Record<string, string> = {};
      if (filters?.search) params.search = filters.search;
      if (filters?.industry) params.industry = filters.industry;
      if (filters?.sort) params.sort = filters.sort;
      if (filters?.page) params.page = String(filters.page);
      if (filters?.limit) params.limit = String(filters.limit);

      const res = await api.get('/ads', { params });
      const pagination = res.data.pagination;
      return res.data.data && pagination
        ? { data: res.data.data, total: pagination.total, page: pagination.page, limit: pagination.limit, hasMore: pagination.hasNext ?? pagination.page * pagination.limit < pagination.total }
        : { data: [], total: 0, page: 1, limit: 20, hasMore: false };
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useAd(id: string) {
  return useQuery({
    queryKey: ['ad', id],
    queryFn: async (): Promise<Ad> => {
      const res = await api.get(`/ads/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useTrendingAds() {
  return useQuery({
    queryKey: ['ads', 'trending'],
    queryFn: async (): Promise<Ad[]> => {
      const res = await api.get('/ads/trending');
      return res.data.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useFeaturedAds() {
  return useQuery({
    queryKey: ['ads', 'featured'],
    queryFn: async (): Promise<Ad[]> => {
      const res = await api.get('/ads/featured');
      return res.data.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useInfiniteAds(filters?: AdFilters) {
  return useInfiniteQuery({
    queryKey: ['ads', 'infinite', filters],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse<Ad>> => {
      const params: Record<string, string> = { page: String(pageParam), limit: '20' };
      if (filters?.search) params.search = filters.search;
      if (filters?.industry) params.industry = filters.industry;
      if (filters?.sort) params.sort = filters.sort;

      const res = await api.get('/ads', { params });
      const pagination = res.data.pagination;
      return res.data.data && pagination
        ? { data: res.data.data, total: pagination.total, page: pagination.page, limit: pagination.limit, hasMore: pagination.hasNext ?? pagination.page * pagination.limit < pagination.total }
        : { data: [], total: 0, page: 1, limit: 20, hasMore: false };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime: 2 * 60 * 1000,
  });
}
