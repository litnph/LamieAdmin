import { expect, test, type Page, type Route } from '@playwright/test';

const user = {
  id: '30000000-0000-0000-0000-000000000092',
  email: 'content@lamie.test',
  userName: 'content_admin',
  fullName: 'Content Admin',
  role: 1,
  roleCode: 'admin',
  permissions: ['content.view', 'content.manage'],
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const routes = [
  { id: 'route-content', key: 'content.create', moduleKey: 'content', pageKey: 'content.create', path: '/admin/content', permissionCode: 'content.manage', sortOrder: 1 },
  { id: 'route-content-footer', key: 'content.footer', moduleKey: 'content', pageKey: 'content.footer', path: '/admin/content/footer', permissionCode: 'content.manage', sortOrder: 2 },
  { id: 'route-content-history', key: 'content.history', moduleKey: 'content', pageKey: 'content.history', path: '/admin/content/history', permissionCode: 'content.view', sortOrder: 3 },
];

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const item = (platform: 1 | 2 | 3, body: string) => ({
  id: `50000000-0000-0000-0000-00000000000${platform}`,
  platform,
  body,
  footerSnapshot: 'Lamie · Hoa tươi mỗi ngày',
  hashtagsSnapshot: '#Lamie #HoaTuoi',
  fullContent: `${body}\n\nLamie · Hoa tươi mỗi ngày\n\n#Lamie #HoaTuoi`,
});

const generation = (overrides: Record<string, unknown> = {}) => ({
  id: '60000000-0000-0000-0000-000000000001',
  sourceType: 1,
  productId: 7,
  productNameSnapshot: 'Bó hồng Lamie',
  productImageUrlSnapshot: '/uploads/rose.jpg',
  brief: 'Chủ đề/dịp tặng: Kỷ niệm',
  styleId: 'warm-story',
  styleName: 'Kể chuyện ấm áp',
  styleSeed: 415,
  status: 1,
  provider: 'OpenAI',
  model: 'gpt-5-mini',
  promptVersion: 'content-v1',
  parentGenerationId: null,
  createdAt: '2026-08-17T02:00:00.000Z',
  updatedAt: '2026-08-17T02:00:00.000Z',
  savedAt: null,
  items: [item(1, 'Facebook kể chuyện về một bó hoa.'), item(2, 'Instagram dịu dàng và giàu hình ảnh.'), item(3, 'TikTok mở đầu bằng một hook ngắn.')],
  assets: [],
  ...overrides,
});

type MockState = {
  generateMultipart?: string;
  idempotencyKeys: string[];
  generateFailuresRemaining?: number;
  generationSaves: Array<Record<string, unknown>>;
  generationSavePaths: string[];
  footerSave?: Record<string, unknown>;
};

const installMocks = async (page: Page, state: MockState) => {
  const footers = [
    { id: '70000000-0000-0000-0000-000000000001', platform: 1, content: 'Lamie Facebook', hashtags: '#Lamie', isActive: true, updatedAt: '2026-08-10T00:00:00.000Z' },
    { id: '70000000-0000-0000-0000-000000000002', platform: 2, content: 'Lamie Instagram', hashtags: '#LamieGram', isActive: true, updatedAt: '2026-08-10T00:00:00.000Z' },
    { id: '70000000-0000-0000-0000-000000000003', platform: 3, content: 'Lamie TikTok', hashtags: '#LamieTok', isActive: false, updatedAt: '2026-08-10T00:00:00.000Z' },
  ];

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
    if (url.pathname === '/api/admin/navigation/me/routes') return json(route, routes);
    if (url.pathname === '/api/admin/navigation/me') return json(route, []);
    if (url.pathname === '/api/content/configuration') return json(route, { isAiConfigured: true, model: 'gpt-5-mini', styles: [{ id: 'warm-story', name: 'Kể chuyện ấm áp' }] });
    if (url.pathname === '/api/settings/products') return json(route, [{
      id: 7, sku: 'ROSE', price: 750000, salePrice: null, isActive: true, thumbnailUrl: '/uploads/rose.jpg',
      translations: [{ languageCode: 'vi', name: 'Bó hồng Lamie' }],
    }]);

    if (url.pathname === '/api/content/generate' && method === 'POST') {
      state.generateMultipart = request.postData() ?? '';
      state.idempotencyKeys.push(request.headers()['idempotency-key']);
      if ((state.generateFailuresRemaining ?? 0) > 0) {
        state.generateFailuresRemaining = (state.generateFailuresRemaining ?? 0) - 1;
        return json(route, { message: 'Provider response is unknown; retry safely.' }, 503);
      }
      return json(route, generation());
    }
    if (/^\/api\/content\/generations\/[0-9a-f-]+\/save$/.test(url.pathname) && method === 'PUT') {
      const payload = request.postDataJSON() as Record<string, unknown>;
      state.generationSaves.push(payload);
      state.generationSavePaths.push(url.pathname);
      const isVersion = state.generationSaves.length > 1;
      const bodyItems = (payload.items as Array<{ platform: 1 | 2 | 3; body: string }>).map((entry) => item(entry.platform, entry.body));
      return json(route, generation({
        id: isVersion ? '60000000-0000-0000-0000-000000000002' : '60000000-0000-0000-0000-000000000001',
        status: 2,
        parentGenerationId: isVersion ? '60000000-0000-0000-0000-000000000001' : null,
        savedAt: '2026-08-17T03:00:00.000Z',
        items: bodyItems,
      }));
    }
    if (url.pathname === '/api/content/footers' && method === 'GET') return json(route, footers);
    if (/^\/api\/content\/footers\/[123]$/.test(url.pathname) && method === 'PUT') {
      state.footerSave = request.postDataJSON() as Record<string, unknown>;
      const platform = Number(url.pathname.split('/').at(-1));
      return json(route, { id: `footer-${platform}`, platform, ...(state.footerSave as object), updatedAt: '2026-08-17T03:00:00.000Z' });
    }
    if (url.pathname === '/api/content/history') return json(route, {
      items: [{
        id: '60000000-0000-0000-0000-000000000001', sourceType: 1, productId: 7,
        productNameSnapshot: 'Bó hồng Lamie', styleName: 'Kể chuyện ấm áp', status: 2,
        platforms: [1, 2, 3], createdAt: '2026-08-17T02:00:00.000Z', savedAt: '2026-08-17T03:00:00.000Z', parentGenerationId: null,
      }],
      totalCount: 1, page: 1, pageSize: 20, totalPages: 1, hasNext: false, hasPrevious: false,
    });
    if (url.pathname === '/api/content/generations/60000000-0000-0000-0000-000000000001' && method === 'GET') {
      return json(route, generation({ status: 2, savedAt: '2026-08-17T03:00:00.000Z' }));
    }
    return json(route, { message: `Unhandled ${method} ${url.pathname}` }, 404);
  });
};

