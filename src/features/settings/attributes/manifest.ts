import { defineAdminModuleManifest, lazyNamedComponent } from '@/app/modules/manifest';
import { Permission } from '@/features/auth/permissions';

export const manifest = defineAdminModuleManifest({
  moduleKey: 'settings-attributes',
  displayName: 'Thuộc tính',
  version: '1.0.0',
  permissions: [
    { code: Permission.SettingsView, name: 'Xem cấu hình', group: 'Cấu hình' },
    { code: Permission.SettingsManage, name: 'Quản lý cấu hình', group: 'Cấu hình' },
  ],
  pages: [
    {
      pageKey: 'settings.attributes',
      defaultPath: '/admin/settings/attributes/:attributeKey',
      requiredPermission: Permission.SettingsView,
      lazyComponent: lazyNamedComponent(
        () => import('@/features/settings/attributes/pages/AttributesPage'),
        'AttributesPage',
      ),
    },
  ],
  defaultNavigation: [
    {
      key: 'settings.attributes',
      parentKey: 'group.management',
      moduleKey: 'settings-attributes',
      pageKey: 'settings.attributes',
      label: 'Thuộc tính',
      defaultPath: '/admin/settings/attributes/categories',
      iconKey: 'settings',
      permissionCode: Permission.SettingsView,
      sortOrder: 30,
      isVisible: true,
      isEnabled: true,
      isSystem: true,
    },
    {
      key: 'settings.attributes.route',
      parentKey: 'settings.attributes',
      moduleKey: 'settings-attributes',
      pageKey: 'settings.attributes',
      label: 'Thuộc tính theo nhóm',
      defaultPath: '/admin/settings/attributes/:attributeKey',
      permissionCode: Permission.SettingsView,
      sortOrder: 10,
      isVisible: false,
      isEnabled: true,
      isSystem: true,
    },
  ],
});
