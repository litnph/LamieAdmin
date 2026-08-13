import { expect, test, type Page, type Route } from '@playwright/test';

const browserErrors = new WeakMap<Page, string[]>();

const ORDER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const ITEM_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const SECOND_ITEM_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc';
const CHANNEL_ID = '11111111-1111-1111-1111-111111111111';

const order = {
  id: ORDER_ID,
  orderCode: 'L260801-AB12',
  ordererName: 'Nguyễn Lan',
  ordererPhone: '',
  channelId: CHANNEL_ID,
  recipientName: 'Trần Minh',
  recipientPhone: '0912345678',
  pickupAtShop: false,
  provinceShipping: false,
  deliveryAddress: null,
  deliveryAddressDescription: null,
  deliveryLatitude: null,
  deliveryLongitude: null,
  deliveryAt: '2026-08-02T03:00:00.000Z',
  deliveryTo: '2026-08-02T05:00:00.000Z',
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
      }]);
    }
    if (url.pathname === `/api/orders/${ORDER_ID}` && request.method() === 'DELETE') {
      deleted = true;
      return route.fulfill({ status: 204 });
    }
    if (url.pathname === `/api/orders/${ORDER_ID}`) return json(route, order);
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

test('order list uses the requested columns, range and advanced filter dialog', async ({ page }) => {
  await page.goto('/admin/orders');
  await expect(page.getByRole('heading', { name: 'Đơn hàng', level: 1 })).toBeVisible();
  await expect(page.getByRole('columnheader').allTextContents()).resolves.toEqual([
    'Mã đơn',
    'Ảnh',
    'Thời gian giao',
    'Người nhận',
    'Ghi chú',
    'Số tiền',
    'Thanh toán',
    'Trạng thái',
    'Hành động',
  ]);
  await expect(page.getByRole('table').getByText('10:00–12:00 02/08/2026')).toBeVisible();
  await expect(page.getByRole('table').getByText('Gói giấy màu kem')).toBeVisible();
  await expect(page.getByRole('table').getByText('450.000 ₫')).toBeVisible();
  await expect(page.getByRole('table').getByAltText(`Ảnh đơn ${order.orderCode}`)).toBeVisible();

  await page.getByRole('button', { name: 'Lọc nâng cao' }).click();
  await expect(page.getByRole('dialog', { name: 'Lọc đơn hàng nâng cao' })).toBeVisible();
  await expect(page.getByLabel('Tạo từ ngày')).toBeVisible();
  await expect(page.getByLabel('Tạo đến ngày')).toBeVisible();
});

test('order list deletes with an explicit irreversible confirmation', async ({ page }) => {
  await page.goto('/admin/orders');
  await page.getByRole('button', { name: `Xóa đơn ${order.orderCode}` }).click();
  const dialog = page.getByRole('dialog', { name: 'Xác nhận xóa đơn' });
  await expect(dialog).toContainText('không thể hoàn tác');
  await dialog.getByRole('button', { name: 'Xóa đơn', exact: true }).click();
  await expect(page.getByText(`Đã xóa đơn ${order.orderCode}.`)).toBeVisible();
  await expect(page.getByRole('table').getByText(order.orderCode)).toHaveCount(0);
});

test('create order exposes optional contact fields and an exact-or-range delivery control', async ({ page }) => {
  await page.goto('/admin/orders/new');
  await expect(page.getByRole('heading', { name: 'Tạo đơn hàng', level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Quay lại' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Hủy' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tạo đơn' })).toBeVisible();
  await expect(page.getByText('SĐT người đặt (không bắt buộc)')).toBeVisible();
  await expect(page.getByLabel('Mô tả địa chỉ nhận')).toBeVisible();
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
  await expect(page.getByText('Chưa có số điện thoại')).toBeVisible();
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

test('mobile order list keeps delete action accessible without the desktop table', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/orders');
  await expect(page.getByRole('table')).toBeHidden();
  await expect(page.getByRole('button', { name: `Xóa đơn ${order.orderCode}` })).toBeVisible();
});
