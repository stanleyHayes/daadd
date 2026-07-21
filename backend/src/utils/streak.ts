/**
 * Engagement streaks + reward bonuses (V2 Area 8).
 *
 * A streak counts consecutive UTC days on which the user performed a given
 * activity. Longer streaks earn progressively larger reward multipliers.
 * Four independent streaks are tracked: daily rewards, ad interactions,
 * merchant visits and review submissions.
 */
export type StreakType = 'daily' | 'ad' | 'merchant' | 'review';

export const STREAK_TYPES: StreakType[] = ['daily', 'ad', 'merchant', 'review'];

/** Progressive tiers, highest first. */
export const STREAK_TIERS: { min: number; multiplier: number }[] = [
  { min: 30, multiplier: 2 },
  { min: 14, multiplier: 1.75 },
  { min: 7, multiplier: 1.5 },
  { min: 3, multiplier: 1.25 },
];

/** Days needed before any bonus applies (the lowest tier). */
export const STREAK_BONUS_THRESHOLD = 3;
/** Kept for compatibility with callers that reference a single headline value. */
export const STREAK_BONUS_MULTIPLIER = 1.5;

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10); // UTC calendar day
}

/** The multiplier a streak of `count` days earns (1 when below the first tier). */
export function multiplierForStreak(count: number): number {
  for (const tier of STREAK_TIERS) {
    if (count >= tier.min) return tier.multiplier;
  }
  return 1;
}

export interface StreakUpdate {
  streak_count: number;
  last_reward_date: Date;
  /** True when the streak qualifies for a bonus. */
  active: boolean;
  /** Reward multiplier to apply. */
  multiplier: number;
}

/**
 * Compute the updated streak when a user performs the activity at `now`.
 * Same-day activity keeps the streak; the next day extends it; a gap resets it.
 */
export function advanceStreak(
  current: { streak_count?: number; last_reward_date?: Date | null },
  now: Date = new Date()
): StreakUpdate {
  const prev = current.streak_count || 0;
  const last = current.last_reward_date ? new Date(current.last_reward_date) : null;

  let streak: number;
  if (!last) {
    streak = 1;
  } else {
    const todayKey = dayKey(now);
    const lastKey = dayKey(last);
    if (lastKey === todayKey) {
      streak = prev || 1; // already counted today — no change
    } else {
      const yesterday = new Date(now);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      streak = lastKey === dayKey(yesterday) ? prev + 1 : 1;
    }
  }

  const multiplier = multiplierForStreak(streak);
  return {
    streak_count: streak,
    last_reward_date: now,
    active: streak >= STREAK_BONUS_THRESHOLD,
    multiplier,
  };
}

/**
 * Advance one of the typed streaks on a user document in place. Returns the
 * new count. Safe to call on every qualifying activity — same-day repeats are
 * idempotent.
 */
export function bumpStreak(
  user: { streaks?: Record<string, { count?: number; last_at?: Date | null }> },
  type: StreakType,
  now: Date = new Date()
): number {
  if (!user.streaks) user.streaks = {};
  const current = user.streaks[type] || {};
  const advanced = advanceStreak(
    { streak_count: current.count, last_reward_date: current.last_at },
    now
  );
  user.streaks[type] = { count: advanced.streak_count, last_at: advanced.last_reward_date };
  return advanced.streak_count;
}
