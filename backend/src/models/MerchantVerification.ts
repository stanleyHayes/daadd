import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * A merchant's KYC submission and its verification status.
 *
 * The readiness analysis makes this a launch gate: before a merchant can receive
 * money or run major campaigns they need business registration, owner identity,
 * an address, a settlement account and a risk check — and an unverified merchant
 * must not reach every feature.
 *
 * One deliberate omission: DAADD does **not** store the full settlement account.
 * The regulatory architecture keeps DAADD out of money custody, so full bank /
 * mobile-money details belong to the licensed payment partner, not here. We keep
 * a masked reference (last few digits) purely so a human can recognise which
 * account a merchant nominated; the real thing lives with the PSP.
 */
export type VerificationStatus = 'pending' | 'verified' | 'restricted' | 'suspended';

export const VERIFICATION_STATUSES: VerificationStatus[] = [
  'pending',
  'verified',
  'restricted',
  'suspended',
];

export type IdType = 'ghana_card' | 'passport' | 'drivers_licence' | 'voter_id' | 'other';

export interface IMerchantVerification extends Document {
  _id: Types.ObjectId;
  merchant_id: Types.ObjectId;

  // Business
  business_name: string;
  business_registration_number: string;
  business_address: string;
  business_city: string;
  contact_phone: string;

  // Owner identity (KYC)
  owner_name: string;
  owner_id_type: IdType;
  /** Masked at write time — only the last few characters are retained. */
  owner_id_last4: string;

  // Settlement — a recognisable masked reference only; the PSP holds the rest.
  settlement_provider: string;
  settlement_account_last4: string;

  status: VerificationStatus;
  /** Admin note: risk flags, why restricted/suspended, what's outstanding. */
  review_notes: string;
  reviewed_by?: Types.ObjectId;
  submitted_at: Date;
  reviewed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const MerchantVerificationSchema = new Schema<IMerchantVerification>(
  {
    // One verification record per merchant.
    merchant_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

    business_name: { type: String, default: '', trim: true },
    business_registration_number: { type: String, default: '', trim: true },
    business_address: { type: String, default: '', trim: true },
    business_city: { type: String, default: '', trim: true },
    contact_phone: { type: String, default: '', trim: true },

    owner_name: { type: String, default: '', trim: true },
    owner_id_type: {
      type: String,
      enum: ['ghana_card', 'passport', 'drivers_licence', 'voter_id', 'other'],
      default: 'ghana_card',
    },
    owner_id_last4: { type: String, default: '' },

    settlement_provider: { type: String, default: '', trim: true },
    settlement_account_last4: { type: String, default: '' },

    status: { type: String, enum: VERIFICATION_STATUSES, default: 'pending', index: true },
    review_notes: { type: String, default: '' },
    reviewed_by: { type: Schema.Types.ObjectId, ref: 'User' },
    submitted_at: { type: Date, default: Date.now },
    reviewed_at: { type: Date },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const MerchantVerification = mongoose.model<IMerchantVerification>(
  'MerchantVerification',
  MerchantVerificationSchema
);

/** Keeps only the last `n` characters of a sensitive value; '' stays ''. */
export function maskLast(value: string | undefined, n = 4): string {
  const v = String(value ?? '').replace(/\s+/g, '');
  return v.length <= n ? v : v.slice(-n);
}
