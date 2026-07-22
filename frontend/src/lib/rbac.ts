import type { UserRole } from '@/types';
import { navEntryForPath } from '@/lib/navigation';

// Define which sidebar nav keys each role can see
export const ROLE_NAV_ITEMS: Record<UserRole, string[]> = {
  admin: ['dashboard', 'campaigns', 'channels', 'analytics', 'heatmaps', 'ai-optimization', 'anomalies', 'benchmarking', 'storyteller', 'team', 'platform-accounts', 'admin-advertisers', 'admin-moderation', 'admin-loyalty', 'site-content', 'roles-access', 'messages', 'merchant', 'outlets', 'profile', 'settings'],
  advertiser: ['dashboard', 'campaigns', 'channels', 'analytics', 'heatmaps', 'ai-optimization', 'anomalies', 'benchmarking', 'storyteller', 'team', 'platform-accounts', 'messages', 'merchant', 'outlets', 'profile', 'settings'],
  campaign_manager: ['dashboard', 'campaigns', 'channels', 'analytics', 'heatmaps', 'messages', 'profile', 'settings'],
  analyst: ['dashboard', 'analytics', 'heatmaps', 'benchmarking', 'storyteller', 'profile', 'settings'],
  // Merchants only need their own performance view, branches and enquiries.
  merchant: ['merchant', 'outlets', 'messages', 'profile', 'settings'],
  end_user: ['profile', 'settings'],
};

// Action-level permissions: which roles can perform each action
export const PERMISSIONS = {
  CAMPAIGN_CREATE: ['admin', 'advertiser'],
  CAMPAIGN_EDIT: ['admin', 'advertiser', 'campaign_manager'],
  CAMPAIGN_DELETE: ['admin', 'advertiser'],
  CAMPAIGN_TOGGLE_AI: ['admin', 'advertiser'],
  ANOMALY_RESOLVE: ['admin', 'advertiser'],
  TEAM_INVITE: ['admin', 'advertiser'],
  TEAM_CHANGE_ROLE: ['admin', 'advertiser'],
  TEAM_REMOVE: ['admin'],
  EXPORT_REPORTS: ['admin', 'advertiser', 'analyst'],
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

export function hasPermission(userRole: string, permission: PermissionKey): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(userRole);
}

/**
 * Whether a role may open a dashboard route.
 *
 * Resolves the route through the shared navigation map rather than parsing the
 * URL. The previous version took the first path segment after `/dashboard`,
 * which for any nested route produced `"admin"` — a key no role holds — so every
 * `/dashboard/admin/*` page redirected even for a Super Admin who could see the
 * links in the sidebar.
 *
 * An unrecognised route is allowed through so the router can render its own 404
 * rather than silently bouncing to the overview.
 */
export function canAccessRoute(userRole: string, route: string): boolean {
  const entry = navEntryForPath(route);
  if (!entry) return true;

  return ROLE_NAV_ITEMS[userRole as UserRole]?.includes(entry.key) ?? false;
}
