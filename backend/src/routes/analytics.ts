import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import PDFDocument from 'pdfkit';
import { Campaign, Redemption, Review } from '../models';
import { authMiddleware } from '../middleware/auth';
import { success } from '../utils/response';
import { seededRandom } from '../utils/seeded';

const router = Router();

const round2 = (n: number) => Math.round(n * 100) / 100;
const TOKEN_VALUE = parseFloat(process.env.TOKEN_VALUE || '0.05');

/**
 * Real money metrics for a campaign, aggregated from its attributed
 * redemptions (recommendations #1 & #2): revenue (customer spend), how many
 * purchases, discount given vs used, ad spend, and profit.
 */
async function campaignMoneyMetrics(campaignId: string, budgetSpent: number) {
  const agg = await Redemption.aggregate([
    {
      // Only settled (completed) redemptions count as realized revenue — a
      // validated-but-unconfirmed or rolled-back redemption is not a sale.
      $match: {
        campaign_id: new Types.ObjectId(campaignId),
        status: 'completed',
      },
    },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$purchase_amount' },
        discountUsed: { $sum: '$discount_amount' },
        // Face value the customer PRESENTED at the counter (tokens they chose
        // to spend). The applied discount can be lower when the percentage cap
        // binds — hence "issued" vs "redeemed" are two distinct figures.
        discountsIssued: { $sum: { $multiply: ['$tokens', TOKEN_VALUE] } },
        customers: { $addToSet: '$user_id' },
        purchases: { $sum: 1 },
      },
    },
  ]);
  const row = agg[0] || {};
  const revenue = round2(row.revenue || 0);
  const discountUsed = round2(row.discountUsed || 0);
  const discountsIssued = round2(row.discountsIssued || 0);
  const spend = round2(budgetSpent || 0);
  // Advertiser's net: sales revenue minus ad spend minus discounts funded.
  const profit = round2(revenue - spend - discountUsed);
  const totalCost = spend + discountUsed;
  return {
    revenue,
    purchases: row.purchases || 0,
    // Distinct people who actually transacted — not the redemption count.
    customersAcquired: Array.isArray(row.customers) ? row.customers.length : 0,
    discountUsed,
    discountsIssued,
    spend,
    profit,
    // Revenue per advertising dollar.
    roas: spend > 0 ? round2(revenue / spend) : 0,
    // Net return on total campaign cost (ad spend + discounts funded), as a %.
    roi: totalCost > 0 ? round2((profit / totalCost) * 100) : 0,
  };
}

/**
 * Validate the optional start_date / end_date ISO query filters. The metric
 * series are synthetic, so valid values are accepted and ignored; invalid
 * ones are rejected with 400 instead of silently passing through.
 */
function hasValidDateFilters(req: Request, res: Response): boolean {
  const { start_date, end_date } = req.query as Record<string, string | undefined>;
  if (
    (start_date !== undefined && isNaN(Date.parse(start_date))) ||
    (end_date !== undefined && isNaN(Date.parse(end_date)))
  ) {
    res.status(400).json({ success: false, message: 'Invalid start_date or end_date: expected ISO date strings' });
    return false;
  }
  return true;
}

function generateTimeSeries(days = 14) {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      impressions: Math.floor(Math.random() * 5000) + 1000,
      clicks: Math.floor(Math.random() * 300) + 50,
      conversions: Math.floor(Math.random() * 60) + 5,
    });
  }
  return data;
}

// NOTE: there is no real event stream in this deployment. Export reports use
// a DETERMINISTIC SYNTHETIC series seeded from the campaign id so CSV and PDF
// exports are stable for the same campaign (see src/utils/seeded.ts).
function generateExportSeries(campaignId: string, days = 14) {
  const rng = seededRandom(`export:${campaignId}`);
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const impressions = Math.floor(rng() * 5000) + 1000;
    const clicks = Math.floor(impressions * (0.03 + rng() * 0.07));
    const conversions = Math.floor(clicks * (0.05 + rng() * 0.15));
    data.push({
      date: date.toISOString().split('T')[0],
      impressions,
      clicks,
      conversions,
    });
  }
  return data;
}

/**
 * Merchant performance dashboard: the business value the platform generated
 * for the signed-in merchant. `merchant_id` is a Mixed field historically
 * written as a string, so match both representations.
 */
