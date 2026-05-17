import { z } from 'zod';

export const CreateCampaignDtoSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  budget_total: z.number().positive(),
  platform_ids: z.array(z.string()).min(1),
  enable_ai_optimization: z.boolean().default(false),
  language: z.enum(['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ru', 'ar', 'hi', 'bn', 'pa', 'tr']).default('en'),
});

export type CreateCampaignDto = z.infer<typeof CreateCampaignDtoSchema>;

export const UpdateCampaignDtoSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  budget_total: z.number().positive().optional(),
  enable_ai_optimization: z.boolean().optional(),
  language: z.enum(['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ru', 'ar', 'hi', 'bn', 'pa', 'tr']).optional(),
}).strict();

export type UpdateCampaignDto = z.infer<typeof UpdateCampaignDtoSchema>;

export const CampaignQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED']).optional(),
  sort: z.enum(['created_at', 'name', 'budget_total']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type CampaignQuery = z.infer<typeof CampaignQuerySchema>;
