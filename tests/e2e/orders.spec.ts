import { expect, test, type Page, type Route } from '@playwright/test';
import { captureResponsivePage } from './visualQa';

const browserErrors = new WeakMap<Page, string[]>();

const ORDER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const ITEM_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const SECOND_ITEM_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc';
const CHANNEL_ID = '11111111-1111-1111-1111-111111111111';

const order = {
  id: ORDER_ID,
  orderCode: 'L260801-AB12',
  ordererName: 'Nguyễn Lan',
  ordererPhone: '0901000001',
  channelId: CHANNEL_ID,
  channelName: 'Admin',
  recipientName: 'Trần Minh',
  recipientPhone: '0912345678',
  pickupAtShop: false,
  provinceShipping: false,
  deliveryAddress: '461 Phan Văn Trị, TP.HCM',
  deliveryAddressDescription: null,
  deliveryLatitude: null,
  deliveryLongitude: null,
  deliveryAt: '2026-10-10T03:00:00.000Z',
  deliveryTo: '2026-10-10T05:00:00.000Z',
  depositAmount: 100000,
  shippingFee: 0,
  shippingFeeActual: null,
  subTotal: 450000,
  totalAmount: 450000,
  paymentStatus: 2,
  orderStatus: 1,
  createdAt: '2026-08-01T02:00:00.000Z',
  imageUrl: 'https://images.test/product.jpg',
  updatedAt: '2026-08-01T02:00:00.000Z',
  description: null,
  contentNote: 'Gói giấy màu kem',
  productSummary: 'Bó hồng kem · Bó hoa theo mẫu riêng',
  paidAmount: 100000,
  remainingAmount: 350000,
  paymentHistoryIncomplete: false,
  rowVersion: 'AQIDBA==',
  quantityTotal: 2,
  hasCard: true,
  hasBanner: true,
  cardMessage: 'Chúc mừng sinh nhật\nLuôn rạng rỡ nhé!',
  bannerMessage: 'Happy birthday Minh',
  trackingGroup: 'today',
  preparationDate: '2026-10-09',
  assigneeName: 'Lan Florist',
  completedAt: null,
  payments: [],
  items: [
    {
      id: ITEM_ID,
      productId: '12',
      productSku: 'LAMIE-ROSE-12',
      productName: 'Bó hồng kem',
      thumbnailUrl: 'https://images.test/product.jpg',
      unitPrice: 450000,
      quantity: 1,
      lineTotal: 450000,
      note: null,
    },
    {
      id: SECOND_ITEM_ID,
      productId: null,
      productSku: null,
      productName: 'Bó hoa theo mẫu riêng',
      thumbnailUrl: null,
      unitPrice: 300000,
      quantity: 1,
      lineTotal: 300000,
      note: null,
    },
  ],
  images: [
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      orderItemId: ITEM_ID,
      imageUrl: 'https://images.test/illustration.jpg',
      sortOrder: 0,
      description: 'Ảnh mẫu khách gửi',
    },
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccd',
      orderItemId: ITEM_ID,
      imageUrl: 'https://images.test/finished.jpg',
      sortOrder: 1,
      description: 'Ảnh hoa hoàn thiện',
    },
    {
      id: 'cccccccc-cccc-cccc-cccc-ccccccccccce',
      orderItemId: SECOND_ITEM_ID,
      imageUrl: 'https://images.test/custom.jpg',
      sortOrder: 0,
      description: 'Ảnh mẫu cho sản phẩm riêng',
    },
  ],
  changeLogs: [{
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    entityName: 'Order',
    fieldName: 'OrderStatus',
    oldValue: null,
    newValue: '1',
    changeType: 'Created',
    changedById: null,
    changedByName: 'Admin Test',
    changedAt: '2026-08-01T02:00:00.000Z',
    note: null,
  }],
};

