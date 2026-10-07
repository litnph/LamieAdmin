import { expect, test, type Page, type Route } from '@playwright/test';

const user = {
  id: '30000000-0000-0000-0000-000000000093',
  email: 'products@lamie.test',
  userName: 'product_manager',
  fullName: 'Product Manager',
  role: 3,
  roleCode: 'catalog-editor',
  permissions: ['products.view', 'products.manage', 'ingredients.view', 'catalog-settings.view'],
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const routes = [
  { id: 'route-products', key: 'products.list', moduleKey: 'products', pageKey: 'products.list', path: '/admin/products', permissionCode: 'products.view', sortOrder: 1 },
  { id: 'route-product-create', key: 'products.create', moduleKey: 'products', pageKey: 'products.create', path: '/admin/products/create', permissionCode: 'products.manage', sortOrder: 2 },
  { id: 'route-product-edit', key: 'products.edit', moduleKey: 'products', pageKey: 'products.edit', path: '/admin/products/:id/edit', permissionCode: 'products.manage', sortOrder: 3 },
  { id: 'route-product-recognition', key: 'products.recognition', moduleKey: 'products', pageKey: 'products.recognition', path: '/admin/products/recognition', permissionCode: 'products.manage', sortOrder: 4 },
  { id: 'route-product-catalog-settings', key: 'products.catalog-settings', moduleKey: 'products', pageKey: 'products.catalog-settings', path: '/admin/products/catalog-settings', permissionCode: 'products.manage', sortOrder: 5 },
  { id: 'route-product-price-settings', key: 'products.price-settings', moduleKey: 'products', pageKey: 'products.price-settings', path: '/admin/settings/catalog/product-pricing', permissionCode: 'products.manage', sortOrder: 6 },
  { id: 'route-product-branding-settings', key: 'products.branding-settings', moduleKey: 'products', pageKey: 'products.branding-settings', path: '/admin/settings/catalog/branding', permissionCode: 'products.manage', sortOrder: 7 },
];

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const baseUnit = (id: number, code: string, name: string, symbol: string, allowsFractional = true) => ({
  id, code, name, symbol, allowsFractional, isActive: true,
  createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z',
});

const ingredient = (id: number, code: string, name: string, unit: ReturnType<typeof baseUnit>) => ({
  id, code, name, baseUnit: unit, note: null, isActive: true, conversions: [],
  createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z',
  productCount: 0, snapshotCount: 0, canDelete: true,
});

const product = {
  id: 7,
  sku: 'R0SE',
  price: 750000,
  salePrice: null,
  stock: 0,
  tracksInventory: false,
  categoryId: 1,
  productTypeId: 2,
  isActive: true,
  isVisibleOnFE: false,
  thumbnailUrl: null,
  translations: [{ id: 1, languageCode: 'vi', name: 'Bó hồng Lamie', slug: 'bo-hong-lamie', description: 'Hoa hồng đỏ tinh tế' }],
  images: [],
  tagIds: [],
  colorIds: [],
  collectionIds: [],
  styleIds: [],
  occasionIds: [],
  similarProductIds: [],
  ingredients: [{ id: 91, ingredientId: 10, baseQuantity: 20, note: 'Hoa chính', sortOrder: 0 }],
};

const relatedProduct = {
  ...product,
  id: 8,
  sku: 'TUL8',
  translations: [{ id: 2, languageCode: 'vi', name: 'Giỏ tulip', slug: 'gio-tulip', description: '' }],
  ingredients: [],
};

const inventoryItems = [{
  id: '50000000-0000-0000-0000-000000000001', code: 'WRAP', name: 'Giấy gói', measurementUnitId: 1,
  unitName: 'Tờ', unitSymbol: 'tờ', note: null, isActive: true, usesSizes: false, legacyIngredientId: null,
  stockUnits: [{
    id: '51000000-0000-0000-0000-000000000001', inventoryItemId: '50000000-0000-0000-0000-000000000001',
    inventoryItemCode: 'WRAP', inventoryItemName: 'Giấy gói', sizeName: null, unitName: 'Tờ', unitSymbol: 'tờ',
    quantity: 30, lowStockThreshold: 5, status: 1, isActive: true, updatedAt: '2026-09-01T00:00:00Z',
  }],
  updatedAt: '2026-09-01T00:00:00Z',
}];

type MockState = {
  visibilityCalls: number;
  visibilityFails: boolean;
  exportCalls: number;
  exportFails?: boolean;
  paginateIngredients?: boolean;
  ingredientPageRequests?: number[];
  productMultipart?: string;
  settingsValue?: number;
  watermarkEnabled?: boolean;
  watermarkSource?: number;
  shopLogoUrl?: string | null;
  watermarkImageUrl?: string | null;
};

const installMocks = async (page: Page, state: MockState) => {
  const units = [baseUnit(1, 'BONG', 'Bông', 'bông', false), baseUnit(2, 'CANH', 'Cành', 'cành')];
  const ingredients = [
    ingredient(10, 'ROSE', 'Hoa hồng đỏ', units[0]),
    ingredient(11, 'BABY', 'Sao xanh', units[1]),
    ingredient(12, 'TULIP', 'Tulip trắng', units[0]),
  ];
  await page.addInitScript(({ currentUser }) => {
    localStorage.setItem('lamie_access_token', 'e2e-access-token');
    localStorage.setItem('lamie_refresh_token', 'e2e-refresh-token');
    localStorage.setItem('lamie_user_json', JSON.stringify(currentUser));
  }, { currentUser: user });

  await page.route(/^https?:\/\/[^/]+\/uploads\//, (route) => route.fulfill({
    status: 200,
    contentType: 'image/png',
    body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  }));

  await page.route(/^https?:\/\/[^/]+\/api\//, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (url.pathname === '/api/auth/me') return json(route, user);
    if (url.pathname === '/api/admin/navigation/me/routes') return json(route, routes);
    if (url.pathname === '/api/admin/navigation/me') return json(route, []);
    if (url.pathname === '/api/settings/products' && method === 'GET') return json(route, [product, relatedProduct]);
    if (url.pathname === '/api/inventory/items' && method === 'GET') return json(route, inventoryItems);
    if (url.pathname === '/api/settings/products/7' && method === 'GET') return json(route, product);
    if (url.pathname === '/api/settings/products/7' && method === 'PUT') {
      state.productMultipart = request.postData() ?? '';
      return route.fulfill({ status: 204 });
    }
    if (url.pathname === '/api/settings/products/7/fe-visibility' && method === 'PATCH') {
      state.visibilityCalls += 1;
      if (state.visibilityFails) return json(route, { message: 'Không thể cập nhật FE' }, 500);
      return route.fulfill({ status: 204 });
    }
    if (url.pathname === '/api/settings/products/catalog/settings' && method === 'GET') {
      return json(route, {
        priceDeviationPercent: state.settingsValue ?? 20,
        shopLogoUrl: state.shopLogoUrl ?? null,
        watermarkEnabled: state.watermarkEnabled ?? true,
        watermarkSource: state.watermarkSource ?? 1,
        watermarkImageUrl: state.watermarkImageUrl ?? null,
        updatedAt: null,
      });
    }
    if (url.pathname === '/api/settings/products/catalog/settings' && method === 'PUT') {
      const body = request.postData() ?? '';
      const contentType = request.headers()['content-type'] ?? '';
      if (contentType.includes('application/json')) {
        state.settingsValue = Number((request.postDataJSON() as { priceDeviationPercent: number }).priceDeviationPercent);
      } else {
        const value = body.match(/name="priceDeviationPercent"\r?\n\r?\n([^\r\n]+)/)?.[1];
        const source = body.match(/name="watermarkSource"\r?\n\r?\n([^\r\n]+)/)?.[1];
        state.settingsValue = Number(value);
        state.watermarkEnabled = body.includes('name="watermarkEnabled"\r\n\r\ntrue');
        state.watermarkSource = Number(source);
        if (body.includes('filename="logo.png"')) state.shopLogoUrl = '/uploads/shop/logo.png';
        if (body.includes('filename="watermark.png"')) state.watermarkImageUrl = '/uploads/shop/watermark.png';
      }
      return json(route, {
        priceDeviationPercent: state.settingsValue,
        shopLogoUrl: state.shopLogoUrl ?? null,
        watermarkEnabled: state.watermarkEnabled ?? true,
        watermarkSource: state.watermarkSource ?? 1,
        watermarkImageUrl: state.watermarkImageUrl ?? null,
        updatedAt: '2026-09-05T00:00:00.000Z',
      });
    }
    if (url.pathname === '/api/settings/products/catalog/recognition/status' && method === 'GET') {
      return json(route, { indexedProductCount: 2, activeProductCount: 2, pendingImageCount: 0, embeddingVersion: 'lamie-visual-v1' });
    }
    if (url.pathname === '/api/settings/products/catalog/recognition' && method === 'POST') {
      return json(route, {
        results: [
          { productId: 8, sku: 'TUL8', name: 'Giỏ tulip', thumbnailUrl: null, similarityPercent: 92.4 },
          { productId: 7, sku: 'R0SE', name: 'Bó hồng Lamie', thumbnailUrl: null, similarityPercent: 81.1 },
        ],
        indexedProductCount: 2,
        activeProductCount: 2,
        minimumSimilarityPercent: 62,
        embeddingVersion: 'lamie-visual-v1',
      });
    }
    if (url.pathname === '/api/fe-data/export' && method === 'POST') {
      state.exportCalls += 1;
      await new Promise((resolve) => setTimeout(resolve, 180));
      if (state.exportFails) return json(route, {
        success: false,
        code: 'FE_DATA_EXPORT_FAILED',
        message: 'FE Data was not published because catalog validation failed.',
        errors: { export: ['Sản phẩm 7: ảnh nguồn bị thiếu hoặc hỏng.'] },
      }, 422);
      return json(route, {
        generatedAt: '2026-08-17T04:00:00.000Z', productCount: 1, imageCount: 2,
        catalogVersion: '20260817-040000', warnings: ['Một ảnh phụ không tồn tại và đã được bỏ qua.'],
      });
    }
    if (url.pathname === '/api/settings/ingredients' && method === 'GET') {
      const requestedPage = Number(url.searchParams.get('page') ?? '1');
      state.ingredientPageRequests?.push(requestedPage);
      if (state.paginateIngredients) {
        const firstPage = [ingredients[0], ...Array.from({ length: 99 }, (_, index) => (
          ingredient(100 + index, `FILLER_${index}`, `Nguyên liệu phụ ${index}`, units[1])
        ))];
        const items = requestedPage === 1 ? firstPage : ingredients.slice(1);
        return json(route, {
          items,
          totalCount: 102,
          page: requestedPage,
          pageSize: 100,
          totalPages: 2,
          hasNext: requestedPage === 1,
          hasPrevious: requestedPage > 1,
        });
      }
      return json(route, {
        items: ingredients, totalCount: ingredients.length, page: 1, pageSize: 100, totalPages: 1, hasNext: false, hasPrevious: false,
      });
    }
    if (url.pathname.startsWith('/api/settings/attributes/')) {
      const name = url.pathname.split('/').at(-1);
      if (name === 'categories') return json(route, [{ id: 1, code: 'BOUQUET', isActive: true, translations: [{ languageCode: 'en-US', name: 'Bouquets' }, { languageCode: 'vi-VN', name: 'Hoa bó' }] }]);
      if (name === 'product-types') return json(route, [{ id: 2, code: 'FRESH_FLOWER', isActive: true, translations: [{ languageCode: 'en-US', name: 'Fresh flowers' }, { languageCode: 'vi-VN', name: 'Hoa tươi' }] }]);
      if (name === 'languages') return json(route, [{ code: 'vi', name: 'Tiếng Việt', isActive: true }]);
      return json(route, []);
    }
    return json(route, { message: `Unhandled ${method} ${url.pathname}` }, 404);
  });
};

