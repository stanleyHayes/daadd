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

### Phase 2 — Merchant verification + real fraud detection 🚧

Launch gate per the readiness doc.

| # | Item | Status |
| --- | --- | --- |
| 2.1 | Merchant KYC + status machine (verified / pending / restricted / suspended) | ✅ |
| 2.2 | Gate features on verification status | ✅ |
| 2.3 | Real fraud detection on real events (replaces synthetic anomaly detection) | ⬜ |

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

**Still open in Phase 2:** 2.3 — anomaly detection is still synthetic; it needs to run
on real redemption/ad events before launch.

### Phase 3 — Discount transfer + referral + multiplier engine ⬜

Low regulatory risk, high engagement, no payments needed.

| # | Item | Status |
| --- | --- | --- |
| 3.1 | User-to-user discount transfer (vouchers; tokens stay non-transferable) | ⬜ |
| 3.2 | Referral system with *activated* referrals (invitee must become real) | ⬜ |
| 3.3 | Configurable multiplier rules engine (replaces hardcoded tiers) | ⬜ |

### Phase 4 — Payment abstraction over a licensed PSP ⛔

Blocked on decisions: which PSP, and Ghanaian counsel signing off the settlement
structure. Enabling layer for all commerce.

### Phase 5 — Online commerce → buyer protection ⬜ (depends on Phase 4)

Products, orders (12-state machine), payments via PSP webhook, disputes,
evidence, refunds, auto-release.

### Phase 6 — Creator / influencer network ⬜

New product line. Post-MVP, but design the attribution plumbing
(creator → ad → consumer → QR → purchase) into event tracking now.

### Phase 7 — Operational launch-readiness ⬜

Runs in parallel; a hard gate before any public launch. Load testing, tested
backups + DR, production monitoring + alerting.

---

## Decisions needed (owner: product/founder)

| Decision | Blocks | Notes |
| --- | --- | --- |
| Which licensed Ghanaian PSP? | Phase 4, all of commerce | Settlement structure needs a Ghanaian fintech lawyer's sign-off — the regulatory doc says so twice |
| Confirm tokens stay non-cashable | Phase 1.5, Token Terms | `TOKEN_VALUE=0.05` is dollar-denominated today; the framing must not read as withdrawable money |
| Pilot scope: thin Accra pilot vs full vision | Phase 5 onward | Advisor argues hard for ~100 Accra merchants first |
| Creator-network timing | Phase 6 | Post-MVP, but attribution plumbing designed in now |

---

## Changelog

Newest first. One line per landed increment, with the commit.

- Phase 2.1–2.2 (merchant verification) — KYC model with masked settlement/ID, verification status machine, merchant gate on the redemption-confirm money path, admin review queue, merchant dashboard panel. Backend + frontend + 21 tests, six locales. (2.3 fraud detection still open.)
- Phase 1 (compliance foundations) — consent, data export, erasure, per-country config, token-policy invariant, sensitive-read audit log. Backend + frontend + 18 tests, six locales.
