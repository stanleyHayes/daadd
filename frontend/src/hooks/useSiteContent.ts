import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse } from '@/types';

/**
 * Editorial content for the public marketing site, managed by admins under
 * Dashboard → Website Content.
 *
 * The public queries are deliberately unauthenticated and return only what an
 * admin has published. Marketing sections render nothing when their list comes
 * back empty, so an unconfigured install shows a shorter honest page rather
 * than placeholder people and invented numbers.
 */
export const SITE_CONTENT_TYPES = [
  'testimonial',
  'case_study',
  'team_member',
  'milestone',
  'job_opening',
] as const;

export type SiteContentType = (typeof SITE_CONTENT_TYPES)[number];

export interface SiteContentItem {
  _id: string;
  type: SiteContentType;
  is_published: boolean;
  order: number;
  body: string;
  name: string;
  role: string;
  company: string;
  avatar_url: string;
  metric: string;
  metric_label: string;
  year: string;
  title: string;
  department: string;
  location: string;
  apply_url: string;
  created_at: string;
  updated_at: string;
}

export interface SiteContact {
  email: string;
  phone: string;
  address_line: string;
  address_city: string;
  hours_weekdays: string;
  hours_saturday: string;
  hours_sunday: string;
  careers_email: string;
  legal_entity: string;
  privacy_email: string;
  legal_email: string;
}

/** Counts derived from real data, so they cannot drift into marketing fiction. */
export interface SiteStats {
  campaigns: number;
  advertisers: number;
  adViews: number;
  cities: number;
}

// --- public ----------------------------------------------------------------

export function useSiteContent(type: SiteContentType) {
  return useQuery({
    queryKey: ['site-content', type],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await api.get<ApiResponse<SiteContentItem[]>>('/site/content', {
        params: { type },
      });
      return res.data.data;
    },
  });
}

export function useSiteContact() {
  return useQuery({
    queryKey: ['site-contact'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await api.get<ApiResponse<SiteContact>>('/site/contact');
      return res.data.data;
    },
  });
}

export function useSiteStats() {
  return useQuery({
    queryKey: ['site-stats'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await api.get<ApiResponse<SiteStats>>('/site/stats');
      return res.data.data;
    },
  });
}

// --- admin -----------------------------------------------------------------

export function useAllSiteContent(type?: SiteContentType) {
  return useQuery({
    queryKey: ['site-content', 'admin', type ?? 'all'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SiteContentItem[]>>('/site/admin/content', {
        params: type ? { type } : undefined,
      });
      return res.data.data;
    },
  });
}

export type SiteContentInput = Partial<Omit<SiteContentItem, '_id' | 'created_at' | 'updated_at'>>;

/** Both public and admin caches, since publishing changes what visitors see. */
function invalidateContent(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['site-content'] });
}

export function useCreateSiteContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SiteContentInput & { type: SiteContentType }) => {
      const res = await api.post<ApiResponse<SiteContentItem>>('/site/admin/content', input);
      return res.data.data;
    },
    onSuccess: () => invalidateContent(queryClient),
  });
}

export function useUpdateSiteContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: SiteContentInput & { id: string }) => {
      const res = await api.patch<ApiResponse<SiteContentItem>>(
        `/site/admin/content/${id}`,
        input
      );
      return res.data.data;
    },
    onSuccess: () => invalidateContent(queryClient),
  });
}

export function useDeleteSiteContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/site/admin/content/${id}`);
      return id;
    },
    onSuccess: () => invalidateContent(queryClient),
  });
}

export function useUpdateSiteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SiteContact) => {
      const res = await api.put<ApiResponse<SiteContact>>('/site/admin/contact', input);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['site-contact'] }),
  });
}
