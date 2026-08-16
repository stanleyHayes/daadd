import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * A product a verified merchant sells (Phase 5). Price is real money in integer
 * minor units (pesewas) — the same unit as Payment, never the token ledger.
 */
export interface IProduct extends Document {
  _id: Types.ObjectId;
  merchant_id: Types.ObjectId;
  name: string;
  description: string;
  category: string;
  price_minor: number;
  currency: string;
  images: string[];
  /** null/undefined = untracked stock; a number caps how many can be ordered. */
  stock?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    merchant_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    category: { type: String, default: '', trim: true, index: true },
    price_minor: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'GHS' },
    images: { type: [String], default: [] },
    stock: { type: Number, min: 0 },
    is_active: { type: Boolean, default: true, index: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
