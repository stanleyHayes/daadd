import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// Public ad shape from the /ads endpoint
interface PublicAd {
  id: string;
  title: string;
  description: string;
  creativeUrl: string;
  creativeType: string;
  advertiser: { id: string; name: string; logo: string; verified: boolean };
  industry: string;
  rewardAmount: number;
  rewardCurrency: string;
  isTrending: boolean;
  isFeatured: boolean;
  isAgeRestricted: boolean;
  rating: number;
  reviewCount: number;
  viewCount: number;
  createdAt: string;
  campaign?: {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    status: string;
    budget: number;
    spent: number;
  };
}

export type { PublicAd };

export function usePublicAds(filters?: { industry?: string; search?: string; sort?: string }) {
  return useQuery({
    queryKey: ['publicAds', filters],
    queryFn: async (): Promise<PublicAd[]> => {
      const res = await api.get('/ads', { params: filters });
      // Backend returns { success, data: [...], total, page, limit } via paginatedResponse
      return res.data.data || [];
    },
  });
}

export function usePublicAd(id?: string) {
  return useQuery({
    queryKey: ['publicAd', id],
    queryFn: async (): Promise<PublicAd> => {
      const res = await api.get(`/ads/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useFeaturedAds() {
  return useQuery({
    queryKey: ['featuredAds'],
    queryFn: async (): Promise<PublicAd[]> => {
      const res = await api.get('/ads/featured');
      return res.data.data || [];
    },
  });
}

export function useRelatedAds(adId?: string, industry?: string) {
  return useQuery({
    queryKey: ['relatedAds', adId, industry],
    queryFn: async (): Promise<PublicAd[]> => {
      const res = await api.get('/ads', { params: { industry, limit: 4 } });
      return (res.data.data || []).filter((ad: PublicAd) => ad.id !== adId);
    },
    enabled: !!adId,
  });
}
