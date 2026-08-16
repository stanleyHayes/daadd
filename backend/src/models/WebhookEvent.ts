import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * A record that a given PSP webhook event was received, so it is processed at
 * most once (Phase 4). Paystack retries deliveries and also sends a webhook
 * alongside the browser callback, so the same event can arrive several times.
 *
 * The unique index on (provider, event_id) is the exactly-once guard: an insert
 * that hits a duplicate key means "already handled" — the handler acks 200 and
 * does nothing more.
 */
export interface IWebhookEvent extends Document {
  _id: Types.ObjectId;
  provider: string;
  /** Provider-stable identity for this event (e.g. `charge.success:<txn id>`). */
  event_id: string;
  event_type: string;
  reference?: string;
  created_at: Date;
}

const WebhookEventSchema = new Schema<IWebhookEvent>({
  provider: { type: String, required: true },
  event_id: { type: String, required: true },
  event_type: { type: String, default: '' },
  reference: { type: String },
  created_at: { type: Date, default: Date.now },
});

WebhookEventSchema.index({ provider: 1, event_id: 1 }, { unique: true });

export const WebhookEvent = mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);
