import { calculateSpend, effectiveCpm, remainingBudget, BILLABLE_UNIT } from '../services/channel-pricing.service';

/**
 * Each roadmap channel bills on a different unit, so the arithmetic lives in
 * one place. CPM being per-thousand is the part that gets implemented wrong.
 */
describe('channel spend', () => {
  it('prices CPM per thousand impressions, not per impression', () => {
    expect(calculateSpend('cpm', 12, { impressions: 10_000 })).toBe(120);
    expect(calculateSpend('cpm', 12, { impressions: 500 })).toBe(6);
  });

  it('prices CPC per click', () => {
    expect(calculateSpend('cpc', 0.45, { clicks: 200 })).toBe(90);
  });

  it('prices CTV and audio on completed views', () => {
    expect(calculateSpend('cpcv', 0.03, { completedViews: 5_000 })).toBe(150);
  });

  it('prices CPA per conversion', () => {
    expect(calculateSpend('cpa', 8, { conversions: 12 })).toBe(96);
  });

  it('bills a flat placement once, whatever it delivers', () => {
    expect(calculateSpend('flat', 500, { impressions: 1_000_000 })).toBe(500);
    expect(calculateSpend('flat', 500, {})).toBe(500);
  });

  it('ignores units the model does not bill for', () => {
    expect(calculateSpend('cpc', 1, { impressions: 999_999 })).toBe(0);
  });

  it('treats a negative rate as zero rather than crediting the advertiser', () => {
    expect(calculateSpend('cpm', -5, { impressions: 10_000 })).toBe(0);
  });
});

describe('effective CPM', () => {
  it('normalises spend so channels on different units can be compared', () => {
    expect(effectiveCpm(90, 300_000)).toBe(0.3);
  });

  it('is undefined rather than zero with no impressions', () => {
    expect(effectiveCpm(50, 0)).toBeNull();
  });
});

describe('remaining budget', () => {
  it('never goes negative', () => {
    expect(remainingBudget(100, 250)).toBe(0);
    expect(remainingBudget(100, 40)).toBe(60);
  });
});

describe('billable units', () => {
  it('labels every pricing model', () => {
    expect(Object.keys(BILLABLE_UNIT).sort()).toEqual(['cpa', 'cpc', 'cpcv', 'cpm', 'flat']);
  });
});
