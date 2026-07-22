/**
 * Permission model.
 *
 * A permission is `<resource>:<action>`, e.g. `campaigns:create`. Roles carry a
 * set of them; a user inherits their role's set at creation time and can then
 * be adjusted individually without that edit leaking back into the role.
 *
 * The one invariant worth enforcing in code rather than in the UI: you cannot
 * hold a write permission without the matching read. Granting `campaigns:update`
 * to someone who cannot list campaigns produces a button they can press on a
 * screen they cannot open, so `normalise()` adds the read back rather than
 * letting that state exist.
 */

export const RESOURCES = [
  'campaigns',
  'ads',
  'analytics',
  'anomalies',
  'ai',
  'heatmaps',
  'benchmarks',
  'storyteller',
  'messages',
  'outlets',
  'redemptions',
  'reviews',
  'rewards',
  'team',
  'platform_accounts',
  'advertisers',
  'moderation',
  'loyalty',
  'site_content',
  'users',
  'roles',
  'billing',
  'support',
] as const;

export const ACTIONS = ['read', 'create', 'update', 'delete'] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = (typeof ACTIONS)[number];
export type Permission = `${Resource}:${Action}`;

/** Every permission the system knows about. Used to validate input. */
export const ALL_PERMISSIONS: Permission[] = RESOURCES.flatMap((resource) =>
  ACTIONS.map((action) => `${resource}:${action}` as Permission)
);

const PERMISSION_SET = new Set<string>(ALL_PERMISSIONS);

export function isPermission(value: unknown): value is Permission {
  return typeof value === 'string' && PERMISSION_SET.has(value);
}

/**
 * Drops anything unrecognised, de-duplicates, and adds the implied read for
 * every write. Always run this before persisting a permission set.
 */
export function normalise(permissions: unknown): Permission[] {
  if (!Array.isArray(permissions)) return [];

  const out = new Set<Permission>();
  for (const entry of permissions) {
    if (!isPermission(entry)) continue;
    out.add(entry);
    const [resource, action] = entry.split(':') as [Resource, Action];
    if (action !== 'read') out.add(`${resource}:read`);
  }
  return [...out].sort();
}

export interface PermissionOverrides {
  /** Added on top of the role. */
  granted?: string[];
  /** Taken away from the role, even if the role grants them. */
  revoked?: string[];
}

/**
 * What a user can actually do: their role's permissions, plus anything granted
 * to them individually, minus anything revoked.
 *
 * Revoking a read also revokes that resource's writes — otherwise you would
 * leave behind exactly the orphaned-write state `normalise()` exists to
 * prevent, just by a different route.
 */
export function effectivePermissions(
  rolePermissions: string[] = [],
  overrides: PermissionOverrides = {}
): Permission[] {
  const granted = new Set<Permission>([
    ...normalise(rolePermissions),
    ...normalise(overrides.granted),
  ]);

  // Revocations are taken literally — running them through `normalise()` would
  // expand "revoke campaigns:delete" into "revoke campaigns:read" as well and
  // silently strip the whole resource. The one cascade we do want is the
  // opposite direction, handled below.
  const revoked = Array.isArray(overrides.revoked) ? overrides.revoked.filter(isPermission) : [];

  for (const entry of revoked) {
    granted.delete(entry);
    const [resource, action] = entry.split(':') as [Resource, Action];
    if (action === 'read') {
      for (const other of ACTIONS) granted.delete(`${resource}:${other}` as Permission);
    }
  }

  return [...granted].sort();
}

export function can(permissions: string[], permission: Permission): boolean {
  return permissions.includes(permission);
}

/**
 * The starting points an admin picks from when inviting someone. These are
 * seeded as editable Role documents rather than hard-coded checks, so an admin
 * can change what any of them means without a deploy.
 */
export const ROLE_TEMPLATES: Record<string, { description: string; permissions: Permission[] }> = {
  'Super Admin': {
    description: 'Full access, including managing roles and other administrators.',
    permissions: ALL_PERMISSIONS,
  },
  Administrator: {
    description: 'Runs the platform day to day. Cannot change roles or permissions.',
    permissions: ALL_PERMISSIONS.filter((p) => !p.startsWith('roles:') && !p.startsWith('users:delete')),
  },
  'Content Editor': {
    description: 'Maintains the public marketing site and moderates submitted media.',
    permissions: normalise([
      'site_content:read',
      'site_content:create',
      'site_content:update',
      'site_content:delete',
      'moderation:read',
      'moderation:update',
      'reviews:read',
      'support:read',
    ]),
  },
  Analyst: {
    description: 'Read-only across reporting. Cannot change campaigns or content.',
    permissions: normalise([
      'campaigns:read',
      'ads:read',
      'analytics:read',
      'anomalies:read',
      'heatmaps:read',
      'benchmarks:read',
      'storyteller:read',
      'redemptions:read',
      'reviews:read',
    ]),
  },
  'Support Agent': {
    description: 'Handles tickets and customer conversations.',
    permissions: normalise([
      'support:read',
      'support:update',
      'messages:read',
      'messages:create',
      'users:read',
      'redemptions:read',
    ]),
  },
};
