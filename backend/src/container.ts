import 'reflect-metadata';
import { container } from 'tsyringe';

import { TOKENS } from './repositories/tokens';

// User (has custom findByEmail)
import { IUserRepository } from './repositories/user.repository';
import { MongoUserRepository } from './repositories/mongo/user.repository';

// Mongo repos
import { MongoCampaignRepository } from './repositories/mongo/campaign.repository';
import { MongoCreativeRepository } from './repositories/mongo/creative.repository';
import { MongoAdEventRepository } from './repositories/mongo/ad-event.repository';
import { MongoAnomalyRepository } from './repositories/mongo/anomaly.repository';
import { MongoAiAuditLogRepository } from './repositories/mongo/ai-audit-log.repository';
import { MongoAuditLogRepository } from './repositories/mongo/audit-log.repository';
import { MongoTeamMemberRepository } from './repositories/mongo/team-member.repository';
import { MongoNotificationRepository } from './repositories/mongo/notification.repository';
import { MongoRewardRepository } from './repositories/mongo/reward.repository';
import { MongoRedemptionRepository } from './repositories/mongo/redemption.repository';
import { MongoReviewRepository } from './repositories/mongo/review.repository';
import { MongoMerchantRepository } from './repositories/mongo/merchant.repository';
import { MongoUserProfileRepository } from './repositories/mongo/user-profile.repository';
import { MongoDataSourceRepository } from './repositories/mongo/data-source.repository';
import { MongoAudienceRepository } from './repositories/mongo/audience.repository';
import { MongoPrivacyConsentRepository } from './repositories/mongo/privacy-consent.repository';
import { MongoAudienceActivationRepository } from './repositories/mongo/audience-activation.repository';
import { MongoPlatformAccountRepository } from './repositories/mongo/platform-account.repository';

// In-memory repos (for simple data)
import { InMemoryWebhookRepository } from './repositories/in-memory/webhook.repository';

// Storage
import { IStorageProvider } from './storage/types';
import { CloudinaryStorageProvider } from './storage/cloudinary.storage';
import { S3StorageProvider } from './storage/s3.storage';
import { LocalStorageProvider } from './storage/local.storage';

// Services
import { EmailService } from './services/email.service';
import { BudgetPacingService } from './services/budget-pacing.service';
import { WebhookService } from './services/webhook.service';
import { AiCreativeService } from './services/ai-creative.service';
import { AICreativeAdvancedService } from './services/ai-creative-advanced.service';
import { ABTestingService } from './services/ab-testing.service';
import { DataCollectionService } from './services/data-collection.service';
import { SegmentationService } from './services/segmentation.service';
import { AudienceExportService } from './services/audience-export.service';
import { CRMSyncService } from './services/crm-sync.service';
import { AudienceAdvancedService } from './services/audience-advanced.service';
import { UnifiedDashboardService } from './services/unified-dashboard.service';

export type StorageType = 'cloudinary' | 's3' | 'local';

export interface ContainerConfig {
  storageType: StorageType;
}

export function resolveConfig(): ContainerConfig {
  const storageType = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
  return {
    storageType: (['cloudinary', 's3', 'local'].includes(storageType) ? storageType : 'local') as StorageType,
  };
}

const repoRegistry: Array<[symbol, unknown]> = [
  [TOKENS.CampaignRepository, MongoCampaignRepository],
  [TOKENS.CreativeRepository, MongoCreativeRepository],
  [TOKENS.AdEventRepository, MongoAdEventRepository],
  [TOKENS.AnomalyRepository, MongoAnomalyRepository],
  [TOKENS.AiAuditLogRepository, MongoAiAuditLogRepository],
  [TOKENS.AuditLogRepository, MongoAuditLogRepository],
  [TOKENS.TeamMemberRepository, MongoTeamMemberRepository],
  [TOKENS.NotificationRepository, MongoNotificationRepository],
  [TOKENS.RewardRepository, MongoRewardRepository],
  [TOKENS.RedemptionRepository, MongoRedemptionRepository],
  [TOKENS.ReviewRepository, MongoReviewRepository],
  [TOKENS.MerchantRepository, MongoMerchantRepository],
  [TOKENS.WebhookRepository, InMemoryWebhookRepository],
  [TOKENS.UserProfileRepository, MongoUserProfileRepository],
  [TOKENS.DataSourceRepository, MongoDataSourceRepository],
  [TOKENS.AudienceRepository, MongoAudienceRepository],
  [TOKENS.PrivacyConsentRepository, MongoPrivacyConsentRepository],
  [TOKENS.AudienceActivationRepository, MongoAudienceActivationRepository],
  [TOKENS.PlatformAccountRepository, MongoPlatformAccountRepository],
];

export function registerDependencies(config: ContainerConfig = resolveConfig()): void {
  container.registerSingleton<IUserRepository>(TOKENS.UserRepository, MongoUserRepository);

  for (const [token, impl] of repoRegistry) {
    container.registerSingleton(token, impl as never);
  }

  if (config.storageType === 'cloudinary') {
    container.registerSingleton<IStorageProvider>(TOKENS.StorageProvider, CloudinaryStorageProvider);
  } else if (config.storageType === 's3') {
    container.registerSingleton<IStorageProvider>(TOKENS.StorageProvider, S3StorageProvider);
  } else {
    container.registerSingleton<IStorageProvider>(TOKENS.StorageProvider, LocalStorageProvider);
  }

  // Register environment config for services
  container.registerInstance('config', process.env);

  // Services
  container.registerSingleton(TOKENS.EmailService, EmailService);
  container.registerSingleton(BudgetPacingService, BudgetPacingService);
  container.registerSingleton(WebhookService, WebhookService);
  container.registerSingleton(AiCreativeService, AiCreativeService);
  container.registerSingleton(AICreativeAdvancedService, AICreativeAdvancedService);
  container.registerSingleton(ABTestingService, ABTestingService);
  container.registerSingleton(TOKENS.DataCollectionService, DataCollectionService);
  container.registerSingleton(TOKENS.SegmentationService, SegmentationService);
  container.registerSingleton(AudienceExportService, AudienceExportService);
  container.registerSingleton(CRMSyncService, CRMSyncService);
  container.registerSingleton(AudienceAdvancedService, AudienceAdvancedService);
  container.registerSingleton(UnifiedDashboardService, UnifiedDashboardService);
}

export { container };
