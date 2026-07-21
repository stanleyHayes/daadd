import mongoose, { Schema, Document, Types } from 'mongoose';

export type RedemptionStatus = 'pending' | 'scanned' | 'validated' | 'completed' | 'expired' | 'rejected';

/** A line item captured by the cashier at validation time. */
export interface IRedemptionItem {
  name: string;
  quantity: number;
  unit_price: number;
}

export interface IRedemption extends Document {
  _id: Types.ObjectId;
  user_id: string | Types.ObjectId;
  merchant_id?: string | Types.ObjectId;
  // The campaign/advertiser this redemption is attributed to (drives per-ad
  // revenue analytics and the campaign-specific discount rate).
  campaign_id?: string | Types.ObjectId;
  // Which branch the customer visited (chosen by the customer at QR time).
  outlet_id?: string | Types.ObjectId;
  tokens: number;
  purchase_amount?: number;
  discount_amount?: number;
  final_amount?: number;
  // Itemised purchase + a human-readable receipt number for both parties.
  items: IRedemptionItem[];
  receipt_no?: string;
  nonce: string;
  status: RedemptionStatus;
  expires_at: Date;
  used_at?: Date;
  created_at: Date;
}

const RedemptionSchema = new Schema<IRedemption>({
  user_id: { type: Schema.Types.Mixed, ref: 'User', required: true },
  merchant_id: { type: Schema.Types.Mixed, ref: 'User' },
  campaign_id: { type: Schema.Types.ObjectId, ref: 'Campaign' },
  outlet_id: { type: Schema.Types.ObjectId, ref: 'Outlet' },
  tokens: { type: Number, required: true, min: 1 },
  purchase_amount: { type: Number },
  discount_amount: { type: Number },
  final_amount: { type: Number },
  items: {
    type: [
      {
        name: { type: String, required: true, trim: true },
        quantity: { type: Number, default: 1, min: 0 },
        unit_price: { type: Number, default: 0, min: 0 },
      },
    ],
    default: [],
  },
  receipt_no: { type: String },
  nonce: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'scanned', 'validated', 'completed', 'expired', 'rejected'],
    default: 'pending',
  },
  expires_at: { type: Date, required: true },
  used_at: { type: Date },
  created_at: { type: Date, default: Date.now },
});

export const Redemption = mongoose.model<IRedemption>('Redemption', RedemptionSchema);
