import { defineAdminModuleManifest, lazyNamedComponent } from '@/app/modules/manifest';
import { Permission } from '@/features/auth/permissions';

export const manifest = defineAdminModuleManifest({
  moduleKey: 'access-control',
  displayName: 'Phân quyền & điều hướng',
  version: '1.0.0',
  permissions: [
    { code: Permission.NavigationView, name: 'Xem cấu hình điều hướng', group: 'Phân quyền' },
    { code: Permission.NavigationManage, name: 'Quản lý cấu hình điều hướng', group: 'Phân quyền' },
  ],
  pages: [
    {
      pageKey: 'permissions.list',
      defaultPath: '/admin/permissions',
      requiredPermission: Permission.RolesView,
      lazyComponent: lazyNamedComponent(
        () => import('@/features/access-control/pages/PermissionsManagementPage'),
        'PermissionsManagementPage',
      ),
    },
    {
      pageKey: 'navigation.manage',
      defaultPath: '/admin/navigation',
      requiredPermission: Permission.NavigationView,
      lazyComponent: lazyNamedComponent(
        () => import('@/features/access-control/pages/NavigationManagementPage'),
        'NavigationManagementPage',
      ),
    },
  ],
  defaultNavigation: [
    {
      key: 'permissions.list',
      parentKey: 'group.system',
      moduleKey: 'access-control',
      pageKey: 'permissions.list',
      label: 'Quyền hạn',
      defaultPath: '/admin/permissions',
      iconKey: 'key-round',
      permissionCode: Permission.RolesView,
      sortOrder: 30,
      isVisible: true,
      isEnabled: true,
      isSystem: true,
    },
    {
      key: 'navigation.manage',
      parentKey: 'group.system',
      moduleKey: 'access-control',
      pageKey: 'navigation.manage',
      label: 'Menu & Điều hướng',
      defaultPath: '/admin/navigation',
      iconKey: 'list-tree',
      permissionCode: Permission.NavigationView,
      sortOrder: 40,
      isVisible: true,
      isEnabled: true,
      isSystem: true,
    },
  ],
});
