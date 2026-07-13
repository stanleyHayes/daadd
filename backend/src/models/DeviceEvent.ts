import mongoose, { Schema, Document, Types } from 'mongoose';

export type DeviceType = 'phone' | 'tablet' | 'tv' | 'desktop' | 'other';
export type DeviceEventType = 'impression' | 'click' | 'conversion';

export interface IDeviceEvent extends Document {
  _id: Types.ObjectId;
  user_id: string | Types.ObjectId;
  device_id: string;
  device_type: DeviceType;
  ad_id: string | Types.ObjectId;
  campaign_id: string | Types.ObjectId;
  event_type: DeviceEventType;
  created_at: Date;
}

const DeviceEventSchema = new Schema<IDeviceEvent>({
  user_id: { type: Schema.Types.Mixed, ref: 'User', required: true, index: true },
  device_id: { type: String, required: true, index: true },
  device_type: {
    type: String,
    enum: ['phone', 'tablet', 'tv', 'desktop', 'other'],
    default: 'other',
  },
  ad_id: { type: Schema.Types.Mixed, ref: 'Ad' },
  campaign_id: { type: Schema.Types.Mixed, ref: 'Campaign', index: true },
  event_type: {
    type: String,
    enum: ['impression', 'click', 'conversion'],
    required: true,
  },
  created_at: { type: Date, default: Date.now, index: true },
});

DeviceEventSchema.index({ user_id: 1, created_at: -1 });
DeviceEventSchema.index({ campaign_id: 1, device_type: 1 });

export const DeviceEvent = mongoose.model<IDeviceEvent>('DeviceEvent', DeviceEventSchema);
