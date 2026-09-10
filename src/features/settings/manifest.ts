import { defineAdminModuleManifest, lazyNamedComponent } from '@/app/modules/manifest';
import { Permission } from '@/features/auth/permissions';

export const manifest = defineAdminModuleManifest({
  moduleKey: 'catalog-settings',
  displayName: 'Cài đặt danh mục',
  version: '1.0.0',
  permissions: [
    {
      code: Permission.CatalogSettingsView,
      name: 'Xem Cài đặt danh mục',
      group: 'Cấu hình',
      description: 'Mở workspace danh mục; từng nhóm dữ liệu vẫn yêu cầu quyền nghiệp vụ riêng.',
    },
  ],
  pages: [
    {
      pageKey: 'catalog-settings.home',
      defaultPath: '/admin/settings/catalog',
      requiredPermission: Permission.CatalogSettingsView,
      lazyComponent: lazyNamedComponent(
        () => import('./pages/CatalogSettingsLandingPage'),
        'CatalogSettingsLandingPage',
      ),
    },
  ],
  defaultNavigation: [
    {
      key: 'group.settings',
      label: 'CÀI ĐẶT',
      iconKey: 'folder',
      sortOrder: 70,
      isVisible: true,
      isEnabled: true,
      isSystem: true,
    },
    {
      key: 'catalog-settings.home',
      parentKey: 'group.settings',
      moduleKey: 'catalog-settings',
      pageKey: 'catalog-settings.home',
      label: 'Cài đặt danh mục',
      defaultPath: '/admin/settings/catalog',
      iconKey: 'settings',
      permissionCode: Permission.CatalogSettingsView,
      sortOrder: 10,
      isVisible: true,
      isEnabled: true,
      isSystem: true,
    },
  ],
});
