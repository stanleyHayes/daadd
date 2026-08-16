# HANDOFF — remaining work

This is a precise, self-contained task list for another agent to finish the
DAADD build. Read it alongside [AGENT_PLAN.md](AGENT_PLAN.md) (the phase tracker)
and [docs/PLANNING_FROM_ADVISOR_DOCS.md](docs/PLANNING_FROM_ADVISOR_DOCS.md) (the
*why*). Phases 1–4 are **done**; Phase 5 **backend** is done; the items below are
what's left.

## Ground rules (do not violate)

- **Tokens are non-cashable, non-transferable, non-tradable.** They are a closed
  reward, kept below Ghana e-money classification. Never add a `/withdraw`,
  `/cashout`, `/tokens/transfer`, `/tokens/sell` route —
  `src/__tests__/token-policy.test.ts` scans route sources and will fail the build.
- **DAADD never custodies money.** The PSP (Paystack) holds funds. Real money is
  **integer pesewas** in the `Payment`/`Order` models; the token ledger (`Reward`,
  dollars) is a separate thing. Never mix them.
- **Payments are inert until `PAYSTACK_SECRET_KEY` is set** (endpoints 503). Go-live
  also needs the **Ghanaian settlement-structure legal sign-off** (still open).
- **Verify before you build.** Grep for what exists — many patterns are already
  established. Match the surrounding code's conventions.
- **Every change:** `npm run typecheck` (backend), `npx tsc --noEmit` (frontend +
  mobile), `npx jest --runInBand` (backend, currently **298 green**), 6 locales via
  each app's `scripts/gen-locales.cjs`, then commit on a branch → merge → push.

## Conventions cheat-sheet (reuse these)

- Backend route: `src/routes/<name>.ts` (default-export Router) → register in
  `src/routes/index.ts`. Model: `src/models/<Name>.ts` → export from `models/index.ts`.
- Response envelope: `success()` / `paginated()` from `utils/response.ts`.
- Auth: `authMiddleware`, `requireRole(...)` from `middleware/auth.ts`.
- Merchant gate (verified sellers): `utils/merchant-gate.ts`.
- Atomic status transition + 11000-dupe idempotency: see `routes/orders.ts`
  `doTransition`, `models/WebhookEvent.ts`, `routes/rewards.ts:475`.
- Payments: create a charge with `utils/payment-flow.ts::createCharge({ purpose,
  amount_minor, metadata })`; add an effect in `applyPaymentEffect`; refund with
  `refundPayment`. New purposes go in `models/Payment.ts::PaymentPurpose`.
- Frontend hook: `src/hooks/use<Feature>.ts` (react-query + `lib/api`). Page:
  `src/pages/dashboard/<Name>Page.tsx`, route in `App.tsx`, nav in
  `lib/navigation.ts` + `lib/rbac.ts` + `components/layout/Sidebar.tsx` icon.
- i18n: edit `src/i18n/locales/en.json` (source of truth) + add the 5 translations
  to `scripts/web-translations.json` (mobile: `scripts/mobile-translations.json`),
  then run `node scripts/gen-locales.cjs`. It fails on placeholder drift.
- Tests mint users directly (`User.create` + `generateToken`) to avoid the auth
  rate limiter — see `__tests__/orders.test.ts`.

---

## Phase 5 — commerce

Backend **and** UI are **done**: `frontend/src/hooks/useCommerce.ts` +
`MerchantProductsPage`, `MerchantOrdersPage`, `AdminDisputesPage` (web);
`mobile/src/hooks/useCommerce.ts` + `shop.tsx`, `product/[id].tsx`, `orders.tsx`,
`order/[id].tsx` (mobile). Both wired into nav/routes with 6 locales.

**Mobile checkout note:** it opens the Paystack `authorization_url` via
`Linking.openURL` and relies on the **webhook** to reconcile the order server-side
(the order screen re-fetches). A cleaner UX would add a mobile deep-link callback
(`daadd://…?reference=`) → `GET /payments/verify/:reference`; optional.

### Phase 5 functional follow-ups

**Done** (built after the UI): **stock reservation** (decrement at `paid` via
`reserveStock`, restore on cancel/refund via `restoreStock` — `utils/payment-flow.ts`);
**unpaid-order expiry** (`expireStaleOrders` in `utils/order-sweep.ts`); and
**VAT + order windows as config** — `utils/commerce-settings.ts` (env default →
`PlatformSetting` override → sanitised), applied to order totals (`tax_minor`), with
an admin editor at `/dashboard/admin/commerce` and API `/admin/commerce-settings`.
VAT-inclusive vs exclusive, VAT rate, auto-release days, and payment TTL are all
admin flags now — no code change needed to tune them. Tests in `orders.test.ts` +
`commerce-settings.test.ts`.

