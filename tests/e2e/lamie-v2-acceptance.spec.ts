import { expect, test, type Page, type Route } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const TODAY = '2026-10-10';
const routes = [
  ['dashboard.home', '/admin/dashboard', 'dashboard.view'],
  ['orders.list', '/admin/orders', 'orders.view'],
  ['orders.detail', '/admin/orders/:id', 'orders.view'],
  ['reports.financial', '/admin/reports', 'reports.view'],
].map(([pageKey, path, permissionCode], index) => ({
  id: `70000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`,
  key: pageKey,
  moduleKey: pageKey.split('.')[0],
  pageKey,
  path,
  permissionCode,
  sortOrder: index * 10,
}));

const user = {
  id: '70000000-0000-0000-0000-000000000099', email: 'admin@lamie.test',
  userName: 'admin', fullName: 'Nguyễn Ngọc', role: 1, isActive: true,
  permissions: ['dashboard.view', 'orders.view', 'orders.manage', 'reports.view'],
  createdAt: '2026-01-01T00:00:00Z',
};

const menuItem = (key: string, label: string, path: string | null, iconKey: string | null, permissionCode: string | null, sortOrder: number, children: unknown[] = []) => ({
  id: `71000000-0000-0000-0000-${String(sortOrder).padStart(12, '0')}`,
  key, label, description: null, path, iconKey, permissionCode, sortOrder, openInNewTab: false, children,
});
const menu = [
  menuItem('dashboard.home', 'Tổng quan', '/admin/dashboard', 'layout-dashboard', 'dashboard.view', 10),
  menuItem('group.sales', 'Bán hàng', null, null, null, 20, [
    menuItem('orders.list', 'Đơn hàng', '/admin/orders', 'shopping-bag', 'orders.view', 21),
  ]),
  menuItem('group.finance', 'Tài chính', null, null, null, 30, [
    menuItem('reports.financial', 'Báo cáo', '/admin/reports', 'chart-no-axes-combined', 'reports.view', 31),
  ]),
];

const orders = [
  ['order-1', 'LAM-1010-01', '08:30', 'Minh Anh', 'Bó hồng kem', 1_150_000, 600_000, 2],
  ['order-2', 'LAM-1010-02', '10:15', 'Thùy Dương', 'Giỏ hoa chúc mừng', 890_000, 890_000, 3],
  ['order-3', 'LAM-1011-01', '09:00', 'Hoàng Nam', 'Kệ hoa khai trương', 2_400_000, 800_000, 1],
  ['order-4', 'LAM-1012-01', '14:30', 'Bảo Trân', 'Bó tulip trắng', 1_320_000, 0, 1],
].map(([id, orderCode, clock, recipientName, productSummary, totalAmount, paidAmount, orderStatus], index) => {
  const day = index < 2 ? '10' : index === 2 ? '11' : '12';
  const [hour, minute] = String(clock).split(':');
  return {
    id, orderCode, ordererName: recipientName, ordererPhone: '0909000000', channelId: 'admin',
    recipientName, recipientPhone: '0909000000', pickupAtShop: false, provinceShipping: false,
    deliveryAddress: 'TP. Hồ Chí Minh', deliveryAt: `2026-10-${day}T${hour}:${minute}:00+07:00`,
    deliveryTo: null, depositAmount: paidAmount, shippingFee: 50_000, shippingFeeActual: null,
    subTotal: Number(totalAmount) - 50_000, totalAmount, paymentStatus: Number(paidAmount) >= Number(totalAmount) ? 3 : Number(paidAmount) > 0 ? 2 : 1,
    orderStatus, createdAt: '2026-10-09T09:00:00+07:00', contentNote: null, imageUrl: null,
    productSummary, paidAmount, remainingAmount: Number(totalAmount) - Number(paidAmount), paymentHistoryIncomplete: false, completedAt: null,
  };
});

const dashboard = {
  period: { key: '7d', label: '7 ngày', days: 7, currentStart: TODAY, currentEnd: '2026-10-16', previousStart: '2026-10-03', previousEnd: '2026-10-09' },
  generatedAt: '2026-10-10T09:00:00+07:00', newOrdersCount: 4, activeOrders: null, revenue: null, inventory: null, sourceErrors: [],
  v2: {
    upcoming: {
      from: TODAY, to: '2026-10-16', orderCount: 12, attentionCount: 3, orderValue: 12_860_000,
      paidAmount: 4_200_000, remainingAmount: 8_660_000, overdueBeforeTodayCount: 2,
      days: ['10', '11', '12', '13', '14', '15', '16'].map((day, index) => ({ date: `2026-10-${day}`, orderCount: [4, 3, 2, 1, 0, 1, 1][index] })),
      nextOrders: orders.slice(0, 2),
    },
    todayFinance: {
      date: TODAY, completedOrderCount: 5, productRevenue: 5_450_000, shippingRevenue: 240_000, revenue: 5_690_000,
      cashIn: 4_300_000, cashOut: 620_000, netCash: 3_680_000, deposits: 2_600_000, remainders: 1_700_000,
      shippingPaid: 320_000, otherExpensesPaid: 300_000, incompleteHistoryCount: 1,
    },
  },
};

