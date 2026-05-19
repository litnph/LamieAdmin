import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Flower2, Settings, LogOut, ShoppingBag, CalendarDays, Radio, Users } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';

type SidebarProps = {
  open?: boolean;
};

export const Sidebar: React.FC<SidebarProps> = ({ open = true }) => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  const mainItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
    { id: 'orders', label: 'Đơn hàng', icon: ShoppingBag, to: '/admin/orders' },
    { id: 'calendar', label: 'Lịch giao', icon: CalendarDays, to: '/admin/orders/calendar' },
  ];

  const settingsItems = [
    { id: 'settings-products', label: 'Sản phẩm', icon: Flower2, to: '/admin/products' },
    { id: 'settings-channels', label: 'Kênh bán', icon: Radio, to: '/admin/settings/channels' },
    { id: 'settings-attributes', label: 'Thuộc tính', icon: Settings, to: '/admin/settings/attributes/categories' },
  ];

  const adminItems = isAdmin
    ? [{ id: 'users', label: 'Người dùng', icon: Users, to: '/admin/users' }]
    : [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside
      className={`w-64 glass-sidebar border-r border-white/30 flex flex-col h-full transition-transform duration-300 ease-out ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-5 pb-4 border-b border-admin-border/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-admin-primary/10 flex items-center justify-center text-sm font-bold text-admin-primary shadow-sm">
            L
          </div>
          <div>
            <p className="text-sm font-serif font-semibold text-admin-text-primary leading-tight">Lamie</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-admin-text-muted font-medium">
              Flower Shop
            </p>
          </div>
        </div>
        {user && (
          <p className="mt-3 text-[11px] text-admin-text-secondary truncate" title={user.email}>
            {user.fullName}
          </p>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        <div className="space-y-0.5 stagger">
          {mainItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.to}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 animate-slide-in-left ${
                    isActive
                      ? 'bg-white/70 text-admin-primary shadow-sm border border-white/50'
                      : 'text-admin-sidebar-text hover:bg-white/40 border border-transparent'
                  }`
                }
              >
                <Icon size={18} strokeWidth={1.8} />
                {item.label}
              </NavLink>
            );
          })}
        </div>

        <div>
          <p className="px-3.5 mb-2 text-[10px] font-semibold tracking-[0.16em] text-admin-text-muted uppercase">
            Quản lý
          </p>
          <div className="space-y-0.5 stagger">
            {settingsItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.id}
                  to={item.to}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 animate-slide-in-left ${
                      isActive
                        ? 'bg-white/70 text-admin-primary shadow-sm border border-white/50'
                        : 'text-admin-sidebar-text hover:bg-white/40 border border-transparent'
                    }`
                  }
                >
                  <Icon size={18} strokeWidth={1.8} />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </div>

        {adminItems.length > 0 && (
          <div>
            <p className="px-3.5 mb-2 text-[10px] font-semibold tracking-[0.16em] text-admin-text-muted uppercase">
              Hệ thống
            </p>
            <div className="space-y-0.5 stagger">
              {adminItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.id}
                    to={item.to}
                    className={({ isActive }) =>
                      `w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 animate-slide-in-left ${
                        isActive
                          ? 'bg-white/70 text-admin-primary shadow-sm border border-white/50'
                          : 'text-admin-sidebar-text hover:bg-white/40 border border-transparent'
                      }`
                    }
                  >
                    <Icon size={18} strokeWidth={1.8} />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-admin-border/40">
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-admin-text-muted hover:bg-admin-status-error/8 hover:text-admin-status-error rounded-xl transition-all duration-200"
        >
          <LogOut size={18} strokeWidth={1.8} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

