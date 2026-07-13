import mongoose, { Schema, Document, Types } from 'mongoose';

export type PlatformName = 'google' | 'meta' | 'tiktok' | 'linkedin' | 'pinterest';
export type PlatformAccountStatus = 'connected' | 'pending' | 'sync_error' | 'revoked';

export interface IPlatformAccount extends Document {
  _id: Types.ObjectId;
  user_id: string | Types.ObjectId;
  platform: PlatformName;
  platform_account_id: string;
  platform_account_name?: string;
  status: PlatformAccountStatus;
  is_active: boolean;
  sync_frequency: 'realtime' | 'hourly' | 'daily';
  last_synced?: Date;
  error_message?: string;
  metrics?: {
    impressions?: number;
    clicks?: number;
    spend?: number;
  };
  created_at: Date;
}

const PlatformAccountSchema = new Schema<IPlatformAccount>({
  user_id: { type: Schema.Types.Mixed, ref: 'User', required: true, index: true },
  platform: {
    type: String,
    enum: ['google', 'meta', 'tiktok', 'linkedin', 'pinterest'],
    required: true,
  },
  platform_account_id: { type: String, default: '' },
  platform_account_name: { type: String, default: '' },
  status: {
    type: String,
    enum: ['connected', 'pending', 'sync_error', 'revoked'],
    default: 'pending',
  },
  is_active: { type: Boolean, default: true },
  sync_frequency: { type: String, enum: ['realtime', 'hourly', 'daily'], default: 'daily' },
  last_synced: { type: Date },
  error_message: { type: String },
  metrics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
  },
  created_at: { type: Date, default: Date.now },
});

export const PlatformAccount = mongoose.model<IPlatformAccount>(
  'PlatformAccount',
  PlatformAccountSchema
);
