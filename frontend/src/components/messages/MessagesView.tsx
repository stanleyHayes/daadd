import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cn, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import {
  useConversations,
  useConversation,
  useSendMessage,
  useStartConversation,
  useChatSocket,
} from '@/hooks/useMessages';
import { EmptyState } from '@/components/ui/EmptyState';
import { MessageSquare, Send, ArrowLeft } from 'lucide-react';

export interface ComposeTarget {
  advertiserId: string;
  advertiserName?: string;
  adId?: string;
  campaignId?: string;
}

function timeLabel(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function MessagesView({ compose }: { compose?: ComposeTarget }) {
  const me = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  useChatSocket();

  const { data: conversations = [], isLoading } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState<ComposeTarget | null>(compose ?? null);
  const [draft, setDraft] = useState('');

  const activeId = composing ? null : selectedId;
  const { data: messages = [] } = useConversation(activeId ?? undefined);
  const sendMessage = useSendMessage(activeId ?? '');
  const startConversation = useStartConversation();

  const activeConversation = conversations.find((c) => c.id === activeId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Opening a thread marks it read server-side; refresh the unread badges.
  useEffect(() => {
    if (activeId) queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }, [activeId, messages.length, queryClient]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length, activeId]);

  const busy = sendMessage.isPending || startConversation.isPending;

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    if (composing) {
      const result = await startConversation.mutateAsync({
        advertiser_id: composing.advertiserId,
        body: text,
        ad_id: composing.adId,
        campaign_id: composing.campaignId,
      });
      setDraft('');
      setComposing(null);
      setSelectedId(result.conversation_id);
    } else if (activeId) {
      await sendMessage.mutateAsync(text);
      setDraft('');
    }
  };

  const showThread = !!activeId || !!composing;
  const threadTitle = composing
    ? composing.advertiserName || 'New message'
    : activeConversation?.counterpart.name || 'Conversation';

  return (
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-11rem)] min-h-[28rem]">
      {/* Conversation list */}
      <div
        className={cn(
          'flex-col rounded-2xl border border-border-color bg-card-bg overflow-hidden',
          showThread ? 'hidden md:flex' : 'flex'
        )}
      >
        <div className="px-4 py-3 border-b border-border-color">
          <h2 className="text-sm font-semibold text-text-primary">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-text-muted">Loading…</div>
          ) : conversations.length === 0 && !composing ? (
            <EmptyState
              variant="plain"
              icon={<MessageSquare />}
              title="No messages yet"
              description="Enquiries you send or receive show up here."
            />
          ) : (
            <ul className="divide-y divide-border-color">
              {composing && (
                <li className="flex items-center gap-3 px-4 py-3 bg-primary-50/60 dark:bg-primary-900/10">
                  <Avatar name={composing.advertiserName || 'Company'} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {composing.advertiserName || 'New message'}
                    </p>
                    <p className="truncate text-xs text-text-muted">New enquiry…</p>
                  </div>
                </li>
              )}
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => {
                      setComposing(null);
                      setSelectedId(c.id);
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-secondary',
                      c.id === activeId && 'bg-bg-secondary'
                    )}
                  >
                    <Avatar name={c.counterpart.name} url={c.counterpart.avatar_url} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-text-primary">
                          {c.counterpart.name}
                        </p>
                        <span className="shrink-0 text-[11px] text-text-muted">
                          {timeLabel(c.last_message_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-text-secondary">{c.last_message || '—'}</p>
                        {c.unread > 0 && (
                          <span className="shrink-0 rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Thread */}
      <div
        className={cn(
          'flex-col rounded-2xl border border-border-color bg-card-bg overflow-hidden',
          showThread ? 'flex' : 'hidden md:flex'
        )}
      >
        {showThread ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border-color">
              <button
                onClick={() => {
                  setSelectedId(null);
                  setComposing(null);
                }}
                className="md:hidden text-text-secondary hover:text-text-primary"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Avatar name={threadTitle} />
              <p className="text-sm font-semibold text-text-primary">{threadTitle}</p>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
              {composing && messages.length === 0 && (
                <p className="text-center text-xs text-text-muted py-6">
                  Send a message to start the conversation.
                </p>
              )}
              {messages.map((m) => {
                const mine = m.sender_id === me?.id;
                return (
                  <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm',
                        mine
                          ? 'bg-primary-600 text-white rounded-br-sm'
                          : 'bg-bg-secondary text-text-primary rounded-bl-sm'
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className={cn('mt-1 text-[10px]', mine ? 'text-white/70' : 'text-text-muted')}>
                        {timeLabel(m.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-end gap-2 border-t border-border-color p-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder="Type a message…"
                className="flex-1 resize-none rounded-xl border border-border-color bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                onClick={handleSend}
                disabled={!draft.trim() || busy}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              variant="plain"
              icon={<MessageSquare />}
              title="Select a conversation"
              description="Choose a thread on the left to read and reply."
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Avatar({ name, url }: { name: string; url?: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : getInitials(name)}
    </div>
  );
}
