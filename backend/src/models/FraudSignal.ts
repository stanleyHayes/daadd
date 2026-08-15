import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * A fraud/abuse signal raised from REAL events on the money path (completed
 * redemptions and the token-reward ledger), not synthetic data.
 *
 * A signal is a *review item*, never an automatic punishment. False positives on
 * a rewards platform hit real customers and merchants, so detection surfaces a
 * signal for a human (admin / compliance) to act on — typically by restricting
 * or suspending a merchant via the verification status machine, or by
 * investigating a customer. Nothing here debits a ledger or blocks a user by
 * itself.
 */
export type FraudSubjectType = 'user' | 'merchant' | 'pair';

export type FraudSignalType =
  | 'redemption_velocity' // one customer redeeming abnormally fast
  | 'merchant_surge' // one merchant confirming abnormally many/large redemptions
  | 'collusion' // the same customer+merchant pair redeeming repeatedly
  | 'reward_farming'; // one customer accruing tokens abnormally fast

export const FRAUD_SIGNAL_TYPES: FraudSignalType[] = [
  'redemption_velocity',
  'merchant_surge',
  'collusion',
  'reward_farming',
];

export type FraudSeverity = 'low' | 'medium' | 'high' | 'critical';

/** open → reviewing → (dismissed | actioned). Dedup targets `open`. */
export type FraudSignalStatus = 'open' | 'reviewing' | 'dismissed' | 'actioned';

export const FRAUD_SIGNAL_STATUSES: FraudSignalStatus[] = [
  'open',
  'reviewing',
  'dismissed',
  'actioned',
];

export interface IFraudSignal extends Document {
  _id: Types.ObjectId;
  subject_type: FraudSubjectType;
  /** For `pair`, the composite "<userId>:<merchantId>". */
  subject_id: string;
  /** Human-recognisable label (email / business name) for the review queue. */
  subject_label: string;
  type: FraudSignalType;
  severity: FraudSeverity;
  severity_rank: number;
  metric: string;
  /** The observed value that tripped the rule. */
  value: number;
  /** The threshold it exceeded. */
  threshold: number;
  window_hours: number;
  /** Supporting counts / ids so a reviewer can see why this fired. */
  evidence: Record<string, unknown>;
  description: string;
  status: FraudSignalStatus;
  review_notes: string;
  reviewed_by?: Types.ObjectId;
  detected_at: Date;
  resolved_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const FraudSignalSchema = new Schema<IFraudSignal>(
  {
    subject_type: { type: String, enum: ['user', 'merchant', 'pair'], required: true },
    subject_id: { type: String, required: true, index: true },
    subject_label: { type: String, default: '' },
    type: { type: String, enum: FRAUD_SIGNAL_TYPES, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    /** Numeric mirror of severity so the queue can sort critical-first. */
    severity_rank: { type: Number, default: 2 },
    metric: { type: String, default: '' },
    value: { type: Number, default: 0 },
    threshold: { type: Number, default: 0 },
    window_hours: { type: Number, default: 24 },
    evidence: { type: Schema.Types.Mixed, default: {} },
    description: { type: String, default: '' },
    status: { type: String, enum: FRAUD_SIGNAL_STATUSES, default: 'open', index: true },
    review_notes: { type: String, default: '' },
    reviewed_by: { type: Schema.Types.ObjectId, ref: 'User' },
    detected_at: { type: Date, default: Date.now },
    resolved_at: { type: Date },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// One OPEN signal per (subject, type). Once a reviewer moves it out of `open`,
// a fresh recurrence can raise a new one. Partial index so only open rows are
// constrained — matches the Anomaly dedup pattern.
FraudSignalSchema.index(
  { subject_type: 1, subject_id: 1, type: 1 },
  { unique: true, partialFilterExpression: { status: 'open' } }
);
FraudSignalSchema.index({ status: 1, detected_at: -1 });

export const FraudSignal = mongoose.model<IFraudSignal>('FraudSignal', FraudSignalSchema);