test('generates three platform drafts, permits edits, then explicitly saves numeric platform items', async ({ page }) => {
  const state: MockState = { idempotencyKeys: [], generationSaves: [], generationSavePaths: [] };
  await installMocks(page, state);
  await page.goto('/admin/content');

  await expect(page.getByText(/Mỗi lần tạo luôn trả một nội dung riêng/)).toBeVisible();
  await page.getByLabel('Chủ đề / dịp tặng').fill('Kỷ niệm ngày cưới');
  await page.getByLabel('Ghi chú dữ kiện').fill('Tặng vợ, không có khuyến mãi');
  await page.getByRole('button', { name: 'Tạo content' }).click();

  await expect(page.getByLabel('Nội dung Facebook')).toBeVisible();
  await expect(page.getByLabel('Nội dung Instagram')).toBeVisible();
  await expect(page.getByLabel('Nội dung TikTok')).toBeVisible();
  expect(state.generateMultipart).toContain('productId');
  expect(state.generateMultipart).toContain('Kỷ niệm ngày cưới');
  expect(state.idempotencyKeys[0]).toBeTruthy();

  await page.getByLabel('Nội dung Facebook').fill('Facebook đã chỉnh sửa thủ công.');
  await page.getByRole('button', { name: 'Lưu vào lịch sử' }).click();
  await expect(page.getByText(/Đã lưu 3 nội dung nền tảng/)).toBeVisible();
  expect(state.generationSaves[0]).toEqual({ items: [
    { platform: 1, body: 'Facebook đã chỉnh sửa thủ công.' },
    { platform: 2, body: 'Instagram dịu dàng và giàu hình ảnh.' },
    { platform: 3, body: 'TikTok mở đầu bằng một hook ngắn.' },
  ] });

  await page.getByLabel('Nội dung Facebook').fill('Facebook phiên bản thứ hai.');
  await page.getByRole('button', { name: 'Lưu vào lịch sử' }).click();
  await expect.poll(() => state.generationSaves.length).toBe(2);
  await page.getByLabel('Nội dung Facebook').fill('Facebook phiên bản thứ ba.');
  await page.getByRole('button', { name: 'Lưu vào lịch sử' }).click();
  await expect.poll(() => state.generationSaves.length).toBe(3);

  expect(state.generationSavePaths).toEqual([
    '/api/content/generations/60000000-0000-0000-0000-000000000001/save',
    '/api/content/generations/60000000-0000-0000-0000-000000000001/save',
    '/api/content/generations/60000000-0000-0000-0000-000000000002/save',
  ]);
});

