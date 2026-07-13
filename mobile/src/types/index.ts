export type UserRole =
  | 'admin'
  | 'advertiser'
  | 'campaign_manager'
  | 'analyst'
  | 'end_user';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
  stats: UserStats;
  preferences: UserPreferences;
}

export interface UserStats {
  adsViewed: number;
  totalRewardsEarned: number;
  currentBalance: number;
  joinedDate: string;
}

export interface UserPreferences {
  notifications: boolean;
  language: string;
  privacy: 'public' | 'private';
}

export interface Ad {
  id: string;
  title: string;
  description: string;
  creativeUrl: string;
  creativeType: 'image' | 'video' | 'carousel';
  advertiser: Advertiser;
  campaign: Campaign;
  industry: IndustryType;
  rewardAmount: number;
  rewardCurrency: string;
  isTrending: boolean;
  isFeatured: boolean;
  isAgeRestricted: boolean;
  minAge?: number;
  rating: number;
  reviewCount: number;
  viewCount: number;
  createdAt: string;
}

export interface Advertiser {
  id: string;
  name: string;
  logo?: string;
  verified: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
}

export interface Reward {
  id: string;
  amount: number;
  currency: string;
  campaignName: string;
  adTitle: string;
  status: RewardStatus;
  claimedAt: string;
  creditedAt?: string;
  redeemedAt?: string;
}

export type RewardStatus = 'pending' | 'credited' | 'redeemed' | 'expired';

export type IndustryType =
  | 'technology'
  | 'food_beverage'
  | 'fashion'
  | 'health'
  | 'finance'
  | 'entertainment'
  | 'travel'
  | 'education'
  | 'sports'
  | 'automotive'
  | 'real_estate'
  | 'retail';

export interface Industry {
  id: IndustryType;
  label: string;
  icon: string;
  color: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AdFilters {
  search?: string;
  industry?: IndustryType;
  sort?: 'trending' | 'newest' | 'reward_value';
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

// ---- Advertiser dashboard ----

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

export interface DashboardKpis {
  totalCampaigns: number;
  totalImpressions: number;
  totalClicks: number;
  avgCTR: number;
  totalSpend: number;
  campaignChange: number;
  impressionChange: number;
  clickChange: number;
  ctrChange: number;
  spendChange: number;
  bounceRate: number;
  bounceRateChange: number;
}

export interface DashboardCampaign {
  id: string;
  name: string;
  description: string;
  industry: string;
  status: CampaignStatus;
  budget_total: number;
  budget_spent: number;
  reward_value: number;
  start_date?: string;
  end_date?: string;
  ctr: number;
  ai_optimization_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export type RecommendationStatus = 'pending' | 'applied' | 'dismissed';

export interface AIRecommendationItem {
  id: string;
  campaign_id: string;
  type: 'bid' | 'budget' | 'creative' | 'device' | 'targeting';
  title: string;
  description: string;
  expected_impact: string;
  confidence: number;
  status: RecommendationStatus;
  created_at?: string;
}

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AnomalyItem {
  id: string;
  campaign_id: string;
  campaign_name: string;
  type: string;
  severity: AnomalySeverity;
  metric: string;
  current_value: number;
  threshold_value: number;
  description: string;
  detected_at?: string;
  resolved_at?: string;
  resolved_by?: string;
  auto_paused: boolean;
}

export interface BenchmarkComparison {
  metric: string;
  your_value: number;
  industry_avg: number;
  percentile: number;
  is_above_avg: boolean;
}

export interface BenchmarkData {
  campaign_id: string;
  industry: string;
  advertiser_count: number;
  comparisons: BenchmarkComparison[];
  format_performance: { format: string; ctr: number; cpa: number }[];
  device_trends: { device: string; your_ctr: number; industry_ctr: number }[];
}

export interface StoryChapter {
  number: number;
  title: string;
  narrative: string;
  stats: { impressions: number; clicks: number; spend: number };
}

export interface CampaignStory {
  campaign_id: string;
  campaign_name: string;
  is_preliminary: boolean;
  chapters: StoryChapter[];
  key_insights: string[];
  recommendations: string[];
}

export interface TeamMemberItem {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'viewer' | 'editor' | 'admin';
  status: string;
  avatar_url?: string;
  joined_at?: string;
}

export interface AttributionDevice {
  device_type: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
}

export interface AttributionPath {
  path: string[];
  conversions: number;
}

export interface AttributionData {
  devices: AttributionDevice[];
  paths: AttributionPath[];
}

export interface LinkedDevice {
  id: string;
  name: string;
  type: 'phone' | 'tablet' | 'tv';
  lastActive: string;
  isCurrent: boolean;
}
