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
}, {
  id: '50000000-0000-0000-0000-000000000021', key: 'finance.purchases', moduleKey: 'reports', pageKey: 'finance.purchases', path: '/admin/finance/purchases', permissionCode: 'reports.view', sortOrder: 20,
}, {
  id: '50000000-0000-0000-0000-000000000022', key: 'finance.period-close', moduleKey: 'reports', pageKey: 'finance.period-close', path: '/admin/finance/period-close', permissionCode: 'reports.view', sortOrder: 30,
}];

const financialReport = {
  period: { from: '2026-10-01', to: '2026-10-07', groupBy: 'day', days: 7 },
  generatedAt: '2026-10-07T08:00:00.000Z',
  revenue: 18_800_000,
  productRevenue: 18_800_000,
  shippingFee: 2_030_000,
  shippingFeeActual: 250_000,
  otherExpense: 120_000,
  temporaryDifference: 18_430_000,
  includeShippingFeeInRevenue: true,
  expense: 370_000,
  profit: 18_430_000,
  profitMarginPercent: 98.67,
  materialProductCogs: 4_000_000,
  materialWaste: 200_000,
  isProfitProvisional: false,
  profitProvisionalReasons: [],
  orderCount: 38,
  expenseCount: 2,
  points: [{
    from: '2026-10-01', to: '2026-10-01', label: '01/10', revenue: 3_000_000,
    productRevenue: 3_000_000, shippingFee: 300_000, shippingFeeActual: 150_000,
    otherExpense: 100_000, expense: 250_000, profit: 2_750_000,
    orderCount: 6, expenseCount: 2,
  }],
  expensesByCategory: [{
    expenseCategoryId: '10000000-0000-0000-0000-000000000001',
    expenseCategoryName: 'Vận chuyển', totalAmount: 250_000, expenseCount: 2,
  }],
  revenueByProductLine: [{ id: 1, name: 'Hoa tươi', revenue: 15_000_000 }],
  revenueByCategory: [{ id: 10, name: 'Hoa bó', revenue: 12_000_000 }],
  dailyOrders: Array.from({ length: 6 }, (_, index) => ({
    id: `70000000-0000-0000-0000-00000000000${index}`,
    code: `LM-100${index + 1}`,
    deliveryDate: '2026-10-01',
    completedAt: `2026-10-01T${String(index + 9).padStart(2, '0')}:00:00+07:00`,
    productRevenue: 500_000,
    shippingFee: 50_000,
    totalRevenue: 550_000,
  })),
  revenueBasis: 'Doanh thu từ đơn đã thanh toán, không bị hủy, theo ngày giao hàng.',
  profitBasis: 'Lợi nhuận bằng doanh thu trừ chi phí đã ghi nhận.',
};

const cashFlowReport = {
  period: financialReport.period,
  generatedAt: financialReport.generatedAt,
  cashIn: 1_150_000,
  cashOut: 250_000,
  netCash: 900_000,
  points: [{ date: '2026-10-07', label: '07/10', cashIn: 1_150_000, cashOut: 250_000, netCash: 900_000 }],
  transactions: [],
  today: { date: '2026-10-07', deposits: 600_000, remainders: 550_000, shippingPaid: 250_000, otherExpensesPaid: 0, netCash: 900_000 },
  incompleteHistoryCount: 0,
};

