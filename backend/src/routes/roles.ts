import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Role, User } from '../models';
import { authMiddleware } from '../middleware/auth';
import { requirePermission, resolvePermissions } from '../middleware/permissions';
import {
  ALL_PERMISSIONS,
  RESOURCES,
  ACTIONS,
  normalise,
  effectivePermissions,
} from '../utils/permissions';
import { success } from '../utils/response';

const router = Router();

router.use(authMiddleware);

/**
 * GET /roles/me
 *
 * What the signed-in user can do. The dashboard calls this once on load and
 * hides every route, nav item and action button the set does not cover, so an
 * unpermitted control is never rendered rather than rendered-then-rejected.
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const permissions = await resolvePermissions(req.user!.userId);
    const user = await User.findById(req.user!.userId)
      .select('role role_id')
      .populate<{ role_id: { name: string } }>('role_id', 'name')
      .lean();

    res.json(
      success({
        permissions,
        role: user?.role ?? null,
        roleName: (user?.role_id as { name?: string } | undefined)?.name ?? null,
      })
    );
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** The permission vocabulary, so the admin UI can render a matrix without hard-coding it. */
router.get('/catalogue', requirePermission('roles:read'), (_req: Request, res: Response) => {
  res.json(success({ resources: RESOURCES, actions: ACTIONS, permissions: ALL_PERMISSIONS }));
});

router.get('/', requirePermission('roles:read'), async (_req: Request, res: Response) => {
  try {
    const roles = await Role.find().sort({ is_system: -1, name: 1 }).lean();
    const counts = await User.aggregate<{ _id: unknown; count: number }>([
      { $match: { role_id: { $ne: null } } },
      { $group: { _id: '$role_id', count: { $sum: 1 } } },
    ]);
    const byRole = new Map(counts.map((c) => [String(c._id), c.count]));

    res.json(success(roles.map((r) => ({ ...r, user_count: byRole.get(String(r._id)) ?? 0 }))));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', requirePermission('roles:create'), async (req: Request, res: Response) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) {
      res.status(400).json({ success: false, message: 'Role name is required' });
      return;
    }
    if (await Role.findOne({ name })) {
      res.status(409).json({ success: false, message: 'A role with that name already exists' });
      return;
    }

    const role = await Role.create({
      name,
      description: String(req.body?.description || '').trim(),
      permissions: normalise(req.body?.permissions),
    });
    res.status(201).json(success(role, 'Role created'));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** Editing a role moves everyone who holds it. That is the point of roles. */
router.patch('/:id', requirePermission('roles:update'), async (req: Request, res: Response) => {
  try {
    const update: Record<string, unknown> = {};
    if (req.body?.name !== undefined) update.name = String(req.body.name).trim();
    if (req.body?.description !== undefined) {
      update.description = String(req.body.description).trim();
    }
    if (req.body?.permissions !== undefined) update.permissions = normalise(req.body.permissions);

    const role = await Role.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!role) {
      res.status(404).json({ success: false, message: 'Role not found' });
      return;
    }
    res.json(success(role, 'Role updated'));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', requirePermission('roles:delete'), async (req: Request, res: Response) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      res.status(404).json({ success: false, message: 'Role not found' });
      return;
    }
    if (role.is_system) {
      res.status(400).json({ success: false, message: 'Built-in roles cannot be deleted' });
      return;
    }
    const holders = await User.countDocuments({ role_id: role._id });
    if (holders > 0) {
      res.status(409).json({
        success: false,
        message: `${holders} user(s) still hold this role. Reassign them first.`,
      });
      return;
    }

    await role.deleteOne();
    res.json(success({ id: req.params.id }, 'Role deleted'));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// Staff accounts
// ---------------------------------------------------------------------------

/** GET /roles/users — staff accounts, with their effective permissions. */
router.get('/users/list', requirePermission('users:read'), async (_req: Request, res: Response) => {
  try {
    const users = await User.find({ role_id: { $ne: null } })
      .select('name email role role_id permission_overrides created_at')
      .populate<{ role_id: { _id: unknown; name: string; permissions: string[] } }>(
        'role_id',
        'name permissions'
      )
      .sort({ created_at: 1 })
      .lean();

    res.json(
      success(
        users.map((u) => {
          const role = u.role_id as unknown as { name?: string; permissions?: string[] } | null;
          return {
            ...u,
            roleName: role?.name ?? null,
            permissions: effectivePermissions(role?.permissions ?? [], u.permission_overrides ?? {}),
          };
        })
      )
    );
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /roles/users — create or invite a staff account with a starting role.
 * A password may be supplied now, or omitted to create the account in a state
 * where the person must use the password-reset flow to set their own.
 */
router.post('/users', requirePermission('users:create'), async (req: Request, res: Response) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const roleId = req.body?.role_id;

    if (!name || !email) {
      res.status(400).json({ success: false, message: 'Name and email are required' });
      return;
    }
    if (await User.findOne({ email })) {
      res.status(409).json({ success: false, message: 'That email is already registered' });
      return;
    }

    const role = await Role.findById(roleId);
    if (!role) {
      res.status(400).json({ success: false, message: 'A valid role is required' });
      return;
    }

    // No password means no usable login until they set one via reset.
    const rawPassword = String(req.body?.password || '');
    const password_hash = rawPassword
      ? await bcrypt.hash(rawPassword, 10)
      : await bcrypt.hash(`unset:${email}:${Date.now()}`, 10);

    const user = await User.create({
      name,
      email,
      password_hash,
      role: 'admin',
      role_id: role._id,
      email_verified: true,
      permission_overrides: { granted: [], revoked: [] },
    });

    res.status(201).json(
      success(
        {
          _id: user._id,
          name: user.name,
          email: user.email,
          roleName: role.name,
          permissions: effectivePermissions(role.permissions),
          password_set: !!rawPassword,
        },
        rawPassword ? 'Account created' : 'Account created — they must set a password via reset'
      )
    );
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** PATCH /roles/users/:id — change someone's role or their individual overrides. */
router.patch('/users/:id', requirePermission('users:update'), async (req: Request, res: Response) => {
  try {
    const update: Record<string, unknown> = {};

    if (req.body?.role_id !== undefined) {
      const role = await Role.findById(req.body.role_id);
      if (!role) {
        res.status(400).json({ success: false, message: 'Role not found' });
        return;
      }
      update.role_id = role._id;
      // A fresh role replaces the old adjustments rather than silently
      // carrying a revoke from a role that no longer applies.
      update.permission_overrides = { granted: [], revoked: [] };
    }

    if (req.body?.permission_overrides !== undefined) {
      update.permission_overrides = {
        granted: normalise(req.body.permission_overrides?.granted),
        revoked: normalise(req.body.permission_overrides?.revoked),
      };
    }

    const user = await User.findByIdAndUpdate(req.params.id, { $set: update }, { new: true })
      .select('name email role role_id permission_overrides')
      .populate<{ role_id: { name: string; permissions: string[] } }>('role_id', 'name permissions')
      .lean();

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const role = user.role_id as unknown as { name?: string; permissions?: string[] } | null;
    res.json(
      success(
        {
          ...user,
          roleName: role?.name ?? null,
          permissions: effectivePermissions(role?.permissions ?? [], user.permission_overrides ?? {}),
        },
        'User updated'
      )
    );
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
