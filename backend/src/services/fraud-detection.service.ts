/**
 * Fraud / abuse detection on REAL money-path events.
 *
 * Unlike the campaign anomaly detector, this reads only stored events — completed
 * redemptions and the token-reward ledger — and never fabricates a series. If
 * nothing abusive happened, it raises nothing.
 *
 * Every rule compares an aggregate over a recent window against a configurable
 * threshold and, when tripped, upserts a FraudSignal for human review. Nothing
 * here punishes a user automatically (see FraudSignal for why).
 */
import { Types } from 'mongoose';
import {
  Redemption,
  Reward,
  User,
  MerchantVerification,
  FraudSignal,
  FraudSignalType,
  FraudSubjectType,
  FraudSeverity,
} from '../models';

function tokenValue(): number {
  return parseFloat(process.env.TOKEN_VALUE || '0.05');
}

/**
 * Thresholds, read from the environment at scan time (env-overridable, and so
 * adjustable in tests without a restart). See each rule for meaning.
 */
export function fraudThresholds() {
  return {
    // A single customer completing this many redemptions within the window.
    redemptionVelocityCount: parseInt(process.env.FRAUD_REDEMPTION_VELOCITY || '8', 10),
    redemptionVelocityWindowH: parseInt(process.env.FRAUD_REDEMPTION_WINDOW_H || '24', 10),
    // A single merchant confirming this many redemptions within the window.
    merchantSurgeCount: parseInt(process.env.FRAUD_MERCHANT_SURGE || '25', 10),
    merchantSurgeWindowH: parseInt(process.env.FRAUD_MERCHANT_WINDOW_H || '24', 10),
    // The same customer+merchant pair transacting this many times within the window.
    collusionCount: parseInt(process.env.FRAUD_COLLUSION || '5', 10),
    collusionWindowH: parseInt(process.env.FRAUD_COLLUSION_WINDOW_H || '168', 10), // 7 days
    // A single customer accruing this many tokens within the window.
    rewardFarmingTokens: parseInt(process.env.FRAUD_REWARD_FARMING_TOKENS || '400', 10),
    rewardFarmingWindowH: parseInt(process.env.FRAUD_REWARD_WINDOW_H || '24', 10),
  };
}

interface Detection {
  subject_type: FraudSubjectType;
  subject_id: string;
  type: FraudSignalType;
  metric: string;
  value: number;
  threshold: number;
  window_hours: number;
  evidence: Record<string, unknown>;
  /** User ids whose labels this detection wants resolved for display. */
  userRefs: string[];
}

export interface FraudScanResult {
  created: number;
  refreshed: number;
  signals: Array<{ subject_id: string; type: FraudSignalType; severity: FraudSeverity }>;
}

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 3600 * 1000);
}

const SEVERITY_RANK: Record<FraudSeverity, number> = { low: 1, medium: 2, high: 3, critical: 4 };

/** Severity from how far the value overshoots the threshold. */
function severityFor(value: number, threshold: number): FraudSeverity {
  if (threshold <= 0) return 'medium';
  const ratio = value / threshold;
  if (ratio >= 3) return 'critical';
  if (ratio >= 2) return 'high';
  if (ratio >= 1.5) return 'medium';
  return 'low';
}

/** Group completed redemptions in a window by a key and keep count + discount. */
async function redemptionGroups(sinceHours: number, key: string | Record<string, unknown>) {
  return Redemption.aggregate([
    { $match: { status: 'completed', used_at: { $gte: hoursAgo(sinceHours) } } },
    { $group: { _id: key, count: { $sum: 1 }, discount: { $sum: { $ifNull: ['$discount_amount', 0] } } } },
  ]);
}

/** Rule: one customer completing an abnormal number of redemptions. */
async function detectRedemptionVelocity(): Promise<Detection[]> {
  const { redemptionVelocityCount: min, redemptionVelocityWindowH: win } = fraudThresholds();
  const rows = await redemptionGroups(win, '$user_id');
  return rows
    .filter((r) => r.count >= min && r._id != null)
    .map((r) => {
      const id = String(r._id);
      return {
        subject_type: 'user' as const,
        subject_id: id,
        type: 'redemption_velocity' as const,
        metric: 'redemptions',
        value: r.count,
        threshold: min,
        window_hours: win,
        evidence: { redemptions: r.count, discount_total: round2(r.discount) },
        userRefs: [id],
      };
    });
}

/** Rule: one merchant confirming an abnormal number of redemptions. */
async function detectMerchantSurge(): Promise<Detection[]> {
  const { merchantSurgeCount: min, merchantSurgeWindowH: win } = fraudThresholds();
  const rows = await redemptionGroups(win, '$merchant_id');
  return rows
    .filter((r) => r.count >= min && r._id != null)
    .map((r) => {
      const id = String(r._id);
      return {
        subject_type: 'merchant' as const,
        subject_id: id,
        type: 'merchant_surge' as const,
        metric: 'redemptions',
        value: r.count,
        threshold: min,
        window_hours: win,
        evidence: { redemptions: r.count, discount_total: round2(r.discount) },
        userRefs: [id],
      };
    });
}

