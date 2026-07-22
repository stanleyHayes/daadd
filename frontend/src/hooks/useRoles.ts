import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse } from '@/types';

export interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
  is_system: boolean;
  user_count: number;
}

export interface StaffUser {
  _id: string;
  name: string;
  email: string;
  roleName: string | null;
  role_id: { _id: string; name: string } | string | null;
  permission_overrides: { granted: string[]; revoked: string[] };
  /** Resolved server-side: role permissions plus grants, minus revokes. */
  permissions: string[];
  created_at: string;
}

export interface PermissionCatalogue {
  resources: string[];
  actions: string[];
  permissions: string[];
}

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => (await api.get<ApiResponse<Role[]>>('/roles')).data.data,
  });
}

export function usePermissionCatalogue() {
  return useQuery({
    queryKey: ['roles', 'catalogue'],
    staleTime: Infinity, // the vocabulary only changes with a deploy
    queryFn: async () =>
      (await api.get<ApiResponse<PermissionCatalogue>>('/roles/catalogue')).data.data,
  });
}

export function useStaff() {
  return useQuery({
    queryKey: ['roles', 'staff'],
    queryFn: async () => (await api.get<ApiResponse<StaffUser[]>>('/roles/users/list')).data.data,
  });
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['roles'] });
  // Someone's own permissions may have just changed.
  queryClient.invalidateQueries({ queryKey: ['permissions'] });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description: string; permissions: string[] }) =>
      (await api.post<ApiResponse<Role>>('/roles', input)).data.data,
    onSuccess: () => invalidate(queryClient),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Role> & { id: string }) =>
      (await api.patch<ApiResponse<Role>>(`/roles/${id}`, input)).data.data,
    onSuccess: () => invalidate(queryClient),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/roles/${id}`);
      return id;
    },
    onSuccess: () => invalidate(queryClient),
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      email: string;
      role_id: string;
      password?: string;
    }) => (await api.post<ApiResponse<StaffUser>>('/roles/users', input)).data.data,
    onSuccess: () => invalidate(queryClient),
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: {
      id: string;
      role_id?: string;
      permission_overrides?: { granted: string[]; revoked: string[] };
    }) => (await api.patch<ApiResponse<StaffUser>>(`/roles/users/${id}`, input)).data.data,
    onSuccess: () => invalidate(queryClient),
  });
}