const adminUser = {
  id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  email: 'admin@lamie.test',
  userName: 'admin_test',
  fullName: 'Admin Test',
  role: 1,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const orderRoutes = [
  ['orders.list', '/admin/orders', 'orders.view'],
  ['orders.create', '/admin/orders/new', 'orders.manage'],
  ['orders.calendar', '/admin/orders/calendar', 'orders.view'],
  ['orders.detail', '/admin/orders/:id', 'orders.view'],
  ['orders.edit', '/admin/orders/:id/edit', 'orders.manage'],
].map(([pageKey, path, permissionCode], index) => ({
  id: `50000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`,
  key: pageKey,
  moduleKey: 'orders',
  pageKey,
  path,
  permissionCode,
  sortOrder: (index + 1) * 10,
}));

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const installApiMocks = async (page: Page) => {
  let deleted = false;
  await page.addInitScript(({ user }) => {
    localStorage.setItem('lamie_access_token', 'e2e-access-token');
    localStorage.setItem('lamie_refresh_token', 'e2e-refresh-token');
    localStorage.setItem('lamie_user_json', JSON.stringify(user));
  }, { user: adminUser });

  await page.route('https://images.test/**', (route) => route.fulfill({
    status: 200,
    contentType: 'image/png',
    body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  }));

  await page.route(/^https?:\/\/[^/]+\/api\//, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/auth/me') return json(route, adminUser);
    if (url.pathname === '/api/admin/navigation/me/routes') return json(route, orderRoutes);
    if (url.pathname === '/api/admin/navigation/me') return json(route, []);
    if (url.pathname === '/api/settings/attributes/channels') {
      return json(route, [{ id: CHANNEL_ID, code: 'admin', name: 'Admin', isActive: true, sortOrder: 10 }]);
    }
    if (url.pathname === '/api/settings/attributes/product-types') {
      return json(route, [{ id: 1, code: 'FRESH_FLOWERS', isActive: true, sortOrder: 10, translations: [{ languageCode: 'vi', name: 'Hoa tươi' }] }]);
    }
    if (url.pathname === '/api/settings/attributes/categories') {
      return json(route, [{ id: 1, code: 'BOUQUET', isActive: true, sortOrder: 10, translations: [{ languageCode: 'vi', name: 'Hoa bó' }] }]);
    }
    if (url.pathname === '/api/admin/administrative-units/provinces') return json(route, []);
    if (url.pathname === '/api/settings/products') {
      return json(route, [{
        id: 12,
        sku: 'LAMIE-ROSE-12',
        price: 450000,
        salePrice: null,
        stock: 10,
        tracksInventory: true,
        categoryId: 1,
        productTypeId: 1,
        isActive: true,
        thumbnailUrl: 'https://images.test/product.jpg',
        translations: [{ id: 1, languageCode: 'vi', name: 'Bó hồng kem', slug: 'bo-hong-kem', description: null }],
        images: [],
        tagIds: [],
        colorIds: [],
        collectionIds: [],
        styleIds: [],
        occasionIds: [],
        ingredients: [],
        inventoryMaterials: [],
      }]);
    }
    if (url.pathname === '/api/inventory/items') return json(route, []);
    if (url.pathname === '/api/settings/ingredients') {
      return json(route, { items: [], totalCount: 0, page: 1, pageSize: 100, totalPages: 0, hasNext: false, hasPrevious: false });
    }
    if (url.pathname === '/api/customers') {
      return json(route, { items: [], totalCount: 0, page: 1, pageSize: 8, totalPages: 0, hasNext: false, hasPrevious: false });
    }
    if (url.pathname === `/api/orders/${ORDER_ID}` && request.method() === 'DELETE') {
      deleted = true;
      return route.fulfill({ status: 204 });
    }
    if (url.pathname === `/api/orders/${ORDER_ID}`) return json(route, order);
    if (url.pathname === '/api/orders/delivery-board') {
      const items = deleted ? [] : [order];
      return json(route, {
        items,
        summary: {
          orderCount: items.length,
          todayCount: items.length,
          lateTodayCount: items.length,
          totalAmount: items.reduce((sum, item) => sum + item.totalAmount, 0),
          paidAmount: items.reduce((sum, item) => sum + item.paidAmount, 0),
          remainingAmount: items.reduce((sum, item) => sum + item.remainingAmount, 0),
          overdueBeforeTodayCount: 2,
        },
        generatedAt: '2026-10-10T08:00:00+07:00',
      });
    }
    if (url.pathname === `/api/orders/${ORDER_ID}/payment-status` && request.method() === 'PATCH') {
      return route.fulfill({ status: 204 });
    }
    if (url.pathname === `/api/orders/${ORDER_ID}/shipping-fee-actual` && request.method() === 'PATCH') {
      return route.fulfill({ status: 204 });
    }
    if (url.pathname === `/api/orders/${ORDER_ID}/status/override` && request.method() === 'PATCH') {
      const payload = request.postDataJSON() as { status: number };
      return json(route, { ...order, orderStatus: payload.status, rowVersion: 'AQIDBQ==' });
    }
    if (url.pathname.startsWith(`/api/orders/${ORDER_ID}/actions/`) && request.method() === 'POST') {
      return json(route, order);
    }
    if (url.pathname === '/api/orders') {
      const items = deleted ? [] : [order];
      return json(route, {
        items,
        totalCount: items.length,
        page: 1,
        pageSize: 20,
        totalPages: items.length ? 1 : 0,
        hasNext: false,
        hasPrevious: false,
      });
    }
    return json(route, { success: false, message: `Unhandled mock route ${url.pathname}` }, 404);
  });
};

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-10T02:00:00Z'));
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  await installApiMocks(page);
});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page) ?? []).toEqual([]);
});

