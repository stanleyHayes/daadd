import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * A single ongoing enquiry thread between a customer and an advertiser
 * (company). There is at most ONE conversation per (customer, advertiser)
 * pair — enforced by the unique compound index below — tagged with the ad /
 * campaign the customer first enquired from for context.
 */
export interface IConversation extends Document {
  _id: Types.ObjectId;
  customer_id: Types.ObjectId;
  advertiser_id: Types.ObjectId;
  ad_id?: Types.ObjectId;
  campaign_id?: Types.ObjectId;
  last_message: string;
  last_message_at?: Date;
  // When each participant last opened the thread — drives unread counts.
  customer_last_read?: Date;
  advertiser_last_read?: Date;
  created_at: Date;
  updated_at: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    customer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    advertiser_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ad_id: { type: Schema.Types.ObjectId, ref: 'Ad' },
    campaign_id: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    last_message: { type: String, default: '' },
    last_message_at: { type: Date },
    customer_last_read: { type: Date },
    advertiser_last_read: { type: Date },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// One thread per customer↔advertiser pair.
ConversationSchema.index({ customer_id: 1, advertiser_id: 1 }, { unique: true });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
