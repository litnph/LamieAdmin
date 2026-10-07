import { expect, test, type Page, type Route } from '@playwright/test';

const user = {
  id: '30000000-0000-0000-0000-000000000091',
  email: 'admin@lamie.test',
  userName: 'admin_ingredients',
  fullName: 'Admin Ingredients',
  role: 1,
  roleCode: 'admin',
  permissions: ['ingredients.view', 'ingredients.manage', 'ingredient-reports.view'],
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const featureRoutes = [
  { id: 'route-ingredients', key: 'ingredients.list', moduleKey: 'ingredients', pageKey: 'ingredients.list', path: '/admin/ingredients', permissionCode: 'ingredients.view', sortOrder: 1 },
  { id: 'route-units', key: 'ingredients.units', moduleKey: 'ingredients', pageKey: 'ingredients.units', path: '/admin/ingredients/units', permissionCode: 'ingredients.view', sortOrder: 2 },
  { id: 'route-demand', key: 'ingredients.demand', moduleKey: 'ingredients', pageKey: 'ingredients.demand', path: '/admin/ingredients/demand', permissionCode: 'ingredient-reports.view', sortOrder: 3 },
];

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const unit = (id: number, code: string, name: string, symbol: string) => ({
  id, code, name, symbol, allowsFractional: true, isActive: true,
  createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z',
  referenceCount: 0, canDelete: true,
});

const paged = <T,>(items: T[]) => ({
  items, totalCount: items.length, page: 1, pageSize: 100, totalPages: items.length ? 1 : 0,
  hasNext: false, hasPrevious: false,
});

type MockState = {
  unitCreate?: Record<string, unknown>;
  ingredientCreate?: Record<string, unknown>;
  reportQuery?: URLSearchParams;
  paginateUnits?: boolean;
  unitPageRequests?: number[];
};

const installMocks = async (page: Page, state: MockState) => {
  const units = [unit(1, 'BONG', 'Bông', 'bông'), unit(2, 'BO', 'Bó', 'bó')];
  const ingredients: Array<Record<string, unknown>> = [{
    id: 10,
    code: 'ROSE_RED',
    name: 'Hoa hồng đỏ',
    baseUnit: units[0],
    note: 'Hoa chính',
    isActive: true,
    conversions: [],
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    productCount: 1,
    snapshotCount: 1,
    canDelete: false,
  }];

  await page.addInitScript(({ currentUser }) => {
    localStorage.setItem('lamie_access_token', 'e2e-access-token');
    localStorage.setItem('lamie_refresh_token', 'e2e-refresh-token');
    localStorage.setItem('lamie_user_json', JSON.stringify(currentUser));
  }, { currentUser: user });

  await page.route(/^https?:\/\/[^/]+\/api\//, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (url.pathname === '/api/auth/me') return json(route, user);
    if (url.pathname === '/api/admin/navigation/me/routes') return json(route, featureRoutes);
    if (url.pathname === '/api/admin/navigation/me') return json(route, []);

    if (url.pathname === '/api/settings/measurement-units' && method === 'GET') {
      const requestedPage = Number(url.searchParams.get('page') ?? '1');
      state.unitPageRequests?.push(requestedPage);
      if (state.paginateUnits) {
        const catalog = Array.from({ length: 21 }, (_, index) => unit(
          index + 1,
          `UNIT_${String(index + 1).padStart(2, '0')}`,
          `Đơn vị ${String(index + 1).padStart(2, '0')}`,
          `u${index + 1}`,
        ));
        const pageSize = Number(url.searchParams.get('pageSize') ?? '20');
        const items = catalog.slice((requestedPage - 1) * pageSize, requestedPage * pageSize);
        return json(route, {
          items,
          totalCount: catalog.length,
          page: requestedPage,
          pageSize,
          totalPages: Math.ceil(catalog.length / pageSize),
          hasNext: requestedPage * pageSize < catalog.length,
          hasPrevious: requestedPage > 1,
        });
      }
      return json(route, paged(units));
    }
    if (url.pathname === '/api/settings/measurement-units' && method === 'POST') {
      state.unitCreate = request.postDataJSON() as Record<string, unknown>;
      units.push({ ...unit(3, String(state.unitCreate.code), String(state.unitCreate.name), String(state.unitCreate.symbol ?? '')), allowsFractional: Boolean(state.unitCreate.allowsFractional) });
      return json(route, { id: 3 }, 201);
    }
    if (url.pathname.startsWith('/api/settings/measurement-units/') && method === 'PUT') return route.fulfill({ status: 204 });
    if (url.pathname.startsWith('/api/settings/measurement-units/') && method === 'DELETE') return route.fulfill({ status: 204 });

    if (url.pathname === '/api/settings/ingredients' && method === 'GET') return json(route, { ...paged(ingredients), pageSize: 20 });
    if (url.pathname === '/api/settings/ingredients' && method === 'POST') {
      state.ingredientCreate = request.postDataJSON() as Record<string, unknown>;
      ingredients.push({
        id: 11,
        ...state.ingredientCreate,
        baseUnit: units[0],
        conversions: [],
        createdAt: '2026-08-17T00:00:00.000Z',
        updatedAt: '2026-08-17T00:00:00.000Z',
        productCount: 0,
        snapshotCount: 0,
        canDelete: true,
      });
      return json(route, { id: 11 }, 201);
    }
    if (/^\/api\/settings\/ingredients\/\d+$/.test(url.pathname) && method === 'GET') {
      const id = Number(url.pathname.split('/').at(-1));
      return json(route, ingredients.find((item) => item.id === id));
    }
    if (/^\/api\/settings\/ingredients\/\d+$/.test(url.pathname) && method === 'PUT') return route.fulfill({ status: 204 });
    if (/^\/api\/settings\/ingredients\/\d+$/.test(url.pathname) && method === 'DELETE') return route.fulfill({ status: 204 });

    if (url.pathname === '/api/reports/ingredient-demand') {
      state.reportQuery = url.searchParams;
      return json(route, {
        period: { from: url.searchParams.get('from'), to: url.searchParams.get('to'), timeZone: 'Asia/Ho_Chi_Minh', dateBasis: 'DeliveryAt' },
        generatedAt: '2026-08-17T03:00:00.000Z',
        statuses: [1, 2],
        summary: [{
          ingredientId: 10,
          ingredientCode: 'ROSE_RED',
          ingredientName: 'Hoa hồng đỏ',
          baseUnitCode: 'BONG',
          baseUnitName: 'Bông',
          baseUnitSymbol: 'bông',
          totalBaseQuantity: 125.5,
          breakdown: {
            totalBaseQuantity: 125.5,
            packs: [{ conversionId: 20, code: 'BO50', name: 'Bó 50 bông', unitName: 'Bó', unitSymbol: 'bó', factorToBase: 50, count: 2 }],
            baseRemainder: 25.5,
          },
        }],
        details: {
          items: [{
            orderId: '40000000-0000-0000-0000-000000000001',
            orderCode: 'DH-001',
            deliveryAt: '2026-08-17T08:00:00.000Z',
            status: 2,
            usesLegacyRecipeFallback: false,
            items: [{
              orderItemId: '41000000-0000-0000-0000-000000000001',
              productId: 1,
              productSku: 'ROSE',
              productName: 'Bó hồng đỏ',
              quantity: 2,
              source: 1,
              ingredients: [{
                ingredientId: 10,
                ingredientCode: 'ROSE_RED',
                ingredientName: 'Hoa hồng đỏ',
                baseUnitCode: 'BONG',
                baseUnitName: 'Bông',
                baseUnitSymbol: 'bông',
                perProductBaseQuantity: 50,
                productQuantity: 2,
                totalBaseQuantity: 100,
                note: null,
              }],
            }],
            totals: [{
              ingredientId: 10,
              ingredientCode: 'ROSE_RED',
              ingredientName: 'Hoa hồng đỏ',
              baseUnitCode: 'BONG',
              baseUnitName: 'Bông',
              baseUnitSymbol: 'bông',
              totalBaseQuantity: 100,
            }],
          }],
          totalCount: 1, page: 1, pageSize: 20, totalPages: 1, hasNext: false, hasPrevious: false,
        },
        hasLegacyRecipeFallback: false,
      });
    }
    return json(route, { message: `Unhandled ${method} ${url.pathname}` }, 404);
  });
};

