import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
});

test('literal manifest discovery builds source-owned module, page, permission and navigation registries', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const registryUrl = '/src/app/modules/registry.ts';
    const registry = await import(/* @vite-ignore */ registryUrl);
    return {
      modules: registry.getAllModuleDefinitions().map((item: { moduleKey: string }) => item.moduleKey),
      pages: registry.getAllPageDefinitions().map((item: { pageKey: string }) => item.pageKey),
      permissions: registry.getAllPermissionMetadata().map((item: { code: string }) => item.code),
      navigation: registry.getDefaultNavigationSeeds().map((item: { key: string }) => item.key),
      diagnostics: registry.getRegistryDiagnostics(),
    };
  });

  expect(result.modules).toContain('dashboard');
  expect(result.pages).toContain('dashboard.home');
  expect(result.permissions).toContain('dashboard.view');
  expect(result.navigation).toContain('dashboard.home');
  expect(result.diagnostics).toEqual([]);
});

test('all existing business pages and routes are covered by feature-owned manifests', async ({ page }) => {
  const inventory = await page.evaluate(async () => {
    const registryUrl = '/src/app/modules/registry.ts';
    const registry = await import(/* @vite-ignore */ registryUrl);
    const pages = registry.getAllPageDefinitions();
    const loadedPages = await Promise.all(pages.map(async (definition: {
      pageKey: string;
      defaultPath: string;
      lazyComponent: () => Promise<{ default: unknown }>;
    }) => ({
      pageKey: definition.pageKey,
      defaultPath: definition.defaultPath,
      componentType: typeof (await definition.lazyComponent()).default,
    })));
    const navigation = registry.getDefaultNavigationSeeds();
    return {
      modules: registry.getAllModuleDefinitions().map((item: { moduleKey: string }) => item.moduleKey),
      permissions: registry.getAllPermissionMetadata().map((item: { code: string }) => item.code),
      pages: loadedPages,
      navigation: navigation.map((item: {
        key: string;
        defaultPath?: string;
        isVisible: boolean;
      }) => ({ key: item.key, defaultPath: item.defaultPath, isVisible: item.isVisible })),
      diagnostics: registry.getRegistryDiagnostics(),
    };
  });

  expect(inventory.modules).toEqual([
    'access-control',
    'customers',
    'dashboard',
    'expenses',
    'orders',
    'products',
    'reports',
    'roles',
    'settings-attributes',
    'settings-channels',
    'users',
  ]);
  expect(inventory.permissions).toHaveLength(21);
  expect(inventory.pages).toHaveLength(22);
  expect(inventory.pages.every((item) => item.componentType === 'function')).toBe(true);
  expect(inventory.pages.map((item) => item.defaultPath).sort()).toEqual([
    '/admin/customers',
    '/admin/customers/:id',
    '/admin/dashboard',
    '/admin/expenses',
    '/admin/orders',
    '/admin/orders/:id',
    '/admin/orders/:id/edit',
    '/admin/orders/calendar',
    '/admin/orders/new',
    '/admin/navigation',
    '/admin/permissions',
    '/admin/products',
    '/admin/products/:id/edit',
    '/admin/products/create',
    '/admin/reports',
    '/admin/roles',
    '/admin/settings/attributes/:attributeKey',
    '/admin/settings/channels',
    '/admin/settings/expense-categories',
    '/admin/users',
    '/admin/users/:id/edit',
    '/admin/users/new',
  ].sort());
  expect(inventory.navigation).toHaveLength(25);
  expect(inventory.navigation.filter((item) => item.isVisible && item.defaultPath)
    .map((item) => item.defaultPath).sort()).toEqual([
    '/admin/customers',
    '/admin/dashboard',
    '/admin/expenses',
    '/admin/orders',
    '/admin/orders/calendar',
    '/admin/navigation',
    '/admin/permissions',
    '/admin/products',
    '/admin/reports',
    '/admin/roles',
    '/admin/settings/attributes/categories',
    '/admin/settings/channels',
    '/admin/users',
  ].sort());
  expect(inventory.navigation.filter((item) => !item.isVisible)).toHaveLength(10);
  expect(inventory.diagnostics).toEqual([]);
});

