import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse } from '@/types';
import { useAuthStore } from '@/stores/auth.store';

/**
 * What the signed-in user is allowed to do, resolved server-side from their
 * role plus any individual adjustments.
 *
 * This is the source of truth for what the dashboard renders. A control the
 * user cannot use is not disabled — it is not mounted, so an unpermitted
 * action never appears as something they could try.
 */
export interface MyPermissions {
  permissions: string[];
  role: string | null;
  roleName: string | null;
}

export type Resource = string;
export type Action = 'read' | 'create' | 'update' | 'delete';

export function usePermissions() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const query = useQuery({
    queryKey: ['permissions', 'me'],
    enabled: isAuthenticated,
    // Short, so an admin revoking access takes effect quickly without a reload.
    staleTime: 60 * 1000,
    queryFn: async () => {
      const res = await api.get<ApiResponse<MyPermissions>>('/roles/me');
      return res.data.data;
    },
  });

  const permissions = query.data?.permissions ?? [];

  /**
   * While permissions are still loading we answer `false`. Rendering a button
   * and then removing it is worse than showing it a moment late.
   */
  const can = (resource: Resource, action: Action = 'read') =>
    permissions.includes(`${resource}:${action}`);

  const canAny = (resource: Resource) => permissions.some((p) => p.startsWith(`${resource}:`));

  return {
    ...query,
    permissions,
    roleName: query.data?.roleName ?? null,
    can,
    canAny,
    /** True once we have a real answer, so callers can hold back a redirect. */
    isResolved: query.isSuccess || query.isError,
  };
}
