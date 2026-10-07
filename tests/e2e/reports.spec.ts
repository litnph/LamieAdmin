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
  id: '50000000-0000-0000-0000-000000000020',
  key: 'reports.financial',
  moduleKey: 'reports',
  pageKey: 'reports.financial',
  path: '/admin/reports',
  permissionCode: 'reports.view',
  sortOrder: 10,
}];

const financialReport = {
  period: { from: '2026-10-01', to: '2026-10-07', groupBy: 'day', days: 7 },
  generatedAt: '2026-10-07T08:00:00.000Z',
  revenue: 18_800_000,
  productRevenue: 18_800_000,
  shippingFee: 2_030_000,
  includeShippingFeeInRevenue: false,
  expense: 250_000,
  profit: 18_550_000,
  profitMarginPercent: 98.67,
  orderCount: 38,
  expenseCount: 2,
  points: [{
    from: '2026-10-01', to: '2026-10-01', label: '01/10', revenue: 3_000_000,
    productRevenue: 3_000_000, shippingFee: 300_000, expense: 250_000, profit: 2_750_000,
    orderCount: 6, expenseCount: 2,
  }],
  expensesByCategory: [{
    expenseCategoryId: '10000000-0000-0000-0000-000000000001',
    expenseCategoryName: 'Vận chuyển', totalAmount: 250_000, expenseCount: 2,
  }],
  revenueByProductLine: [{ id: 1, name: 'Hoa tươi', revenue: 15_000_000 }],
  revenueByCategory: [{ id: 10, name: 'Hoa bó', revenue: 12_000_000 }],
  revenueBasis: 'Doanh thu từ đơn đã thanh toán, không bị hủy, theo ngày giao hàng.',
  profitBasis: 'Lợi nhuận bằng doanh thu trừ chi phí đã ghi nhận.',
};

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const installMocks = async (page: Page) => {
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
      return route.fulfill({ status: 200, contentType: 'application/vnd.ms-excel', body: '<Workbook />' });
    }
    if (url.pathname === '/api/reports/financial') return json(route, financialReport);
    return json(route, { message: `Unhandled mock route ${url.pathname}` }, 404);
  });
};

test.beforeEach(async ({ page }) => {
  await installMocks(page);
});

test('financial report loads real API data and its breakdowns', async ({ page }) => {
  const requestPromise = page.waitForRequest((request) =>
    new URL(request.url()).pathname === '/api/reports/financial');

  await page.goto('/admin/reports');
  const request = await requestPromise;
  const url = new URL(request.url());

  expect(url.searchParams.get('from')).toBeTruthy();
  expect(url.searchParams.get('to')).toBeTruthy();
  expect(url.searchParams.get('groupBy')).toBe('auto');
  await expect(page.getByRole('heading', { name: 'Báo cáo tài chính', level: 1 })).toBeVisible();
  await expect(page.getByText(/18\.800\.000/).first()).toBeVisible();
  await expect(page.getByText('38 đơn đã thanh toán · sau giảm giá')).toBeVisible();
  await expect(page.getByRole('figure', { name: 'Doanh thu theo dòng sản phẩm' })).toContainText('Hoa tươi');
  await expect(page.getByRole('figure', { name: 'Doanh thu theo danh mục' })).toContainText('Hoa bó');
  await expect(page.getByText('Vận chuyển')).toBeVisible();
  await expect(page.getByText('Dữ liệu minh họa · chưa kết nối API')).toHaveCount(0);
});

test('changing the report range reloads the financial API', async ({ page }) => {
  await page.goto('/admin/reports');
  await page.getByLabel('Từ ngày giao').fill('2026-10-02');
  await page.getByLabel('Đến ngày giao').fill('2026-10-06');
  const requestPromise = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname === '/api/reports/financial'
      && url.searchParams.get('from') === '2026-10-02'
      && url.searchParams.get('to') === '2026-10-06';
  });
  await page.getByRole('button', { name: 'Xem báo cáo' }).click();
  await requestPromise;
});

test('Excel export uses the same real report endpoint parameters', async ({ page }) => {
  await page.goto('/admin/reports');
  const requestPromise = page.waitForRequest((request) =>
    new URL(request.url()).pathname === '/api/reports/financial/export/excel');
  await page.getByRole('button', { name: 'Xuất Excel' }).click();
  const request = await requestPromise;
  const url = new URL(request.url());
  expect(url.searchParams.get('from')).toBeTruthy();
  expect(url.searchParams.get('to')).toBeTruthy();
});
