import { defineAdminModuleManifest, lazyNamedComponent } from '@/app/modules/manifest';
import { Permission } from '@/features/auth/permissions';

export const manifest = defineAdminModuleManifest({
  moduleKey: 'reports',
  displayName: 'Báo cáo',
  version: '1.0.0',
  permissions: [
    { code: Permission.ReportsView, name: 'Xem báo cáo', group: 'Báo cáo' },
  ],
  pages: [
    {
      pageKey: 'reports.financial',
      defaultPath: '/admin/reports',
      requiredPermission: Permission.ReportsView,
      lazyComponent: lazyNamedComponent(
        () => import('@/features/reports/pages/FinancialReportPage'),
        'FinancialReportPage',
      ),
    },
  ],
  defaultNavigation: [
    {
      key: 'reports.financial',
      moduleKey: 'reports',
      pageKey: 'reports.financial',
      label: 'Báo cáo',
      defaultPath: '/admin/reports',
      iconKey: 'chart-no-axes-combined',
      permissionCode: Permission.ReportsView,
      sortOrder: 60,
      isVisible: true,
      isEnabled: true,
      isSystem: true,
    },
  ],
});
