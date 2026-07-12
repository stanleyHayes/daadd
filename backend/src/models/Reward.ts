import mongoose, { Schema, Document, Types } from 'mongoose';

export type RewardStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface IReward extends Document {
  _id: Types.ObjectId;
  user_id: string | Types.ObjectId;
  ad_id: Types.ObjectId;
  ad_title: string;
  amount: number;
  status: RewardStatus;
  created_at: Date;
}

const RewardSchema = new Schema<IReward>({
  user_id: { type: Schema.Types.Mixed, ref: 'User', required: true },
  ad_id: { type: Schema.Types.ObjectId, ref: 'Ad', required: true },
  ad_title: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending',
  },
  created_at: { type: Date, default: Date.now },
});

export const Reward = mongoose.model<IReward>('Reward', RewardSchema);
