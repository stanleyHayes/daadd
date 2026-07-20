/**
 * Engagement streak + reward bonus (recommendation #6).
 *
 * A user's streak counts consecutive UTC days on which they earned a reward.
 * Once a user is a "regular" (streak has reached the threshold), new rewards are
 * multiplied by STREAK_BONUS_MULTIPLIER — a +0.5x bump.
 */
export const STREAK_BONUS_THRESHOLD = 3; // days to count as a "regular"
export const STREAK_BONUS_MULTIPLIER = 1.5; // +0.5x on rewards for regulars

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10); // UTC calendar day
}

export interface StreakUpdate {
  streak_count: number;
  last_reward_date: Date;
  /** True when the streak qualifies for the bonus. */
  active: boolean;
  /** Reward multiplier to apply (1 or STREAK_BONUS_MULTIPLIER). */
  multiplier: number;
}

/**
 * Compute the updated streak when a user earns a reward at `now`. Same-day
 * rewards keep the streak; a reward the next day extends it; a gap resets it.
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
      streak = prev || 1; // already earned today — no change
    } else {
      const yesterday = new Date(now);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      streak = lastKey === dayKey(yesterday) ? prev + 1 : 1;
    }
  }

  const active = streak >= STREAK_BONUS_THRESHOLD;
  return {
    streak_count: streak,
    last_reward_date: now,
    active,
    multiplier: active ? STREAK_BONUS_MULTIPLIER : 1,
  };
}
