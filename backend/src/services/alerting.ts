import { sendEmail } from './mailer';

/**
 * Operational alerting (Phase 7). Surfaces critical backend failures (payment
 * webhook errors, scheduled-scan failures, etc.) to an ops inbox so they aren't
 * only buried in logs. Throttled per-subject so a recurring failure can't storm
 * the inbox, and dev-safe (logs when no OPS_ALERT_EMAIL / mailer is configured).
 */
const THROTTLE_MS = parseInt(process.env.OPS_ALERT_THROTTLE_MS || '600000', 10); // 10 min
const lastSent = new Map<string, number>();

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'));
}

/** Reset the throttle (tests only). */
export function _resetAlertThrottle(): void {
  lastSent.clear();
}

/**
 * Send an ops alert. Returns true if it was dispatched, false if throttled.
 * Never throws — alerting must not break the path that triggered it.
 */
export async function alertOps(subject: string, detail: string): Promise<boolean> {
  const now = Date.now();
  const last = lastSent.get(subject) || 0;
  if (now - last < THROTTLE_MS) return false;
  lastSent.set(subject, now);

  const line = `[DAADD ops] ${subject}`;
  console.error(line, detail);

  const to = process.env.OPS_ALERT_EMAIL;
  if (to) {
    await sendEmail({
      to,
      subject: line,
      html: `<p><strong>${escapeHtml(subject)}</strong></p><pre>${escapeHtml(detail)}</pre>`,
    }).catch(() => {});
  }
  return true;
}
