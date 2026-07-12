export enum RedemptionStatus {
  QR_GENERATED = 'QR_GENERATED',
  QR_SCANNED = 'QR_SCANNED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export interface Redemption {
  id: string;
  user_id: string;
  merchant_id: string;
  campaign_id: string | null;
  tokens_to_redeem: number;
  purchase_amount: number | null;
  discount_amount: number | null;
  final_amount: number | null;
  currency: string;
  status: RedemptionStatus;
  qr_expires_at: Date;
  qr_used: boolean;
  created_at: Date;
  approved_at: Date | null;
}

export interface QRGenerateRequest {
  merchant_id: string;
  tokens_to_redeem: number;
}

export interface QRGenerateResponse {
  qr_data: string;
  redemption_id: string;
  expires_at: string;
}

export interface DiscountCalculation {
  redemption_id: string;
  customer_name: string;
  purchase_amount: number;
  discount_amount: number;
  final_amount: number;
  tokens_used: number;
  currency: string;
}
