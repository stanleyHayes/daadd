import { PlatformSetting } from '../models/PlatformSetting';
import { STREAK_TIERS, STREAK_BONUS_THRESHOLD, StreakTier } from './streak';
import { VIP_MULTIPLIER } from './vip';

/**
 * Administrator-configurable reward-multiplier rules (V2 Area 8 / Phase 3.3),
 * replacing the previously hardcoded streak tiers and VIP multiplier.
 *
 * SAFETY: reward tokens are advertiser cost, so an oversized multiplier mints
 * real redemption liability. Every configurable value is clamped to a HARD,
 * NON-CONFIGURABLE ceiling both when an admin saves it AND again when it is read
 * on the reward-granting hot path — the stored value is never trusted. The
 * product of streak × VIP is additionally capped by `effectiveMultiplier`.
 */
export const MULTIPLIER_RULES_KEY = 'reward_multiplier_rules';

/** Hard ceilings. Admin config can approach but never exceed these. */
export const MAX_STREAK_MULTIPLIER = 5;
export const MAX_VIP_MULTIPLIER = 3;
export const MAX_EFFECTIVE_MULTIPLIER = 10;
/** Cap on how many streak tiers can be configured (bounds the stored array). */
export const MAX_TIERS = 8;

export interface MultiplierRules {
  streak_tiers: StreakTier[];
  vip_multiplier: number;
  bonus_threshold: number;
}

export const DEFAULT_MULTIPLIER_RULES: MultiplierRules = {
  streak_tiers: STREAK_TIERS,
  vip_multiplier: VIP_MULTIPLIER,
  bonus_threshold: STREAK_BONUS_THRESHOLD,
};

function clamp(n: number, lo: number, hi: number): number {
  if (Number.isNaN(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Normalise and clamp an untrusted rules blob into a safe MultiplierRules.
 * Tiers are clamped, de-duplicated by `min`, and sorted highest-`min`-first so
 * multiplierForStreak() picks the right tier deterministically. A malformed or
 * empty tier list falls back to the defaults so rewards never silently stop.
 */
export function sanitizeMultiplierRules(input: Partial<MultiplierRules> | undefined | null): MultiplierRules {
  const raw = Array.isArray(input?.streak_tiers) ? input!.streak_tiers : DEFAULT_MULTIPLIER_RULES.streak_tiers;

  const byMin = new Map<number, StreakTier>();
  for (const t of raw.slice(0, MAX_TIERS)) {
    const min = Math.max(1, Math.floor(Number(t?.min)));
    const multiplier = clamp(Number(t?.multiplier), 1, MAX_STREAK_MULTIPLIER);
    if (!Number.isFinite(min)) continue;
    byMin.set(min, { min, multiplier });
  }

  let streak_tiers = [...byMin.values()].sort((a, b) => b.min - a.min);
  if (streak_tiers.length === 0) streak_tiers = DEFAULT_MULTIPLIER_RULES.streak_tiers;

  return {
    streak_tiers,
    vip_multiplier: clamp(Number(input?.vip_multiplier ?? DEFAULT_MULTIPLIER_RULES.vip_multiplier), 1, MAX_VIP_MULTIPLIER),
    bonus_threshold: Math.max(1, Math.floor(Number(input?.bonus_threshold ?? DEFAULT_MULTIPLIER_RULES.bonus_threshold))),
  };
}

/**
 * The effective per-claim multiplier, re-clamped to the hard product ceiling.
 * This is the last line of defence at grant time regardless of stored config.
 */
export function effectiveMultiplier(streakMultiplier: number, vipMultiplier: number): number {
  const product = (streakMultiplier || 1) * (vipMultiplier || 1);
  return clamp(product, 1, MAX_EFFECTIVE_MULTIPLIER);
}

/** Current rules, defaults-merged and re-sanitised so reads never trust storage. */
export async function getMultiplierRules(): Promise<MultiplierRules> {
  try {
    const row = await PlatformSetting.findOne({ key: MULTIPLIER_RULES_KEY }).lean();
    const stored = (row?.value || {}) as Partial<MultiplierRules>;
    return sanitizeMultiplierRules({ ...DEFAULT_MULTIPLIER_RULES, ...stored });
  } catch {
    return DEFAULT_MULTIPLIER_RULES;
  }
}
