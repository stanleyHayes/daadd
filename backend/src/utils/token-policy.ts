/**
 * The token-policy invariant.
 *
 * The regulatory advisory's single most load-bearing rule for the reward system:
 * the moment DAADD tokens look like stored monetary value the user can withdraw
 * or transfer for money, they risk being classed as electronic money under
 * Ghana's Payment Systems and Services Act — which would require a Bank of Ghana
 * licence DAADD does not have and should not need at launch.
 *
 * So tokens are a **closed-loop promotional reward**, not a currency:
 *
 *   - cannot be withdrawn or exchanged for cash;
 *   - cannot be sold or traded;
 *   - cannot be transferred to another user for consideration;
 *   - cannot be transferred between users at all, initially (discounts, which
 *     are vouchers, may be — that is a separate feature);
 *   - exist only to unlock discounts/benefits inside DAADD and participating
 *     merchant programmes.
 *
 * `TOKEN_VALUE` (in reward-economics.ts) exists only to price the *cost* of a
 * campaign's reward pool to the advertiser. It must never be surfaced to a
 * consumer as "your tokens are worth $X you can cash out". Tokens unlock a
 * benefit; they are not a balance to withdraw.
 *
 * This file has no runtime behaviour on its own — the invariant is enforced by
 * the *absence* of any withdraw/transfer endpoint, and guarded by
 * token-policy.test.ts, which fails if such a route ever appears. It is here so
 * the rule is written down where an engineer adding a "cash out my tokens"
 * feature will find it first.
 */

export const TOKEN_POLICY = {
  /** Tokens can never be converted to withdrawable cash. */
  cashable: false,
  /** Tokens can never be transferred between users. */
  transferable: false,
  /** Tokens can never be sold or traded. */
  tradable: false,
} as const;

/**
 * Route/handler patterns that would break the invariant. The policy test scans
 * the route sources for these; add to the list rather than removing it if the
 * product ever legitimately changes (which would need legal sign-off first).
 */
export const FORBIDDEN_TOKEN_OPERATIONS = [
  'token withdrawal',
  'cash out tokens',
  'tokens to cash',
  'sell tokens',
  'trade tokens',
  'transfer tokens to',
] as const;
