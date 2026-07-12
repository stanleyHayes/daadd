export enum CampaignStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  SUSPENDED = 'SUSPENDED',
}

export enum Industry {
  ENTERTAINMENT = 'ENTERTAINMENT',
  SPORTS = 'SPORTS',
  RETAIL = 'RETAIL',
  TECHNOLOGY = 'TECHNOLOGY',
  FOOD_BEVERAGE = 'FOOD_BEVERAGE',
  HEALTH = 'HEALTH',
  FINANCE = 'FINANCE',
  EDUCATION = 'EDUCATION',
  TRAVEL = 'TRAVEL',
  AUTOMOTIVE = 'AUTOMOTIVE',
  OTHER = 'OTHER',
}

export type CreativeType = 'image' | 'video';

export interface Creative {
  id: string;
  type: CreativeType;
  url: string;
  format: string;
}

export interface TargetingConfig {
  age_range: {
    min: number;
    max: number;
  };
  regions: string[];
  devices: string[];
  languages: string[];
}

export interface Campaign {
  id: string;
  advertiser_id: string;
  name: string;
  budget_total: number;
  budget_spent: number;
  start_date: Date;
  end_date: Date;
  industry: Industry;
  targeting_config: TargetingConfig;
  status: CampaignStatus;
  ai_optimization_enabled: boolean;
  reward_value: number;
  is_age_restricted: boolean;
  creatives: Creative[];
  created_at: Date;
  updated_at: Date;
}
