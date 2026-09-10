import { defineAdminModuleManifest, lazyNamedComponent } from '@/app/modules/manifest';

export const manifest = defineAdminModuleManifest({
  moduleKey: 'content',
  displayName: 'Content đa nền tảng',
  version: '1.0.0',
  permissions: [
    { code: 'content.view', name: 'Xem content', group: 'Content' },
    { code: 'content.manage', name: 'Tạo và quản lý content', group: 'Content' },
  ],
  pages: [
    {
      pageKey: 'content.create', defaultPath: '/admin/content', requiredPermission: 'content.view',
      lazyComponent: lazyNamedComponent(() => import('./pages/ContentCreatePage'), 'ContentCreatePage'),
    },
    {
      pageKey: 'content.footer', defaultPath: '/admin/content/footer', requiredPermission: 'content.manage',
      lazyComponent: lazyNamedComponent(() => import('./pages/ContentFooterSettingsPage'), 'ContentFooterSettingsPage'),
    },
    {
      pageKey: 'content.history', defaultPath: '/admin/content/history', requiredPermission: 'content.view',
      lazyComponent: lazyNamedComponent(() => import('./pages/ContentHistoryPage'), 'ContentHistoryPage'),
    },
  ],
  defaultNavigation: [
    {
      key: 'content.create', moduleKey: 'content', pageKey: 'content.create',
      label: 'Nội dung', defaultPath: '/admin/content', iconKey: 'radio', permissionCode: 'content.view',
      sortOrder: 60, isVisible: true, isEnabled: true, isSystem: true,
    },
    {
      key: 'content.footer', parentKey: 'content.create', moduleKey: 'content', pageKey: 'content.footer',
      label: 'Cấu hình footer', defaultPath: '/admin/content/footer', iconKey: 'settings', permissionCode: 'content.manage',
      sortOrder: 10, isVisible: false, isEnabled: true, isSystem: true,
    },
    {
      key: 'content.history', parentKey: 'content.create', moduleKey: 'content', pageKey: 'content.history',
      label: 'Lịch sử content', defaultPath: '/admin/content/history', iconKey: 'list-tree', permissionCode: 'content.view',
      sortOrder: 20, isVisible: false, isEnabled: true, isSystem: true,
    },
  ],
});
