import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const runtimeEnabled = process.env.LAMIE_RUNTIME_ACCEPTANCE === '1';
const apiBase = process.env.LAMIE_API_BASE_URL ?? 'http://127.0.0.1:5137';
const login = process.env.LAMIE_ADMIN_LOGIN ?? '';
const password = process.env.LAMIE_ADMIN_PASSWORD ?? '';
const productImagePath = process.env.LAMIE_PRODUCT_IMAGE ?? '';
const orderImagePath = process.env.LAMIE_ORDER_IMAGE ?? '';
const runTag = process.env.LAMIE_RUN_TAG ?? 'TEST-LOCAL-RUNTIME';

test.skip(!runtimeEnabled, 'Local runtime acceptance is opt-in because it writes TEST-LOCAL records to Lamie.');

type ProductDetail = {
  id: number;
  sku: string;
  price: number;
  stock: number;
  tracksInventory: boolean;
  categoryId: number;
  productTypeId: number;
  isActive: boolean;
  thumbnailUrl: string | null;
  translations: Array<{ languageCode: string; name: string; slug: string; description: string | null }>;
  images: Array<{ id: number; imageUrl: string; isActive: boolean; sortOrder: number }>;
  tagIds: number[];
  colorIds: number[];
  collectionIds: number[];
  styleIds: number[];
  occasionIds: number[];
};

type OrderDetail = {
  id: string;
  orderCode: string;
  ordererName: string;
  ordererPhone: string;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string | null;
  deliveryAt: string;
  deliveryTo: string | null;
  depositAmount: number;
  shippingFee: number;
  subTotal: number;
  totalAmount: number;
  rowVersion: string | null;
  items: Array<{
    id: string;
    productId: string | null;
    productSku: string | null;
    productName: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    note: string | null;
    hasCard: boolean;
    cardMessage: string | null;
    hasBanner: boolean;
    bannerMessage: string | null;
    images: Array<{ id: string; imageUrl: string; sortOrder: number }>;
  }>;
  images: Array<{ id: string; orderItemId: string | null; imageUrl: string; sortOrder: number }>;
};

type BatchCreateResult = {
  createdCount: number;
  orders: Array<{ clientDraftId: string; orderId: string; orderNumber: string }>;
};

type BatchFailureResult = {
  code: string;
  batchError: {
    clientDraftId: string;
    index: number;
    code: string;
    message: string;
  };
};

type PagedOrderResult = {
  totalCount: number;
};

type Multipart = Parameters<APIRequestContext['post']>[1] extends { multipart?: infer T } ? T : never;

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

const absoluteApiUrl = (url: string): string => new URL(url, `${apiBase}/`).toString();

const getJson = async <T>(request: APIRequestContext, path: string, token: string): Promise<T> => {
  const response = await request.get(`${apiBase}${path}`, { headers: authHeaders(token) });
  expect(response.ok(), `${response.status()} ${path}: ${await response.text()}`).toBe(true);
  return response.json() as Promise<T>;
};

