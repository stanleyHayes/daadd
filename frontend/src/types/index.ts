// ---- User & Auth ----
export type UserRole = 'admin' | 'advertiser' | 'campaign_manager' | 'analyst' | 'end_user';

export type AdvertiserApproval = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    email_notifications?: boolean;
  };
  created_at: string;
  // Advertiser onboarding gate (see backend utils/advertiser-gate.ts).
  email_verified?: boolean;
  advertiser_approval?: AdvertiserApproval;
  billing_ready?: boolean;
  can_run_ads?: boolean;
  onboarding_missing?: string[];
}

// ---- Campaign ----
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'suspended';

export type Industry =
  | 'entertainment'
  | 'sports'
  | 'retail'
  | 'technology'
  | 'food_beverage'
  | 'health'
  | 'finance'
  | 'travel'
  | 'automotive'
  | 'education';

export interface TargetingConfig {
  age_min: number;
  age_max: number;
  regions: string[];
  devices: ('desktop' | 'mobile' | 'tablet')[];
  languages: string[];
  localized: boolean;
}

export interface Creative {
  id: string;
  campaign_id: string;
  file_url: string;
  file_type: 'image' | 'video';
  file_name: string;
  file_size: number;
  age_restricted: boolean;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  industry: Industry;
  status: CampaignStatus;
  budget_total: number;
  budget_spent: number;
  reward_value: number;
  start_date: string;
  end_date: string;
  targeting_config: TargetingConfig | null;
  creatives: Creative[];
  ai_optimization_enabled: boolean;
  ai_mode: AIMode;
  advertiser_id: string;
  is_age_restricted: boolean;
  age_min?: number;
  age_max?: number;
  language?: string;
  ctr?: number;
  created_at: string;
  updated_at: string;
}

// ---- Analytics ----
export interface DashboardMetrics {
  totalCampaigns: number;
  totalImpressions: number;
  totalClicks?: number;
  avgCTR: number;
  totalSpend: number;
  campaignChange: number;
  impressionChange: number;
  clickChange?: number;
  ctrChange: number;
  spendChange: number;
  bounceRate?: number;
  bounceRateChange?: number;
  conversionRate?: number;
  conversionRateChange?: number;
  cpc?: number;
  cpcChange?: number;
  cpa?: number;
  cpaChange?: number;
  // Real money metrics from attributed redemptions (recs #1 & #2).
  revenue?: number;
  purchases?: number;
  discountUsed?: number;
  profit?: number;
  discountPercentage?: number;
}

export interface TimeSeriesPoint {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface FunnelData {
  label: string;
  value: number;
  color: string;
}

export interface DeviceBreakdownData {
  device: string;
  impressions: number;
  clicks: number;
  ctr: number;
  percentage: number;
}

// ---- Geo / Heatmap ----
export interface GeoDataPoint {
  lat: number;
  lng: number;
  weight: number;
  region?: string;
  views?: number;
  ctr?: number;
}

export interface HeatmapData {
  points: GeoDataPoint[];
  total_views: number;
  avg_ctr?: number;
  active_regions?: number;
  top_regions: {
    name: string;
    views: number;
    ctr: number;
    demographic?: string;
  }[];
}

// ---- AI ----
export type AIMode = 'auto_adjust' | 'recommendation_only';

export type AIRecommendationType = 'bid' | 'budget' | 'creative' | 'device' | 'targeting';

export interface AIRecommendation {
  id: string;
  campaign_id: string;
  type: AIRecommendationType;
  title: string;
  description: string;
  expected_impact: string;
  confidence: number;
  status: 'pending' | 'applied' | 'dismissed';
  created_at: string;
}

export interface AIAuditLog {
  id: string;
  campaign_id: string;
  version: number;
  action: string;
  field: string;
  old_value: string;
  new_value: string;
  applied_by: 'ai' | 'user';
  timestamp: string;
}

// ---- Anomalies ----
export type AnomalyType = 'ctr_drop' | 'ctr_spike' | 'spend_anomaly' | 'impression_anomaly' | 'bot_traffic';
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Anomaly {
  id: string;
  campaign_id: string;
  campaign_name: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  metric: string;
  current_value: number;
  threshold_value: number;
  description: string;
  detected_at: string;
  resolved_at?: string;
  resolved_by?: string;
  auto_paused: boolean;
}

// ---- Benchmarking ----
export interface BenchmarkComparison {
  metric: string;
  your_value: number;
  industry_avg: number;
  percentile: number;
  is_above_avg: boolean;
}

export interface BenchmarkData {
  campaign_id: string;
  industry: Industry;
  advertiser_count: number;
  /** True when <3 advertisers in the industry — aggregates withheld (privacy gate). */
  gated?: boolean;
  comparisons: BenchmarkComparison[];
  format_performance: {
    format: string;
    ctr: number;
    cpa: number;
  }[];
  device_trends: {
    device: string;
    your_ctr: number;
    industry_ctr: number;
  }[];
}

// ---- Storyteller ----
export interface StoryChapterData {
  id: string;
  number: number;
  title: string;
  narrative: string;
  data: Record<string, unknown>;
}

export interface AdJourneyStory {
  campaign_id: string;
  campaign_name: string;
  is_preliminary: boolean;
  campaign_age_hours?: number;
  chapters: StoryChapterData[];
  key_insights: string[];
  recommendations: string[];
  money_flow?: {
    regions: { name: string; cost: number; efficiency: number }[];
  };
}

// ---- Rewards ----
export type RewardStatus = 'pending' | 'approved' | 'paid' | 'rejected' | 'claimed' | 'expired';

export interface Reward {
  id: string;
  ad_id: string;
  ad_title: string;
  amount: number;
  status: RewardStatus;
  earned_at: string;
  claimed_at?: string;
  // Non-ad rewards (review credits, redemption debits) carry a type/note but no
  // ad_title; used to label the reward history correctly.
  type?: string;
  note?: string;
}

// ---- Team ----
export type TeamRole = 'viewer' | 'editor' | 'admin';

export interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: TeamRole;
  avatar_url?: string;
  joined_at: string;
}

export interface AuditLogEntry {
  id: string;
  user_name: string;
  action: string;
  field: string;
  old_value: string;
  new_value: string;
  timestamp: string;
}

// ---- Notifications ----
export type NotificationType = 'anomaly' | 'optimization' | 'campaign' | 'team' | 'info' | 'reward' | 'welcome' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// ---- API Responses ----
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ---- Filters ----
export interface FilterOptions {
  status?: CampaignStatus;
  industry?: Industry;
  search?: string;
  start_date?: string;
  end_date?: string;
  region?: string;
  device?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ---- Public Ads ----
export interface PublicAd {
  id: string;
  title: string;
  description: string;
  industry: Industry;
  advertiser_name: string;
  creative_url: string;
  creative_type: 'image' | 'video';
  reward_amount: number;
  age_restricted: boolean;
  trending: boolean;
  view_count: number;
  created_at: string;
}
