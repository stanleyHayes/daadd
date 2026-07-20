import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  image_url?: string;
  created_at: string;
}

export interface ChatImage {
  uri: string;
  name?: string;
  type?: string;
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

function appendImage(fd: FormData, image: ChatImage) {
  fd.append('photo', {
    uri: image.uri,
    name: image.name || 'photo.jpg',
    type: image.type || 'image/jpeg',
  } as unknown as Blob);
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
      body?: string;
      ad_id?: string;
      campaign_id?: string;
      image?: ChatImage;
    }): Promise<{ conversation_id: string; message: ChatMessage }> => {
      if (payload.image) {
        const fd = new FormData();
        fd.append('advertiser_id', payload.advertiser_id);
        if (payload.body) fd.append('body', payload.body);
        if (payload.ad_id) fd.append('ad_id', payload.ad_id);
        if (payload.campaign_id) fd.append('campaign_id', payload.campaign_id);
        appendImage(fd, payload.image);
        const res = await api.post('/messages/conversations', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data.data;
      }
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
    mutationFn: async (arg: { body?: string; image?: ChatImage }): Promise<ChatMessage> => {
      if (arg.image) {
        const fd = new FormData();
        if (arg.body) fd.append('body', arg.body);
        appendImage(fd, arg.image);
        const res = await api.post(`/messages/conversations/${conversationId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data.data;
      }
      const res = await api.post(`/messages/conversations/${conversationId}`, { body: arg.body });
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

/** Emit + receive real-time "typing" pings for the open conversation. */
export function useTyping(conversationId?: string) {
  const [isCounterpartTyping, setTyping] = useState(false);
  const lastEmit = useRef(0);

  useEffect(() => {
    let active = true;
    let socket: Socket | undefined;
    let clearTimer: ReturnType<typeof setTimeout>;
    const onTyping = (p: { conversationId: string }) => {
      if (p.conversationId !== conversationId) return;
      setTyping(true);
      clearTimeout(clearTimer);
      clearTimer = setTimeout(() => setTyping(false), 3000);
    };
    getSocket().then((s) => {
      if (!s || !active || !conversationId) return;
      socket = s;
      s.on('typing', onTyping);
    });
    return () => {
      active = false;
      socket?.off('typing', onTyping);
      clearTimeout(clearTimer);
      setTyping(false);
    };
  }, [conversationId]);

  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (!conversationId || now - lastEmit.current < 1500) return;
    lastEmit.current = now;
    getSocket().then((s) => s?.emit('typing', { conversationId }));
  }, [conversationId]);

  return { isCounterpartTyping, notifyTyping };
}
