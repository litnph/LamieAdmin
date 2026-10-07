import { defineAdminModuleManifest, lazyNamedComponent } from '@/app/modules/manifest';
import { Permission } from '@/features/auth/permissions';

export const manifest = defineAdminModuleManifest({
  moduleKey: 'catalog-settings',
  displayName: 'Cấu hình cửa hàng',
  version: '1.0.0',
  permissions: [
    {
      code: Permission.CatalogSettingsView,
      name: 'Xem cấu hình cửa hàng',
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
      label: 'Quản trị',
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
      label: 'Cấu hình cửa hàng',
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
