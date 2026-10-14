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
    {
      pageKey: 'finance.purchases',
      defaultPath: '/admin/finance/purchases',
      requiredPermission: Permission.ReportsView,
      lazyComponent: lazyNamedComponent(() => import('@/features/reports/pages/MaterialPurchasesPage'), 'MaterialPurchasesPage'),
    },
    {
      pageKey: 'finance.period-close',
      defaultPath: '/admin/finance/period-close',
      requiredPermission: Permission.ExpensesManage,
      lazyComponent: lazyNamedComponent(() => import('@/features/reports/pages/FinancePeriodClosePage'), 'FinancePeriodClosePage'),
    },
  ],
  defaultNavigation: [
    {
      key: 'reports.financial',
      parentKey: 'group.finance',
      moduleKey: 'reports',
      pageKey: 'reports.financial',
      label: 'Báo cáo tài chính',
      defaultPath: '/admin/reports',
      iconKey: 'chart-no-axes-combined',
      permissionCode: Permission.ReportsView,
      sortOrder: 10,
      isVisible: true,
      isEnabled: true,
      isSystem: true,
    },
    {
      key: 'finance.purchases', parentKey: 'group.finance', moduleKey: 'reports', pageKey: 'finance.purchases',
      label: 'Mua nguyên liệu', defaultPath: '/admin/finance/purchases', iconKey: 'package-plus',
      permissionCode: Permission.ReportsView, sortOrder: 30, isVisible: true, isEnabled: true, isSystem: true,
    },
    {
      key: 'finance.period-close', parentKey: 'group.finance', moduleKey: 'reports', pageKey: 'finance.period-close',
      label: 'Kiểm kê & chốt kỳ', defaultPath: '/admin/finance/period-close', iconKey: 'list-checks',
      permissionCode: Permission.ExpensesManage, sortOrder: 40, isVisible: true, isEnabled: true, isSystem: true,
    },
  ],
});
