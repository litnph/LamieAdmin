import { expect, test, type Page, type Route } from '@playwright/test';

const adminUser = {
  id: '30000000-0000-0000-0000-000000000001',
  email: 'admin@lamie.test',
  userName: 'admin_test',
  fullName: 'Admin Test',
  role: 1,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const reportRoutes = [{
  id: '50000000-0000-0000-0000-000000000020', key: 'reports.financial', moduleKey: 'reports',
  pageKey: 'reports.financial', path: '/admin/reports', permissionCode: 'reports.view', sortOrder: 10,
}];

const report = {
  period: {
    from: '2026-08-01',
    to: '2026-08-03',
    groupBy: 'day',
    days: 3,
  },
  generatedAt: '2026-08-03T10:00:00.000Z',
  revenue: 500000,
  expense: 150000,
  profit: 350000,
  profitMarginPercent: 70,
  orderCount: 2,
  expenseCount: 1,
  points: [
    {
      from: '2026-08-01',
      to: '2026-08-01',
      label: '01/08/2026',
      revenue: 200000,
      expense: 0,
      profit: 200000,
      orderCount: 1,
      expenseCount: 0,
    },
    {
      from: '2026-08-02',
      to: '2026-08-02',
      label: '02/08/2026',
      revenue: 300000,
      expense: 150000,
      profit: 150000,
      orderCount: 1,
      expenseCount: 1,
    },
    {
      from: '2026-08-03',
      to: '2026-08-03',
      label: '03/08/2026',
      revenue: 0,
      expense: 0,
      profit: 0,
      orderCount: 0,
      expenseCount: 0,
    },
  ],
  expensesByCategory: [{
    expenseCategoryId: '10000000-0000-0000-0000-000000000001',
    expenseCategoryName: 'Vận chuyển',
    totalAmount: 150000,
    expenseCount: 1,
  }],
  revenueBasis: 'Đơn đã thanh toán và chưa hủy, ghi nhận theo ngày giao hàng (UTC+7).',
  profitBasis: 'Lợi nhuận = doanh thu - chi phí đã ghi nhận trong cùng kỳ.',
};

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const installReportMocks = async (page: Page) => {
  await page.addInitScript(({ user }) => {
    localStorage.setItem('lamie_access_token', 'e2e-access-token');
    localStorage.setItem('lamie_refresh_token', 'e2e-refresh-token');
    localStorage.setItem('lamie_user_json', JSON.stringify(user));
  }, { user: adminUser });

  await page.route(/^https?:\/\/[^/]+\/api\//, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/auth/me') return json(route, adminUser);
    if (url.pathname === '/api/admin/navigation/me/routes') return json(route, reportRoutes);
    if (url.pathname === '/api/admin/navigation/me') return json(route, []);
    if (url.pathname === '/api/reports/financial/export/excel') {
      return route.fulfill({
        status: 200,
        contentType: 'application/vnd.ms-excel',
        body: '<?xml version="1.0"?><Workbook><Worksheet ss:Name="Tổng hợp" /></Workbook>',
      });
    }
    if (url.pathname === '/api/reports/financial/export/print') {
      return route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: '<!doctype html><html><body><h1>Báo cáo tài chính</h1></body></html>',
      });
    }
    if (url.pathname === '/api/reports/financial') return json(route, report);
    return json(route, { success: false, message: `Unhandled mock route ${url.pathname}` }, 404);
  });
};

test.beforeEach(async ({ page }) => {
  await installReportMocks(page);
});

test('financial report shows summary, chart, period rows and expense breakdown', async ({ page }) => {
  await page.goto('/admin/reports');

  await expect(page.getByRole('heading', { name: 'Báo cáo tài chính', level: 1 })).toBeVisible();
  await expect(page.getByText('500.000 ₫')).toBeVisible();
  await expect(page.getByText('350.000 ₫')).toBeVisible();
  await expect(page.getByText('70%')).toBeVisible();
  await expect(page.getByRole('figure', { name: 'Doanh thu và chi phí theo kỳ' })).toBeVisible();
  await expect(page.getByLabel('Chi tiết theo kỳ').getByRole('rowheader', { name: '02/08/2026' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Vận chuyển' })).toBeVisible();
  await expect(page.getByLabel('Quy tắc tính báo cáo')).toContainText('Đơn đã thanh toán');
  await expect(page.getByLabel('Quy tắc tính báo cáo')).toContainText('ngày giao hàng');
});

test('financial report applies date and grouping filters', async ({ page }) => {
  await page.goto('/admin/reports');
  await page.getByLabel('Từ ngày giao').fill('2026-07-01');
  await page.getByLabel('Đến ngày giao').fill('2026-07-31');
  await page.getByLabel('Nhóm dữ liệu').selectOption('month');

  const requestPromise = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname === '/api/reports/financial' && url.searchParams.get('groupBy') === 'month';
  });
  await page.getByRole('button', { name: 'Xem báo cáo' }).click();
  const request = await requestPromise;
  const url = new URL(request.url());
  expect(url.searchParams.get('from')).toBe('2026-07-01');
  expect(url.searchParams.get('to')).toBe('2026-07-31');
});

test('financial report downloads an Excel workbook', async ({ page }) => {
  await page.goto('/admin/reports');
  await expect(page.getByRole('button', { name: 'Xuất Excel' })).toBeEnabled();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất Excel' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^bao-cao-tai-chinh-.*\.xls$/);
});

test('financial report requests the printable PDF fallback', async ({ page }) => {
  await page.goto('/admin/reports');
  await expect(page.getByRole('button', { name: 'In / Lưu PDF' })).toBeEnabled();

  const requestPromise = page.waitForRequest((request) => new URL(request.url()).pathname === '/api/reports/financial/export/print');
  await page.getByRole('button', { name: 'In / Lưu PDF' }).click();
  await requestPromise;
});
