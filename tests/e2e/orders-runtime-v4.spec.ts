import { expect, test, type APIRequestContext } from '@playwright/test';

const enabled = process.env.LAMIE_ORDER_RUNTIME_ACCEPTANCE === '1';
const apiBase = process.env.LAMIE_API_BASE_URL ?? 'http://127.0.0.1:5137';
const login = process.env.LAMIE_ADMIN_LOGIN ?? '';
const password = process.env.LAMIE_ADMIN_PASSWORD ?? '';

test.skip(!enabled, 'Order runtime acceptance writes only to an explicitly configured isolated Lamie database.');

type OrderDetail = {
  id: string;
  orderCode: string;
  orderStatus: number;
  paymentStatus: number;
  paidAmount: number;
  remainingAmount: number;
  shippingFeeActual: number | null;
  recipientName: string | null;
  recipientPhone: string | null;
  deliveryAddress: string | null;
  completedAt: string | null;
  rowVersion: string | null;
};

const headers = (token: string) => ({ Authorization: `Bearer ${token}` });

const readOrder = async (request: APIRequestContext, id: string, token: string) => {
  const response = await request.get(`${apiBase}/api/orders/${id}`, { headers: headers(token) });
  expect(response.ok(), await response.text()).toBe(true);
  return response.json() as Promise<OrderDetail>;
};