test('reuses an idempotency key only for an unchanged failed generation attempt', async ({ page }) => {
  const state: MockState = {
    idempotencyKeys: [],
    generateFailuresRemaining: 1,
    generationSaves: [],
    generationSavePaths: [],
  };
  await installMocks(page, state);
  await page.goto('/admin/content');

  const topic = page.getByLabel('Chủ đề / dịp tặng');
  await topic.fill('Brief đầu tiên');
  await page.getByRole('button', { name: 'Tạo content' }).click();
  await expect.poll(() => state.idempotencyKeys.length).toBe(1);
  await expect(page.getByRole('button', { name: 'Tạo content' })).toBeEnabled();

  await topic.fill('Brief đã thay đổi');
  await page.getByRole('button', { name: 'Tạo content' }).click();
  await expect(page.getByLabel('Nội dung Facebook')).toBeVisible();
  expect(state.idempotencyKeys[1]).not.toBe(state.idempotencyKeys[0]);

  state.generateFailuresRemaining = 1;
  await page.getByRole('button', { name: 'Tạo lại toàn bộ' }).click();
  await expect.poll(() => state.idempotencyKeys.length).toBe(3);
  await expect(page.getByRole('button', { name: 'Tạo lại toàn bộ' })).toBeEnabled();

  await page.getByRole('button', { name: 'Tạo lại toàn bộ' }).click();
  await expect.poll(() => state.idempotencyKeys.length).toBe(4);
  expect(state.idempotencyKeys[3]).toBe(state.idempotencyKeys[2]);

  await page.getByRole('button', { name: 'Tạo lại toàn bộ' }).click();
  await expect.poll(() => state.idempotencyKeys.length).toBe(5);
  expect(state.idempotencyKeys[4]).not.toBe(state.idempotencyKeys[3]);
});

test('saves one footer through the platform-specific numeric endpoint', async ({ page }) => {
  const state: MockState = { idempotencyKeys: [], generationSaves: [], generationSavePaths: [] };
  await installMocks(page, state);
  await page.goto('/admin/content/footer');

  const facebook = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Facebook' }) });
  await facebook.getByLabel('Thông tin cửa hàng / CTA').fill('Lamie · Gọi để được tư vấn');
  await facebook.getByLabel('Hashtag mặc định').fill('Lamie HoaTuoi');
  await facebook.getByRole('button', { name: 'Lưu Facebook' }).click();

  await expect(page.getByText('Đã lưu footer Facebook.')).toBeVisible();
  expect(state.footerSave).toEqual({ content: 'Lamie · Gọi để được tư vấn', hashtags: '#Lamie #HoaTuoi', isActive: true });
});

test('opens immutable history and saves edits as a new version', async ({ page }) => {
  const state: MockState = { idempotencyKeys: [], generationSaves: [{ items: [] }], generationSavePaths: [] };
  await installMocks(page, state);
  await page.goto('/admin/content/history');

  await page.getByRole('button', { name: /Xem content Bó hồng Lamie/ }).click();
  const dialog = page.getByRole('dialog', { name: /Bó hồng Lamie/ });
  await expect(dialog.getByText(/Bản đã lưu là bất biến/)).toBeVisible();
  await dialog.getByLabel('Body dùng cho phiên bản mới').first().fill('Facebook phiên bản thứ hai.');
  await dialog.getByRole('button', { name: 'Lưu thành phiên bản mới' }).click();

  await expect(page.getByText(/Đã lưu phiên bản mới/)).toBeVisible();
  const versionPayload = state.generationSaves.at(-1) as { items: Array<{ platform: number; body: string }> };
  expect(versionPayload.items[0]).toEqual({ platform: 1, body: 'Facebook phiên bản thứ hai.' });
});
