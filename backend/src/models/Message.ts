import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  _id: Types.ObjectId;
  conversation_id: Types.ObjectId;
  sender_id: Types.ObjectId;
  body: string;
  created_at: Date;
}

const MessageSchema = new Schema<IMessage>({
  conversation_id: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  sender_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, trim: true },
  created_at: { type: Date, default: Date.now },
});

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