test('order list uses the workflow columns and defaults to seven calendar days', async ({ page }) => {
  await page.goto('/admin/orders');
  await expect(page.getByRole('heading', { name: 'Đơn hàng', level: 1 })).toBeVisible();
  await expect(page.getByRole('columnheader').allTextContents()).resolves.toEqual([
    'Đơn / lịch hẹn',
    'Người đặt / kênh',
    'Nhận hàng',
    'Tiến trình',
    'Thanh toán',
    'Nội dung thêm',
    'Thao tác',
  ]);
  await expect(page.getByRole('table').getByText('10:00', { exact: true })).toBeVisible();
  await expect(page.getByRole('table').getByText('Bó hồng kem · Bó hoa theo mẫu riêng')).toBeVisible();
  await expect(page.getByRole('table').getByText('450.000 ₫', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '7 ngày', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('select').first()).toHaveValue('all');
  await captureResponsivePage(page, 'orders');
});

test('order grid prioritizes late, upcoming, unpaid and completed orders with semantic row emphasis', async ({ page }) => {
  const priorityOrders = [
    {
      ...order,
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
      orderCode: 'L261009-DONE',
      orderStatus: 4,
      paymentStatus: 3,
      trackingGroup: 'completed',
      deliveryAt: '2026-10-09T03:00:00.000Z',
      paidAmount: 450000,
      remainingAmount: 0,
    },
    {
      ...order,
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
      orderCode: 'L261012-UNPAID',
      orderStatus: 7,
      paymentStatus: 2,
      trackingGroup: 'delivered-unpaid',
      deliveryAt: '2026-10-12T03:00:00.000Z',
    },
    {
      ...order,
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
      orderCode: 'L261011-SOON',
      orderStatus: 1,
      paymentStatus: 3,
      trackingGroup: 'upcoming',
      deliveryAt: '2026-10-11T03:00:00.000Z',
      paidAmount: 0,
      remainingAmount: 450000,
    },
    {
      ...order,
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      orderCode: 'L261008-LATE',
      orderStatus: 1,
      paymentStatus: 3,
      trackingGroup: 'late',
      deliveryAt: '2026-10-08T03:00:00.000Z',
      paidAmount: 450000,
      remainingAmount: 0,
    },
  ];
  await page.route('**/api/orders/delivery-board**', route => json(route, {
    items: priorityOrders,
    summary: {
      orderCount: 4,
      todayCount: 0,
      lateTodayCount: 1,
      totalAmount: 1800000,
      paidAmount: 1450000,
      remainingAmount: 350000,
      overdueBeforeTodayCount: 1,
      lateCount: 1,
      upcomingCount: 1,
      deliveredUnpaidCount: 1,
      completedCount: 1,
    },
    generatedAt: '2026-10-10T08:00:00+07:00',
    totalCount: 4,
    page: 1,
    pageSize: 25,
    totalPages: 1,
  }));

  await page.goto('/admin/orders');

  const rows = page.locator('tr[data-priority]');
  await expect(rows).toHaveCount(4);
  await expect(rows.evaluateAll(elements => elements.map(element => ({
    priority: element.getAttribute('data-priority'),
    code: element.querySelector('a')?.textContent?.trim(),
  })))).resolves.toEqual([
    { priority: 'late', code: 'L261008-LATE' },
    { priority: 'upcoming', code: 'L261011-SOON' },
    { priority: 'unpaid', code: 'L261012-UNPAID' },
    { priority: 'completed', code: 'L261009-DONE' },
  ]);
  await expect(rows.nth(0)).toHaveClass(/bg-admin-status-error-bg/);
  await expect(rows.nth(1).getByLabel('Trạng thái thanh toán: Đã thanh toán')).toBeVisible();
  await expect(rows.nth(1).getByText('Còn 450.000 ₫', { exact: true })).toHaveCount(0);
  await expect(rows.nth(2)).toHaveClass(/bg-admin-status-warning-bg/);
  await expect(rows.nth(2).getByLabel('Trạng thái đơn: Công nợ')).toBeVisible();
  await expect(rows.nth(3)).toHaveClass(/bg-admin-status-success-bg/);
  await expect(rows.nth(3).getByLabel('Trạng thái đơn: Hoàn tất')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  const paidMobileCard = page.locator('article[data-priority]').filter({ hasText: 'L261011-SOON' });
  await expect(paidMobileCard.getByText('Đã thanh toán', { exact: true })).toBeVisible();
  await expect(paidMobileCard.getByText('Còn 450.000 ₫', { exact: true })).toHaveCount(0);
  await captureResponsivePage(page, 'orders-priority');
});

test('Tất cả removes the date range and preserves the other filters', async ({ page }) => {
  await page.goto('/admin/orders');
  const requestPromise = page.waitForRequest(request => {
    const url = new URL(request.url());
    return url.pathname === '/api/orders/delivery-board' && !url.searchParams.has('deliveryFrom');
  });
  await page.getByRole('button', { name: 'Tất cả', exact: true }).click();
  const request = await requestPromise;
  const url = new URL(request.url());
  expect(url.searchParams.has('statusGroup')).toBe(false);
  expect(url.searchParams.has('deliveryTo')).toBe(false);
});

test('create order requires the orderer, keeps recipient optional, and supports active copy', async ({ page }) => {
  await page.goto('/admin/orders/new');
  await expect(page.getByRole('heading', { name: 'Tạo đơn hàng', level: 1 })).toBeVisible();
  await captureResponsivePage(page, 'new-order');
  await expect(page.getByRole('button', { name: 'Quay lại' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Hủy' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tạo đơn' })).toBeVisible();
  const pageHeader = page.getByRole('heading', { name: 'Tạo đơn hàng', level: 1 }).locator('xpath=ancestor::header');
  await expect(pageHeader.getByRole('link', { name: 'Hủy' })).toBeVisible();
  await expect(pageHeader.getByRole('button', { name: 'Tạo đơn' })).toBeVisible();
  await expect(page.getByLabel('Tên người đặt')).toHaveAttribute('required', '');
  await expect(page.getByLabel('SĐT người đặt')).toHaveAttribute('required', '');
  await expect(page.getByLabel('Tên người nhận')).toHaveValue('');
  await expect(page.getByLabel('SĐT người nhận')).toHaveValue('');
  await page.getByLabel('Tên người đặt').fill('Nguyễn An');
  await page.getByLabel('SĐT người đặt').fill('0909000111');
  await page.getByRole('button', { name: 'Người nhận là người đặt' }).click();
  await expect(page.getByLabel('Tên người nhận')).toHaveValue('Nguyễn An');
  await expect(page.getByLabel('SĐT người nhận')).toHaveValue('0909000111');
  await expect(page.getByLabel('Địa chỉ chi tiết')).toBeVisible();
  const noteBox = await page.getByRole('heading', { name: 'Ghi chú đơn hàng' }).boundingBox();
  const summaryBox = await page.getByRole('heading', { name: 'Tóm tắt & chi phí' }).boundingBox();
  const deliveryBox = await page.getByRole('heading', { name: 'Giao nhận' }).boundingBox();
  expect(noteBox?.y).toBeLessThan(summaryBox?.y ?? 0);
  expect(summaryBox?.y).toBeLessThan(deliveryBox?.y ?? 0);
  await page.getByRole('radio', { name: 'Ship tỉnh' }).click();
  await expect(page.getByRole('group', { name: 'Thời gian gửi đơn vị vận chuyển' })).toBeVisible();
  await expect(page.getByText('lúc bàn giao cho đơn vị vận chuyển')).toBeVisible();
  const productSearch = page.getByLabel('Sản phẩm cụ thể');
  await productSearch.fill('bo hong');
  await expect(page.getByRole('option', { name: 'LAMIE-ROSE-12 - Bó hồng kem 450.000 ₫' })).toBeVisible();
  await productSearch.fill('LAMIE-ROSE-12');
  await expect(page.getByRole('option', { name: 'LAMIE-ROSE-12 - Bó hồng kem 450.000 ₫' })).toBeVisible();
  await page.getByRole('button', { name: 'Khoảng thời gian' }).click();
  await expect(page.getByLabel('Gửi từ')).toBeVisible();
  await expect(page.getByLabel('Đến')).toBeVisible();
});

test('detail merges customer and delivery, then places timeline under actions with both image kinds', async ({ page }) => {
  await page.goto(`/admin/orders/${ORDER_ID}`);
  await expect(page.getByRole('heading', { name: 'Giao hàng và khách hàng' })).toBeVisible();
  await expect(page.getByText('0901000001')).toBeVisible();
  const asideHeadings = await page.locator('aside h2').allTextContents();
  expect(asideHeadings).toEqual(['Trạng thái và hành động', 'Timeline trạng thái và thay đổi']);
  await expect(page.locator('img[alt="Ảnh đại diện sản phẩm Bó hồng kem"]:visible')).toBeVisible();
  await expect(page.locator('img[alt="Ảnh mẫu khách gửi"]:visible').first()).toBeVisible();
  await expect(page.locator('img[alt="Ảnh hoa hoàn thiện"]:visible').first()).toBeVisible();
});

test('detail product avatar and attachments share the responsive gallery preview', async ({ page }) => {
  await page.goto(`/admin/orders/${ORDER_ID}`);

  await page.locator('img[alt="Ảnh đại diện sản phẩm Bó hồng kem"]:visible').dblclick();
  const productDialog = page.getByRole('dialog', { name: 'LAMIE-ROSE-12 - Bó hồng kem' });
  await expect(productDialog).toBeVisible();
  await expect(productDialog.getByText('Ảnh 1 / 3')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(productDialog.getByText('Ảnh 2 / 3')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(productDialog).toBeHidden();

  const attachments = page.getByRole('region', { name: 'Ảnh đính kèm' });
  await attachments.getByAltText('Ảnh mẫu khách gửi').dblclick();
  const attachmentDialog = page.getByRole('dialog', { name: 'LAMIE-ROSE-12 - Bó hồng kem' });
  await expect(attachmentDialog.getByText('Ảnh 1 / 3')).toBeVisible();
  await attachmentDialog.getByRole('button', { name: 'Đóng xem ảnh lớn' }).click();
  await expect(attachmentDialog).toBeHidden();
});

test('multiple order items keep independent image preview galleries', async ({ page }) => {
  await page.goto(`/admin/orders/${ORDER_ID}`);

  const customImage = page.locator('img[alt="Ảnh mẫu cho sản phẩm riêng"]:visible').first();
  await customImage.dblclick();
  const customDialog = page.getByRole('dialog', { name: 'Bó hoa theo mẫu riêng' });
  await expect(customDialog).toBeVisible();
  await expect(customDialog.getByText(/Ảnh \d+ \/ \d+/)).toHaveCount(0);
  await customDialog.getByRole('button', { name: 'Đóng xem ảnh lớn' }).click();
});

test('image preview stays inside a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/admin/orders/${ORDER_ID}`);

  await page.locator('img[alt="Ảnh đại diện sản phẩm Bó hồng kem"]:visible').dblclick();
  const dialog = page.getByRole('dialog', { name: 'LAMIE-ROSE-12 - Bó hồng kem' });
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds?.x ?? -1).toBeGreaterThanOrEqual(0);
  expect(bounds?.y ?? -1).toBeGreaterThanOrEqual(0);
  expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(390);
  expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(844);
  await dialog.getByRole('button', { name: 'Đóng xem ảnh lớn' }).click();
});

test('mobile order list keeps detail action accessible without the desktop table', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/orders');
  await expect(page.getByRole('table')).toBeHidden();
  await expect(page.getByRole('link', { name: 'Xem chi tiết' })).toBeVisible();
});

test('summary stays modal and payment confirmation sends a real receipt payload', async ({ page }) => {
  await page.goto('/admin/orders');
  await page.getByRole('button', { name: 'Xem tóm tắt' }).first().click();

  const dialog = page.getByRole('dialog', { name: /L260801-AB12 - Tóm tắt/ });
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/orders(?:\?|$)/);
  await expect(dialog.getByText('Còn lại')).toBeVisible();

  await dialog.getByRole('button', { name: 'Đánh dấu đã thanh toán' }).click();
  await expect(dialog.getByText(/không tự tạo giao dịch ngân hàng/i)).toBeVisible();
  await expect(dialog.getByLabel('Phương thức')).toHaveCount(0);
  const paymentRequest = page.waitForRequest(request =>
    new URL(request.url()).pathname === `/api/orders/${ORDER_ID}/payment-status`
      && request.method() === 'PATCH');
  await dialog.getByRole('button', { name: 'Xác nhận đã nhận tiền' }).click();
  const payload = (await paymentRequest).postDataJSON();

  expect(payload.status).toBe(3);
  expect(payload.amount).toBe(350000);
  expect(payload.method).toBe(99);
  expect(payload.paidAt).toMatch(/^2026-10-10T\d{2}:\d{2}:00\+07:00$/);
  expect(payload.idempotencyKey).toBeTruthy();
});