const financial = {
  period: { from: '2026-10-01', to: TODAY, groupBy: 'day', days: 10 }, generatedAt: '2026-10-10T09:00:00+07:00',
  revenue: 25_480_000, productRevenue: 23_950_000, shippingFee: 1_530_000, shippingFeeActual: 1_120_000,
  otherExpense: 2_350_000, expense: 3_470_000, profit: 22_010_000, temporaryDifference: 22_010_000,
  profitMarginPercent: 86.38, orderCount: 31, expenseCount: 8, incompleteExpenseHistoryCount: 0, includeShippingFeeInRevenue: true,
  materialProductCogs: 8_000_000, materialWaste: 500_000, isProfitProvisional: false, profitProvisionalReasons: [],
  points: Array.from({ length: 10 }, (_, index) => ({
    from: `2026-10-${String(index + 1).padStart(2, '0')}`, to: `2026-10-${String(index + 1).padStart(2, '0')}`,
    label: `${String(index + 1).padStart(2, '0')}/10`, revenue: 1_500_000 + index * 210_000,
    productRevenue: 1_400_000 + index * 195_000, shippingFee: 100_000 + index * 15_000,
    shippingFeeActual: 80_000 + index * 7_000, otherExpense: index % 3 === 0 ? 320_000 : 120_000,
    expense: 400_000, profit: 1_100_000 + index * 200_000, orderCount: 2 + index % 3, expenseCount: 1,
  })),
  expensesByCategory: [], revenueByProductLine: [], revenueByCategory: [],
  revenueBasis: 'Doanh thu theo ngày giao thực tế.', profitBasis: 'Chênh lệch tạm tính, không phải lợi nhuận kế toán.',
};

const cash = {
  period: financial.period, generatedAt: financial.generatedAt, cashIn: 20_850_000, cashOut: 3_120_000, netCash: 17_730_000,
  points: financial.points.map((point, index) => ({ date: point.from, label: point.label, cashIn: 1_100_000 + index * 180_000, cashOut: 180_000 + index * 25_000, netCash: 920_000 + index * 155_000 })),
  transactions: [
    { id: 'cash-1', occurredAt: '2026-10-10T09:10:00+07:00', direction: 'in', kind: 'Deposit', reference: 'LAM-1010-01', deliveryDate: '2026-10-10', method: 'BankTransfer', amount: 600_000, note: null },
    { id: 'cash-2', occurredAt: '2026-10-10T10:45:00+07:00', direction: 'in', kind: 'Remainder', reference: 'LAM-1010-02', deliveryDate: '2026-10-10', method: 'Cash', amount: 550_000, note: null },
    { id: 'cash-3', occurredAt: '2026-10-10T15:20:00+07:00', direction: 'out', kind: 'Shipping', reference: 'LAM-1010-02', deliveryDate: '2026-10-10', method: 'Cash', amount: 120_000, note: 'Phí ship thực tế' },
    { id: 'cash-4', occurredAt: '2026-10-09T16:00:00+07:00', direction: 'out', kind: 'Expense', reference: 'Mua giấy gói', deliveryDate: null, method: 'BankTransfer', amount: 280_000, note: 'Vật tư' },
  ],
  today: { date: TODAY, deposits: 600_000, remainders: 550_000, shippingPaid: 120_000, otherExpensesPaid: 0, netCash: 1_030_000 },
  incompleteHistoryCount: 2,
};

const financeSummary = {
  from: '2026-10-01', to: TODAY, periodId: 'period-1', periodStatus: 1, isProvisional: false, provisionalReasons: [],
  productRevenue: 23_950_000, customerShippingFee: 1_530_000, actualCarrierCost: 1_120_000, operatingExpense: 2_350_000,
  materialProductCogs: 8_000_000, materialWaste: 500_000, profitBeforeTax: 13_510_000, profitMarginPercent: 53,
  openingCashBalance: 4_000_000, cashIn: 20_850_000, cashOut: 3_120_000, closingCashBalance: 21_730_000,
  supplierDebt: 2_000_000, operatingExpenseDebt: 400_000,
  materials: [{ group: 1, openingValue: 3_000_000, purchasesValue: 10_000_000, endingValue: 4_500_000, consumptionValue: 8_500_000, wasteValue: 500_000, productCogsValue: 8_000_000, isEstimated: false }],
  documents: [{ status: 2, count: 2, amount: 10_000_000 }], taxConfigured: false,
  taxMessage: 'Chưa có cấu hình thuế đã xác nhận.', unreconciledShippingCount: 0, incompleteExpensePaymentCount: 0,
};

