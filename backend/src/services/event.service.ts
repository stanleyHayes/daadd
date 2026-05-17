import { container, inject, injectable } from 'tsyringe';
import { AdEvent, EventType } from '../entities/ad-event.entity';
import { Campaign } from '../entities/campaign.entity';
import { AppError } from '../middleware/error.middleware';
import { fatigueService } from './fatigue.service';
import { RewardService } from './reward.service';
import { BudgetPacingService } from './budget-pacing.service';
import { PaginationParams, PaginatedResult } from '../types';
import { getSkip } from '../utils/pagination';
import { TOKENS } from '../repositories/tokens';
import type { IAdEventRepository } from '../repositories/ad-event.repository';
import type { ICampaignRepository } from '../repositories/campaign.repository';

interface TrackEventData {
  event_type: EventType;
  campaign_id: string;
  ad_id?: string;
  user_id?: string;
  device_type?: string;
  device_id?: string;
  ip_address?: string;
  geo_lat?: number;
  geo_lng?: number;
  geo_city?: string;
  geo_country?: string;
  unified_user_id?: string;
  metadata?: Record<string, unknown>;
}

interface EventFilters {
  event_type?: EventType;
  start_date?: string;
  end_date?: string;
  device_type?: string;
}

const CPC_RATE = 0.5;
const CPA_RATE = 5.0;

@injectable()
export class EventService {
  constructor(
    @inject(TOKENS.AdEventRepository) private readonly events: IAdEventRepository,
    @inject(TOKENS.CampaignRepository) private readonly campaigns: ICampaignRepository
  ) {}

  private costFor(type: EventType): number {
    if (type === EventType.CLICK) return CPC_RATE;
    if (type === EventType.CONVERSION) return CPA_RATE;
    return 0;
  }

  async trackEvent(data: TrackEventData): Promise<AdEvent> {
    const campaign = await this.campaigns.findById(data.campaign_id);
    if (!campaign) throw new AppError('Campaign not found', 404, 'NOT_FOUND');

    if (data.user_id && data.ad_id && data.event_type === EventType.IMPRESSION) {
      const check = await fatigueService.checkFatigue(data.user_id, data.ad_id);
      if (check.isFatigued) data.metadata = { ...data.metadata, fatigued: true };
    }

    const saved = await this.events.create(data as Partial<AdEvent>);

    const cost = this.costFor(data.event_type);
    if (cost > 0) {
      await this.campaigns.incrementSpent(data.campaign_id, cost);
      // Check budget thresholds asynchronously (non-blocking)
      try {
        const budgetService = container.resolve(BudgetPacingService);
        budgetService.checkBudgetThresholds(data.campaign_id).catch(() => {
          /* non-fatal */
        });
      } catch {
        /* non-fatal */
      }
    }

    if (
      data.user_id &&
      (data.event_type === EventType.REWARD_CLAIM || data.event_type === EventType.AD_VIEW) &&
      Number(campaign.reward_value) > 0
    ) {
      try {
        const rewardService = container.resolve(RewardService);
        await rewardService.creditReward(
          data.user_id,
          data.campaign_id,
          saved.id,
          Number(campaign.reward_value)
        );
      } catch {
        /* non-fatal */
      }
    }

    return saved;
  }

  async batchTrack(events: TrackEventData[]): Promise<AdEvent[]> {
    const saved = await this.events.createMany(events as Partial<AdEvent>[]);

    const campaignCosts = new Map<string, number>();
    for (const e of events) {
      const cost = this.costFor(e.event_type);
      if (cost > 0) {
        campaignCosts.set(e.campaign_id, (campaignCosts.get(e.campaign_id) || 0) + cost);
      }
    }
    for (const [campaignId, total] of campaignCosts) {
      await this.campaigns.incrementSpent(campaignId, total);
      // Check budget thresholds asynchronously for each affected campaign
      try {
        const budgetService = container.resolve(BudgetPacingService);
        budgetService.checkBudgetThresholds(campaignId).catch(() => {
          /* non-fatal */
        });
      } catch {
        /* non-fatal */
      }
    }

    return saved;
  }

  async getEventsByCampaign(
    campaignId: string,
    filters: EventFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<AdEvent>> {
    const skip = getSkip(pagination);
    const { items, total } = await this.events.listByCampaign(
      { campaign_id: campaignId, ...filters },
      { skip, limit: pagination.limit }
    );
    return {
      data: items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  async getEventsByUser(userId: string): Promise<AdEvent[]> {
    return this.events.find({
      where: { user_id: userId } as Partial<AdEvent>,
      order: { created_at: 'DESC' },
      limit: 100,
    });
  }

  /** Track conversion via pixel (from external merchant sites) */
  async trackConversionPixel(data: {
    campaign_id: string;
    user_id?: string;
    conversion_value: number;
    referrer?: string;
    ip_address?: string;
  }): Promise<AdEvent> {
    return this.trackEvent({
      event_type: EventType.CONVERSION,
      campaign_id: data.campaign_id,
      user_id: data.user_id,
      ip_address: data.ip_address,
      metadata: {
        source: 'pixel',
        referrer: data.referrer,
        value: data.conversion_value,
      },
    });
  }

  // Exposed for analytics services still using raw repo access
  _campaignRepo(): ICampaignRepository {
    return this.campaigns;
  }

  _eventRepo(): IAdEventRepository {
    return this.events;
  }
}

// Suppress type-only Campaign import being flagged as unused
export type { Campaign };

export const eventService = new Proxy({} as EventService, {
  get(_, prop) {
    const inst = container.resolve(EventService);
    const value = Reflect.get(inst, prop);
    return typeof value === 'function' ? value.bind(inst) : value;
  },
});
