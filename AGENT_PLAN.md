# AGENT_PLAN.md

The execution tracker for DAADD's build. Where [PLANNING_FROM_ADVISOR_DOCS.md](docs/PLANNING_FROM_ADVISOR_DOCS.md)
is the *why* (synthesis of the six advisor documents), this is the *what next*
and *what's done*. Update it as work lands.

**Status legend:** ✅ done · 🚧 in progress · ⬜ not started · ⛔ blocked on a decision

---

## The rule that shapes everything

> Do not make DAADD the custodian of customer money at launch. DAADD manages the
> transaction; a licensed payment institution handles the money.

No feature below may hold customer funds, cash out tokens, or hardcode one PSP.

---

## Phases

Sequenced so each unblocks the next, and the free/legal-gating work runs before
the work that needs an external decision.

### Phase 1 — Compliance foundations 🚧

Cheap, no external dependency, unblocks the legal side of launch. The Ghana DPC
programme is the biggest genuinely-missing area.

| # | Item | Status |
| --- | --- | --- |
| 1.1 | Consent model + grant/withdraw API, recorded at registration | ✅ |
| 1.2 | Data export (a user can request a copy of their data) | ✅ |
| 1.3 | Data deletion / erasure (anonymise PII, preserve append-only ledgers) | ✅ |
| 1.4 | Per-country config (currency, VAT, regulators — Ghana as the one entry) | ✅ |
| 1.5 | Token-policy invariant: tokens never cash out, never transfer; test-guarded | ✅ |
| 1.6 | Extend audit logging to reads of sensitive personal data | ✅ |

Backend: `Consent`, `DataAccessLog` models; `config/countries.ts`;
`utils/token-policy.ts`; `routes/privacy.ts` (consent get/set, data export,
erasure, audited admin read). Consent recorded at registration (opt-in).
Frontend: `usePrivacy` hook, `PrivacyPanel` (Settings → Privacy & Data),
marketing-consent checkbox at signup. Tests: privacy (12), token-policy (6).
Six locales complete.

**Follow-up within Phase 1:** data-retention job (age out data with no lawful
basis) — modelled but no scheduler yet; erasure and export are the user-driven
rights, retention is the automatic side.

### Phase 2 — Merchant verification + real fraud detection ✅

Launch gate per the readiness doc.

| # | Item | Status |
| --- | --- | --- |
| 2.1 | Merchant KYC + status machine (verified / pending / restricted / suspended) | ✅ |
| 2.2 | Gate features on verification status | ✅ |
| 2.3 | Real fraud detection on real events (replaces synthetic anomaly detection) | ✅ |

Backend: `MerchantVerification` model (masked KYC — full ID/settlement numbers are
never stored, only last-4; DAADD is not the money custodian); `utils/merchant-gate.ts`
(only the `merchant` role is gated; `can_transact` iff `verified`); `routes/merchants.ts`
(merchant self-service submit/status, admin review queue + set-status). The
money-touching **redemption confirm** handler now refuses an unverified merchant.
Admin review mirrors the advertiser-approval flow (gated on the `admin` role).
Frontend: `useMerchantVerification` hook, `MerchantVerificationPanel` on the merchant
dashboard (status banner + KYC form), `AdminMerchantsPage` review queue. Six locales.
Tests: merchant-verification (21) — gate, masking, routes, and the confirm gate as an
integration test; existing redemption confirm tests now seed a verified merchant.

**2.3 — real fraud detection (done).** Two parts. (a) The campaign anomaly detector
no longer fabricates data: `buildMetricSeries` now aggregates real `DeviceEvent`
impressions/clicks/conversions by day (no per-day spend source, so the spend/CPA
rules stay dormant); a campaign with no events raises nothing. (b) New money-path
fraud detector on real completed redemptions + the reward ledger: `FraudSignal`
model + `fraud-detection.service.ts` with four rules — redemption velocity (customer),
merchant surge, customer↔merchant collusion, reward farming — each raising a
review-only signal (never an automatic punishment). Admin `/fraud` routes (scan,
queue, resolve) + `AdminFraudPage`; the 5-minute scheduled scan now runs fraud
detection alongside the anomaly scan. Thresholds are env-configurable. Six locales.
Tests: fraud-detection (13); the anomaly integration tests now seed real events.

### Phase 3 — Discount transfer + referral + multiplier engine ✅

Low regulatory risk, high engagement, no payments needed.

| # | Item | Status |
| --- | --- | --- |
| 3.1 | User-to-user discount transfer (vouchers; tokens stay non-transferable) | ✅ |
| 3.2 | Referral system with *activated* referrals (invitee must become real) | ✅ |
| 3.3 | Configurable multiplier rules engine (replaces hardcoded tiers) | ✅ |

