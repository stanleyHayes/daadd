import mongoose, { Schema, Document, Types } from 'mongoose';

export type AdStatus = 'draft' | 'active' | 'paused' | 'pending_review' | 'rejected' | 'completed';

export interface IAd extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  brand: string;
  industry: string;
  image_url: string;
  media_url?: string;
  isAgeRestricted: boolean;
  reward_amount: number;
  status: AdStatus;
  campaign_id: Types.ObjectId;
  created_at: Date;
}

const AdSchema = new Schema<IAd>({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  brand: { type: String, required: true, trim: true },
  industry: { type: String, required: true, trim: true },
  image_url: { type: String, default: '' },
  media_url: { type: String, default: '' },
  isAgeRestricted: { type: Boolean, default: false },
  reward_amount: { type: Number, default: 0, min: 0 },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'pending_review', 'rejected', 'completed'],
    default: 'active',
  },
  campaign_id: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  created_at: { type: Date, default: Date.now },
});

export const Ad = mongoose.model<IAd>('Ad', AdSchema);
