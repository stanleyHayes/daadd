/**
 * Per-country configuration.
 *
 * The regulatory advisory is explicit: do not hardcode Ghanaian assumptions
 * (currency, VAT rate, the regulators) throughout the code, because "there is no
 * single African DAADD licence" — each country is its own framework. Ghana is
 * the only entry today, but everything that would otherwise be a magic constant
 * (GHS, 20% VAT) reads from here, so a second country is a config addition
 * rather than a grep-and-replace across the codebase.
 *
 * VAT note: Ghana's effective rate on VAT-able supplies is 20% from 1 Jan 2026
 * (15% VAT + 2.5% NHIL + 2.5% GETFund), per the advisory.
 */

export interface CountryConfig {
  code: string;
  name: string;
  currency: string;
  currency_symbol: string;
  /** Effective tax rate on VAT-able supplies, as a fraction (0.20 = 20%). */
  vat_rate: number;
  /** For the eventual regulatory matrix; informational today. */
  regulators: {
    data_protection: string;
    payments: string;
    tax: string;
    gaming: string;
  };
}

const COUNTRIES: Record<string, CountryConfig> = {
  GH: {
    code: 'GH',
    name: 'Ghana',
    currency: 'GHS',
    currency_symbol: 'GH₵',
    vat_rate: 0.2,
    regulators: {
      data_protection: 'Data Protection Commission (DPC)',
      payments: 'Bank of Ghana (BoG)',
      tax: 'Ghana Revenue Authority (GRA)',
      gaming: 'Gaming Commission of Ghana',
    },
  },
};

/** The country DAADD operates in by default, overridable per deployment. */
export const DEFAULT_COUNTRY = process.env.DEFAULT_COUNTRY || 'GH';

export function countryConfig(code: string = DEFAULT_COUNTRY): CountryConfig {
  return COUNTRIES[code] ?? COUNTRIES[DEFAULT_COUNTRY];
}

export function isSupportedCountry(code: string): boolean {
  return code in COUNTRIES;
}

export function supportedCountries(): CountryConfig[] {
  return Object.values(COUNTRIES);
}
