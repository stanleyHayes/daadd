import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReview extends Document {
  _id: Types.ObjectId;
  campaign_id: Types.ObjectId;
  user: Types.ObjectId;
  rating: number;
  comment: string;
  // A photo of the place/experience (Cloudinary URL); reviewing with a photo
  // earns bonus reward tokens (see routes/reviews.ts).
  photo_url?: string;
  created_at: Date;
}

const ReviewSchema = new Schema<IReview>({
  campaign_id: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  photo_url: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
});

// One review per user per campaign (the route also pre-checks for a clean 409).
ReviewSchema.index({ campaign_id: 1, user: 1 }, { unique: true });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
