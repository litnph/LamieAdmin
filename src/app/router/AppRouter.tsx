import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { DashboardPage } from '@/app/pages/DashboardPage';
import { ProductListPage } from '@/features/product/pages/ProductListPage';
import { LoginPage } from '@/features/user/pages/LoginPage';
import { AttributesPage } from '@/features/settings/attributes/pages/AttributesPage';

export const AppRouter: React.FC = () => {
  const isAuthenticated = true;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={() => {}} />} />

      <Route
        path="/admin"
        element={
          isAuthenticated ? (
            <AdminLayout />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products" element={<ProductListPage />} />

        <Route path="settings/attributes" element={<Navigate to="/admin/settings/attributes/categories" replace />} />
        <Route path="settings/attributes/:attributeKey" element={<AttributesPage />} />

        {/* Backward compatible routes */}
        <Route path="masterdata/languages" element={<Navigate to="/admin/settings/attributes/languages" replace />} />
        <Route path="masterdata/tags" element={<Navigate to="/admin/settings/attributes/tags" replace />} />
        <Route path="masterdata/colors" element={<Navigate to="/admin/settings/attributes/colors" replace />} />
        <Route path="masterdata/categories" element={<Navigate to="/admin/settings/attributes/categories" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};

