import { expect, test, type Page, type Route } from '@playwright/test';

const CATEGORY_ID = '10000000-0000-0000-0000-000000000001';
const EXPENSE_ID = '20000000-0000-0000-0000-000000000001';

const adminUser = {
  id: '30000000-0000-0000-0000-000000000001',
  email: 'admin@lamie.test',
  userName: 'admin_test',
  fullName: 'Admin Test',
  role: 1,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const expenseRoutes = [
  {
    id: '50000000-0000-0000-0000-000000000010', key: 'expenses.list', moduleKey: 'expenses',
    pageKey: 'expenses.list', path: '/admin/expenses', permissionCode: 'expenses.view', sortOrder: 10,
  },
  {
    id: '50000000-0000-0000-0000-000000000011', key: 'expenses.categories', moduleKey: 'expenses',
    pageKey: 'expenses.categories', path: '/admin/settings/expense-categories', permissionCode: 'expenses.view', sortOrder: 20,
  },
];

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const installExpenseMocks = async (page: Page) => {
  const categories = [{
    id: CATEGORY_ID,
    name: 'Vận chuyển',
    description: 'Chi phí giao nhận',
    sortOrder: 10,
    isActive: true,
    expenseCount: 1,
    totalAmount: 125000,
  }];
  const expenses = [{
    id: EXPENSE_ID,
    expenseCategoryId: CATEGORY_ID,
    expenseCategoryName: 'Vận chuyển',
    expenseDate: '2026-08-03',
    amount: 125000,
    description: 'Phí giao hoa',
    notes: 'Đơn buổi sáng',
    createdAt: '2026-08-03T02:00:00.000Z',
    updatedAt: '2026-08-03T02:00:00.000Z',
  }];

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
    if (url.pathname === '/api/admin/navigation/me/routes') return json(route, expenseRoutes);
    if (url.pathname === '/api/admin/navigation/me') return json(route, []);

    if (url.pathname === '/api/expense-categories' && method === 'GET') return json(route, categories);
    if (url.pathname === '/api/expense-categories' && method === 'POST') {
      const payload = request.postDataJSON() as { name: string; description?: string; sortOrder: number; isActive: boolean };
      const id = '10000000-0000-0000-0000-000000000002';
      categories.push({
        id,
        name: payload.name,
        description: payload.description ?? null,
        sortOrder: payload.sortOrder,
        isActive: payload.isActive,
        expenseCount: 0,
        totalAmount: 0,
      });
      return json(route, { id }, 201);
    }
    if (url.pathname.startsWith('/api/expense-categories/') && method === 'PUT') {
      const id = url.pathname.split('/').at(-1);
      const payload = request.postDataJSON() as { name: string; description?: string; sortOrder: number; isActive: boolean };
      const category = categories.find((item) => item.id === id);
      if (!category) return json(route, { message: 'Not found' }, 404);
      Object.assign(category, payload);
      return route.fulfill({ status: 204 });
    }
    if (url.pathname.startsWith('/api/expense-categories/') && method === 'DELETE') {
      const id = url.pathname.split('/').at(-1);
      const index = categories.findIndex((item) => item.id === id);
      if (index >= 0) categories.splice(index, 1);
      return route.fulfill({ status: 204 });
    }

    if (url.pathname === '/api/expenses/summary') {
      const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      return json(route, {
        from: url.searchParams.get('from') ?? '2026-08-01',
        to: url.searchParams.get('to') ?? '2026-08-03',
        totalAmount,
        expenseCount: expenses.length,
        averageAmount: expenses.length ? totalAmount / expenses.length : 0,
        byCategory: expenses.length ? [{
          expenseCategoryId: CATEGORY_ID,
          expenseCategoryName: 'Vận chuyển',
          totalAmount,
          expenseCount: expenses.length,
        }] : [],
      });
    }
    if (url.pathname === '/api/expenses' && method === 'GET') {
      return json(route, {
        items: expenses,
        totalCount: expenses.length,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      });
    }
    if (url.pathname === '/api/expenses' && method === 'POST') {
      const payload = request.postDataJSON() as {
        expenseCategoryId: string;
        expenseDate: string;
        amount: number;
        description: string;
        notes?: string;
      };
      const id = '20000000-0000-0000-0000-000000000002';
      expenses.push({
        id,
        ...payload,
        expenseCategoryName: categories.find((item) => item.id === payload.expenseCategoryId)?.name ?? 'Không xác định',
        notes: payload.notes ?? null,
        createdAt: '2026-08-03T03:00:00.000Z',
        updatedAt: '2026-08-03T03:00:00.000Z',
      });
      return json(route, { id }, 201);
    }
    if (url.pathname.startsWith('/api/expenses/') && method === 'PUT') {
      const id = url.pathname.split('/').at(-1);
      const payload = request.postDataJSON() as {
        expenseCategoryId: string;
        expenseDate: string;
        amount: number;
        description: string;
        notes?: string;
      };
      const expense = expenses.find((item) => item.id === id);
      if (!expense) return json(route, { message: 'Not found' }, 404);
      Object.assign(expense, payload, {
        expenseCategoryName: categories.find((item) => item.id === payload.expenseCategoryId)?.name ?? 'Không xác định',
        updatedAt: '2026-08-03T04:00:00.000Z',
      });
      return route.fulfill({ status: 204 });
    }
    if (url.pathname.startsWith('/api/expenses/') && method === 'DELETE') {
      const id = url.pathname.split('/').at(-1);
      const index = expenses.findIndex((item) => item.id === id);
      if (index >= 0) expenses.splice(index, 1);
      return route.fulfill({ status: 204 });
    }

    return json(route, { success: false, message: `Unhandled mock route ${method} ${url.pathname}` }, 404);
  });
};

