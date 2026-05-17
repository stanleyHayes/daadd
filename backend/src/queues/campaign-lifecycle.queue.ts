import { Queue, Worker } from 'bull';
import Redis from 'ioredis';
import { container } from 'tsyringe';
import { Logger } from '../utils/logger';
import { TOKENS } from '../repositories/tokens';
import { ICampaignRepository } from '../repositories/campaign.repository';
import { CampaignStatus } from '../entities/campaign.entity';

const logger = new Logger('CampaignLifecycleQueue');

export interface CampaignLifecycleJob {
  campaignId: string;
  reason: 'budget_exhausted' | 'end_date_passed';
}

let queue: Queue<CampaignLifecycleJob> | null = null;

export function createCampaignLifecycleQueue(): Queue<CampaignLifecycleJob> {
  if (queue) {
    return queue;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380';
  queue = new Queue('campaign-lifecycle', {
    settings: {
      lockDuration: 30000, // 30 seconds
      lockRenewTime: 15000, // 15 seconds
      maxStalledCount: 2,
      stalledInterval: 5000,
      maxRetriesPerJob: 3,
      retryProcessDelay: 5000,
    },
    createClient: (type) => new Redis(redisUrl),
  });

  // Process jobs: 5 at a time, repeat every 5 minutes
  queue.process(5, async (job) => {
    try {
      const campaignRepository = container.resolve<ICampaignRepository>(TOKENS.CampaignRepository);
      const campaign = await campaignRepository.findById(job.data.campaignId);

      if (!campaign) {
        logger.warn(`Campaign ${job.data.campaignId} not found`);
        return;
      }

      // Skip if already completed or paused
      if (campaign.status === CampaignStatus.COMPLETED || campaign.status === CampaignStatus.PAUSED) {
        return;
      }

      // Pause the campaign
      await campaignRepository.update(campaign.id, {
        status: job.data.reason === 'budget_exhausted' ? CampaignStatus.COMPLETED : CampaignStatus.PAUSED,
        updated_at: new Date(),
      });

      const reason = job.data.reason === 'budget_exhausted' ? 'Budget exhausted' : 'End date passed';
      logger.info(`Campaign ${campaign.id} (${campaign.name}) marked as ${campaign.status} — ${reason}`);

      // Dispatch webhook if configured
      const webhookService = container.resolve(require('../services/webhook.service').WebhookService);
      await webhookService.dispatch(
        job.data.reason === 'budget_exhausted' ? 'campaign.completed' : 'campaign.paused',
        campaign.id,
        {
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          reason,
          timestamp: new Date().toISOString(),
        },
      );
    } catch (error) {
      logger.error(`Error processing campaign lifecycle job:`, error);
      throw error;
    }
  });

  // Cron-style repeat: every 5 minutes
  queue.add({} as any, {
    repeat: { cron: '*/5 * * * *' }, // Every 5 minutes
    removeOnComplete: true,
  });

  logger.info('Campaign lifecycle queue initialized');
  return queue;
}

export function getCampaignLifecycleQueue(): Queue<CampaignLifecycleJob> {
  if (!queue) {
    throw new Error('Campaign lifecycle queue not initialized');
  }
  return queue;
}

export async function checkCampaignLifecycles(): Promise<void> {
  try {
    const campaignRepository = container.resolve<ICampaignRepository>(TOKENS.CampaignRepository);
    const queue = getCampaignLifecycleQueue();

    // Get all active campaigns
    const campaigns = await campaignRepository.findAll();
    const activeCampaigns = campaigns.filter((c) => c.status === CampaignStatus.ACTIVE);

    const now = new Date();

    for (const campaign of activeCampaigns) {
      let reason: 'budget_exhausted' | 'end_date_passed' | null = null;

      // Check budget exhausted
      if (campaign.budget_spent >= campaign.budget_total) {
        reason = 'budget_exhausted';
      }

      // Check end date passed
      if (campaign.end_date && campaign.end_date < now) {
        reason = 'end_date_passed';
      }

      if (reason) {
        // Queue the job
        await queue.add({ campaignId: campaign.id, reason }, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
        });
        logger.info(`Queued lifecycle check for campaign ${campaign.id}: ${reason}`);
      }
    }
  } catch (error) {
    logger.error('Error checking campaign lifecycles:', error);
  }
}
