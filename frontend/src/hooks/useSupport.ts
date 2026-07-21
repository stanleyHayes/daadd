import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse } from '@/types';
import toast from 'react-hot-toast';

export type SupportCategory =
  | 'general'
  | 'problem'
  | 'fraud'
  | 'campaign'
  | 'merchant'
  | 'billing';

export interface FaqEntry {
  q: string;
  a: string;
}

export interface SupportTicket {
  _id: string;
  name: string;
  email: string;
  category: SupportCategory;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  response: string;
  created_at: string;
}

export function useFaq() {
  return useQuery({
    queryKey: ['supportFaq'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<FaqEntry[]>>('/support/faq');
      return res.data.data;
    },
    staleTime: 30 * 60 * 1000,
  });
}

/** The signed-in user's own tickets (empty for signed-out visitors). */
export function useMyTickets(enabled = true) {
  return useQuery({
    queryKey: ['supportTickets'],
    enabled,
    queryFn: async () => {
      const res = await api.get<ApiResponse<SupportTicket[]>>('/support/tickets');
      return res.data.data;
    },
  });
}

export function useSubmitTicket() {
  return useMutation({
    mutationFn: async (data: {
      name?: string;
      email: string;
      category: SupportCategory;
      subject: string;
      message: string;
    }) => {
      const res = await api.post<ApiResponse<SupportTicket>>('/support/tickets', data);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Thanks — we've received your request and will be in touch.");
    },
    onError: () => {
      toast.error('Could not submit your request. Please try again.');
    },
  });
}
