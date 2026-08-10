import { defineAdminModuleManifest, lazyNamedComponent } from '@/app/modules/manifest';
import { Permission } from '@/features/auth/permissions';

export const manifest = defineAdminModuleManifest({
  moduleKey: 'roles',
  displayName: 'Vai trò & quyền',
  version: '1.0.0',
  permissions: [
    { code: Permission.RolesView, name: 'Xem vai trò', group: 'Phân quyền' },
    { code: Permission.RolesManage, name: 'Quản lý vai trò', group: 'Phân quyền' },
  ],
  pages: [
    {
      pageKey: 'roles.list',
      defaultPath: '/admin/roles',
      requiredPermission: Permission.RolesView,
      lazyComponent: lazyNamedComponent(
        () => import('@/features/roles/pages/RolesManagementPage'),
        'RolesManagementPage',
      ),
    },
  ],
  defaultNavigation: [
    {
      key: 'roles.list',
      parentKey: 'group.system',
      moduleKey: 'roles',
      pageKey: 'roles.list',
      label: 'Vai trò & quyền',
      defaultPath: '/admin/roles',
      iconKey: 'shield-check',
      permissionCode: Permission.RolesView,
      sortOrder: 20,
      isVisible: true,
      isEnabled: true,
      isSystem: true,
    },
  ],
});
