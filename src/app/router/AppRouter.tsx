import React, { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ProtectedRoute } from '@/app/router/ProtectedRoute';
import { AdminOnlyRoute } from '@/app/router/AdminOnlyRoute';

const DashboardPage = lazy(() => import('@/app/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const ProductListPage = lazy(() => import('@/features/product/pages/ProductListPage').then((module) => ({ default: module.ProductListPage })));
const ProductCreatePage = lazy(() => import('@/features/product/pages/ProductCreatePage').then((module) => ({ default: module.ProductCreatePage })));
const ProductEditPage = lazy(() => import('@/features/product/pages/ProductEditPage').then((module) => ({ default: module.ProductEditPage })));
const LoginPage = lazy(() => import('@/features/user/pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const AttributesPage = lazy(() => import('@/features/settings/attributes/pages/AttributesPage').then((module) => ({ default: module.AttributesPage })));
const OrderListPage = lazy(() => import('@/features/orders/pages/OrderListPage').then((module) => ({ default: module.OrderListPage })));
const OrderDetailPage = lazy(() => import('@/features/orders/pages/OrderDetailPage').then((module) => ({ default: module.OrderDetailPage })));
const OrderCreatePage = lazy(() => import('@/features/orders/pages/OrderEditorPage').then((module) => ({ default: module.OrderCreatePage })));
const OrderEditPage = lazy(() => import('@/features/orders/pages/OrderEditorPage').then((module) => ({ default: module.OrderEditPage })));
const OrdersCalendarPage = lazy(() => import('@/features/orders/pages/OrdersCalendarPage').then((module) => ({ default: module.OrdersCalendarPage })));
const ChannelsPage = lazy(() => import('@/features/settings/channels/pages/ChannelsPage').then((module) => ({ default: module.ChannelsPage })));
const UsersListPage = lazy(() => import('@/features/users/pages/UsersListPage').then((module) => ({ default: module.UsersListPage })));
const UserCreatePage = lazy(() => import('@/features/users/pages/UserEditorPage').then((module) => ({ default: module.UserCreatePage })));
const UserEditPage = lazy(() => import('@/features/users/pages/UserEditorPage').then((module) => ({ default: module.UserEditPage })));
const CustomerListPage = lazy(() => import('@/features/customers/pages/CustomerListPage').then((module) => ({ default: module.CustomerListPage })));
const CustomerDetailPage = lazy(() => import('@/features/customers/pages/CustomerDetailPage').then((module) => ({ default: module.CustomerDetailPage })));

const RouteLoading: React.FC = () => (
  <div className="flex min-h-48 items-center justify-center text-sm text-admin-text-secondary" role="status" aria-live="polite">
    Đang tải màn hình
  </div>
);

const RouteBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<RouteLoading />}>{children}</Suspense>
);

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<RouteBoundary><LoginPage /></RouteBoundary>} />

      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<RouteBoundary><DashboardPage /></RouteBoundary>} />
          <Route path="dashboard" element={<RouteBoundary><DashboardPage /></RouteBoundary>} />

          <Route path="orders" element={<RouteBoundary><OrderListPage /></RouteBoundary>} />
          <Route path="orders/new" element={<RouteBoundary><OrderCreatePage /></RouteBoundary>} />
          <Route path="orders/calendar" element={<RouteBoundary><OrdersCalendarPage /></RouteBoundary>} />
          <Route path="orders/:id" element={<RouteBoundary><OrderDetailPage /></RouteBoundary>} />
          <Route path="orders/:id/edit" element={<RouteBoundary><OrderEditPage /></RouteBoundary>} />

          <Route path="customers" element={<RouteBoundary><CustomerListPage /></RouteBoundary>} />
          <Route path="customers/:id" element={<RouteBoundary><CustomerDetailPage /></RouteBoundary>} />

          <Route path="settings/channels" element={<RouteBoundary><ChannelsPage /></RouteBoundary>} />

          <Route path="products" element={<RouteBoundary><ProductListPage /></RouteBoundary>} />
          <Route path="products/create" element={<RouteBoundary><ProductCreatePage /></RouteBoundary>} />
          <Route path="products/:id/edit" element={<RouteBoundary><ProductEditPage /></RouteBoundary>} />

          <Route path="settings/attributes" element={<Navigate to="/admin/settings/attributes/categories" replace />} />
          <Route path="settings/attributes/:attributeKey" element={<RouteBoundary><AttributesPage /></RouteBoundary>} />

          <Route path="masterdata/languages" element={<Navigate to="/admin/settings/attributes/languages" replace />} />
          <Route path="masterdata/tags" element={<Navigate to="/admin/settings/attributes/tags" replace />} />
          <Route path="masterdata/colors" element={<Navigate to="/admin/settings/attributes/colors" replace />} />
          <Route path="masterdata/categories" element={<Navigate to="/admin/settings/attributes/categories" replace />} />

          <Route element={<AdminOnlyRoute />}>
            <Route path="users" element={<RouteBoundary><UsersListPage /></RouteBoundary>} />
            <Route path="users/new" element={<RouteBoundary><UserCreatePage /></RouteBoundary>} />
            <Route path="users/:id/edit" element={<RouteBoundary><UserEditPage /></RouteBoundary>} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};
