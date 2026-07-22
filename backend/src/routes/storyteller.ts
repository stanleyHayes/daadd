import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import PDFDocument from 'pdfkit';
import { Campaign } from '../models';
import { authMiddleware } from '../middleware/auth';
import { success } from '../utils/response';
import { seededRandom } from '../utils/seeded';

const router = Router();

interface StoryChapter {
  id: string;
  number: number;
  title: string;
  narrative: string;
  stats: { impressions: number; clicks: number; spend: number };
  visualization: string;
  data: Record<string, unknown>;
}

interface AdJourneyStory {
  campaign_id: string;
  campaign_name: string;
  is_preliminary: boolean;
  campaign_age_hours?: number;
  chapters: StoryChapter[];
  key_insights: string[];
  recommendations: string[];
  money_flow: { regions: { name: string; cost: number; efficiency: number }[] };
}

const CHAPTER_TITLES = ['First Impression', 'Ripple Effect', 'Peak Moments', 'Conversion Trail'];
const REGIONS = ['Accra', 'Kumasi', 'Lagos', 'Nairobi', 'London', 'New York'];

function buildStory(campaign: any): AdJourneyStory {
  const campaignId = campaign._id.toString();
  const rng = seededRandom(`story:${campaignId}`);

  const createdAt = campaign.created_at ? new Date(campaign.created_at).getTime() : Date.now();
  const campaignAgeHours = Math.max(0, (Date.now() - createdAt) / (1000 * 60 * 60));
  const isPreliminary = campaignAgeHours < 24;

  // Deterministic metrics seeded from the campaign, scaled by budget
  const budgetTotal = campaign.budget_total ?? 0;
  const budgetSpent = campaign.budget_spent ?? 0;
  const baseImpressions = Math.round(20000 + rng() * 60000 + budgetTotal * 40);
  const baseCtr = 0.8 + rng() * 4.5; // %
  const totalClicks = Math.round((baseImpressions * baseCtr) / 100);
  const totalConversions = Math.round(totalClicks * (0.02 + rng() * 0.08));
  const totalSpend = budgetSpent > 0 ? budgetSpent : Math.round(budgetTotal * (0.2 + rng() * 0.5));

  const chapterFractions = [0.35, 0.28, 0.22, 0.15];
  const chapters: StoryChapter[] = CHAPTER_TITLES.map((title, i) => {
    const impressions = Math.round(baseImpressions * chapterFractions[i] * (0.85 + rng() * 0.3));
    const clicks = Math.round((impressions * baseCtr) / 100);
    const spend = Math.round(totalSpend * chapterFractions[i] * 100) / 100;
    const ctr = impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0;
    return {
      id: `chapter-${i + 1}`,
      number: i + 1,
      title,
      narrative: chapterNarrative(title, campaign.name, impressions, clicks, ctr, i),
      stats: { impressions, clicks, spend },
      visualization: ['impressions_trend', 'engagement_spread', 'peak_activity', 'conversion_funnel'][i],
      data: { impressions, clicks, spend, ctr, conversions: Math.round(totalConversions * chapterFractions[i]) },
    };
  });

  const ctr = Math.round((totalClicks / Math.max(1, baseImpressions)) * 10000) / 100;
  const cpa = totalConversions > 0 ? Math.round((totalSpend / totalConversions) * 100) / 100 : 0;

  const keyInsights = [
    `Your campaign reached ${baseImpressions.toLocaleString()} people with a ${ctr}% click-through rate.`,
    ctr >= 2.5
      ? 'Engagement is above the industry average — your creative is resonating with the audience.'
      : 'Engagement is below the 2.5% industry average — creative refresh could unlock more clicks.',
    `${totalConversions.toLocaleString()} conversions were recorded at an average cost of $${cpa.toFixed(2)} per acquisition.`,
  ];

  const recommendations = [
    ctr < 2.5
      ? 'Test new headlines and visuals to lift click-through rate toward the industry average.'
      : 'Scale budget toward your best-performing placements to capitalize on strong engagement.',
    'Shift spend toward the regions with the highest efficiency in the money flow view.',
    cpa > 25
      ? 'Tighten audience targeting to bring cost per acquisition below $25.'
      : 'Maintain current targeting — acquisition costs are healthy.',
  ];

  const moneyFlow = {
    regions: REGIONS.map((name) => {
      const cost = Math.round((totalSpend * (0.05 + rng() * 0.3)) * 100) / 100;
      const efficiency = Math.round((0.5 + rng() * 2.5) * 100) / 100;
      return { name, cost, efficiency };
    }).sort((a, b) => b.cost - a.cost),
  };

  return {
    campaign_id: campaignId,
    campaign_name: campaign.name,
    is_preliminary: isPreliminary,
    campaign_age_hours: Math.round(campaignAgeHours * 10) / 10,
    chapters,
    key_insights: keyInsights,
    recommendations,
    money_flow: moneyFlow,
  };
}

