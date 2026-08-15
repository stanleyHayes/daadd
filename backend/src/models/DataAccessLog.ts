import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * A record of a staff member reading another person's sensitive data.
 *
 * The Data Protection Act's accountability principle, and the regulatory
 * advisory, both call for recording *who accessed sensitive information*.
 * `TeamAuditLog` already records writes (role changes, campaign edits); this
 * covers the read side — a support agent opening a customer's profile, an admin
 * exporting someone's data.
 *
 * Deliberately narrow: only staff-initiated access to *another* user's data is
 * logged. A user reading their own data, or ordinary aggregate queries, are not
 * — logging everything would bury the entries that matter and become its own
 * privacy problem.
 */
export interface IDataAccessLog extends Document {
  _id: Types.ObjectId;
  /** The staff member who accessed the data. */
  actor_id: Types.ObjectId;
  /** The person whose data was accessed. */
  subject_id: Types.ObjectId;
  /** What was accessed, e.g. "profile", "purchase_history", "data_export". */
  resource: string;
  action: 'read' | 'export' | 'delete';
  /** Optional free-text reason or context. */
  context: string;
  created_at: Date;
}

const DataAccessLogSchema = new Schema<IDataAccessLog>(
  {
    actor_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resource: { type: String, required: true },
    action: { type: String, enum: ['read', 'export', 'delete'], default: 'read' },
    context: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

// "everything ever done to this subject", newest first — the DSAR query.
DataAccessLogSchema.index({ subject_id: 1, created_at: -1 });

export const DataAccessLog = mongoose.model<IDataAccessLog>('DataAccessLog', DataAccessLogSchema);

/**
 * Records a sensitive access. Never throws — an audit-log failure must not break
 * the request it is auditing, but it is logged so the gap is visible.
 */
export async function recordDataAccess(entry: {
  actorId: string | Types.ObjectId;
  subjectId: string | Types.ObjectId;
  resource: string;
  action?: IDataAccessLog['action'];
  context?: string;
}): Promise<void> {
  try {
    // A staff member reading their own data is not a privacy event.
    if (String(entry.actorId) === String(entry.subjectId)) return;
    await DataAccessLog.create({
      actor_id: entry.actorId,
      subject_id: entry.subjectId,
      resource: entry.resource,
      action: entry.action ?? 'read',
      context: entry.context ?? '',
    });
  } catch (error) {
    console.error('[data-access-log] failed to record:', (error as Error).message);
  }
}
