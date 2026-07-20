import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
import type { ApiResponse } from '@/types';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  image_url?: string;
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

export interface OutgoingMessage {
  body?: string;
  image?: File;
}

export function useStartConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      advertiser_id: string;
      body?: string;
      ad_id?: string;
      campaign_id?: string;
      image?: File;
    }) => {
      let res;
      if (payload.image) {
        const fd = new FormData();
        fd.append('advertiser_id', payload.advertiser_id);
        if (payload.body) fd.append('body', payload.body);
        if (payload.ad_id) fd.append('ad_id', payload.ad_id);
        if (payload.campaign_id) fd.append('campaign_id', payload.campaign_id);
        fd.append('photo', payload.image);
        res = await api.post<ApiResponse<{ conversation_id: string; message: ChatMessage }>>(
          '/messages/conversations',
          fd,
          { headers: { 'Content-Type': undefined } }
        );
      } else {
        res = await api.post<ApiResponse<{ conversation_id: string; message: ChatMessage }>>(
          '/messages/conversations',
          payload
        );
      }
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
    mutationFn: async (arg: OutgoingMessage) => {
      let res;
      if (arg.image) {
        const fd = new FormData();
        if (arg.body) fd.append('body', arg.body);
        fd.append('photo', arg.image);
        res = await api.post<ApiResponse<ChatMessage>>(
          `/messages/conversations/${conversationId}`,
          fd,
          { headers: { 'Content-Type': undefined } }
        );
      } else {
        res = await api.post<ApiResponse<ChatMessage>>(
          `/messages/conversations/${conversationId}`,
          { body: arg.body }
        );
      }
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/** Emit + receive real-time "typing" pings for the open conversation. */
export function useTyping(conversationId: string | undefined) {
  const [isCounterpartTyping, setTyping] = useState(false);
  const lastEmit = useRef(0);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversationId) return;
    let clearTimer: ReturnType<typeof setTimeout>;
    const onTyping = (p: { conversationId: string }) => {
      if (p.conversationId !== conversationId) return;
      setTyping(true);
      clearTimeout(clearTimer);
      clearTimer = setTimeout(() => setTyping(false), 3000);
    };
    socket.on('typing', onTyping);
    return () => {
      socket.off('typing', onTyping);
      clearTimeout(clearTimer);
      setTyping(false);
    };
  }, [conversationId]);

  const notifyTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket || !conversationId) return;
    const now = Date.now();
    if (now - lastEmit.current < 1500) return; // throttle keystroke pings
    lastEmit.current = now;
    socket.emit('typing', { conversationId });
  }, [conversationId]);

  return { isCounterpartTyping, notifyTyping };
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
