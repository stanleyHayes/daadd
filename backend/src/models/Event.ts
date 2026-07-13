import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEvent extends Document {
  _id: Types.ObjectId;
  event_type: string;
  user_id: string | Types.ObjectId;
  payload: any;
  ip: string;
  created_at: Date;
}

const EventSchema = new Schema<IEvent>({
  event_type: { type: String, required: true, index: true },
  user_id: { type: Schema.Types.Mixed, ref: 'User' },
  payload: { type: Schema.Types.Mixed, default: null },
  ip: { type: String, default: '' },
  created_at: { type: Date, default: Date.now, index: true },
});

export const Event = mongoose.model<IEvent>('Event', EventSchema);
