/**
 * Real-time anomaly detection service (spec §4.7).
 *
 * NOTE ON DATA: there is no real event stream in this deployment, so the
 * 14-day metric series per campaign is DETERMINISTIC SYNTHETIC DATA seeded
 * from the campaign id (see src/utils/seeded.ts) — identical input always
 * yields the same series. The LAST day of the series is computed from the
 * campaign's actual stored stats (impressions/clicks fields or embedded
 * metrics) when they exist on the document.
 */
import { Types } from 'mongoose';
import { Campaign, Anomaly, Notification, User, AnomalyType, AnomalySeverity } from '../models';
import { seededRandom } from '../utils/seeded';
import { sendAnomalyAlertEmail } from './mailer';

const SERIES_DAYS = 14;
const BASELINE_DAYS = 7;

const LOW_CTR_THRESHOLD = 1.5; // percent
const CTR_SPIKE_PCT = 10; // % above baseline mean
const Z_SCORE_THRESHOLD = 2;
const TRAFFIC_SPIKE_PCT = 500; // % above baseline mean
const BOT_CTR_THRESHOLD = 25; // percent

export interface DayMetric {
  date: string;
  impressions: number;
  clicks: number;
  ctr: number; // percent
}

export interface ScanResult {
  scanned: number;
  created: number;
  anomalies: any[];
}

/**
 * Build a deterministic 14-day series seeded from the campaign id.
 * The last day uses the campaign's actual stored stats where available.
 */
export function buildMetricSeries(campaignId: string, campaign: any): DayMetric[] {
  const rng = seededRandom(`anomaly:${campaignId}`);
  const days: DayMetric[] = [];
  const now = new Date();
  for (let i = SERIES_DAYS - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const impressions = Math.floor(800 + rng() * 9200);
    const ctr = 1 + rng() * 8; // percent, 1–9%
    const clicks = Math.round((impressions * ctr) / 100);
    days.push({ date: date.toISOString().split('T')[0], impressions, clicks, ctr });
  }

  // Last day: prefer the campaign's actual stored stats where available.
  const last = days[days.length - 1];
  const storedImpressions = Number(campaign?.impressions ?? campaign?.metrics?.impressions ?? 0);
  const storedClicks = Number(campaign?.clicks ?? campaign?.metrics?.clicks ?? 0);
  if (storedImpressions > 0) {
    last.impressions = storedImpressions;
    if (storedClicks > 0) last.clicks = storedClicks;
    last.ctr = last.impressions > 0 ? (last.clicks / last.impressions) * 100 : last.ctr;
  }
  return days;
}

