import { fatigueService, FATIGUE_VIEW_THRESHOLD } from '../services/fatigue.service';
import { connectTestDb, resetTestDb, closeTestDb } from '../test-helpers';

describe('fatigueService (spec §4.10)', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterEach(async () => {
    await resetTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it(`reports fatigued after ${FATIGUE_VIEW_THRESHOLD} views within 24h`, async () => {
    for (let i = 0; i < FATIGUE_VIEW_THRESHOLD; i++) {
      await fatigueService.recordView('user-fatigued', 'ad-1');
    }

    const check = await fatigueService.checkFatigue('user-fatigued', 'ad-1');

    expect(check.isFatigued).toBe(true);
    expect(check.viewCount).toBe(FATIGUE_VIEW_THRESHOLD);
    expect(check.threshold).toBe(FATIGUE_VIEW_THRESHOLD);
    expect(await fatigueService.isFatigued('user-fatigued', 'ad-1')).toBe(true);
  });

  it(`does not report fatigue at ${FATIGUE_VIEW_THRESHOLD - 1} views`, async () => {
    for (let i = 0; i < FATIGUE_VIEW_THRESHOLD - 1; i++) {
      await fatigueService.recordView('user-almost', 'ad-2');
    }

    const check = await fatigueService.checkFatigue('user-almost', 'ad-2');

    expect(check.isFatigued).toBe(false);
    expect(check.viewCount).toBe(FATIGUE_VIEW_THRESHOLD - 1);
  });

  it('tracks fatigue per user: a different user is unaffected', async () => {
    for (let i = 0; i < FATIGUE_VIEW_THRESHOLD; i++) {
      await fatigueService.recordView('user-heavy', 'ad-3');
    }

    expect(await fatigueService.isFatigued('user-heavy', 'ad-3')).toBe(true);
    expect(await fatigueService.isFatigued('user-fresh', 'ad-3')).toBe(false);

    const fresh = await fatigueService.checkFatigue('user-fresh', 'ad-3');
    expect(fresh.viewCount).toBe(0);
  });

  it('tracks fatigue per ad: views of another ad do not count', async () => {
    for (let i = 0; i < FATIGUE_VIEW_THRESHOLD; i++) {
      await fatigueService.recordView('user-multi', 'ad-4');
    }

    expect(await fatigueService.isFatigued('user-multi', 'ad-5')).toBe(false);
  });

  it('getFatiguedAdIds returns only the ads over the threshold', async () => {
    for (let i = 0; i < FATIGUE_VIEW_THRESHOLD; i++) {
      await fatigueService.recordView('user-set', 'ad-tired');
    }
    await fatigueService.recordView('user-set', 'ad-ok');

    const fatigued = await fatigueService.getFatiguedAdIds('user-set', [
      'ad-tired',
      'ad-ok',
      'ad-never-seen',
    ]);

    expect(fatigued.has('ad-tired')).toBe(true);
    expect(fatigued.has('ad-ok')).toBe(false);
    expect(fatigued.has('ad-never-seen')).toBe(false);
    expect(await fatigueService.getFatiguedAdIds('user-set', [])).toEqual(new Set());
  });
});
