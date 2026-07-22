import { Types } from 'mongoose';
import { DeviceEvent, AdView, Ad } from '../models';

/**
 * Real campaign delivery metrics, aggregated from recorded events.
 *
 * This replaces synthetic figures that were being served as fact:
 * `/analytics/timeseries` returned `Math.random()` (so an advertiser's chart
 * changed on every refresh), and the campaign overview derived impressions
 * from `budget_total * 2.5` with a hard-coded 6.8% CTR.
 *
 * Where there is genuinely no data we return zero. The dashboard already has
 * "No time series data" empty states for exactly that case, and an honest zero
 * is worth more to someone spending money than a plausible invention.
 *
 * `DeviceEvent` is the primary source — it carries campaign_id, event_type and
 * created_at. `AdView` is a secondary impression source from the mobile app,
 * which records views per ad rather than per campaign.
 */

export interface CampaignTotals {
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  /** False when nothing has been recorded yet, so the UI can say so plainly. */
  hasData: boolean;
}

export interface SeriesPoint {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
}

function ctrOf(impressions: number, clicks: number): number {
  return impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;
}

/** Ad ids belonging to a campaign, for the AdView fallback. */
async function adIdsFor(campaignId: string): Promise<string[]> {
  const ads = await Ad.find({ campaign_id: campaignId }).select('_id').lean();
  return ads.map((a) => String(a._id));
}

export async function campaignTotals(campaignId: string): Promise<CampaignTotals> {
  if (!Types.ObjectId.isValid(campaignId)) {
    return { impressions: 0, clicks: 0, conversions: 0, ctr: 0, hasData: false };
  }

  const [grouped, adIds] = await Promise.all([
    DeviceEvent.aggregate<{ _id: string; count: number }>([
      { $match: { campaign_id: new Types.ObjectId(campaignId) } },
      { $group: { _id: '$event_type', count: { $sum: 1 } } },
    ]),
    adIdsFor(campaignId),
  ]);

  const byType = new Map(grouped.map((g) => [g._id, g.count]));
  const deviceImpressions = byType.get('impression') ?? 0;
  const clicks = byType.get('click') ?? 0;
  const conversions = byType.get('conversion') ?? 0;

  // Mobile logs views against the ad rather than the campaign.
  const adViews = adIds.length ? await AdView.countDocuments({ ad_id: { $in: adIds } }) : 0;
  const impressions = deviceImpressions + adViews;

  return {
    impressions,
    clicks,
    conversions,
    ctr: ctrOf(impressions, clicks),
    hasData: impressions > 0 || clicks > 0 || conversions > 0,
  };
}

/**
 * Daily buckets for the last `days` days, including days with no activity so
 * the chart keeps an even x-axis rather than compressing gaps.
 */
export async function campaignTimeSeries(campaignId: string, days = 14): Promise<SeriesPoint[]> {
  const buckets: SeriesPoint[] = [];
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    buckets.push({
      date: date.toISOString().split('T')[0],
      impressions: 0,
      clicks: 0,
      conversions: 0,
    });
  }

  if (!Types.ObjectId.isValid(campaignId)) return buckets;

  const byDate = new Map(buckets.map((b) => [b.date, b]));

  const rows = await DeviceEvent.aggregate<{
    _id: { date: string; type: string };
    count: number;
  }>([
    { $match: { campaign_id: new Types.ObjectId(campaignId), created_at: { $gte: start } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          type: '$event_type',
        },
        count: { $sum: 1 },
      },
    },
  ]);

  for (const row of rows) {
    const bucket = byDate.get(row._id.date);
    if (!bucket) continue;
    if (row._id.type === 'impression') bucket.impressions += row.count;
    else if (row._id.type === 'click') bucket.clicks += row.count;
    else if (row._id.type === 'conversion') bucket.conversions += row.count;
  }

  // Fold in mobile ad views, which carry no campaign id of their own.
  const adIds = await adIdsFor(campaignId);
  if (adIds.length) {
    const views = await AdView.aggregate<{ _id: string; count: number }>([
      { $match: { ad_id: { $in: adIds }, viewed_at: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$viewed_at' } },
          count: { $sum: 1 },
        },
      },
    ]);
    for (const view of views) {
      const bucket = byDate.get(view._id);
      if (bucket) bucket.impressions += view.count;
    }
  }

  return buckets;
}

/**
 * Percentage change against the preceding window of the same length. Returns
 * null when there is no prior window to compare with, so the UI can omit the
 * indicator rather than print a confident "+4%" derived from nothing.
 */
export async function campaignTrend(
  campaignId: string,
  days = 14
): Promise<{ impressions: number | null; clicks: number | null; ctr: number | null }> {
  const empty = { impressions: null, clicks: null, ctr: null };
  if (!Types.ObjectId.isValid(campaignId)) return empty;

  const now = new Date();
  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - days);
  const previousStart = new Date(now);
  previousStart.setDate(previousStart.getDate() - days * 2);

  const [current, previous] = await Promise.all(
    [
      { $gte: currentStart },
      { $gte: previousStart, $lt: currentStart },
    ].map((range) =>
      DeviceEvent.aggregate<{ _id: string; count: number }>([
        { $match: { campaign_id: new Types.ObjectId(campaignId), created_at: range } },
        { $group: { _id: '$event_type', count: { $sum: 1 } } },
      ])
    )
  );

  const totals = (rows: { _id: string; count: number }[]) => {
    const map = new Map(rows.map((r) => [r._id, r.count]));
    const impressions = map.get('impression') ?? 0;
    const clicks = map.get('click') ?? 0;
    return { impressions, clicks, ctr: ctrOf(impressions, clicks) };
  };

  const a = totals(current);
  const b = totals(previous);
  const change = (nowValue: number, before: number) =>
    before === 0 ? null : Number((((nowValue - before) / before) * 100).toFixed(1));

  return {
    impressions: change(a.impressions, b.impressions),
    clicks: change(a.clicks, b.clicks),
    ctr: change(a.ctr, b.ctr),
  };
}
