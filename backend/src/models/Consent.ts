import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * A record of what a user has agreed DAADD may do with their data.
 *
 * Ghana's Data Protection Act (Act 843) requires a lawful basis for processing
 * personal data, and specifically requires *prior* consent for direct marketing
 * — which is DAADD's whole business. The regulatory advisory calls this
 * non-negotiable.
 *
 * Consent is append-only: granting and withdrawing both write a new row rather
 * than mutating the last one, so there is always an auditable history of what
 * the user agreed to and when. `currentConsent()` reads the latest row per
 * purpose. This matters if a regulator ever asks "on what basis were you
 * marketing to this person on this date".
 */

/** The distinct things we ask permission for. Each is consented separately. */
export const CONSENT_PURPOSES = [
  // Using personal data to send offers and promotional messages. The one the
  // DPC specifically requires prior consent for.
  'marketing',
  // Tailoring which ads and merchants a user sees from their behaviour.
  'personalisation',
  // Location data used to surface nearby merchants and deals.
  'location',
  // Aggregate analytics on engagement. Usually a legitimate-interest basis, but
  // recorded so a user can object.
  'analytics',
] as const;

export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];

export interface IConsent extends Document {
  _id: Types.ObjectId;
  user_id: Types.ObjectId;
  purpose: ConsentPurpose;
  granted: boolean;
  /** The wording the user actually agreed to, so a copy change is auditable. */
  policy_version: string;
  /** Captured for evidence of when and from where consent was given. */
  ip: string;
  user_agent: string;
  created_at: Date;
}

const ConsentSchema = new Schema<IConsent>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    purpose: { type: String, enum: CONSENT_PURPOSES, required: true },
    granted: { type: Boolean, required: true },
    policy_version: { type: String, default: 'v1' },
    ip: { type: String, default: '' },
    user_agent: { type: String, default: '' },
  },
  // Only createdAt: a consent row is a fact that happened, never edited.
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

// The "latest decision per purpose for this user" query.
ConsentSchema.index({ user_id: 1, purpose: 1, created_at: -1 });

export const Consent = mongoose.model<IConsent>('Consent', ConsentSchema);

/**
 * The user's current position on every purpose: the most recent row per
 * purpose, defaulting to `false` (no consent) for any purpose never decided.
 */
export async function currentConsent(
  userId: string | Types.ObjectId
): Promise<Record<ConsentPurpose, boolean>> {
  const rows = await Consent.aggregate<{ _id: ConsentPurpose; granted: boolean }>([
    { $match: { user_id: new Types.ObjectId(String(userId)) } },
    { $sort: { created_at: -1 } },
    { $group: { _id: '$purpose', granted: { $first: '$granted' } } },
  ]);

  const latest = new Map(rows.map((r) => [r._id, r.granted]));
  const out = {} as Record<ConsentPurpose, boolean>;
  for (const purpose of CONSENT_PURPOSES) out[purpose] = latest.get(purpose) ?? false;
  return out;
}
