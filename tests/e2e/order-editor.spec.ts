import { expect, test, type Page, type Route } from '@playwright/test';

const ORDER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const ITEM_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const CHANNEL_ID = '11111111-1111-1111-1111-111111111111';
const PRODUCT_LABEL = 'HOA-BO-9YJOZPR - Phăng chùm trắng mix - 500.000 ₫';
const PRODUCT_OPTION_NAME = 'HOA-BO-9YJOZPR - Phăng chùm trắng mix 500.000 ₫';

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

const product = {
  id: 2005,
  sku: 'HOA-BO-9YJOZPR',
  price: 500000,
  salePrice: null,
  stock: 0,
  tracksInventory: false,
  categoryId: 1,
  productTypeId: 1,
  isActive: true,
  thumbnailUrl: 'https://images.test/product.jpg',
  translations: [{
    id: 1,
    languageCode: 'vi',
    name: 'Phăng chùm trắng mix',
    slug: 'phang-chum-trang-mix',
    description: null,
  }],
  images: [],
  tagIds: [],
  colorIds: [],
  collectionIds: [],
  styleIds: [],
  occasionIds: [],
};

const createOrder = (orderStatus: number) => ({
  id: ORDER_ID,
  orderCode: 'L260731-6704',
  ordererName: 'Vy',
  ordererPhone: '',
  channelId: CHANNEL_ID,
  recipientName: 'Thùy Trang',
  recipientPhone: '0353589709',
  pickupAtShop: false,
  provinceShipping: false,
  deliveryAddress: 'Huyện Hồng Ngự, Xã Long Khánh, Tỉnh Đồng Tháp, Việt Nam',
  deliveryAddressDescription: 'Cầu ba tây, xã thường lạc, huyện hồng ngự, tỉnh đồng tháp',
  deliveryLatitude: 10.85,
  deliveryLongitude: 105.35,
  deliveryAt: '2026-08-02T01:00:00.000Z',
  deliveryTo: '2026-08-02T10:00:00.000Z',
  depositAmount: 200000,
  shippingFee: 50000,
  shippingFeeActual: null,
  subTotal: 500000,
  totalAmount: 550000,
  paymentStatus: 2,
  orderStatus,
  createdAt: '2026-07-31T18:30:00.000Z',
  updatedAt: '2026-07-31T18:42:43.000Z',
  rowVersion: 'AQIDBAUGBwg=',
  description: null,
  contentNote: null,
  items: [{
    id: ITEM_ID,
    productId: String(product.id),
    productSku: product.sku,
    productName: 'Phăng chùm trắng mix',
    thumbnailUrl: product.thumbnailUrl,
    unitPrice: 500000,
    quantity: 1,
    lineTotal: 500000,
    note: 'Giữ nguyên ghi chú riêng của sản phẩm',
  }],
  images: [{
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    orderItemId: ITEM_ID,
    imageUrl: 'https://images.test/illustration.jpg',
    sortOrder: 0,
    description: null,
  }],
  changeLogs: [],
});

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

type MockOptions = {
  orderStatus?: number;
  rejectUpdate?: boolean;
  includeProduct?: boolean;
  invalidProductImage?: boolean;
};

const installMocks = async (page: Page, options: MockOptions = {}) => {
  const order = createOrder(options.orderStatus ?? 1);
  const loadedProduct = {
    ...product,
    thumbnailUrl: options.invalidProductImage ? 'https://images.test/missing.jpg' : product.thumbnailUrl,
  };
  order.items[0].thumbnailUrl = loadedProduct.thumbnailUrl;
  const updateBodies: string[] = [];

  await page.addInitScript(({ user }) => {
    localStorage.setItem('lamie_access_token', 'e2e-access-token');
    localStorage.setItem('lamie_refresh_token', 'e2e-refresh-token');
    localStorage.setItem('lamie_user_json', JSON.stringify(user));
  }, { user: adminUser });

  await page.route('https://images.test/**', (route) => {
    if (new URL(route.request().url()).pathname.endsWith('/missing.jpg')) {
      return route.fulfill({ status: 404, contentType: 'text/plain', body: 'missing' });
    }
    return route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
    });
  });
  await page.route('https://nominatim.openstreetmap.org/**', (route) => json(route, []));

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
      return json(route, options.includeProduct === false ? [] : [loadedProduct]);
    }
    if (url.pathname === `/api/orders/${ORDER_ID}` && request.method() === 'PUT') {
      updateBodies.push(request.postData() ?? '');
      if (options.rejectUpdate) {
        return json(route, {
          success: false,
          code: 'BUSINESS_RULE_VIOLATION',
          message: 'Only a Created order without reserved inventory can be edited.',
        }, 400);
      }
      return json(route, { ...order, rowVersion: 'AgMEBQYHCAk=' });
    }
    if (url.pathname === `/api/orders/${ORDER_ID}`) return json(route, order);
    return json(route, { success: false, code: 'NOT_FOUND', message: `Unhandled ${url.pathname}` }, 404);
  });

  return { updateBodies };
};

