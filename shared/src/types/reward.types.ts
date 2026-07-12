export enum RewardStatus {
  PENDING = 'PENDING',
  CREDITED = 'CREDITED',
  REDEEMED = 'REDEEMED',
  EXPIRED = 'EXPIRED',
}

export interface Reward {
  id: string;
  user_id: string;
  campaign_id: string;
  amount: number;
  status: RewardStatus;
  earned_at: Date;
  redeemed_at?: Date;
}
