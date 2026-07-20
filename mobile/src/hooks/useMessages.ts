import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';

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
    queryFn: async (): Promise<ConversationSummary[]> => {
      const res = await api.get('/messages/conversations');
      return res.data.data || [];
    },
    refetchInterval: 30000,
  });
}

export function useConversation(conversationId?: string) {
  return useQuery({
    queryKey: ['conversation', conversationId],
    enabled: !!conversationId,
    queryFn: async (): Promise<ChatMessage[]> => {
      const res = await api.get(`/messages/conversations/${conversationId}`);
      return res.data.data || [];
    },
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
    }): Promise<{ conversation_id: string; message: ChatMessage }> => {
      const res = await api.post('/messages/conversations', payload);
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
    mutationFn: async (body: string): Promise<ChatMessage> => {
      const res = await api.post(`/messages/conversations/${conversationId}`, { body });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/** Refresh chat queries in real time when a `message:new` event arrives. */
export function useChatSocket() {
  const queryClient = useQueryClient();
  useEffect(() => {
    let active = true;
    let socket: Socket | undefined;
    const handler = (payload: { conversationId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', payload.conversationId] });
    };
    getSocket().then((s) => {
      if (!s || !active) return;
      socket = s;
      s.on('message:new', handler);
    });
    return () => {
      active = false;
      socket?.off('message:new', handler);
    };
  }, [queryClient]);
}
