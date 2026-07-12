export interface Merchant {
  id: string;
  user_id: string;
  business_name: string;
  business_address: string | null;
  phone: string | null;
  currency: string;
  max_tokens_per_transaction: number;
  max_discount_percentage: number;
  daily_redemption_cap: number;
  token_value: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MerchantPublic {
  id: string;
  business_name: string;
  business_address: string | null;
  currency: string;
  token_value: number;
  max_tokens_per_transaction: number;
  max_discount_percentage: number;
}
