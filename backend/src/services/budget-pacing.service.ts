import { container, inject, injectable } from 'tsyringe';
import { createClient } from 'redis';
import { Campaign } from '../entities/campaign.entity';
import { EmailService } from './email.service';
import { NotificationService } from './notification.service';
import { TOKENS } from '../repositories/tokens';
import type { ICampaignRepository } from '../repositories/campaign.repository';

@injectable()
export class BudgetPacingService {
  private redisClient: ReturnType<typeof createClient> | null = null;

  constructor(
    @inject(TOKENS.CampaignRepository) private readonly campaigns: ICampaignRepository,
    @inject(TOKENS.EmailService) private readonly emailService: EmailService,
    private readonly notificationService: NotificationService
  ) {
    this.initRedis();
  }

  private initRedis(): void {
    const redisUrl = process.env.REDIS_QUEUE_URL || 'redis://localhost:6380';
    try {
      this.redisClient = createClient({ url: redisUrl });
      this.redisClient.connect().catch(() => {
        this.redisClient = null;
      });
    } catch {
      this.redisClient = null;
    }
  }

  async checkBudgetThresholds(campaignId: string): Promise<void> {
    const campaign = await this.campaigns.findById(campaignId);
    if (!campaign) return;

    const percentage = (campaign.budget_spent / campaign.budget_total) * 100;

    const thresholds = [75, 90, 100];
    for (const threshold of thresholds) {
      if (percentage >= threshold) {
        await this.alertIfNeeded(campaign, threshold);
      }
    }
  }

  private async alertIfNeeded(campaign: Campaign, threshold: number): Promise<void> {
    const key = `budget_alert:${campaign.id}:${threshold}`;

    // Check if alert was already sent for this threshold
    if (this.redisClient) {
      try {
        const alreadySent = await this.redisClient.get(key);
        if (alreadySent) return;
      } catch {
        // Ignore Redis errors
      }
    }

    const user = await container.resolve<any>(TOKENS.UserRepository).findById(campaign.advertiser_id);
    if (!user || !user.email) return;

    try {
      // Send email alert
      await this.emailService.sendBudgetAlert(
        user.email,
        campaign.name,
        threshold,
        campaign.budget_spent,
        campaign.budget_total,
      );

      // Create in-app notification
      await this.notificationService.create(
        campaign.advertiser_id,
        'budget.threshold',
        `Budget Alert: ${threshold}%`,
        `Your campaign "${campaign.name}" has reached ${threshold}% of its budget.`,
        { campaign_id: campaign.id, threshold }
      );

      // Mark alert as sent in Redis (24 hour TTL)
      if (this.redisClient) {
        try {
          await this.redisClient.setEx(key, 24 * 60 * 60, '1');
        } catch {
          // Ignore Redis errors
        }
      }
    } catch {
      // Non-fatal: alerts are best-effort
    }
  }
}

export const budgetPacingService = new Proxy({} as BudgetPacingService, {
  get(_, prop) {
    const inst = container.resolve(BudgetPacingService);
    const value = Reflect.get(inst, prop);
    return typeof value === 'function' ? value.bind(inst) : value;
  },
});