const managerialSummary = {
  from: '2026-10-01', to: '2026-10-07', periodId: '80000000-0000-0000-0000-000000000001', periodStatus: 1,
  isProvisional: false, provisionalReasons: [], productRevenue: 18_800_000, customerShippingFee: 2_030_000,
  actualCarrierCost: 250_000, operatingExpense: 120_000, materialProductCogs: 4_000_000, materialWaste: 200_000,
  profitBeforeTax: 16_260_000, profitMarginPercent: 78, openingCashBalance: 4_000_000, cashIn: 1_150_000,
  cashOut: 250_000, closingCashBalance: 4_900_000, supplierDebt: 600_000, operatingExpenseDebt: 20_000,
  materials: [{ group: 1, openingValue: 3_000_000, purchasesValue: 5_000_000, endingValue: 3_800_000, consumptionValue: 4_200_000, wasteValue: 200_000, productCogsValue: 4_000_000, isEstimated: false }],
  documents: [{ status: 2, count: 1, amount: 5_000_000 }], taxConfigured: false,
  taxMessage: 'Chưa có cấu hình thuế đã xác nhận.', unreconciledShippingCount: 0, incompleteExpensePaymentCount: 0,
};
const purchase = { id: 'purchase-1', purchaseDate: '2026-10-02', receivedDate: '2026-10-02', vendorName: 'Chợ hoa Hồ Thị Kỷ', vendorAddress: 'Sạp A1', vendorTaxId: null, documentStatus: 2, taxEligibilityStatus: 1, documentReference: 'PM-01', attachmentUrl: null, notes: null, totalAmount: 1_000_000, paidAmount: 400_000, outstandingAmount: 600_000, lines: [{ id: 'line-1', group: 1, description: 'Hoa tươi', amount: 1_000_000 }], payments: [], createdAt: '2026-10-02T00:00:00Z', updatedAt: '2026-10-02T00:00:00Z' };
const financePeriod = { id: 'period-1', from: '2026-10-01', to: '2026-10-07', openingCashBalance: 4_000_000, status: 1, dataVersion: 3, stocktakeConfirmed: false, shippingConfirmed: false, expensesConfirmed: false, canClose: false, closedAt: null, stocktake: [], history: [] };

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
    if (url.pathname === '/api/reports/cash-flow') return json(route, cashFlowReport);
    if (url.pathname === '/api/finance/summary') return json(route, managerialSummary);
    if (url.pathname === '/api/finance/purchases' && route.request().method() === 'GET') return json(route, [purchase]);
    if (url.pathname === '/api/finance/purchases' && route.request().method() === 'POST') return json(route, { id: 'purchase-2' }, 201);
    if (url.pathname.includes('/api/finance/purchases/') && url.pathname.endsWith('/payments')) return route.fulfill({ status: 204 });
    if (url.pathname === '/api/finance/periods' && route.request().method() === 'POST') return json(route, financePeriod);
    if (url.pathname === '/api/finance/periods/period-1') return json(route, financePeriod);
    if (url.pathname.startsWith('/api/finance/periods/')) return route.fulfill({ status: 204 });
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
  expect(url.searchParams.get('groupBy')).toBe('day');
  await expect(page.getByRole('heading', { name: 'Nhìn rõ nhịp kinh doanh.', level: 1 })).toBeVisible();
  await expect(page.getByText(/18,8\s*Tr/).first()).toBeVisible();
  await expect(page.getByText('38 đơn', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Doanh thu theo ngày' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab')).toHaveCount(5);
  await expect(page.getByRole('heading', { name: 'Nhịp doanh thu mỗi ngày' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cột' })).toBeVisible();
  await page.getByRole('button', { name: 'Xem chi tiết ngày' }).click();
  await expect(page.getByRole('dialog')).toContainText('LM-1001');
  await page.getByRole('button', { name: 'Đóng' }).last().click();
});

test('changing the report range reloads the financial API', async ({ page }) => {
  await page.goto('/admin/reports');
  await page.getByLabel('Từ ngày').fill('2026-10-02');
  await page.getByLabel('Đến ngày').fill('2026-10-06');
  const requestPromise = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname === '/api/reports/financial'
      && url.searchParams.get('from') === '2026-10-02'
      && url.searchParams.get('to') === '2026-10-06';
  });
  await page.getByRole('button', { name: 'Áp dụng' }).click();
  await requestPromise;
});

test('daily revenue exports a CSV for the active range', async ({ page }) => {
  await page.goto('/admin/reports');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('lamie-doanh-thu-');
});

test('chart mode and shipping toggle update the visual and API query', async ({ page }) => {
  await page.goto('/admin/reports');
  await page.getByRole('button', { name: 'Cột' }).click();
  await expect(page.getByRole('button', { name: 'Cột' })).toHaveAttribute('aria-pressed', 'true');
  const requestPromise = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname === '/api/reports/financial'
      && url.searchParams.get('includeShippingFeeInRevenue') === 'true';
  });
  await page.getByText('Tính cả phí giao hàng').click();
  await requestPromise;
});

test('finance v2 stays within the viewport in Mint Calm and Lime Noir', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  const sizes = [
    { width: 1440, height: 900, name: 'desktop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 390, height: 844, name: 'mobile' },
  ];
  for (const size of sizes) {
    await page.setViewportSize(size);
    await page.goto('/admin/reports');
    await expect(page.getByRole('heading', { name: 'Nhìn rõ nhịp kinh doanh.' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/finance-v2/mint-${size.name}-${size.width}.png`, fullPage: true });
  }

  await page.evaluate(() => localStorage.setItem('lamie-theme-v3', 'noir'));
  for (const size of [sizes[0], sizes[2]]) {
    await page.setViewportSize(size);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Nhìn rõ nhịp kinh doanh.' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/finance-v2/noir-${size.name}-${size.width}.png`, fullPage: true });
  }
  expect(browserErrors).toEqual([]);
});

test('purchase and period-close workspaces use the persisted finance contracts', async ({ page }) => {
  await page.goto('/admin/finance/purchases');
  await expect(page.getByRole('heading', { name: 'Mua nguyên liệu', level: 1 })).toBeVisible();
  await expect(page.getByText('Chợ hoa Hồ Thị Kỷ')).toBeVisible();
  await page.getByRole('button', { name: 'Ghi trả tiền' }).click();
  await expect(page.getByRole('dialog', { name: 'Ghi nhận trả tiền nhà cung cấp' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.getByRole('button', { name: 'Đóng' }).click();

  await page.goto('/admin/finance/period-close');
  await expect(page.getByRole('heading', { name: 'Kiểm kê & chốt kỳ', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Mở / tạo kỳ' }).click();
  await expect(page.getByText(/Kỳ đang mở/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Chốt kỳ' })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
