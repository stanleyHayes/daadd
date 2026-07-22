import { PricingModel } from '../models/AdChannel';

/**
 * What a campaign spends on a channel.
 *
 * Every roadmap channel bills differently — CTV sells completed views, retail
 * media sells clicks or a share of sales, display sells thousands of
 * impressions. Keeping the arithmetic in one place means the four channels
 * report into the same spend figure instead of each rolling its own.
 */

export interface DeliveryUnits {
  impressions?: number;
  clicks?: number;
  /** CTV / audio: plays that ran to the end. */
  completedViews?: number;
  conversions?: number;
}

/** The unit a channel actually charges for, used for labelling in the UI. */
export const BILLABLE_UNIT: Record<PricingModel, string> = {
  cpm: 'impressions',
  cpc: 'clicks',
  cpcv: 'completed views',
  cpa: 'conversions',
  flat: 'placement',
};

export function calculateSpend(
  pricingModel: PricingModel,
  baseRate: number,
  units: DeliveryUnits
): number {
  const rate = Math.max(0, baseRate);

  switch (pricingModel) {
    // CPM is priced per thousand, which is the one that gets mis-implemented.
    case 'cpm':
      return round2(((units.impressions ?? 0) / 1000) * rate);
    case 'cpc':
      return round2((units.clicks ?? 0) * rate);
    case 'cpcv':
      return round2((units.completedViews ?? 0) * rate);
    case 'cpa':
      return round2((units.conversions ?? 0) * rate);
    // Flat placements bill once, whatever they deliver.
    case 'flat':
      return round2(rate);
    default:
      return 0;
  }
}

/**
 * Effective CPM, so channels billed on different units can still be compared
 * against each other. Zero impressions means eCPM is undefined, not zero.
 */
export function effectiveCpm(spend: number, impressions: number): number | null {
  if (impressions <= 0) return null;
  return round2((spend / impressions) * 1000);
}

/** How much of the budget a channel has left. Never negative. */
export function remainingBudget(budgetTotal: number, spent: number): number {
  return round2(Math.max(0, budgetTotal - spent));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