/** Rule: the same customer+merchant pair transacting repeatedly. */
async function detectCollusion(): Promise<Detection[]> {
  const { collusionCount: min, collusionWindowH: win } = fraudThresholds();
  const rows = await redemptionGroups(win, { user: '$user_id', merchant: '$merchant_id' });
  return rows
    .filter((r) => r.count >= min && r._id?.user != null && r._id?.merchant != null)
    .map((r) => {
      const user = String(r._id.user);
      const merchant = String(r._id.merchant);
      return {
        subject_type: 'pair' as const,
        subject_id: `${user}:${merchant}`,
        type: 'collusion' as const,
        metric: 'redemptions',
        value: r.count,
        threshold: min,
        window_hours: win,
        evidence: { user_id: user, merchant_id: merchant, redemptions: r.count, discount_total: round2(r.discount) },
        userRefs: [user, merchant],
      };
    });
}

/** Rule: one customer accruing tokens abnormally fast. */
async function detectRewardFarming(): Promise<Detection[]> {
  const { rewardFarmingTokens: minTokens, rewardFarmingWindowH: win } = fraudThresholds();
  const tv = tokenValue();
  const rows = await Reward.aggregate([
    { $match: { type: 'ad_reward', amount: { $gt: 0 }, created_at: { $gte: hoursAgo(win) } } },
    { $group: { _id: '$user_id', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  return rows
    .map((r) => ({ ...r, tokens: tv > 0 ? r.total / tv : 0 }))
    .filter((r) => r.tokens >= minTokens && r._id != null)
    .map((r) => {
      const id = String(r._id);
      return {
        subject_type: 'user' as const,
        subject_id: id,
        type: 'reward_farming' as const,
        metric: 'tokens',
        value: Math.round(r.tokens),
        threshold: minTokens,
        window_hours: win,
        evidence: { tokens: Math.round(r.tokens), reward_events: r.count, amount_total: round2(r.total) },
        userRefs: [id],
      };
    });
}

function round2(n: number): number {
  return Math.round((n || 0) * 100) / 100;
}

/** Resolve display labels for the user ids referenced across detections. */
async function resolveLabels(userIds: string[]): Promise<Map<string, string>> {
  const valid = [...new Set(userIds)].filter((id) => Types.ObjectId.isValid(id));
  const labels = new Map<string, string>();
  if (valid.length === 0) return labels;

  const [users, verifications] = await Promise.all([
    User.find({ _id: { $in: valid } }).select('name email').lean(),
    MerchantVerification.find({ merchant_id: { $in: valid } }).select('merchant_id business_name').lean(),
  ]);
  const bizById = new Map(verifications.map((v) => [String(v.merchant_id), v.business_name]));
  for (const u of users) {
    const biz = bizById.get(String(u._id));
    labels.set(String(u._id), biz || u.email || u.name || String(u._id));
  }
  return labels;
}

function describe(d: Detection, label: string): string {
  switch (d.type) {
    case 'redemption_velocity':
      return `${label} completed ${d.value} redemptions in ${d.window_hours}h (threshold ${d.threshold}).`;
    case 'merchant_surge':
      return `Merchant ${label} confirmed ${d.value} redemptions in ${d.window_hours}h (threshold ${d.threshold}).`;
    case 'collusion':
      return `${label} transacted ${d.value} times in ${Math.round(d.window_hours / 24)}d (threshold ${d.threshold}) — possible collusion.`;
    case 'reward_farming':
      return `${label} accrued ${d.value} tokens in ${d.window_hours}h (threshold ${d.threshold}).`;
  }
}

/**
 * Run every rule and upsert the resulting signals. An existing OPEN signal for
 * the same (subject, type) is refreshed in place rather than duplicated, so the
 * review queue always shows the current magnitude.
 */
export async function runFraudScan(): Promise<FraudScanResult> {
  const detections = (
    await Promise.all([
      detectRedemptionVelocity(),
      detectMerchantSurge(),
      detectCollusion(),
      detectRewardFarming(),
    ])
  ).flat();

  const labels = await resolveLabels(detections.flatMap((d) => d.userRefs));

  const result: FraudScanResult = { created: 0, refreshed: 0, signals: [] };

  for (const d of detections) {
    const label =
      d.subject_type === 'pair'
        ? `${labels.get(String(d.evidence.user_id)) ?? d.evidence.user_id} ↔ ${labels.get(String(d.evidence.merchant_id)) ?? d.evidence.merchant_id}`
        : labels.get(d.subject_id) ?? d.subject_id;
    const severity = severityFor(d.value, d.threshold);
    const description = describe(d, label);

    const fields = {
      subject_label: label,
      severity,
      severity_rank: SEVERITY_RANK[severity],
      metric: d.metric,
      value: d.value,
      threshold: d.threshold,
      window_hours: d.window_hours,
      evidence: d.evidence,
      description,
      detected_at: new Date(),
    };

    // Refresh an existing OPEN signal in place; otherwise create one. The
    // partial unique index guards the create against a concurrent scan.
    const existing = await FraudSignal.findOneAndUpdate(
      { subject_type: d.subject_type, subject_id: d.subject_id, type: d.type, status: 'open' },
      { $set: fields },
      { new: true }
    );
    if (existing) {
      result.refreshed += 1;
      result.signals.push({ subject_id: d.subject_id, type: d.type, severity });
      continue;
    }

    try {
      await FraudSignal.create({
        subject_type: d.subject_type,
        subject_id: d.subject_id,
        type: d.type,
        status: 'open',
        ...fields,
      });
      result.created += 1;
      result.signals.push({ subject_id: d.subject_id, type: d.type, severity });
    } catch (err: any) {
      // Lost the race to a concurrent scan — treat as refreshed, not fatal.
      if (err?.code === 11000) {
        result.refreshed += 1;
        continue;
      }
      throw err;
    }
  }

  return result;
}
