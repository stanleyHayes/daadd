import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { AdJourneyStory, ApiResponse } from '@/types';

export function useStory(campaignId?: string) {
  return useQuery({
    queryKey: ['story', campaignId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<AdJourneyStory>>(`/storyteller/${campaignId}`);
      return res.data.data;
    },
    enabled: !!campaignId,
  });
}

export function useExportStoryPDF() {
  return useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await api.get(`/storyteller/${campaignId}/export/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ad-journey-story.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}

// Combined export function used by StoryExport component
export function useExportStory() {
  return useMutation({
    mutationFn: async ({ campaignId, format }: { campaignId: string; format: 'pdf' | 'html' }) => {
      const res = await api.get(`/storyteller/${campaignId}/export/${format}`, { responseType: 'blob' });
      const ext = format === 'pdf' ? 'pdf' : 'html';
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ad-journey-story.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}

export function useExportStoryHTML() {
  return useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await api.get(`/storyteller/${campaignId}/export/html`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ad-journey-story.html');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}
