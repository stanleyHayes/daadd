import mongoose, { Schema, Document, Types } from 'mongoose';

export type TeamRole = 'viewer' | 'editor' | 'admin';
export type TeamMemberStatus = 'active' | 'invited';

export interface ITeamMember extends Document {
  _id: Types.ObjectId;
  campaign_id: string;
  user_id?: string | Types.ObjectId;
  name: string;
  email: string;
  role: TeamRole;
  status: TeamMemberStatus;
  invited_by?: string | Types.ObjectId;
  created_at: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>({
  campaign_id: { type: String, required: true, index: true },
  user_id: { type: Schema.Types.Mixed, ref: 'User' },
  name: { type: String, default: '' },
  email: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, enum: ['viewer', 'editor', 'admin'], default: 'viewer' },
  status: { type: String, enum: ['active', 'invited'], default: 'invited' },
  invited_by: { type: Schema.Types.Mixed, ref: 'User' },
  created_at: { type: Date, default: Date.now },
});

export const TeamMember = mongoose.model<ITeamMember>('TeamMember', TeamMemberSchema);
