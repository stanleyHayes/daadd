# DAADD — plan from the advisor documents

Synthesis of the six documents added on 22 July 2026, cross-referenced against
what is actually in the codebase today. This is a planning document, not a spec
to build from yet — several items need decisions or legal input before any code.

The documents:

| Document | What it is | How to treat it |
| --- | --- | --- |
| Recommendations | Line-by-line feedback on the current build (the "V2 enhancement" list) | **Mostly already built** — see §1 |
| Product Feature & Architecture Update | Expands DAADD from ads into commerce, disputes, discount transfer | The product roadmap — §3 |
| Regulatory & Licensing Concerns | Ghana regulatory analysis, gates the payment layer | **Hard constraints — read first**, §2 |
| Readiness Analysis | 8-layer launch-readiness checklist | The launch gate — §4 |
| Influencer Strategy | Creator network + go-to-market | A distinct product line + a GTM plan — §5, §6 |
| Recommendations.pdf | Same content as the Recommendations .docx | Duplicate |

---

## The one thing to internalise first

The advisor's single most important instruction, repeated across three of the
six documents:

> **Do not make DAADD the custodian of customer money at launch.** DAADD manages
> the commerce transaction; a licensed payment institution handles the money.

Everything in the commerce and payments roadmap below is shaped by that. It is
also good news: it means the largest unbuilt piece (payments) should be built as
a thin *abstraction over a licensed partner*, not as a wallet/ledger DAADD owns.

---

## 1. Recommendations doc — already built this session

The "V2 Product Enhancement Requirements" is the document the platform was built
against before these newer docs arrived. Verified present in the code today:

| Recommendation | Status |
| --- | --- |
| Enhanced advertiser analytics (ROAS, ROI, customers acquired, discounts issued/redeemed, profit) | ✅ Built — and now aggregated from **real events**, not synthetic |
| Merchant redemption v2 (outlet select, itemised entry, digital receipts) | ✅ Built |
| Customer spending analytics / purchase history | ✅ Built |
| Support Centre (the "clicking Support does nothing" complaint) | ✅ Fixed — real ticketing + desks |
| Dynamic reward allocation (discount-share config, not fixed rewards) | ✅ Built |
| Token calculator | ✅ Built |
| Campaign budget exhaustion (auto-pause, threshold alert, top-up) | ✅ Built |
| Loyalty (streaks, 5 leaderboards, VIP) | ✅ Built |
| Expectation/reality reviews with photo/video bonus + moderation | ✅ Built (web; mobile still posts JSON — see gaps) |
| Advertiser info on adverts (location, hours, category, logo, branches) | ✅ Built |
| Customer↔advertiser messaging (text, image, read receipts, notifications) | ✅ Built |
| Advert reward info (per-action tokens, campaign max, remaining budget) | ✅ Built |
| Merchant performance dashboard | ✅ Built |

