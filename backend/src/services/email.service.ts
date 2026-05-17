import { Resend } from 'resend';
import { injectable, inject } from 'tsyringe';
import { Logger } from '../utils/logger';

/** Configuration for email service */
interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  appUrl: string;
}

/** Email service for sending transactional emails via Resend */
@injectable()
export class EmailService {
  private resend: Resend;
  private config: EmailConfig;
  private logger = new Logger('EmailService');

  constructor(
    @inject('config') config: any,
  ) {
    this.config = {
      apiKey: config.RESEND_API_KEY || '',
      fromEmail: config.FROM_EMAIL || 'noreply@fonad.local',
      appUrl: config.FRONTEND_URL || 'http://localhost:3000',
    };
    this.resend = new Resend(this.config.apiKey);
  }

  /** Send OTP verification email */
  async sendOTP(to: string, otp: string, userName?: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.config.fromEmail,
        to,
        subject: 'Your FonAd Verification Code',
        html: this.renderOTPEmail(otp, userName),
      });
      this.logger.info(`OTP email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${to}:`, error);
      throw error;
    }
  }

  /** Send anomaly alert email to advertiser */
  async sendAnomalyAlert(
    to: string,
    campaignName: string,
    anomalies: Array<{ type: string; message: string }>,
  ): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.config.fromEmail,
        to,
        subject: `⚠️ Campaign Alert: ${campaignName}`,
        html: this.renderAnomalyAlertEmail(campaignName, anomalies),
      });
      this.logger.info(`Anomaly alert sent to ${to} for campaign ${campaignName}`);
    } catch (error) {
      this.logger.error(
        `Failed to send anomaly alert to ${to}:`,
        error,
      );
      throw error;
    }
  }

  /** Send team invitation email */
  async sendTeamInvite(
    to: string,
    inviterName: string,
    role: string,
    inviteToken: string,
  ): Promise<void> {
    try {
      const inviteUrl = `${this.config.appUrl}/team/invite/${inviteToken}`;
      await this.resend.emails.send({
        from: this.config.fromEmail,
        to,
        subject: `You're invited to FonAd - ${role}`,
        html: this.renderTeamInviteEmail(inviterName, role, inviteUrl),
      });
      this.logger.info(`Team invite sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send team invite to ${to}:`, error);
      throw error;
    }
  }

  /** Send budget threshold alert email */
  async sendBudgetAlert(
    to: string,
    campaignName: string,
    threshold: number,
    spent: number,
    budget: number,
  ): Promise<void> {
    try {
      const percentSpent = Math.round((spent / budget) * 100);
      await this.resend.emails.send({
        from: this.config.fromEmail,
        to,
        subject: `📊 Budget Alert: ${campaignName} is ${percentSpent}% spent`,
        html: this.renderBudgetAlertEmail(
          campaignName,
          threshold,
          percentSpent,
          spent,
          budget,
        ),
      });
      this.logger.info(
        `Budget alert sent to ${to} for campaign ${campaignName} (${percentSpent}%)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send budget alert to ${to}:`,
        error,
      );
      throw error;
    }
  }

  /** Send password reset email */
  async sendPasswordReset(to: string, resetToken: string): Promise<void> {
    try {
      const resetUrl = `${this.config.appUrl}/auth/reset-password/${resetToken}`;
      await this.resend.emails.send({
        from: this.config.fromEmail,
        to,
        subject: 'Reset Your FonAd Password',
        html: this.renderPasswordResetEmail(resetUrl),
      });
      this.logger.info(`Password reset email sent to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${to}:`,
        error,
      );
      throw error;
    }
  }

  // Email template renderers

  private renderOTPEmail(otp: string, userName?: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; }
            .otp-code { font-size: 48px; font-weight: bold; color: #667eea; text-align: center; letter-spacing: 8px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">FonAd</h1>
              <p style="margin: 10px 0 0 0;">Your verification code is below</p>
            </div>
            <div class="content">
              ${userName ? `<p>Hi ${userName},</p>` : '<p>Hi,</p>'}
              <p>Your verification code is:</p>
              <div class="otp-code">${otp}</div>
              <p style="color: #666; font-size: 14px;">This code expires in 10 minutes. Do not share it with anyone.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} FonAd. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private renderAnomalyAlertEmail(
    campaignName: string,
    anomalies: Array<{ type: string; message: string }>,
  ): string {
    const anomalyList = anomalies
      .map((a) => `<li><strong>${a.type}:</strong> ${a.message}</li>`)
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .alert { background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; }
            .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Campaign Alert: ${campaignName}</h2>
            <div class="alert">
              <h3 style="margin-top: 0; color: #dc2626;">Anomalies Detected</h3>
              <ul>${anomalyList}</ul>
            </div>
            <p>We recommend reviewing this campaign and taking corrective action.</p>
            <a href="${this.config.appUrl}/dashboard/campaigns" class="button">View Campaign</a>
          </div>
        </body>
      </html>
    `;
  }

  private renderTeamInviteEmail(
    inviterName: string,
    role: string,
    inviteUrl: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>You're invited to FonAd!</h2>
            <p>${inviterName} has invited you to join their FonAd team as a <strong>${role}</strong>.</p>
            <p>Click the button below to accept the invitation:</p>
            <a href="${inviteUrl}" class="button">Accept Invitation</a>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">If you didn't expect this invitation, you can ignore this email.</p>
          </div>
        </body>
      </html>
    `;
  }

  private renderBudgetAlertEmail(
    campaignName: string,
    threshold: number,
    percentSpent: number,
    spent: number,
    budget: number,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .progress-bar { background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden; margin: 20px 0; }
            .progress-fill { background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; width: ${percentSpent}%; }
            .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Budget Alert: ${campaignName}</h2>
            <p>Your campaign has reached <strong>${percentSpent}%</strong> of its budget.</p>
            <p>
              <strong>Spent:</strong> ${spent.toFixed(2)}<br/>
              <strong>Budget:</strong> ${budget.toFixed(2)}
            </p>
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
            <p style="color: #666;">Remaining budget: ${(budget - spent).toFixed(2)}</p>
            <a href="${this.config.appUrl}/dashboard/campaigns" class="button">Manage Campaign</a>
          </div>
        </body>
      </html>
    `;
  }

  private renderPasswordResetEmail(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your FonAd password. Click the button below to create a new password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">This link expires in 24 hours. If you didn't request this, you can ignore this email.</p>
          </div>
        </body>
      </html>
    `;
  }
}
