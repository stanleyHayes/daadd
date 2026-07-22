/**
 * The dashboard's navigation map — one definition, used by both the sidebar and
 * the route guard.
 *
 * These previously disagreed. The sidebar knew that `/dashboard/admin/roles` was
 * the `roles-access` item, while `canAccessRoute()` re-derived the key by taking
 * the first path segment after `/dashboard`. For anything nested that produced
 * `"admin"`, which is not a key any role holds, so every `/dashboard/admin/*`
 * page bounced back to the overview — including for a Super Admin who could see
 * the links perfectly well in the sidebar.
 *
 * Matching on the real href removes the guesswork. Adding a nested route no
 * longer needs anyone to remember that the guard parses URLs differently.
 */

export interface NavEntry {
  /** Matches the keys in ROLE_NAV_ITEMS. */
  key: string;
  href: string;
  /** Permission resource gating this item. Empty means always available. */
  resource: string;
  /** i18n key under `dashboard.nav`. */
  label: string;
  /** i18n key under `dashboard.nav` for the group heading. */
  group: string;
}

export const NAV_ENTRIES: NavEntry[] = [
  { key: 'dashboard', href: '/dashboard', resource: 'analytics', label: 'dashboard', group: 'overview' },

  { key: 'campaigns', href: '/dashboard/campaigns', resource: 'campaigns', label: 'campaigns', group: 'campaigns' },
  { key: 'channels', href: '/dashboard/channels', resource: 'campaigns', label: 'channels', group: 'campaigns' },
  { key: 'ai-optimization', href: '/dashboard/ai-optimization', resource: 'ai', label: 'aiOptimization', group: 'campaigns' },
  { key: 'anomalies', href: '/dashboard/anomalies', resource: 'anomalies', label: 'anomalies', group: 'campaigns' },

  { key: 'analytics', href: '/dashboard/analytics', resource: 'analytics', label: 'analytics', group: 'analytics' },
  { key: 'heatmaps', href: '/dashboard/heatmaps', resource: 'heatmaps', label: 'heatmaps', group: 'analytics' },
  { key: 'benchmarking', href: '/dashboard/benchmarking', resource: 'benchmarks', label: 'benchmarking', group: 'analytics' },
  { key: 'storyteller', href: '/dashboard/storyteller', resource: 'storyteller', label: 'storyteller', group: 'analytics' },

  { key: 'messages', href: '/dashboard/messages', resource: 'messages', label: 'messages', group: 'workspace' },
  { key: 'merchant', href: '/dashboard/merchant', resource: 'analytics', label: 'merchant', group: 'workspace' },
  { key: 'outlets', href: '/dashboard/outlets', resource: 'outlets', label: 'outlets', group: 'workspace' },
  { key: 'team', href: '/dashboard/team', resource: 'team', label: 'team', group: 'workspace' },
  { key: 'platform-accounts', href: '/dashboard/platform-accounts', resource: 'platform_accounts', label: 'adAccounts', group: 'workspace' },
  { key: 'profile', href: '/dashboard/profile', resource: '', label: 'profile', group: 'workspace' },
  { key: 'settings', href: '/dashboard/settings', resource: '', label: 'settings', group: 'workspace' },

  { key: 'admin-advertisers', href: '/dashboard/admin/advertisers', resource: 'advertisers', label: 'advertiserApprovals', group: 'admin' },
  { key: 'admin-moderation', href: '/dashboard/admin/moderation', resource: 'moderation', label: 'reviewModeration', group: 'admin' },
  { key: 'admin-loyalty', href: '/dashboard/admin/loyalty', resource: 'loyalty', label: 'loyaltyVip', group: 'admin' },
  { key: 'site-content', href: '/dashboard/admin/site-content', resource: 'site_content', label: 'siteContent', group: 'admin' },
  { key: 'roles-access', href: '/dashboard/admin/roles', resource: 'roles', label: 'roles', group: 'admin' },
];

/** Group order in the sidebar. */
export const NAV_GROUPS = ['overview', 'campaigns', 'analytics', 'workspace', 'admin'] as const;

/** The overview. Its href prefixes every other route, so it never matches as one. */
const ROOT_HREF = '/dashboard';

/**
 * The nav entry a pathname belongs to.
 *
 * Longest href wins, so `/dashboard/admin/site-content` resolves to the
 * site-content entry rather than to `/dashboard`. Sub-paths resolve to their
 * parent, so `/dashboard/campaigns/123/edit` is still the campaigns entry.
 *
 * The root is matched exactly. Treating it as a prefix would make it a catch-all
 * for every unmapped route, which silently hands those routes the overview's
 * permissions instead of letting them fall through to the router's 404.
 */
export function navEntryForPath(pathname: string): NavEntry | undefined {
  const path = pathname.replace(/\/+$/, '') || ROOT_HREF;

  return NAV_ENTRIES.filter((entry) =>
    entry.href === ROOT_HREF
      ? path === ROOT_HREF
      : path === entry.href || path.startsWith(`${entry.href}/`)
  ).sort((a, b) => b.href.length - a.href.length)[0];
}
