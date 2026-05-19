import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { DashboardPage } from '@/app/pages/DashboardPage';
import { ProductListPage } from '@/features/product/pages/ProductListPage';
import { ProductCreatePage } from '@/features/product/pages/ProductCreatePage';
import { ProductEditPage } from '@/features/product/pages/ProductEditPage';
import { LoginPage } from '@/features/user/pages/LoginPage';
import { AttributesPage } from '@/features/settings/attributes/pages/AttributesPage';
import { ProtectedRoute } from '@/app/router/ProtectedRoute';
import { AdminOnlyRoute } from '@/app/router/AdminOnlyRoute';
import { OrderListPage } from '@/features/orders/pages/OrderListPage';
import { OrderDetailPage } from '@/features/orders/pages/OrderDetailPage';
import { OrderCreatePage, OrderEditPage } from '@/features/orders/pages/OrderEditorPage';
import { OrdersCalendarPage } from '@/features/orders/pages/OrdersCalendarPage';
import { ChannelsPage } from '@/features/settings/channels/pages/ChannelsPage';
import { UsersListPage } from '@/features/users/pages/UsersListPage';
import { UserCreatePage, UserEditPage } from '@/features/users/pages/UserEditorPage';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />

          <Route path="orders" element={<OrderListPage />} />
          <Route path="orders/new" element={<OrderCreatePage />} />
          <Route path="orders/calendar" element={<OrdersCalendarPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="orders/:id/edit" element={<OrderEditPage />} />

          <Route path="settings/channels" element={<ChannelsPage />} />

          <Route path="products" element={<ProductListPage />} />
          <Route path="products/create" element={<ProductCreatePage />} />
          <Route path="products/:id/edit" element={<ProductEditPage />} />

          <Route path="settings/attributes" element={<Navigate to="/admin/settings/attributes/categories" replace />} />
          <Route path="settings/attributes/:attributeKey" element={<AttributesPage />} />

          <Route path="masterdata/languages" element={<Navigate to="/admin/settings/attributes/languages" replace />} />
          <Route path="masterdata/tags" element={<Navigate to="/admin/settings/attributes/tags" replace />} />
          <Route path="masterdata/colors" element={<Navigate to="/admin/settings/attributes/colors" replace />} />
          <Route path="masterdata/categories" element={<Navigate to="/admin/settings/attributes/categories" replace />} />

          <Route element={<AdminOnlyRoute />}>
            <Route path="users" element={<UsersListPage />} />
            <Route path="users/new" element={<UserCreatePage />} />
            <Route path="users/:id/edit" element={<UserEditPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};
