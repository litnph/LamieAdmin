import { expect, test, type Page, type Route } from '@playwright/test';

const ADMIN_ROLE_ID = '20000000-0000-4000-8000-000000000001';
const MANAGER_ROLE_ID = '20000000-0000-4000-8000-000000000002';
const STAFF_ROLE_ID = '20000000-0000-4000-8000-000000000003';
const CUSTOM_ROLE_ID = '20000000-0000-4000-8000-000000000004';

const adminUser = {
  id: '30000000-0000-0000-0000-000000000001',
  email: 'admin@lamie.test',
  userName: 'admin_test',
  fullName: 'Admin Test',
  role: 1,
  roleId: ADMIN_ROLE_ID,
  roleName: 'Quản trị viên',
  roleCode: 'admin',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const routeRecords = [
  {
    id: '50000000-0000-0000-0000-000000000001', key: 'roles.list', moduleKey: 'roles',
    pageKey: 'roles.list', path: '/admin/roles', permissionCode: 'roles.view', sortOrder: 10,
  },
  {
    id: '50000000-0000-0000-0000-000000000002', key: 'users.create', moduleKey: 'users',
    pageKey: 'users.create', path: '/admin/users/new', permissionCode: 'users.manage', sortOrder: 20,
  },
];

const permissions = [
  { id: '10000000-0000-4000-8000-000000000001', code: 'expenses.view', name: 'Xem chi phí', group: 'Tài chính', description: 'Xem danh mục và các khoản chi.', isSystem: true, isActive: true },
  { id: '10000000-0000-4000-8000-000000000002', code: 'expenses.manage', name: 'Quản lý chi phí', group: 'Tài chính', description: 'Tạo, cập nhật và xóa chi phí.', isSystem: true, isActive: true },
  { id: '10000000-0000-4000-8000-000000000003', code: 'reports.view', name: 'Xem báo cáo', group: 'Báo cáo', description: 'Xem và xuất báo cáo tài chính.', isSystem: true, isActive: true },
  { id: '10000000-0000-4000-8000-000000000004', code: 'users.view', name: 'Xem người dùng', group: 'Phân quyền', description: 'Xem tài khoản quản trị.', isSystem: true, isActive: true },
  { id: '10000000-0000-4000-8000-000000000005', code: 'custom.audit', name: 'Kiểm tra tùy chỉnh', group: 'Tùy chỉnh', description: 'Quyền đã vô hiệu hóa.', isSystem: false, isActive: false },
];

const initialRoles = () => [
  {
    id: ADMIN_ROLE_ID,
    code: 'admin',
    name: 'Quản trị viên',
    description: 'Toàn quyền quản trị hệ thống.',
    isSystem: true,
    isActive: true,
    userCount: 1,
    permissionCodes: permissions.map((item) => item.code),
    createdAt: '2026-08-03T00:00:00.000Z',
    updatedAt: '2026-08-03T00:00:00.000Z',
  },
  {
    id: MANAGER_ROLE_ID,
    code: 'manager',
    name: 'Quản lý',
    description: 'Quản lý vận hành.',
    isSystem: true,
    isActive: true,
    userCount: 0,
    permissionCodes: ['expenses.view', 'expenses.manage', 'reports.view'],
    createdAt: '2026-08-03T00:00:00.000Z',
    updatedAt: '2026-08-03T00:00:00.000Z',
  },
  {
    id: STAFF_ROLE_ID,
    code: 'staff',
    name: 'Nhân viên',
    description: 'Xử lý nghiệp vụ hàng ngày.',
    isSystem: true,
    isActive: true,
    userCount: 0,
    permissionCodes: ['expenses.view'],
    createdAt: '2026-08-03T00:00:00.000Z',
    updatedAt: '2026-08-03T00:00:00.000Z',
  },
  {
    id: CUSTOM_ROLE_ID,
    code: 'accountant',
    name: 'Kế toán',
    description: 'Theo dõi tài chính.',
    isSystem: false,
    isActive: true,
    userCount: 0,
    permissionCodes: ['expenses.view', 'reports.view', 'custom.audit'],
    createdAt: '2026-08-03T00:00:00.000Z',
    updatedAt: '2026-08-03T00:00:00.000Z',
  },
];

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const installRoleMocks = async (page: Page) => {
  const roles = initialRoles();
  let createdUserPayload: Record<string, unknown> | null = null;

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
    if (url.pathname === '/api/roles/permissions') return json(route, permissions);
    if (url.pathname === '/api/roles' && method === 'GET') {
      const activeOnly = url.searchParams.get('activeOnly') === 'true';
      return json(route, activeOnly ? roles.filter((role) => role.isActive) : roles);
    }
    if (url.pathname === '/api/roles' && method === 'POST') {
      const payload = request.postDataJSON() as {
        code: string;
        name: string;
        description?: string | null;
        isActive: boolean;
        permissionCodes: string[];
      };
      const created = {
        id: '20000000-0000-4000-8000-000000000005',
        ...payload,
        description: payload.description ?? '',
        isSystem: false,
        userCount: 0,
        createdAt: '2026-08-03T10:00:00.000Z',
        updatedAt: '2026-08-03T10:00:00.000Z',
      };
      roles.push(created);
      return json(route, created, 201);
    }
    if (url.pathname.startsWith('/api/roles/') && method === 'PUT') {
      const id = url.pathname.split('/').at(-1);
      const target = roles.find((role) => role.id === id);
      if (!target) return json(route, { message: 'Not found' }, 404);
      Object.assign(target, request.postDataJSON(), { updatedAt: '2026-08-03T11:00:00.000Z' });
      return route.fulfill({ status: 204 });
    }
    if (url.pathname.startsWith('/api/roles/') && method === 'DELETE') {
      const id = url.pathname.split('/').at(-1);
      const index = roles.findIndex((role) => role.id === id);
      if (index >= 0) roles.splice(index, 1);
      return route.fulfill({ status: 204 });
    }
    if (url.pathname === '/api/users' && method === 'GET') return json(route, []);
    if (url.pathname === '/api/users' && method === 'POST') {
      createdUserPayload = request.postDataJSON() as Record<string, unknown>;
      return json(route, { id: '40000000-0000-0000-0000-000000000001', ...createdUserPayload }, 201);
    }
    return json(route, { success: false, message: `Unhandled mock route ${method} ${url.pathname}` }, 404);
  });

  return { getCreatedUserPayload: () => createdUserPayload };
};