test('product option and selected value use code, name and formatted price while search supports both fields', async ({ page }) => {
  await installMocks(page);
  await page.goto(`/admin/orders/${ORDER_ID}/edit`);

  await expect(page.getByText(PRODUCT_LABEL, { exact: true })).toBeVisible();
  const productSearch = page.locator('#order-line-product-0');
  await productSearch.fill('phang chum');
  const option = page.getByRole('option', { name: PRODUCT_OPTION_NAME });
  await expect(option).toBeVisible();
  await expect(option.locator('img')).toHaveAttribute('src', product.thumbnailUrl);
  await productSearch.fill('HOA-BO-9YJOZPR');
  await expect(page.getByRole('option', { name: PRODUCT_OPTION_NAME })).toBeVisible();
});

test('selected product avatar opens the reusable preview and Escape closes it', async ({ page }) => {
  await installMocks(page);
  await page.goto(`/admin/orders/${ORDER_ID}/edit`);

  const imageAlt = `${product.sku} - ${product.translations[0].name}`;
  await page.getByAltText(imageAlt).dblclick();
  const dialog = page.getByRole('dialog', { name: imageAlt });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByAltText(imageAlt)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('invalid product image renders fallbacks in the selector and selected product row', async ({ page }) => {
  await installMocks(page, { invalidProductImage: true });
  await page.goto(`/admin/orders/${ORDER_ID}/edit`);

  const imageAlt = `${product.sku} - ${product.translations[0].name}`;
  await expect(page.getByRole('img', { name: `Không có ảnh: ${imageAlt}` })).toBeVisible();
  const productSearch = page.locator('#order-line-product-0');
  await productSearch.fill(product.sku);
  await expect(page.getByRole('option', { name: PRODUCT_OPTION_NAME }).getByTitle('Sản phẩm chưa có ảnh')).toBeVisible();
});

test('existing item keeps a safe snapshot label when product list no longer contains it', async ({ page }) => {
  await installMocks(page, { includeProduct: false });
  await page.goto(`/admin/orders/${ORDER_ID}/edit`);

  await expect(page.getByText(PRODUCT_LABEL, { exact: true })).toBeVisible();
  await expect(page.getByText('Tồn kho: chưa có dữ liệu')).toBeVisible();
  await expect(page.locator('#order-line-note-0')).toHaveValue('Giữ nguyên ghi chú riêng của sản phẩm');
  const savedIllustration = page.getByAltText(/Ảnh minh họa đã lưu 1/);
  await expect(savedIllustration).toBeVisible();
  await savedIllustration.dblclick();
  const previewDialog = page.getByRole('dialog', { name: `Ảnh minh họa của ${product.translations[0].name}` });
  await expect(previewDialog).toBeVisible();
  await previewDialog.getByRole('button', { name: 'Đóng xem ảnh lớn' }).click();
  await expect(previewDialog).toBeHidden();
});

test('new illustration preview opens without changing editor form state', async ({ page }) => {
  await installMocks(page);
  await page.goto(`/admin/orders/${ORDER_ID}/edit`);
  const recipient = page.getByLabel('Người nhận', { exact: true });
  await recipient.fill('Dữ liệu đang nhập');
  await page.locator('#order-line-images-0').setInputFiles({
    name: 'mau-hoa.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  });

  const newIllustration = page.getByAltText(/Ảnh minh họa mới 1/);
  await expect(newIllustration).toBeVisible();
  await newIllustration.dblclick();
  const previewDialog = page.getByRole('dialog', { name: `Ảnh minh họa của ${product.translations[0].name}` });
  await expect(previewDialog).toBeVisible();
  await previewDialog.getByRole('button', { name: 'Đóng xem ảnh lớn' }).click();
  await expect(recipient).toHaveValue('Dữ liệu đang nhập');
  await expect(newIllustration).toBeVisible();
});

test('loaded order maps row version and item snapshot into multipart update and shows success', async ({ page }) => {
  const mocks = await installMocks(page);
  await page.goto(`/admin/orders/${ORDER_ID}/edit`);
  await page.getByLabel('Người nhận', { exact: true }).fill('Thùy Trang cập nhật');
  await page.getByRole('button', { name: 'Cập nhật đơn' }).click();

  await expect(page).toHaveURL(`/admin/orders/${ORDER_ID}`);
  await expect(page.getByText('Đã cập nhật đơn hàng.')).toBeVisible();
  expect(mocks.updateBodies).toHaveLength(1);
  expect(mocks.updateBodies[0]).toContain('name="rowVersion"');
  expect(mocks.updateBodies[0]).toContain('AQIDBAUGBwg=');
  expect(mocks.updateBodies[0]).toContain('name="items[0].id"');
  expect(mocks.updateBodies[0]).toContain(ITEM_ID);
  expect(mocks.updateBodies[0]).toContain('Giữ nguyên ghi chú riêng của sản phẩm');
});

test('business rule error is localized and does not clear edited form data', async ({ page }) => {
  await installMocks(page, { rejectUpdate: true });
  await page.goto(`/admin/orders/${ORDER_ID}/edit`);
  const recipient = page.getByLabel('Người nhận', { exact: true });
  await recipient.fill('Dữ liệu người dùng đang sửa');
  await page.getByRole('button', { name: 'Cập nhật đơn' }).click();

  await expect(page.getByRole('alert')).toContainText('Đơn hàng chỉ có thể chỉnh sửa khi ở trạng thái Đã tạo.');
  await expect(recipient).toHaveValue('Dữ liệu người dùng đang sửa');
  await expect(page.getByRole('button', { name: 'Cập nhật đơn' })).toBeEnabled();
});

test('non-created order never exposes editor controls or detail edit action', async ({ page }) => {
  await installMocks(page, { orderStatus: 2 });
  await page.goto(`/admin/orders/${ORDER_ID}/edit`);

  await expect(page.getByRole('alert')).toContainText('Đơn hàng chỉ có thể chỉnh sửa khi ở trạng thái Đã tạo.');
  await expect(page.getByText('Trạng thái hiện tại: Đang chuẩn bị.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cập nhật đơn' })).toHaveCount(0);

  await page.goto(`/admin/orders/${ORDER_ID}`);
  await expect(page.getByRole('link', { name: 'Sửa đơn' })).toHaveCount(0);
});

test('order item controls align on desktop and wrap without horizontal overflow on mobile', async ({ page }) => {
  await installMocks(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`/admin/orders/${ORDER_ID}/edit`);

  const productControl = page.locator('#order-line-product-0')
    .locator('xpath=ancestor::div[contains(@class, "min-h-11")][1]');
  const desktopBoxes = await Promise.all([
    productControl.boundingBox(),
    page.locator('#order-line-price-0').boundingBox(),
    page.locator('#order-line-quantity-0').boundingBox(),
    page.getByRole('button', { name: 'Xóa sản phẩm 1' }).boundingBox(),
  ]);
  expect(desktopBoxes.every(Boolean)).toBe(true);
  const desktopY = desktopBoxes.map((box) => box?.y ?? 0);
  expect(Math.max(...desktopY) - Math.min(...desktopY)).toBeLessThanOrEqual(2);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileLayout = await page.evaluate(() => {
    const productInput = document.querySelector<HTMLElement>('#order-line-product-0');
    const productControlElement = productInput?.closest('.min-h-11');
    const productControl = productControlElement instanceof HTMLElement
      ? productControlElement.getBoundingClientRect()
      : undefined;
    const priceControl = document.querySelector<HTMLElement>('#order-line-price-0')?.getBoundingClientRect();
    const quantityControl = document.querySelector<HTMLElement>('#order-line-quantity-0')?.getBoundingClientRect();
    const deleteControl = document.querySelector<HTMLElement>('button[aria-label="Xóa sản phẩm 1"]')?.getBoundingClientRect();
    return {
      noOverflow: document.documentElement.scrollWidth <= window.innerWidth,
      productBottom: productControl?.bottom ?? 0,
      priceTop: priceControl?.top ?? 0,
      rowY: [priceControl?.y ?? 0, quantityControl?.y ?? 0, deleteControl?.y ?? 0],
    };
  });
  expect(mobileLayout.noOverflow).toBe(true);
  expect(mobileLayout.productBottom).toBeLessThan(mobileLayout.priceTop);
  expect(Math.max(...mobileLayout.rowY) - Math.min(...mobileLayout.rowY)).toBeLessThanOrEqual(2);
});
