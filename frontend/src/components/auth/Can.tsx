import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions, type Action, type Resource } from '@/hooks/usePermissions';
import { Skeleton } from '@/components/ui/Skeleton';

interface CanProps {
  /** e.g. "campaigns" */
  resource: Resource;
  /** Defaults to read, which is what gates whether a thing is visible at all. */
  action?: Action;
  children: ReactNode;
  /** Rendered instead when the permission is missing. Usually nothing. */
  fallback?: ReactNode;
}

/**
 * Renders its children only if the user holds the permission.
 *
 * Use it around action buttons and whole panels. The point is that the control
 * is absent rather than disabled: a greyed-out Delete still tells someone the
 * feature exists and invites them to ask why they cannot use it.
 *
 *   <Can resource="campaigns" action="create">
 *     <Button onClick={create}>New campaign</Button>
 *   </Can>
 */
export function Can({ resource, action = 'read', children, fallback = null }: CanProps) {
  const { can, isResolved } = usePermissions();
  if (!isResolved) return <>{fallback}</>;
  return <>{can(resource, action) ? children : fallback}</>;
}

interface RequirePermissionProps {
  resource: Resource;
  action?: Action;
  children: ReactNode;
  /** Where to send someone who lacks the permission. */
  redirectTo?: string;
}

/**
 * Route-level guard. Holds the render until permissions resolve — redirecting
 * first and correcting later would bounce a permitted user off their own page.
 */
export function RequirePermission({
  resource,
  action = 'read',
  children,
  redirectTo = '/dashboard',
}: RequirePermissionProps) {
  const { can, isResolved, isLoading } = usePermissions();

  if (isLoading || !isResolved) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-64" />
        <Skeleton variant="card" className="h-64" />
      </div>
    );
  }

  if (!can(resource, action)) return <Navigate to={redirectTo} replace />;

  return <>{children}</>;
}
