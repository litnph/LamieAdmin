import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { DashboardPage } from '@/app/pages/DashboardPage';
import { ProductListPage } from '@/features/product/pages/ProductListPage';
import { LoginPage } from '@/features/user/pages/LoginPage';
import { LanguagePage } from '@/features/masterdata/pages/LanguagePage';
import { TagPage } from '@/features/masterdata/pages/TagPage';
import { ColorPage } from '@/features/masterdata/pages/ColorPage';
import { CategoryPage } from '@/features/masterdata/pages/CategoryPage';

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
        <Route path="masterdata/languages" element={<LanguagePage />} />
        <Route path="masterdata/tags" element={<TagPage />} />
        <Route path="masterdata/colors" element={<ColorPage />} />
        <Route path="masterdata/categories" element={<CategoryPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};

