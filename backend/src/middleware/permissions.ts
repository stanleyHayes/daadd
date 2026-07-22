import { Request, Response, NextFunction } from 'express';
import { User, Role } from '../models';
import { effectivePermissions, Permission } from '../utils/permissions';

/**
 * Resolves what the signed-in user is actually allowed to do.
 *
 * The JWT deliberately does not carry permissions: an admin revoking access
 * should take effect on the next request, not whenever the token happens to
 * expire. That costs a lookup per guarded request, which is the right trade
 * for an admin surface.
 */
export async function resolvePermissions(userId: string): Promise<Permission[]> {
  const user = await User.findById(userId).select('role role_id permission_overrides').lean();
  if (!user) return [];

  // An explicitly assigned role wins. Otherwise fall back to the baseline for
  // the account type, so advertisers, merchants and consumers get a permission
  // set without needing a migration or an admin to assign one by hand.
  const role = user.role_id
    ? await Role.findById(user.role_id).select('permissions').lean()
    : await Role.findOne({ account_type: user.role }).select('permissions').lean();

  return effectivePermissions(role?.permissions ?? [], user.permission_overrides ?? {});
}

declare module 'express-serve-static-core' {
  interface Request {
    permissions?: Permission[];
  }
}

/**
 * Guards a route on a single permission. Attaches the full resolved set to the
 * request so a handler can make finer-grained decisions without a second query.
 */
export function requirePermission(permission: Permission) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    try {
      const permissions = await resolvePermissions(req.user.userId);
      if (!permissions.includes(permission)) {
        res.status(403).json({
          success: false,
          message: `Forbidden: requires ${permission}`,
        });
        return;
      }
      req.permissions = permissions;
      next();
    } catch (error) {
      res.status(500).json({ success: false, message: 'Could not verify permissions' });
    }
  };
}
