import { UserRole, type AuthUser } from './types';

export const Permission = {
  ProductsView: 'products.view',
  ProductsManage: 'products.manage',
  OrdersView: 'orders.view',
  OrdersManage: 'orders.manage',
  OrdersCancel: 'orders.cancel',
  CustomersView: 'customers.view',
  CustomersManage: 'customers.manage',
  ChannelsView: 'channels.view',
  ChannelsManage: 'channels.manage',
  DashboardView: 'dashboard.view',
  SettingsView: 'settings.view',
  SettingsManage: 'settings.manage',
  ExpensesView: 'expenses.view',
  ExpensesManage: 'expenses.manage',
  ReportsView: 'reports.view',
  UsersView: 'users.view',
  UsersManage: 'users.manage',
  RolesView: 'roles.view',
  RolesManage: 'roles.manage',
  NavigationView: 'navigation.view',
  NavigationManage: 'navigation.manage',
} as const;

export type PermissionName = (typeof Permission)[keyof typeof Permission];

// Compatibility only for Auth responses from an older API that omit `permissions`.
// Permission/Role management UI always reads the database-backed API catalog.
const legacyRolePermissionFallback: Record<UserRole, ReadonlySet<string>> = {
  [UserRole.Admin]: new Set(Object.values(Permission)),
  [UserRole.Manager]: new Set([
    Permission.ProductsView,
    Permission.ProductsManage,
    Permission.OrdersView,
    Permission.OrdersManage,
    Permission.OrdersCancel,
    Permission.CustomersView,
    Permission.CustomersManage,
    Permission.ChannelsView,
    Permission.ChannelsManage,
    Permission.DashboardView,
    Permission.SettingsView,
    Permission.SettingsManage,
    Permission.ExpensesView,
    Permission.ExpensesManage,
    Permission.ReportsView,
  ]),
  [UserRole.Staff]: new Set([
    Permission.ProductsView,
    Permission.OrdersView,
    Permission.OrdersManage,
    Permission.OrdersCancel,
    Permission.CustomersView,
    Permission.ChannelsView,
    Permission.DashboardView,
    Permission.SettingsView,
    Permission.ExpensesView,
    Permission.ReportsView,
  ]),
};

export const userHasPermission = (user: AuthUser | null, permission: string): boolean => {
  if (!user?.isActive) return false;
  if (user.permissions) return user.permissions.includes(permission);
  return legacyRolePermissionFallback[user.role]?.has(permission) ?? false;
};
