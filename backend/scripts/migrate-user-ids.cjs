/**
 * One-off migration: legacy user docs carry string-UUID `_id`s (from an
 * early schema that declared `_id: Mixed`). Now that User uses normal
 * ObjectIds, those docs fail ObjectId casting (login 500s). This script:
 *   1. gives every non-ObjectId user a new ObjectId `_id`
 *   2. rewrites all Mixed user references to the new id's hex string
 *      (the app's convention for Mixed refs, e.g. `req.user.userId`)
 *
 * Run: node scripts/migrate-user-ids.cjs
 */
require('dotenv/config');
const mongoose = require('mongoose');

// collection -> fields holding a user reference (Mixed, stored as string)
const REFS = {
  adviews: ['user_id'],
  campaigns: ['owner'],
  deviceevents: ['user_id'],
  events: ['user_id'],
  notifications: ['user_id'],
  platformaccounts: ['user_id'],
  redemptions: ['user_id', 'merchant_id'],
  reviews: ['user'],
  rewards: ['user_id'],
  teammembers: ['user_id', 'invited_by'],
};

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const users = db.collection('users');

  const legacy = await users.find({ _id: { $type: 'string' } }).toArray();
  console.log(`Found ${legacy.length} legacy (string-_id) users`);

  for (const doc of legacy) {
    const oldId = doc._id;
    const newId = new mongoose.Types.ObjectId();
    const newIdHex = newId.toHexString();

    const { _id, ...rest } = doc;
    // Delete before insert: the unique email index would reject the copy
    // while the original still exists. Restore the old doc if insert fails.
    await users.deleteOne({ _id: oldId });
    try {
      await users.insertOne({ _id: newId, ...rest });
    } catch (err) {
      await users.insertOne({ _id: oldId, ...rest });
      throw err;
    }

    let refs = 0;
    for (const [collection, fields] of Object.entries(REFS)) {
      for (const field of fields) {
        const r = await db
          .collection(collection)
          .updateMany({ [field]: oldId }, { $set: { [field]: newIdHex } });
        refs += r.modifiedCount;
      }
    }
    console.log(`  ${doc.email}: ${oldId} -> ${newIdHex} (${refs} refs updated)`);
  }

  await mongoose.disconnect();
  console.log('Done. Existing sessions must re-login (old JWTs carry stale ids).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
