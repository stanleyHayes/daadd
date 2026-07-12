import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { canAccessRoute } from '@/lib/rbac';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.role || 'end_user';

  // If specific allowed roles are provided, check against them
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check route-level access based on role
  if (!canAccessRoute(userRole, location.pathname)) {
    // End users don't have a dashboard overview; send them to their profile
    if (userRole === 'end_user') {
      return <Navigate to="/dashboard/profile" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
