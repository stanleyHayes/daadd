import { describe, it, expect } from 'vitest';
import {
  cn,
  formatCurrency,
  formatPercentage,
  formatNumber,
  formatRelativeTime,
  getInitials,
  truncate,
} from './utils';

describe('formatCurrency', () => {
  it('returns $0 for null, undefined and NaN', () => {
    expect(formatCurrency(null)).toBe('$0');
    expect(formatCurrency(undefined)).toBe('$0');
    expect(formatCurrency(NaN)).toBe('$0');
  });

  it('formats zero and negative values', () => {
    expect(formatCurrency(0)).toBe('$0');
    expect(formatCurrency(-25)).toBe('-$25');
  });

  it('rounds to at most 2 decimals and groups thousands', () => {
    expect(formatCurrency(1234.567)).toBe('$1,234.57');
    expect(formatCurrency(1234.5)).toBe('$1,234.5');
  });

  it('respects the currency parameter', () => {
    expect(formatCurrency(100, 'EUR')).toBe('€100');
    expect(formatCurrency(100, 'GBP')).toBe('£100');
  });
});

describe('formatPercentage', () => {
  it('returns 0% for null, undefined and NaN', () => {
    expect(formatPercentage(null)).toBe('0%');
    expect(formatPercentage(undefined)).toBe('0%');
    expect(formatPercentage(NaN)).toBe('0%');
  });

  it('defaults to 1 decimal', () => {
    expect(formatPercentage(12.345)).toBe('12.3%');
    expect(formatPercentage(0)).toBe('0.0%');
  });

  it('respects the decimals parameter', () => {
    expect(formatPercentage(12.3456, 2)).toBe('12.35%');
    expect(formatPercentage(50, 0)).toBe('50%');
  });

  it('handles negative values', () => {
    expect(formatPercentage(-5.5)).toBe('-5.5%');
  });
});

describe('formatNumber', () => {
  it('returns 0 for null, undefined and NaN', () => {
    expect(formatNumber(null)).toBe('0');
    expect(formatNumber(undefined)).toBe('0');
    expect(formatNumber(NaN)).toBe('0');
  });

  it('compacts millions', () => {
    expect(formatNumber(1_000_000)).toBe('1.0M');
    expect(formatNumber(2_500_000)).toBe('2.5M');
  });

  it('compacts thousands', () => {
    expect(formatNumber(1_000)).toBe('1.0K');
    expect(formatNumber(999_999)).toBe('1000.0K');
  });

  it('uses locale grouping below 1000', () => {
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(0)).toBe('0');
  });

  it('does not compact negative values', () => {
    expect(formatNumber(-1500)).toBe('-1,500');
  });
});

describe('formatRelativeTime', () => {
  it('handles seconds, minutes, hours, days, months and years ago', () => {
    const now = Date.now();
    expect(formatRelativeTime(new Date(now - 10 * 1000))).toBe('less than a minute ago');
    expect(formatRelativeTime(new Date(now - 5 * 60 * 1000))).toBe('5 minutes ago');
    expect(formatRelativeTime(new Date(now - 3 * 60 * 60 * 1000))).toBe('about 3 hours ago');
    expect(formatRelativeTime(new Date(now - 3 * 24 * 60 * 60 * 1000))).toBe('3 days ago');
    expect(formatRelativeTime(new Date(now - 45 * 24 * 60 * 60 * 1000))).toBe('about 2 months ago');
    expect(formatRelativeTime(new Date(now - 400 * 24 * 60 * 60 * 1000))).toBe('about 1 year ago');
  });

  it('accepts ISO strings', () => {
    const iso = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    expect(formatRelativeTime(iso)).toBe('2 minutes ago');
  });
});

describe('getInitials', () => {
  it('returns one initial for a single name', () => {
    expect(getInitials('Alice')).toBe('A');
  });

  it('returns two initials for two names', () => {
    expect(getInitials('Alice Smith')).toBe('AS');
  });

  it('truncates three or more names to two initials', () => {
    expect(getInitials('Alice Bob Carol')).toBe('AB');
  });

  it('uppercases lowercase input', () => {
    expect(getInitials('alice smith')).toBe('AS');
  });

  it('returns empty string for empty input', () => {
    expect(getInitials('')).toBe('');
  });
});

describe('truncate', () => {
  it('leaves short strings unchanged', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('appends ellipsis when exceeding length', () => {
    expect(truncate('hello world', 5)).toBe('hello...');
  });
});

describe('cn', () => {
  it('merges class strings', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('drops falsy values', () => {
    expect(cn('px-2', false, null, undefined, '', 'py-1')).toBe('px-2 py-1');
  });

  it('resolves tailwind conflicts via tailwind-merge', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});
