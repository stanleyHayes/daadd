import { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useLeaderboard,
  useStreak,
  useVipStatus,
  type LeaderboardType,
  type LeaderboardPeriod,
} from '@/hooks/useGamification';
import { useAuthStore } from '@/stores/auth.store';
import { cn, getInitials } from '@/lib/utils';
import { Flame, Trophy, Crown, Medal, Sparkles } from 'lucide-react';

const BOARDS: { key: LeaderboardType; label: string }[] = [
  { key: 'earner', label: 'Top Earners' },
  { key: 'active', label: 'Most Active' },
  { key: 'reviews', label: 'Most Reviews' },
  { key: 'visits', label: 'Merchant Visits' },
  { key: 'streak', label: 'Longest Streak' },
];

const PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'all', label: 'All time' },
];

const STREAK_KINDS = ['daily', 'ad', 'merchant', 'review'] as const;

export function StreakCard() {
  const { data } = useStreak();
  const streak = data?.streak ?? 0;
  const active = !!data?.bonus_active;
  const perActivity = data?.streaks ?? {};

  return (
    <Card className={cn('space-y-4', active && 'border-secondary-300 dark:border-secondary-800')}>
      <div className="flex items-center gap-4">
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
              : `Keep earning daily. Hit a ${data?.bonus_threshold ?? 3}-day streak to start multiplying your tokens.`}
          </p>
        </div>
      </div>

      {/* Each activity keeps its own streak */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {STREAK_KINDS.map((kind) => (
          <div key={kind} className="rounded-xl bg-bg-secondary px-3 py-2 dark:bg-slate-800/60">
            <p className="text-xs capitalize text-text-muted">{kind}</p>
            <p className="text-sm font-semibold text-text-primary">
              {perActivity[kind]?.count ?? 0}d
              {(perActivity[kind]?.multiplier ?? 1) > 1 && (
                <span className="ml-1 text-xs font-normal text-secondary-600">
                  {perActivity[kind]?.multiplier}×
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function VipCard() {
  const { data } = useVipStatus();
  if (!data) return null;
  const isVip = data.tier === 'vip';
  const { metrics, criteria } = data;

  const requirements = [
    { label: 'Merchant visits', have: metrics.merchant_visits, need: criteria.min_merchant_visits },
    { label: 'Purchases', have: metrics.purchases, need: criteria.min_purchases },
    { label: 'Reviews', have: metrics.reviews, need: criteria.min_reviews },
    { label: 'Engagement score', have: data.engagement_score, need: criteria.min_engagement_score },
  ].filter((r) => r.need > 0);

  return (
    <Card className={cn(isVip && 'border-secondary-300 dark:border-secondary-800')}>
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
            isVip
              ? 'bg-gradient-to-br from-secondary-500 to-primary-600 text-white'
              : 'bg-bg-secondary text-text-muted dark:bg-slate-700'
          )}
        >
          <Sparkles className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold text-text-primary">
            {isVip ? 'VIP member' : 'VIP status'}
          </p>
          <p className="text-sm text-text-secondary">
            {isVip
              ? `You earn ${data.multiplier}× tokens and get early access to promotions.`
              : 'Keep engaging to unlock bonus multipliers and exclusive campaigns.'}
          </p>
        </div>
      </div>

      {!isVip && requirements.length > 0 && (
        <div className="mt-4 space-y-2">
          {requirements.map((r) => {
            const pct = Math.min(100, Math.round((r.have / Math.max(1, r.need)) * 100));
            return (
              <div key={r.label}>
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">{r.label}</span>
                  <span className="text-text-muted">
                    {r.have} / {r.need}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg-secondary dark:bg-slate-800">
                  <div className="h-full rounded-full bg-secondary-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
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
  const [board, setBoard] = useState<LeaderboardType>('earner');
  const [period, setPeriod] = useState<LeaderboardPeriod>('all');
  const { data: entries, isLoading } = useLeaderboard(board, period);
  const me = useAuthStore((s) => s.user);

  return (
    <Card>
      <CardHeader title="Leaderboards" subtitle="Top members across SmartAdDeals" />

      <div className="mb-3 flex flex-wrap gap-1.5">
        {BOARDS.map((b) => (
          <button
            key={b.key}
            onClick={() => setBoard(b.key)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              board === b.key
                ? 'bg-primary-600 text-white'
                : 'bg-bg-secondary text-text-secondary hover:text-text-primary dark:bg-slate-800'
            )}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* The streak board reflects current state, so a period window doesn't apply */}
      {board !== 'streak' && (
        <div className="mb-4 flex gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs transition-colors',
                period === p.key
                  ? 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="py-8 text-center text-text-muted">Loading…</div>
      ) : !entries || entries.length === 0 ? (
        <EmptyState
          variant="plain"
          icon={<Trophy />}
          title="No rankings yet"
          description="Engage with ads and merchants to climb the board."
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
                    {e.vip && (
                      <span className="ml-1.5 inline-flex items-center rounded-full bg-secondary-100 px-1.5 py-0.5 text-[10px] font-bold text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300">
                        VIP
                      </span>
                    )}
                  </p>
                  {e.streak > 0 && (
                    <p className="flex items-center gap-1 text-xs text-text-muted">
                      <Flame className="h-3 w-3" /> {e.streak}-day streak
                    </p>
                  )}
                </div>
                <span className="text-sm font-bold text-text-primary">
                  {e.value.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-text-muted">{e.unit}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
