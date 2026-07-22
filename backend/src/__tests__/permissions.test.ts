import {
  normalise,
  effectivePermissions,
  ALL_PERMISSIONS,
  ROLE_TEMPLATES,
  ACCOUNT_TYPE_ROLES,
} from '../utils/permissions';

describe('permission normalisation', () => {
  it('adds the implied read for every write', () => {
    expect(normalise(['campaigns:update'])).toEqual(['campaigns:read', 'campaigns:update']);
    expect(normalise(['ads:delete'])).toEqual(['ads:delete', 'ads:read']);
    expect(normalise(['site_content:create'])).toEqual([
      'site_content:create',
      'site_content:read',
    ]);
  });

  it('leaves a bare read alone', () => {
    expect(normalise(['analytics:read'])).toEqual(['analytics:read']);
  });

  it('drops anything outside the catalogue', () => {
    expect(normalise(['campaigns:read', 'nonsense:read', 'campaigns:explode', 42, null])).toEqual([
      'campaigns:read',
    ]);
  });

  it('de-duplicates', () => {
    expect(normalise(['team:read', 'team:read', 'team:update'])).toEqual([
      'team:read',
      'team:update',
    ]);
  });

  it('returns empty for non-arrays', () => {
    expect(normalise(undefined)).toEqual([]);
    expect(normalise('campaigns:read')).toEqual([]);
  });
});

describe('effective permissions', () => {
  it('is the role set when there are no overrides', () => {
    expect(effectivePermissions(['campaigns:read'])).toEqual(['campaigns:read']);
  });

  it('adds individually granted permissions on top of the role', () => {
    const result = effectivePermissions(['campaigns:read'], { granted: ['outlets:update'] });
    expect(result).toContain('campaigns:read');
    expect(result).toContain('outlets:update');
    // the grant brought its implied read with it
    expect(result).toContain('outlets:read');
  });

  it('revokes a permission the role grants', () => {
    const result = effectivePermissions(['campaigns:read', 'campaigns:delete'], {
      revoked: ['campaigns:delete'],
    });
    expect(result).toEqual(['campaigns:read']);
  });

  it('revoking read takes the writes with it', () => {
    // Otherwise you leave an update permission on a resource the user cannot
    // list — the exact orphaned-write state normalise() exists to prevent.
    const result = effectivePermissions(
      ['campaigns:read', 'campaigns:create', 'campaigns:update', 'ads:read'],
      { revoked: ['campaigns:read'] }
    );
    expect(result).toEqual(['ads:read']);
  });

  it('revoke beats grant for the same permission', () => {
    const result = effectivePermissions([], {
      granted: ['users:delete'],
      revoked: ['users:delete'],
    });
    expect(result).not.toContain('users:delete');
  });

  it('does not mutate the role when a user is adjusted', () => {
    const rolePermissions = ['campaigns:read', 'campaigns:update'];
    effectivePermissions(rolePermissions, { revoked: ['campaigns:update'] });
    expect(rolePermissions).toEqual(['campaigns:read', 'campaigns:update']);
  });
});

describe('role templates', () => {
  it('gives Super Admin everything', () => {
    expect(ROLE_TEMPLATES['Super Admin'].permissions).toHaveLength(ALL_PERMISSIONS.length);
  });

  it('withholds role management from Administrator', () => {
    const admin = ROLE_TEMPLATES.Administrator.permissions;
    expect(admin.some((p) => p.startsWith('roles:'))).toBe(false);
    expect(admin).toContain('campaigns:update');
  });

  it('keeps Insights Analyst read-only', () => {
    const analyst = ROLE_TEMPLATES['Insights Analyst'].permissions;
    expect(analyst.every((p) => p.endsWith(':read'))).toBe(true);
  });

  it('lets Policy & Compliance set the rules but not run campaigns', () => {
    const policy = ROLE_TEMPLATES['Policy & Compliance'].permissions;
    expect(policy).toContain('loyalty:update');
    expect(policy).toContain('advertisers:update');
    expect(policy).not.toContain('campaigns:update');
    expect(policy).not.toContain('roles:update');
  });

  it('names no staff role after an account type', () => {
    // `analyst` is an account type a customer can hold; a staff role sharing
    // that name makes every conversation about "the analyst" ambiguous.
    const accountTypes = ['admin', 'advertiser', 'campaign_manager', 'analyst', 'end_user', 'merchant'];
    for (const name of Object.keys(ROLE_TEMPLATES)) {
      expect(accountTypes).not.toContain(name.toLowerCase().replace(/ /g, '_'));
    }
  });

  it('every template satisfies the write-implies-read rule', () => {
    for (const [name, template] of Object.entries(ROLE_TEMPLATES)) {
      for (const permission of template.permissions) {
        const [resource, action] = permission.split(':');
        if (action !== 'read') {
          expect(`${name}: ${template.permissions.join(',')}`).toContain(`${resource}:read`);
        }
      }
    }
  });
});

describe('account-type baselines', () => {
  it('covers every account type except admin', () => {
    // admin deliberately has none: administrators get theirs from a staff role.
    expect(Object.keys(ACCOUNT_TYPE_ROLES).sort()).toEqual([
      'advertiser',
      'analyst',
      'campaign_manager',
      'end_user',
      'merchant',
    ]);
  });

  it('matches what the frontend role matrix already allowed', () => {
    // Folding these in must not change anyone's access, only where the answer
    // comes from. These assertions mirror lib/rbac.ts PERMISSIONS.
    const advertiser = ACCOUNT_TYPE_ROLES.advertiser.permissions;
    expect(advertiser).toContain('campaigns:create');
    expect(advertiser).toContain('campaigns:delete');

    const manager = ACCOUNT_TYPE_ROLES.campaign_manager.permissions;
    expect(manager).toContain('campaigns:update');
    expect(manager).not.toContain('campaigns:create');
    expect(manager).not.toContain('campaigns:delete');

    const analyst = ACCOUNT_TYPE_ROLES.analyst.permissions;
    expect(analyst.every((p) => p.endsWith(':read'))).toBe(true);
  });

  it('keeps consumers out of the dashboard entirely', () => {
    const consumer = ACCOUNT_TYPE_ROLES.end_user.permissions;
    expect(consumer).not.toContain('campaigns:read');
    expect(consumer).not.toContain('analytics:read');
  });

  it('gives merchants their outlets but not campaigns', () => {
    const merchant = ACCOUNT_TYPE_ROLES.merchant.permissions;
    expect(merchant).toContain('outlets:update');
    expect(merchant).toContain('redemptions:update');
    expect(merchant).not.toContain('campaigns:read');
  });

  it('every baseline satisfies the write-implies-read rule', () => {
    for (const [name, template] of Object.entries(ACCOUNT_TYPE_ROLES)) {
      for (const permission of template.permissions) {
        const [resource, action] = permission.split(':');
        if (action !== 'read') {
          expect(`${name}: ${template.permissions.join(',')}`).toContain(`${resource}:read`);
        }
      }
    }
  });
});
