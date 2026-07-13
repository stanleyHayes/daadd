import mongoose, { Schema, Document, Types } from 'mongoose';

export type UserRole = 'admin' | 'advertiser' | 'campaign_manager' | 'analyst' | 'end_user';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  avatar_url?: string;
  age_verified: boolean;
  push_tokens?: {
    token: string;
    platform: string;
    created_at: Date;
  }[];
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    email_notifications?: boolean;
  };
  created_at: Date;
}

const UserSchema = new Schema<IUser>({
  _id: { type: Schema.Types.Mixed },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'advertiser', 'campaign_manager', 'analyst', 'end_user'],
    default: 'end_user',
  },
  avatar_url: { type: String, default: '' },
  age_verified: { type: Boolean, default: false },
  push_tokens: {
    type: [
      {
        token: { type: String, required: true },
        platform: { type: String, required: true },
        created_at: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
  preferences: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    language: { type: String, default: 'en' },
    email_notifications: { type: Boolean, default: true },
  },
  created_at: { type: Date, default: Date.now },
});

export const User = mongoose.model<IUser>('User', UserSchema);
