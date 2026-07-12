import {
  AD_FATIGUE_THRESHOLD,
  MIN_ADVERTISERS_BENCHMARK,
  MIN_BUDGET_LOCALIZATION,
  MIN_CAMPAIGN_RUNTIME_AI_HOURS,
  MIN_CAMPAIGN_RUNTIME_STORY_HOURS,
  MIN_VIEWS_FOR_HEATMAP,
} from '../constants';

/**
 * Checks whether a campaign budget meets the minimum threshold
 * required for localization features.
 */
export function isValidBudgetForLocalization(budget: number): boolean {
  return budget >= MIN_BUDGET_LOCALIZATION;
}

/**
 * Determines if a campaign has been running long enough
 * to enable AI optimization (minimum 48 hours).
 */
export function canEnableAIOptimization(campaignStartDate: Date): boolean {
  const now = new Date();
  const runtimeMs = now.getTime() - campaignStartDate.getTime();
  const runtimeHours = runtimeMs / (1000 * 60 * 60);
  return runtimeHours >= MIN_CAMPAIGN_RUNTIME_AI_HOURS;
}

/**
 * Determines if a campaign has enough runtime and views
 * to generate an Ad Journey Story (minimum 24 hours and sufficient views).
 */
export function canGenerateStory(campaignStartDate: Date, viewCount: number): boolean {
  const now = new Date();
  const runtimeMs = now.getTime() - campaignStartDate.getTime();
  const runtimeHours = runtimeMs / (1000 * 60 * 60);
  return runtimeHours >= MIN_CAMPAIGN_RUNTIME_STORY_HOURS && viewCount >= MIN_VIEWS_FOR_HEATMAP;
}

/**
 * Checks whether there are enough views to render
 * meaningful heatmap visualizations.
 */
export function canShowHeatmap(viewCount: number): boolean {
  return viewCount >= MIN_VIEWS_FOR_HEATMAP;
}

/**
 * Checks whether there are enough advertisers in the industry
 * to display competitive benchmark data.
 */
export function canShowBenchmark(advertiserCount: number): boolean {
  return advertiserCount >= MIN_ADVERTISERS_BENCHMARK;
}

/**
 * Determines if a user has seen an ad enough times
 * to be considered fatigued within the current window.
 */
export function isAdFatigued(impressionCount: number): boolean {
  return impressionCount >= AD_FATIGUE_THRESHOLD;
}