const productMultipart = (
  name: string,
  categoryId: number,
  productTypeId: number,
  languageCode: string,
  image?: Buffer,
  sku = '',
): NonNullable<Multipart> => ({
  Sku: sku,
  Price: '550000',
  Stock: '0',
  TracksInventory: 'false',
  CategoryId: String(categoryId),
  ProductTypeId: String(productTypeId),
  'Translations[0].LanguageCode': languageCode,
  'Translations[0].Name': name,
  'Translations[0].Slug': `${runTag.toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  'Translations[0].Description': 'Dữ liệu nghiệm thu local, không phải dữ liệu production.',
  ...(image ? { ThumbnailFile: { name: 'product-source.jpg', mimeType: 'image/jpeg', buffer: image } } : {}),
});

const orderMultipart = (options: {
  channelId: string;
  product: ProductDetail;
  recipientName: string;
  ordererName: string;
  deposit?: number;
  hasCard?: boolean;
  cardMessage?: string;
  hasBanner?: boolean;
  bannerMessage?: string;
}): NonNullable<Multipart> => ({
  OrdererName: options.ordererName,
  OrdererPhone: '0911111111',
  ChannelId: options.channelId,
  RecipientName: options.recipientName,
  RecipientPhone: '0901111111',
  PickupAtShop: 'false',
  ProvinceShipping: 'false',
  DeliveryAddress: 'TEST-LOCAL direct API address',
  DeliveryAt: '2026-08-11T17:15:00+07:00',
  DeliveryTo: '2026-08-11T17:30:00+07:00',
  ShippingFee: '0',
  ContentNote: runTag,
  'Items[0].ProductId': String(options.product.id),
  'Items[0].ProductSku': options.product.sku,
  'Items[0].ProductName': options.product.translations[0]?.name ?? options.product.sku,
  'Items[0].UnitPrice': '550000',
  'Items[0].Quantity': '1',
  'Items[0].HasCard': String(options.hasCard ?? false),
  'Items[0].HasBanner': String(options.hasBanner ?? false),
  ...(options.deposit === undefined ? {} : { DepositAmount: String(options.deposit) }),
  ...(options.cardMessage === undefined ? {} : { 'Items[0].CardMessage': options.cardMessage }),
  ...(options.bannerMessage === undefined ? {} : { 'Items[0].BannerMessage': options.bannerMessage }),
});

const batchOrderMultipart = (options: {
  index: number;
  clientDraftId: string;
  channelId: string;
  product: ProductDetail;
  recipientName: string;
  productId?: string;
}): NonNullable<Multipart> => {
  const prefix = `Orders[${options.index}]`;
  return {
    [`${prefix}.ClientDraftId`]: options.clientDraftId,
    [`${prefix}.OrdererName`]: options.recipientName,
    [`${prefix}.OrdererPhone`]: '0911111111',
    [`${prefix}.ChannelId`]: options.channelId,
    [`${prefix}.RecipientName`]: options.recipientName,
    [`${prefix}.RecipientPhone`]: '0901111111',
    [`${prefix}.PickupAtShop`]: 'false',
    [`${prefix}.ProvinceShipping`]: 'false',
    [`${prefix}.DeliveryAddress`]: 'TEST-LOCAL batch rollback address',
    [`${prefix}.DeliveryAt`]: '2026-08-15T17:15:00+07:00',
    [`${prefix}.DeliveryTo`]: '2026-08-15T17:30:00+07:00',
    [`${prefix}.ShippingFee`]: '50000',
    [`${prefix}.DepositAmount`]: '200000',
    [`${prefix}.ContentNote`]: runTag,
    [`${prefix}.Items[0].ProductId`]: options.productId ?? String(options.product.id),
    [`${prefix}.Items[0].ProductSku`]: options.product.sku,
    [`${prefix}.Items[0].ProductName`]: options.product.translations[0]?.name ?? options.product.sku,
    [`${prefix}.Items[0].UnitPrice`]: '550000',
    [`${prefix}.Items[0].Quantity`]: '1',
    [`${prefix}.Items[0].HasCard`]: 'false',
    [`${prefix}.Items[0].HasBanner`]: 'false',
  };
};

const loginThroughAdmin = async (page: Page): Promise<string> => {
  await page.goto('/admin/orders/new');
  await expect(page).toHaveURL(/\/login$/);
  await page.locator('#admin-login').fill(login);
  await page.locator('#admin-password').fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).toHaveURL(/\/admin\/orders\/new$/);
  const token = await page.evaluate(() => localStorage.getItem('lamie_access_token'));
  expect(token).toBeTruthy();
  return token!;
};

test('Lamie local Admin/API/DB acceptance flow', async ({ page, request }) => {
  test.setTimeout(180_000);
  expect(login).not.toBe('');
  expect(password).not.toBe('');
  expect(productImagePath).not.toBe('');
  expect(orderImagePath).not.toBe('');

  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(`console: ${message.text()}`);
  });
  await page.route('https://nominatim.openstreetmap.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

  const token = await loginThroughAdmin(page);
  const headers = authHeaders(token);

  const unauthenticated = await request.get(`${apiBase}/api/orders`);
  expect(unauthenticated.status()).toBe(401);
  const missing = await request.get(`${apiBase}/api/orders/00000000-0000-0000-0000-000000000099`, { headers });
  expect(missing.status()).toBe(404);

  const categories = await getJson<Array<{ id: number }>>(request, '/api/settings/attributes/categories', token);
  const productTypes = await getJson<Array<{ id: number }>>(request, '/api/settings/attributes/product-types', token);
  const languages = await getJson<Array<{ code: string }>>(request, '/api/settings/attributes/languages', token);
  const channels = await getJson<Array<{ id: string; code: string; isActive: boolean }>>(request, '/api/settings/attributes/channels', token);
  expect(categories.length).toBeGreaterThan(0);
  expect(productTypes.length).toBeGreaterThan(0);
  expect(languages.length).toBeGreaterThan(0);
  const channel = channels.find((item) => item.code === 'admin' && item.isActive) ?? channels.find((item) => item.isActive);
  expect(channel).toBeTruthy();

  const sourceProductImage = readFileSync(productImagePath);
  const sourceOrderImage = readFileSync(orderImagePath);
  const productName = `${runTag} Product Watermark`;
  const createProduct = await request.post(`${apiBase}/api/settings/products`, {
    headers,
    multipart: productMultipart(
      productName,
      categories[0].id,
      productTypes[0].id,
      languages[0].code,
      sourceProductImage,
    ),
  });
  expect(createProduct.status(), await createProduct.text()).toBe(201);
  const { id: productId } = await createProduct.json() as { id: number };
  const product = await getJson<ProductDetail>(request, `/api/settings/products/${productId}`, token);
  expect(product.sku).toMatch(/^[A-Z0-9]{4}$/);
  expect(product.thumbnailUrl).toBeTruthy();

  const persistedThumbnailBefore = await request.get(absoluteApiUrl(product.thumbnailUrl!));
  expect(persistedThumbnailBefore.ok()).toBe(true);
  const persistedThumbnailBytes = await persistedThumbnailBefore.body();
  expect(createHash('sha256').update(persistedThumbnailBytes).digest('hex'))
    .not.toBe(createHash('sha256').update(sourceProductImage).digest('hex'));

  const createSecondProduct = await request.post(`${apiBase}/api/settings/products`, {
    headers,
    multipart: productMultipart(
      `${runTag} Product Unique`,
      categories[0].id,
      productTypes[0].id,
      languages[0].code,
    ),
  });
  expect(createSecondProduct.status(), await createSecondProduct.text()).toBe(201);
  const { id: secondProductId } = await createSecondProduct.json() as { id: number };
  const secondProduct = await getJson<ProductDetail>(request, `/api/settings/products/${secondProductId}`, token);
  expect(secondProduct.sku).toMatch(/^[A-Z0-9]{4}$/);
  expect(secondProduct.sku).not.toBe(product.sku);

  const duplicateProduct = await request.post(`${apiBase}/api/settings/products`, {
    headers,
    multipart: productMultipart(
      `${runTag} Duplicate SKU`,
      categories[0].id,
      productTypes[0].id,
      languages[0].code,
      undefined,
      product.sku,
    ),
  });
  expect(duplicateProduct.status(), await duplicateProduct.text()).toBe(409);

  const updateProduct = await request.put(`${apiBase}/api/settings/products/${product.id}`, {
    headers,
    multipart: {
      Id: String(product.id),
      Sku: product.sku,
      Price: String(product.price),
      Stock: String(product.stock),
      TracksInventory: String(product.tracksInventory),
      CategoryId: String(product.categoryId),
      ProductTypeId: String(product.productTypeId),
      ThumbnailUrl: product.thumbnailUrl!,
      'Translations[0].LanguageCode': product.translations[0].languageCode,
      'Translations[0].Name': `${productName} Updated`,
      'Translations[0].Slug': product.translations[0].slug,
      'Translations[0].Description': product.translations[0].description ?? '',
    },
  });
  expect(updateProduct.status(), await updateProduct.text()).toBe(204);
  const productAfterNoUpload = await getJson<ProductDetail>(request, `/api/settings/products/${product.id}`, token);
  expect(productAfterNoUpload.thumbnailUrl).toBe(product.thumbnailUrl);
  const persistedThumbnailAfter = await request.get(absoluteApiUrl(productAfterNoUpload.thumbnailUrl!));
  expect(createHash('sha256').update(await persistedThumbnailAfter.body()).digest('hex'))
    .toBe(createHash('sha256').update(persistedThumbnailBytes).digest('hex'));

  const defaultDepositOrderResponse = await request.post(`${apiBase}/api/orders`, {
    headers,
    multipart: orderMultipart({
      channelId: channel!.id,
      product: productAfterNoUpload,
      recipientName: `${runTag} Default Deposit Recipient`,
      ordererName: `${runTag} Default Deposit Orderer`,
    }),
  });
  expect(defaultDepositOrderResponse.status(), await defaultDepositOrderResponse.text()).toBe(200);
  const defaultDepositOrder = await defaultDepositOrderResponse.json() as OrderDetail;
  expect(defaultDepositOrder.depositAmount).toBe(200000);
  expect(defaultDepositOrder.items[0]).toMatchObject({ hasCard: false, cardMessage: null, hasBanner: false, bannerMessage: null });

  const explicitDepositOrderResponse = await request.post(`${apiBase}/api/orders`, {
    headers,
    multipart: orderMultipart({
      channelId: channel!.id,
      product: productAfterNoUpload,
      recipientName: `${runTag} Explicit Zero Recipient`,
      ordererName: `${runTag} Explicit Zero Orderer`,
      deposit: 0,
    }),
  });
  expect(explicitDepositOrderResponse.status(), await explicitDepositOrderResponse.text()).toBe(200);
  const explicitDepositOrder = await explicitDepositOrderResponse.json() as OrderDetail;
  expect(explicitDepositOrder.depositAmount).toBe(0);

  const invalidCard = await request.post(`${apiBase}/api/orders`, {
    headers,
    multipart: orderMultipart({
      channelId: channel!.id,
      product: productAfterNoUpload,
      recipientName: `${runTag} Invalid Card Recipient`,
      ordererName: `${runTag} Invalid Card Orderer`,
      hasCard: true,
    }),
  });
  expect(invalidCard.status(), await invalidCard.text()).toBe(400);

  await page.goto('/admin/orders/new');
  await expect(page.getByRole('heading', { name: 'Tạo đơn hàng', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Nhập nhanh' }).click();
  const quickImport = page.getByRole('dialog', { name: 'Nhập nhiều đơn hàng' });
  const queueOrder = async (index: number, withImage: boolean, withCardAndBanner = false) => {
    await quickImport.getByLabel('Đoạn chat').fill([
      '15/08 17h15-17h30',
      `${productAfterNoUpload.translations[0].name} 550, 50 ship cọc 200`,
      `035275259${index}`,
      '461 Phan Văn Trị, Phường An Nhơn',
      ...(withCardAndBanner ? ['thiệp: TEST thiệp batch', 'banner: TEST banner batch'] : []),
    ].join('\n'));
    if (withImage) await quickImport.locator('#quick-import-images').setInputFiles(orderImagePath);
    await quickImport.getByRole('button', { name: 'Phân tích' }).click();
    await quickImport.getByLabel('Người nhận', { exact: true }).fill(`${runTag} Batch Recipient ${index}`);
    await quickImport.getByLabel('Người đặt', { exact: true }).fill(`${runTag} Batch Orderer ${index}`);
    await expect(quickImport).toContainText('17:15 - 17:30');
    await expect(quickImport.getByLabel('Địa chỉ chi tiết')).toHaveValue('461 Phan Văn Trị');
    await expect(quickImport.getByText('Thành phố Hồ Chí Minh', { exact: true }).first()).toBeVisible();
    await expect(quickImport.getByText('Phường An Nhơn', { exact: true }).first()).toBeVisible();
    await quickImport.getByRole('button', { name: 'Áp dụng', exact: true }).click();
  };

  await queueOrder(1, false);
  await queueOrder(2, true);
  await queueOrder(3, true, true);
  await expect(quickImport.getByRole('heading', { name: 'Danh sách đơn chờ (3)' })).toBeVisible();
  await quickImport.getByRole('button', { name: 'Xóa đơn chờ 2' }).click();
  await expect(quickImport.getByRole('heading', { name: 'Danh sách đơn chờ (2)' })).toBeVisible();
  await queueOrder(2, true);
  await expect(quickImport.getByRole('heading', { name: 'Danh sách đơn chờ (3)' })).toBeVisible();

  const batchResponsePromise = page.waitForResponse((response) =>
    response.url() === `${apiBase}/api/orders/batch` && response.request().method() === 'POST');
  await quickImport.getByRole('button', { name: 'Lưu 3 đơn' }).click();
  const batchHttpResponse = await batchResponsePromise;
  expect(batchHttpResponse.status(), await batchHttpResponse.text()).toBe(200);
  const batchResult = await batchHttpResponse.json() as BatchCreateResult;
  expect(batchResult.createdCount).toBe(3);
  expect(new Set(batchResult.orders.map((item) => item.orderNumber)).size).toBe(3);
  await expect(page).toHaveURL(/\/admin\/orders$/);
  await expect(page.getByText('Đã tạo thành công 3 đơn hàng.')).toBeVisible();

  const batchOrders = await Promise.all(batchResult.orders.map((item) =>
    getJson<OrderDetail>(request, `/api/orders/${item.orderId}`, token)));
  const firstBatchOrder = batchOrders.find((item) => item.recipientName.endsWith('Batch Recipient 1'))!;
  const secondBatchOrder = batchOrders.find((item) => item.recipientName.endsWith('Batch Recipient 2'))!;
  const createdOrder = batchOrders.find((item) => item.recipientName.endsWith('Batch Recipient 3'))!;
  expect(firstBatchOrder.images).toHaveLength(0);
  expect(secondBatchOrder.images).toHaveLength(1);
  expect(createdOrder.images).toHaveLength(1);

  expect(createdOrder).toMatchObject({
    recipientName: `${runTag} Batch Recipient 3`,
    recipientPhone: '0352752593',
    ordererName: `${runTag} Batch Orderer 3`,
    ordererPhone: '',
    depositAmount: 200000,
    shippingFee: 50000,
    subTotal: 550000,
    totalAmount: 600000,
  });
  expect(createdOrder.deliveryAddress).toContain('461 Phan Văn Trị');
  expect(createdOrder.deliveryAddress).toContain('Phường An Nhơn');
  expect(createdOrder.deliveryAt).toBe('2026-08-15T10:15:00+00:00');
  expect(createdOrder.deliveryTo).toBe('2026-08-15T10:30:00+00:00');
  expect(createdOrder.items[0]).toMatchObject({
    productId: String(product.id),
    productSku: product.sku,
    quantity: 1,
    unitPrice: 550000,
    hasCard: true,
    cardMessage: 'TEST thiệp batch',
    hasBanner: true,
    bannerMessage: 'TEST banner batch',
  });
  expect(createdOrder.images).toHaveLength(1);
  expect(createdOrder.items[0].images).toHaveLength(1);
  const persistedOrderImage = await request.get(absoluteApiUrl(createdOrder.images[0].imageUrl));
  expect(persistedOrderImage.ok()).toBe(true);
  expect(createHash('sha256').update(await persistedOrderImage.body()).digest('hex'))
    .toBe(createHash('sha256').update(sourceOrderImage).digest('hex'));

  const rollbackMarker = `${runTag} ROLLBACK`;
  const validRollbackDraftId = `${runTag}-rollback-valid-1`;
  const invalidRollbackDraftId = `${runTag}-rollback-invalid`;
  const secondValidRollbackDraftId = `${runTag}-rollback-valid-2`;
  const rollbackResponse = await request.post(`${apiBase}/api/orders/batch`, {
    headers,
    multipart: {
      ...batchOrderMultipart({
        index: 0,
        clientDraftId: validRollbackDraftId,
        channelId: channel!.id,
        product: productAfterNoUpload,
        recipientName: `${rollbackMarker} Recipient 1`,
      }),
      ...batchOrderMultipart({
        index: 1,
        clientDraftId: invalidRollbackDraftId,
        channelId: channel!.id,
        product: productAfterNoUpload,
        recipientName: `${rollbackMarker} Recipient Invalid`,
        productId: '2147483647',
      }),
      ...batchOrderMultipart({
        index: 2,
        clientDraftId: secondValidRollbackDraftId,
        channelId: channel!.id,
        product: productAfterNoUpload,
        recipientName: `${rollbackMarker} Recipient 2`,
      }),
    },
  });
  expect(rollbackResponse.status(), await rollbackResponse.text()).toBe(404);
  const rollbackFailure = await rollbackResponse.json() as BatchFailureResult;
  expect(rollbackFailure).toMatchObject({
    code: 'BATCH_ORDER_FAILED',
    batchError: {
      clientDraftId: invalidRollbackDraftId,
      index: 1,
    },
  });
  const afterFailedBatch = await getJson<PagedOrderResult>(
    request,
    `/api/orders?search=${encodeURIComponent(rollbackMarker)}&page=1&pageSize=20`,
    token,
  );
  expect(afterFailedBatch.totalCount).toBe(0);

  const retryBatchResponse = await request.post(`${apiBase}/api/orders/batch`, {
    headers,
    multipart: {
      ...batchOrderMultipart({
        index: 0,
        clientDraftId: validRollbackDraftId,
        channelId: channel!.id,
        product: productAfterNoUpload,
        recipientName: `${rollbackMarker} Recipient 1`,
      }),
      ...batchOrderMultipart({
        index: 1,
        clientDraftId: secondValidRollbackDraftId,
        channelId: channel!.id,
        product: productAfterNoUpload,
        recipientName: `${rollbackMarker} Recipient 2`,
      }),
    },
  });
  expect(retryBatchResponse.status(), await retryBatchResponse.text()).toBe(200);
  const retryBatchResult = await retryBatchResponse.json() as BatchCreateResult;
  expect(retryBatchResult.createdCount).toBe(2);
  const afterRetryBatch = await getJson<PagedOrderResult>(
    request,
    `/api/orders?search=${encodeURIComponent(rollbackMarker)}&page=1&pageSize=20`,
    token,
  );
  expect(afterRetryBatch.totalCount).toBe(2);

  await page.goto(`/admin/orders/${createdOrder.id}`);
  await expect(page.locator('p:visible').filter({ hasText: 'TEST thiệp batch' }).first()).toBeVisible();
  await expect(page.locator('p:visible').filter({ hasText: 'TEST banner batch' }).first()).toBeVisible();
  const attachmentImage = page.locator(`img[src="${absoluteApiUrl(createdOrder.images[0].imageUrl)}"]:visible`).first();
  await expect(attachmentImage).toBeVisible();
  await attachmentImage.dblclick();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByRole('link', { name: 'Sửa đơn' }).click();
  await expect(page.getByRole('heading', { name: 'Sửa đơn hàng', level: 1 })).toBeVisible();
  await expect(page.locator('#recipient-name')).toHaveValue(`${runTag} Batch Recipient 3`);
  await expect(page.locator('#orderer-name')).toHaveValue(`${runTag} Batch Orderer 3`);
  await expect(page.locator('#delivery-at')).toHaveValue('2026-08-15T17:15');
  await expect(page.locator('#delivery-to')).toHaveValue('2026-08-15T17:30');
  await page.getByRole('button', { name: 'Mở chi tiết sản phẩm 1' }).click();
  await expect(page.getByAltText(/Ảnh minh họa đã lưu 1/)).toBeVisible();
  await page.locator('#recipient-name').fill(`${runTag} Batch Recipient 3 Updated`);
  await page.locator('#delivery-at').fill('2026-08-15T18:00');
  await page.locator('#delivery-to').fill('2026-08-15T18:30');
  await page.locator('#order-line-quantity-0').fill('3');
  await page.getByLabel('Nội dung thiệp').fill('TEST thiệp updated');
  await page.getByLabel('Nội dung banner').fill('TEST banner updated');
  await page.locator('#deposit-amount').fill('350000');
  await page.locator('#order-line-images-0').setInputFiles(productImagePath);

  const updateOrderResponse = page.waitForResponse((response) =>
    response.url() === `${apiBase}/api/orders/${createdOrder.id}` && response.request().method() === 'PUT');
  await page.getByRole('button', { name: 'Cập nhật đơn' }).click();
  const updatedHttpResponse = await updateOrderResponse;
  expect(updatedHttpResponse.status()).toBe(200);
  await expect(page).toHaveURL(new RegExp(`/admin/orders/${createdOrder.id}$`));
  await expect(page.getByText('Đã cập nhật đơn hàng.')).toBeVisible();
  const updatedOrder = await getJson<OrderDetail>(request, `/api/orders/${createdOrder.id}`, token);
  expect(updatedOrder).toMatchObject({
    recipientName: `${runTag} Batch Recipient 3 Updated`,
    ordererName: `${runTag} Batch Orderer 3`,
    deliveryAt: '2026-08-15T11:00:00+00:00',
    deliveryTo: '2026-08-15T11:30:00+00:00',
    depositAmount: 350000,
    subTotal: 1650000,
    totalAmount: 1700000,
  });
  expect(updatedOrder.items[0]).toMatchObject({
    quantity: 3,
    hasCard: true,
    cardMessage: 'TEST thiệp updated',
    hasBanner: true,
    bannerMessage: 'TEST banner updated',
  });
  expect(updatedOrder.images).toHaveLength(2);
  expect(updatedOrder.images.map((image) => image.id)).toContain(createdOrder.images[0].id);
  expect(updatedOrder.images.map((image) => image.sortOrder).sort()).toEqual([0, 1]);

  await page.goto('/admin/orders');
  await expect(page.getByRole('heading', { name: 'Đơn hàng', level: 1 })).toBeVisible();
  await page.getByPlaceholder('Mã đơn, tên người đặt hoặc người nhận').fill(createdOrder.orderCode);
  await page.keyboard.press('Enter');
  await expect(page.locator(`a[href="/admin/orders/${createdOrder.id}"]:visible`).first()).toHaveText(createdOrder.orderCode);
  await page.getByRole('button', { name: 'Lọc nâng cao' }).click();
  await expect(page.getByRole('dialog', { name: 'Lọc đơn hàng nâng cao' })).toBeVisible();
  await page.keyboard.press('Escape');

  const allProducts = await getJson<ProductDetail[]>(request, '/api/settings/products', token);
  const legacyProduct = allProducts.find((item) => !/^[A-Z0-9]{4}$/.test(item.sku));
  expect(legacyProduct).toBeTruthy();
  await page.goto('/admin/products');
  await expect(page.getByRole('heading', { name: 'Sản phẩm', level: 1 })).toBeVisible();
  const search = page.getByPlaceholder('Tên hoặc SKU');
  await search.fill(product.sku);
  await page.getByRole('button', { name: 'Tìm', exact: true }).click();
  await expect(page.locator(`p[title="${product.sku}"]:visible`).first()).toHaveText(`SKU ${product.sku}`);
  await search.fill(legacyProduct!.sku);
  await page.getByRole('button', { name: 'Tìm', exact: true }).click();
  await expect(page.locator(`p[title="${legacyProduct!.sku}"]:visible`).first()).toHaveText(`SKU ${legacyProduct!.sku}`);
  await page.goto(`/admin/products/${product.id}/edit`);
  await expect(page.getByRole('heading', { name: 'Sửa sản phẩm', level: 1 })).toBeVisible();
  await expect(page.getByLabel('SKU')).toBeDisabled();
  await page.goto('/admin/products/create');
  await expect(page.getByRole('heading', { name: 'Tạo sản phẩm', level: 1 })).toBeVisible();

  expect(browserErrors).toEqual([]);
});
