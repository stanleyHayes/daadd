import mongoose, { Schema, Document, Types } from 'mongoose';

/** Moderation state for user-uploaded photo/video. */
export type MediaStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface IReview extends Document {
  _id: Types.ObjectId;
  campaign_id: Types.ObjectId;
  user: Types.ObjectId;
  /**
   * Overall rating, 1–5. Zero means the user has only recorded their
   * BEFORE-visit expectations and hasn't reviewed the visit yet — those rows
   * are excluded from rating averages.
   */
  rating: number;
  comment: string;
  // A photo of the place/experience (Cloudinary URL); reviewing with media
  // earns bonus reward tokens once moderation approves it.
  photo_url?: string;
  video_url?: string;
  media_status: MediaStatus;
  /** Guards against paying the media bonus twice. */
  media_bonus_granted: boolean;
  /** Recorded BEFORE visiting (V2 Area 9). */
  expectation?: {
    experience?: number;
    service?: number;
    product?: number;
    planned_purchase?: string;
    recorded_at?: Date;
  };
  /** Recorded AFTER visiting, to compare against the expectation. */
  reality?: {
    experience?: number;
    satisfaction?: number;
    product?: number;
    service?: number;
  };
  created_at: Date;
}

const ReviewSchema = new Schema<IReview>({
  campaign_id: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  comment: { type: String, default: '' },
  photo_url: { type: String, default: '' },
  video_url: { type: String, default: '' },
  media_status: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none',
  },
  media_bonus_granted: { type: Boolean, default: false },
  expectation: {
    experience: { type: Number, min: 0, max: 5 },
    service: { type: Number, min: 0, max: 5 },
    product: { type: Number, min: 0, max: 5 },
    planned_purchase: { type: String, default: '' },
    recorded_at: { type: Date },
  },
  reality: {
    experience: { type: Number, min: 0, max: 5 },
    satisfaction: { type: Number, min: 0, max: 5 },
    product: { type: Number, min: 0, max: 5 },
    service: { type: Number, min: 0, max: 5 },
  },
  created_at: { type: Date, default: Date.now },
});

// One review per user per campaign (the route also pre-checks for a clean 409).
ReviewSchema.index({ campaign_id: 1, user: 1 }, { unique: true });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
