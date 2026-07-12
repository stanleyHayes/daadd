import { CampaignManagerRole } from './user.types';

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface TeamInvite {
  id: string;
  email: string;
  role: CampaignManagerRole;
  invited_by: string;
  campaign_id: string;
  status: InviteStatus;
  created_at: Date;
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  campaign_id: string;
  action: string;
  field_changed: string;
  old_value: string;
  new_value: string;
  timestamp: Date;
}
