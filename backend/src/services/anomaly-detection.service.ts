/**
 * Real-time anomaly detection service (spec §3.6).
 *
 * NOTE ON DATA: there is no real event stream in this deployment, so the
 * 14-day metric series per campaign is DETERMINISTIC SYNTHETIC DATA seeded
 * from the campaign id (see src/utils/seeded.ts) — identical input always
 * yields the same series. The LAST day of the series is computed from the
 * campaign's actual stored stats (impressions/clicks/spend/conversions
 * fields or embedded metrics) when they exist on the document.
 */
import { Types } from 'mongoose';
import { Campaign, Anomaly, Notification, User, TeamAuditLog, AnomalyType, AnomalySeverity } from '../models';
import { seededRandom } from '../utils/seeded';
import { sendAnomalyAlertEmail } from './mailer';

const SERIES_DAYS = 14;
const BASELINE_DAYS = 7;

// Spec §3.6 rules (latest day vs 7-day baseline mean).
const CTR_DROP_PCT = 20; // ctr_drop: latest CTR < 80% of baseline mean
const CPA_SPIKE_PCT = 25; // cpa_spike: latest CPA > 125% of baseline mean
const SPEND_VARIANCE_PCT = 30; // spend_anomaly: |latest − mean| / mean > 30%
const CVR_COLLAPSE_PCT = 30; // conversion_collapse: latest CVR < 70% of baseline mean

// Additional heuristic signals kept alongside the spec rules.
const CTR_SPIKE_PCT = 10; // % above baseline mean
const Z_SCORE_THRESHOLD = 2;
const TRAFFIC_SPIKE_PCT = 500; // % above baseline mean
const BOT_CTR_THRESHOLD = 25; // percent