test('creates a measurement unit with fractional policy and normalized API payload', async ({ page }) => {
  const state: MockState = {};
  await installMocks(page, state);
  await page.goto('/admin/ingredients/units');

  await page.getByRole('button', { name: 'Thêm đơn vị' }).click();
  const dialog = page.getByRole('dialog', { name: 'Thêm đơn vị tính' });
  await dialog.getByLabel(/Mã đơn vị/).fill('.CUON');
  await dialog.getByLabel(/Tên đơn vị/).fill('Cuộn');
  await dialog.getByRole('button', { name: 'Thêm đơn vị' }).click();
  await expect(dialog.getByRole('alert')).toContainText('phải bắt đầu bằng chữ hoặc số');

  await dialog.getByLabel(/Mã đơn vị/).fill('CUON');
  await dialog.getByLabel(/Ký hiệu/).fill('cuộn');
  await dialog.getByLabel('Cho phép số lượng thập phân').uncheck();
  await dialog.getByRole('button', { name: 'Thêm đơn vị' }).click();

  await expect(page.getByText('Đã thêm đơn vị Cuộn.')).toBeVisible();
  expect(state.unitCreate).toMatchObject({ code: 'CUON', name: 'Cuộn', symbol: 'cuộn', allowsFractional: false, isActive: true });
});

