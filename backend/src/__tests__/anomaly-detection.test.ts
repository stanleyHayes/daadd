import { Types } from 'mongoose';
import {
  detectAnomalies,
  scanCampaignsForAnomalies,
  DayMetric,
} from '../services/anomaly-detection.service';
import { Anomaly, Campaign, TeamAuditLog } from '../models';
import { connectTestDb, resetTestDb, closeTestDb } from '../test-helpers';

const SERIES_DAYS = 14;

/** Uniform 14-day series; baseline = days[len-8..len-2], last = days[len-1]. */
function makeSeries(overrides: { baseline?: Partial<DayMetric>; last?: Partial<DayMetric> }): DayMetric[] {
  const days: DayMetric[] = [];
  for (let i = 0; i < SERIES_DAYS; i++) {
    days.push({
      date: `2026-07-${String(i + 1).padStart(2, '0')}`,
      impressions: 1000,
      clicks: 50,
      ctr: 5, // percent
      spend: 100,
      conversions: 10,
      ...overrides.baseline,
    });
  }
  days[days.length - 1] = { ...days[days.length - 1], ...overrides.last };
  return days;
}

describe('detectAnomalies — spec §3.6 rules', () => {
  describe('ctr_drop (>20% vs 7-day baseline mean)', () => {
    it('fires on a 25% CTR drop', () => {
      const detections = detectAnomalies(makeSeries({ last: { ctr: 3.75 } }));
      const drop = detections.find((d) => d.type === 'ctr_drop');
      expect(drop).toBeDefined();
      expect(drop!.severity).toBe('medium');
      expect(drop!.current_value).toBe(3.75);
      expect(drop!.threshold_value).toBe(4); // 0.8 × baseline mean 5
      expect(detections).toHaveLength(1);
    });

    it('does not fire on a 10% CTR drop', () => {
      expect(detectAnomalies(makeSeries({ last: { ctr: 4.5 } }))).toEqual([]);
    });
  });

  describe('cpa_spike (>25% vs 7-day baseline mean)', () => {
    it('fires on a +43% CPA spike', () => {
      // Baseline CPA = 100/10 = $10; last = 100/7 ≈ $14.29 (> $12.50).
      // CVR 14% is exactly 0.7 × baseline 20%, so conversion_collapse stays silent.
      const detections = detectAnomalies(makeSeries({ last: { conversions: 7 } }));
      const spike = detections.find((d) => d.type === 'cpa_spike');
      expect(spike).toBeDefined();
      expect(spike!.severity).toBe('high');
      expect(spike!.threshold_value).toBe(12.5);
      expect(detections).toHaveLength(1);
    });

    it('does not fire on a +11% CPA rise', () => {
      // Last CPA = 100/9 ≈ $11.11 (< $12.50).
      expect(detectAnomalies(makeSeries({ last: { conversions: 9 } }))).toEqual([]);
    });
  });

  describe('spend_anomaly (>30% variance vs 7-day baseline mean)', () => {
    it('fires on +35% spend', () => {
      const detections = detectAnomalies(makeSeries({ last: { spend: 135 } }));
      const spend = detections.find((d) => d.type === 'spend_anomaly');
      expect(spend).toBeDefined();
      expect(spend!.severity).toBe('high');
      expect(spend!.current_value).toBe(135);
      expect(spend!.threshold_value).toBe(130); // 1.3 × baseline mean 100
    });

    it('fires on −35% spend', () => {
      // CPA drops to $6.50 (not a spike); CVR unchanged.
      const detections = detectAnomalies(makeSeries({ last: { spend: 65 } }));
      expect(detections.map((d) => d.type)).toEqual(['spend_anomaly']);
    });

    it('does not fire on +10% spend', () => {
      expect(detectAnomalies(makeSeries({ last: { spend: 110 } }))).toEqual([]);
    });
  });

  describe('conversion_collapse (<70% of 7-day baseline mean CVR)', () => {
    it('fires when CVR falls to a third of baseline', () => {
      // Clicks triple with conversions flat: CVR 20% → 6.67% (< 14%).
      // CPA and spend are unchanged, so no other rule fires.
      const detections = detectAnomalies(makeSeries({ last: { clicks: 150 } }));
      const collapse = detections.find((d) => d.type === 'conversion_collapse');
      expect(collapse).toBeDefined();
      expect(collapse!.severity).toBe('high');
      expect(collapse!.threshold_value).toBe(14); // 0.7 × baseline CVR 20%
      expect(detections).toHaveLength(1);
    });

    it('does not fire on a 20% CVR drop', () => {
      // CVR 16% > 14%; CPA 100/8 = $12.50 is not > $12.50.
      expect(detectAnomalies(makeSeries({ last: { conversions: 8 } }))).toEqual([]);
    });
  });

  describe('zero-baseline guards', () => {
    it('produces no alerts (and no NaN/Infinity) when every baseline mean is 0', () => {
      const series = makeSeries({
        baseline: { impressions: 0, clicks: 0, ctr: 0, spend: 0, conversions: 0 },
        last: { impressions: 1000, clicks: 50, ctr: 5, spend: 100, conversions: 10 },
      });
      const detections = detectAnomalies(series);
      expect(detections).toEqual([]);
    });

    it('returns [] when the series is shorter than baseline + 1', () => {
      expect(detectAnomalies(makeSeries({}).slice(0, 7))).toEqual([]);
    });
  });
});