export interface DayMetric {
  date: string;
  impressions: number;
  clicks: number;
  ctr: number; // percent
  spend: number; // currency units
  conversions: number;
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
    const spend = Math.round((50 + rng() * 450) * 100) / 100; // $50–$500/day
    const conversions = Math.round(clicks * (0.02 + rng() * 0.08)); // 2–10% CVR
    days.push({ date: date.toISOString().split('T')[0], impressions, clicks, ctr, spend, conversions });
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
  const storedSpend = Number(campaign?.spend ?? campaign?.metrics?.spend ?? 0);
  const storedConversions = Number(campaign?.conversions ?? campaign?.metrics?.conversions ?? 0);
  if (storedSpend > 0) last.spend = storedSpend;
  if (storedConversions > 0) last.conversions = storedConversions;
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

/** Cost per acquisition; 0 when the day has no conversions (guards ÷0). */
function cpaOf(day: DayMetric): number {
  return day.conversions > 0 ? day.spend / day.conversions : 0;
}

/** Conversion rate (conversions per click) in percent; 0 when no clicks. */
function cvrOf(day: DayMetric): number {
  return day.clicks > 0 ? (day.conversions / day.clicks) * 100 : 0;
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
 * Apply the spec §3.6 detection rules against the latest day vs the
 * trailing 7-day baseline. Every ratio rule is skipped when its baseline
 * mean is 0 so no Infinity/NaN alerts are produced.
 */
export function detectAnomalies(series: DayMetric[]): Detection[] {
  if (series.length < BASELINE_DAYS + 1) return [];
  const last = series[series.length - 1];
  const baseline = series.slice(series.length - 1 - BASELINE_DAYS, series.length - 1);
  const detections: Detection[] = [];

  const ctrMean = mean(baseline.map((d) => d.ctr));
  const ctrStd = stddev(baseline.map((d) => d.ctr), ctrMean);
  const ctrZ = ctrStd > 0 ? (last.ctr - ctrMean) / ctrStd : 0;

  const spendMean = mean(baseline.map((d) => d.spend));
  const cpaMean = mean(baseline.map(cpaOf));
  const cvrMean = mean(baseline.map(cvrOf));
  const lastCpa = cpaOf(last);
  const lastCvr = cvrOf(last);

  const imprMean = mean(baseline.map((d) => d.impressions));

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

  // Spec §3.6 rule: ctr_drop — latest CTR dropped >20% vs 7-day baseline mean.
  if (ctrMean > 0 && last.ctr < ctrMean * (1 - CTR_DROP_PCT / 100)) {
    detections.push({
      type: 'ctr_drop',
      severity: 'medium',
      metric: 'ctr',
      current_value: Number(last.ctr.toFixed(2)),
      threshold_value: Number((ctrMean * (1 - CTR_DROP_PCT / 100)).toFixed(2)),
      description: `CTR ${last.ctr.toFixed(2)}% dropped >${CTR_DROP_PCT}% below the 7-day baseline ${ctrMean.toFixed(2)}%`,
    });
  }

  // Spec §3.6 rule: cpa_spike — latest CPA >25% above 7-day baseline mean.
  if (cpaMean > 0 && lastCpa > cpaMean * (1 + CPA_SPIKE_PCT / 100)) {
    detections.push({
      type: 'cpa_spike',
      severity: 'high',
      metric: 'cpa',
      current_value: Number(lastCpa.toFixed(2)),
      threshold_value: Number((cpaMean * (1 + CPA_SPIKE_PCT / 100)).toFixed(2)),
      description: `CPA $${lastCpa.toFixed(2)} spiked >${CPA_SPIKE_PCT}% above the 7-day baseline $${cpaMean.toFixed(2)}`,
    });
  }

  // Spec §3.6 rule: spend_anomaly — latest spend deviates >30% (either
  // direction) from the 7-day baseline mean.
  if (spendMean > 0 && Math.abs(last.spend - spendMean) / spendMean > SPEND_VARIANCE_PCT / 100) {
    detections.push({
      type: 'spend_anomaly',
      severity: 'high',
      metric: 'spend',
      current_value: Number(last.spend.toFixed(2)),
      threshold_value: Number((spendMean * (1 + SPEND_VARIANCE_PCT / 100)).toFixed(2)),
      description: `Spend $${last.spend.toFixed(2)} deviates >${SPEND_VARIANCE_PCT}% from the 7-day baseline $${spendMean.toFixed(2)}`,
    });
  }

  // Spec §3.6 rule: conversion_collapse — latest conversion rate fell
  // below 70% of the 7-day baseline mean.
  if (cvrMean > 0 && lastCvr < cvrMean * (1 - CVR_COLLAPSE_PCT / 100)) {
    detections.push({
      type: 'conversion_collapse',
      severity: 'high',
      metric: 'cvr',
      current_value: Number(lastCvr.toFixed(2)),
      threshold_value: Number((cvrMean * (1 - CVR_COLLAPSE_PCT / 100)).toFixed(2)),
      description: `Conversion rate ${lastCvr.toFixed(2)}% collapsed below ${100 - CVR_COLLAPSE_PCT}% of the 7-day baseline ${cvrMean.toFixed(2)}%`,
    });
  }

  // Additional signal: CTR spike > 10% vs 7-day baseline mean, confirmed by z-score |z| > 2.
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

  // Additional signal: traffic spike > 500% vs baseline mean impressions.
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
 * Write a spec §3.6 audit-log entry. Uses the same TeamAuditLog mechanism
 * as team actions (see routes/teams.ts); failures are swallowed so audit
 * logging never breaks a scan.
 */
async function writeAuditLog(entry: {
  campaign_id: string;
  action: string;
  field: string;
  old_value?: string;
  new_value?: string;
}): Promise<void> {
  try {
    await TeamAuditLog.create({
      user_name: 'system',
      old_value: '',
      new_value: '',
      ...entry,
    });
  } catch (err) {
    console.warn('[anomaly-detection] audit log failed (swallowed):', err);
  }
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
      let anomaly;
      try {
        anomaly = await Anomaly.create({
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
      } catch (err: any) {
        // Duplicate active anomaly (partial unique index on
        // campaign_id+type) — lost the check-then-create race against a
        // concurrent scan; treat it as deduped.
        if (err?.code === 11000) continue;
        throw err;
      }
      newAnomalies.push(anomaly.toObject());

      // Spec §3.6 action: audit log entry for the detection.
      await writeAuditLog({
        campaign_id: campaignId,
        action: 'anomaly_detected',
        field: d.type,
        new_value: d.description,
      });
    }

    if (newAnomalies.length === 0) continue;

    // Critical anomalies auto-pause the campaign.
    const hasCritical = newAnomalies.some((a) => a.severity === 'critical');
    if (hasCritical && campaign.status === 'active') {
      await Campaign.updateOne({ _id: campaign._id }, { $set: { status: 'paused' } });
      // Spec §3.6 action: audit log entry for the auto-pause.
      await writeAuditLog({
        campaign_id: campaignId,
        action: 'auto_pause',
        field: 'status',
        old_value: 'active',
        new_value: 'paused',
      });
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
