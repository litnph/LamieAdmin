import { expect, test, type Page, type Route } from '@playwright/test';

const adminUser = {
  id: '30000000-0000-0000-0000-000000000001',
  email: 'admin@lamie.test',
  userName: 'admin_test',
  fullName: 'Admin Test',
  role: 1,
  roleCode: 'admin',
  permissions: ['roles.view', 'roles.manage', 'navigation.view', 'navigation.manage', 'orders.view'],
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const routeRecords = [
  ['permissions-route', 'permissions.list', '/admin/permissions', 'roles.view'],
  ['navigation-route', 'navigation.manage', '/admin/navigation', 'navigation.view'],
].map(([key, pageKey, path, permissionCode], index) => ({
  id: `60000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`,
  key,
  moduleKey: 'access-control',
  pageKey,
  path,
  permissionCode,
  sortOrder: (index + 1) * 10,
}));

const initialPermissions = () => [
  {
    id: '10000000-0000-0000-0000-000000000001', code: 'roles.view', name: 'Xem vai trò',
    description: 'Xem danh sách vai trò.', group: 'Phân quyền', isSystem: true, isActive: true,
    sortOrder: 10, roleCount: 3, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000002', code: 'suppliers.view', name: 'Xem nhà cung cấp',
    description: 'Permission tùy chỉnh.', group: 'Nhà cung cấp', isSystem: false, isActive: true,
    sortOrder: 20, roleCount: 1, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
];

const initialNavigation = () => [
  {
    id: '70000000-0000-0000-0000-000000000001', key: 'group.system', parentId: null,
    moduleKey: null, pageKey: null, label: 'Hệ thống', description: null, path: null,
    iconKey: 'folder', permissionCode: null, permissionIsActive: null, sortOrder: 10,
    isVisible: true, isEnabled: true, isSystem: true, openInNewTab: false,
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', warnings: [],
  },
  {
    id: '70000000-0000-0000-0000-000000000002', key: 'custom.alpha', parentId: null,
    moduleKey: 'orders', pageKey: 'orders.list', label: 'Đơn Alpha', description: null,
    path: '/admin/orders', iconKey: 'shopping-bag', permissionCode: 'orders.view',
    permissionIsActive: true, sortOrder: 20, isVisible: true, isEnabled: true, isSystem: false,
    openInNewTab: false, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', warnings: [],
  },
  {
    id: '70000000-0000-0000-0000-000000000003', key: 'custom.beta', parentId: null,
    moduleKey: 'missing-module', pageKey: 'missing.page', label: 'Menu Beta', description: null,
    path: '/admin/beta', iconKey: 'database-icon', permissionCode: 'missing.permission',
    permissionIsActive: null, sortOrder: 30, isVisible: true, isEnabled: true, isSystem: false,
    openInNewTab: false, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    warnings: ['permission_missing'],
  },
];

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const installMocks = async (page: Page, options: { failFirstPermissionList?: boolean } = {}) => {
  const permissions = initialPermissions();
  const navigation = initialNavigation();
  let permissionListRequests = 0;
  let createdPermissionPayload: Record<string, unknown> | null = null;
  let createdNavigationPayload: Record<string, unknown> | null = null;
  let reorderPayload: Record<string, unknown> | null = null;

  await page.addInitScript(({ user }) => {
    localStorage.setItem('lamie_access_token', 'e2e-access-token');
    localStorage.setItem('lamie_refresh_token', 'e2e-refresh-token');
    localStorage.setItem('lamie_user_json', JSON.stringify(user));
  }, { user: adminUser });

  await page.route(/^https?:\/\/[^/]+\/api\//, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (url.pathname === '/api/auth/me') return json(route, adminUser);
    if (url.pathname === '/api/admin/navigation/me/routes') return json(route, routeRecords);
    if (url.pathname === '/api/admin/navigation/me') return json(route, []);

    if (url.pathname === '/api/admin/permissions' && method === 'GET') {
      permissionListRequests += 1;
      if (options.failFirstPermissionList && permissionListRequests === 1) {
        return json(route, { message: 'Temporary permission error' }, 503);
      }
      const search = url.searchParams.get('search')?.toLowerCase();
      const group = url.searchParams.get('group');
      const system = url.searchParams.get('system');
      const active = url.searchParams.get('active');
      const filtered = permissions.filter((item) =>
        (!search || `${item.code} ${item.name} ${item.description}`.toLowerCase().includes(search))
        && (!group || item.group === group)
        && (system == null || item.isSystem === (system === 'true'))
        && (active == null || item.isActive === (active === 'true')));
      return json(route, {
        items: filtered, totalCount: filtered.length, page: 1, pageSize: 25,
        totalPages: filtered.length ? 1 : 0, hasNext: false, hasPrevious: false,
      });
    }
    if (url.pathname === '/api/admin/permissions' && method === 'POST') {
      createdPermissionPayload = request.postDataJSON() as Record<string, unknown>;
      const created = {
        id: '10000000-0000-0000-0000-000000000003', ...createdPermissionPayload,
        isSystem: false, roleCount: 1, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
      } as (typeof permissions)[number];
      permissions.push(created);
      return json(route, created, 201);
    }
    if (url.pathname.startsWith('/api/admin/permissions/') && method === 'PUT') {
      const item = permissions.find((candidate) => candidate.id === url.pathname.split('/').at(-1));
      if (item) Object.assign(item, request.postDataJSON());
      return route.fulfill({ status: 204 });
    }
    if (url.pathname.startsWith('/api/admin/permissions/') && method === 'DELETE') {
      const item = permissions.find((candidate) => candidate.id === url.pathname.split('/').at(-1));
      if (item) item.isActive = false;
      return route.fulfill({ status: 204 });
    }

    if (url.pathname === '/api/admin/navigation/reorder' && method === 'POST') {
      reorderPayload = request.postDataJSON() as Record<string, unknown>;
      const changes = (reorderPayload.items ?? []) as Array<{ id: string; sortOrder: number }>;
      changes.forEach((change) => {
        const item = navigation.find((candidate) => candidate.id === change.id);
        if (item) item.sortOrder = change.sortOrder;
      });
      return route.fulfill({ status: 204 });
    }
    if (/\/api\/admin\/navigation\/[^/]+\/(enable|disable)$/.test(url.pathname) && method === 'POST') {
      const parts = url.pathname.split('/');
      const item = navigation.find((candidate) => candidate.id === parts.at(-2));
      if (item) item.isEnabled = parts.at(-1) === 'enable';
      return route.fulfill({ status: 204 });
    }
    if (url.pathname === '/api/admin/navigation' && method === 'GET') return json(route, navigation);
    if (url.pathname === '/api/admin/navigation' && method === 'POST') {
      createdNavigationPayload = request.postDataJSON() as Record<string, unknown>;
      const created = {
        id: '70000000-0000-0000-0000-000000000004', ...createdNavigationPayload,
        isSystem: false, permissionIsActive: true, createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z', warnings: [],
      } as (typeof navigation)[number];
      navigation.push(created);
      return json(route, created, 201);
    }
    if (url.pathname.startsWith('/api/admin/navigation/') && method === 'PUT') return route.fulfill({ status: 204 });
    if (url.pathname.startsWith('/api/admin/navigation/') && method === 'DELETE') {
      const index = navigation.findIndex((candidate) => candidate.id === url.pathname.split('/').at(-1));
      if (index >= 0) navigation.splice(index, 1);
      return route.fulfill({ status: 204 });
    }
    return json(route, { message: `Unhandled ${method} ${url.pathname}` }, 404);
  });

  return {
    createdPermission: () => createdPermissionPayload,
    createdNavigation: () => createdNavigationPayload,
    reordered: () => reorderPayload,
  };
};

test('permission management filters and distinguishes system/custom state and role usage', async ({ page }) => {
  await installMocks(page);
  await page.goto('/admin/permissions');

  await expect(page.getByRole('heading', { name: 'Quyền hạn', exact: true })).toBeVisible();
  await expect(page.getByRole('article').filter({ hasText: 'roles.view' })).toContainText('Hệ thống');
  await expect(page.getByRole('article').filter({ hasText: 'roles.view' })).toContainText('3 vai trò');
  await page.getByPlaceholder('Mã, tên hoặc mô tả').fill('suppliers');
  await page.getByRole('button', { name: 'Áp dụng' }).click();
  await expect(page.getByRole('article').filter({ hasText: 'suppliers.view' })).toContainText('Tùy chỉnh');
  await expect(page.getByText('roles.view')).toHaveCount(0);
});

test('custom permission can be created, edited and deactivated without hard delete', async ({ page }) => {
  const mocks = await installMocks(page);
  await page.goto('/admin/permissions');
  await page.getByRole('button', { name: 'Thêm quyền tùy chỉnh' }).click();
  const createDialog = page.getByRole('dialog', { name: 'Thêm quyền tùy chỉnh' });
  await createDialog.getByLabel('Mã quyền').fill('suppliers.manage');
  await createDialog.getByLabel('Tên').fill('Quản lý nhà cung cấp');
  await createDialog.getByLabel('Nhóm').fill('Nhà cung cấp');
  await createDialog.getByRole('button', { name: 'Lưu quyền' }).click();
  await expect.poll(() => mocks.createdPermission()).not.toBeNull();
  await expect(page.getByText('Đã tạo quyền suppliers.manage.')).toBeVisible();

  await page.getByRole('button', { name: 'Sửa quyền suppliers.manage' }).click();
  const editDialog = page.getByRole('dialog', { name: 'Cập nhật suppliers.manage' });
  await editDialog.getByLabel('Tên').fill('Quản lý đối tác cung ứng');
  await editDialog.getByRole('button', { name: 'Lưu quyền' }).click();
  await expect(page.getByText('Quản lý đối tác cung ứng')).toBeVisible();

  await page.getByRole('button', { name: 'Vô hiệu hóa quyền suppliers.manage' }).click();
  await page.getByRole('dialog', { name: 'Vô hiệu hóa quyền' }).getByRole('button', { name: 'Vô hiệu hóa' }).click();
  await expect(page.getByText('Đã vô hiệu hóa quyền suppliers.manage.')).toBeVisible();
  await expect(page.getByRole('article').filter({ hasText: 'suppliers.manage' })).toContainText('Đã tắt');
});

test('permission management exposes API error and retry', async ({ page }) => {
  await installMocks(page, { failFirstPermissionList: true });
  await page.goto('/admin/permissions');
  await expect(page.getByRole('alert')).toContainText('Temporary permission error');
  await page.getByRole('button', { name: 'Thử lại' }).click();
  await expect(page.getByText('roles.view')).toBeVisible();
});

test('navigation management warns on missing source references, reorders, disables and enables', async ({ page }) => {
  const mocks = await installMocks(page);
  await page.goto('/admin/navigation');

  await expect(page.getByRole('heading', { name: 'Menu & Điều hướng' })).toBeVisible();
  await expect(page.getByRole('article').filter({ hasText: 'Menu Beta' })).toContainText('icon_missing');
  await expect(page.getByRole('article').filter({ hasText: 'Menu Beta' })).toContainText('page_missing');
  await expect(page.getByText('Đơn Alpha').last()).toBeVisible();
  await page.getByRole('button', { name: 'Đưa Menu Beta lên' }).click();
  await expect.poll(() => mocks.reordered()).not.toBeNull();
  await page.getByRole('button', { name: 'Tắt Menu Beta' }).click();
  await expect(page.getByRole('button', { name: 'Bật Menu Beta' })).toBeVisible();
  await page.getByRole('button', { name: 'Bật Menu Beta' }).click();
  await expect(page.getByRole('button', { name: 'Tắt Menu Beta' })).toBeVisible();
});

test('navigation form validates locally and creates only a registered page binding', async ({ page }) => {
  const mocks = await installMocks(page);
  await page.goto('/admin/navigation');
  await page.getByRole('button', { name: 'Thêm mục' }).click();
  const dialog = page.getByRole('dialog', { name: 'Thêm mục điều hướng' });
  await dialog.getByLabel('Key', { exact: true }).fill('unsafe key');
  await dialog.getByLabel('Nhãn', { exact: true }).fill('Đơn động');
  await dialog.getByRole('button', { name: 'Lưu mục' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Kiểm tra key');
  expect(mocks.createdNavigation()).toBeNull();

  await dialog.getByLabel('Key', { exact: true }).fill('orders.dynamic');
  await dialog.getByLabel('Page Registry', { exact: true }).selectOption('orders.list');
  await dialog.getByLabel('Thứ tự', { exact: true }).fill('50');
  await dialog.getByRole('button', { name: 'Lưu mục' }).click();
  await expect.poll(() => mocks.createdNavigation()).not.toBeNull();
  expect(mocks.createdNavigation()).toMatchObject({
    key: 'orders.dynamic', moduleKey: 'orders', pageKey: 'orders.list', path: '/admin/orders',
    permissionCode: 'orders.view', openInNewTab: false,
  });
});