test('product attribute selectors prefer localized Vietnamese category and product line names', async ({ page }) => {
  const state: MockState = { visibilityCalls: 0, visibilityFails: false, exportCalls: 0 };
  await installMocks(page, state);
  await page.goto('/admin/products/7/edit');

  await expect(page.getByText('Hoa bó', { exact: true })).toBeVisible();
  await expect(page.getByText('Hoa tươi', { exact: true })).toBeVisible();
  await expect(page.getByText('Bouquets', { exact: true })).toHaveCount(0);
});

test('FE visibility rolls back on failure and FE Data export rejects double submit', async ({ page }) => {
  const state: MockState = { visibilityCalls: 0, visibilityFails: true, exportCalls: 0 };
  await installMocks(page, state);
  await page.goto('/admin/products');

  const toggle = page.getByRole('switch', { name: 'Hiện Bó hồng Lamie trên FE' });
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await toggle.click();
  await expect(page.getByRole('alert')).toContainText('Không thể cập nhật hiển thị FE');
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  expect(state.visibilityCalls).toBe(1);

  const exportButton = page.getByRole('button', { name: 'FE Data' });
  await exportButton.click();
  await expect(page.getByRole('button', { name: 'Đang xuất FE Data...' })).toBeDisabled();
  await expect(page.getByText(/đã xuất 1 sản phẩm và 2 ảnh/)).toBeVisible();
  await expect(page.getByText(/Một ảnh phụ không tồn tại/)).toBeVisible();
  expect(state.exportCalls).toBe(1);
});

