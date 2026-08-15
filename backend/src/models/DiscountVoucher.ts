import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * A transferable DISCOUNT voucher (Phase 3.1) — the compliant way to let one
 * user give value to another without transferring tokens.
 *
 * The regulatory line (Ghana e-money): tokens are non-transferable. So a voucher
 * is NOT a token transfer. Issuing one DEBITS the issuer's own token ledger and
 * mints a *separate* instrument: a fixed, single-use discount, spendable only as
 * a merchant discount, non-cashable, and expiring. The recipient never receives
 * tokens — they receive a discount entitlement. See routes/vouchers.ts.
 *
 * Lifecycle: issued → claimed → redeemed. An unclaimed/unredeemed voucher lapses
 * to `expired` and its value is refunded to the issuer (value conservation).
 * `revoked` is reserved for admin/abuse handling.
 */
export type VoucherStatus = 'issued' | 'claimed' | 'redeemed' | 'expired' | 'revoked';

export const VOUCHER_STATUSES: VoucherStatus[] = [
  'issued',
  'claimed',
  'redeemed',
  'expired',
  'revoked',
];

export interface IDiscountVoucher extends Document {
  _id: Types.ObjectId;
  issuer_id: Types.ObjectId;
  recipient_id?: Types.ObjectId;
  merchant_id?: Types.ObjectId;
  /** Discount size, in tokens (display) and its currency value (applied). */
  amount_tokens: number;
  amount: number;
  /** The bearer code the recipient claims / presents at a merchant. */
  code: string;
  /** The ledger debit that funded this voucher, for auditing + refund. */
  funding_reward_id?: Types.ObjectId;
  status: VoucherStatus;
  message: string;
  expires_at: Date;
  claimed_at?: Date;
  redeemed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const DiscountVoucherSchema = new Schema<IDiscountVoucher>(
  {
    issuer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipient_id: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    merchant_id: { type: Schema.Types.ObjectId, ref: 'User' },
    amount_tokens: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    funding_reward_id: { type: Schema.Types.ObjectId, ref: 'Reward' },
    status: { type: String, enum: VOUCHER_STATUSES, default: 'issued', index: true },
    message: { type: String, default: '', trim: true, maxlength: 200 },
    expires_at: { type: Date, required: true, index: true },
    claimed_at: { type: Date },
    redeemed_at: { type: Date },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const DiscountVoucher = mongoose.model<IDiscountVoucher>(
  'DiscountVoucher',
  DiscountVoucherSchema
);