**3.1 — discount-voucher transfer (done).** The compliant way to give value to
another user without moving tokens. `DiscountVoucher` model + state machine
(issued → claimed → redeemed, plus expired/revoked). **Issue** debits the sender's
own token ledger and mints a *separate* fixed discount (never a token transfer;
the recipient is never credited tokens — machine-checked). **Claim** transfers
ownership atomically. **Redeem** is done by a verified merchant reusing the same
`merchant-gate` as token redemption; the discount is capped at the bill and no
ledger write happens at redeem (the value was pre-funded at issue). Unused vouchers
**lapse and refund the issuer** via the scheduled sweep (value conservation).
Routes stay clear of the token-policy tripwire. Frontend: a full mobile vouchers
screen (send / claim / list, plus merchant redeem). Six locales (mobile). Tests:
vouchers (12) — issue/claim/redeem lifecycle, the mint-not-transfer compliance
check, discount cap, authz, and end-to-end value conservation on expiry.

**3.2 — activated referrals (done).** `User` gains `referral_code` (unique, sparse),
`referred_by`, and a `referral_activated` guard. A code is assigned at registration
(and lazily for older accounts); signup captures an optional `referral_code` →
`referred_by` (unknown codes ignored, self-referral impossible at signup). The
referrer is paid **only on the invitee's first completed redemption** — the
activation hook in the redemption-confirm path flips the guard atomically (once,
even under concurrency) and **mints** a fresh `referral_reward` to the referrer;
the invitee's balance is never touched, so tokens stay non-transferable. Anti-abuse:
gated on a real (costly-to-fake) redemption, self-referral guard, once-only flag,
and the existing `reward_farming` fraud signal already watches accrual. `GET
/referrals/me` returns the code, share link, and activation counts (no invitee PII).
Frontend: "Refer a friend" Settings tab (web) + a mobile referral screen with native
share. Six locales (web + mobile). Tests: referrals (9), including an end-to-end
proof that a real first redemption pays the referrer exactly once.

**3.3 — configurable multiplier engine (done).** The streak tiers and VIP
multiplier were hardcoded constants; they're now an admin-editable config stored
in `PlatformSetting` (`utils/multiplier-rules.ts`, mirroring the VIP-criteria
pattern). `streak.ts`'s `multiplierForStreak`/`advanceStreak` take injectable
tiers; the reward-claim path and the streak/VIP read endpoints resolve live rules.
**Safety:** every value is clamped to a hard, non-configurable ceiling (streak ×5,
VIP ×3, effective product ×10) both on save *and* re-clamped at grant time, so a
mistyped or malicious config can't mint inflated tokens — proven by a
defence-in-depth test that poisons the store directly and asserts the claim is
still capped. Admin `GET/PUT /admin/multiplier-rules`; editor added to
`AdminLoyaltyPage`. Six locales. Tests: multiplier-rules (14).

### Phase 4 — Payment abstraction over a licensed PSP 🚧 (code complete; go-live gated on legal sign-off)

PSP chosen: **Paystack** (Ghana, GHS). The payment layer is built and tested; the
one remaining gate before charging real money is the **Ghanaian settlement-structure
legal sign-off** (the advisor doc flags it twice) plus swapping in live keys.

**What's built.** A PSP-abstracted, non-custody payment layer — DAADD records
intent/status, the PSP holds funds. `services/payment.service.ts` defines a
`PaymentProvider` interface (Paystack the first adapter, `PSP_PROVIDER` selects it,
mirroring `storage.service.ts`). `Payment` model in **integer pesewas** (never the
token ledger); `WebhookEvent` model for exactly-once. `utils/payment-flow.ts` holds
the shared create/reconcile/effect logic. Routes: `POST /payments/initialize`,
`GET /payments/verify/:reference` (browser callback), `GET /payments`, and an
**unauthenticated, HMAC-SHA512-verified** `POST /payments/webhook`. First concrete
use: advertiser billing — the old `billing.ts` stub (which flipped `billing_ready`
on a client claim) is replaced; the flag now flips **only** from a verified payment.

**Security posture.** Raw body captured for the webhook HMAC; signature checked in
constant time; exactly-once via the `WebhookEvent` unique index *and* an atomic
`pending→paid` transition; the webhook **re-verifies** with the provider before
granting value; amount/currency must match what was requested or nothing unlocks;
payments are inert (503) until `PAYSTACK_SECRET_KEY` is set, and production fails
fast if enabled without it. Frontend: `BillingCallbackPage` reconciles on return.
Tests: payments (11) — provider signature/parse, initialize/verify/webhook,
idempotent redelivery, amount-tampering rejection, and money/token separation.

**Known hardening follow-up:** the webhook shares the global 200/min-per-IP rate
limiter; give it its own lane before high volume.

### Phase 5 — Online commerce → buyer protection 🚧 (backend complete + tested; UI remaining)

Full 12-state marketplace with escrow-style buyer protection. **Backend done and
tested; the web + mobile commerce UI is the remaining work (see Handoff below).**