test('real Admin, API and database preserve the V4 order workflow end to end', async ({ page, request }) => {
  test.setTimeout(120_000);
  expect(login).not.toBe('');
  expect(password).not.toBe('');

  await page.goto('/admin/orders/new');
  await expect(page).toHaveURL(/\/login$/);
  await page.locator('#admin-login').fill(login);
  await page.locator('#admin-password').fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).toHaveURL(/\/admin\/orders\/new$/);

  const token = await page.evaluate(() => localStorage.getItem('lamie_access_token'));
  expect(token).toBeTruthy();

  const channelResponse = await request.get(`${apiBase}/api/settings/attributes/channels`, {
    headers: headers(token!),
  });
  expect(channelResponse.ok(), await channelResponse.text()).toBe(true);
  const channels = await channelResponse.json() as Array<{ id: string; isActive: boolean }>;
  const channel = channels.find(item => item.isActive);
  expect(channel).toBeTruthy();

  const createResponse = await request.post(`${apiBase}/api/orders`, {
    headers: headers(token!),
    multipart: {
      OrdererName: 'Runtime Buyer V4',
      OrdererPhone: '0901002026',
      ChannelId: channel!.id,
      PickupAtShop: 'false',
      ProvinceShipping: 'false',
      DeliveryAt: '2026-10-13T10:00:00+07:00',
      ShippingFee: '50000',
      DepositAmount: '0',
      IsPaid: 'false',
      ContentNote: 'RUNTIME-ORDER-V4',
      'Items[0].ProductName': 'Bó hoa runtime V4',
      'Items[0].UnitPrice': '300000',
      'Items[0].Quantity': '1',
      'Items[0].HasCard': 'true',
      'Items[0].CardMessage': 'Chúc mừng\nLuôn rạng rỡ nhé!',
      'Items[0].HasBanner': 'true',
      'Items[0].BannerMessage': 'RUNTIME V4',
    },
  });
  expect(createResponse.status(), await createResponse.text()).toBe(200);
  let order = await createResponse.json() as OrderDetail;
  expect(order).toMatchObject({
    recipientName: null,
    recipientPhone: null,
    deliveryAddress: null,
    orderStatus: 1,
    paymentStatus: 1,
    paidAmount: 0,
    remainingAmount: 350000,
  });

  await page.goto(`/admin/orders?q=${encodeURIComponent(order.orderCode)}`);
  await expect(page.getByRole('table').getByText('Runtime Buyer V4')).toBeVisible();
  await expect(page.getByRole('table').getByText('Chưa có người nhận')).toBeVisible();

  await page.getByRole('button', { name: /Ship thực tế: chưa chốt/ }).click();
  const shippingDialog = page.getByRole('dialog', { name: new RegExp(`${order.orderCode} - Phí ship thực tế`) });
  await shippingDialog.getByLabel('Phí ship thực tế').fill('0');
  const shippingResponse = page.waitForResponse(response =>
    response.url() === `${apiBase}/api/orders/${order.id}/shipping-fee-actual`
      && response.request().method() === 'PATCH');
  await shippingDialog.getByRole('button', { name: 'Lưu phí ship' }).click();
  expect((await shippingResponse).status()).toBe(204);
  order = await readOrder(request, order.id, token!);
  expect(order.shippingFeeActual).toBe(0);

  await page.getByRole('button', { name: 'Xem Thiệp và banner của đơn ' + order.orderCode }).click();
  const contentDialog = page.getByRole('dialog', { name: new RegExp(`${order.orderCode} - Nội dung thêm`) });
  await expect(contentDialog.getByText('Chúc mừng\nLuôn rạng rỡ nhé!')).toBeVisible();
  await page.keyboard.press('Escape');

  const action = async (name: string) => {
    order = await readOrder(request, order.id, token!);
    const response = await request.post(`${apiBase}/api/orders/${order.id}/actions/${name}`, {
      headers: headers(token!),
      data: { rowVersion: order.rowVersion, idempotencyKey: `runtime-${name}-${order.id}` },
    });
    return response;
  };

  expect((await action('confirm')).status()).toBe(200);
  expect((await action('start-preparation')).status()).toBe(200);
  order = await readOrder(request, order.id, token!);
  const checklist = await request.patch(`${apiBase}/api/orders/${order.id}/checklist`, {
    headers: headers(token!),
    data: {
      designConfirmed: true,
      materialsPrepared: true,
      cardPrepared: true,
      qualityChecked: true,
      rowVersion: order.rowVersion,
    },
  });
  expect(checklist.status(), await checklist.text()).toBe(200);
  expect((await action('ready')).status()).toBe(200);

  const blockedDispatch = await action('dispatch');
  expect(blockedDispatch.status()).toBe(400);
  order = await readOrder(request, order.id, token!);
  expect(order.orderStatus).toBe(6);

  const recipientResponse = await request.patch(`${apiBase}/api/orders/${order.id}/recipient`, {
    headers: headers(token!),
    data: {
      recipientName: 'Runtime Recipient V4',
      recipientPhone: '0902002026',
      deliveryAddress: '461 Phan Văn Trị, TP.HCM',
      rowVersion: order.rowVersion,
    },
  });
  expect(recipientResponse.status(), await recipientResponse.text()).toBe(200);
  expect((await action('dispatch')).status()).toBe(200);
  expect((await action('delivered')).status()).toBe(200);
  order = await readOrder(request, order.id, token!);
  expect(order.orderStatus).toBe(7);
  expect(order.completedAt).toBeNull();

  await page.goto(`/admin/orders?q=${encodeURIComponent(order.orderCode)}&range=all`);
  await page.getByRole('button', { name: 'Xem tóm tắt' }).click();
  const summary = page.getByRole('dialog', { name: new RegExp(`${order.orderCode} - Tóm tắt`) });
  await summary.getByRole('button', { name: 'Đánh dấu đã thanh toán' }).click();
  const paymentResponse = page.waitForResponse(response =>
    response.url() === `${apiBase}/api/orders/${order.id}/payment-status`
      && response.request().method() === 'PATCH');
  await summary.getByRole('button', { name: 'Xác nhận đã nhận tiền' }).click();
  expect((await paymentResponse).status()).toBe(204);

  order = await readOrder(request, order.id, token!);
  expect(order).toMatchObject({ orderStatus: 4, paymentStatus: 3, paidAmount: 350000, remainingAmount: 0 });
  expect(order.completedAt).not.toBeNull();
  const paymentsResponse = await request.get(`${apiBase}/api/orders/${order.id}/payments`, {
    headers: headers(token!),
  });
  expect(paymentsResponse.ok(), await paymentsResponse.text()).toBe(true);
  const payments = await paymentsResponse.json() as Array<{ amount: number; method: number }>;
  expect(payments).toHaveLength(1);
  expect(payments[0]).toMatchObject({ amount: 350000, method: 99 });

  await page.goto(`/admin/orders/${order.id}`);
  await page.reload();
  await expect(page.getByRole('heading', { name: order.orderCode })).toBeVisible();
  await expect(page.getByText('Đã thanh toán').first()).toBeVisible();
});
