import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Can } from '@/components/auth/Can';
import {
  useRoles,
  usePermissionCatalogue,
  useStaff,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useCreateStaff,
  useUpdateStaff,
  type Role,
  type StaffUser,
} from '@/hooks/useRoles';
import { cn, getInitials } from '@/lib/utils';
import { Plus, Trash2, ShieldCheck, Lock, UserPlus, Check } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Roles and staff access.
 *
 * The matrix is the whole point: a role is a set of `resource:action` boxes,
 * and a person is a role plus their own adjustments. Ticking a write box also
 * ticks that row's read, because the server enforces that anyway and a matrix
 * that lets you draw an impossible state is just a lie you find out about
 * after saving.
 */

const ROW_ACTIONS = ['read', 'create', 'update', 'delete'] as const;
type RowAction = (typeof ROW_ACTIONS)[number];

/** Mirrors the server rule so the UI never shows a state the API would reject. */
function togglePermission(current: string[], resource: string, action: RowAction): string[] {
  const key = `${resource}:${action}`;
  const set = new Set(current);

  if (set.has(key)) {
    set.delete(key);
    // Untick read and the writes go with it — they cannot survive alone.
    if (action === 'read') for (const a of ROW_ACTIONS) set.delete(`${resource}:${a}`);
  } else {
    set.add(key);
    if (action !== 'read') set.add(`${resource}:read`);
  }
  return [...set].sort();
}