function chapterNarrative(
  title: string,
  campaignName: string,
  impressions: number,
  clicks: number,
  ctr: number,
  index: number
): string {
  switch (index) {
    case 0:
      return `"${campaignName}" stepped into the world quietly. In its opening chapter, ${impressions.toLocaleString()} people laid eyes on the campaign for the first time, and ${clicks.toLocaleString()} of them were curious enough to take a closer look — a ${ctr}% first-impression rate that set the tone for everything that followed.`;
    case 1:
      return `Word began to travel. The ripple effect carried the campaign to another ${impressions.toLocaleString()} viewers as early engagers shared and revisited the ads. With ${clicks.toLocaleString()} clicks in this chapter, momentum was building beyond the initial audience.`;
    case 2:
      return `Then came the peak. Engagement surged to its highest point as ${impressions.toLocaleString()} impressions flooded in during the campaign's golden window. ${clicks.toLocaleString()} clicks at a ${ctr}% rate marked the moment the campaign truly found its audience.`;
    default:
      return `Every story needs an ending that pays off. In the final chapter, attention turned into action: ${clicks.toLocaleString()} clicks from ${impressions.toLocaleString()} impressions funneled toward conversion, closing the loop from first impression to lasting customer.`;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function storyToHtml(story: AdJourneyStory): string {
  const chapters = story.chapters
    .map(
      (c) => `
      <section class="chapter">
        <h2>Chapter ${c.number}: ${escapeHtml(c.title)}</h2>
        <p>${escapeHtml(c.narrative)}</p>
        <ul class="stats">
          <li><strong>${c.stats.impressions.toLocaleString()}</strong> impressions</li>
          <li><strong>${c.stats.clicks.toLocaleString()}</strong> clicks</li>
          <li><strong>$${c.stats.spend.toLocaleString()}</strong> spend</li>
        </ul>
      </section>`
    )
    .join('');

  const insights = story.key_insights.map((i) => `<li>${escapeHtml(i)}</li>`).join('');
  const recs = story.recommendations.map((r) => `<li>${escapeHtml(r)}</li>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ad Journey Story — ${escapeHtml(story.campaign_name)}</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; max-width: 720px; margin: 0 auto; padding: 40px 20px; color: #1f2937; line-height: 1.6; }
  h1 { font-size: 28px; margin-bottom: 4px; }
  .subtitle { color: #6b7280; margin-bottom: 32px; }
  .chapter { border-left: 4px solid #2563eb; padding: 4px 0 4px 20px; margin-bottom: 28px; }
  .chapter h2 { font-size: 18px; margin: 0 0 8px; }
  .stats { list-style: none; display: flex; gap: 24px; padding: 0; margin: 12px 0 0; font-size: 14px; color: #4b5563; }
  .stats strong { display: block; font-size: 18px; color: #111827; }
  h3 { margin-top: 32px; }
  footer { margin-top: 48px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style>
</head>
<body>
  <h1>Ad Journey Story</h1>
  <p class="subtitle">${escapeHtml(story.campaign_name)}${story.is_preliminary ? ' — preliminary insights' : ''}</p>
  ${chapters}
  <h3>Key Insights</h3>
  <ul>${insights}</ul>
  <h3>Recommendations</h3>
  <ul>${recs}</ul>
  <footer>Generated ${new Date().toISOString()} by SmartAdDeals Storyteller</footer>
</body>
</html>`;
}

async function loadCampaignStory(campaignId: string, res: Response): Promise<AdJourneyStory | null> {
  if (!Types.ObjectId.isValid(campaignId)) {
    res.status(400).json({ success: false, message: 'Invalid campaign id' });
    return null;
  }
  const campaign = await Campaign.findById(campaignId).lean();
  if (!campaign) {
    res.status(404).json({ success: false, message: 'Campaign not found' });
    return null;
  }
  return buildStory(campaign);
}

router.get('/:campaignId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const story = await loadCampaignStory(req.params.campaignId as string, res);
    if (!story) return;
    res.json(success(story));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to build story' });
  }
});

router.get('/:campaignId/export/html', authMiddleware, async (req: Request, res: Response) => {
  try {
    const story = await loadCampaignStory(req.params.campaignId as string, res);
    if (!story) return;
    const html = storyToHtml(story);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ad-journey-story.html"');
    res.send(html);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to export story' });
  }
});

router.get('/:campaignId/export/pdf', authMiddleware, async (req: Request, res: Response) => {
  try {
    const story = await loadCampaignStory(req.params.campaignId as string, res);
    if (!story) return;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="ad-journey-story.pdf"');

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(24).fillColor('#111827').text('Ad Journey Story');
    doc
      .fontSize(12)
      .fillColor('#6b7280')
      .text(`${story.campaign_name}${story.is_preliminary ? ' — preliminary insights' : ''}`);
    doc.moveDown(1.5);

    for (const chapter of story.chapters) {
      doc.fontSize(15).fillColor('#2563eb').text(`Chapter ${chapter.number}: ${chapter.title}`);
      doc.moveDown(0.3);
      doc.fontSize(10.5).fillColor('#1f2937').text(chapter.narrative, { lineGap: 3 });
      doc.moveDown(0.4);
      doc
        .fontSize(10)
        .fillColor('#4b5563')
        .text(
          `Impressions: ${chapter.stats.impressions.toLocaleString()}   Clicks: ${chapter.stats.clicks.toLocaleString()}   Spend: $${chapter.stats.spend.toLocaleString()}`
        );
      doc.moveDown(1);
    }

    doc.fontSize(14).fillColor('#111827').text('Key Insights');
    doc.moveDown(0.3);
    for (const insight of story.key_insights) {
      doc.fontSize(10.5).fillColor('#1f2937').text(`• ${insight}`, { indent: 10, lineGap: 3 });
    }
    doc.moveDown(1);

    doc.fontSize(14).fillColor('#111827').text('Recommendations');
    doc.moveDown(0.3);
    for (const rec of story.recommendations) {
      doc.fontSize(10.5).fillColor('#1f2937').text(`• ${rec}`, { indent: 10, lineGap: 3 });
    }

    doc
      .moveDown(2)
      .fontSize(8)
      .fillColor('#9ca3af')
      .text(`Generated ${new Date().toISOString()} by SmartAdDeals Storyteller`);

    doc.end();
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: err.message || 'Failed to export story' });
    } else {
      res.end();
    }
  }
});

export default router;
