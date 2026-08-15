import { Types } from 'mongoose';
import { Reward } from '../models';

/**
 * A user's spendable token balance in dollars: the sum of their approved/paid
 * ledger rows (credits positive, debits negative). Balance is always computed
 * from the append-only ledger, never stored.
 */
export async function spendableBalance(userId: string): Promise<number> {
  if (!Types.ObjectId.isValid(userId)) return 0;
  const result = await Reward.aggregate([
    { $match: { user_id: new Types.ObjectId(userId), status: { $in: ['approved', 'paid'] } } },
    { $group: { _id: '$user_id', balance: { $sum: '$amount' } } },
  ]);
  return result[0]?.balance || 0;
}