function PermissionMatrix({
  resources,
  value,
  onChange,
  disabled,
}: {
  resources: string[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const has = (resource: string, action: RowAction) => value.includes(`${resource}:${action}`);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border-color dark:border-slate-800">
            <th className="py-2 pr-4 text-left font-medium text-text-secondary">
              {t('dashboard.roles.resource')}
            </th>
            {ROW_ACTIONS.map((action) => (
              <th
                key={action}
                className="w-20 py-2 text-center font-medium capitalize text-text-secondary"
              >
                {t(`dashboard.roles.actions.${action}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-color dark:divide-slate-800">
          {resources.map((resource) => (
            <tr key={resource}>
              <td className="py-2 pr-4 text-text-primary">
                {t(`dashboard.roles.resources.${resource}`, {
                  defaultValue: resource.replace(/_/g, ' '),
                })}
              </td>
              {ROW_ACTIONS.map((action) => (
                <td key={action} className="py-2 text-center">
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={has(resource, action)}
                    onChange={() => onChange(togglePermission(value, resource, action))}
                    aria-label={`${resource} ${action}`}
                    className="h-4 w-4 rounded border-border-color text-primary-600 focus:ring-primary-500 disabled:opacity-40"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RolesPage() {
  const { t } = useTranslation();
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { data: catalogue } = usePermissionCatalogue();
  const { data: staff = [], isLoading: staffLoading } = useStaff();

  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<string[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [invite, setInvite] = useState<{ name: string; email: string; role_id: string } | null>(
    null
  );
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);

  const resources = catalogue?.resources ?? [];

  useEffect(() => {
    if (selectedRole) setDraftPermissions(selectedRole.permissions);
  }, [selectedRole]);

  const dirty = useMemo(
    () =>
      !!selectedRole &&
      JSON.stringify(draftPermissions) !== JSON.stringify(selectedRole.permissions),
    [selectedRole, draftPermissions]
  );

  const saveRole = async () => {
    if (!selectedRole) return;
    try {
      await updateRole.mutateAsync({ id: selectedRole._id, permissions: draftPermissions });
      toast.success(t('dashboard.roles.roleSaved'));
      setSelectedRole({ ...selectedRole, permissions: draftPermissions });
    } catch {
      toast.error(t('dashboard.roles.saveFailed'));
    }
  };

  const addRole = async () => {
    const name = newRoleName.trim();
    if (!name) return;
    try {
      const role = await createRole.mutateAsync({ name, description: '', permissions: [] });
      toast.success(t('dashboard.roles.roleCreated'));
      setNewRoleName('');
      setSelectedRole(role);
    } catch {
      toast.error(t('dashboard.roles.saveFailed'));
    }
  };

  const removeRole = async (role: Role) => {
    try {
      await deleteRole.mutateAsync(role._id);
      toast.success(t('dashboard.roles.roleDeleted'));
      if (selectedRole?._id === role._id) setSelectedRole(null);
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('dashboard.roles.saveFailed');
      toast.error(message);
    }
  };

  const sendInvite = async () => {
    if (!invite?.name.trim() || !invite.email.trim() || !invite.role_id) return;
    try {
      await createStaff.mutateAsync(invite);
      toast.success(t('dashboard.roles.inviteSent'));
      setInvite(null);
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('dashboard.roles.saveFailed');
      toast.error(message);
    }
  };

  /**
   * A user's boxes are their effective permissions. Ticking or unticking one
   * records it as a personal grant or revoke rather than editing the role, so
   * the change never touches anyone else who holds it.
   */
  const toggleUserPermission = async (user: StaffUser, resource: string, action: RowAction) => {
    const next = togglePermission(user.permissions, resource, action);
    const rolePermissions = new Set(
      user.permissions.filter(
        (p) => !user.permission_overrides.granted.includes(p)
      )
    );

    const granted = next.filter((p) => !rolePermissions.has(p));
    const revoked = [...rolePermissions].filter((p) => !next.includes(p));

    try {
      const updated = await updateStaff.mutateAsync({
        id: user._id,
        permission_overrides: { granted, revoked },
      });
      setEditingUser(updated);
    } catch {
      toast.error(t('dashboard.roles.saveFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('dashboard.roles.title')}</h1>
        <p className="mt-1 text-sm text-text-secondary">{t('dashboard.roles.intro')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Roles list */}
        <Card className="lg:col-span-1">
          <CardHeader
            title={t('dashboard.roles.rolesTitle')}
            subtitle={t('dashboard.roles.rolesSubtitle')}
          />
          {rolesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : (
            <ul className="space-y-1.5">
              {roles.map((role) => (
                <li key={role._id}>
                  <button
                    onClick={() => setSelectedRole(role)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors',
                      selectedRole?._id === role._id
                        ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-900/20'
                        : 'border-border-color bg-card-bg hover:bg-bg-secondary dark:border-slate-800'
                    )}
                  >
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-text-primary">
                          {role.name}
                        </span>
                        {role.is_system && (
                          <Lock
                            className="h-3 w-3 shrink-0 text-text-muted"
                            aria-label={t('dashboard.roles.systemRole')}
                          />
                        )}
                      </span>
                      <span className="block text-xs text-text-secondary">
                        {t('dashboard.roles.summary', {
                          permissions: role.permissions.length,
                          users: role.user_count,
                        })}
                      </span>
                    </span>
                    <Can resource="roles" action="delete">
                      {!role.is_system && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRole(role);
                          }}
                          className="shrink-0 rounded-lg p-1 text-text-muted hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-900/20"
                          aria-label={t('dashboard.common.remove')}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </Can>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Can resource="roles" action="create">
            <div className="mt-4 flex gap-2 border-t border-border-color pt-4 dark:border-slate-800">
              <Input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder={t('dashboard.roles.newRolePlaceholder')}
              />
              <Button onClick={addRole} loading={createRole.isPending} disabled={!newRoleName.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </Can>
        </Card>

        {/* Permission matrix for the selected role */}
        <Card className="lg:col-span-2">
          {selectedRole ? (
            <>
              <CardHeader
                title={selectedRole.name}
                subtitle={
                  selectedRole.description || t('dashboard.roles.noDescription')
                }
                action={
                  <Can resource="roles" action="update">
                    <Button onClick={saveRole} loading={updateRole.isPending} disabled={!dirty}>
                      {t('dashboard.common.save')}
                    </Button>
                  </Can>
                }
              />
              <Can
                resource="roles"
                action="update"
                fallback={
                  <PermissionMatrix
                    resources={resources}
                    value={draftPermissions}
                    onChange={() => undefined}
                    disabled
                  />
                }
              >
                <PermissionMatrix
                  resources={resources}
                  value={draftPermissions}
                  onChange={setDraftPermissions}
                />
              </Can>
            </>
          ) : (
            <EmptyState
              variant="plain"
              icon={<ShieldCheck />}
              title={t('dashboard.roles.pickRoleTitle')}
              description={t('dashboard.roles.pickRoleDesc')}
            />
          )}
        </Card>
      </div>

      {/* Staff */}
      <Card>
        <CardHeader
          title={t('dashboard.roles.staffTitle')}
          subtitle={t('dashboard.roles.staffSubtitle')}
          action={
            <Can resource="users" action="create">
              <Button
                size="sm"
                onClick={() =>
                  setInvite({ name: '', email: '', role_id: roles[0]?._id ?? '' })
                }
              >
                <UserPlus className="mr-1.5 h-4 w-4" /> {t('dashboard.roles.invite')}
              </Button>
            </Can>
          }
        />

        {staffLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : staff.length === 0 ? (
          <EmptyState
            variant="plain"
            icon={<UserPlus />}
            title={t('dashboard.roles.noStaffTitle')}
            description={t('dashboard.roles.noStaffDesc')}
          />
        ) : (
          <ul className="divide-y divide-border-color dark:divide-slate-800">
            {staff.map((user) => (
              <li key={user._id} className="flex items-center gap-3 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  {getInitials(user.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">{user.name}</p>
                  <p className="truncate text-xs text-text-secondary">
                    {user.email} · {user.roleName ?? t('dashboard.roles.noRole')} ·{' '}
                    {t('dashboard.roles.permissionCount', { count: user.permissions.length })}
                  </p>
                </div>
                <Can resource="users" action="update">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingUser(editingUser?._id === user._id ? null : user)}
                  >
                    {editingUser?._id === user._id
                      ? t('dashboard.common.cancel')
                      : t('dashboard.roles.adjust')}
                  </Button>
                </Can>
              </li>
            ))}
          </ul>
        )}

        {/* Per-user adjustments */}
        {editingUser && (
          <div className="mt-5 border-t border-border-color pt-5 dark:border-slate-800">
            <p className="mb-1 text-sm font-semibold text-text-primary">
              {t('dashboard.roles.adjusting', { name: editingUser.name })}
            </p>
            <p className="mb-4 text-xs text-text-secondary">
              {t('dashboard.roles.adjustHint', {
                role: editingUser.roleName ?? t('dashboard.roles.noRole'),
              })}
            </p>
            <PermissionMatrix
              resources={resources}
              value={editingUser.permissions}
              onChange={() => undefined}
              disabled={updateStaff.isPending}
            />
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {resources.map((resource) => (
                <div key={resource} className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="w-32 shrink-0 text-text-secondary">
                    {resource.replace(/_/g, ' ')}
                  </span>
                  {ROW_ACTIONS.map((action) => {
                    const active = editingUser.permissions.includes(`${resource}:${action}`);
                    return (
                      <button
                        key={action}
                        onClick={() => toggleUserPermission(editingUser, resource, action)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition-colors',
                          active
                            ? 'bg-primary-600 text-white'
                            : 'bg-bg-secondary text-text-muted hover:text-text-primary dark:bg-slate-800'
                        )}
                      >
                        {active && <Check className="h-3 w-3" />}
                        {t(`dashboard.roles.actions.${action}`)}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invite */}
        {invite && (
          <div className="mt-5 border-t border-border-color pt-5 dark:border-slate-800">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label={t('dashboard.roles.inviteName')}
                value={invite.name}
                onChange={(e) => setInvite({ ...invite, name: e.target.value })}
              />
              <Input
                label={t('dashboard.roles.inviteEmail')}
                type="email"
                value={invite.email}
                onChange={(e) => setInvite({ ...invite, email: e.target.value })}
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  {t('dashboard.roles.inviteRole')}
                </label>
                <select
                  value={invite.role_id}
                  onChange={(e) => setInvite({ ...invite, role_id: e.target.value })}
                  className="block w-full rounded-md border border-border-color bg-card-bg px-3 py-2 text-sm text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {roles.map((role) => (
                    <option key={role._id} value={role._id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-3 text-xs text-text-muted">{t('dashboard.roles.inviteHint')}</p>
            <div className="mt-4 flex gap-2">
              <Button onClick={sendInvite} loading={createStaff.isPending}>
                {t('dashboard.roles.invite')}
              </Button>
              <Button variant="ghost" onClick={() => setInvite(null)}>
                {t('dashboard.common.cancel')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
