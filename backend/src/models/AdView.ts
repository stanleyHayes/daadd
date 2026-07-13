import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAdView extends Document {
  _id: Types.ObjectId;
  user_id: string | Types.ObjectId;
  ad_id: string;
  viewed_at: Date;
}

const AdViewSchema = new Schema<IAdView>({
  user_id: { type: Schema.Types.Mixed, ref: 'User', required: true, index: true },
  ad_id: { type: String, required: true, index: true },
  viewed_at: { type: Date, default: Date.now, index: true },
});

AdViewSchema.index({ user_id: 1, ad_id: 1, viewed_at: -1 });

export const AdView = mongoose.model<IAdView>('AdView', AdViewSchema);