function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function stddev(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((acc, v) => acc + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

interface Detection {
  type: AnomalyType;
  severity: AnomalySeverity;
  metric: string;
  current_value: number;
  threshold_value: number;
  description: string;
}

/**
 * Apply the spec §4.7 detection rules against the latest day vs the
 * trailing 7-day baseline.
 */
export function detectAnomalies(series: DayMetric[]): Detection[] {
  if (series.length < BASELINE_DAYS + 1) return [];
  const last = series[series.length - 1];
  const baseline = series.slice(series.length - 1 - BASELINE_DAYS, series.length - 1);
  const detections: Detection[] = [];

  const baselineCtr = baseline.map((d) => d.ctr);
  const ctrMean = mean(baselineCtr);
  const ctrStd = stddev(baselineCtr, ctrMean);
  const ctrZ = ctrStd > 0 ? (last.ctr - ctrMean) / ctrStd : 0;

  const baselineImpr = baseline.map((d) => d.impressions);
  const imprMean = mean(baselineImpr);

  // Rule: bot pattern heuristic — ctr > 25% or clicks > impressions.
  if (last.ctr > BOT_CTR_THRESHOLD || last.clicks > last.impressions) {
    detections.push({
      type: 'bot_traffic',
      severity: 'critical',
      metric: 'ctr',
      current_value: Number(last.ctr.toFixed(2)),
      threshold_value: BOT_CTR_THRESHOLD,
      description: `Suspected bot traffic: CTR ${last.ctr.toFixed(2)}% (clicks ${last.clicks}, impressions ${last.impressions})`,
    });
  }

  // Rule: low CTR — CTR < 1.5%.
  if (last.ctr < LOW_CTR_THRESHOLD) {
    detections.push({
      type: 'ctr_drop',
      severity: 'medium',
      metric: 'ctr',
      current_value: Number(last.ctr.toFixed(2)),
      threshold_value: LOW_CTR_THRESHOLD,
      description: `CTR ${last.ctr.toFixed(2)}% is below the ${LOW_CTR_THRESHOLD}% threshold`,
    });
  }

  // Rule: CTR spike > 10% vs 7-day baseline mean, confirmed by z-score |z| > 2.
  if (ctrMean > 0 && last.ctr > ctrMean * (1 + CTR_SPIKE_PCT / 100) && Math.abs(ctrZ) > Z_SCORE_THRESHOLD) {
    detections.push({
      type: 'ctr_spike',
      severity: 'high',
      metric: 'ctr',
      current_value: Number(last.ctr.toFixed(2)),
      threshold_value: Number((ctrMean * (1 + CTR_SPIKE_PCT / 100)).toFixed(2)),
      description: `CTR ${last.ctr.toFixed(2)}% spiked >${CTR_SPIKE_PCT}% above the 7-day baseline ${ctrMean.toFixed(2)}% (z=${ctrZ.toFixed(2)})`,
    });
  }

  // Rule: traffic spike > 500% vs baseline mean impressions.
  if (imprMean > 0 && last.impressions > imprMean * (1 + TRAFFIC_SPIKE_PCT / 100)) {
    detections.push({
      type: 'impression_anomaly',
      severity: 'high',
      metric: 'impressions',
      current_value: last.impressions,
      threshold_value: Math.round(imprMean * (1 + TRAFFIC_SPIKE_PCT / 100)),
      description: `Impressions ${last.impressions} spiked >${TRAFFIC_SPIKE_PCT}% above the 7-day baseline ${Math.round(imprMean)}`,
    });
  }

  return detections;
}

/**
 * Scan a set of campaigns, creating Anomaly docs (deduped by active
 * type+campaign), notifications and — for critical anomalies — pausing
 * the campaign. Email alerts are fire-and-forget.
 */
export async function scanCampaignsForAnomalies(campaigns: any[]): Promise<ScanResult> {
  const created: any[] = [];

  for (const campaign of campaigns) {
    const campaignId = campaign._id?.toString?.() || String(campaign._id);
    const series = buildMetricSeries(campaignId, campaign);
    const detections = detectAnomalies(series);
    if (detections.length === 0) continue;

    const newAnomalies: any[] = [];
    for (const d of detections) {
      // Dedupe: skip if an active anomaly of the same type exists for this campaign.
      const existing = await Anomaly.findOne({
        campaign_id: campaignId,
        type: d.type,
        status: 'active',
      }).lean();
      if (existing) continue;

      const critical = d.severity === 'critical';
      const anomaly = await Anomaly.create({
        campaign_id: campaignId,
        campaign_name: campaign.name || '',
        type: d.type,
        severity: d.severity,
        metric: d.metric,
        current_value: d.current_value,
        threshold_value: d.threshold_value,
        description: d.description,
        status: 'active',
        auto_paused: critical,
        detected_at: new Date(),
      });
      newAnomalies.push(anomaly.toObject());
    }

    if (newAnomalies.length === 0) continue;

    // Critical anomalies auto-pause the campaign.
    const hasCritical = newAnomalies.some((a) => a.severity === 'critical');
    if (hasCritical && campaign.status === 'active') {
      await Campaign.updateOne({ _id: campaign._id }, { $set: { status: 'paused' } });
    }

    // Notify the campaign owner (in-app + email, email is non-blocking).
    const ownerId = campaign.owner?.toString?.() || campaign.owner;
    if (ownerId) {
      try {
        await Notification.create({
          user_id: ownerId,
          type: 'anomaly_alert',
          title: `Anomaly detected on "${campaign.name || 'campaign'}"`,
          message: newAnomalies.map((a) => a.description).join(' '),
          read: false,
        });
      } catch (err) {
        console.warn('[anomaly-detection] notification failed (swallowed):', err);
      }

      let ownerEmail: string | null = null;
      try {
        if (Types.ObjectId.isValid(ownerId)) {
          const owner = await User.findById(ownerId).select('email').lean();
          ownerEmail = (owner as any)?.email || null;
        }
      } catch (err) {
        console.warn('[anomaly-detection] owner lookup failed (swallowed):', err);
      }
      if (ownerEmail) {
        // Fire-and-forget: never block the scan on email delivery.
        void sendAnomalyAlertEmail(ownerEmail, campaign.name || 'campaign', newAnomalies).catch(() => {});
      }
    }

    created.push(...newAnomalies);
  }

  return { scanned: campaigns.length, created: created.length, anomalies: created };
}

/** Scan all active campaigns (used by the scheduled job). */
export async function scanAllActiveCampaigns(): Promise<ScanResult> {
  const campaigns = await Campaign.find({ status: 'active' }).lean();
  return scanCampaignsForAnomalies(campaigns);
}

/** Scan the caller's active campaigns (all active campaigns for admins). */
export async function scanForUser(userId: string, role: string): Promise<ScanResult> {
  const filter: any = { status: 'active' };
  if (role !== 'admin') {
    // owner is stored as Mixed — match both string and ObjectId forms.
    const ownerCandidates: any[] = [userId];
    if (Types.ObjectId.isValid(userId)) ownerCandidates.push(new Types.ObjectId(userId));
    filter.owner = { $in: ownerCandidates };
  }
  const campaigns = await Campaign.find(filter).lean();
  return scanCampaignsForAnomalies(campaigns);
}