const respond = (route: Route, body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const installMocks = async (page: Page) => {
  await page.addInitScript(({ account }) => {
    localStorage.setItem('lamie_access_token', 'v2-visual-token');
    localStorage.setItem('lamie_refresh_token', 'v2-visual-refresh');
    localStorage.setItem('lamie_user_json', JSON.stringify(account));
  }, { account: user });
  await page.route(/^https?:\/\/[^/]+\/api\//, async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me') return respond(route, user);
    if (path === '/api/admin/navigation/me/routes') return respond(route, routes);
    if (path === '/api/admin/navigation/me') return respond(route, menu);
    if (path === '/api/dashboard') return respond(route, dashboard);
    if (path === '/api/orders/delivery-board') return respond(route, { items: orders, summary: { orderCount: 4, todayCount: 2, lateTodayCount: 1, totalAmount: 5_760_000, paidAmount: 2_290_000, remainingAmount: 3_470_000, overdueBeforeTodayCount: 2 }, generatedAt: dashboard.generatedAt });
    if (path === '/api/reports/financial') return respond(route, financial);
    if (path === '/api/reports/cash-flow') return respond(route, cash);
    if (path === '/api/finance/summary') return respond(route, financeSummary);
    return respond(route, { message: `Unhandled QA route ${path}` }, 404);
  });
};

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-10T02:00:00Z'));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await installMocks(page);
  await mkdir('artifacts/lamie-v2', { recursive: true });
  await mkdir('artifacts/lamie-themes', { recursive: true });
});