test.beforeEach(async ({ page }) => {
  await installExpenseMocks(page);
});

test('expense page shows period summary, filters and paged rows', async ({ page }) => {
  await page.goto('/admin/expenses');

  await expect(page.getByRole('heading', { name: 'Chi phí', level: 1 })).toBeVisible();
  await expect(page.getByText('Tổng chi')).toBeVisible();
  await expect(page.getByRole('table').getByText('Phí giao hoa')).toBeVisible();
  await expect(page.getByRole('table').getByText('Vận chuyển')).toBeVisible();
  await expect(page.getByLabel('Phân trang chi phí')).toContainText('1-1');
});

test('expense can be created with required validation fields', async ({ page }) => {
  await page.goto('/admin/expenses');
  await page.getByRole('button', { name: 'Thêm khoản chi' }).click();

  const dialog = page.getByRole('dialog', { name: 'Thêm khoản chi' });
  await dialog.getByLabel('Danh mục').selectOption(CATEGORY_ID);
  await dialog.getByLabel('Ngày chi').fill('2026-08-03');
  const amountInput = dialog.getByLabel('Số tiền');
  await amountInput.click();
  for (const digit of '1000000') {
    await page.keyboard.type(digit);
    await expect(amountInput).toBeFocused();
  }
  await expect(amountInput).toHaveValue('1.000.000');
  await dialog.getByLabel('Nội dung chi').fill('Mua giấy gói hoa');
  await dialog.getByLabel('Ghi chú').fill('Bổ sung kho đầu tuần');
  await dialog.getByRole('button', { name: 'Thêm khoản chi' }).click();

  await expect(page.getByText('Đã ghi nhận khoản chi.')).toBeVisible();
  await expect(page.getByRole('table').getByText('Mua giấy gói hoa')).toBeVisible();
});

test('expense can be edited and deleted with irreversible confirmation', async ({ page }) => {
  await page.goto('/admin/expenses');
  await page.getByRole('button', { name: 'Sửa khoản chi Phí giao hoa' }).click();

  const editDialog = page.getByRole('dialog', { name: 'Cập nhật khoản chi' });
  await editDialog.getByLabel('Số tiền').fill('150000');
  await editDialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByText('Đã cập nhật khoản chi.')).toBeVisible();

  await page.getByRole('button', { name: 'Xóa khoản chi Phí giao hoa' }).click();
  const deleteDialog = page.getByRole('dialog', { name: 'Xác nhận xóa khoản chi' });
  await expect(deleteDialog).toContainText('không thể hoàn tác');
  await deleteDialog.getByRole('button', { name: 'Xóa khoản chi' }).click();
  await expect(page.getByText('Đã xóa khoản chi.')).toBeVisible();
  await expect(page.getByText('Chưa có khoản chi phù hợp')).toBeVisible();
});

test('unused expense category can be created then deleted', async ({ page }) => {
  await page.goto('/admin/settings/expense-categories');
  await expect(page.getByRole('heading', { name: 'Danh mục chi phí', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Thêm danh mục' }).click();

  const createDialog = page.getByRole('dialog', { name: 'Thêm danh mục chi phí' });
  await createDialog.getByLabel('Tên danh mục').fill('Vật tư');
  await createDialog.getByLabel('Mô tả').fill('Giấy, nơ và phụ kiện');
  await createDialog.getByRole('button', { name: 'Thêm danh mục' }).click();
  await expect(page.getByText('Đã tạo danh mục chi phí.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Vật tư' })).toBeVisible();

  const categoryRow = page.getByRole('article').filter({ hasText: 'Vật tư' });
  await categoryRow.getByRole('button', { name: 'Xóa' }).click();
  const deleteDialog = page.getByRole('dialog', { name: 'Xác nhận xóa danh mục' });
  await deleteDialog.getByRole('button', { name: 'Xóa danh mục' }).click();
  await expect(page.getByText('Đã xóa danh mục chi phí.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Vật tư' })).toHaveCount(0);
});
