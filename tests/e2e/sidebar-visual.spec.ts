import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test, type Page, type Route } from '@playwright/test';

const user = {
  id: '30000000-0000-0000-0000-000000000001',
  email: 'admin@lamie.vn',
  userName: 'admin_lamie',
  fullName: 'Nguyễn Minh Anh',
  role: 1,
  roleCode: 'admin',
  roleName: 'Quản trị viên',
  permissions: [
    'dashboard.view', 'orders.view', 'orders.manage', 'customers.view', 'tasks.view',
    'products.view', 'products.manage', 'inventory.view', 'reports.view', 'expenses.view',
    'content.view', 'catalog-settings.view', 'users.view', 'roles.view', 'navigation.view',
  ],
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

type MenuItem = {
  id: string;
  key: string;
  label: string;
  description: null;
  path: string | null;
  iconKey: string | null;
  permissionCode: string | null;
  sortOrder: number;
  openInNewTab: false;
  children: MenuItem[];
};

let itemSequence = 0;
const item = (
  key: string,
  label: string,
  pathValue: string | null,
  iconKey: string | null,
  permissionCode: string | null,
  sortOrder: number,
  children: MenuItem[] = [],
): MenuItem => ({
  id: `40000000-0000-4000-8000-${String(++itemSequence).padStart(12, '0')}`,
  key,
  label,
  description: null,
  path: pathValue,
  iconKey,
  permissionCode,
  sortOrder,
  openInNewTab: false,
  children,
});

const leaf = (key: string, label: string, pathValue: string, iconKey: string, permission: string, order: number) =>
  item(key, label, pathValue, iconKey, permission, order);

const oldMenu = [
  leaf('dashboard.home', 'Tổng quan', '/admin/dashboard', 'layout-dashboard', 'dashboard.view', 10),
  item('group.sales', 'BÁN HÀNG', null, 'folder', null, 20, [
    leaf('orders.list', 'Đơn hàng', '/admin/orders', 'shopping-bag', 'orders.view', 10),
    leaf('orders.calendar', 'Lịch giao', '/admin/orders/calendar', 'calendar-days', 'orders.view', 20),
    leaf('customers.list', 'Khách hàng', '/admin/customers', 'contact-round', 'customers.view', 30),
  ]),
  item('group.operations', 'VẬN HÀNH', null, 'folder', null, 30, [
    leaf('tasks.workspace', 'Việc cần làm', '/admin/tasks', 'list-checks', 'tasks.view', 10),
    leaf('ingredients.inventory', 'Kho hàng', '/admin/ingredients/inventory', 'package-open', 'inventory.view', 20),
  ]),
  item('group.finance', 'TÀI CHÍNH & BÁO CÁO', null, 'folder', null, 40, [
    leaf('expenses.list', 'Chi phí', '/admin/expenses', 'receipt-text', 'expenses.view', 10),
    leaf('reports.financial', 'Báo cáo', '/admin/reports', 'chart-no-axes-combined', 'reports.view', 20),
  ]),
  leaf('products.list', 'Sản phẩm', '/admin/products', 'flower-2', 'products.view', 50),
  leaf('content.create', 'Nội dung', '/admin/content', 'radio', 'content.view', 60),
  item('group.settings', 'CÀI ĐẶT', null, 'folder', null, 70, [
    leaf('catalog-settings.home', 'Cài đặt danh mục', '/admin/settings/catalog', 'settings', 'catalog-settings.view', 10),
  ]),
  item('group.system', 'HỆ THỐNG', null, 'folder', null, 80, [
    leaf('users.list', 'Người dùng', '/admin/users', 'users', 'users.view', 10),
    leaf('roles.list', 'Vai trò', '/admin/roles', 'shield-check', 'roles.view', 20),
    leaf('permissions.list', 'Quyền hạn', '/admin/permissions', 'key-round', 'roles.view', 30),
    leaf('navigation.manage', 'Menu & Điều hướng', '/admin/navigation', 'list-tree', 'navigation.view', 40),
  ]),
];

const newMenu = [
  leaf('dashboard.home', 'Tổng quan', '/admin/dashboard', 'layout-dashboard', 'dashboard.view', 10),
  item('group.sales', 'Bán hàng', null, null, null, 20, [
    leaf('orders.list', 'Đơn hàng', '/admin/orders', 'shopping-bag', 'orders.view', 10),
    leaf('customers.list', 'Khách hàng', '/admin/customers', 'contact-round', 'customers.view', 20),
  ]),
  item('group.operations', 'Vận hành', null, null, null, 30, [
    leaf('orders.calendar', 'Lịch giao', '/admin/orders/calendar', 'calendar-days', 'orders.view', 10),
    leaf('tasks.workspace', 'Việc cần làm', '/admin/tasks', 'list-checks', 'tasks.view', 20),
  ]),
  item('group.goods', 'Sản phẩm & kho', null, null, null, 40, [
    leaf('products.list', 'Sản phẩm', '/admin/products', 'flower-2', 'products.view', 10),
    leaf('ingredients.inventory', 'Kho hàng', '/admin/ingredients/inventory', 'package-open', 'inventory.view', 20),
  ]),
  item('group.finance', 'Tài chính', null, null, null, 50, [
    leaf('reports.financial', 'Báo cáo tài chính', '/admin/reports', 'chart-no-axes-combined', 'reports.view', 10),
    leaf('expenses.list', 'Chi phí', '/admin/expenses', 'receipt-text', 'expenses.view', 20),
  ]),
  leaf('content.create', 'Nội dung đa kênh', '/admin/content', 'radio', 'content.view', 60),
  item('group.settings', 'Quản trị', null, null, null, 70, [
    leaf('catalog-settings.home', 'Cấu hình cửa hàng', '/admin/settings/catalog', 'settings', 'catalog-settings.view', 10),
    leaf('users.list', 'Người dùng', '/admin/users', 'users', 'users.view', 20),
    leaf('roles.list', 'Vai trò', '/admin/roles', 'shield-check', 'roles.view', 30),
    leaf('permissions.list', 'Quyền hạn', '/admin/permissions', 'key-round', 'roles.view', 40),
    leaf('navigation.manage', 'Menu & điều hướng', '/admin/navigation', 'list-tree', 'navigation.view', 50),
  ]),
];

const routes = [
  { id: '50000000-0000-4000-8000-000000000001', key: 'dashboard.home', moduleKey: 'dashboard', pageKey: 'dashboard.home', path: '/admin/dashboard', permissionCode: 'dashboard.view', sortOrder: 10, activeMenuKey: 'dashboard.home' },
  { id: '50000000-0000-4000-8000-000000000002', key: 'orders.create', moduleKey: 'orders', pageKey: 'orders.create', path: '/admin/orders/new', permissionCode: 'orders.manage', sortOrder: 10, activeMenuKey: 'orders.list' },
];

const dashboard = {
  period: { key: '7d', label: '7 ngày gần đây', days: 7, currentStart: '2026-09-08', currentEnd: '2026-09-14', previousStart: '2026-09-01', previousEnd: '2026-09-07' },
  generatedAt: '2026-09-14T08:00:00+07:00',
  newOrdersCount: 8,
  activeOrders: { awaitingConfirmationCount: 3, preparingCount: 5, shippingCount: 2, needActionCount: 4, lateDeliveryCount: 1, upcomingDeliveryCount: 2, attentionOrders: [], deliveryRisks: [] },
  revenue: { currentRevenue: 18200000, previousRevenue: 16100000, currentProductRevenue: 17000000, currentShippingFee: 1200000, previousProductRevenue: 15000000, previousShippingFee: 1100000, includeShippingFeeInRevenue: true, paidOrderCount: 31, points: [] },
  inventory: { lowStockCount: 4, outOfStockCount: 1, products: [] },
  sourceErrors: [],
};

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const installApi = async (page: Page) => {
  await page.addInitScript(({ currentUser }) => {
    localStorage.setItem('lamie_access_token', 'e2e-access-token');
    localStorage.setItem('lamie_refresh_token', 'e2e-refresh-token');
    localStorage.setItem('lamie_user_json', JSON.stringify(currentUser));
  }, { currentUser: user });
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/auth/me') return json(route, user);
    if (url.pathname === '/api/admin/navigation/me') {
      return json(route, process.env.SIDEBAR_MENU_VERSION === 'before' ? oldMenu : newMenu);
    }
    if (url.pathname === '/api/admin/navigation/me/routes') return json(route, routes);
    if (url.pathname === '/api/dashboard') return json(route, dashboard);
    return json(route, { success: false, message: `Unhandled ${url.pathname}` }, 404);
  });
};

