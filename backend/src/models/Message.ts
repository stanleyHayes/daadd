import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  _id: Types.ObjectId;
  conversation_id: Types.ObjectId;
  sender_id: Types.ObjectId;
  body: string;
  image_url?: string;
  /** When the recipient opened the thread past this message (read receipt). */
  read_at?: Date;
  created_at: Date;
}

const MessageSchema = new Schema<IMessage>({
  conversation_id: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  sender_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  // A message must carry text or an image (validated in the route).
  body: { type: String, default: '', trim: true },
  image_url: { type: String, default: '' },
  read_at: { type: Date },
  created_at: { type: Date, default: Date.now },
});

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