router.get('/merchant', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const merchantMatch = { $in: [userId, new Types.ObjectId(userId)] as any[] };

    // One row per customer so repeat-rate and per-customer averages are exact.
    const perCustomer = await Redemption.aggregate([
      { $match: { merchant_id: merchantMatch, status: 'completed' } },
      {
        $group: {
          _id: '$user_id',
          visits: { $sum: 1 },
          spend: { $sum: '$purchase_amount' },
          discountRedeemed: { $sum: '$discount_amount' },
          discountIssued: { $sum: { $multiply: ['$tokens', TOKEN_VALUE] } },
        },
      },
    ]);

    const customers = perCustomer.length;
    const redemptions = perCustomer.reduce((n, c) => n + (c.visits || 0), 0);
    const revenue = perCustomer.reduce((n, c) => n + (c.spend || 0), 0);
    const discountsRedeemed = perCustomer.reduce((n, c) => n + (c.discountRedeemed || 0), 0);
    const discountsGiven = perCustomer.reduce((n, c) => n + (c.discountIssued || 0), 0);
    const repeatCustomers = perCustomer.filter((c) => (c.visits || 0) > 1).length;

    // Satisfaction = average review rating across this merchant's campaigns.
    const myCampaigns = await Campaign.find({ owner: userId }).select('_id').lean();
    const campaignIds = myCampaigns.map((c) => c._id);
    let satisfaction = 0;
    let reviewCount = 0;
    if (campaignIds.length) {
      const ratingAgg = await Review.aggregate([
        // Exclude expectation-only rows (rating 0) from satisfaction.
        { $match: { campaign_id: { $in: campaignIds }, rating: { $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);
      satisfaction = round2(ratingAgg[0]?.avg || 0);
      reviewCount = ratingAgg[0]?.count || 0;
    }

    res.json(
      success({
        visits: redemptions,
        redemptions,
        customers,
        revenue: round2(revenue),
        discountsGiven: round2(discountsGiven),
        discountsRedeemed: round2(discountsRedeemed),
        avgCustomerSpend: customers > 0 ? round2(revenue / customers) : 0,
        avgDiscountPerCustomer: customers > 0 ? round2(discountsRedeemed / customers) : 0,
        repeatCustomerRate: customers > 0 ? round2((repeatCustomers / customers) * 100) : 0,
        satisfaction,
        reviewCount,
      })
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch merchant metrics' });
  }
});

router.get('/dashboard', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!hasValidDateFilters(req, res)) return;
    const totalCampaigns = await Campaign.countDocuments();
    const totalSpend = await Campaign.aggregate([
      { $group: { _id: null, total: { $sum: '$budget_spent' } } },
    ]);

    res.json(success({
      totalCampaigns,
      totalImpressions: 124000 + Math.floor(Math.random() * 10000),
      totalClicks: 8400 + Math.floor(Math.random() * 1000),
      avgCTR: 6.8,
      totalSpend: totalSpend[0]?.total || 0,
      campaignChange: 12,
      impressionChange: 8,
      clickChange: 15,
      ctrChange: -2,
      spendChange: 5,
      bounceRate: 34,
      bounceRateChange: -3,
    }));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch dashboard metrics' });
  }
});

router.get('/dashboard/:campaignId', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!hasValidDateFilters(req, res)) return;
    const campaignId = req.params.campaignId as string;
    if (!Types.ObjectId.isValid(campaignId)) {
      res.status(400).json({ success: false, message: 'Invalid campaign id' });
      return;
    }
    const campaign = await Campaign.findById(campaignId).lean();
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }

    const impressions = Math.floor((campaign.budget_total || 0) * 2.5);
    const clicks = Math.floor(impressions * 0.068);
    const money = await campaignMoneyMetrics(campaignId, campaign.budget_spent || 0);

    res.json(success({
      totalCampaigns: 1,
      totalImpressions: impressions,
      totalClicks: clicks,
      avgCTR: 6.8,
      totalSpend: campaign.budget_spent || 0,
      campaignChange: 0,
      impressionChange: 4,
      clickChange: 7,
      ctrChange: 1,
      spendChange: -1,
      bounceRate: 32,
      bounceRateChange: -1,
      // Real money metrics from attributed redemptions (recs #1 & #2).
      revenue: money.revenue,
      purchases: money.purchases,
      customersAcquired: money.customersAcquired,
      discountUsed: money.discountUsed,
      discountsIssued: money.discountsIssued,
      profit: money.profit,
      roas: money.roas,
      roi: money.roi,
      budgetTotal: round2(campaign.budget_total || 0),
      budgetRemaining: round2((campaign.budget_total || 0) - (campaign.budget_spent || 0)),
      discountPercentage: campaign.discount_percentage ?? 15,
    }));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch campaign metrics' });
  }
});

router.get('/timeseries/:campaignId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.campaignId as string;
    if (!Types.ObjectId.isValid(campaignId)) {
      res.status(400).json({ success: false, message: 'Invalid campaign id' });
      return;
    }
    const campaign = await Campaign.findById(campaignId).lean();
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }
    res.json(success(generateTimeSeries()));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch time series' });
  }
});

