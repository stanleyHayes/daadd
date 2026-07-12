import { Industry } from './campaign.types';

export interface DashboardMetrics {
  impressions: number;
  viewable_impressions?: number;
  viewability_rate?: number;
  clicks: number;
  ctr: number;
  bounce_rate: number;
  conversion_rate: number;
  cpc: number;
  cpa: number;
}

export enum TimeRange {
  SEVEN_DAYS = 'SEVEN_DAYS',
  THIRTY_DAYS = 'THIRTY_DAYS',
  CUSTOM = 'CUSTOM',
}

export enum DeviceType {
  DESKTOP = 'DESKTOP',
  MOBILE = 'MOBILE',
  TABLET = 'TABLET',
}

export interface FilterOptions {
  time_range: TimeRange;
  start_date?: Date;
  end_date?: Date;
  industry?: Industry;
  region?: string;
  device_type?: DeviceType;
}

export interface DemographicBreakdown {
  age_group: string;
  percentage: number;
}

export interface GeoDataPoint {
  lat: number;
  lng: number;
  city: string;
  country: string;
  view_count: number;
  ctr: number;
  demographic_breakdown: DemographicBreakdown[];
}

export type AggregationLevel = 'city' | 'country';

export interface HeatmapData {
  campaign_id: string;
  points: GeoDataPoint[];
  total_views: number;
  aggregation_level: AggregationLevel;
}
