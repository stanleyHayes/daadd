import mongoose, { Schema, Document, Types } from 'mongoose';

export type UserRole = 'admin' | 'advertiser' | 'campaign_manager' | 'analyst' | 'end_user' | 'merchant';

/** Advertiser onboarding: admin review state for self-registered advertisers. */
export type AdvertiserApproval = 'pending' | 'approved' | 'rejected';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  /**
   * The Role document this user was created or invited with. `role` above is
   * the coarse account type and still drives the JWT; `role_id` carries the
   * editable permission set. Absent on consumer accounts, which have no
   * dashboard access to gate.
   */
  role_id?: Types.ObjectId;
  /**
   * Individual adjustments layered on top of the role, so one person can be
   * given or denied something without moving everyone who shares their role.
   */
  permission_overrides?: { granted: string[]; revoked: string[] };
  avatar_url?: string;
  age_verified: boolean;
  // Advertiser onboarding gates (see routes/auth.ts + utils/advertiser-gate.ts).
  // An advertiser may only run ads (set a campaign to `active`) once all three
  // are satisfied: email verified, admin-approved, and billing set up.
  email_verified: boolean;
  advertiser_approval: AdvertiserApproval;
  billing_ready: boolean;
  // Engagement streak: consecutive days the user earned a reward. An active
  // streak grants a token bonus on new rewards (see utils/streak.ts).
  streak_count: number;
  last_reward_date?: Date;
  // Independent streaks per activity type (daily / ad / merchant / review).
  // `streak_count` above remains the headline daily streak for compatibility.
  streaks?: Record<string, { count?: number; last_at?: Date }>;
  // VIP loyalty tier (V2 Area 8) — auto-qualified from engagement metrics.
  vip_tier: 'none' | 'vip';
  vip_since?: Date;
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
  device_ids: string[];
  attribution_window_days: number;
  created_at: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'advertiser', 'campaign_manager', 'analyst', 'end_user', 'merchant'],
    default: 'end_user',
  },
  role_id: { type: Schema.Types.ObjectId, ref: 'Role', index: true },
  permission_overrides: {
    granted: { type: [String], default: [] },
    revoked: { type: [String], default: [] },
  },
  avatar_url: { type: String, default: '' },
  age_verified: { type: Boolean, default: false },
  // Advertiser onboarding gates.
  email_verified: { type: Boolean, default: false },
  advertiser_approval: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  billing_ready: { type: Boolean, default: false },
  // Engagement streak (gamification).
  streak_count: { type: Number, default: 0 },
  last_reward_date: { type: Date },
  streaks: { type: Schema.Types.Mixed, default: {} },
  vip_tier: { type: String, enum: ['none', 'vip'], default: 'none' },
  vip_since: { type: Date },
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
  // Cross-device attribution (spec §4.11): known devices for this user
  // (deduped on event record) and the lookback window for journeys.
  device_ids: { type: [String], default: [] },
  attribution_window_days: { type: Number, default: 30, enum: [7, 14, 30, 90] },
  created_at: { type: Date, default: Date.now },
});

export const User = mongoose.model<IUser>('User', UserSchema);
