import { expect, test, type Page, type Route } from '@playwright/test';

const adminUser = {
  id: '30000000-0000-4000-8000-000000000001',
  email: 'admin@lamie.test',
  userName: 'admin',
  fullName: 'Lamie Admin',
  phone: null,
  role: 1,
  roleId: '20000000-0000-4000-8000-000000000001',
  roleName: 'Quản trị viên',
  roleCode: 'admin',
  isActive: true,
  lastLoginAt: null,
  createdAt: '2026-08-04T00:00:00.000Z',
  permissions: ['dashboard.view', 'roles.view', 'navigation.view'],
};

const tokens = (accessToken: string, refreshToken: string) => ({
  accessToken,
  refreshToken,
  accessTokenExpiresAt: '2026-08-04T01:00:00.000Z',
  refreshTokenExpiresAt: '2026-09-03T00:00:00.000Z',
});

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const fulfillNavigation = (route: Route, pathname: string) => {
  if (pathname === '/api/admin/navigation/me' || pathname === '/api/admin/navigation/me/routes') {
    return json(route, []);
  }
  return null;
};

const storeSession = async (page: Page, accessToken: string, refreshToken: string) => {
  await page.addInitScript(({ access, refresh }) => {
    localStorage.setItem('lamie_access_token', access);
    localStorage.setItem('lamie_refresh_token', refresh);
  }, { access: accessToken, refresh: refreshToken });
};

test('login preserves the requested protected URL and stores the returned session', async ({ page }) => {
  let loginPayload: unknown = null;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (pathname === '/api/auth/login') {
      loginPayload = request.postDataJSON();
      return json(route, { user: adminUser, tokens: tokens('login-access', 'login-refresh') });
    }
    if (pathname === '/api/auth/me') return json(route, adminUser);
    if (fulfillNavigation(route, pathname)) return;
    return json(route, { message: `Unhandled ${request.method()} ${pathname}` }, 404);
  });

  await page.goto('/admin/unauthorized');
  await expect(page).toHaveURL(/\/login$/);
  await page.locator('#admin-login').fill('admin');
  await page.locator('#admin-password').fill('StrongPass1');
  await page.locator('form button[type="submit"]').click();

  await expect(page).toHaveURL(/\/admin\/unauthorized$/);
  expect(loginPayload).toEqual({ login: 'admin', password: 'StrongPass1' });
  expect(await page.evaluate(() => localStorage.getItem('lamie_access_token'))).toBe('login-access');
  expect(await page.evaluate(() => localStorage.getItem('lamie_refresh_token'))).toBe('login-refresh');
});

test('expired access is refreshed once, rotated, and retried with the new bearer token', async ({ page }) => {
  let refreshCalls = 0;
  const meAuthorizationHeaders: string[] = [];
  await storeSession(page, 'expired-access', 'valid-refresh');
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (pathname === '/api/auth/me') {
      const authorization = request.headers().authorization ?? '';
      meAuthorizationHeaders.push(authorization);
      return authorization === 'Bearer refreshed-access'
        ? json(route, adminUser)
        : json(route, { message: 'Expired access token' }, 401);
    }
    if (pathname === '/api/auth/refresh') {
      refreshCalls += 1;
      expect(request.postDataJSON()).toEqual({ refreshToken: 'valid-refresh' });
      return json(route, { user: adminUser, tokens: tokens('refreshed-access', 'rotated-refresh') });
    }
    if (fulfillNavigation(route, pathname)) return;
    return json(route, { message: `Unhandled ${request.method()} ${pathname}` }, 404);
  });

  await page.goto('/admin/unauthorized');
  await expect(page).toHaveURL(/\/admin\/unauthorized$/);
  await expect.poll(() => refreshCalls).toBe(1);
  await expect.poll(() => meAuthorizationHeaders.includes('Bearer refreshed-access')).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('lamie_access_token'))).toBe('refreshed-access');
  expect(await page.evaluate(() => localStorage.getItem('lamie_refresh_token'))).toBe('rotated-refresh');
});

test('failed refresh clears the complete session and returns to login', async ({ page }) => {
  await storeSession(page, 'expired-access', 'revoked-refresh');
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === '/api/auth/me') return json(route, { message: 'Expired access token' }, 401);
    if (pathname === '/api/auth/refresh') return json(route, { message: 'Invalid refresh token' }, 401);
    if (fulfillNavigation(route, pathname)) return;
    return json(route, { message: `Unhandled ${route.request().method()} ${pathname}` }, 404);
  });

  await page.goto('/admin/unauthorized');
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem('lamie_access_token'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('lamie_refresh_token'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('lamie_user_json'))).toBeNull();
});