test('card and banner are keyboard-accessible and keep multiline content', async ({ page }) => {
  await page.goto('/admin/orders');
  const trigger = page.getByRole('button', { name: /Xem Thiệp và banner của đơn L260801-AB12/ });
  await trigger.focus();
  await page.keyboard.press('Enter');

  const dialog = page.getByRole('dialog', { name: /L260801-AB12 - Nội dung thêm/ });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Chúc mừng sinh nhật\nLuôn rạng rỡ nhé!')).toBeVisible();
  await expect(dialog.getByText('Happy birthday Minh')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('quick actual shipping preserves zero and sends concurrency token', async ({ page }) => {
  await page.goto('/admin/orders');
  await page.getByRole('button', { name: /Ship thực tế: chưa chốt/ }).click();
  const dialog = page.getByRole('dialog', { name: /L260801-AB12 - Phí ship thực tế/ });
  const input = dialog.getByLabel('Phí ship thực tế');
  await input.fill('0');

  const shippingRequest = page.waitForRequest(request =>
    new URL(request.url()).pathname === `/api/orders/${ORDER_ID}/shipping-fee-actual`
      && request.method() === 'PATCH');
  await dialog.getByRole('button', { name: 'Lưu phí ship' }).click();
  const payload = (await shippingRequest).postDataJSON();

  expect(payload.shippingFeeActual).toBe(0);
  expect(payload.rowVersion).toBe('AQIDBA==');
});

test('summary modal edits actual shipping without opening the full editor', async ({ page }) => {
  await page.goto('/admin/orders');
  await page.getByRole('button', { name: 'Xem tóm tắt' }).click();
  const dialog = page.getByRole('dialog', { name: /L260801-AB12 - Tóm tắt/ });
  await dialog.getByRole('button', { name: 'Sửa phí ship' }).click();
  await dialog.getByLabel('Số tiền thực tế').fill('35000');

  const shippingRequest = page.waitForRequest(request =>
    new URL(request.url()).pathname === `/api/orders/${ORDER_ID}/shipping-fee-actual`
      && request.method() === 'PATCH');
  await dialog.getByRole('button', { name: 'Lưu phí ship' }).click();
  expect((await shippingRequest).postDataJSON()).toMatchObject({ shippingFeeActual: 35000, rowVersion: 'AQIDBA==' });
});

test('privileged status change is a separate audited action', async ({ page }) => {
  await page.goto(`/admin/orders/${ORDER_ID}`);
  await expect(page.getByRole('button', { name: 'Chuẩn bị đơn' }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Chuyển trạng thái' }).click();
  const dialog = page.getByRole('dialog', { name: /Chuyển trạng thái đơn L260801-AB12/ });
  await dialog.getByLabel('Trạng thái đích').selectOption('6');
  await dialog.getByLabel('Lý do / ghi chú').fill('Khớp tình trạng thực tế');

  const statusRequest = page.waitForRequest(request =>
    new URL(request.url()).pathname === `/api/orders/${ORDER_ID}/status/override`
      && request.method() === 'PATCH');
  await dialog.getByRole('button', { name: 'Xác nhận chuyển' }).click();
  expect((await statusRequest).postDataJSON()).toMatchObject({
    status: 6,
    rowVersion: 'AQIDBA==',
    reason: 'Khớp tình trạng thực tế',
  });
  await expect(page.getByText('Đã chuyển trạng thái đơn thành thành phẩm.')).toBeVisible();
});
