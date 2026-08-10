import { expect, test, type Page, type Route } from '@playwright/test';

const baseUser = {
  id: '30000000-0000-0000-0000-000000000001',
  email: 'admin@lamie.test',
  userName: 'admin_test',
  fullName: 'Admin Test',
  role: 1,
  roleCode: 'admin',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const routeRecord = {
  id: '50000000-0000-0000-0000-000000000001',
  key: 'orders.live',
  moduleKey: 'orders',
  pageKey: 'orders.list',
  path: '/admin/live-orders',
  permissionCode: 'orders.view',
  sortOrder: 10,
};

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const installApi = async (
  page: Page,
  routes: unknown,
  permissions: string[],
  routeStatus = 200,
) => {
  const user = { ...baseUser, permissions };
  await page.addInitScript(({ currentUser }) => {
    localStorage.setItem('lamie_access_token', 'e2e-access-token');
    localStorage.setItem('lamie_refresh_token', 'e2e-refresh-token');
    localStorage.setItem('lamie_user_json', JSON.stringify(currentUser));
  }, { currentUser: user });
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me') return json(route, user);
    if (path === '/api/admin/navigation/me/routes') return json(route, routes, routeStatus);
    if (path === '/api/admin/navigation/me') return json(route, []);
    if (path === '/api/orders') {
      return json(route, {
        items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0,
        hasNext: false, hasPrevious: false,
      });
    }
    return json(route, { success: false, message: `Unhandled ${path}` }, 404);
  });
};

test('API paths build business routes while components remain source-owned', async ({ page }) => {
  await installApi(page, [routeRecord], ['orders.view']);
  await page.goto('/admin/live-orders');

  await expect(page).toHaveURL(/\/admin\/live-orders$/);
  await expect(page.getByRole('heading', { name: 'Đơn hàng', exact: true })).toBeVisible();
});

test('Admin index follows the first accessible dynamic route without a business-path constant', async ({ page }) => {
  await installApi(page, [routeRecord], ['orders.view']);
  await page.goto('/admin');

  await expect(page).toHaveURL(/\/admin\/live-orders$/);
  await expect(page.getByRole('heading', { name: 'Đơn hàng', exact: true })).toBeVisible();
});

test('route guard enforces both the source page permission and the navigation permission', async ({ page }) => {
  await installApi(page, [{ ...routeRecord, permissionCode: 'roles.view' }], ['orders.view']);
  await page.goto('/admin/live-orders');

  await expect(page).toHaveURL(/\/admin\/unauthorized$/);
  await expect(page.getByRole('heading', { name: 'Không có quyền truy cập' })).toBeVisible();
});

test('database metadata cannot weaken the permission declared by the source page', async ({ page }) => {
  await installApi(page, [{ ...routeRecord, permissionCode: null }], []);
  await page.goto('/admin/live-orders');

  await expect(page).toHaveURL(/\/admin\/unauthorized$/);
  await expect(page.getByRole('heading', { name: 'Không có quyền truy cập' })).toBeVisible();
});

test('missing page records are skipped safely and use the not-found fallback', async ({ page }) => {
  await installApi(page, [{ ...routeRecord, pageKey: 'database.component.name' }], ['orders.view']);
  await page.goto('/admin/live-orders');

  await expect(page.getByRole('heading', { name: 'Không tìm thấy màn hình' })).toBeVisible();
});

test('route builder detects reserved, exact and parameter-shape conflicts deterministically', async ({ page }) => {
  await page.goto('/login');
  const result = await page.evaluate(async () => {
    const builderUrl = '/src/app/router/dynamicRouteBuilder.ts';
    const builder = await import(/* @vite-ignore */ builderUrl);
    const make = (key: string, path: string, sortOrder: number) => ({
      id: key,
      key,
      moduleKey: 'orders',
      pageKey: 'orders.detail',
      path,
      permissionCode: 'orders.view',
      sortOrder,
    });
    const built = builder.buildDynamicRoutes([
      make('first', '/admin/orders/:firstId', 1),
      make('second', '/admin/orders/:secondId', 2),
      make('reserved', '/admin/unauthorized', 3),
    ], { reservedPaths: builder.PLATFORM_ADMIN_ROUTE_PATHS });
    return {
      routeKeys: built.routes.map((route: { key: string }) => route.key),
      diagnosticCodes: built.diagnostics.map((diagnostic: { code: string }) => diagnostic.code),
    };
  });

  expect(result.routeKeys).toEqual(['first']);
  expect(result.diagnosticCodes).toEqual(['route-conflict', 'route-conflict']);
});

test('route API failure fails closed with an explicit retry state', async ({ page }) => {
  await installApi(page, { message: 'Temporary failure' }, ['dashboard.view'], 503);
  await page.goto('/admin/dashboard');

  await expect(page.getByRole('heading', { name: 'Chưa thể tải cấu hình điều hướng' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Thử lại' })).toBeVisible();
});
