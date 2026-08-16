import { expect, test, type Locator, type Page, type Route } from '@playwright/test';

const ORDER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const ITEM_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const CHANNEL_ID = '11111111-1111-1111-1111-111111111111';
const META_CHANNEL_ID = '22222222-2222-2222-2222-222222222222';
const ZALO_CHANNEL_ID = '33333333-3333-3333-3333-333333333333';
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
    hasCard: false,
    cardMessage: null,
    hasBanner: false,
    bannerMessage: null,
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
  legacyDescriptionOnly?: boolean;
  rejectBatch?: boolean;
  delayAddressResolveMs?: number;
  addressResolve?: 'success' | 'failure' | 'no-candidate';
  chatAnalysis?: 'meta' | 'zalo' | 'delayed-meta' | 'failure' | 'conflict-missing' | 'unknown' | 'meta-then-unknown';
};

const installMocks = async (page: Page, options: MockOptions = {}) => {
  const order = createOrder(options.orderStatus ?? 1);
  if (options.legacyDescriptionOnly) order.deliveryAddress = '';
  const loadedProduct = {
    ...product,
    thumbnailUrl: options.invalidProductImage ? 'https://images.test/missing.jpg' : product.thumbnailUrl,
  };
  order.items[0].thumbnailUrl = loadedProduct.thumbnailUrl;
  const updateBodies: string[] = [];
  const createBodies: string[] = [];
  const batchBodies: string[] = [];
  let screenshotAnalysisCalls = 0;

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
      return json(route, [
        { id: CHANNEL_ID, code: 'admin', name: 'Admin', isActive: true, sortOrder: 10 },
        { id: META_CHANNEL_ID, code: 'messenger', name: 'Meta / Messenger', isActive: true, sortOrder: 20 },
        { id: ZALO_CHANNEL_ID, code: 'zalo', name: 'Zalo', isActive: true, sortOrder: 30 },
      ]);
    }
    if (url.pathname === '/api/admin/administrative-units/provinces') {
      const legacy = url.searchParams.get('scheme') === 'legacy';
      return json(route, [{ code: '79', name: 'Hồ Chí Minh', fullName: 'Thành phố Hồ Chí Minh', scheme: legacy ? 2 : 1, unitType: 2, hierarchyLevel: 1, parentCode: null, isActive: true, sortOrder: 1 }]);
    }
    if (url.pathname === '/api/admin/administrative-units/79/children') {
      const legacy = url.searchParams.get('scheme') === 'legacy';
      return json(route, legacy
        ? [{ code: '760', name: 'Quận 1', fullName: 'Quận 1', scheme: 2, unitType: 4, hierarchyLevel: 2, parentCode: '79', isActive: true, sortOrder: 1 }]
        : [{ code: '26876', name: 'An Nhơn', fullName: 'Phường An Nhơn', scheme: 1, unitType: 8, hierarchyLevel: 2, parentCode: '79', isActive: true, sortOrder: 1 }]);
    }
    if (url.pathname === '/api/admin/administrative-units/760/children') {
      return json(route, [{ code: '26734', name: 'Bến Nghé', fullName: 'Phường Bến Nghé', scheme: 2, unitType: 8, hierarchyLevel: 3, parentCode: '760', isActive: true, sortOrder: 1 }]);
    }
    if (url.pathname.startsWith('/api/admin/administrative-units/transitions/')) return json(route, []);
    if (url.pathname === '/api/admin/addresses/resolve') {
      if (options.delayAddressResolveMs) {
        await new Promise((resolve) => setTimeout(resolve, options.delayAddressResolveMs));
      }
      if (options.addressResolve === 'failure') {
        return json(route, { message: 'Address resolver unavailable' }, 503);
      }
      if (options.addressResolve === 'no-candidate') {
        return json(route, {
          originalText: '999 Hẻm lạ, nơi chưa xác định',
          normalizedText: '999 hem la noi chua xac dinh',
          isConfident: false,
          confidence: 0,
          selectedCandidate: null,
          candidates: [],
          warnings: ['Không tìm thấy đơn vị hành chính phù hợp.'],
        });
      }
      return json(route, {
        originalText: '461 Phan Văn Trị, Phường An Nhơn',
        normalizedText: '461 phan van tri phuong an nhon',
        isConfident: false,
        confidence: .74,
        selectedCandidate: { scheme: 1, provinceCode: '79', provinceName: 'Thành phố Hồ Chí Minh', districtCode: null, districtName: null, communeCode: '26876', communeName: 'Phường An Nhơn', addressDetail: '461 Phan Văn Trị', fullAddress: '461 Phan Văn Trị, Phường An Nhơn, Thành phố Hồ Chí Minh', confidence: .74, reason: 'Tên đơn vị cấp xã khớp; TP Hồ Chí Minh được dùng làm ưu tiên mặc định.', usedDefaultProvince: true },
        candidates: [
          { scheme: 1, provinceCode: '79', provinceName: 'Thành phố Hồ Chí Minh', districtCode: null, districtName: null, communeCode: '26876', communeName: 'Phường An Nhơn', addressDetail: '461 Phan Văn Trị', fullAddress: '461 Phan Văn Trị, Phường An Nhơn, Thành phố Hồ Chí Minh', confidence: .74, reason: 'Tên đơn vị cấp xã khớp; TP Hồ Chí Minh được dùng làm ưu tiên mặc định.', usedDefaultProvince: true },
          { scheme: 1, provinceCode: '52', provinceName: 'Tỉnh Gia Lai', districtCode: null, districtName: null, communeCode: '21910', communeName: 'Phường An Nhơn', addressDetail: '461 Phan Văn Trị', fullAddress: '461 Phan Văn Trị, Phường An Nhơn, Tỉnh Gia Lai', confidence: .64, reason: 'Tên đơn vị cấp xã khớp nhưng văn bản không ghi rõ tỉnh/thành.', usedDefaultProvince: false },
        ],
        warnings: ['Không tìm thấy tỉnh/thành trong địa chỉ, đã ưu tiên Thành phố Hồ Chí Minh.', 'Địa chỉ được nhận diện với độ tin cậy thấp. Vui lòng kiểm tra lại.'],
      });
    }
    if (url.pathname === '/api/admin/quick-import/analyze-screenshots') {
      screenshotAnalysisCalls += 1;
      if (options.chatAnalysis === 'failure') {
        return json(route, { message: 'Analyzer unavailable' }, 503);
      }
      if (options.chatAnalysis === 'delayed-meta') {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      const isMessenger = request.postDataBuffer()?.includes(Buffer.from('messenger-chat')) ?? false;
      const mode = options.chatAnalysis === 'meta-then-unknown'
        ? screenshotAnalysisCalls === 1 ? 'meta' : 'unknown'
        : options.chatAnalysis ?? (isMessenger ? 'meta' : 'unknown');
      if (mode === 'conflict-missing') {
        return json(route, {
          detectedPlatform: 'TIKTOK',
          platformConfidence: .61,
          detectedOrdererName: 'Tên OCR chưa chắc',
          nameConfidence: .52,
          screenshots: [
            { screenshotId: 'first', fileName: 'first.png', detectedPlatform: 'META', platformConfidence: .9, detectedOrdererName: 'Nguyễn A', nameConfidence: .88, detectedTexts: [], evidence: [], warnings: [] },
            { screenshotId: 'second', fileName: 'second.png', detectedPlatform: 'ZALO', platformConfidence: .86, detectedOrdererName: 'Nguyễn B', nameConfidence: .83, detectedTexts: [], evidence: [], warnings: [] },
          ],
          warnings: ['Các ảnh có thông tin cuộc trò chuyện không đồng nhất. Vui lòng kiểm tra lại.'],
        });
      }
      const platform = mode === 'zalo' ? 'ZALO' : mode === 'unknown' ? 'UNKNOWN' : 'META';
      return json(route, platform !== 'UNKNOWN' ? {
        detectedPlatform: platform,
        platformConfidence: .93,
        detectedOrdererName: mode === 'zalo' ? 'Nguyễn Zalo' : 'Nguyễn OCR',
        nameConfidence: .9,
        screenshots: [],
        warnings: [],
      } : {
        detectedPlatform: 'UNKNOWN',
        platformConfidence: .2,
        detectedOrdererName: null,
        nameConfidence: .2,
        screenshots: [],
        warnings: ['Không đủ bằng chứng để xác định nguồn chat.'],
      });
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
    if (url.pathname === '/api/orders/batch' && request.method() === 'POST') {
      const body = request.postData() ?? '';
      batchBodies.push(body);
      const draftMatches = [...body.matchAll(/name="orders\[(\d+)\]\.clientDraftId"\r?\n\r?\n([^\r\n]+)/g)];
      if (options.rejectBatch) {
        const failedDraftId = draftMatches.find((match) => match[1] === '1')?.[2] ?? '';
        return json(route, {
          success: false,
          code: 'BATCH_ORDER_FAILED',
          message: 'Order #2: Sản phẩm không hợp lệ.',
          batchError: {
            clientDraftId: failedDraftId,
            index: 1,
            code: 'VALIDATION_ERROR',
            message: 'Sản phẩm không hợp lệ.',
            fieldErrors: { items: ['Sản phẩm không hợp lệ.'] },
          },
        }, 400);
      }
      return json(route, {
        createdCount: draftMatches.length,
        orders: draftMatches.map((match, index) => ({
          clientDraftId: match[2],
          orderId: `${index + 1}`.padStart(8, '0') + '-0000-0000-0000-000000000000',
          orderNumber: `L260812-${index + 1}`,
        })),
      });
    }
    if (url.pathname === '/api/orders' && request.method() === 'POST') {
      createBodies.push(request.postData() ?? '');
      return json(route, order);
    }
    if (url.pathname === `/api/orders/${ORDER_ID}`) return json(route, order);
    return json(route, { success: false, code: 'NOT_FOUND', message: `Unhandled ${url.pathname}` }, 404);
  });

  return {
    createBodies,
    updateBodies,
    batchBodies,
    getScreenshotAnalysisCalls: () => screenshotAnalysisCalls,
  };
};

