import React, { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { useTeamMembers, useInviteMember, useRemoveMember, useUpdateRole, useTeamAuditLog } from '@/hooks/useTeam';
import { useCampaigns } from '@/hooks/useCampaigns';
import { formatDate, getInitials } from '@/lib/utils';
import { Mail, UserPlus, Trash2, Clock, AlertTriangle, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageTransition } from '@/components/ui/PageTransition';
import { hasPermission } from '@/lib/rbac';
import { useAuthStore } from '@/stores/auth.store';
import { Skeleton, SkeletonTable, SkeletonCard, SkeletonList } from '@/components/ui/Skeleton';

const roleConfig = {
  viewer: { label: 'Viewer', variant: 'gray' as const },
  editor: { label: 'Editor', variant: 'blue' as const },
  admin: { label: 'Admin', variant: 'purple' as const },
};

export function TeamPage() {
  const [campaignId, setCampaignId] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const authUser = useAuthStore((s) => s.user);
  const userRole = authUser?.role || 'end_user';
  const canInvite = hasPermission(userRole, 'TEAM_INVITE');
  const canChangeRole = hasPermission(userRole, 'TEAM_CHANGE_ROLE');
  const canRemove = hasPermission(userRole, 'TEAM_REMOVE');

  const { data: campaignsData } = useCampaigns();
  const campaigns = campaignsData?.data || [];

  const { data: members, isLoading, error } = useTeamMembers(campaignId || undefined);
  const { data: auditLog, isLoading: logLoading } = useTeamAuditLog(campaignId || undefined);
  const inviteMutation = useInviteMember();
  const removeMutation = useRemoveMember();
  const updateRoleMutation = useUpdateRole();

  const teamMembers = members || [];
  const logs = auditLog || [];

  const handleInvite = async () => {
    if (!inviteEmail || !campaignId) return;
    try {
      await inviteMutation.mutateAsync({ email: inviteEmail, role: inviteRole, campaign_id: campaignId });
      toast.success('Invitation sent!');
      setInviteEmail('');
    } catch {
      toast.error('Failed to send invitation');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeMutation.mutateAsync(id);
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await updateRoleMutation.mutateAsync({ memberId, role: newRole });
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    }
  };

  return (
    <PageTransition>
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Team Management</h1>
        <p className="page-subtitle">Manage team members and their permissions</p>
      </div>

      <div className="w-56">
        <Select
          label="Campaign"
          placeholder="Select a campaign"
          options={campaigns.map((c) => ({ value: c.id, label: c.name }))}
          value={campaignId}
          onChange={setCampaignId}
        />
      </div>

      {!campaignId ? (
        <Card>
          <div className="text-center py-16">
            <Users className="h-10 w-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Select a Campaign</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">Choose a campaign above to manage its team.</p>
          </div>
        </Card>
      ) : isLoading ? (
        <div className="space-y-6">
          <SkeletonCard>
            <Skeleton variant="text" className="h-5 w-48 mb-4" />
            <div className="flex flex-col sm:flex-row gap-3">
              <Skeleton variant="text" className="h-10 flex-1" />
              <Skeleton variant="text" className="h-10 w-36" />
              <Skeleton variant="button" className="h-10 w-28" />
            </div>
          </SkeletonCard>
          <SkeletonCard>
            <Skeleton variant="text" className="h-5 w-40 mb-4" />
            <SkeletonTable rows={4} columns={5} />
          </SkeletonCard>
          <SkeletonCard>
            <Skeleton variant="text" className="h-5 w-32 mb-4" />
            <SkeletonList items={3} />
          </SkeletonCard>
        </div>
      ) : error ? (
        <Card>
          <div className="text-center py-12">
            <AlertTriangle className="h-8 w-8 text-danger-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-slate-400">Failed to load team data. Please try again later.</p>
          </div>
        </Card>
      ) : (
        <>
          {canInvite && (
            <Card>
              <CardHeader title="Invite Team Member" />
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
                    <input
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-3 py-2.5 text-sm dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="sm:w-36">
                  <Select
                    label="Role"
                    options={[
                      { value: 'viewer', label: 'Viewer' },
                      { value: 'editor', label: 'Editor' },
                      { value: 'admin', label: 'Admin' },
                    ]}
                    value={inviteRole}
                    onChange={setInviteRole}
                  />
                </div>
                <div className="sm:self-end">
                  <Button onClick={handleInvite} loading={inviteMutation.isPending} icon={<UserPlus className="h-4 w-4" />} className="w-full sm:w-auto whitespace-nowrap">
                    Send Invite
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Current Team" />
            {teamMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-10 w-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No Team Members</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">Invite team members to collaborate on this campaign.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                  <thead className="bg-gray-50 dark:bg-slate-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Member</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Joined</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {teamMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 text-xs font-bold">
                              {getInitials(member.name)}
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{member.email}</td>
                        <td className="px-4 py-3">
                          {canChangeRole ? (
                            <Select
                              options={[
                                { value: 'viewer', label: 'Viewer' },
                                { value: 'editor', label: 'Editor' },
                                { value: 'admin', label: 'Admin' },
                              ]}
                              value={member.role}
                              onChange={(v) => handleRoleChange(member.id, v)}
                              size="sm"
                              fullWidth={false}
                              className="w-28"
                            />
                          ) : (
                            <Badge variant={roleConfig[member.role as keyof typeof roleConfig]?.variant || 'gray'}>
                              {roleConfig[member.role as keyof typeof roleConfig]?.label || member.role}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{formatDate(member.joined_at)}</td>
                        <td className="px-4 py-3">
                          {canRemove && (
                            <Button variant="ghost" size="sm" onClick={() => handleRemove(member.id)} icon={<Trash2 className="h-4 w-4 text-danger-500" />}>
                              Remove
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Audit Log" />
            {logLoading ? (
              <SkeletonTable rows={3} columns={5} />
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-gray-400 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No activity yet</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm">
                  Changes to campaigns, roles, and settings will appear here as they happen.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                  <thead className="bg-gray-50 dark:bg-slate-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Who</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Old Value</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">New Value</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{log.user_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-slate-300">{log.action}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{log.old_value || '--'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">{log.new_value}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{formatDate(log.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
    </PageTransition>
  );
}
