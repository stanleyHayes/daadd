import mongoose, { Schema, Document, Types } from 'mongoose';

export type UserRole = 'admin' | 'advertiser' | 'campaign_manager' | 'analyst' | 'end_user';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  avatar_url?: string;
  created_at: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'advertiser', 'campaign_manager', 'analyst', 'end_user'],
    default: 'end_user',
  },
  avatar_url: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
});

export const User = mongoose.model<IUser>('User', UserSchema);
