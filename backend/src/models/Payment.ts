import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * A real-money payment (Phase 4), processed by a licensed PSP (Paystack).
 *
 * NON-CUSTODY: DAADD does not hold funds. This record tracks the INTENT and
 * STATUS of a charge; the money itself lives with the PSP. It exists only so we
 * know what was paid, by whom, for what.
 *
 * SEPARATE FROM TOKENS: `amount_minor` is real currency in the SMALLEST unit
 * (pesewas for GHS — integers, never floats), a different thing entirely from
 * the non-cashable token ledger (Reward, dollars). A Payment must NEVER be
 * written to the Reward ledger or run through TOKEN_VALUE math.
 */
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'abandoned';

export const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded', 'abandoned'];

/** What a successful payment unlocks — drives applyPaymentEffect(). */
export type PaymentPurpose = 'advertiser_billing';

export const PAYMENT_PURPOSES: PaymentPurpose[] = ['advertiser_billing'];

export interface IPayment extends Document {
  _id: Types.ObjectId;
  user_id: Types.ObjectId;
  provider: string;
  /** The PSP's transaction reference — our idempotency key across callback + webhook. */
  reference: string;
  amount_minor: number;
  currency: string;
  status: PaymentStatus;
  purpose: PaymentPurpose;
  authorization_url?: string;
  /** PSP gateway response string, for auditing/support. */
  gateway_response?: string;
  metadata: Record<string, unknown>;
  paid_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, required: true, default: 'paystack' },
    reference: { type: String, required: true, unique: true },
    // Real currency, integer minor units (pesewas). Never a float, never dollars.
    amount_minor: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'GHS' },
    status: { type: String, enum: PAYMENT_STATUSES, default: 'pending', index: true },
    purpose: { type: String, enum: PAYMENT_PURPOSES, required: true },
    authorization_url: { type: String },
    gateway_response: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
    paid_at: { type: Date },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
