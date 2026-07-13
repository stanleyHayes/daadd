import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITeamAuditLog extends Document {
  _id: Types.ObjectId;
  campaign_id: string;
  user_name: string;
  action: string;
  field: string;
  old_value: string;
  new_value: string;
  timestamp: Date;
}

const TeamAuditLogSchema = new Schema<ITeamAuditLog>({
  campaign_id: { type: String, required: true, index: true },
  user_name: { type: String, default: '' },
  action: { type: String, required: true },
  field: { type: String, default: '' },
  old_value: { type: String, default: '' },
  new_value: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
});

export const TeamAuditLog = mongoose.model<ITeamAuditLog>('TeamAuditLog', TeamAuditLogSchema);
