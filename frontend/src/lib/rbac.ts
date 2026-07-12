import type { UserRole } from '@/types';

// Define which sidebar nav keys each role can see
export const ROLE_NAV_ITEMS: Record<UserRole, string[]> = {
  admin: ['dashboard', 'campaigns', 'analytics', 'heatmaps', 'ai-optimization', 'anomalies', 'benchmarking', 'storyteller', 'team', 'settings'],
  advertiser: ['dashboard', 'campaigns', 'analytics', 'heatmaps', 'ai-optimization', 'anomalies', 'benchmarking', 'storyteller', 'team', 'settings'],
  campaign_manager: ['dashboard', 'campaigns', 'analytics', 'heatmaps', 'settings'],
  analyst: ['dashboard', 'analytics', 'heatmaps', 'benchmarking', 'storyteller', 'settings'],
  end_user: [],
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
 * Determines if a user role can access a given dashboard route.
 * end_user cannot access any dashboard routes.
 * Other roles are checked against their ROLE_NAV_ITEMS.
 */
export function canAccessRoute(userRole: string, route: string): boolean {
  if (userRole === 'end_user') return false;

  // Extract the first segment after /dashboard/
  // e.g. /dashboard/campaigns/new -> "campaigns"
  // e.g. /dashboard -> "dashboard"
  const stripped = route.replace(/^\/dashboard\/?/, '');
  const routeKey = stripped === '' ? 'dashboard' : stripped.split('/')[0];

  return ROLE_NAV_ITEMS[userRole as UserRole]?.includes(routeKey) ?? false;
}
