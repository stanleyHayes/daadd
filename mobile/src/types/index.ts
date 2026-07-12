export interface User {
  id: string;
  name: string;
  email: string;
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

export interface LinkedDevice {
  id: string;
  name: string;
  type: 'phone' | 'tablet' | 'tv';
  lastActive: string;
  isCurrent: boolean;
}