router.get('/funnel/:campaignId', authMiddleware, async (_req: Request, res: Response) => {
  try {
    res.json(success([
      { label: 'Impressions', value: 10000, color: '#1e3a8a' },
      { label: 'Clicks', value: 680, color: '#d4af37' },
      { label: 'Conversions', value: 120, color: '#10b981' },
    ]));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch funnel data' });
  }
});

router.get('/devices/:campaignId', authMiddleware, async (_req: Request, res: Response) => {
  try {
    res.json(success([
      { device: 'Desktop', impressions: 6200, clicks: 450, ctr: 7.3, percentage: 48 },
      { device: 'Mobile', impressions: 4800, clicks: 320, ctr: 6.7, percentage: 38 },
      { device: 'Tablet', impressions: 2000, clicks: 110, ctr: 5.5, percentage: 14 },
    ]));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch device breakdown' });
  }
});

router.get('/export/:campaignId/csv', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.campaignId as string;
    if (!Types.ObjectId.isValid(campaignId)) {
      res.status(400).json({ success: false, message: 'Invalid campaign id' });
      return;
    }
    const campaign = await Campaign.findById(campaignId).select('name').lean();
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }
    // Deterministic series seeded from the campaign id (see header note).
    const series = generateExportSeries(campaignId);
    const header = 'Date,Impressions,Clicks,Conversions,CTR';
    const rows = series.map(
      (d) =>
        `${d.date},${d.impressions},${d.clicks},${d.conversions},${((d.clicks / d.impressions) * 100).toFixed(2)}%`
    );
    const csv = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-${campaignId}.csv`);
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to export CSV' });
  }
});

router.get('/export/:campaignId/pdf', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.campaignId as string;
    if (!Types.ObjectId.isValid(campaignId)) {
      res.status(400).json({ success: false, message: 'Invalid campaign id' });
      return;
    }
    const campaign = await Campaign.findById(campaignId).lean();
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }
    // Deterministic series seeded from the campaign id (see header note).
    const series = generateExportSeries(campaignId);
    const totals = series.reduce(
      (acc, d) => ({
        impressions: acc.impressions + d.impressions,
        clicks: acc.clicks + d.clicks,
        conversions: acc.conversions + d.conversions,
      }),
      { impressions: 0, clicks: 0, conversions: 0 }
    );
    const avgCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-${campaignId}.pdf`);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Campaign Analytics Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#555555').text((campaign as any).name || campaignId, { align: 'center' });
    doc.moveDown(1);

    // Summary
    doc.fillColor('#000000').fontSize(14).text('Summary');
    doc.moveDown(0.3);
    doc.fontSize(11);
    doc.text(`Total Impressions: ${totals.impressions.toLocaleString()}`);
    doc.text(`Total Clicks: ${totals.clicks.toLocaleString()}`);
    doc.text(`Total Conversions: ${totals.conversions.toLocaleString()}`);
    doc.text(`Average CTR: ${avgCtr.toFixed(2)}%`);
    doc.text(`Budget Spent: ${(campaign as any).currency || 'USD'} ${Number((campaign as any).budget_spent || 0).toLocaleString()}`);
    doc.moveDown(1);

    // Daily metrics table
    doc.fontSize(14).text('Daily Metrics (last 14 days)');
    doc.moveDown(0.5);
    const columns = [
      { label: 'Date', width: 110 },
      { label: 'Impressions', width: 100 },
      { label: 'Clicks', width: 80 },
      { label: 'Conversions', width: 100 },
      { label: 'CTR', width: 70 },
    ];
    const tableLeft = 50;
    let y = doc.y;
    const drawRow = (cells: string[], bold: boolean) => {
      let x = tableLeft;
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10);
      cells.forEach((cell, i) => {
        doc.text(cell, x, y, { width: columns[i].width });
        x += columns[i].width;
      });
      y += 18;
    };
    drawRow(columns.map((c) => c.label), true);
    doc.moveTo(tableLeft, y - 4).lineTo(tableLeft + 460, y - 4).strokeColor('#cccccc').stroke();
    for (const d of series) {
      if (y > 760) {
        doc.addPage();
        y = 50;
      }
      drawRow(
        [
          d.date,
          d.impressions.toLocaleString(),
          d.clicks.toLocaleString(),
          d.conversions.toLocaleString(),
          `${((d.clicks / d.impressions) * 100).toFixed(2)}%`,
        ],
        false
      );
    }

    // Footer
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#888888')
      .text(
        `Generated ${new Date().toISOString()} by SmartAdDeals. Metric series are deterministic synthetic data seeded from the campaign id.`,
        50,
        800,
        { align: 'center', width: 495 }
      );

    doc.end();
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to export PDF' });
  }
});

export default router;