describe('scanCampaignsForAnomalies (DB integration)', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterEach(async () => {
    await resetTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  async function createActiveCampaign(name: string) {
    return Campaign.create({
      name,
      industry: 'tech',
      owner: new Types.ObjectId(),
      status: 'active',
    });
  }

  it('creates a ctr_drop anomaly and an audit-log entry, and dedupes on rescan', async () => {
    const campaign = await createActiveCampaign('CTR Drop Campaign');
    // Last-day CTR = 10/10000 = 0.1% — far below any synthetic baseline.
    const doc = { ...campaign.toObject(), impressions: 10000, clicks: 10 };

    const first = await scanCampaignsForAnomalies([doc]);
    expect(first.created).toBeGreaterThanOrEqual(1);
    expect(first.anomalies.some((a) => a.type === 'ctr_drop')).toBe(true);

    const stored = await Anomaly.find({ campaign_id: campaign._id.toString(), type: 'ctr_drop' }).lean();
    expect(stored).toHaveLength(1);
    expect(stored[0].status).toBe('active');

    // Spec §3.6 action: audit log entry for the detection.
    const audit = await TeamAuditLog.findOne({
      campaign_id: campaign._id.toString(),
      action: 'anomaly_detected',
      field: 'ctr_drop',
    }).lean();
    expect(audit).not.toBeNull();
    expect(audit!.new_value).toContain('CTR');

    // Second scan: the active anomaly dedupes, nothing new is created.
    const second = await scanCampaignsForAnomalies([doc]);
    expect(second.created).toBe(0);
    expect(await Anomaly.countDocuments({ campaign_id: campaign._id.toString(), type: 'ctr_drop' })).toBe(1);
  });

  it('auto-pauses on a critical bot_traffic anomaly and audit-logs the pause', async () => {
    const campaign = await createActiveCampaign('Bot Campaign');
    // clicks > impressions → bot_traffic (critical).
    const doc = { ...campaign.toObject(), impressions: 100, clicks: 500 };

    const result = await scanCampaignsForAnomalies([doc]);
    expect(result.anomalies.some((a) => a.type === 'bot_traffic' && a.severity === 'critical')).toBe(true);

    const updated = await Campaign.findById(campaign._id).lean();
    expect(updated!.status).toBe('paused');

    const pauseAudit = await TeamAuditLog.findOne({
      campaign_id: campaign._id.toString(),
      action: 'auto_pause',
      field: 'status',
    }).lean();
    expect(pauseAudit).not.toBeNull();
    expect(pauseAudit!.old_value).toBe('active');
    expect(pauseAudit!.new_value).toBe('paused');
  });

  it('enforces one active anomaly per campaign+type via the unique index', async () => {
    await Anomaly.ensureIndexes();
    const base = { campaign_id: 'race-campaign', type: 'ctr_drop' as const };

    await Anomaly.create({ ...base, status: 'active' });
    // A concurrent scan losing the check-then-create race hits 11000.
    await expect(Anomaly.create({ ...base, status: 'active' })).rejects.toMatchObject({ code: 11000 });
    // Resolved anomalies are outside the partial index — no conflict.
    await Anomaly.create({ ...base, status: 'resolved' });
    expect(await Anomaly.countDocuments(base)).toBe(2);
  });
});