test('V2 dashboard, orders and report tabs match their interaction boundaries', async ({ page }) => {
  await page.goto('/admin/dashboard');
  await expect(page.getByRole('heading', { name: 'Một ngày mới ở Lamie' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Khoảng ngày giao nhanh' })).toHaveCount(0);
  await expect(page.getByText('Lịch giao sắp tới')).toBeVisible();
  await expect(page.getByText('Tài chính hôm nay')).toBeVisible();
  await page.screenshot({ path: 'artifacts/lamie-v2/01-tong-quan.png', fullPage: true });

  const orderRequestPromise = page.waitForRequest(request => new URL(request.url()).pathname === '/api/orders/delivery-board');
  await page.goto('/admin/orders');
  await expect(page.getByRole('group', { name: 'Khoảng ngày hẹn' })).toBeVisible();
  await expect(page.getByRole('button', { name: '7 ngày', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const orderRequest = await orderRequestPromise;
  const orderUrl = new URL(orderRequest.url());
  expect(orderUrl.searchParams.get('deliveryFrom')).toContain('2026-10-10T00:00:00');
  expect(orderUrl.searchParams.get('deliveryTo')).toContain('2026-10-16T23:59:59.999');
  await expect(page.getByText('Danh sách theo ngày hẹn')).toBeVisible();
  await page.screenshot({ path: 'artifacts/lamie-v2/02-don-hang.png', fullPage: true });

  const threeDayRequest = page.waitForRequest(request => {
    const url = new URL(request.url());
    return url.pathname === '/api/orders/delivery-board' && url.searchParams.get('deliveryTo')?.includes('2026-10-12') === true;
  });
  await page.getByRole('button', { name: '3 ngày', exact: true }).click();
  expect(new URL((await threeDayRequest).url()).searchParams.get('deliveryFrom')).toContain('2026-10-10');

  const todayRequest = page.waitForRequest(request => {
    const url = new URL(request.url());
    return url.pathname === '/api/orders/delivery-board' && url.searchParams.get('deliveryTo')?.includes('2026-10-10') === true;
  });
  await page.getByRole('button', { name: 'Hôm nay', exact: true }).click();
  expect(new URL((await todayRequest).url()).searchParams.get('deliveryFrom')).toContain('2026-10-10');

  const allRequest = page.waitForRequest(request => {
    const url = new URL(request.url());
    return url.pathname === '/api/orders/delivery-board' && !url.searchParams.has('deliveryFrom');
  });
  await page.getByRole('button', { name: 'Tất cả', exact: true }).click();
  const allUrl = new URL((await allRequest).url());
  expect(allUrl.searchParams.has('deliveryTo')).toBe(false);
  expect(allUrl.searchParams.has('statusGroup')).toBe(false);

  await page.getByRole('button', { name: '7 ngày', exact: true }).click();
  const backlogRequest = page.waitForRequest(request => {
    const url = new URL(request.url());
    return url.pathname === '/api/orders/delivery-board' && url.searchParams.get('includeBacklog') === 'true';
  });
  await page.getByLabel('Kèm đơn trễ hoặc chờ tiền trước kỳ').check();
  expect(new URL((await backlogRequest).url()).searchParams.get('deliveryFrom')).toContain('2026-10-10');

  await page.goto('/admin/reports?tab=revenue&from=2026-10-01&to=2026-10-10');
  await expect(page.getByRole('heading', { name: 'Nhìn rõ nhịp kinh doanh.' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Doanh thu theo ngày' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('7 ngày qua')).toHaveCount(0);
  await expect(page.getByLabel('Từ ngày')).toBeVisible();
  await page.screenshot({ path: 'artifacts/lamie-v2/03-bao-cao-doanh-thu.png', fullPage: true });

  await page.getByRole('tab', { name: 'Dòng tiền' }).click();
  await expect(page.getByRole('heading', { name: 'Giao dịch trong kỳ' })).toBeVisible();
  await expect(page.getByText('Số dư cuối kỳ')).toBeVisible();
  await page.screenshot({ path: 'artifacts/lamie-v2/04-bao-cao-dong-tien.png', fullPage: true });
});

test('V2 pages stay inside a mobile viewport and use the sidebar drawer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [path, heading] of [
    ['/admin/dashboard', 'Một ngày mới ở Lamie'],
    ['/admin/orders', 'Đơn hàng'],
    ['/admin/reports?tab=revenue&from=2026-10-01&to=2026-10-10', 'Nhìn rõ nhịp kinh doanh.'],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  }

  const menuButton = page.getByRole('button', { name: 'Mở menu điều hướng' });
  await expect(menuButton).toBeVisible();
  await menuButton.click();
  await expect(page.getByRole('button', { name: 'Đóng menu điều hướng' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tổng quan' })).toBeVisible();
});

test('theme preview, cancel, apply, persistence, motion and screenshots', async ({ page }) => {
  await page.setViewportSize({ width: 1800, height: 1669 });
  await page.goto('/admin/appearance');

  await expect(page.getByRole('heading', { name: 'Chủ đề giao diện', level: 1 })).toBeVisible();
  await expect(page.getByRole('radio')).toHaveCount(6);
  await expect(page.getByRole('radio', { name: /Mint Calm/ })).toHaveAttribute('aria-checked', 'true');
  await page.screenshot({ path: 'artifacts/lamie-themes/00-chon-chu-de.png', fullPage: true });

  await page.getByRole('radio', { name: /Mint Calm/ }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: /Cobalt Sand/ })).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Home');
  await expect(page.getByRole('radio', { name: /Violet Mist/ })).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'violet');
  await page.getByRole('link', { name: 'Tổng quan' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'violet');
  await page.getByRole('button', { name: 'Hủy xem trước' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'mint');

  await page.goto('/admin/appearance');
  await page.getByRole('radio', { name: /Cobalt Sand/ }).click();
  await page.getByRole('button', { name: 'Áp dụng chủ đề' }).click();
  await expect(page.getByText('Đã áp dụng chủ đề Cobalt Sand.')).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'cobalt');
  await expect(page.getByRole('radio', { name: /Cobalt Sand/ })).toHaveAttribute('aria-checked', 'true');

  const motionSwitch = page.getByRole('switch', { name: /chuyển động nhẹ/i });
  await motionSwitch.click();
  await expect(motionSwitch).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');

  const animatedIconsOutsideSidebar = await page.locator('[data-lucide-animated]').evaluateAll((nodes) =>
    nodes.filter((node) => !node.closest('#admin-sidebar')).length,
  );
  expect(animatedIconsOutsideSidebar).toBe(0);

  const screenshots = [
    ['violet', '01-violet.png'],
    ['grove', '02-grove.png'],
    ['glass', '03-glass.png'],
    ['mint', '04-mint.png'],
    ['cobalt', '05-cobalt.png'],
    ['noir', '06-noir.png'],
  ] as const;
  await page.setViewportSize({ width: 1800, height: 1715 });
  for (const [themeId, fileName] of screenshots) {
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: 'lamie-theme-v3', value: themeId });
    await page.goto('/admin/dashboard');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', themeId);
    await expect(page.getByRole('heading', { name: 'Một ngày mới ở Lamie' })).toBeVisible();
    await page.screenshot({ path: `artifacts/lamie-themes/${fileName}`, fullPage: true });
  }
});

test('theme screen stays usable on mobile without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/appearance');
  await expect(page.getByRole('heading', { name: 'Chủ đề giao diện', level: 1 })).toBeVisible();
  await expect(page.getByRole('radio')).toHaveCount(6);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  await page.getByRole('radio', { name: /Lime Noir/ }).click();
  await expect(page.getByRole('button', { name: 'Áp dụng chủ đề' })).toBeVisible();
  await page.locator('main').evaluate((element) => { element.scrollTop = element.scrollHeight; });
  await expect(page.getByRole('heading', { name: 'Chuyển động nhẹ' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
});
