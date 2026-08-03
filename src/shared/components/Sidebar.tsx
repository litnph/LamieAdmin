import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ContactRound,
  Flower2,
  LayoutDashboard,
  LogOut,
  Radio,
  Settings,
  ShoppingBag,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Permission } from '@/features/auth/permissions';

type NavigationItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  to: string;
};

type SidebarProps = {
  onNavigate?: () => void;
  onClose?: () => void;
  closeButtonRef?: React.RefObject<HTMLButtonElement | null>;
};

type NavigationSectionProps = {
  label?: string;
  items: NavigationItem[];
  onNavigate?: () => void;
};

const mainItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, to: '/admin/dashboard' },
  { id: 'orders', label: 'Đơn hàng', icon: ShoppingBag, to: '/admin/orders' },
  { id: 'customers', label: 'Khách hàng', icon: ContactRound, to: '/admin/customers' },
  { id: 'calendar', label: 'Lịch giao', icon: CalendarDays, to: '/admin/orders/calendar' },
];

const settingsItems: NavigationItem[] = [
  { id: 'settings-products', label: 'Sản phẩm', icon: Flower2, to: '/admin/products' },
  { id: 'settings-channels', label: 'Kênh bán', icon: Radio, to: '/admin/settings/channels' },
  { id: 'settings-attributes', label: 'Thuộc tính', icon: Settings, to: '/admin/settings/attributes/categories' },
];

const NavigationSection: React.FC<NavigationSectionProps> = ({ label, items, onNavigate }) => (
  <section aria-label={label}>
    {label ? (
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-admin-text-muted">
        {label}
      </p>
    ) : null}
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.id}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              [
                'flex min-h-11 w-full items-center gap-3 rounded-admin-control px-3 text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-admin-primary/10 text-admin-primary'
                  : 'text-admin-sidebar-text hover:bg-admin-sidebar-hover hover:text-admin-text-primary',
              ].join(' ')
            }
          >
            <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  </section>
);

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate, onClose, closeButtonRef }) => {
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();

  const adminItems: NavigationItem[] = hasPermission(Permission.UsersView)
    ? [{ id: 'users', label: 'Người dùng', icon: Users, to: '/admin/users' }]
    : [];

  const handleLogout = async () => {
    await logout();
    onNavigate?.();
    navigate('/login');
  };

  return (
    <aside
      id="admin-sidebar"
      className="glass-sidebar flex h-full w-full min-w-0 flex-col border-r border-admin-border"
      aria-label="Điều hướng quản trị"
    >
      <div className="flex min-h-admin-header items-center gap-3 border-b border-admin-border px-4">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-admin-control bg-admin-primary/10 text-sm font-bold text-admin-primary"
          aria-hidden="true"
        >
          L
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight text-admin-text-primary">Lamie</p>
          <p className="truncate text-[11px] text-admin-text-muted">Quản trị cửa hàng hoa</p>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-admin-control text-admin-text-secondary transition-colors hover:bg-admin-sidebar-hover hover:text-admin-text-primary lg:hidden"
          aria-label="Đóng menu điều hướng"
        >
          <X size={20} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>

      {user ? (
        <div className="border-b border-admin-border px-4 py-3">
          <p className="truncate text-xs font-medium text-admin-text-primary" title={user.fullName}>
            {user.fullName}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-admin-text-muted" title={user.email}>
            {user.email}
          </p>
        </div>
      ) : null}

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Menu chính">
        <NavigationSection items={mainItems} onNavigate={onNavigate} />
        <NavigationSection label="Quản lý" items={settingsItems} onNavigate={onNavigate} />
        {adminItems.length > 0 ? (
          <NavigationSection label="Hệ thống" items={adminItems} onNavigate={onNavigate} />
        ) : null}
      </nav>

      <div className="border-t border-admin-border p-3">
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex min-h-11 w-full items-center gap-3 rounded-admin-control px-3 text-sm font-medium text-admin-text-secondary transition-colors hover:bg-admin-status-error/10 hover:text-admin-status-error"
        >
          <LogOut size={19} strokeWidth={1.8} aria-hidden="true" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};
