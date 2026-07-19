/**
 * Lightweight mailer (no DI container).
 *
 * Uses Resend when RESEND_API_KEY is set; otherwise logs the email to the
 * console (dev mode) and resolves. Every exported function is guaranteed
 * to never throw — all errors are swallowed and logged, so callers can
 * fire-and-forget without affecting request handling.
 */
import { Resend } from 'resend';

const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const APP_NAME = 'SmartDeals';

let resendClient: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resendClient = new Resend(process.env.RESEND_API_KEY);
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailMessage): Promise<void> {
  try {
    if (!resendClient) {
      // Dev mode: no API key configured — log instead of sending.
      console.log(`[mailer:dev] to=${to} subject="${subject}"\n${html}`);
      return;
    }
    const { error } = await resendClient.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    if (error) {
      console.warn('[mailer] Resend error:', error);
    }
  } catch (err) {
    console.warn('[mailer] send failed (swallowed):', err);
  }
}

export function sendOtpEmail(to: string, code: string): Promise<void> {
  return sendEmail({
    to,
    subject: `Your ${APP_NAME} verification code`,
    html: `<p>Your verification code is:</p><h2 style="letter-spacing:4px">${code}</h2><p>This code expires in 5 minutes.</p>`,
  });
}

export function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  return sendEmail({
    to,
    subject: `Reset your ${APP_NAME} password`,
    html: `<p>Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour. If you did not request this, ignore this email.</p>`,
  });
}

export function sendTeamInviteEmail(to: string, inviterName: string, role: string): Promise<void> {
  return sendEmail({
    to,
    subject: `You've been invited to ${APP_NAME}`,
    html: `<p>${inviterName} invited you to collaborate on ${APP_NAME} as <strong>${role}</strong>.</p><p>Sign in or create an account to accept the invitation.</p>`,
  });
}

export function sendAnomalyAlertEmail(
  to: string,
  campaignName: string,
  anomalies: { type: string; severity: string; description: string }[]
): Promise<void> {
  const rows = anomalies
    .map(
      (a) =>
        `<tr><td style="padding:4px 8px">${a.type}</td><td style="padding:4px 8px">${a.severity}</td><td style="padding:4px 8px">${a.description}</td></tr>`
    )
    .join('');
  return sendEmail({
    to,
    subject: `[${APP_NAME}] Anomaly alert for "${campaignName}"`,
    html: `<p>Anomalies were detected on campaign <strong>${campaignName}</strong>:</p><table border="1" cellspacing="0" cellpadding="0"><thead><tr><th style="padding:4px 8px">Type</th><th style="padding:4px 8px">Severity</th><th style="padding:4px 8px">Description</th></tr></thead><tbody>${rows}</tbody></table>`,
  });
}
