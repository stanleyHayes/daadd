import { Router, Request, Response } from 'express';
import { Campaign } from '../models';
import { authMiddleware } from '../middleware/auth';
import { success } from '../utils/response';

const router = Router();

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

router.get('/dashboard', authMiddleware, async (_req: Request, res: Response) => {
  try {
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
    const campaign = await Campaign.findById(req.params.campaignId).lean();
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }

    const impressions = Math.floor((campaign.budget_total || 0) * 2.5);
    const clicks = Math.floor(impressions * 0.068);

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
    }));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch campaign metrics' });
  }
});

router.get('/timeseries/:campaignId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId).lean();
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

router.get('/export/:campaignId/csv', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const csv = 'Date,Impressions,Clicks,Conversions\n2026-07-01,1000,68,12\n';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.csv');
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to export CSV' });
  }
});

router.get('/export/:campaignId/pdf', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const pdf = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=analytics-report.pdf');
    res.send(pdf);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to export PDF' });
  }
});

export default router;
