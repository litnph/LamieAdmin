import { defineAdminModuleManifest, lazyNamedComponent } from '@/app/modules/manifest';
import { Permission } from '@/features/auth/permissions';

export const manifest = defineAdminModuleManifest({
  moduleKey: 'users',
  displayName: 'Người dùng',
  version: '1.0.0',
  permissions: [
    { code: Permission.UsersView, name: 'Xem người dùng', group: 'Phân quyền' },
    { code: Permission.UsersManage, name: 'Quản lý người dùng', group: 'Phân quyền' },
  ],
  pages: [
    {
      pageKey: 'users.list',
      defaultPath: '/admin/users',
      requiredPermission: Permission.UsersView,
      lazyComponent: lazyNamedComponent(
        () => import('@/features/users/pages/UsersListPage'),
        'UsersListPage',
      ),
    },
    {
      pageKey: 'users.create',
      defaultPath: '/admin/users/new',
      requiredPermission: Permission.UsersManage,
      lazyComponent: lazyNamedComponent(
        () => import('@/features/users/pages/UserEditorPage'),
        'UserCreatePage',
      ),
    },
    {
      pageKey: 'users.edit',
      defaultPath: '/admin/users/:id/edit',
      requiredPermission: Permission.UsersManage,
      lazyComponent: lazyNamedComponent(
        () => import('@/features/users/pages/UserEditorPage'),
        'UserEditPage',
      ),
    },
  ],
  defaultNavigation: [
    {
      key: 'group.system',
      label: 'Hệ thống',
      iconKey: 'folder',
      sortOrder: 200,
      isVisible: true,
      isEnabled: true,
      isSystem: true,
    },
    {
      key: 'users.list',
      parentKey: 'group.system',
      moduleKey: 'users',
      pageKey: 'users.list',
      label: 'Người dùng',
      defaultPath: '/admin/users',
      iconKey: 'users',
      permissionCode: Permission.UsersView,
      sortOrder: 10,
      isVisible: true,
      isEnabled: true,
      isSystem: true,
    },
    {
      key: 'users.create',
      parentKey: 'users.list',
      moduleKey: 'users',
      pageKey: 'users.create',
      label: 'Tạo người dùng',
      defaultPath: '/admin/users/new',
      permissionCode: Permission.UsersManage,
      sortOrder: 10,
      isVisible: false,
      isEnabled: true,
      isSystem: true,
    },
    {
      key: 'users.edit',
      parentKey: 'users.list',
      moduleKey: 'users',
      pageKey: 'users.edit',
      label: 'Chỉnh sửa người dùng',
      defaultPath: '/admin/users/:id/edit',
      permissionCode: Permission.UsersManage,
      sortOrder: 20,
      isVisible: false,
      isEnabled: true,
      isSystem: true,
    },
  ],
});