**One new business idea** in the margins of this doc, not a feature request:
selling advertiser profit/behavioural reports as a premium service ("the money
is in the behavioural patterns"). Park as a monetisation idea; the data model
already supports it once real events flow.

**Residual gaps from this doc:** mobile review submission still posts JSON, so
photo/video upload from the phone isn't wired (web has it). Small, known.

---

## 2. Regulatory constraints — architectural, non-negotiable

These are design rules, not features. Most cost little now and a fortune to
retrofit. Ordered by how much they touch the code.

### 2.1 Tokens must stay a closed-loop reward, never money

The regulatory doc is emphatic: the moment a token looks like stored monetary
value (cashable, withdrawable, transferable for consideration), DAADD risks
needing a Bank of Ghana payments licence.

- **Current risk:** `TOKEN_VALUE = 0.05` and `Reward.amount` is stored in
  dollars. That's an internal accounting convenience, but the framing "1 token =
  $X you can cash out" is exactly the red flag. **Action:** keep tokens
  non-cashable and non-transferable in code and in the Token Terms; present them
  as "N tokens unlock a promotional benefit", never as a dollar balance the user
  can withdraw. This is mostly a **product-copy + terms** change plus a guard
  that no endpoint ever pays tokens out as cash.
- **Discounts** may be transferable between users (they're vouchers). **Tokens**
  must not be, initially. This directly shapes Feature 1 in §3.

### 2.2 No chance/randomness in rewards

Streaks, multipliers, leaderboards and VIP are all behaviour-based today, which
is the safe side of the line. **Rule going forward:** never add "pay for a
random chance to win tokens", spin-to-win, or lottery mechanics without a Gaming
Commission assessment. Worth a one-line comment in the reward engine.

### 2.3 Payment abstraction layer — never hardcode one PSP

When payments are built (§3, Phase 4+), they must go through an abstraction over
a **licensed** provider (Paystack, Flutterwave, Hubtel, a mobile-money provider,
etc.), swappable without touching commerce logic. There is **no payment code
today** — which is the ideal moment to get this shape right. DAADD owns order and
settlement *state*; the PSP owns the money.

### 2.4 Separate ledgers: money, tokens, discounts

The readiness and product docs both insist these are three distinct ledgers,
append-only, never `balance = balance + x`.

- **Today:** `Reward` is an append-only token ledger (good). There is **no money
  ledger and no discount ledger** because there's no money movement yet.
- **Action when commerce lands:** model `TokenTransaction`, a money ledger
  (customer payments, merchant settlements, commissions, refunds, fees), and a
  discount ledger as separate collections. Do not fold them into one balance
  table.

### 2.5 Data-protection programme (Ghana DPC)

This is the biggest genuinely-missing compliance area, and there is **no code for
it today**:

- **Consent management** — record what each user consented to (esp. "personalised
  offers and direct marketing"), with withdrawal. A `Consent` model + onboarding
  checkbox + a settings toggle.
- **Data export** — a user can request a copy of their data.
- **Data deletion / erasure** — a user can request deletion.
- **Data minimisation & retention** — retention windows per data type; a job that
  ages out what has no lawful reason to persist.
- **Access controls + audit logs** — RBAC exists and is strong; `TeamAuditLog`
  exists. Extend audit logging to reads of sensitive personal data.
- DPC **registration** is an operational task (GH¢120–1,800), not code.

### 2.6 AI automated-decision safeguards

The DPC gives users a right against decisions made solely by automated
processing. `AIRecommendation` exists; the rule is that a recommendation must
carry a **reason** and the user retains **choice** — never an unexplained
black box that determines an important outcome. Ensure the recommendation
payload always includes a human-readable reason (partly there already).

### 2.7 Merchant KYC / verification states

Advertiser approval exists; **merchant verification does not**. Before a merchant
can receive money or run major campaigns they need: business registration + owner
identity + address + settlement account + risk screening, and a status of
`verified | pending | restricted | suspended`. An unverified merchant must not
reach every feature. This is a **launch gate** per the readiness doc, and it's a
real build.

### 2.8 Country-specific configuration

Don't hardcode Ghana assumptions (VAT 20% from Jan 2026, currency GHS, regulator
rules) throughout. A per-country config object, even if Ghana is the only entry,
so a second country doesn't mean a rewrite. Cheap now.

### 2.9 Finance/tax model

Track, separately: merchant gross → discount → DAADD commission → payment fee →
merchant settlement; and DAADD revenue, VAT, refunds, fees, token expense. Falls
out of §2.4 if the ledgers are modelled correctly.

---

## 3. Product roadmap — the commerce expansion

From the Product Feature & Architecture Update. Its own phasing, re-ordered to
respect the regulatory gate and what's already built.

**Already built** (Phases 1–3 of that doc): auth, profiles, advertiser + merchant
accounts, ads, event tracking, tokens, QR redemption v2, streaks, leaderboard,
VIP, messaging. Referral system is **not** built.

Remaining, in build order:

### Phase A — Discount transfers + multiplier engine (no money, low regulatory risk)

- **User-to-user discount transfer** (`DiscountTransfer` model, transferable
  flag per promotion, PENDING/COMPLETED/REJECTED/EXPIRED/REVOKED states, immutable
  record). Tokens stay non-transferable (§2.1).
- **Referral system** with *activated* referrals — a referral only counts after
  the invitee does something economically real, to stop fake-account farming.
- **Multiplier as a configurable rules engine** — today's streak/VIP multipliers
  are hardcoded tiers. The doc wants visit-frequency + verified-spend + referral +
  engagement, each contributing, with a stored breakdown and a configurable max.
  Rebuild the multiplier as data-driven config.

### Phase B — Merchant verification + fraud basics (launch gate)

- Merchant KYC and status machine (§2.7).
- Basic fraud protection the readiness doc names: fake accounts, bot impressions,
  fake referrals, QR replay, token farming, review manipulation, discount abuse.
  Today anomaly detection is **synthetic** — this needs to become real detection
  on real events before launch.

### Phase C — Online commerce (needs the payment partner)

Everything here waits on §2.3. Models: `Product`, `Order` (12-state machine),
`OrderItem`, `Payment`, `Shipment`. The order state machine must reject invalid
transitions (can't COMPLETE before PAYMENT_CONFIRMED). Payment confirmation comes
from the PSP webhook, never the client.

### Phase D — Buyer protection

`Dispute`, `DisputeEvidence` (both sides upload), `Refund` (full/partial/none/
replacement), auto-release after a configurable protection window, dispute
workflow. Manual review first; AI-assisted flagging later.

### Cross-cutting (start now, benefit everything)

- **Event-driven analytics** the docs keep returning to: raw events → validation
  → storage → aggregation → analytics, never frontend-number-straight-to-
  dashboard. `DeviceEvent` + the new `campaign-metrics.service` are the beginning
  of this; extend the event vocabulary (ORDER_CREATED, PAYMENT_CONFIRMED, …) as
  commerce lands.
- **Notifications** for the new events (discount received, order shipped, token
  expiry, multiplier increase). Notification infra exists; add the triggers.

---

## 4. Launch-readiness gate (readiness doc)

The advisor's "when I would say Launch" checklist, marked against reality. **🟢 =
done, 🟡 = partial, 🔴 = not started.**

| Layer | Item | State |
| --- | --- | --- |
| Product | Consumer / merchant / advertiser / admin dashboards, QR, tokens, discounts, reviews, VIP | 🟢 mostly |
| Product | Referral system | 🔴 |
| Commerce | Catalogue, checkout, payment, orders, delivery, refunds, disputes | 🔴 (Phase C/D) |
| Financial | Token ledger | 🟢 · Money + discount ledgers 🔴 · Settlement/reconciliation 🔴 |
| Security | Auth, RBAC, rate-limiting, QR security, audit logs | 🟢 · Encryption-at-rest 🟡 · Fraud detection 🔴 (synthetic) · Backups/DR 🟡 |
| Legal | Company reg, tax reg, DPC compliance, payment structure, the 10 policy docs | 🔴 mostly — operational + legal, not code |
| Operations | Support 🟢 · Merchant onboarding/verification 🔴 · Dispute handling 🔴 · Reconciliation 🔴 |
| Market | Merchants signed, advertisers signed, pilot users, training | 🔴 — go-to-market, §6 |

**Also flagged as launch-blockers and not yet addressed:** load testing (1k → 100k
concurrent, esp. event ingestion), backup/restore actually tested, production
monitoring + alerting, disaster-recovery plan.

**The advisor's strongest strategic point:** launch **one country → one city →
controlled merchant network** (Accra, ~100 merchants, 1k users), not Africa-wide.
Prove the flywheel before multiplying operational complexity. The most important
metric is not downloads or impressions — it's **verified economic transactions
generated**.

---

## 5. Creator / influencer network (new product line)

The influencer doc proposes a genuinely new product surface, not a tweak: a
creator-brand marketplace inside DAADD. Its killer feature is attribution —
tying a creator's post to real merchant purchases, so a brand learns "this
creator generated GHS 45,000 in verified revenue," not just views.

**None of this exists today.** It's large. New models: `Creator` profile,
`CreatorCampaign`/opportunity, application state machine (applied → shortlisted →
accepted → completed → paid), contracts, content drafts + brand approval, a
DAADD Creator Score, creator tiers, and creator-attributed transactions.

**Sequencing recommendation:** this is post-MVP. The advisor's own launch
sequence puts creators at Stage 3, *after* infrastructure (Stage 1) and merchant/
brand supply (Stage 2). Build the core flywheel first; the creator network is an
accelerator once that loop works. But it depends on the attribution plumbing
(creator → ad → consumer → QR → purchase), which is worth keeping in mind when
building event tracking now so it isn't a rewrite later.

The advisor also reframes positioning away from "advertising monopoly" toward
"the network layer connecting African brands, creators, consumers and commerce" —
so existing loyalty apps and malls plug in rather than get displaced. That's
strategy, not code, but it argues for open/integratable APIs over a walled garden.

---

## 6. Go-to-market (not engineering)

The influencer doc closes by asking for a **DAADD Launch & Network-Effect
Blueprint** — 20 items covering the 90-day pre-launch, first 100 merchants / 50
brands / 500 creators / 10k users, referral economics, campus ambassadors,
competitive strategy vs Points Africa and Palace Mall, sales scripts, and the
KPIs that decide scale-or-stop.

This is a **separate business deliverable from the technical roadmap** and should
be owned outside engineering. The four-audience landing-page framing (consumer /
merchant / advertiser / creator, each with its own value proposition) is the one
piece that touches the marketing site we already have, and is cheap to add when
wanted.

---

## Recommended sequencing

Grouped by what unblocks what, respecting the regulatory gate:

1. **Compliance foundations (start now, cheap, unblocks launch-legal):** token
   non-cashable/non-transferable guards + Token Terms; consent model + data
   export/delete; per-country config; extend audit logging to sensitive reads.
2. **Merchant verification + real fraud detection (launch gate):** the KYC state
   machine and turning synthetic anomaly detection into real detection on real
   events.
3. **Discount transfer + referral + configurable multiplier engine (Phase A):**
   low regulatory risk, high engagement value, no payments needed.
4. **Payment abstraction over a licensed PSP** — the enabling layer for
   everything commerce. Needs the partner chosen and Ghanaian counsel's sign-off
   on the settlement structure *before* code.
5. **Online commerce → buyer protection (Phases C, D)** on top of that layer.
6. **Creator network (new product line)** once the core flywheel is proven.
7. **Operational launch-readiness** (load testing, backups tested, monitoring/DR)
   in parallel, before any public launch.

## Decisions needed from you before engineering starts

- **Payment partner** — which licensed Ghanaian PSP(s)? This choice gates all of
  commerce, and the settlement structure needs a Ghanaian fintech lawyer's sign-
  off (the regulatory doc says so explicitly, twice).
- **Token economics** — the current `TOKEN_VALUE = 0.05` and dollar-denominated
  rewards need a deliberate decision to stay non-cashable, and the Token Terms
  drafted to match.
- **Scope of the first cut** — the advisor argues hard for a *thin* pilot (Accra,
  ~100 merchants) over finishing the full commerce/creator vision first. Confirm
  we're building for that pilot, not the 20-chapter vision, before we pick up
  Phase C onward.
- **Creator network timing** — post-MVP per the advisor, but the attribution
  plumbing should be designed in now. Confirm that ordering.