test('product editor loads every ingredient page, validates recipe quantities, then sends multipart ingredients', async ({ page }) => {
  const state: MockState = {
    visibilityCalls: 0,
    visibilityFails: false,
    exportCalls: 0,
    paginateIngredients: true,
    ingredientPageRequests: [],
  };
  await installMocks(page, state);
  await page.goto('/admin/products/7/edit');

  await expect(page.getByRole('heading', { name: 'Nguyên liệu' })).toBeVisible();
  await expect(page.getByText('Không tồn kho').first()).toBeVisible();
  await expect(page.getByText('Có tồn kho').first()).toBeVisible();
  await page.getByRole('button', { name: 'Thêm không tồn kho' }).click();
  const secondRow = page.getByRole('group', { name: 'Nguyên liệu 2' });
  await secondRow.getByLabel('Nguyên liệu *').selectOption('10');
  await secondRow.getByLabel('Số lượng cơ sở *').fill('0');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();

  await expect(secondRow.getByText('Nguyên liệu này đã có trong định mức.')).toBeVisible();
  await expect(secondRow.getByText(/Số lượng phải lớn hơn 0/)).toBeVisible();

  await secondRow.getByLabel('Nguyên liệu *').selectOption('12');
  await secondRow.getByLabel('Số lượng cơ sở *').fill('5.5');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(secondRow.getByText(/chỉ cho phép số nguyên/)).toBeVisible();

  await secondRow.getByLabel('Nguyên liệu *').selectOption('11');
  await secondRow.getByLabel('Số lượng cơ sở *').fill('5.5');
  await secondRow.getByLabel('Ghi chú').fill('Hoa phụ');
  await page.getByRole('button', { name: 'Thêm có tồn kho' }).click();
  await page.getByLabel('Hàng tồn kho 1').selectOption(inventoryItems[0].id);
  await page.getByLabel('Số lượng vật tư 1').fill('1.5');
  if (process.env.LAMIE_VISUAL_QA_DIR) {
    const materialsSection = page.getByRole('heading', { name: 'Nguyên liệu' }).locator('xpath=ancestor::section');
    await materialsSection.screenshot({ path: `${process.env.LAMIE_VISUAL_QA_DIR}/product-materials.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    await materialsSection.screenshot({ path: `${process.env.LAMIE_VISUAL_QA_DIR}/product-materials-mobile.png` });
  }
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();

  await expect(page).toHaveURL(/\/admin\/products$/);
  expect(state.productMultipart).toContain('Ingredients[0].IngredientId');
  expect(state.productMultipart).toContain('Ingredients[1].IngredientId');
  expect(state.productMultipart).toContain('5.5');
  expect(state.productMultipart).toContain('Hoa phụ');
  expect(state.productMultipart).toContain('InventoryMaterials[0].StockUnitId');
  expect(state.productMultipart).toContain(inventoryItems[0].stockUnits[0].id);
  expect(state.productMultipart).toContain('1.5');
  expect(Array.from(new Set(state.ingredientPageRequests))).toEqual([1, 2]);
});

test('FE Data surfaces an actionable export failure for a permission-based catalog editor', async ({ page }) => {
  const state: MockState = { visibilityCalls: 0, visibilityFails: false, exportCalls: 0, exportFails: true };
  await installMocks(page, state);
  await page.goto('/admin/products');

  await expect(page.getByRole('button', { name: 'FE Data' })).toBeVisible();
  await page.getByRole('button', { name: 'FE Data' }).click();

  await expect(page.getByRole('alert')).toContainText('ảnh nguồn bị thiếu hoặc hỏng');
  expect(state.exportCalls).toBe(1);
});

test('similar product picker excludes the current product and persists the selected catalog product', async ({ page }) => {
  const state: MockState = { visibilityCalls: 0, visibilityFails: false, exportCalls: 0 };
  await installMocks(page, state);
  await page.goto('/admin/products/7/edit');

  const picker = page.getByLabel('Chọn sản phẩm tương tự');
  await picker.fill('R0SE');
  await expect(page.getByRole('option', { name: /R0SE/ })).toHaveCount(0);

  await picker.fill('TUL8');
  await page.getByRole('option', { name: /Giỏ tulip.*TUL8/ }).click();
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();

  await expect(page).toHaveURL(/\/admin\/products$/);
  expect(state.productMultipart).toContain('SimilarProductIds[0]');
  expect(state.productMultipart).toContain('8');
});

test('image recognition and separated product settings persist safely', async ({ page }) => {
  const state: MockState = { visibilityCalls: 0, visibilityFails: false, exportCalls: 0 };
  const visualQaDirectory = process.env.LAMIE_VISUAL_QA_DIR;
  await installMocks(page, state);
  await page.goto('/admin/products/recognition');

  await page.locator('input[type="file"]').setInputFiles({
    name: 'product.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  });
  await page.getByRole('button', { name: 'Tìm sản phẩm gần giống' }).click();

  await expect(page.getByText('Giỏ tulip')).toBeVisible();
  await expect(page.getByText('92.4%')).toBeVisible();
  await expect(page.getByText('81.1%')).toBeVisible();

  await page.goto('/admin/settings/catalog/product-pricing');
  const deviation = page.getByLabel('Phần trăm độ lệch');
  await deviation.fill('25');
  await expect(page.getByText(/375\.000.*625\.000/)).toBeVisible();
  await page.getByRole('button', { name: 'Lưu tầm giá' }).click();
  await expect(page.getByText('Đã lưu tầm giá.')).toBeVisible();
  expect(state.settingsValue).toBe(25);
  if (visualQaDirectory) await page.screenshot({ path: `${visualQaDirectory}/product-pricing-desktop.png`, fullPage: true });

  await expect(page.getByRole('link', { name: 'Logo & watermark' })).toBeVisible();
  await page.getByRole('link', { name: 'Logo & watermark' }).click();
  await expect(page).toHaveURL(/\/admin\/settings\/catalog\/branding$/);
  await expect(page.getByText('LAMI-2026')).toBeVisible();
  await page.getByRole('switch', { name: /Đang bật/ }).uncheck();
  await expect(page.getByText('Watermark đang tắt; ảnh sản phẩm sẽ được lưu nguyên bản.')).toBeVisible();
  await page.getByRole('switch', { name: /Đang tắt/ }).check();
  await page.getByRole('radio', { name: /Logo shop/ }).check();
  await expect(page.getByText(/Chưa có logo shop/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lưu logo & watermark' })).toBeEnabled();
  await page.getByRole('button', { name: 'Lưu logo & watermark' }).click();
  await expect(page.getByText('Đã lưu logo & watermark.')).toBeVisible();
  if (visualQaDirectory) await page.screenshot({ path: `${visualQaDirectory}/branding-desktop.png`, fullPage: true });
  expect(state.watermarkSource).toBe(2);
  await page.locator('#shop-logo-file').setInputFiles({
    name: 'logo.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  });
  await expect(page.getByAltText('Xem trước logo shop')).toBeVisible();
  await page.getByRole('button', { name: 'Lưu logo & watermark' }).click();
  await expect(page.getByText('Đã lưu logo & watermark.')).toBeVisible();
  await page.getByRole('radio', { name: /Ảnh tải lên/ }).check();
  await expect(page.getByText(/Chưa có ảnh watermark/)).toBeVisible();
  await page.locator('#watermark-image-file').setInputFiles({
    name: 'watermark.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  });
  await expect(page.getByAltText('Xem trước watermark')).toBeVisible();
  await page.getByRole('button', { name: 'Lưu logo & watermark' }).click();
  await expect(page.getByText('Đã lưu logo & watermark.')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Logo & watermark' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  if (visualQaDirectory) await page.screenshot({ path: `${visualQaDirectory}/branding-mobile.png`, fullPage: true });
});
