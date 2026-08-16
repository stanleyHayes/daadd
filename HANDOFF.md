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

## Phase 5 — commerce UI (the big remaining piece)

Backend is complete (`routes/products.ts`, `routes/orders.ts`, models, tests). Build
the clients. **No new backend needed for the core flows.**

### 5a. Web (advertiser/admin dashboard) — `frontend/`
1. **Merchant product management** — hook `useProducts` (GET `/products/mine`, POST
   `/products`, PATCH/DELETE `/products/:id`); page to list/create/edit/delete
   products (price entered in GH₵, sent as `price_minor` = ₵×100). Nav entry gated
   to merchants (mirror `admin-merchants` wiring).
2. **Merchant order queue** — hook (GET `/orders?role=merchant`), page listing
   incoming orders with action buttons that POST the lifecycle endpoints
   (`/accept`, `/prepare`, `/ship`, `/deliver`). Show the `history` timeline.
3. **Admin dispute console** — list orders with `status=disputed` (add a
   `?status=` filter to `GET /orders` for admins — small backend add), show the
   dispute reason/evidence, POST `/orders/:id/resolve` with `refunded`/`released`.

### 5b. Mobile (consumer app) — `mobile/`
4. **Storefront** — browse `GET /products` (public), product detail, "Buy".
5. **Checkout** — POST `/orders` (items + contact), then POST `/orders/:id/pay`.
   When `requires_payment` is true, open `authorization_url` (Paystack) in a
   WebView/browser; the return URL hits the existing web `BillingCallbackPage`
   pattern — add a **mobile deep-link callback** (`daadd://payments/callback?reference=`)
   that calls `GET /payments/verify/:reference`.
6. **Order tracking** — `GET /orders?role=buyer`, order detail with the `history`
   timeline; buttons for `/confirm` (release), `/cancel`, `/dispute` (with evidence
   upload — reuse the existing image-upload used by reviews/chat).
7. i18n for all of the above (6 locales, both apps).

### 5c. Phase 5 backend follow-ups (smaller, do before real launch)
- **Stock reservation.** Today stock is only *validated* at order create
  (`routes/orders.ts`), never decremented. Decide: decrement at `paid`
  (in `applyPaymentEffect` for `order_payment`) and restore on cancel/refund, or a
  reservation model. Currently oversell is possible.
- **VAT.** `config/countries.ts` has `vat_rate` (0.2) but it is applied nowhere.
  Decide whether order totals are VAT-inclusive/exclusive and apply it in
  `routes/orders.ts` order-total math; surface a tax line on the order.
- **Unpaid-order expiry.** Orders can sit in `payment_pending` forever. Add a sweep
  (mirror `utils/order-sweep.ts`) that expires `created`/`payment_pending` orders
  past a TTL → `expired`.
- **Merchant settlement/payout.** `completed` orders imply money is due to the
  merchant, but nothing pays them out. This needs Paystack **Transfers/Subaccounts**
  wired to `MerchantVerification` settlement details — **gated on the legal sign-off**.
  Until then, `completed` just records that settlement is due.
- **Multi-merchant carts.** Orders are single-merchant by design; a cart spanning
  merchants must split into one order per merchant.
- **Evidence upload.** Dispute `evidence` is an array of URLs; wire it to the
  existing upload service (`services/storage.service.ts`) on the client side.
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

A hard gate before public launch. Mostly ops, some code:
- **Readiness endpoint.** There is `/health` (`app.ts`) that reports DB state. Add a
  deeper `/health/ready` that pings Mongo and any critical dependency and returns
  503 when not ready (for the load balancer).
- **Error alerting.** `services/mailer.ts` exists (Resend). Add an alert on
  unhandled errors / repeated 5xx / failed payment webhooks (the webhook currently
  logs and 200s — see `routes/payments.ts`). Wire the anomaly/fraud scans' failures
  to an alert too.
- **Structured logging.** `morgan('combined')` is on; consider a structured logger
  (pino) with request ids for production debugging.
- **Load testing.** Add a `k6`/`artillery` script hitting the hot paths (ad serve,
  redemption qr→confirm, order pay). Document expected throughput.
- **Backups + DR.** Document + verify MongoDB Atlas backups and a tested restore
  runbook. (Ops task, not code — write the runbook in `docs/`.)
- **Monitoring.** Wire the host (Render) metrics + uptime checks on `/health`.

---

## Not-roadmap but important

- **⚠️ Credentials rotation (still open).** `credentials.txt` was exposed in public
  git history (commits `702a9c7`, `149e278`); the file is untracked now but the keys
  are still live. Rotate MongoDB Atlas, Cloudinary, Resend, JWT/QR secrets, and any
  OAuth secrets, then set them fresh in the Render/host env. This needs the owner's
  hands in the external dashboards.
- **Webhook rate-limit lane.** The Paystack webhook shares the global 200/min-per-IP
  limiter (`app.ts`); give it its own lane before high volume.
