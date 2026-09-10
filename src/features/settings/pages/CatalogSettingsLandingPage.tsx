import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { SettingsStatus } from '@/features/settings/components/SettingsShell';

export const CatalogSettingsLandingPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const destination = [
    ['ingredients.view', '/admin/ingredients'],
    ['inventory.view', '/admin/settings/catalog/inventory'],
    ['settings.view', '/admin/settings/attributes/categories'],
    ['channels.view', '/admin/settings/channels'],
  ].find(([permission]) => hasPermission(permission))?.[1];

  if (destination) return <Navigate to={destination} replace />;

  return (
    <SettingsStatus kind="error">
      Tài khoản có quyền mở Cài đặt danh mục nhưng chưa được cấp quyền xem bất kỳ nhóm dữ liệu nào.
    </SettingsStatus>
  );
};
