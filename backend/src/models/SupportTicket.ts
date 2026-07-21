import mongoose, { Schema, Document, Types } from 'mongoose';

/** The support desks a ticket can be routed to (V2 Area 4). */
export type SupportCategory =
  | 'general'
  | 'problem'
  | 'fraud'
  | 'campaign'
  | 'merchant'
  | 'billing';

export type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface ISupportTicket extends Document {
  _id: Types.ObjectId;
  /** Null for tickets raised by signed-out visitors via the contact form. */
  user_id?: Types.ObjectId;
  name: string;
  email: string;
  category: SupportCategory;
  subject: string;
  message: string;
  status: SupportStatus;
  /** Free-text reply from the support team. */
  response: string;
  created_at: Date;
  updated_at: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, default: '', trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    category: {
      type: String,
      enum: ['general', 'problem', 'fraud', 'campaign', 'merchant', 'billing'],
      default: 'general',
    },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    response: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
