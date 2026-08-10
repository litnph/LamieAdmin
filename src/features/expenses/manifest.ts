import { defineAdminModuleManifest, lazyNamedComponent } from '@/app/modules/manifest';
import { Permission } from '@/features/auth/permissions';

export const manifest = defineAdminModuleManifest({
  moduleKey: 'expenses',
  displayName: 'Chi phí',
  version: '1.0.0',
  permissions: [
    { code: Permission.ExpensesView, name: 'Xem chi phí', group: 'Tài chính' },
    { code: Permission.ExpensesManage, name: 'Quản lý chi phí', group: 'Tài chính' },
  ],
  pages: [
    {
      pageKey: 'expenses.list',
      defaultPath: '/admin/expenses',
      requiredPermission: Permission.ExpensesView,
      lazyComponent: lazyNamedComponent(
        () => import('@/features/expenses/pages/ExpenseListPage'),
        'ExpenseListPage',
      ),
    },
    {
      pageKey: 'expenses.categories',
      defaultPath: '/admin/settings/expense-categories',
      requiredPermission: Permission.ExpensesView,
      lazyComponent: lazyNamedComponent(
        () => import('@/features/expenses/pages/ExpenseCategoriesPage'),
        'ExpenseCategoriesPage',
      ),
    },
  ],
  defaultNavigation: [
    {
      key: 'expenses.list',
      moduleKey: 'expenses',
      pageKey: 'expenses.list',
      label: 'Chi phí',
      defaultPath: '/admin/expenses',
      iconKey: 'receipt-text',
      permissionCode: Permission.ExpensesView,
      sortOrder: 50,
      isVisible: true,
      isEnabled: true,
      isSystem: true,
    },
    {
      key: 'expenses.categories',
      parentKey: 'expenses.list',
      moduleKey: 'expenses',
      pageKey: 'expenses.categories',
      label: 'Danh mục chi phí',
      defaultPath: '/admin/settings/expense-categories',
      permissionCode: Permission.ExpensesView,
      sortOrder: 10,
      isVisible: false,
      isEnabled: true,
      isSystem: true,
    },
  ],
});
