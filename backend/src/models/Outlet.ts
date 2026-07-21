import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * A physical branch/outlet belonging to an advertiser (merchant). Outlets are
 * owned by the ADVERTISER rather than a campaign so branches are reusable
 * across campaigns, and so customers can pick which branch they are visiting
 * at redemption time (see routes/redemption.ts).
 */
export interface IOutlet extends Document {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  name: string;
  address: string;
  city: string;
  phone: string;
  /** Free-text, e.g. "Mon–Sat 9am–7pm, Sun closed". */
  opening_hours: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const OutletSchema = new Schema<IOutlet>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    opening_hours: { type: String, default: '', trim: true },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const Outlet = mongoose.model<IOutlet>('Outlet', OutletSchema);
