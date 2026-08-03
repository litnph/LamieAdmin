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
  UsersView: 'users.view',
  UsersManage: 'users.manage',
  RolesManage: 'roles.manage',
} as const;

export type PermissionName = (typeof Permission)[keyof typeof Permission];

const rolePermissions: Record<UserRole, ReadonlySet<PermissionName>> = {
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
  ]),
};

export const userHasPermission = (user: AuthUser | null, permission: PermissionName): boolean => {
  if (!user?.isActive) return false;
  if (user.permissions) return user.permissions.includes(permission);
  return rolePermissions[user.role]?.has(permission) ?? false;
};
