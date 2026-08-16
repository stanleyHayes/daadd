import mongoose, { Schema, Document, Types } from 'mongoose';
import { OrderStatus, ORDER_STATUSES } from '../utils/order-state';

/**
 * An order in the buyer-protection marketplace (Phase 5). All money fields are
 * integer minor units (pesewas) — real money, separate from the token ledger.
 * The lifecycle is the 12-state machine in utils/order-state.ts; every status
 * change is appended to `history` for an auditable trail.
 */
export interface IOrderItem {
  product_id: Types.ObjectId;
  name: string;
  unit_price_minor: number;
  quantity: number;
}

export interface IOrderHistory {
  status: OrderStatus;
  actor: string; // buyer | merchant | admin | system
  by?: Types.ObjectId;
  note?: string;
  at: Date;
}

export interface IDispute {
  reason: string;
  detail: string;
  evidence: string[]; // uploaded evidence URLs
  opened_at: Date;
  opened_by?: Types.ObjectId;
  resolution?: 'refunded' | 'released';
  resolution_note?: string;
  resolved_at?: Date;
  resolved_by?: Types.ObjectId;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  buyer_id: Types.ObjectId;
  merchant_id: Types.ObjectId;
  items: IOrderItem[];
  subtotal_minor: number;
  tax_minor: number;
  total_minor: number;
  currency: string;
  status: OrderStatus;
  payment_id?: Types.ObjectId;
  payment_reference?: string;
  refund_reference?: string;
  /** Escrow settlement state: pending → held (paid) → released (completed) / refunded. */
  settlement_status: 'pending' | 'held' | 'released' | 'refunded';
  settled_at?: Date;
  transfer_reference?: string;
  contact: { name: string; phone: string; address: string; city: string };
  history: IOrderHistory[];
  dispute?: IDispute;
  /** When a delivered order auto-completes if the buyer doesn't confirm. */
  auto_release_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    buyer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    merchant_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: {
      type: [
        {
          product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
          name: { type: String, required: true },
          unit_price_minor: { type: Number, required: true, min: 0 },
          quantity: { type: Number, required: true, min: 1 },
        },
      ],
      default: [],
    },
    subtotal_minor: { type: Number, required: true, min: 0 },
    tax_minor: { type: Number, default: 0, min: 0 },
    total_minor: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'GHS' },
    status: { type: String, enum: ORDER_STATUSES, default: 'created', index: true },
    payment_id: { type: Schema.Types.ObjectId, ref: 'Payment' },
    payment_reference: { type: String, index: true },
    refund_reference: { type: String },
    settlement_status: { type: String, enum: ['pending', 'held', 'released', 'refunded'], default: 'pending' },
    settled_at: { type: Date },
    transfer_reference: { type: String },
    contact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
      city: { type: String, default: '' },
    },
    history: {
      type: [
        {
          status: { type: String, enum: ORDER_STATUSES, required: true },
          actor: { type: String, required: true },
          by: { type: Schema.Types.ObjectId, ref: 'User' },
          note: { type: String, default: '' },
          at: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    dispute: {
      type: {
        reason: { type: String },
        detail: { type: String, default: '' },
        evidence: { type: [String], default: [] },
        opened_at: { type: Date },
        opened_by: { type: Schema.Types.ObjectId, ref: 'User' },
        resolution: { type: String, enum: ['refunded', 'released'] },
        resolution_note: { type: String },
        resolved_at: { type: Date },
        resolved_by: { type: Schema.Types.ObjectId, ref: 'User' },
      },
      default: undefined,
    },
    auto_release_at: { type: Date, index: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
