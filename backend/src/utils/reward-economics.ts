export const TOKEN_VALUE = parseFloat(process.env.TOKEN_VALUE || '0.05');

/** Warn the advertiser once the reward pool crosses this share. */
export const BUDGET_ALERT_THRESHOLD = 0.8;

export type InteractionType = 'view' | 'click' | 'review' | 'photo';

interface RewardConfig {
  reward_per_view?: number;
  reward_per_click?: number;
  reward_per_review?: number;
  reward_per_photo?: number;
  max_tokens?: number;
  tokens_issued?: number;
}

/**
 * Tokens granted for an interaction. Campaigns configure this explicitly
 * (Area 5); campaigns created before that config fall back to the ad's legacy
 * fixed dollar reward so existing adverts keep paying out.
 */
export function tokensForInteraction(
  campaign: RewardConfig | null | undefined,
  type: InteractionType,
  legacyRewardAmount = 0
): number {
  const configured =
    type === 'view'
      ? campaign?.reward_per_view
      : type === 'click'
        ? campaign?.reward_per_click
        : type === 'review'
          ? campaign?.reward_per_review
          : campaign?.reward_per_photo;

  if (configured && configured > 0) return Math.floor(configured);
  if (legacyRewardAmount > 0) return Math.max(1, Math.round(legacyRewardAmount / TOKEN_VALUE));
  return 0;
}

/** Tokens still available in the campaign pool; Infinity when uncapped. */
export function remainingTokens(campaign: RewardConfig | null | undefined): number {
  const cap = campaign?.max_tokens || 0;
  if (cap <= 0) return Infinity;
  return Math.max(0, cap - (campaign?.tokens_issued || 0));
}

/** True once the configured pool is fully spent (never true when uncapped). */
export function isPoolExhausted(campaign: RewardConfig | null | undefined): boolean {
  return remainingTokens(campaign) <= 0;
}