const addQuickDraft = async (
  dialog: Locator,
  index: number,
  options: { imageName?: string; card?: string; banner?: string } = {},
) => {
  const phone = `03527525${String(90 + index)}`;
  const extra = [
    options.card ? `thiệp: ${options.card}` : '',
    options.banner ? `banner: ${options.banner}` : '',
  ].filter(Boolean).join('\n');
  await dialog.getByLabel('Đoạn chat').fill(
    `11/08 17h15-17h30\n${product.translations[0].name} 500, 50 ship cọc 200\n${phone}\n461 Phan Văn Trị, Phường An Nhơn${extra ? `\n${extra}` : ''}`,
  );
  if (options.imageName) {
    await dialog.locator('#quick-import-images').setInputFiles({
      name: options.imageName,
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
    });
  }
  await dialog.getByRole('button', { name: 'Phân tích' }).click();
  await dialog.getByLabel('Người nhận', { exact: true }).fill(`Người nhận ${index}`);
  await dialog.getByLabel('Người đặt', { exact: true }).fill(`Người đặt ${index}`);
  await dialog.getByRole('button', { name: 'Áp dụng', exact: true }).click();
};

test('new and loaded order items start collapsed and expose only the primary row', async ({ page }) => {
  await installMocks(page);
  await page.goto(`/admin/orders/${ORDER_ID}/edit`);

  const expandButton = page.getByRole('button', { name: 'Mở chi tiết sản phẩm 1' });
  await expect(expandButton).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#order-line-product-0')).toBeVisible();
  await expect(page.locator('#order-line-price-0')).toBeVisible();
  await expect(page.locator('#order-line-quantity-0')).toBeVisible();
  await expect(page.locator('#order-line-note-0')).toHaveCount(0);
  await expect(page.locator('#order-line-images-0')).toHaveCount(0);

  await expandButton.click();
  await expect(page.getByRole('button', { name: 'Thu gọn chi tiết sản phẩm 1' })).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#order-line-note-0')).toHaveValue('Giữ nguyên ghi chú riêng của sản phẩm');
  await expect(page.locator('#order-line-images-0')).toBeAttached();

  await page.getByRole('button', { name: 'Thu gọn chi tiết sản phẩm 1' }).click();
  await expect(page.locator('#order-line-note-0')).toHaveCount(0);

  await page.getByRole('button', { name: 'Thêm', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mở chi tiết sản phẩm 2' })).toHaveAttribute('aria-expanded', 'false');
});

test('each order item expands independently and keeps detail state while collapsed', async ({ page }) => {
  await installMocks(page);
  await page.goto(`/admin/orders/${ORDER_ID}/edit`);
  await page.getByRole('button', { name: 'Thêm', exact: true }).click();

  await page.getByRole('button', { name: 'Mở chi tiết sản phẩm 1' }).click();
  await expect(page.getByRole('button', { name: 'Mở chi tiết sản phẩm 2' })).toHaveAttribute('aria-expanded', 'false');
  await page.locator('#order-line-note-0').fill('Giữ dữ liệu khi thu gọn');
  await page.getByLabel('Ghi thiệp').check();
  await page.locator('#order-line-card-message-0').fill('Chúc mừng sinh nhật');
  await page.locator('#order-line-images-0').setInputFiles({
    name: 'chi-tiet.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  });

  await page.getByRole('button', { name: 'Thu gọn chi tiết sản phẩm 1' }).click();
  await page.getByRole('button', { name: 'Mở chi tiết sản phẩm 1' }).click();
  await expect(page.locator('#order-line-note-0')).toHaveValue('Giữ dữ liệu khi thu gọn');
  await expect(page.locator('#order-line-card-message-0')).toHaveValue('Chúc mừng sinh nhật');
  await expect(page.getByAltText(/Ảnh minh họa mới 1/)).toBeVisible();
});

test('collapsed item submits note, card, banner and image detail data', async ({ page }) => {
  const mocks = await installMocks(page);
  await page.goto(`/admin/orders/${ORDER_ID}/edit`);
  await page.getByRole('button', { name: 'Mở chi tiết sản phẩm 1' }).click();
  await page.locator('#order-line-note-0').fill('Giao bó hoa tông trắng');
  await page.getByLabel('Ghi thiệp').check();
  await page.locator('#order-line-card-message-0').fill('Chúc mừng sinh nhật');
  await page.getByLabel('In banner').check();
  await page.locator('#order-line-banner-message-0').fill('Happy Birthday');
  await page.locator('#order-line-images-0').setInputFiles({
    name: 'minh-hoa.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  });
  await page.getByRole('button', { name: 'Thu gọn chi tiết sản phẩm 1' }).click();

  await page.getByRole('button', { name: 'Cập nhật đơn' }).click();

  expect(mocks.updateBodies).toHaveLength(1);
  expect(mocks.updateBodies[0]).toContain('Giao bó hoa tông trắng');
  expect(mocks.updateBodies[0]).toContain('Chúc mừng sinh nhật');
  expect(mocks.updateBodies[0]).toContain('Happy Birthday');
  expect(mocks.updateBodies[0]).toContain('name="images[0].imageFile"');
  expect(mocks.updateBodies[0]).toContain('filename="minh-hoa.png"');
});

test('detail validation expands the item and focuses the invalid field', async ({ page }) => {
  const mocks = await installMocks(page);
  await page.goto(`/admin/orders/${ORDER_ID}/edit`);
  await page.getByRole('button', { name: 'Mở chi tiết sản phẩm 1' }).click();
  await page.getByLabel('Ghi thiệp').check();
  await page.getByRole('button', { name: 'Thu gọn chi tiết sản phẩm 1' }).click();

  await page.getByRole('button', { name: 'Cập nhật đơn' }).click();

  await expect(page.getByRole('button', { name: 'Thu gọn chi tiết sản phẩm 1' })).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#order-line-card-message-0')).toBeFocused();
  await expect(page.locator('#order-line-error-0')).toContainText('Nhập nội dung thiệp');
  expect(mocks.updateBodies).toHaveLength(0);
});

test('delivery uses one text field, falls back to the legacy description and hides location controls', async ({ page }) => {
  const mocks = await installMocks(page, { legacyDescriptionOnly: true });
  await page.goto(`/admin/orders/${ORDER_ID}/edit`);

  const address = page.getByLabel('Địa chỉ chi tiết');
  await expect(address).toHaveValue('Cầu ba tây, xã thường lạc, huyện hồng ngự, tỉnh đồng tháp');
  await expect(page.getByLabel('Địa chỉ nhận', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Tìm địa chỉ trên bản đồ' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Vị trí hiện tại|Mở bản đồ/ })).toHaveCount(0);
  await expect(page.getByText('Đã ghim vị trí')).toHaveCount(0);

  await address.fill('461 Phan Văn Trị, Phường An Nhơn, TP.HCM - cổng màu xanh');
  await page.getByRole('button', { name: 'Cập nhật đơn' }).click();
  expect(mocks.updateBodies).toHaveLength(1);
  expect(mocks.updateBodies[0]).toContain('name="deliveryAddress"');
  expect(mocks.updateBodies[0]).toContain('461 Phan Văn Trị');
  expect(mocks.updateBodies[0]).not.toContain('name="deliveryLatitude"');
  expect(mocks.updateBodies[0]).not.toContain('name="deliveryLongitude"');
});

test('create submits an address description without map coordinates', async ({ page }) => {
  const mocks = await installMocks(page);
  await page.goto('/admin/orders/new');
  await page.getByLabel('Người nhận', { exact: true }).fill('Nguyễn An');
  await page.getByLabel('SĐT người nhận').fill('0909000111');
  await page.getByLabel('Người đặt', { exact: true }).fill('Nguyễn An');
  await page.locator('#delivery-at').fill('2026-08-15T10:30');
  await page.getByLabel('Địa chỉ chi tiết').fill('461 Phan Văn Trị, Phường An Nhơn - cổng màu xanh');
  const productSearch = page.locator('#order-line-product-0');
  await productSearch.fill(product.sku);
  await page.getByRole('option', { name: PRODUCT_OPTION_NAME }).click();

  await page.getByRole('button', { name: 'Tạo đơn' }).click();

  await expect(page).toHaveURL(`/admin/orders/${ORDER_ID}`);
  expect(mocks.createBodies).toHaveLength(1);
  expect(mocks.createBodies[0]).toContain('name="deliveryAddress"');
  expect(mocks.createBodies[0]).toContain('461 Phan Văn Trị');
  expect(mocks.createBodies[0]).not.toContain('deliveryLatitude');
  expect(mocks.createBodies[0]).not.toContain('deliveryLongitude');
});

test('shop pickup still submits without address or location fields', async ({ page }) => {
  const mocks = await installMocks(page);
  await page.goto(`/admin/orders/${ORDER_ID}/edit`);
  await page.getByRole('radio', { name: 'Lấy tại shop' }).click();
  await expect(page.getByLabel('Mô tả địa chỉ nhận')).toHaveCount(0);
  await page.getByRole('button', { name: 'Cập nhật đơn' }).click();

  expect(mocks.updateBodies).toHaveLength(1);
  expect(mocks.updateBodies[0]).toContain('name="pickupAtShop"');
  expect(mocks.updateBodies[0]).not.toContain('name="deliveryAddress"');
  expect(mocks.updateBodies[0]).not.toContain('name="deliveryLatitude"');
  expect(mocks.updateBodies[0]).not.toContain('name="deliveryLongitude"');
});

test('quick import queues independently, resets only input and never creates on Apply', async ({ page }) => {
  const mocks = await installMocks(page);
  await page.goto('/admin/orders/new');
  await page.getByRole('button', { name: 'Nhập nhanh' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nhập nhiều đơn hàng' });

  await expect(dialog.getByRole('button', { name: 'Lưu 0 đơn' })).toBeDisabled();
  await addQuickDraft(dialog, 1, { imageName: 'chat-order-1.png' });
  await expect(dialog.getByRole('heading', { name: 'Danh sách đơn chờ (1)' })).toBeVisible();
  await expect(dialog.getByText('chat-order-1.png')).toHaveCount(0);
  await expect(dialog.getByLabel('Đoạn chat')).toHaveValue('');
  expect(mocks.createBodies).toHaveLength(0);
  expect(mocks.batchBodies).toHaveLength(0);

  await addQuickDraft(dialog, 2);
  await expect(dialog.getByRole('heading', { name: 'Danh sách đơn chờ (2)' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Xóa đơn chờ 1' }).click();
  await expect(dialog.getByRole('heading', { name: 'Danh sách đơn chờ (1)' })).toBeVisible();
  await expect(dialog.getByText('Người nhận 2 - 0352752592')).toBeVisible();
  await expect(dialog.getByText('Người nhận 1 - 0352752591')).toHaveCount(0);
  expect(mocks.createBodies).toHaveLength(0);
  expect(mocks.batchBodies).toHaveLength(0);
});

test('double clicking Apply adds only one draft', async ({ page }) => {
  await installMocks(page);
  await page.goto('/admin/orders/new');
  await page.getByRole('button', { name: 'Nhập nhanh' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nhập nhiều đơn hàng' });
  await dialog.getByLabel('Đoạn chat').fill(`11/08 17h15\n${product.translations[0].name} 500, 50 ship cọc 200\n0352752593`);
  await dialog.getByRole('button', { name: 'Phân tích' }).click();
  await dialog.getByLabel('Người nhận', { exact: true }).fill('Người nhận chống trùng');
  await dialog.getByLabel('Người đặt', { exact: true }).fill('Người đặt chống trùng');

  await dialog.getByRole('button', { name: 'Áp dụng', exact: true }).dblclick();

  await expect(dialog.getByRole('heading', { name: 'Danh sách đơn chờ (1)' })).toBeVisible();
  await expect(dialog.locator('li[id^="quick-draft-"]')).toHaveCount(1);
});

test('deleting one draft does not remove another draft attachment mapping', async ({ page }) => {
  const mocks = await installMocks(page);
  await page.goto('/admin/orders/new');
  await page.getByRole('button', { name: 'Nhập nhanh' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nhập nhiều đơn hàng' });
  await addQuickDraft(dialog, 1, { imageName: 'remove-this.png' });
  await addQuickDraft(dialog, 2, { imageName: 'keep-this.png' });
  await dialog.getByRole('button', { name: 'Xóa đơn chờ 1' }).click();

  await dialog.getByRole('button', { name: 'Lưu 1 đơn' }).click();

  expect(mocks.batchBodies).toHaveLength(1);
  expect(mocks.batchBodies[0]).not.toContain('remove-this.png');
  expect(mocks.batchBodies[0]).toContain('name="orders[0].images[0].imageFile"');
  expect(mocks.batchBodies[0]).toContain('keep-this.png');
});

test('Save All sends one multipart batch with three orders and isolated attachments', async ({ page }) => {
  const mocks = await installMocks(page);
  await page.goto('/admin/orders/new');
  await page.getByRole('button', { name: 'Nhập nhanh' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nhập nhiều đơn hàng' });
  await addQuickDraft(dialog, 1, { imageName: 'order-one.png' });
  await addQuickDraft(dialog, 2, { imageName: 'order-two.png' });
  await addQuickDraft(dialog, 3, { card: 'Chúc mừng sinh nhật', banner: 'Happy Birthday' });

  const saveButton = dialog.getByRole('button', { name: 'Lưu 3 đơn' });
  await saveButton.dblclick();

  await expect(page).toHaveURL('/admin/orders');
  await expect(page.getByText('Đã tạo thành công 3 đơn hàng.')).toBeVisible();
  expect(mocks.createBodies).toHaveLength(0);
  expect(mocks.batchBodies).toHaveLength(1);
  const body = mocks.batchBodies[0];
  expect(body).toContain('name="orders[0].recipientName"');
  expect(body).toContain('name="orders[1].recipientName"');
  expect(body).toContain('name="orders[2].recipientName"');
  expect(body).toContain('name="orders[0].images[0].imageFile"');
  expect(body).toContain('filename="order-one.png"');
  expect(body).toContain('name="orders[1].images[0].imageFile"');
  expect(body).toContain('filename="order-two.png"');
  expect(body).toContain('name="orders[2].items[0].cardMessage"');
  expect(body).toContain('Chúc mừng sinh nhật');
  expect(body).toContain('name="orders[2].items[0].bannerMessage"');
  expect(body).toContain('Happy Birthday');
});

test('batch failure keeps the queue and highlights the row mapped by clientDraftId', async ({ page }) => {
  const mocks = await installMocks(page, { rejectBatch: true });
  await page.goto('/admin/orders/new');
  await page.getByRole('button', { name: 'Nhập nhanh' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nhập nhiều đơn hàng' });
  await addQuickDraft(dialog, 1);
  await addQuickDraft(dialog, 2);

  await dialog.getByRole('button', { name: 'Lưu 2 đơn' }).click();

  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Danh sách đơn chờ (2)' })).toBeVisible();
  await expect(dialog.getByText('Sản phẩm không hợp lệ.', { exact: true })).toHaveCount(2);
  await expect(dialog.locator('li[id^="quick-draft-"]').nth(1)).toHaveClass(/border-admin-status-error/);
  expect(mocks.batchBodies).toHaveLength(1);
});

test('closing with queued drafts requires confirmation and can preserve or discard them', async ({ page }) => {
  await installMocks(page);
  await page.goto('/admin/orders/new');
  await page.getByRole('button', { name: 'Nhập nhanh' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nhập nhiều đơn hàng' });
  await addQuickDraft(dialog, 1);

  await dialog.getByRole('button', { name: 'Đóng nhập nhiều đơn hàng' }).click();
  const confirmation = page.getByRole('alertdialog', { name: 'Bỏ 1 đơn chưa lưu?' });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole('button', { name: 'Tiếp tục nhập' }).click();
  await expect(dialog.getByRole('heading', { name: 'Danh sách đơn chờ (1)' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Đóng nhập nhiều đơn hàng' }).click();
  await page.getByRole('button', { name: 'Bỏ dữ liệu và đóng' }).click();
  await expect(dialog).toHaveCount(0);
});

test('quick import uses two panels on desktop and stacks without overflow on mobile', async ({ page }) => {
  await installMocks(page);
  await page.setViewportSize({ width: 1280, height: 820 });
  await page.goto('/admin/orders/new');
  await page.getByRole('button', { name: 'Nhập nhanh' }).click();
  const inputPanel = page.getByRole('region', { name: 'Nhập và phân tích' });
  const queuePanel = page.getByRole('region', { name: /Danh sách đơn chờ/ });
  const desktop = await Promise.all([inputPanel.boundingBox(), queuePanel.boundingBox()]);
  expect(desktop[0]?.y).toBe(desktop[1]?.y);
  expect((desktop[0]?.x ?? 0)).toBeLessThan(desktop[1]?.x ?? 0);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await Promise.all([inputPanel.boundingBox(), queuePanel.boundingBox()]);
  expect((mobile[0]?.y ?? 0)).toBeLessThan(mobile[1]?.y ?? 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('Escape closes an administrative dropdown without closing Quick Import', async ({ page }) => {
  await installMocks(page);
  await page.goto('/admin/orders/new');
  await page.getByRole('button', { name: 'Nhập nhanh' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nhập nhiều đơn hàng' });
  await dialog.getByLabel('Đoạn chat').fill(
    `11/08 17h15\n${product.translations[0].name} 500\n0352752593\n461 Phan Văn Trị, Phường An Nhơn`,
  );
  await dialog.getByRole('button', { name: 'Phân tích' }).click();
  const province = dialog.getByLabel('Tỉnh / Thành phố');
  await province.click();
  await expect(dialog.getByRole('option', { name: 'Thành phố Hồ Chí Minh' })).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('option', { name: 'Thành phố Hồ Chí Minh' })).toHaveCount(0);
});

test('administrative address switches between current two-level and legacy three-level hierarchy', async ({ page }) => {
  await installMocks(page);
  await page.goto('/admin/orders/new');

  await expect(page.getByRole('radio', { name: 'Địa chỉ mới' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByText('Quận / Huyện / Thị xã / Thành phố', { exact: true })).toHaveCount(0);
  await page.locator('#address-province').fill('Hồ Chí Minh');
  await page.getByRole('option', { name: 'Thành phố Hồ Chí Minh' }).click();
  await page.locator('#address-commune').fill('an nhon');
  await page.getByRole('option', { name: 'Phường An Nhơn' }).click();
  await expect(page.getByText('Xã / Phường / Đặc khu', { exact: true })).toBeVisible();

  await page.getByRole('radio', { name: 'Địa chỉ cũ' }).click();
  await expect(page.getByText('Quận / Huyện / Thị xã / Thành phố', { exact: true })).toBeVisible();
  await expect(page.getByText('Xã / Phường / Thị trấn', { exact: true })).toBeVisible();
});

test('edit order can paste and auto-import a replacement administrative address', async ({ page }) => {
  const mocks = await installMocks(page);
  await page.goto(`/admin/orders/${ORDER_ID}/edit`);

  const rawAddress = page.locator('#address-auto-import');
  await expect(rawAddress).toBeVisible();
  await rawAddress.evaluate((element) => {
    const clipboard = new DataTransfer();
    clipboard.setData('text/plain', '461 Phan Van Tri, Phuong An Nhon');
    element.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData: clipboard }));
  });

  await expect(page.locator('#address-detail')).toHaveValue(/461/);

  await page.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(`/admin/orders/${ORDER_ID}`);
  expect(mocks.updateBodies).toHaveLength(1);
  expect(mocks.updateBodies[0]).toContain('name="addressScheme"');
  expect(mocks.updateBodies[0]).toContain('name="provinceCode"');
  expect(mocks.updateBodies[0]).toContain('name="communeCode"');
  expect(mocks.updateBodies[0]).toContain('26876');
  expect(mocks.updateBodies[0]).toContain('name="addressDetail"');
  expect(mocks.updateBodies[0]).toContain('461');
});

test('edit order waits for pasted address analysis before allowing Update', async ({ page }) => {
  await installMocks(page, { delayAddressResolveMs: 800 });
  await page.goto(`/admin/orders/${ORDER_ID}/edit`);

  await page.locator('#address-auto-import').evaluate((element) => {
    const clipboard = new DataTransfer();
    clipboard.setData('text/plain', '461 Phan Van Tri, Phuong An Nhon');
    element.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData: clipboard }));
  });

  const update = page.getByRole('button', { name: 'Cập nhật đơn' });
  await expect(update).toBeDisabled();
  await expect(page.locator('#address-detail')).toHaveValue('461 Phan Văn Trị');
  await expect(update).toBeEnabled();
});

test('edit order clearing the visible address does not submit a stale hidden address', async ({ page }) => {
  const mocks = await installMocks(page);
  await page.goto(`/admin/orders/${ORDER_ID}/edit`);
  const detail = page.getByLabel('Địa chỉ chi tiết');
  await expect(detail).toHaveValue(/Huyện Hồng Ngự/);

  await detail.fill('');
  await page.getByRole('button', { name: 'Cập nhật đơn' }).click();

  await expect(page).toHaveURL(`/admin/orders/${ORDER_ID}`);
  expect(mocks.updateBodies).toHaveLength(1);
  expect(mocks.updateBodies[0]).not.toContain('Huyện Hồng Ngự');
  expect(mocks.updateBodies[0]).not.toContain('Cầu ba tây');
  expect(mocks.updateBodies[0]).not.toContain('name="deliveryAddress"');
  expect(mocks.updateBodies[0]).not.toContain('name="deliveryAddressDescription"');
});

test('create order auto-applies the highest ranked pasted address even at low confidence', async ({ page }) => {
  const mocks = await installMocks(page);
  await page.goto('/admin/orders/new');

  const rawAddress = page.getByLabel('Địa chỉ nhận cần tự động phân tích');
  await rawAddress.evaluate((element) => {
    const clipboard = new DataTransfer();
    clipboard.setData('text/plain', '461 Phan Văn Trị, Phường An Nhơn');
    element.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData: clipboard }));
  });

  await expect(page.getByText(/Đã tự điền · Cần kiểm tra/)).toBeVisible();
  await expect(page.getByLabel('Địa chỉ chi tiết')).toHaveValue('461 Phan Văn Trị');
  await expect(page.getByText('Thành phố Hồ Chí Minh', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Phường An Nhơn', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/đã ưu tiên Thành phố Hồ Chí Minh/).first()).toBeVisible();
  await expect(page.getByText('Xem 2 kết quả đã xếp hạng')).toBeVisible();

  await page.getByLabel('Địa chỉ chi tiết').fill('461 Phan Văn Trị, cổng màu xanh');
  await expect(page.getByLabel('Địa chỉ chi tiết')).toHaveValue('461 Phan Văn Trị, cổng màu xanh');

  await page.getByRole('button', { name: 'Dán & nhập tự động' }).click();
  await page.getByLabel('Người nhận', { exact: true }).fill('Nguyễn An');
  await page.getByLabel('SĐT người nhận').fill('0909000111');
  await page.getByLabel('Người đặt', { exact: true }).fill('Nguyễn An');
  await page.locator('#delivery-at').fill('2026-08-15T10:30');
  await page.locator('#order-line-product-0').fill(product.sku);
  await page.getByRole('option', { name: PRODUCT_OPTION_NAME }).click();
  await page.getByRole('button', { name: 'Tạo đơn' }).click();

  await expect(page).toHaveURL(`/admin/orders/${ORDER_ID}`);
  expect(mocks.createBodies).toHaveLength(1);
  expect(mocks.createBodies[0]).toContain('name="addressScheme"');
  expect(mocks.createBodies[0]).toContain('name="provinceCode"');
  expect(mocks.createBodies[0]).toContain('26876');
  expect(mocks.createBodies[0]).toContain('name="fullAddressSnapshot"');
  expect(mocks.createBodies[0]).toContain('461 Phan Văn Trị, Phường An Nhơn');
});

test('quick import analyzes messenger screenshot, prefills only an empty orderer and maps an existing channel', async ({ page }) => {
  const mocks = await installMocks(page);
  await page.goto('/admin/orders/new');
  await page.getByRole('button', { name: 'Nhập nhanh' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nhập nhiều đơn hàng' });
  await dialog.getByLabel('Đoạn chat').fill(
    '11/08 17h15-17h30\nPhăng chùm trắng mix 500, 50 ship cọc 200\n0352752593\n461 Phan Văn Trị, Phường An Nhơn',
  );
  await dialog.locator('#quick-import-images').setInputFiles({
    name: 'messenger-chat.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  });

  await dialog.getByRole('button', { name: 'Phân tích' }).click();
  await expect(dialog.getByText(/Nguồn: Meta \/ Messenger/)).toBeVisible();
  await expect(dialog.getByLabel('Địa chỉ chi tiết')).toHaveValue('461 Phan Văn Trị');
  await expect(dialog.getByText('Thành phố Hồ Chí Minh', { exact: true }).first()).toBeVisible();
  await expect(dialog.getByText('Phường An Nhơn', { exact: true }).first()).toBeVisible();
  await dialog.getByLabel('Người nhận', { exact: true }).fill('Người nhận ảnh chat');
  await expect(dialog.getByLabel('Người đặt', { exact: true })).toHaveValue('Nguyễn OCR');
  await expect(dialog.getByText(/Đã tìm thấy kênh bán tương ứng/)).toBeVisible();
  await dialog.getByRole('button', { name: 'Áp dụng', exact: true }).click();
  await expect(dialog.getByTestId('quick-order-queue')).toContainText('Meta / Messenger');
  await expect(dialog.getByTestId('quick-order-queue')).toContainText('Phường An Nhơn, Thành phố Hồ Chí Minh');
  await expect(dialog.getByTestId('quick-order-queue')).toContainText('Thành phố Hồ Chí Minh được ưu tiên mặc định');
  await dialog.getByRole('button', { name: 'Lưu 1 đơn' }).click();

  expect(mocks.batchBodies).toHaveLength(1);
  expect(mocks.batchBodies[0]).toContain(META_CHANNEL_ID);
  expect(mocks.batchBodies[0]).toContain('Nguyễn OCR');
  expect(mocks.batchBodies[0]).toContain('name="orders[0].addressScheme"');
  expect(mocks.batchBodies[0]).toContain('name="orders[0].provinceCode"');
  expect(mocks.batchBodies[0]).toContain('name="orders[0].communeCode"');
  expect(mocks.batchBodies[0]).toContain('26876');
  expect(mocks.batchBodies[0]).toContain('461 Phan Văn Trị');
});

test('quick import applies the reviewed orderer and channel instead of raw Zalo suggestions', async ({ page }) => {
  const mocks = await installMocks(page, { chatAnalysis: 'zalo' });
  await page.goto('/admin/orders/new');
  await page.getByRole('button', { name: 'Nhập nhanh' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nhập nhiều đơn hàng' });
  await dialog.getByLabel('Đoạn chat').fill(
    `11/08 17h15-17h30\n${product.translations[0].name} 500, 50 ship cọc 200\n0352752593`,
  );
  await dialog.locator('#quick-import-images').setInputFiles({
    name: 'zalo-chat.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  });

  await dialog.getByRole('button', { name: 'Phân tích' }).click();
  await expect(dialog.getByLabel('Người đặt', { exact: true })).toHaveValue('Nguyễn Zalo');
  await expect(dialog.getByLabel('Nguồn đơn')).toHaveValue(ZALO_CHANNEL_ID);
  await dialog.getByLabel('Người nhận', { exact: true }).fill('Người nhận xác nhận');
  await dialog.getByLabel('Người đặt', { exact: true }).fill('Nguyễn đã sửa');
  await dialog.getByLabel('Nguồn đơn').selectOption(META_CHANNEL_ID);
  await dialog.getByRole('button', { name: 'Áp dụng', exact: true }).click();

  const queue = dialog.getByTestId('quick-order-queue');
  await expect(queue).toContainText('Nguyễn đã sửa · Meta / Messenger');
  await expect(queue).not.toContainText('Nguyễn Zalo');
  await dialog.getByRole('button', { name: 'Lưu 1 đơn' }).click();
  expect(mocks.batchBodies).toHaveLength(1);
  expect(mocks.batchBodies[0]).toContain('Nguyễn đã sửa');
  expect(mocks.batchBodies[0]).toContain(META_CHANNEL_ID);
  expect(mocks.batchBodies[0]).not.toContain(ZALO_CHANNEL_ID);
});

test('a delayed screenshot response cannot overwrite orderer or channel edits made while analysis is running', async ({ page }) => {
  await installMocks(page, { chatAnalysis: 'delayed-meta' });
  await page.goto('/admin/orders/new');
  await page.getByRole('button', { name: 'Nhập nhanh' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nhập nhiều đơn hàng' });
  await dialog.getByLabel('Đoạn chat').fill(
    `11/08 17h15\n${product.translations[0].name} 500, 50 ship cọc 200\n0352752593`,
  );
  await dialog.locator('#quick-import-images').setInputFiles({
    name: 'delayed-chat.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  });

  await dialog.getByRole('button', { name: 'Phân tích' }).click();
  await dialog.getByLabel('Người đặt', { exact: true }).fill('Tên giữ lại');
  await dialog.getByLabel('Nguồn đơn').selectOption(ZALO_CHANNEL_ID);
  await expect(dialog.getByRole('button', { name: 'Áp dụng', exact: true })).toBeDisabled();
  await expect(dialog.getByText(/Nguồn: Meta \/ Messenger/)).toBeVisible();
  await expect(dialog.getByLabel('Người đặt', { exact: true })).toHaveValue('Tên giữ lại');
  await expect(dialog.getByLabel('Nguồn đơn')).toHaveValue(ZALO_CHANNEL_ID);
});

test('analyzer failure keeps a complete manual review form with field-level validation', async ({ page }) => {
  await installMocks(page, { chatAnalysis: 'failure' });
  await page.goto('/admin/orders/new');
  await page.getByRole('button', { name: 'Nhập nhanh' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nhập nhiều đơn hàng' });
  await dialog.locator('#quick-import-images').setInputFiles({
    name: 'failed-chat.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  });

  await dialog.getByRole('button', { name: 'Phân tích' }).click();
  await expect(dialog.getByText(/Không thể tự động phân tích ảnh/)).toBeVisible();
  await dialog.getByRole('button', { name: 'Áp dụng', exact: true }).click();
  await expect(dialog.getByLabel('Người đặt', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expect(dialog.getByLabel('Người đặt', { exact: true })).toBeFocused();

  await dialog.getByLabel('Người đặt', { exact: true }).fill('Người đặt thủ công');
  await dialog.getByLabel('Người nhận', { exact: true }).fill('Người nhận thủ công');
  await dialog.getByLabel('Ngày nhận').fill('2026-08-16');
  await dialog.getByLabel('Bắt đầu').fill('09:30');
  await dialog.getByLabel('SĐT người nhận').fill('0909000111');
  await dialog.getByLabel('Sản phẩm').fill(product.translations[0].name);
  await dialog.getByLabel('Giá').fill('500000');
  await dialog.getByLabel('Ship').fill('50000');
  await dialog.getByLabel('Cọc').fill('200000');
  await dialog.getByRole('button', { name: 'Áp dụng', exact: true }).click();

  await expect(dialog.getByTestId('quick-order-queue')).toContainText('Người đặt thủ công · Admin');
});

test('conflicting screenshots expose per-image details and require a manual channel when no mapping exists', async ({ page }) => {
  await installMocks(page, { chatAnalysis: 'conflict-missing' });
  await page.goto('/admin/orders/new');
  await page.getByRole('button', { name: 'Nhập nhanh' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nhập nhiều đơn hàng' });
  await dialog.getByLabel('Đoạn chat').fill(
    `11/08 17h15\n${product.translations[0].name} 500, 50 ship cọc 200\n0352752593`,
  );
  await dialog.locator('#quick-import-images').setInputFiles([
    {
      name: 'first.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
    },
    {
      name: 'second.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
    },
  ]);

  await dialog.getByRole('button', { name: 'Phân tích' }).click();
  await expect(dialog.getByText(/không đồng nhất/)).toBeVisible();
  await expect(dialog.getByText('Chi tiết 2 ảnh')).toBeVisible();
  await expect(dialog.getByLabel('Nguồn đơn')).toHaveValue('');
  await expect(dialog.getByText(/Không tìm thấy kênh bán tương ứng/)).toBeVisible();
  await dialog.getByLabel('Nguồn đơn').selectOption(META_CHANNEL_ID);
  await dialog.getByLabel('Người nhận', { exact: true }).fill('Người nhận conflict');
  await dialog.getByRole('button', { name: 'Áp dụng', exact: true }).click();
  await expect(dialog.getByTestId('quick-order-queue')).toContainText('Tên OCR chưa chắc · Meta / Messenger');
});

test('re-analyzing an unchanged file set uses the successful in-modal cache', async ({ page }) => {
  const mocks = await installMocks(page, { chatAnalysis: 'meta' });
  await page.goto('/admin/orders/new');
  await page.getByRole('button', { name: 'Nhập nhanh' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nhập nhiều đơn hàng' });
  await dialog.locator('#quick-import-images').setInputFiles({
    name: 'cached-chat.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  });

  await dialog.getByRole('button', { name: 'Phân tích' }).click();
  await expect(dialog.getByText(/Nguồn: Meta \/ Messenger/)).toBeVisible();
  await dialog.getByRole('button', { name: 'Phân tích lại' }).click();
  await expect(dialog.getByRole('button', { name: 'Phân tích lại' })).toBeEnabled();
  expect(mocks.getScreenshotAnalysisCalls()).toBe(1);
});

test('an Unknown re-analysis removes stale automatic suggestions without replacing manual values', async ({ page }) => {
  await installMocks(page, { chatAnalysis: 'meta-then-unknown' });
  await page.goto('/admin/orders/new');
  await page.getByRole('button', { name: 'Nhập nhanh' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nhập nhiều đơn hàng' });
  await dialog.getByLabel('Đoạn chat').fill(
    `11/08 17h15\n${product.translations[0].name} 500, 50 ship cọc 200\n0352752593`,
  );
  await dialog.locator('#quick-import-images').setInputFiles({
    name: 'first-chat.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  });

  await dialog.getByRole('button', { name: 'Phân tích' }).click();
  await expect(dialog.getByLabel('Người đặt', { exact: true })).toHaveValue('Nguyễn OCR');
  await expect(dialog.getByLabel('Nguồn đơn')).toHaveValue(META_CHANNEL_ID);

  await dialog.locator('#quick-import-images').setInputFiles({
    name: 'second-chat.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  });
  await dialog.getByRole('button', { name: 'Phân tích' }).click();

  await expect(dialog.getByText(/Nguồn: Không xác định/)).toBeVisible();
  await expect(dialog.getByLabel('Người đặt', { exact: true })).toHaveValue('');
  await expect(dialog.getByLabel('Nguồn đơn')).toHaveValue(CHANNEL_ID);
});

test('a slow optional address lookup does not block screenshot review or Apply', async ({ page }) => {
  await installMocks(page, { chatAnalysis: 'meta', delayAddressResolveMs: 3_000 });
  await page.goto('/admin/orders/new');
  await page.getByRole('button', { name: 'Nhập nhanh' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nhập nhiều đơn hàng' });
  await dialog.getByLabel('Đoạn chat').fill(
    `11/08 17h15\n${product.translations[0].name} 500, 50 ship cọc 200\n0352752593\n461 Phan Văn Trị, Phường An Nhơn`,
  );
  await dialog.locator('#quick-import-images').setInputFiles({
    name: 'address-independent.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  });

  await dialog.getByRole('button', { name: 'Phân tích' }).click();

  await expect(dialog.getByText(/Nguồn: Meta \/ Messenger/)).toBeVisible({ timeout: 1_000 });
  await expect(dialog.getByRole('button', { name: 'Áp dụng', exact: true })).toBeEnabled();
});

test('quick import manual legacy address wins, validates the missing district, and reaches the batch payload', async ({ page }) => {
  const mocks = await installMocks(page);
  await page.goto('/admin/orders/new');
  await page.getByRole('button', { name: 'Nhập nhanh' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nhập nhiều đơn hàng' });
  await dialog.getByLabel('Đoạn chat').fill(
    `11/08 17h15\n${product.translations[0].name} 500, 50 ship cọc 200\n0352752593\n461 Phan Văn Trị, Phường An Nhơn`,
  );
  await dialog.getByRole('button', { name: 'Phân tích' }).click();
  await expect(dialog.getByLabel('Địa chỉ chi tiết')).toHaveValue('461 Phan Văn Trị');

  await dialog.getByRole('radio', { name: 'Địa chỉ cũ' }).click();
  await dialog.getByLabel('Địa chỉ chi tiết').fill('12 Lê Lợi, cổng màu xanh');
  const province = dialog.getByLabel('Tỉnh / Thành phố');
  await province.click();
  await dialog.getByRole('option', { name: 'Thành phố Hồ Chí Minh' }).click();

  await dialog.getByLabel('Người đặt', { exact: true }).fill('Người đặt địa chỉ cũ');
  await dialog.getByLabel('Người nhận', { exact: true }).fill('Người nhận địa chỉ cũ');
  await dialog.getByLabel('Ngày nhận').fill('2026-08-16');
  await dialog.getByLabel('Bắt đầu').fill('09:30');
  await dialog.getByLabel('SĐT người nhận').fill('0909000111');
  await dialog.getByLabel('Sản phẩm').fill(product.translations[0].name);
  await dialog.getByLabel('Giá').fill('500000');
  await dialog.getByRole('button', { name: 'Áp dụng', exact: true }).click();

  const district = dialog.getByLabel('Quận / Huyện / Thị xã / Thành phố');
  await expect(district).toHaveAttribute('aria-invalid', 'true');
  await expect(district).toBeFocused();
  await district.click();
  await dialog.getByRole('option', { name: 'Quận 1' }).click();
  const commune = dialog.getByLabel('Xã / Phường / Thị trấn');
  await commune.click();
  await dialog.getByRole('option', { name: 'Phường Bến Nghé' }).click();
  await dialog.getByRole('button', { name: 'Áp dụng', exact: true }).click();

  const queue = dialog.getByTestId('quick-order-queue');
  await expect(queue).toContainText('12 Lê Lợi, cổng màu xanh');
  await expect(queue).toContainText('Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh');
  await expect(queue).not.toContainText('được ưu tiên mặc định');
  await dialog.getByRole('button', { name: 'Lưu 1 đơn' }).click();

  expect(mocks.batchBodies).toHaveLength(1);
  const body = mocks.batchBodies[0];
  expect(body).toContain('name="orders[0].addressScheme"');
  expect(body).toContain('name="orders[0].districtCode"');
  expect(body).toContain('760');
  expect(body).toContain('26734');
  expect(body).not.toContain('26876');
  expect(body).toContain('12 Lê Lợi, cổng màu xanh');
  expect(body).toContain('12 Lê Lợi, cổng màu xanh, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh');
});

test('a delayed resolver cannot overwrite structured address fields edited in quick review', async ({ page }) => {
  await installMocks(page, { delayAddressResolveMs: 800 });
  await page.goto('/admin/orders/new');
  await page.getByRole('button', { name: 'Nhập nhanh' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nhập nhiều đơn hàng' });
  await dialog.getByLabel('Đoạn chat').fill(
    `11/08 17h15\n${product.translations[0].name} 500\n0352752593\n461 Phan Văn Trị, Phường An Nhơn`,
  );
  const addressResponse = page.waitForResponse((response) =>
    new URL(response.url()).pathname === '/api/admin/addresses/resolve');
  await dialog.getByRole('button', { name: 'Phân tích' }).click();
  await dialog.getByRole('radio', { name: 'Địa chỉ cũ' }).click();
  await dialog.getByLabel('Địa chỉ chi tiết').fill('Địa chỉ nhân viên giữ lại');
  await addressResponse;

  await expect(dialog.getByRole('radio', { name: 'Địa chỉ cũ' })).toHaveAttribute('aria-checked', 'true');
  await expect(dialog.getByLabel('Địa chỉ chi tiết')).toHaveValue('Địa chỉ nhân viên giữ lại');
  await expect(dialog.getByText('Đã tự chọn:')).toHaveCount(0);
});

for (const addressResolve of ['no-candidate', 'failure'] as const) {
  test(`quick import keeps the parsed raw detail when address resolution returns ${addressResolve}`, async ({ page }) => {
    await installMocks(page, { addressResolve });
    await page.goto('/admin/orders/new');
    await page.getByRole('button', { name: 'Nhập nhanh' }).click();
    const dialog = page.getByRole('dialog', { name: 'Nhập nhiều đơn hàng' });
    await dialog.getByLabel('Đoạn chat').fill(
      `11/08 17h15\n${product.translations[0].name} 500, 50 ship cọc 200\n0352752593\n999 Hẻm lạ, nơi chưa xác định`,
    );
    const addressResponse = page.waitForResponse((response) =>
      new URL(response.url()).pathname === '/api/admin/addresses/resolve');
    await dialog.getByRole('button', { name: 'Phân tích' }).click();
    await addressResponse;

    await expect(dialog.getByLabel('Địa chỉ chi tiết')).toHaveValue('999 Hẻm lạ, nơi chưa xác định');
    await expect(dialog.getByLabel('Tỉnh / Thành phố')).toHaveValue('');
  });
}

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
  await page.getByRole('button', { name: 'Mở chi tiết sản phẩm 1' }).click();

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
  await page.getByRole('button', { name: 'Mở chi tiết sản phẩm 1' }).click();

  const imageAlt = `${product.sku} - ${product.translations[0].name}`;
  await expect(page.getByRole('img', { name: `Không có ảnh: ${imageAlt}` })).toBeVisible();
  const productSearch = page.locator('#order-line-product-0');
  await productSearch.fill(product.sku);
  await expect(page.getByRole('option', { name: PRODUCT_OPTION_NAME }).getByTitle('Sản phẩm chưa có ảnh')).toBeVisible();
});

test('existing item keeps a safe snapshot label when product list no longer contains it', async ({ page }) => {
  await installMocks(page, { includeProduct: false });
  await page.goto(`/admin/orders/${ORDER_ID}/edit`);
  await page.getByRole('button', { name: 'Mở chi tiết sản phẩm 1' }).click();

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
  await page.getByRole('button', { name: 'Mở chi tiết sản phẩm 1' }).click();
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
    page.getByRole('button', { name: 'Mở chi tiết sản phẩm 1' }).boundingBox(),
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
    const expandControl = document.querySelector<HTMLElement>('button[aria-label="Mở chi tiết sản phẩm 1"]')?.getBoundingClientRect();
    const deleteControl = document.querySelector<HTMLElement>('button[aria-label="Xóa sản phẩm 1"]')?.getBoundingClientRect();
    return {
      noOverflow: document.documentElement.scrollWidth <= window.innerWidth,
      productBottom: productControl?.bottom ?? 0,
      priceTop: priceControl?.top ?? 0,
      rowY: [priceControl?.y ?? 0, quantityControl?.y ?? 0, expandControl?.y ?? 0, deleteControl?.y ?? 0],
    };
  });
  expect(mobileLayout.noOverflow).toBe(true);
  expect(mobileLayout.productBottom).toBeLessThan(mobileLayout.priceTop);
  expect(Math.max(...mobileLayout.rowY) - Math.min(...mobileLayout.rowY)).toBeLessThanOrEqual(2);
});