const screenshotDirectory = path.resolve(process.env.SIDEBAR_SCREENSHOT_DIR ?? 'artifacts/sidebar-after');
mkdirSync(screenshotDirectory, { recursive: true });

const expectDrawerSettled = async (page: Page) => {
  await expect.poll(async () => {
    const bounds = await page.locator('#admin-sidebar').locator('..').boundingBox();
    return bounds ? Math.round(bounds.x) : null;
  }).toBe(0);
};

test('capture sidebar states', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  await installApi(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/admin/dashboard');
  await expect(page.getByRole('heading', { name: 'Tổng quan', level: 1 })).toBeVisible();
  await expect(page.locator('#admin-sidebar')).toHaveCSS('width', '256px');
  await expect(page.getByRole('link', { name: 'Tạo đơn hàng' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tổng quan' })).toHaveAttribute('aria-current', 'page');
  await page.screenshot({ path: path.join(screenshotDirectory, 'desktop-expanded-1440x900.png'), fullPage: false });

  await page.getByRole('button', { name: 'Thu gọn menu điều hướng' }).click();
  await expect(page.locator('#admin-sidebar').locator('..')).toHaveCSS('width', '76px');
  await expect(page.locator('#admin-sidebar')).toHaveCSS('width', '76px');
  await page.getByRole('link', { name: 'Đơn hàng', exact: true }).focus();
  await expect(page.getByRole('tooltip')).toHaveText('Đơn hàng');
  await page.screenshot({ path: path.join(screenshotDirectory, 'desktop-collapsed-1440x900.png'), fullPage: false });

  await page.reload();
  await expect(page.locator('#admin-sidebar')).toHaveCSS('width', '76px');
  await page.getByRole('button', { name: 'Mở rộng menu điều hướng' }).click();

  await page.setViewportSize({ width: 1366, height: 768 });
  await expect(page.locator('#admin-sidebar')).toHaveCSS('width', '256px');
  await expect(page.getByRole('heading', { name: 'Tổng quan vận hành', level: 1 })).toBeVisible();
  await page.screenshot({ path: path.join(screenshotDirectory, 'desktop-expanded-1366x768.png'), fullPage: false });

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.getByRole('button', { name: 'Mở menu điều hướng' }).click();
  await expect(page.locator('#admin-sidebar')).toHaveCSS('width', '256px');
  await expectDrawerSettled(page);
  await page.screenshot({ path: path.join(screenshotDirectory, 'tablet-drawer-768x1024.png'), fullPage: false });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Mở menu điều hướng' })).toBeFocused();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Mở menu điều hướng' }).click();
  await expect(page.locator('#admin-sidebar')).toHaveCSS('width', '256px');
  await expectDrawerSettled(page);
  await expect(page.getByRole('button', { name: 'Đóng menu điều hướng' })).toBeFocused();
  const targetHeights = await page.locator('#admin-sidebar a:visible, #admin-sidebar button:visible')
    .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height));
  expect(Math.min(...targetHeights)).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: path.join(screenshotDirectory, 'mobile-drawer-390x844.png'), fullPage: false });
  expect(browserErrors).toEqual([]);
});