test('role page shows system protection, assignment counts and permission counts', async ({ page }) => {
  await installRoleMocks(page);
  await page.goto('/admin/roles');

  await expect(page.getByRole('heading', { name: 'Vai trò & quyền hạn', level: 1 })).toBeVisible();
  const adminCard = page.getByRole('article').filter({ hasText: 'Quản trị viên' });
  await expect(adminCard).toContainText('Hệ thống');
  await expect(adminCard).toContainText('5/5');
  await expect(page.getByRole('article').filter({ hasText: 'Kế toán' })).toContainText('3/5');
  await expect(page.getByRole('button', { name: 'Xóa vai trò Quản trị viên' })).toHaveCount(0);
});

test('custom role can be created, edited and deleted with confirmation', async ({ page }) => {
  await installRoleMocks(page);
  await page.goto('/admin/roles');
  await page.getByRole('button', { name: 'Thêm vai trò' }).click();

  const createDialog = page.getByRole('dialog', { name: 'Thêm vai trò' });
  await createDialog.getByLabel('Mã vai trò').fill('sales-auditor');
  await createDialog.getByLabel('Tên vai trò').fill('Kiểm soát bán hàng');
  await createDialog.getByRole('checkbox', { name: /Xem báo cáo/ }).check();
  await createDialog.getByRole('button', { name: 'Thêm vai trò' }).click();
  await expect(page.getByText('Đã tạo vai trò Kiểm soát bán hàng.')).toBeVisible();

  await page.getByRole('button', { name: 'Sửa vai trò Kiểm soát bán hàng' }).click();
  const editDialog = page.getByRole('dialog', { name: 'Cập nhật vai trò Kiểm soát bán hàng' });
  await editDialog.getByLabel('Tên vai trò').fill('Kiểm soát doanh thu');
  await editDialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByText('Đã cập nhật vai trò Kiểm soát doanh thu.')).toBeVisible();

  await page.getByRole('button', { name: 'Xóa vai trò Kiểm soát doanh thu' }).click();
  const deleteDialog = page.getByRole('dialog', { name: 'Xác nhận xóa vai trò' });
  await expect(deleteDialog).toContainText('không thể hoàn tác');
  await deleteDialog.getByRole('button', { name: 'Xóa vai trò' }).click();
  await expect(page.getByText('Đã xóa vai trò Kiểm soát doanh thu.')).toBeVisible();
});

test('role editor searches grouped permissions, marks inactive/custom state and previews menu', async ({ page }) => {
  await installRoleMocks(page);
  await page.goto('/admin/roles');
  await page.getByRole('button', { name: 'Sửa vai trò Kế toán' }).click();
  const dialog = page.getByRole('dialog', { name: 'Cập nhật vai trò Kế toán' });

  await expect(dialog.getByRole('alert')).toContainText('1 quyền đã vô hiệu hóa');
  await expect(dialog.getByRole('button', { name: 'Lưu thay đổi' })).toBeDisabled();
  await dialog.getByPlaceholder('Tìm theo mã, tên hoặc nhóm quyền').fill('custom.audit');
  await expect(dialog.locator('span').filter({ hasText: /^Tùy chỉnh$/ })).toBeVisible();
  await expect(dialog.getByText('Đã tắt', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Xem trước menu theo vai trò' })).toBeVisible();
});

test('user creation submits the selected persisted role id', async ({ page }) => {
  const mocks = await installRoleMocks(page);
  await page.goto('/admin/users/new');

  await page.getByLabel('Email').fill('accountant2@lamie.test');
  await page.getByLabel('Tên đăng nhập').fill('accountant2');
  await page.getByLabel('Mật khẩu').fill('StrongPass1');
  await page.getByLabel('Họ tên').fill('Kế toán 2');
  await page.getByLabel('Vai trò').selectOption(CUSTOM_ROLE_ID);
  await page.getByRole('button', { name: 'Lưu người dùng' }).click();

  await expect.poll(() => mocks.getCreatedUserPayload()).not.toBeNull();
  expect(mocks.getCreatedUserPayload()).toMatchObject({ roleId: CUSTOM_ROLE_ID, role: 3 });
});
