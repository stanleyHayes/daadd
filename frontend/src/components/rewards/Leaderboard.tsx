import React from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useLeaderboard, useStreak } from '@/hooks/useGamification';
import { useAuthStore } from '@/stores/auth.store';
import { cn, getInitials } from '@/lib/utils';
import { Flame, Trophy, Crown, Medal } from 'lucide-react';

export function StreakCard() {
  const { data } = useStreak();
  const streak = data?.streak ?? 0;
  const active = !!data?.bonus_active;
  return (
    <Card
      className={cn(
        'flex items-center gap-4',
        active && 'border-secondary-300 dark:border-secondary-800'
      )}
    >
      <div
        className={cn(
          'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
          active
            ? 'bg-gradient-to-br from-orange-500 to-secondary-500 text-white'
            : 'bg-bg-secondary text-text-muted dark:bg-slate-700'
        )}
      >
        <Flame className="h-7 w-7" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-text-primary">{streak}-day streak</p>
        <p className="text-sm text-text-secondary">
          {active
            ? `You're a regular — earning ${data?.bonus_multiplier}× tokens on every reward.`
            : `Keep earning daily. Hit a ${data?.bonus_threshold ?? 3}-day streak for a ${
                data?.bonus_multiplier ?? 1.5
              }× token bonus.`}
        </p>
      </div>
    </Card>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-4 w-4 text-amber-500" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-slate-400" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-orange-400" />;
  return <span className="text-xs font-semibold text-text-muted">#{rank}</span>;
}

export function Leaderboard() {
  const { data: entries, isLoading } = useLeaderboard();
  const me = useAuthStore((s) => s.user);

  return (
    <Card>
      <CardHeader title="Leaderboard" subtitle="Top earners across SmartDeals" />
      {isLoading ? (
        <div className="py-8 text-center text-text-muted">Loading…</div>
      ) : !entries || entries.length === 0 ? (
        <EmptyState
          variant="plain"
          icon={<Trophy />}
          title="No rankings yet"
          description="Earn tokens by viewing ads to climb the board."
        />
      ) : (
        <ul className="divide-y divide-border-color dark:divide-slate-800">
          {entries.map((e) => {
            const isMe = me?.id === e.user_id;
            return (
              <li
                key={e.user_id}
                className={cn(
                  'flex items-center gap-3 py-3',
                  isMe && '-mx-6 bg-primary-50/50 px-6 dark:bg-primary-900/10'
                )}
              >
                <div className="flex w-8 items-center justify-center">
                  <RankBadge rank={e.rank} />
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  {e.avatar_url ? (
                    <img src={e.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    getInitials(e.name)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {e.name}
                    {isMe && <span className="font-normal text-text-muted"> (you)</span>}
                  </p>
                  {e.streak > 0 && (
                    <p className="flex items-center gap-1 text-xs text-text-muted">
                      <Flame className="h-3 w-3" /> {e.streak}-day streak
                    </p>
                  )}
                </div>
                <span className="text-sm font-bold text-text-primary">
                  {e.tokens.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-text-muted">tokens</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
