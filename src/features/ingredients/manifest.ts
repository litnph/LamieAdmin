import { defineAdminModuleManifest, lazyNamedComponent } from '@/app/modules/manifest';

export const manifest = defineAdminModuleManifest({
  moduleKey: 'ingredients',
  displayName: 'Chuẩn bị & Kho tồn',
  version: '1.0.0',
  permissions: [
    { code: 'ingredients.view', name: 'Xem nguyên liệu', group: 'Nguyên liệu' },
    { code: 'ingredients.manage', name: 'Quản lý nguyên liệu', group: 'Nguyên liệu' },
    { code: 'ingredient-reports.view', name: 'Xem nhu cầu nguyên liệu', group: 'Báo cáo' },
    { code: 'inventory.view', name: 'Xem kho tồn', group: 'Kho tồn' },
    { code: 'inventory.manage', name: 'Quản lý kho tồn', group: 'Kho tồn' },
    { code: 'tasks.view', name: 'Xem Việc cần làm', group: 'Vận hành' },
  ],
  pages: [
    {
      pageKey: 'ingredients.list',
      defaultPath: '/admin/ingredients',
      requiredPermission: 'ingredients.view',
      lazyComponent: lazyNamedComponent(() => import('./pages/IngredientsPage'), 'IngredientsPage'),
    },
    {
      pageKey: 'ingredients.units',
      defaultPath: '/admin/ingredients/units',
      requiredPermission: 'ingredients.view',
      lazyComponent: lazyNamedComponent(() => import('./pages/MeasurementUnitsPage'), 'MeasurementUnitsPage'),
    },
    {
      pageKey: 'ingredients.inventory',
      defaultPath: '/admin/ingredients/inventory',
      requiredPermission: 'inventory.view',
      lazyComponent: lazyNamedComponent(() => import('./pages/InventoryPage'), 'InventoryPage'),
    },
    {
      pageKey: 'ingredients.demand',
      defaultPath: '/admin/ingredients/demand',
      requiredPermission: 'ingredient-reports.view',
      lazyComponent: lazyNamedComponent(() => import('./pages/IngredientDemandReportPage'), 'IngredientDemandReportPage'),
    },
    {
      pageKey: 'ingredients.tasks',
      defaultPath: '/admin/tasks',
      requiredPermission: 'tasks.view',
      lazyComponent: lazyNamedComponent(() => import('./pages/TasksPage'), 'TasksPage'),
    },
    {
      pageKey: 'ingredients.inventory-receiving',
      defaultPath: '/admin/inventory/receiving',
      requiredPermission: 'inventory.manage',
      lazyComponent: lazyNamedComponent(() => import('./pages/InventoryPage'), 'InventoryReceivingPage'),
    },
    {
      pageKey: 'ingredients.inventory-transactions',
      defaultPath: '/admin/inventory/transactions',
      requiredPermission: 'inventory.view',
      lazyComponent: lazyNamedComponent(() => import('./pages/InventoryPage'), 'InventoryTransactionsPage'),
    },
    {
      pageKey: 'ingredients.inventory-catalog',
      defaultPath: '/admin/settings/catalog/inventory',
      requiredPermission: 'inventory.view',
      lazyComponent: lazyNamedComponent(() => import('./pages/InventoryPage'), 'InventoryCatalogPage'),
    },
  ],
  defaultNavigation: [
    {
      key: 'group.operations', label: 'Vận hành', sortOrder: 30,
      isVisible: true, isEnabled: true, isSystem: true,
    },
    {
      key: 'tasks.workspace', parentKey: 'group.operations', moduleKey: 'ingredients', pageKey: 'ingredients.tasks',
      label: 'Việc cần làm', defaultPath: '/admin/tasks', iconKey: 'list-checks', permissionCode: 'tasks.view',
      sortOrder: 20, isVisible: true, isEnabled: true, isSystem: true,
    },
    {
      key: 'ingredients.list', parentKey: 'catalog-settings.home', moduleKey: 'ingredients', pageKey: 'ingredients.list',
      label: 'Danh mục nguyên liệu', defaultPath: '/admin/ingredients', iconKey: 'flower-2', permissionCode: 'ingredients.view',
      sortOrder: 100, isVisible: false, isEnabled: true, isSystem: true,
    },
    {
      key: 'ingredients.units', parentKey: 'ingredients.list', moduleKey: 'ingredients', pageKey: 'ingredients.units',
      label: 'Đơn vị tính', defaultPath: '/admin/ingredients/units', iconKey: 'settings', permissionCode: 'ingredients.view',
      sortOrder: 30, isVisible: false, isEnabled: true, isSystem: true,
    },
    {
      key: 'ingredients.inventory', parentKey: 'group.goods', moduleKey: 'ingredients', pageKey: 'ingredients.inventory',
      label: 'Kho hàng', defaultPath: '/admin/ingredients/inventory', iconKey: 'package-open', permissionCode: 'inventory.view',
      sortOrder: 20, isVisible: true, isEnabled: true, isSystem: true,
    },
    {
      key: 'ingredients.demand', parentKey: 'tasks.workspace', moduleKey: 'ingredients', pageKey: 'ingredients.demand',
      label: 'Nguyên liệu cần chuẩn bị', defaultPath: '/admin/ingredients/demand', iconKey: 'chart-no-axes-combined', permissionCode: 'ingredient-reports.view',
      sortOrder: 10, isVisible: false, isEnabled: true, isSystem: true,
    },
    {
      key: 'ingredients.inventory-receiving', parentKey: 'ingredients.inventory', moduleKey: 'ingredients', pageKey: 'ingredients.inventory-receiving',
      label: 'Nhập kho', defaultPath: '/admin/inventory/receiving', iconKey: 'package-plus', permissionCode: 'inventory.manage',
      sortOrder: 20, isVisible: false, isEnabled: true, isSystem: true,
    },
    {
      key: 'ingredients.inventory-transactions', parentKey: 'ingredients.inventory', moduleKey: 'ingredients', pageKey: 'ingredients.inventory-transactions',
      label: 'Lịch sử giao dịch', defaultPath: '/admin/inventory/transactions', iconKey: 'history', permissionCode: 'inventory.view',
      sortOrder: 30, isVisible: false, isEnabled: true, isSystem: true,
    },
    {
      key: 'ingredients.inventory-catalog', parentKey: 'catalog-settings.home', moduleKey: 'ingredients', pageKey: 'ingredients.inventory-catalog',
      label: 'Danh mục hàng tồn kho', defaultPath: '/admin/settings/catalog/inventory', iconKey: 'boxes', permissionCode: 'inventory.view',
      sortOrder: 110, isVisible: false, isEnabled: true, isSystem: true,
    },
  ],
});