**What's built (backend).** `Product` model + CRUD routes (verified-merchant-gated
selling, public catalogue). `Order` model with the **12-state machine** in
`utils/order-state.ts` (created → payment_pending → paid → accepted → preparing →
shipped → delivered → completed, plus disputed / refunded / cancelled / expired).
Every transition is validated against the machine, applied **atomically** (a
`{status: from}` precondition guards concurrency), and appended to an auditable
`history`. Payment integration reuses Phase 4: `order_payment` charges via Paystack;
`applyPaymentEffect` moves the order into escrow (`paid`) on verified payment. Buyer
protection: cancel/dispute-refund **refund through the PSP** (`refundPayment`);
`delivered → completed` auto-releases via a scheduled sweep (`utils/order-sweep.ts`)
if the buyer doesn't confirm. Disputes carry a reason + evidence URLs; an admin
resolves (refund the buyer or release to the merchant). All money is integer
pesewas — never the token ledger. Routes: `/products/*`, `/orders/*` (create, pay,
list, get, accept/prepare/ship/deliver/confirm/cancel/dispute/resolve). Tests:
orders (11) — state machine, product authz, full happy path, wrong-actor/out-of-order
rejection, refund on cancel, dispute + admin resolution, auto-release.

### Phase 6 — Creator / influencer network ⬜

New product line. Post-MVP, but design the attribution plumbing
(creator → ad → consumer → QR → purchase) into event tracking now.

### Phase 7 — Operational launch-readiness 🚧 (code essentials done; ops tasks remain)

A hard gate before public launch. **Code-side done:** `GET /health/ready` (deep
readiness — pings Mongo, 503 when unhealthy, for the load balancer);
`services/alerting.ts` (throttled ops alerts, wired into the payment-webhook error
path and scheduled-scan failures); a k6 load script (`backend/loadtest/smoke.js`);
and a DR runbook + pre-launch checklist (`docs/DR_RUNBOOK.md`). Tests: ops-readiness (3).
**Ops tasks remain (operator, not code):** enable + drill Atlas backups, point
Render's health check at `/health/ready`, set `OPS_ALERT_EMAIL` + an uptime monitor,
run the load test for a baseline. See `docs/DR_RUNBOOK.md`.

---

## Decisions needed (owner: product/founder)

| Decision | Blocks | Notes |
| --- | --- | --- |
| ~~Which licensed Ghanaian PSP?~~ **Paystack** ✅ | ~~Phase 4~~ done | Payment layer built + tested. **Still blocked for go-live:** the settlement-structure legal sign-off (regulatory doc flags it twice) + live keys |
| Confirm tokens stay non-cashable | Phase 1.5, Token Terms | `TOKEN_VALUE=0.05` is dollar-denominated today; the framing must not read as withdrawable money |
| Pilot scope: thin Accra pilot vs full vision | Phase 5 onward | Advisor argues hard for ~100 Accra merchants first |
| Creator-network timing | Phase 6 | Post-MVP, but attribution plumbing designed in now |

---

## Changelog

Newest first. One line per landed increment, with the commit.

- Phase 7 (ops-readiness code essentials) — deep `/health/ready` endpoint, throttled ops alerting (`services/alerting.ts`) wired into payment-webhook + scan failures, k6 load script, DR runbook + pre-launch checklist. Backend + 3 tests. Operator ops tasks (backups drill, monitors) documented.
- Phase 5 (commerce backend) — Product + Order models, 12-state order machine (utils/order-state.ts), escrow via Phase-4 payments, PSP refunds on cancel/dispute, dispute+evidence+admin-resolution, auto-release sweep. Backend + 11 tests. **UI remaining — see HANDOFF.md.**
- Phase 4 (payment abstraction) — PSP-abstracted, non-custody payment layer with Paystack adapter; Payment (pesewas) + WebhookEvent models; signature-verified idempotent webhook; advertiser billing replaces the insecure stub (billing_ready only from a verified payment). Backend + frontend callback + 11 tests. Code complete; go-live gated on the settlement-structure legal sign-off + live keys.
- Phase 3.1 (discount-voucher transfer) — `DiscountVoucher` state machine; issue debits the sender + mints a separate discount (tokens never transferred), claim, verified-merchant redeem (reuses merchant-gate), expiry-refund sweep. Mobile vouchers screen. Backend + mobile + 12 tests, six locales. **Phase 3 complete.**
- Phase 3.2 (activated referrals) — referral codes + referred_by on User; referrer minted a fresh bonus only on the invitee's first completed redemption (once-only, tokens never transferred); `/referrals/me` stats; web Settings tab + mobile referral screen. Backend + web + mobile + 9 tests, six locales each.
- Phase 3.3 (configurable multiplier engine) — admin-editable streak tiers + VIP multiplier stored in PlatformSetting, replacing hardcoded constants; hard non-configurable ceilings clamped on save and re-clamped at grant time (defence-in-depth). Backend + admin editor + 14 tests, six locales.
- Phase 2.3 (real fraud detection) — de-synthesized the campaign anomaly series (now real DeviceEvent aggregation); new money-path FraudSignal detector (velocity / merchant surge / collusion / reward farming) with admin review routes, page, scheduled scan. Backend + frontend + 13 tests, six locales. Phase 2 complete.
- Phase 2.1–2.2 (merchant verification) — KYC model with masked settlement/ID, verification status machine, merchant gate on the redemption-confirm money path, admin review queue, merchant dashboard panel. Backend + frontend + 21 tests, six locales.
- Phase 1 (compliance foundations) — consent, data export, erasure, per-country config, token-policy invariant, sensitive-read audit log. Backend + frontend + 18 tests, six locales.
