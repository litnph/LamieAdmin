import { expect, test, type Route } from '@playwright/test';

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

test('inventory keeps no-size stock independent and asks for size only on sized items', async ({ page }) => {
  const user = {
    id: '30000000-0000-0000-0000-000000000099', email: 'inventory@lamie.test', userName: 'inventory',
    fullName: 'Inventory Admin', role: 1, roleCode: 'admin',
    permissions: ['inventory.view', 'inventory.manage', 'expenses.manage'], isActive: true,
  };
  const boxItemId = '50000000-0000-0000-0000-000000000001';
  const ribbonItemId = '50000000-0000-0000-0000-000000000002';
  const boxStockId = '51000000-0000-0000-0000-000000000001';
  const ribbonStockId = '51000000-0000-0000-0000-000000000002';
  const stockUnits = [
    { id: boxStockId, inventoryItemId: boxItemId, inventoryItemCode: 'HOP_GIAY', inventoryItemName: 'Hộp giấy', sizeName: null, unitName: 'Cái', unitSymbol: 'cái', quantity: 3, lowStockThreshold: 5, status: 2, isActive: true, updatedAt: '2026-08-29T00:00:00Z', rowVersion: 'AQIDBAUGBwg=' },
    { id: ribbonStockId, inventoryItemId: ribbonItemId, inventoryItemCode: 'RUY_BANG', inventoryItemName: 'Ruy băng', sizeName: '3cm', unitName: 'Cuộn', unitSymbol: 'cuộn', quantity: 0, lowStockThreshold: 2, status: 3, isActive: true, updatedAt: '2026-08-29T00:00:00Z' },
  ];
  const inventoryItems = [
    { id: boxItemId, code: 'HOP_GIAY', name: 'Hộp giấy', measurementUnitId: 1, unitName: 'Cái', unitSymbol: 'cái', note: null, isActive: true, usesSizes: false, legacyIngredientId: null, stockUnits: [stockUnits[0]], updatedAt: '2026-08-29T00:00:00Z' },
    { id: ribbonItemId, code: 'RUY_BANG', name: 'Ruy băng', measurementUnitId: 2, unitName: 'Cuộn', unitSymbol: 'cuộn', note: null, isActive: true, usesSizes: true, legacyIngredientId: null, stockUnits: [stockUnits[1]], updatedAt: '2026-08-29T00:00:00Z' },
  ];
  let receiptBody = '';
  let issueBody = '';
  let adjustmentBody = '';

  await page.addInitScript(({ currentUser }) => {
    localStorage.setItem('lamie_access_token', 'inventory-access');
    localStorage.setItem('lamie_refresh_token', 'inventory-refresh');
    localStorage.setItem('lamie_user_json', JSON.stringify(currentUser));
  }, { currentUser: user });

  await page.route(/^https?:\/\/[^/]+\/api\//, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/auth/me') return json(route, user);
    if (url.pathname === '/api/admin/navigation/me/routes') return json(route, [{ id: 'route-inventory', key: 'ingredients.inventory', moduleKey: 'ingredients', pageKey: 'ingredients.inventory', path: '/admin/ingredients/inventory', permissionCode: 'inventory.view', sortOrder: 1 }]);
    if (url.pathname === '/api/admin/navigation/me') return json(route, []);
    if (url.pathname === '/api/inventory/stock-units' && request.method() === 'GET') return json(route, { items: stockUnits, totalCount: 2, page: 1, pageSize: Number(url.searchParams.get('pageSize') ?? 20), totalPages: 1, hasNext: false, hasPrevious: false });
    if (url.pathname === '/api/inventory/items' && request.method() === 'GET') return json(route, inventoryItems);
    if (url.pathname === '/api/settings/measurement-units') return json(route, { items: [{ id: 1, code: 'CAI', name: 'Cái', symbol: 'cái', allowsFractional: false, isActive: true }, { id: 2, code: 'CUON', name: 'Cuộn', symbol: 'cuộn', allowsFractional: true, isActive: true }], totalCount: 2, page: 1, pageSize: 100, totalPages: 1, hasNext: false, hasPrevious: false });
    if (url.pathname === '/api/expense-categories') return json(route, []);
    if (url.pathname === '/api/inventory/receipts' && request.method() === 'POST') {
      receiptBody = request.postData() ?? '';
      return json(route, { id: '52000000-0000-0000-0000-000000000001', receiptNumber: 'NK-260829-001', clientRequestId: 'request', receivedDate: '2026-08-29', note: null, invoiceUrl: null, invoiceFileName: null, expenseId: null, items: [], createdAt: '2026-08-29T00:00:00Z' }, 201);
    }
    if (url.pathname === `/api/inventory/stock-units/${boxStockId}/issues` && request.method() === 'POST') {
      issueBody = request.postData() ?? '';
      return json(route, { id: '53000000-0000-0000-0000-000000000001', stockUnitId: boxStockId, type: 4, quantityDelta: -2, balanceAfter: 1, note: 'Dùng nội bộ', createdAt: '2026-08-29T01:00:00Z' });
    }
    if (url.pathname === `/api/inventory/stock-units/${boxStockId}/adjustments` && request.method() === 'POST') {
      adjustmentBody = request.postData() ?? '';
      return json(route, { id: '53000000-0000-0000-0000-000000000002', stockUnitId: boxStockId, type: 5, quantityDelta: 2, balanceAfter: 5, note: 'Kiểm kê', createdAt: '2026-08-29T02:00:00Z' });
    }
    return json(route, { message: `Unhandled ${request.method()} ${url.pathname}` }, 404);
  });

  await page.goto('/admin/ingredients/inventory');
  await expect(page.getByRole('heading', { name: 'Kho hàng', level: 1 })).toBeVisible();
  await expect(page.locator('span').getByText('Tồn thấp', { exact: true })).toBeVisible();
  await expect(page.locator('span').getByText('Hết hàng', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tạo phiếu nhập kho' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nhập kho' });
  await dialog.getByLabel('Hàng tồn *').selectOption(boxItemId);
  await expect(dialog.getByLabel('Size *')).toHaveCount(0);
  await dialog.getByLabel('Số lượng *').fill('7');
  await dialog.getByRole('button', { name: 'Thêm dòng' }).click();
  await dialog.getByLabel('Hàng tồn *').nth(1).selectOption(ribbonItemId);
  await dialog.getByLabel('Size *').selectOption(ribbonStockId);
  await dialog.getByLabel('Số lượng *').nth(1).fill('2');
  await dialog.getByRole('button', { name: 'Xác nhận nhập kho' }).click();
  await expect(page.getByText(/Đã nhập kho theo phiếu NK-260829-001/)).toBeVisible();
  expect(receiptBody).toContain(boxStockId);
  expect(receiptBody).toContain(ribbonStockId);
  expect(receiptBody).toContain('clientRequestId');

  await page.getByRole('button', { name: 'Xuất kho Hộp giấy' }).click();
  const issueDialog = page.getByRole('dialog', { name: 'Xuất kho thủ công' });
  await issueDialog.getByLabel('Số lượng xuất *').fill('2');
  await issueDialog.getByLabel('Lý do / ghi chú').fill('Dùng nội bộ');
  await issueDialog.getByRole('button', { name: 'Xác nhận xuất kho' }).click();
  await expect(page.getByText(/Đã xuất 2 cái Hộp giấy/)).toBeVisible();
  expect(issueBody).toContain('"quantity":2');
  expect(issueBody).toContain('AQIDBAUGBwg=');

  await page.getByRole('button', { name: 'Điều chỉnh tồn Hộp giấy' }).click();
  const adjustmentDialog = page.getByRole('dialog', { name: 'Điều chỉnh tồn kho' });
  await adjustmentDialog.getByLabel('Tồn đếm thực tế *').fill('5');
  await adjustmentDialog.getByLabel('Lý do / ghi chú').fill('Kiểm kê');
  await adjustmentDialog.getByRole('button', { name: 'Lưu điều chỉnh' }).click();
  await expect(page.getByText(/Đã điều chỉnh tồn Hộp giấy về 5/)).toBeVisible();
  expect(adjustmentBody).toContain('"countedQuantity":5');
});
