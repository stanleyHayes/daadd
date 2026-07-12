import { AnomalyThresholds } from '../types/anomaly.types';

/** Maximum impressions before ad fatigue kicks in */
export const AD_FATIGUE_THRESHOLD = 5;

/** Time window in hours for ad fatigue calculation */
export const AD_FATIGUE_WINDOW_HOURS = 24;

/** Minimum view count required to display heatmap data */
export const MIN_VIEWS_FOR_HEATMAP = 100;

/** Minimum campaign runtime in hours before AI optimization can be enabled */
export const MIN_CAMPAIGN_RUNTIME_AI_HOURS = 48;

/** Minimum campaign runtime in hours before story generation is available */
export const MIN_CAMPAIGN_RUNTIME_STORY_HOURS = 24;

/** Minimum budget required to enable localization features */
export const MIN_BUDGET_LOCALIZATION = 500;

/** Minimum number of advertisers in an industry to show benchmark data */
export const MIN_ADVERTISERS_BENCHMARK = 3;

/** Default anomaly detection thresholds */
export const ANOMALY_THRESHOLDS: AnomalyThresholds = {
  min_ctr: 1.5,
  max_ctr_spike: 10,
  traffic_spike_pct: 500,
};
