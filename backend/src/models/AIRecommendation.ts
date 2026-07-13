import mongoose, { Schema, Document, Types } from 'mongoose';

export type AIRecommendationType = 'bid' | 'budget' | 'creative' | 'device' | 'targeting';
export type AIRecommendationStatus = 'pending' | 'applied' | 'dismissed';

export interface IAIRecommendation extends Document {
  _id: Types.ObjectId;
  campaign_id: string;
  type: AIRecommendationType;
  title: string;
  description: string;
  expected_impact: string;
  confidence: number;
  status: AIRecommendationStatus;
  created_at: Date;
}

const AIRecommendationSchema = new Schema<IAIRecommendation>({
  campaign_id: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['bid', 'budget', 'creative', 'device', 'targeting'],
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  expected_impact: { type: String, default: '' },
  confidence: { type: Number, default: 0.5, min: 0, max: 1 },
  status: { type: String, enum: ['pending', 'applied', 'dismissed'], default: 'pending' },
  created_at: { type: Date, default: Date.now },
});

export const AIRecommendation = mongoose.model<IAIRecommendation>(
  'AIRecommendation',
  AIRecommendationSchema
);
