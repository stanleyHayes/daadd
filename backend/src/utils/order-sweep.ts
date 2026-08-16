import { Order } from '../models';

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
