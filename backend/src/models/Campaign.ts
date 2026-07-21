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
  // Percent of a customer's purchase shared back as the max redemption discount
  // for this campaign (0–100). Drives the discount applied at redemption instead
  // of a fixed price — see routes/redemption.ts.
  discount_percentage: number;
  // --- Reward economics (V2 Area 5) ---
  // Share of `discount_percentage` passed to consumers as reward tokens.
  // e.g. a 20% promo with a 5% consumer share -> customers earn tokens worth 5%.
  consumer_share_pct: number;
  // Campaign token cap (0 = uncapped) and the running total issued so far.
  max_tokens: number;
  tokens_issued: number;
  // Tokens granted per interaction; 0 falls back to the ad's legacy reward.
  reward_per_view: number;
  reward_per_click: number;
  reward_per_review: number;
  reward_per_photo: number;
  // Set once we've warned the advertiser that the pool is nearly exhausted.
  budget_alert_sent: boolean;
  // Advertiser contact details shown on this campaign's adverts (per-campaign).
  location?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_website?: string;
  business_logo?: string;
  business_category?: string;
  opening_hours?: string;
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
    discount_percentage: { type: Number, default: 15, min: 0, max: 100 },
    consumer_share_pct: { type: Number, default: 0, min: 0, max: 100 },
    max_tokens: { type: Number, default: 0, min: 0 },
    tokens_issued: { type: Number, default: 0, min: 0 },
    reward_per_view: { type: Number, default: 0, min: 0 },
    reward_per_click: { type: Number, default: 0, min: 0 },
    reward_per_review: { type: Number, default: 0, min: 0 },
    reward_per_photo: { type: Number, default: 0, min: 0 },
    budget_alert_sent: { type: Boolean, default: false },
    location: { type: String, default: '', trim: true },
    contact_phone: { type: String, default: '', trim: true },
    contact_email: { type: String, default: '', trim: true },
    contact_website: { type: String, default: '', trim: true },
    business_logo: { type: String, default: '', trim: true },
    business_category: { type: String, default: '', trim: true },
    opening_hours: { type: String, default: '', trim: true },
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
