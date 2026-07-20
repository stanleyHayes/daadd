import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
import type { ApiResponse } from '@/types';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface ConversationSummary {
  id: string;
  role: 'customer' | 'advertiser';
  counterpart: { id: string; name: string; avatar_url: string; role: string };
  ad_id: string | null;
  campaign_id: string | null;
  last_message: string;
  last_message_at: string | null;
  unread: number;
}

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ConversationSummary[]>>('/messages/conversations');
      return res.data.data;
    },
    // Socket delivers new messages instantly; this is the safety net if it drops.
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
}

export function useConversation(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['conversation', conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const res = await api.get<ApiResponse<ChatMessage[]>>(
        `/messages/conversations/${conversationId}`
      );
      return res.data.data;
    },
    refetchOnWindowFocus: true,
  });
}

export function useStartConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      advertiser_id: string;
      body: string;
      ad_id?: string;
      campaign_id?: string;
    }) => {
      const res = await api.post<ApiResponse<{ conversation_id: string; message: ChatMessage }>>(
        '/messages/conversations',
        payload
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const res = await api.post<ApiResponse<ChatMessage>>(
        `/messages/conversations/${conversationId}`,
        { body }
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/**
 * Subscribe to real-time `message:new` events and refresh the affected queries.
 * Mount once where chat is visible (inbox / thread).
 */
export function useChatSocket() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNew = (payload: { conversationId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', payload.conversationId] });
    };
    socket.on('message:new', onNew);
    return () => {
      socket.off('message:new', onNew);
    };
  }, [queryClient]);
}
