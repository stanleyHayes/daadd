import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReview extends Document {
  _id: Types.ObjectId;
  campaign_id: Types.ObjectId;
  user: Types.ObjectId;
  rating: number;
  comment: string;
  created_at: Date;
}

const ReviewSchema = new Schema<IReview>({
  campaign_id: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
});

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
