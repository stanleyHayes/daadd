import mongoose, { Schema, Document, Types } from 'mongoose';

export type AnomalyType =
  | 'ctr_drop'
  | 'ctr_spike'
  | 'spend_anomaly'
  | 'impression_anomaly'
  | 'bot_traffic';
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';
export type AnomalyStatus = 'active' | 'resolved';

export interface IAnomaly extends Document {
  _id: Types.ObjectId;
  campaign_id: string;
  campaign_name: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  metric: string;
  current_value: number;
  threshold_value: number;
  description: string;
  status: AnomalyStatus;
  auto_paused: boolean;
  detected_at: Date;
  resolved_at?: Date;
  resolved_by?: string;
}

const AnomalySchema = new Schema<IAnomaly>({
  campaign_id: { type: String, required: true, index: true },
  campaign_name: { type: String, default: '' },
  type: {
    type: String,
    enum: ['ctr_drop', 'ctr_spike', 'spend_anomaly', 'impression_anomaly', 'bot_traffic'],
    required: true,
  },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
  metric: { type: String, default: '' },
  current_value: { type: Number, default: 0 },
  threshold_value: { type: Number, default: 0 },
  description: { type: String, default: '' },
  status: { type: String, enum: ['active', 'resolved'], default: 'active' },
  auto_paused: { type: Boolean, default: false },
  detected_at: { type: Date, default: Date.now },
  resolved_at: { type: Date },
  resolved_by: { type: Schema.Types.Mixed },
});

export const Anomaly = mongoose.model<IAnomaly>('Anomaly', AnomalySchema);
