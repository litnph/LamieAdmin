import { defineAdminModuleManifest, lazyNamedComponent } from '@/app/modules/manifest';
import { Permission } from '@/features/auth/permissions';

export const manifest = defineAdminModuleManifest({
  moduleKey: 'customers',
  displayName: 'Khách hàng',
  version: '1.0.0',
  permissions: [
    { code: Permission.CustomersView, name: 'Xem khách hàng', group: 'Khách hàng' },
    { code: Permission.CustomersManage, name: 'Quản lý khách hàng', group: 'Khách hàng' },
  ],
  pages: [
    {
      pageKey: 'customers.list',
      defaultPath: '/admin/customers',
      requiredPermission: Permission.CustomersView,
      lazyComponent: lazyNamedComponent(
        () => import('@/features/customers/pages/CustomerListPage'),
        'CustomerListPage',
      ),
    },
    {
      pageKey: 'customers.detail',
      defaultPath: '/admin/customers/:id',
      requiredPermission: Permission.CustomersView,
      lazyComponent: lazyNamedComponent(
        () => import('@/features/customers/pages/CustomerDetailPage'),
        'CustomerDetailPage',
      ),
    },
  ],
  defaultNavigation: [
    {
      key: 'customers.list',
      moduleKey: 'customers',
      pageKey: 'customers.list',
      label: 'Khách hàng',
      defaultPath: '/admin/customers',
      iconKey: 'contact-round',
      permissionCode: Permission.CustomersView,
      sortOrder: 30,
      isVisible: true,
      isEnabled: true,
      isSystem: true,
    },
    {
      key: 'customers.detail',
      parentKey: 'customers.list',
      moduleKey: 'customers',
      pageKey: 'customers.detail',
      label: 'Chi tiết khách hàng',
      defaultPath: '/admin/customers/:id',
      permissionCode: Permission.CustomersView,
      sortOrder: 10,
      isVisible: false,
      isEnabled: true,
      isSystem: true,
    },
  ],
});
