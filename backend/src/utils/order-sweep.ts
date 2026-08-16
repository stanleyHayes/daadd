import { Order } from '../models';

/** How long an unpaid order may sit before it lapses. */
const ORDER_PAYMENT_TTL_MS = parseInt(process.env.ORDER_PAYMENT_TTL_MINUTES || '60', 10) * 60000;

/**
 * Expire orders that were never paid (still `created`/`payment_pending` past the
 * TTL). Idempotent; driven by the scheduled job. A payment that lands after this
 * is refunded — see applyPaymentEffect in utils/payment-flow.ts. Returns how many
 * were expired.
 */
export async function expireStaleOrders(): Promise<number> {
  const cutoff = new Date(Date.now() - ORDER_PAYMENT_TTL_MS);
  const due = await Order.find({ status: { $in: ['created', 'payment_pending'] }, created_at: { $lte: cutoff } })
    .select('_id')
    .limit(500)
    .lean();

  let expired = 0;
  for (const row of due) {
    const won = await Order.findOneAndUpdate(
      { _id: row._id, status: { $in: ['created', 'payment_pending'] } },
      { $set: { status: 'expired' }, $push: { history: { status: 'expired', actor: 'system', note: 'Unpaid', at: new Date() } } }
    );
    if (won) expired += 1;
  }
  return expired;
}

/**
 * Auto-release delivered orders whose confirmation window has elapsed (Phase 5
 * buyer protection): if the buyer doesn't confirm or dispute within the window,
 * the order completes and settlement is due to the merchant. Idempotent and
 * best-effort; driven by the scheduled job.
 */
export async function autoReleaseOrders(): Promise<number> {
  const due = await Order.find({ status: 'delivered', auto_release_at: { $lte: new Date() } })
    .select('_id')
    .limit(500)
    .lean();

  let released = 0;
  for (const row of due) {
    // Atomic guard so a buyer confirming/disputing at the same moment wins.
    const won = await Order.findOneAndUpdate(
      { _id: row._id, status: 'delivered' },
      {
        $set: { status: 'completed' },
        $push: { history: { status: 'completed', actor: 'system', note: 'Auto-released', at: new Date() } },
      }
    );
    if (won) released += 1;
  }
  return released;
}
