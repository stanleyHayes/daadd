export enum UserRole {
  ADVERTISER = 'ADVERTISER',
  CAMPAIGN_MANAGER = 'CAMPAIGN_MANAGER',
  ANALYST = 'ANALYST',
  END_USER = 'END_USER',
  MERCHANT = 'MERCHANT',
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM',
}

export enum CampaignManagerRole {
  VIEWER = 'VIEWER',
  EDITOR = 'EDITOR',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  organization_id?: string;
  is_active: boolean;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}
