import React, { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ProtectedRoute } from '@/app/router/ProtectedRoute';
import type { ResolvedDynamicRoute } from '@/app/router/dynamicRouteBuilder';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useNavigation } from '@/features/navigation/context/NavigationContext';
import { AdminLayout } from '@/layouts/AdminLayout';

const LoginPage = lazy(() => import('@/features/user/pages/LoginPage')
  .then((module) => ({ default: module.LoginPage })));

const pageComponentCache = new Map<string, LazyExoticComponent<ComponentType>>();

const getLazyPageComponent = (route: ResolvedDynamicRoute): LazyExoticComponent<ComponentType> => {
  const cached = pageComponentCache.get(route.pageKey);
  if (cached) return cached;
  const component = lazy(route.page.lazyComponent);
  pageComponentCache.set(route.pageKey, component);
  return component;
};

const RouteLoading: React.FC = () => (
  <div
    className="flex min-h-48 items-center justify-center text-sm text-admin-text-secondary"
    role="status"
    aria-live="polite"
  >
    Đang tải màn hình…
  </div>
);

const RouteBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<RouteLoading />}>{children}</Suspense>
);

const MessagePage: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  actionPath?: string;
}> = ({ title, description, actionLabel = 'Về trang chính', actionPath = '/admin' }) => (
  <section className="mx-auto flex min-h-64 max-w-xl flex-col items-center justify-center text-center">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-text-muted">Lamie Admin</p>
    <h1 className="mt-3 text-2xl font-semibold text-admin-text-primary">{title}</h1>
    <p className="mt-2 text-sm leading-6 text-admin-text-secondary">{description}</p>
    <Link
      to={actionPath}
      className="mt-6 inline-flex min-h-11 items-center rounded-admin-control bg-admin-primary px-4 py-2 text-sm font-semibold text-white"
    >
      {actionLabel}
    </Link>
  </section>
);

const UnauthorizedPage: React.FC = () => (
  <MessagePage
    title="Không có quyền truy cập"
    description="Tài khoản hiện tại không có đủ quyền để mở màn hình này."
  />
);

const NotFoundPage: React.FC = () => (
  <MessagePage
    title="Không tìm thấy màn hình"
    description="Đường dẫn không tồn tại hoặc chức năng này chưa được cấp cho tài khoản hiện tại."
  />
);

const RouteUnavailablePage: React.FC = () => {
  const { refreshNavigation } = useNavigation();
  return (
    <section className="mx-auto flex min-h-64 max-w-xl flex-col items-center justify-center text-center">
      <h1 className="text-xl font-semibold text-admin-text-primary">Chưa thể tải cấu hình điều hướng</h1>
      <p className="mt-2 text-sm text-admin-text-secondary">Vui lòng thử tải lại cấu hình màn hình.</p>
      <button
        type="button"
        onClick={refreshNavigation}
        className="mt-6 min-h-11 rounded-admin-control bg-admin-primary px-4 py-2 text-sm font-semibold text-white"
      >
        Thử lại
      </button>
    </section>
  );
};

const DynamicRouteElement: React.FC<{ route: ResolvedDynamicRoute }> = ({ route }) => {
  const { loading, user, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) return <RouteLoading />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (route.requiredPermissions.some((permission) => !hasPermission(permission))) {
    return <Navigate to="/admin/unauthorized" replace state={{ from: location.pathname }} />;
  }

  const Page = getLazyPageComponent(route);
  return <RouteBoundary><Page /></RouteBoundary>;
};

const DynamicRouteFallback: React.FC = () => {
  const { routesLoading, routesError } = useNavigation();
  if (routesLoading) return <RouteLoading />;
  if (routesError) return <RouteUnavailablePage />;
  return <NotFoundPage />;
};

const AdminIndex: React.FC = () => {
  const { routes, routesLoading, routesError } = useNavigation();
  if (routesLoading) return <RouteLoading />;
  if (routesError) return <RouteUnavailablePage />;
  return <Navigate to={routes[0]?.path ?? '/admin/not-found'} replace />;
};

export const AppRouter: React.FC = () => {
  const { routes } = useNavigation();

  return (
    <Routes>
      <Route path="/login" element={<RouteBoundary><LoginPage /></RouteBoundary>} />

      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminIndex />} />
          <Route path="unauthorized" element={<UnauthorizedPage />} />
          <Route path="not-found" element={<NotFoundPage />} />

          <Route path="settings/attributes" element={<Navigate to="/admin/settings/attributes/categories" replace />} />
          <Route path="masterdata/languages" element={<Navigate to="/admin/settings/attributes/languages" replace />} />
          <Route path="masterdata/tags" element={<Navigate to="/admin/settings/attributes/tags" replace />} />
          <Route path="masterdata/colors" element={<Navigate to="/admin/settings/attributes/colors" replace />} />
          <Route path="masterdata/categories" element={<Navigate to="/admin/settings/attributes/categories" replace />} />

          {routes.map((route) => (
            <Route
              key={route.id}
              path={route.relativePath}
              element={<DynamicRouteElement route={route} />}
            />
          ))}
          <Route path="*" element={<DynamicRouteFallback />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
