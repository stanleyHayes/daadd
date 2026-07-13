import mongoose, { Schema, Document, Types } from 'mongoose';

export type ABTestStatus = 'running' | 'completed';

export interface IABTestVariant {
  creative_id: string;
  variant: string;
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface IABTest extends Document {
  _id: Types.ObjectId;
  campaign_id: string;
  name: string;
  control_creative_id: string;
  variant_creative_ids: string[];
  traffic_allocation: number;
  variants: IABTestVariant[];
  status: ABTestStatus;
  winner?: { creative_id: string; variant: string };
  created_at: Date;
}

const ABTestSchema = new Schema<IABTest>({
  campaign_id: { type: String, required: true, index: true },
  name: { type: String, default: 'A/B Test' },
  control_creative_id: { type: String, required: true },
  variant_creative_ids: { type: [String], default: [] },
  traffic_allocation: { type: Number, default: 50, min: 0, max: 100 },
  variants: {
    type: [
      {
        creative_id: { type: String, required: true },
        variant: { type: String, required: true },
        impressions: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
        conversions: { type: Number, default: 0 },
      },
    ],
    default: [],
  },
  status: { type: String, enum: ['running', 'completed'], default: 'running' },
  winner: {
    creative_id: { type: String },
    variant: { type: String },
  },
  created_at: { type: Date, default: Date.now },
});

export const ABTest = mongoose.model<IABTest>('ABTest', ABTestSchema);