test('development registry rejects duplicate keys and conflicting permission metadata deterministically', async ({ page }) => {
  const errors = await page.evaluate(async () => {
    const registryUrl = '/src/app/modules/registry.ts';
    const { buildAdminRegistries } = await import(/* @vite-ignore */ registryUrl);
    const pageComponent = async () => ({ default: () => null });
    const module = (
      moduleKey: string,
      pageKey: string,
      permissionName = 'View sample',
      navigationKey = `${moduleKey}.home`,
    ) => ({
      moduleKey,
      displayName: moduleKey,
      version: '1.0.0',
      permissions: [{ code: 'sample.view', name: permissionName, group: 'Sample' }],
      pages: [{ pageKey, defaultPath: `/admin/${moduleKey}`, lazyComponent: pageComponent }],
      defaultNavigation: [{
        key: navigationKey,
        label: moduleKey,
        sortOrder: 10,
        isVisible: true,
        isEnabled: true,
        isSystem: true,
      }],
    });
    const capture = (entries: unknown[]) => {
      try {
        buildAdminRegistries(entries, 'development', () => undefined);
        return 'missing_error';
      } catch (error) {
        return (error as { code?: string }).code ?? 'unknown_error';
      }
    };

    return {
      module: capture([
        { source: '/a/manifest.ts', manifest: module('alpha', 'alpha.home') },
        { source: '/b/manifest.ts', manifest: module('alpha', 'alpha.other') },
      ]),
      page: capture([
        { source: '/a/manifest.ts', manifest: module('alpha', 'shared.home') },
        { source: '/b/manifest.ts', manifest: module('beta', 'shared.home') },
      ]),
      permission: capture([
        { source: '/a/manifest.ts', manifest: module('alpha', 'alpha.home', 'First name') },
        { source: '/b/manifest.ts', manifest: module('beta', 'beta.home', 'Conflicting name') },
      ]),
      navigation: capture([
        { source: '/a/manifest.ts', manifest: module('alpha', 'alpha.home', 'View sample', 'shared.navigation') },
        { source: '/b/manifest.ts', manifest: module('beta', 'beta.home', 'View sample', 'shared.navigation') },
      ]),
    };
  });

  expect(errors).toEqual({
    module: 'duplicate_module_key',
    page: 'duplicate_page_key',
    permission: 'conflicting_permission_metadata',
    navigation: 'duplicate_navigation_key',
  });
});

test('production registry skips a conflict once and icon lookup always uses the source registry', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const registryUrl = '/src/app/modules/registry.ts';
    const iconRegistryUrl = '/src/app/modules/iconRegistry.ts';
    const { buildAdminRegistries } = await import(/* @vite-ignore */ registryUrl);
    const iconRegistry = await import(/* @vite-ignore */ iconRegistryUrl);
    const manifest = {
      moduleKey: 'sample',
      displayName: 'Sample',
      version: '1.0.0',
      permissions: [],
      pages: [],
    };
    const warnings: string[] = [];
    const snapshot = buildAdminRegistries(
      [
        { source: '/a/manifest.ts', manifest },
        { source: '/b/manifest.ts', manifest },
      ],
      'production',
      (message: string) => warnings.push(message),
    );
    return {
      moduleCount: snapshot.modules.size,
      diagnostics: snapshot.diagnostics,
      warnings,
      knownIcon: iconRegistry.hasIconDefinition('layout-dashboard'),
      unknownIcon: iconRegistry.hasIconDefinition('component-from-database'),
      stableFallback: iconRegistry.getIconDefinition('component-from-database')
        === iconRegistry.getIconDefinition(),
    };
  });

  expect(result.moduleCount).toBe(1);
  expect(result.diagnostics).toHaveLength(1);
  expect(result.diagnostics[0].code).toBe('duplicate_module_key');
  expect(result.warnings).toHaveLength(1);
  expect(result.knownIcon).toBe(true);
  expect(result.unknownIcon).toBe(false);
  expect(result.stableFallback).toBe(true);
});
