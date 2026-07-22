import { describe, it, expect } from 'vitest';
import { ROLE_NAV_ITEMS, PERMISSIONS, hasPermission, canAccessRoute } from './rbac';

describe('ROLE_NAV_ITEMS', () => {
  it('contains exactly the expected roles', () => {
    expect(Object.keys(ROLE_NAV_ITEMS).sort()).toEqual(
      ['admin', 'advertiser', 'campaign_manager', 'analyst', 'merchant', 'end_user'].sort()
    );
  });

  it('end_user can only see profile and settings', () => {
    expect(ROLE_NAV_ITEMS.end_user).toEqual(['profile', 'settings']);
  });
});

describe('canAccessRoute', () => {
  it('allows every role to access each of its own nav keys', () => {
    for (const [role, keys] of Object.entries(ROLE_NAV_ITEMS)) {
      for (const key of keys) {
        expect(canAccessRoute(role, `/dashboard/${key}`)).toBe(true);
      }
    }
  });

  it('denies end_user dashboard routes', () => {
    expect(canAccessRoute('end_user', '/dashboard')).toBe(false);
    expect(canAccessRoute('end_user', '/dashboard/campaigns')).toBe(false);
    expect(canAccessRoute('end_user', '/dashboard/analytics')).toBe(false);
  });

  it('denies campaign_manager routes outside its list', () => {
    expect(canAccessRoute('campaign_manager', '/dashboard/team')).toBe(false);
    expect(canAccessRoute('campaign_manager', '/dashboard/anomalies')).toBe(false);
    expect(canAccessRoute('campaign_manager', '/dashboard/benchmarking')).toBe(false);
  });

  it('denies analyst access to campaigns and team', () => {
    expect(canAccessRoute('analyst', '/dashboard/campaigns')).toBe(false);
    expect(canAccessRoute('analyst', '/dashboard/team')).toBe(false);
    expect(canAccessRoute('analyst', '/dashboard/analytics')).toBe(true);
  });

  it("maps '/dashboard' and '/dashboard/' to the 'dashboard' key", () => {
    expect(canAccessRoute('admin', '/dashboard')).toBe(true);
    expect(canAccessRoute('admin', '/dashboard/')).toBe(true);
    expect(canAccessRoute('end_user', '/dashboard/')).toBe(false);
  });

  it('resolves nested routes by their first segment', () => {
    expect(canAccessRoute('campaign_manager', '/dashboard/campaigns/abc123')).toBe(true);
    expect(canAccessRoute('analyst', '/dashboard/campaigns/abc123/edit')).toBe(false);
    expect(canAccessRoute('admin', '/dashboard/team/42/roles')).toBe(true);
  });

  it('returns false for unknown roles', () => {
    expect(canAccessRoute('superuser', '/dashboard')).toBe(false);
    expect(canAccessRoute('', '/dashboard/profile')).toBe(false);
    expect(canAccessRoute('ADMIN', '/dashboard')).toBe(false);
  });

  it('lets an unknown route through so the router can render its 404', () => {
    // Changed deliberately. This used to redirect to the overview, which made a
    // typo'd or dead link look like a permissions problem. Real pages are each
    // wrapped in their own ProtectedRoute, so an unmapped path only ever
    // matches `path="*"` — letting it through grants access to nothing.
    expect(canAccessRoute('admin', '/dashboard/nonexistent-page')).toBe(true);
  });
});

describe('hasPermission', () => {
  it('allows only admin and advertiser to create campaigns', () => {
    expect(hasPermission('admin', 'CAMPAIGN_CREATE')).toBe(true);
    expect(hasPermission('advertiser', 'CAMPAIGN_CREATE')).toBe(true);
    expect(hasPermission('campaign_manager', 'CAMPAIGN_CREATE')).toBe(false);
    expect(hasPermission('analyst', 'CAMPAIGN_CREATE')).toBe(false);
    expect(hasPermission('end_user', 'CAMPAIGN_CREATE')).toBe(false);
  });

  it('allows campaign_manager to edit but not delete campaigns', () => {
    expect(hasPermission('campaign_manager', 'CAMPAIGN_EDIT')).toBe(true);
    expect(hasPermission('campaign_manager', 'CAMPAIGN_DELETE')).toBe(false);
  });

  it('restricts TEAM_REMOVE to admin only', () => {
    expect(hasPermission('admin', 'TEAM_REMOVE')).toBe(true);
    expect(hasPermission('advertiser', 'TEAM_REMOVE')).toBe(false);
  });

  it('allows analyst to export reports', () => {
    expect(hasPermission('analyst', 'EXPORT_REPORTS')).toBe(true);
    expect(hasPermission('end_user', 'EXPORT_REPORTS')).toBe(false);
  });

  it('returns false for unknown roles', () => {
    expect(hasPermission('superuser', 'CAMPAIGN_CREATE')).toBe(false);
  });

  it('exposes the expected permission keys', () => {
    expect(Object.keys(PERMISSIONS)).toEqual([
      'CAMPAIGN_CREATE',
      'CAMPAIGN_EDIT',
      'CAMPAIGN_DELETE',
      'CAMPAIGN_TOGGLE_AI',
      'ANOMALY_RESOLVE',
      'TEAM_INVITE',
      'TEAM_CHANGE_ROLE',
      'TEAM_REMOVE',
      'EXPORT_REPORTS',
    ]);
  });
});
