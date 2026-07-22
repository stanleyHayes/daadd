import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Campaign, DeviceEvent, User } from '../models';
import {
  campaignTotals,
  campaignTimeSeries,
  campaignTrend,
} from '../services/campaign-metrics.service';

let mongo: MongoMemoryServer;
let campaignId: string;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  const owner = await User.create({
    name: 'Advertiser',
    email: 'metrics-owner@example.com',
    password_hash: 'x',
    role: 'advertiser',
  });
  const campaign = await Campaign.create({
    name: 'Metrics test',
    owner: owner._id,
    industry: 'technology',
    budget_total: 1000,
    budget_spent: 250,
    start_date: new Date(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'active',
  });
  campaignId = String(campaign._id);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  await DeviceEvent.deleteMany({});
});

async function record(type: string, count: number, daysAgo = 0, device = 'phone') {
  const created_at = new Date();
  created_at.setDate(created_at.getDate() - daysAgo);
  await DeviceEvent.insertMany(
    Array.from({ length: count }, () => ({
      user_id: new mongoose.Types.ObjectId(),
      device_id: 'd1',
      device_type: device,
      campaign_id: new mongoose.Types.ObjectId(campaignId),
      event_type: type,
      created_at,
    }))
  );
}

describe('campaign totals', () => {
  it('reports zero and hasData=false for a campaign with no events', async () => {
    const totals = await campaignTotals(campaignId);
    expect(totals).toMatchObject({ impressions: 0, clicks: 0, conversions: 0, ctr: 0 });
    expect(totals.hasData).toBe(false);
  });

  it('counts real recorded events', async () => {
    await record('impression', 200);
    await record('click', 10);
    await record('conversion', 2);

    const totals = await campaignTotals(campaignId);
    expect(totals.impressions).toBe(200);
    expect(totals.clicks).toBe(10);
    expect(totals.conversions).toBe(2);
    expect(totals.ctr).toBe(5);
    expect(totals.hasData).toBe(true);
  });

  it('is stable across calls', async () => {
    // The endpoint this replaces returned Math.random(), so an advertiser's
    // chart changed on every refresh. Same inputs must give the same answer.
    await record('impression', 37);
    const a = await campaignTotals(campaignId);
    const b = await campaignTotals(campaignId);
    expect(a).toEqual(b);
  });

  it('survives an invalid campaign id', async () => {
    const totals = await campaignTotals('not-an-id');
    expect(totals.hasData).toBe(false);
  });
});

describe('time series', () => {
  it('returns one bucket per day even when nothing happened', async () => {
    const series = await campaignTimeSeries(campaignId, 7);
    expect(series).toHaveLength(7);
    expect(series.every((p) => p.impressions === 0)).toBe(true);
  });

  it('puts events in the right day', async () => {
    await record('impression', 5, 0);
    await record('impression', 3, 2);

    const series = await campaignTimeSeries(campaignId, 7);
    const today = series[series.length - 1];
    const twoDaysAgo = series[series.length - 3];

    expect(today.impressions).toBe(5);
    expect(twoDaysAgo.impressions).toBe(3);
  });

  it('ignores events outside the window', async () => {
    await record('impression', 99, 30);
    const series = await campaignTimeSeries(campaignId, 7);
    expect(series.reduce((sum, p) => sum + p.impressions, 0)).toBe(0);
  });
});

describe('trend', () => {
  it('returns null with no prior window rather than inventing a number', async () => {
    await record('impression', 10, 1);
    const trend = await campaignTrend(campaignId, 7);
    expect(trend.impressions).toBeNull();
  });

  it('computes a real percentage change', async () => {
    await record('impression', 10, 1); // current window
    await record('impression', 5, 10); // preceding window
    const trend = await campaignTrend(campaignId, 7);
    expect(trend.impressions).toBe(100);
  });
});

describe('no synthetic data left in analytics', () => {
  it('the analytics route no longer calls Math.random()', () => {
    // Campaign performance was previously generated: Math.random() time series,
    // impressions derived from budget_total * 2.5, a hard-coded 6.8% CTR and
    // fixed "+4%" trend indicators. Guard against any of it coming back.
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'routes', 'analytics.ts'),
      'utf8'
    );
    expect(source).not.toContain('Math.random()');
    expect(source).not.toContain('avgCTR: 6.8');
  });
});
