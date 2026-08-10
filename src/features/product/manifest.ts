import { defineAdminModuleManifest, lazyNamedComponent } from '@/app/modules/manifest';
import { Permission } from '@/features/auth/permissions';

export const manifest = defineAdminModuleManifest({
  moduleKey: 'products',
  displayName: 'Sản phẩm',
  version: '1.0.0',
  permissions: [
    { code: Permission.ProductsView, name: 'Xem sản phẩm', group: 'Sản phẩm' },
    { code: Permission.ProductsManage, name: 'Quản lý sản phẩm', group: 'Sản phẩm' },
  ],
  pages: [
    {
      pageKey: 'products.list',
      defaultPath: '/admin/products',
      requiredPermission: Permission.ProductsView,
      lazyComponent: lazyNamedComponent(
        () => import('@/features/product/pages/ProductListPage'),
        'ProductListPage',
      ),
    },
    {
      pageKey: 'products.create',
      defaultPath: '/admin/products/create',
      requiredPermission: Permission.ProductsManage,
      lazyComponent: lazyNamedComponent(
        () => import('@/features/product/pages/ProductCreatePage'),
        'ProductCreatePage',
      ),
    },
    {
      pageKey: 'products.edit',
      defaultPath: '/admin/products/:id/edit',
      requiredPermission: Permission.ProductsManage,
      lazyComponent: lazyNamedComponent(
        () => import('@/features/product/pages/ProductEditPage'),
        'ProductEditPage',
      ),
    },
  ],
  defaultNavigation: [
    {
      key: 'group.management',
      label: 'Quản lý',
      iconKey: 'folder',
      sortOrder: 100,
      isVisible: true,
      isEnabled: true,
      isSystem: true,
    },
    {
      key: 'products.list',
      parentKey: 'group.management',
      moduleKey: 'products',
      pageKey: 'products.list',
      label: 'Sản phẩm',
      defaultPath: '/admin/products',
      iconKey: 'flower-2',
      permissionCode: Permission.ProductsView,
      sortOrder: 10,
      isVisible: true,
      isEnabled: true,
      isSystem: true,
    },
    {
      key: 'products.create',
      parentKey: 'products.list',
      moduleKey: 'products',
      pageKey: 'products.create',
      label: 'Tạo sản phẩm',
      defaultPath: '/admin/products/create',
      permissionCode: Permission.ProductsManage,
      sortOrder: 10,
      isVisible: false,
      isEnabled: true,
      isSystem: true,
    },
    {
      key: 'products.edit',
      parentKey: 'products.list',
      moduleKey: 'products',
      pageKey: 'products.edit',
      label: 'Chỉnh sửa sản phẩm',
      defaultPath: '/admin/products/:id/edit',
      permissionCode: Permission.ProductsManage,
      sortOrder: 20,
      isVisible: false,
      isEnabled: true,
      isSystem: true,
    },
  ],
});
