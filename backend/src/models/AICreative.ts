import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICreativeVariation {
  headline: string;
  bodyText: string;
  cta: string;
  tone: string;
  confidence: number;
}

export interface IAICreative extends Document {
  _id: Types.ObjectId;
  campaign_id: string;
  variations: ICreativeVariation[];
  language: string;
  created_at: Date;
}

const AICreativeSchema = new Schema<IAICreative>({
  campaign_id: { type: String, required: true, index: true },
  variations: {
    type: [
      {
        headline: { type: String, default: '' },
        bodyText: { type: String, default: '' },
        cta: { type: String, default: '' },
        tone: { type: String, default: 'professional' },
        confidence: { type: Number, default: 0.5 },
      },
    ],
    default: [],
  },
  language: { type: String, default: 'en' },
  created_at: { type: Date, default: Date.now },
});

export const AICreative = mongoose.model<IAICreative>('AICreative', AICreativeSchema);
