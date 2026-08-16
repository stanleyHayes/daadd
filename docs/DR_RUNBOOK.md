# Disaster-recovery runbook (Phase 7)

Operational procedures to verify before public launch. This is a **checklist +
runbook**, not code — an operator with access to the hosting dashboards completes it.

## Backups (MongoDB Atlas)

DAADD's data lives in MongoDB Atlas; Atlas provides continuous/scheduled backups.

**Verify (do this now, then quarterly):**
1. Atlas → Cluster → **Backup**: confirm backups are **enabled** and the retention
   window is set (recommend ≥ 7 days snapshot + point-in-time recovery).
2. Confirm the backup **schedule** and that the most recent snapshot is recent.

**Test a restore (do this at least once before launch):**
1. Atlas → Backup → **Restore** a recent snapshot to a **new** cluster (never
   overwrite production during a drill).
2. Point a staging copy of the backend at the restored cluster
   (`MONGODB_URI=<restored>`), run `npm run --workspace backend build` + smoke
   test (`/health/ready` returns 200; a few reads succeed).
3. Record the **restore time** (RTO) and the snapshot age (RPO). Tear down the
   drill cluster.

## Application recovery (Render)

The backend runs on Render, the frontend on Vercel.

- **Redeploy / rollback:** Render → Service → **Manual Deploy / Rollback** to a
  known-good commit. Vercel → Deployments → **Promote** a previous build.
- **Env vars:** keep a secure copy of all required env vars (see
  `backend/.env.example`). A lost service can be recreated only if these are known.
  **Secrets must be rotated** first — see the credential-rotation note in
  [HANDOFF.md](../HANDOFF.md).
- **Health gating:** point Render's health check at `GET /health/ready` (503 when
  the DB is unreachable) so a broken instance is pulled from rotation.

## Monitoring + alerting

- **Uptime:** external uptime check on `GET /health` (liveness) and
  `GET /health/ready` (readiness), alerting on failure.
- **Errors:** critical backend failures (payment-webhook errors, scheduled-scan
  failures) email `OPS_ALERT_EMAIL` via `services/alerting.ts` (throttled). Set it.
- **Metrics:** enable Render's built-in CPU/memory/latency dashboards; add an
  alert on sustained high latency or error rate.
- **Payments:** watch for `Payment` rows stuck in `pending` and `Order` rows stuck
  in `payment_pending` — a sign webhooks aren't arriving. Reconcile via
  `GET /payments/verify/:reference`.

## Load testing

`k6 run -e BASE_URL=<url> backend/loadtest/smoke.js` (see that file to extend to
authed paths). Establish a baseline p95 latency and error rate before launch and
re-run after significant changes.

## Pre-launch checklist

- [ ] Atlas backups enabled + a restore drill completed (RTO/RPO recorded).
- [ ] Render health check points at `/health/ready`.
- [ ] `OPS_ALERT_EMAIL` set; a test alert received.
- [ ] Uptime monitor on `/health` + `/health/ready`.
- [ ] All exposed credentials rotated (see HANDOFF.md).
- [ ] Load test run; p95 + error-rate baseline acceptable.
- [ ] `PAYSTACK_SECRET_KEY` (live) set **only after** the settlement legal sign-off.
