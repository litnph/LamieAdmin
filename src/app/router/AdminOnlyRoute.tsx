import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Permission, type PermissionName } from '@/features/auth/permissions';

type AdminOnlyRouteProps = {
  permission?: PermissionName;
};

/** @deprecated Business routes are generated from the Page Registry and use DynamicRouteElement guards. */
export const AdminOnlyRoute: React.FC<AdminOnlyRouteProps> = ({ permission = Permission.UsersView }) => {
  const { user, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-admin-bg text-sm text-admin-text-secondary" role="status" aria-live="polite">
        Đang tải…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(permission)) {
    return <Navigate to="/admin/unauthorized" replace />;
  }

  return <Outlet />;
};
