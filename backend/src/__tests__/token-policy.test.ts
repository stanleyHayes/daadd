import fs from 'fs';
import path from 'path';
import { TOKEN_POLICY, FORBIDDEN_TOKEN_OPERATIONS } from '../utils/token-policy';

/**
 * Guards the regulatory invariant: DAADD tokens are a closed-loop promotional
 * reward, never withdrawable or transferable money. Crossing that line risks an
 * electronic-money classification under Ghana's Payment Systems and Services Act.
 *
 * This scans the actual route sources for the shapes a cash-out or token-
 * transfer feature would take. If someone adds one, this fails and forces the
 * conversation (and the legal sign-off) before it can ship.
 */

const ROUTES_DIR = path.join(__dirname, '..', 'routes');

function readAllRoutes(): string {
  return fs
    .readdirSync(ROUTES_DIR)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => fs.readFileSync(path.join(ROUTES_DIR, f), 'utf8'))
    .join('\n')
    .toLowerCase();
}

describe('token policy', () => {
  it('declares tokens non-cashable and non-transferable', () => {
    expect(TOKEN_POLICY.cashable).toBe(false);
    expect(TOKEN_POLICY.transferable).toBe(false);
    expect(TOKEN_POLICY.tradable).toBe(false);
  });

  it('has no route that withdraws, cashes out, sells or transfers tokens', () => {
    const source = readAllRoutes();

    // Route path fragments that would expose a forbidden operation.
    const forbiddenPaths = [
      "'/withdraw'",
      "'/cashout'",
      "'/cash-out'",
      "'/tokens/transfer'",
      "'/tokens/sell'",
      "'/tokens/withdraw'",
    ];
    for (const fragment of forbiddenPaths) {
      expect(source).not.toContain(fragment.toLowerCase());
    }
  });

  it('lists the operations the guard is watching for', () => {
    // Sanity that the documented list is non-empty and stays in sync with intent.
    expect(FORBIDDEN_TOKEN_OPERATIONS.length).toBeGreaterThan(0);
    expect(FORBIDDEN_TOKEN_OPERATIONS).toContain('cash out tokens');
  });
});

describe('per-country config', () => {
  it('reads Ghana VAT and currency from config rather than magic constants', async () => {
    const { countryConfig } = await import('../config/countries');
    const gh = countryConfig('GH');
    expect(gh.currency).toBe('GHS');
    expect(gh.vat_rate).toBe(0.2); // 15% VAT + 2.5% NHIL + 2.5% GETFund, from Jan 2026
  });

  it('falls back to the default country for an unknown code', async () => {
    const { countryConfig, DEFAULT_COUNTRY } = await import('../config/countries');
    expect(countryConfig('ZZ').code).toBe(DEFAULT_COUNTRY);
  });
});
