import { expect, test, type Page, type Route } from '@playwright/test';

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const installSession = async (
  page: Page,
  permissions: string[],
  routes: Array<Record<string, unknown>>,
  apiHandler: (route: Route, path: string) => Promise<boolean> | boolean,
  menu: Array<Record<string, unknown>> = [],
) => {
  const user = {
    id: '30000000-0000-0000-0000-000000000081',
    email: 'workspace@lamie.test',
    userName: 'workspace',
    fullName: 'Workspace User',
    role: 2,
    roleCode: 'manager',
    permissions,
    isActive: true,
  };
  await page.addInitScript(({ currentUser }) => {
    localStorage.setItem('lamie_access_token', 'e2e-access-token');
    localStorage.setItem('lamie_refresh_token', 'e2e-refresh-token');
    localStorage.setItem('lamie_user_json', JSON.stringify(currentUser));
  }, { currentUser: user });
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me') return json(route, user);
    if (path === '/api/admin/navigation/me/routes') return json(route, routes);
    if (path === '/api/admin/navigation/me') return json(route, menu);
    if (await apiHandler(route, path)) return;
    return json(route, { message: `Unhandled ${route.request().method()} ${path}` }, 404);
  });
};

test('Việc cần làm defaults to preparation and uses the unpaginated pending total for its badge', async ({ page }) => {
  const routes = [
    {
      id: 'tasks-route', key: 'tasks.workspace', moduleKey: 'ingredients', pageKey: 'ingredients.tasks',
      path: '/admin/tasks', permissionCode: 'tasks.view', sortOrder: 10, activeMenuKey: 'tasks.workspace',
    },
  ];
  const taskItems = Array.from({ length: 20 }, (_, index) => ({
    id: `task-${index + 1}`,
    stockUnitId: `stock-${index + 1}`,
    inventoryItemId: `item-${index + 1}`,
    inventoryItemCode: `ITEM_${index + 1}`,
    inventoryItemName: `Mặt hàng ${index + 1}`,
    sizeName: null,
    unitName: 'Cái',
    unitSymbol: 'cái',
    currentQuantity: 2,
    lowStockThreshold: 5,
    stockStatus: 2,
    updatedAt: '2026-08-30T00:00:00Z',
  }));

  await installSession(
    page,
    ['tasks.view', 'ingredient-reports.view', 'inventory.view'],
    routes,
    (route, path) => {
      if (path === '/api/inventory/replenishment-tasks') {
        const filtered = new URL(route.request().url()).searchParams.has('search');
        return json(route, {
          items: filtered ? [] : taskItems,
          totalCount: filtered ? 0 : 20,
          pendingCount: 35,
          page: 1,
          pageSize: 20,
          totalPages: filtered ? 0 : 1,
          hasNext: false, hasPrevious: false,
        }).then(() => true);
      }
      if (path === '/api/reports/ingredient-demand') {
        return json(route, {
          period: { from: '2026-08-30', to: '2026-08-30', timeZone: 'Asia/Ho_Chi_Minh', dateBasis: 'DeliveryAt' },
          generatedAt: '2026-08-30T00:00:00Z', statuses: [1, 2], summary: [],
          details: { items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0, hasNext: false, hasPrevious: false },
          hasLegacyRecipeFallback: false,
        }).then(() => true);
      }
      return false;
    },
  );

  await page.goto('/admin/tasks');
  await expect(page.getByRole('tab', { name: 'Nguyên liệu cần chuẩn bị' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByLabel('35 việc nhập hàng chưa hoàn thành')).toBeVisible();
  await page.getByRole('tab', { name: /Việc nhập hàng/ }).click();
  await expect(page.getByText('Mặt hàng 20')).toBeVisible();
  await page.getByLabel('Tìm mặt hàng cần nhập').fill('không có');
  await page.getByRole('button', { name: 'Tìm kiếm' }).click();
  await expect(page.getByText('Không có việc nhập hàng đang chờ')).toBeVisible();
  await expect(page.getByLabel('35 việc nhập hàng chưa hoàn thành')).toBeVisible();
});

test('legacy preparation URL keeps its granular permission and activates the visible Việc cần làm menu', async ({ page }) => {
  const routes = [
    {
      id: 'demand-route', key: 'ingredients.demand', moduleKey: 'ingredients', pageKey: 'ingredients.demand',
      path: '/admin/ingredients/demand', permissionCode: 'ingredient-reports.view', sortOrder: 10,
      activeMenuKey: 'tasks.workspace',
    },
  ];
  const menu = [{
    id: 'tasks-menu', key: 'tasks.workspace', label: 'Việc cần làm', description: null,
    path: '/admin/tasks', iconKey: 'list-checks', permissionCode: 'tasks.view', sortOrder: 10,
    openInNewTab: false, children: [],
  }];
  await installSession(
    page,
    ['tasks.view', 'ingredient-reports.view'],
    routes,
    (route, path) => {
      if (path !== '/api/reports/ingredient-demand') return false;
      return json(route, {
        period: { from: '2026-08-30', to: '2026-08-30', timeZone: 'Asia/Ho_Chi_Minh', dateBasis: 'DeliveryAt' },
        generatedAt: '2026-08-30T00:00:00Z', statuses: [1, 2], summary: [],
        details: { items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0, hasNext: false, hasPrevious: false },
        hasLegacyRecipeFallback: false,
      }).then(() => true);
    },
    menu,
  );

  await page.goto('/admin/ingredients/demand');
  await expect(page.getByRole('heading', { name: 'Nguyên liệu cần chuẩn bị', level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Việc cần làm' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('tab', { name: /Việc nhập hàng/ })).toHaveCount(0);
});

test('Cấu hình cửa hàng only exposes sections allowed by each original permission', async ({ page }) => {
  const routes = [
    {
      id: 'catalog-route', key: 'catalog-settings.home', moduleKey: 'catalog-settings', pageKey: 'catalog-settings.home',
      path: '/admin/settings/catalog', permissionCode: 'catalog-settings.view', sortOrder: 10, activeMenuKey: 'catalog-settings.home',
    },
    {
      id: 'attributes-categories', key: 'settings.attributes', moduleKey: 'settings-attributes', pageKey: 'settings.attributes',
      path: '/admin/settings/attributes/categories', permissionCode: 'settings.view', sortOrder: 15, activeMenuKey: 'catalog-settings.home',
    },
    {
      id: 'attributes-route', key: 'settings.attributes.route', moduleKey: 'settings-attributes', pageKey: 'settings.attributes',
      path: '/admin/settings/attributes/:attributeKey', permissionCode: 'settings.view', sortOrder: 20, activeMenuKey: 'catalog-settings.home',
    },
  ];
  await installSession(
    page,
    ['catalog-settings.view', 'settings.view'],
    routes,
    (route, path) => {
      if (path !== '/api/settings/attributes/categories') return false;
      return json(route, [{
        id: 1001,
        sortOrder: 10,
        isActive: true,
        translations: [
          { languageCode: 'en-US', name: 'Bouquets', description: null },
          { languageCode: 'vi-VN', name: 'Hoa bó đúng', description: null },
        ],
      }]).then(() => true);
    },
  );

  await page.goto('/admin/settings/catalog');
  await expect(page).toHaveURL(/\/admin\/settings\/attributes\/categories$/);
  await expect(page.getByRole('heading', { name: 'Cấu hình cửa hàng', level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: /Danh mục nguyên liệu/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Danh mục hàng tồn kho/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Kênh bán/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Màu sắc/ })).toBeVisible();
  await expect(page.getByRole('table').getByText('Hoa bó đúng', { exact: true })).toBeVisible();
  await expect(page.getByRole('table')).toContainText('Tiếng Anh: Bouquets');
});

test('Danh mục chi phí appears inside Cấu hình cửa hàng for expense viewers', async ({ page }) => {
  const routes = [
    {
      id: 'catalog-route', key: 'catalog-settings.home', moduleKey: 'catalog-settings', pageKey: 'catalog-settings.home',
      path: '/admin/settings/catalog', permissionCode: 'catalog-settings.view', sortOrder: 10, activeMenuKey: 'catalog-settings.home',
    },
    {
      id: 'expense-categories-route', key: 'expenses.categories', moduleKey: 'expenses', pageKey: 'expenses.categories',
      path: '/admin/settings/expense-categories', permissionCode: 'expenses.view', sortOrder: 140, activeMenuKey: 'catalog-settings.home',
    },
  ];
  await installSession(
    page,
    ['catalog-settings.view', 'expenses.view'],
    routes,
    (route, path) => {
      if (path !== '/api/expense-categories') return false;
      return json(route, []).then(() => true);
    },
  );

  await page.goto('/admin/settings/catalog');
  await expect(page).toHaveURL(/\/admin\/settings\/expense-categories$/);
  await expect(page.getByRole('heading', { name: 'Cấu hình cửa hàng', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tài chính', level: 2 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Danh mục chi phí' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Danh mục chi phí', level: 2 })).toBeVisible();
});
