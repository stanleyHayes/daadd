/**
 * The order lifecycle (Phase 5) — a 12-state machine with buyer protection.
 *
 * Escrow model: a `paid` order's funds are held (with the PSP) until the buyer
 * confirms receipt or an auto-release timer elapses (`delivered → completed`),
 * or a dispute is resolved. Money only ever moves on an explicit, validated
 * transition, and every transition names who is allowed to make it.
 */
export type OrderStatus =
  | 'created' // placed, not yet paid
  | 'payment_pending' // PSP checkout started
  | 'paid' // funds held (escrow)
  | 'accepted' // merchant accepted the order
  | 'preparing' // merchant is fulfilling
  | 'shipped' // dispatched / ready for pickup
  | 'delivered' // handed to the buyer; auto-release timer runs
  | 'completed' // buyer confirmed or auto-released; settlement due to merchant
  | 'disputed' // buyer raised a dispute
  | 'refunded' // refunded to the buyer
  | 'cancelled' // cancelled before fulfilment (refund if it was paid)
  | 'expired'; // payment never completed

export const ORDER_STATUSES: OrderStatus[] = [
  'created',
  'payment_pending',
  'paid',
  'accepted',
  'preparing',
  'shipped',
  'delivered',
  'completed',
  'disputed',
  'refunded',
  'cancelled',
  'expired',
];

export type OrderActor = 'buyer' | 'merchant' | 'admin' | 'system';

export const TERMINAL_STATUSES: OrderStatus[] = ['completed', 'refunded', 'cancelled', 'expired'];

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

interface Transition {
  to: OrderStatus;
  actors: OrderActor[];
}

// Who may move an order from each state, and to where. Admin can do anything a
// merchant can plus the dispute resolutions; `system` covers timers/webhooks.
const TRANSITIONS: Record<OrderStatus, Transition[]> = {
  created: [
    { to: 'payment_pending', actors: ['buyer'] },
    { to: 'cancelled', actors: ['buyer', 'admin'] },
  ],
  payment_pending: [
    { to: 'paid', actors: ['system'] },
    { to: 'expired', actors: ['system'] },
    { to: 'cancelled', actors: ['buyer', 'admin'] },
  ],
  paid: [
    { to: 'accepted', actors: ['merchant', 'admin'] },
    { to: 'cancelled', actors: ['merchant', 'admin'] }, // reject → refund
    { to: 'disputed', actors: ['buyer'] },
  ],
  accepted: [
    { to: 'preparing', actors: ['merchant', 'admin'] },
    { to: 'cancelled', actors: ['merchant', 'admin'] }, // → refund
    { to: 'disputed', actors: ['buyer'] },
  ],
  preparing: [
    { to: 'shipped', actors: ['merchant', 'admin'] },
    { to: 'disputed', actors: ['buyer'] },
  ],
  shipped: [
    { to: 'delivered', actors: ['merchant', 'admin', 'buyer'] },
    { to: 'disputed', actors: ['buyer'] },
  ],
  delivered: [
    { to: 'completed', actors: ['buyer', 'admin', 'system'] }, // confirm / auto-release
    { to: 'disputed', actors: ['buyer'] },
  ],
  disputed: [
    { to: 'refunded', actors: ['admin'] }, // resolve for buyer → refund
    { to: 'completed', actors: ['admin'] }, // resolve for merchant → release
  ],
  completed: [],
  refunded: [],
  cancelled: [],
  expired: [],
};

/** The states `actor` may move an order to from `from`. */
export function allowedTransitions(from: OrderStatus, actor: OrderActor): OrderStatus[] {
  return (TRANSITIONS[from] || []).filter((t) => t.actors.includes(actor)).map((t) => t.to);
}

export function canTransition(from: OrderStatus, to: OrderStatus, actor: OrderActor): boolean {
  return allowedTransitions(from, actor).includes(to);
}

/** Statuses from which a paid order still holds refundable funds. */
export const REFUNDABLE_FROM: OrderStatus[] = ['paid', 'accepted', 'preparing', 'shipped', 'delivered', 'disputed'];

/** Whether moving to `to` should trigger a refund of the held funds. */
export function shouldRefund(from: OrderStatus, to: OrderStatus): boolean {
  if (!REFUNDABLE_FROM.includes(from)) return false;
  return to === 'refunded' || to === 'cancelled';
}