test('paginates the measurement-unit catalog without requesting more than the API limit', async ({ page }) => {
  const state: MockState = { paginateUnits: true, unitPageRequests: [] };
  await installMocks(page, state);
  await page.goto('/admin/ingredients/units');

  await expect(page.getByText('Đơn vị 20')).toBeVisible();
  await page.getByRole('button', { name: 'Sau' }).click();
  await expect(page.getByText('Đơn vị 21')).toBeVisible();
  await expect(page.getByText(/Trang 2\/2/)).toBeVisible();
  expect(Array.from(new Set(state.unitPageRequests))).toEqual([1, 2]);
});

test('highlights only the exact catalog setting section', async ({ page }) => {
  await installMocks(page, {});
  await page.goto('/admin/ingredients/units');

  await expect(page.getByRole('link', { name: /Đơn vị tính/ })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('link', { name: /Danh mục nguyên liệu/ })).not.toHaveAttribute('aria-current', 'page');
});

test('validates conversion factor then saves a unique product-ready ingredient', async ({ page }) => {
  const state: MockState = {};
  await installMocks(page, state);
  await page.goto('/admin/ingredients');

  await page.getByRole('button', { name: 'Thêm nguyên liệu' }).click();
  const dialog = page.getByRole('dialog', { name: 'Thêm nguyên liệu' });
  await dialog.getByLabel(/Mã nguyên liệu/).fill('BABY_BLUE');
  await dialog.getByLabel(/Tên nguyên liệu/).fill('Sao xanh');
  await dialog.getByRole('button', { name: 'Thêm quy cách' }).click();
  const conversion = dialog.getByRole('group', { name: 'Quy cách 1' });
  await conversion.getByLabel('Mã *').fill('BO20');
  await conversion.getByLabel('Tên *').fill('Bó 20 cành');
  await conversion.getByLabel('Đơn vị *').selectOption('2');
  await conversion.getByLabel(/Hệ số về đơn vị gốc/).fill('1');
  await dialog.getByRole('button', { name: 'Thêm nguyên liệu' }).click();
  await expect(dialog.getByRole('alert')).toContainText('lớn hơn 1');

  await conversion.getByLabel(/Hệ số về đơn vị gốc/).fill('20');
  await dialog.getByRole('button', { name: 'Thêm nguyên liệu' }).click();
  await expect(page.getByText('Đã thêm nguyên liệu Sao xanh.')).toBeVisible();
  expect(state.ingredientCreate).toMatchObject({
    code: 'BABY_BLUE', name: 'Sao xanh', baseUnitId: 1,
    conversions: [{ code: 'BO20', name: 'Bó 20 cành', unitId: 2, factorToBase: 20, sortOrder: 0, isActive: true }],
  });
});

test('shows exact demand totals from order-line snapshots', async ({ page }) => {
  const state: MockState = {};
  await installMocks(page, state);
  await page.goto('/admin/ingredients/demand');

  await expect(page.getByRole('heading', { name: 'Nguyên liệu cần chuẩn bị', level: 1 })).toBeVisible();
  await expect(page.getByText('125,5 bông')).toBeVisible();
  await expect(page.getByText('2 bó')).toBeVisible();
  await expect(page.getByText(/đang dùng công thức hiện tại/)).toHaveCount(0);
  await expect(page.getByLabel('Đã hủy')).toHaveCount(0);
  expect(state.reportQuery?.get('statuses')).toBe('1,2');

  await page.getByText('DH-001').click();
  await expect(page.getByRole('cell', { name: '100 bông' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Bản chụp theo dòng đơn' })).toBeVisible();
  const orderTotals = page.getByRole('region', { name: 'Tổng nguyên liệu đơn DH-001' });
  await expect(orderTotals.getByText('Tổng nguyên liệu của đơn')).toBeVisible();
  await expect(orderTotals.getByText('100 bông')).toBeVisible();
});
