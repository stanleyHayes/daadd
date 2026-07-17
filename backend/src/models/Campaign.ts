import mongoose, { Schema, Document, Types } from 'mongoose';

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

export interface ICampaign extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  status: CampaignStatus;
  industry: string;
  budget_total: number;
  budget_spent: number;
  reward_value: number;
  currency: string;
  start_date: Date;
  end_date: Date;
  enable_ai_optimization: boolean;
  ai_mode: 'auto_adjust' | 'recommendation_only';
  language: string;
  targeting_config?: {
    age_min?: number;
    age_max?: number;
    regions?: string[];
    devices?: string[];
    languages?: string[];
    localized?: boolean;
  };
  platform_ids: string[];
  owner: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed', 'archived'],
      default: 'draft',
    },
    industry: { type: String, required: true, trim: true },
    budget_total: { type: Number, default: 0, min: 0 },
    budget_spent: { type: Number, default: 0, min: 0 },
    reward_value: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'USD' },
    start_date: { type: Date, default: Date.now },
    end_date: { type: Date, default: Date.now },
    enable_ai_optimization: { type: Boolean, default: false },
    ai_mode: {
      type: String,
      enum: ['auto_adjust', 'recommendation_only'],
      default: 'recommendation_only',
    },
    language: { type: String, default: 'en' },
    targeting_config: { type: Schema.Types.Mixed, default: null },
    platform_ids: { type: [String], default: [] },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
