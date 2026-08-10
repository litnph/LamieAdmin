import { Permission } from '@/features/auth/permissions';
import { defineAdminModuleManifest, lazyNamedComponent } from '@/app/modules/manifest';

export const manifest = defineAdminModuleManifest({
  moduleKey: 'dashboard',
  displayName: 'Tổng quan',
  version: '1.0.0',
  permissions: [
    {
      code: Permission.DashboardView,
      name: 'Xem tổng quan',
      group: 'Báo cáo',
      description: 'Xem màn hình tổng quan vận hành.',
    },
  ],
  pages: [
    {
      pageKey: 'dashboard.home',
      defaultPath: '/admin/dashboard',
      requiredPermission: Permission.DashboardView,
      lazyComponent: lazyNamedComponent(
        () => import('@/app/pages/DashboardPage'),
        'DashboardPage',
      ),
    },
  ],
  defaultNavigation: [
    {
      key: 'dashboard.home',
      moduleKey: 'dashboard',
      pageKey: 'dashboard.home',
      label: 'Tổng quan',
      defaultPath: '/admin/dashboard',
      iconKey: 'layout-dashboard',
      permissionCode: Permission.DashboardView,
      sortOrder: 10,
      isVisible: true,
      isEnabled: true,
      isSystem: true,
    },
  ],
});
