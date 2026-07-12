import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { TeamMember, AuditLogEntry, ApiResponse } from '@/types';

export function useTeamMembers(campaignId?: string) {
  return useQuery({
    queryKey: ['team', campaignId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<TeamMember[]>>(`/teams/campaign/${campaignId}`);
      return res.data.data;
    },
    enabled: !!campaignId,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; role: string; campaign_id: string }) => {
      const res = await api.post('/teams/invite', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const res = await api.patch(`/teams/${memberId}/role`, { role });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/teams/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
    },
  });
}

export function useTeamAuditLog(campaignId?: string) {
  return useQuery({
    queryKey: ['teamAuditLog', campaignId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<AuditLogEntry[]>>(`/teams/audit-log/${campaignId}`);
      return res.data.data;
    },
    enabled: !!campaignId,
  });
}