test('mobile drawer traps focus and closes after navigation', async ({ page }) => {
  await installApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/dashboard');
  const menuButton = page.getByRole('button', { name: 'Mở menu điều hướng' });
  await menuButton.click();
  await expectDrawerSettled(page);
  const closeButton = page.getByRole('button', { name: 'Đóng menu điều hướng' });
  await expect(closeButton).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#admin-sidebar')).toContainText('Nguyễn Minh Anh');
  expect(await page.locator('#admin-sidebar').evaluate((sidebar) => sidebar.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(menuButton).toBeFocused();

  await menuButton.click();
  await expectDrawerSettled(page);
  await page.getByRole('link', { name: 'Đơn hàng', exact: true }).click();
  await expect(page.locator('#admin-sidebar').locator('..')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#admin-main-content')).toBeFocused();
});

test('app shell remains usable at 125 and 200 percent zoom', async ({ page }) => {
  await installApi(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/admin/dashboard');
  for (const zoom of ['1.25', '2']) {
    await page.locator('html').evaluate((element, value) => { element.style.zoom = String(value); }, zoom);
    await expect(page.getByRole('button', { name: 'Thu gọn menu điều hướng' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Nguyễn Minh Anh/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  }
});

test('account popover keeps account details and logout keyboard-accessible', async ({ page }) => {
  await installApi(page);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/admin/dashboard');
  const accountButton = page.getByRole('button', { name: /Nguyễn Minh Anh/ });
  await accountButton.click();
  await expect(page.getByRole('dialog', { name: 'Tài khoản' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Đăng xuất' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(accountButton).toBeFocused();
});

test('sidebar text and primary action meet WCAG AA contrast', async ({ page }) => {
  await installApi(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/admin/dashboard');

  const targets = [
    page.getByRole('link', { name: 'Tổng quan', exact: true }),
    page.getByRole('button', { name: 'Bán hàng', exact: true }),
    page.getByRole('link', { name: 'Tạo đơn hàng', exact: true }),
  ];

  for (const target of targets) {
    const ratio = await target.evaluate((element) => {
      const parse = (value: string) => {
        const channels = value.match(/[\d.]+/g)?.map(Number) ?? [];
        return [channels[0] ?? 0, channels[1] ?? 0, channels[2] ?? 0, channels[3] ?? 1] as const;
      };
      const composite = (foreground: readonly number[], background: readonly number[]) => {
        const alpha = foreground[3] + background[3] * (1 - foreground[3]);
        return [
          (foreground[0] * foreground[3] + background[0] * background[3] * (1 - foreground[3])) / alpha,
          (foreground[1] * foreground[3] + background[1] * background[3] * (1 - foreground[3])) / alpha,
          (foreground[2] * foreground[3] + background[2] * background[3] * (1 - foreground[3])) / alpha,
          alpha,
        ] as const;
      };
      const luminance = (color: readonly number[]) => {
        const linear = color.slice(0, 3).map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
      };
      const style = window.getComputedStyle(element);
      const sidebar = document.getElementById('admin-sidebar');
      const base = parse(window.getComputedStyle(sidebar!).backgroundColor);
      const ownBackground = parse(style.backgroundColor);
      const background = ownBackground[3] < 1 ? composite(ownBackground, base) : ownBackground;
      const foregroundLuminance = luminance(parse(style.color));
      const backgroundLuminance = luminance(background);
      return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
        / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
    });

    expect(ratio).toBeGreaterThanOrEqual(4.5);
  }
});
