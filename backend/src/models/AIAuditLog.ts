import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAIAuditLog extends Document {
  _id: Types.ObjectId;
  campaign_id: string;
  version: number;
  action: string;
  field: string;
  old_value: string;
  new_value: string;
  applied_by: 'ai' | 'user';
  timestamp: Date;
}

const AIAuditLogSchema = new Schema<IAIAuditLog>({
  campaign_id: { type: String, required: true, index: true },
  version: { type: Number, default: 1 },
  action: { type: String, required: true },
  field: { type: String, default: '' },
  old_value: { type: String, default: '' },
  new_value: { type: String, default: '' },
  applied_by: { type: String, enum: ['ai', 'user'], default: 'user' },
  timestamp: { type: Date, default: Date.now },
});

export const AIAuditLog = mongoose.model<IAIAuditLog>('AIAuditLog', AIAuditLogSchema);
