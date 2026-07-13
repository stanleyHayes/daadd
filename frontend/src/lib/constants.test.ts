import { describe, it, expect } from 'vitest';
import { INDUSTRIES, INDUSTRY_COLOR_MAP, CAMPAIGN_STATUSES, ANOMALY_SEVERITY_CONFIG } from './constants';

describe('INDUSTRIES', () => {
  it('has unique values and labels for every entry', () => {
    const values = INDUSTRIES.map((i) => i.value);
    expect(new Set(values).size).toBe(values.length);
    for (const industry of INDUSTRIES) {
      expect(industry.label).toBeTruthy();
      expect(industry.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(industry.icon).toBeTruthy();
    }
  });

  it('INDUSTRY_COLOR_MAP covers every industry value', () => {
    for (const industry of INDUSTRIES) {
      expect(INDUSTRY_COLOR_MAP[industry.value]).toBeDefined();
    }
  });
});

describe('CAMPAIGN_STATUSES', () => {
  it('contains the expected lifecycle statuses', () => {
    expect(CAMPAIGN_STATUSES.map((s) => s.value)).toEqual([
      'draft',
      'active',
      'paused',
      'completed',
      'suspended',
    ]);
  });
});

describe('ANOMALY_SEVERITY_CONFIG', () => {
  it('defines a color and label for every severity level', () => {
    expect(Object.keys(ANOMALY_SEVERITY_CONFIG).sort()).toEqual(
      ['low', 'medium', 'high', 'critical'].sort()
    );
    for (const config of Object.values(ANOMALY_SEVERITY_CONFIG)) {
      expect(config.color).toBeTruthy();
      expect(config.label).toBeTruthy();
    }
  });
});
