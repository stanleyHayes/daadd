import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * A programmatic auction this platform took part in (roadmap Phase 3).
 *
 * Deliberately an audit log rather than a live bidder. Real RTB means answering
 * an OpenRTB bid request inside roughly 100ms, which needs an always-warm
 * process, exchange integration and a signed supply agreement — none of which
 * exist here yet. What this does give you is the record: every request seen,
 * what was bid, whether it won and what it cleared at.
 *
 * That ordering is on purpose. Without the log you cannot tell whether a bidder
 * is any good, so the log is the part worth having first.
 */
export interface IBidRequest extends Document {
  _id: Types.ObjectId;
  campaign_id: Types.ObjectId;
  channel_id: Types.ObjectId;
  /** The exchange's own id, for reconciling against their reporting. */
  exchange_request_id: string;
  exchange: string;
  /** What we offered, in CPM. */
  bid_cpm: number;
  /** The exchange's floor, when it tells us. */
  floor_cpm: number;
  status: 'submitted' | 'won' | 'lost' | 'timeout' | 'error';
  /** What the impression actually cost. Second-price, so below bid_cpm. */
  clearing_cpm: number;
  /** Our own decision time. Useful for spotting when we start timing out. */
  response_ms: number;
  /** Device, geo, placement — whatever the exchange sent. */
  context: Record<string, unknown>;
  created_at: Date;
}

const BidRequestSchema = new Schema<IBidRequest>({
  campaign_id: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  channel_id: { type: Schema.Types.ObjectId, ref: 'AdChannel', index: true },
  exchange_request_id: { type: String, default: '', index: true },
  exchange: { type: String, default: '', trim: true },
  bid_cpm: { type: Number, default: 0, min: 0 },
  floor_cpm: { type: Number, default: 0, min: 0 },
  status: {
    type: String,
    enum: ['submitted', 'won', 'lost', 'timeout', 'error'],
    default: 'submitted',
    index: true,
  },
  clearing_cpm: { type: Number, default: 0, min: 0 },
  response_ms: { type: Number, default: 0, min: 0 },
  context: { type: Schema.Types.Mixed, default: {} },
  created_at: { type: Date, default: Date.now, index: true },
});

// The win-rate query: one campaign, one status, over a window.
BidRequestSchema.index({ campaign_id: 1, status: 1, created_at: -1 });

export const BidRequest = mongoose.model<IBidRequest>('BidRequest', BidRequestSchema);
