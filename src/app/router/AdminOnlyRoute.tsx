import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Permission } from '@/features/auth/permissions';

export const AdminOnlyRoute: React.FC = () => {
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

  if (!hasPermission(Permission.UsersView)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
};