Also done: **multi-merchant carts** — `POST /orders` splits a cart spanning
merchants into one order per merchant (each independently escrowed/paid), returning
`{ orders: [...] }`. See `orders.test.ts`.

**Merchant settlement — done (self-service subaccounts).** Merchants connect their
own bank/mobile-money on the merchant dashboard: list banks → resolve/verify the
account (PSP returns the holder name) → create a Paystack **subaccount**
(`MerchantSettlementPanel` + `/merchants/settlement/*`). Order charges pass the
merchant's `subaccount_code` so Paystack **splits** the payment — the merchant's
share settles to them directly and DAADD never holds the merchant's funds. Platform
cut is `PLATFORM_FEE_PERCENT`. Tests in `merchant-settlement.test.ts`.

**Remaining — a tuning decision + the standing legal gate:**
- **Escrow vs. split timing.** Split-at-charge settles the merchant on Paystack's
  schedule, which softens the buyer-protection *hold* (refunds still work). To keep
  a true hold, connect subaccounts with a **deferred/manual settlement schedule** and
  trigger settlement on order completion — a Paystack settings + small code change.
- **Live keys after the legal sign-off** — unchanged; everything above is inert
  until `PAYSTACK_SECRET_KEY` (live) is set.
- **Evidence upload.** Dispute `evidence` is an array of URLs (http(s) only); wire it
  to the existing upload service (`services/storage.service.ts`) on the client side.
- **Refund idempotency hardening.** `refundPayment` marks the `Payment` refunded and
  calls Paystack once; add a `Refund`/ledger record if you need partial refunds or
  an audit trail beyond `Payment.status`.

---

## Phase 6 — Creator / influencer network (post-MVP; plumbing now)

Per the advisor docs, the product is **post-MVP**, but the **attribution plumbing**
(`creator → ad → consumer → QR → purchase`) should be designed into event tracking
now so history exists when the feature ships. Suggested minimal build:
- A `Creator` profile (or a `role`/flag on `User`) and a `creator_code` (mirror the
  referral-code generator in `utils/referral.ts`).
- Stamp a `creator_id` onto the event trail: `AdView`, `Redemption`, and `Order`
  already have the shape to carry an attribution ref — add an optional
  `attributed_creator` and capture it from a creator link/QR at the entry points
  (`routes/attribution.ts`, `routes/redemption.ts` QR issue, `routes/orders.ts`).
- A read-only attribution rollup endpoint (creator → views/redemptions/orders).
- No payouts yet (same settlement gate as Phase 5). Keep it measurement-only.

See `AGENT_PLAN.md` "Decisions needed" — creator-network timing is a founder call.

---

## Phase 7 — Operational launch-readiness (independent; no legal gate)

**Code-side is done:** `GET /health/ready` (deep readiness, `app.ts`),
`services/alerting.ts` (throttled ops alerts, wired into the payment-webhook error
path + scheduled-scan failures), `backend/loadtest/smoke.js` (k6), and
`docs/DR_RUNBOOK.md` (backup/restore runbook + pre-launch checklist).

**Remaining — operator tasks (not code), all in `docs/DR_RUNBOOK.md`:**
- Enable + **drill** MongoDB Atlas backups (record RTO/RPO).
- Point Render's health check at `/health/ready`; add uptime monitors on both
  `/health` and `/health/ready`.
- Set `OPS_ALERT_EMAIL` (+ verify a test alert lands).
- Run the k6 load test for a baseline; extend `smoke.js` to authed hot paths
  (redemption qr→confirm, order pay) — see `__tests__` for request shapes.

**Optional code follow-up:** structured logging (pino + request ids) instead of
`morgan('combined')` for better production debugging.

---

## Not-roadmap but important

- **⚠️ Credentials rotation (still open).** `credentials.txt` was exposed in public
  git history (commits `702a9c7`, `149e278`); the file is untracked now but the keys
  are still live. Rotate MongoDB Atlas, Cloudinary, Resend, JWT/QR secrets, and any
  OAuth secrets, then set them fresh in the Render/host env. This needs the owner's
  hands in the external dashboards.
- **Webhook rate-limit lane.** The Paystack webhook shares the global 200/min-per-IP
  limiter (`app.ts`); give it its own lane before high volume.
