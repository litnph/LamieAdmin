import { expect, test, type Page, type Route } from '@playwright/test';

const adminUser = {
  id: '30000000-0000-0000-0000-000000000001',
  email: 'admin@lamie.test',
  userName: 'admin_test',
  fullName: 'Admin Test',
  role: 1,
  roleCode: 'admin',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const menu = [
  {
    id: '40000000-0000-0000-0000-000000000001',
    key: 'orders.list',
    label: 'Đơn hàng từ API',
    description: null,
    path: '/admin/orders',
    iconKey: 'shopping-bag',
    permissionCode: 'orders.view',
    sortOrder: 10,
    openInNewTab: false,
    children: [],
  },
  {
    id: '40000000-0000-0000-0000-000000000002',
    key: 'orders.calendar',
    label: 'Lịch giao từ API',
    description: null,
    path: '/admin/orders/calendar',
    iconKey: 'calendar-days',
    permissionCode: 'orders.view',
    sortOrder: 20,
    openInNewTab: false,
    children: [],
  },
  {
    id: '40000000-0000-0000-0000-000000000003',
    key: 'group.management',
    label: 'Quản lý động',
    description: null,
    path: null,
    iconKey: 'folder',
    permissionCode: null,
    sortOrder: 30,
    openInNewTab: false,
    children: [
      {
        id: '40000000-0000-0000-0000-000000000004',
        key: 'products.list',
        label: 'Sản phẩm động',
        description: null,
        path: '/admin/products',
        iconKey: 'component-name-from-database',
        permissionCode: 'products.view',
        sortOrder: 10,
        openInNewTab: false,
        children: [],
      },
    ],
  },
];

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const installAuth = async (page: Page) => {
  await page.addInitScript(({ user }) => {
    localStorage.setItem('lamie_access_token', 'e2e-access-token');
    localStorage.setItem('lamie_refresh_token', 'e2e-refresh-token');
    localStorage.setItem('lamie_user_json', JSON.stringify(user));
  }, { user: adminUser });
};

const installCommonApi = async (
  page: Page,
  navigationHandler: (route: Route) => Promise<void> | void,
) => {
  await installAuth(page);
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me') return json(route, adminUser);
    if (path === '/api/admin/navigation/me') return navigationHandler(route);
    if (path === '/api/orders') {
      return json(route, {
        items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0,
        hasNext: false, hasPrevious: false,
      });
    }
    if (path === '/api/settings/attributes/channels') return json(route, []);
    return json(route, { success: false, message: `Unhandled ${path}` }, 404);
  });
};

test('Sidebar renders the API tree recursively, resolves icons from source and selects the longest active path', async ({ page }) => {
  await installCommonApi(page, (route) => json(route, menu));

  await page.goto('/admin/orders/calendar');

  await expect(page.getByRole('link', { name: 'Đơn hàng từ API' })).toBeVisible();
  await expect(page.getByText('Quản lý động')).toBeVisible();
  const productLink = page.getByRole('link', { name: 'Sản phẩm động' });
  await expect(productLink).toBeVisible();
  await expect(productLink.locator('svg')).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Lịch giao từ API' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('link', { name: 'Đơn hàng từ API' })).not.toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('link', { name: 'Vai trò & quyền' })).toHaveCount(0);
});

test('Sidebar exposes loading and API-error states without a business-source fallback, then retries', async ({ page }) => {
  let requests = 0;
  await installCommonApi(page, async (route) => {
    requests += 1;
    if (requests === 1) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      return json(route, { message: 'Temporary failure' }, 503);
    }
    return json(route, [{
      ...menu[0],
      key: 'dashboard.remote',
      label: 'Menu API đã phục hồi',
      path: '/admin/dashboard',
    }]);
  });

  await page.goto('/admin/dashboard');
  await expect(page.getByLabel('Đang tải menu điều hướng')).toBeVisible();
  await expect(page.getByText('Không thể tải menu điều hướng.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tổng quan' })).toHaveCount(0);
  await page.getByRole('navigation', { name: 'Menu chính' }).getByRole('button', { name: 'Thử lại' }).click();
  await expect(page.getByRole('link', { name: 'Menu API đã phục hồi' })).toBeVisible();
  await expect(page.getByText('Không thể tải menu điều hướng.')).toHaveCount(0);
});

test('Sidebar shows an explicit empty state when the API returns no accessible navigation', async ({ page }) => {
  await installCommonApi(page, (route) => json(route, []));
  await page.goto('/admin/dashboard');

  await expect(page.getByText('Không có mục điều hướng phù hợp.')).toBeVisible();
});

test('Sidebar closes after dynamic navigation on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installCommonApi(page, (route) => json(route, menu));
  await page.goto('/admin/dashboard');

  await page.getByRole('button', { name: 'Mở menu điều hướng' }).click();
  await page.getByRole('link', { name: 'Đơn hàng từ API' }).click();
  await expect(page.locator('#admin-sidebar').locator('..')).toHaveAttribute('aria-hidden', 'true');
});
