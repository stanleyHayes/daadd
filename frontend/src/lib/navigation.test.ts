import { describe, it, expect } from 'vitest';
import { NAV_ENTRIES, NAV_GROUPS, navEntryForPath } from './navigation';
import { ROLE_NAV_ITEMS, canAccessRoute } from './rbac';

/**
 * Guards the bug this file was extracted to fix: `canAccessRoute` used to take
 * the first path segment after `/dashboard`, which for every nested admin route
 * produced `"admin"` — a key no role holds — so a Super Admin was redirected
 * away from pages whose links they could see in their own sidebar.
 */

const ADMIN_ROUTES = [
  '/dashboard/admin/advertisers',
  '/dashboard/admin/moderation',
  '/dashboard/admin/loyalty',
  '/dashboard/admin/site-content',
  '/dashboard/admin/roles',
];

describe('route resolution', () => {
  it('resolves nested admin routes to their own entry, not to "admin"', () => {
    expect(navEntryForPath('/dashboard/admin/site-content')?.key).toBe('site-content');
    expect(navEntryForPath('/dashboard/admin/roles')?.key).toBe('roles-access');
    expect(navEntryForPath('/dashboard/admin/advertisers')?.key).toBe('admin-advertisers');
  });

  it('resolves a sub-path to its parent entry', () => {
    expect(navEntryForPath('/dashboard/campaigns/123/edit')?.key).toBe('campaigns');
    expect(navEntryForPath('/dashboard/campaigns/new')?.key).toBe('campaigns');
  });

  it('does not let /dashboard swallow everything', () => {
    // The overview href is a prefix of every other route, so longest-match
    // matters. Without it every page would resolve to the dashboard entry.
    expect(navEntryForPath('/dashboard')?.key).toBe('dashboard');
    expect(navEntryForPath('/dashboard/outlets')?.key).toBe('outlets');
  });

  it('tolerates a trailing slash', () => {
    expect(navEntryForPath('/dashboard/admin/roles/')?.key).toBe('roles-access');
  });

  it('returns nothing for an unknown route', () => {
    expect(navEntryForPath('/dashboard/does-not-exist')).toBeUndefined();
  });
});

describe('admin access', () => {
  it.each(ADMIN_ROUTES)('lets an admin open %s', (route) => {
    expect(canAccessRoute('admin', route)).toBe(true);
  });

  it.each(ADMIN_ROUTES)('keeps an advertiser out of %s', (route) => {
    expect(canAccessRoute('advertiser', route)).toBe(false);
  });

  it('lets an unknown route through so the router can 404 it', () => {
    // Redirecting instead would hide a broken link behind a silent bounce.
    expect(canAccessRoute('admin', '/dashboard/does-not-exist')).toBe(true);
  });
});

describe('the map stays coherent', () => {
  it('gives every entry a unique key and href', () => {
    const keys = NAV_ENTRIES.map((e) => e.key);
    const hrefs = NAV_ENTRIES.map((e) => e.href);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('puts every entry in a known group', () => {
    for (const entry of NAV_ENTRIES) {
      expect(NAV_GROUPS).toContain(entry.group);
    }
  });

  it('has an admin nav permission for every entry admins can reach', () => {
    // A key in the map that no role lists is dead: the link renders for nobody.
    for (const entry of NAV_ENTRIES) {
      const reachable = Object.values(ROLE_NAV_ITEMS).some((keys) => keys.includes(entry.key));
      expect(`${entry.key} reachable by some role`).toBe(
        reachable ? `${entry.key} reachable by some role` : `${entry.key} is orphaned`
      );
    }
  });

  it('routes every admin-group entry under /dashboard/admin', () => {
    for (const entry of NAV_ENTRIES.filter((e) => e.group === 'admin')) {
      expect(entry.href.startsWith('/dashboard/admin/')).toBe(true);
    }
  });
});
