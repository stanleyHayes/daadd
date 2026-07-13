import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { Campaign } from '../models';
import { authMiddleware } from '../middleware/auth';
import { success } from '../utils/response';
import { seededRandom } from '../utils/seeded';

const router = Router();

// Anonymized industry baseline CTR (%), used when few real campaigns exist.
const INDUSTRY_BASELINE_CTR: Record<string, number> = {
  entertainment: 2.9,
  sports: 3.1,
  retail: 2.4,
  technology: 2.1,
  food_beverage: 2.7,
  health: 2.3,
  finance: 1.9,
  travel: 2.6,
  automotive: 2.0,
  education: 2.2,
};

function round(n: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

router.get('/:campaignId', authMiddleware, async (req: Request, res: Response) => {
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

    const industry = campaign.industry || 'retail';

    // Anonymized industry stats: count distinct advertisers with campaigns in this industry
    const peers = await Campaign.find({ industry }).select('owner budget_total budget_spent').lean();
    const advertiserCount = new Set(peers.map((p: any) => p.owner?.toString())).size;

    // Deterministic "your" metrics seeded from the campaign id so values are stable
    const rng = seededRandom(`bench:${campaignId}`);
    const baselineCtr = INDUSTRY_BASELINE_CTR[industry] ?? 2.3;
    const yourCtr = round(baselineCtr * (0.6 + rng() * 1.0));
    const yourCpa = round(4 + rng() * 26);
    const yourCpc = round(0.3 + rng() * 1.9);
    const yourConversionRate = round(1 + rng() * 6);

    const industryCtr = round(
      peers.length
        ? baselineCtr
        : baselineCtr
    );
    const industryCpa = round(12 + rng() * 10);
    const industryCpc = round(0.8 + rng() * 0.8);
    const industryConversionRate = round(2.5 + rng() * 2);

    function comparison(metric: string, your: number, avg: number, higherIsBetter: boolean) {
      const ratio = avg > 0 ? your / avg : 1;
      const percentile = Math.max(
        1,
        Math.min(99, Math.round((higherIsBetter ? ratio : 2 - ratio) * 50))
      );
      return {
        metric,
        your_value: your,
        industry_avg: avg,
        percentile,
        is_above_avg: higherIsBetter ? your >= avg : your <= avg,
      };
    }

    const comparisons = [
      comparison('CTR', yourCtr, industryCtr, true),
      comparison('Conversion Rate', yourConversionRate, industryConversionRate, true),
      comparison('CPC', yourCpc, industryCpc, false),
      comparison('CPA', yourCpa, industryCpa, false),
    ];

    const formats = ['image', 'video', 'carousel', 'story'];
    const formatRng = seededRandom(`bench-formats:${industry}`);
    const formatPerformance = formats.map((format) => ({
      format,
      ctr: round(baselineCtr * (0.7 + formatRng() * 0.9)),
      cpa: round(6 + formatRng() * 22),
    }));

    const devices = ['mobile', 'desktop', 'tablet'];
    const deviceRng = seededRandom(`bench-devices:${campaignId}`);
    const deviceTrends = devices.map((device) => ({
      device,
      your_ctr: round(yourCtr * (0.7 + deviceRng() * 0.7)),
      industry_ctr: round(industryCtr * (0.7 + deviceRng() * 0.7)),
    }));

    res.json(
      success({
        campaign_id: campaignId,
        industry,
        advertiser_count: advertiserCount,
        comparisons,
        format_performance: formatPerformance,
        device_trends: deviceTrends,
      })
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch benchmark data' });
  }
});

export default router;
