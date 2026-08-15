import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Consent, currentConsent, CONSENT_PURPOSES } from '../models/Consent';
import { recordDataAccess, DataAccessLog } from '../models/DataAccessLog';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  await Consent.deleteMany({});
  await DataAccessLog.deleteMany({});
});

describe('consent', () => {
  const userId = new mongoose.Types.ObjectId();

  it('defaults every purpose to not-consented for a user who never decided', async () => {
    const consents = await currentConsent(userId);
    for (const purpose of CONSENT_PURPOSES) {
      expect(consents[purpose]).toBe(false);
    }
  });

  it('reflects the most recent decision per purpose', async () => {
    await Consent.create({ user_id: userId, purpose: 'marketing', granted: true });
    await Consent.create({ user_id: userId, purpose: 'marketing', granted: false });
    await Consent.create({ user_id: userId, purpose: 'analytics', granted: true });

    const consents = await currentConsent(userId);
    // withdrawn wins because it is later
    expect(consents.marketing).toBe(false);
    expect(consents.analytics).toBe(true);
    expect(consents.location).toBe(false);
  });

  it('keeps the full history rather than overwriting', async () => {
    // Evidence of what was agreed and when is the point — a regulator can ask.
    await Consent.create({ user_id: userId, purpose: 'marketing', granted: true });
    await Consent.create({ user_id: userId, purpose: 'marketing', granted: false });
    await Consent.create({ user_id: userId, purpose: 'marketing', granted: true });

    const rows = await Consent.find({ user_id: userId, purpose: 'marketing' });
    expect(rows).toHaveLength(3);
  });

  it('keeps each user separate', async () => {
    const other = new mongoose.Types.ObjectId();
    await Consent.create({ user_id: userId, purpose: 'marketing', granted: true });

    expect((await currentConsent(userId)).marketing).toBe(true);
    expect((await currentConsent(other)).marketing).toBe(false);
  });
});

describe('data access log', () => {
  it('records a staff member reading another user', async () => {
    const actor = new mongoose.Types.ObjectId();
    const subject = new mongoose.Types.ObjectId();

    await recordDataAccess({ actorId: actor, subjectId: subject, resource: 'profile' });

    const rows = await DataAccessLog.find({ subject_id: subject });
    expect(rows).toHaveLength(1);
    expect(rows[0].resource).toBe('profile');
    expect(rows[0].action).toBe('read');
  });

  it('does not log a user reading their own data', async () => {
    const self = new mongoose.Types.ObjectId();
    await recordDataAccess({ actorId: self, subjectId: self, resource: 'profile' });
    expect(await DataAccessLog.countDocuments()).toBe(0);
  });

  it('never throws, so an audit failure cannot break the audited request', async () => {
    // A malformed id would reject inside create(); recordDataAccess swallows it.
    await expect(
      recordDataAccess({ actorId: 'not-an-id', subjectId: 'also-bad', resource: 'x' })
    ).resolves.toBeUndefined();
  });
});
