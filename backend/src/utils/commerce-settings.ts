import { PlatformSetting } from '../models/PlatformSetting';
import { countryConfig, DEFAULT_COUNTRY } from '../config/countries';

/**
 * Administrator-configurable commerce settings (Phase 5), mirroring the
 * VIP-criteria / multiplier-rules pattern: an env-seeded default overridden by a
 * PlatformSetting row and re-sanitised on read. VAT and the order-lifecycle
 * windows are config, not code decisions.
 */
export const COMMERCE_SETTINGS_KEY = 'commerce_settings';

export interface CommerceSettings {
  /** VAT rate as a fraction (0.2 = 20%). */
  vat_rate: number;
  /** True when displayed prices already include VAT; false when VAT is added. */
  vat_inclusive: boolean;
  /** Days a delivered order waits before auto-completing (buyer protection). */
  auto_release_days: number;
  /** Minutes an unpaid order may sit before it expires. */
  payment_ttl_minutes: number;
}

function envNum(name: string, fallback: number): number {
  const v = parseFloat(process.env[name] || '');
  return Number.isFinite(v) ? v : fallback;
}

export const DEFAULT_COMMERCE_SETTINGS: CommerceSettings = {
  vat_rate: envNum('COMMERCE_VAT_RATE', countryConfig(DEFAULT_COUNTRY).vat_rate ?? 0.2),
  vat_inclusive: (process.env.COMMERCE_VAT_INCLUSIVE ?? 'true') !== 'false',
  auto_release_days: parseInt(process.env.ORDER_AUTO_RELEASE_DAYS || '7', 10),
  payment_ttl_minutes: parseInt(process.env.ORDER_PAYMENT_TTL_MINUTES || '60', 10),
};

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

/** Normalise + clamp untrusted settings to safe bounds. */
export function sanitizeCommerceSettings(input: Partial<CommerceSettings> | undefined | null): CommerceSettings {
  const d = DEFAULT_COMMERCE_SETTINGS;
  return {
    vat_rate: clamp(Number(input?.vat_rate ?? d.vat_rate), 0, 1),
    vat_inclusive: input?.vat_inclusive != null ? !!input.vat_inclusive : d.vat_inclusive,
    auto_release_days: Math.round(clamp(Number(input?.auto_release_days ?? d.auto_release_days), 1, 90)),
    payment_ttl_minutes: Math.round(clamp(Number(input?.payment_ttl_minutes ?? d.payment_ttl_minutes), 5, 10080)),
  };
}

/** Current settings, defaults-merged and re-sanitised. */
export async function getCommerceSettings(): Promise<CommerceSettings> {
  try {
    const row = await PlatformSetting.findOne({ key: COMMERCE_SETTINGS_KEY }).lean();
    return sanitizeCommerceSettings({ ...DEFAULT_COMMERCE_SETTINGS, ...((row?.value as object) || {}) });
  } catch {
    return DEFAULT_COMMERCE_SETTINGS;
  }
}

export interface OrderTotals {
  subtotal_minor: number;
  tax_minor: number;
  total_minor: number;
}

/**
 * Split a line-items subtotal into subtotal / VAT / total per the settings.
 * All values are integer minor units (pesewas).
 *
 * - inclusive: the item prices already contain VAT, so the total equals the
 *   subtotal and the VAT portion is extracted from it.
 * - exclusive: VAT is added on top, so the total is subtotal + VAT.
 */
export function computeOrderTotals(itemsSubtotalMinor: number, settings: CommerceSettings): OrderTotals {
  const rate = settings.vat_rate;
  if (rate <= 0) {
    return { subtotal_minor: itemsSubtotalMinor, tax_minor: 0, total_minor: itemsSubtotalMinor };
  }
  if (settings.vat_inclusive) {
    const tax = Math.round((itemsSubtotalMinor * rate) / (1 + rate));
    return { subtotal_minor: itemsSubtotalMinor - tax, tax_minor: tax, total_minor: itemsSubtotalMinor };
  }
  const tax = Math.round(itemsSubtotalMinor * rate);
  return { subtotal_minor: itemsSubtotalMinor, tax_minor: tax, total_minor: itemsSubtotalMinor + tax };
}
