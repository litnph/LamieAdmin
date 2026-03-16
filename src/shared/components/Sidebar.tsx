import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Flower2, Settings, LogOut, Users } from 'lucide-react';

type SidebarProps = {
  open?: boolean;
};

export const Sidebar: React.FC<SidebarProps> = ({ open = true }) => {
  const navigate = useNavigate();

  const mainItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
    { id: 'customers', label: 'Customers', icon: Users, to: '/admin/customers' },
  ];

  const settingsItems = [
    { id: 'settings-products', label: 'Sản phẩm', icon: Flower2, to: '/admin/products' },
    { id: 'settings-attributes', label: 'Thuộc tính', icon: Settings, to: '/admin/settings/attributes/categories' },
  ];

  return (
    <aside
      className={`w-64 bg-admin-sidebar-bg/95 backdrop-blur-xl border-r border-admin-border flex flex-col h-full transition-transform duration-200 ease-out ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-6 pb-4 border-b border-admin-border/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-admin-border/60 shadow-sm bg-admin-card flex items-center justify-center text-xs font-semibold text-admin-text-primary">
            LM
          </div>
          <div>
            <p className="text-sm font-serif font-semibold text-admin-text-primary leading-tight">Lamie</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-admin-text-secondary">
              Flower Shop
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-4">
        <div className="space-y-1">
          {mainItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.to}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-admin-sidebar-active text-admin-text-primary shadow-sm'
                      : 'text-admin-sidebar-text hover:bg-admin-sidebar-hover'
                  }`
                }
              >
                <Icon size={20} className="text-admin-text-secondary" />
                {item.label}
              </NavLink>
            );
          })}
        </div>

        <div>
          <p className="px-4 mb-2 text-xs font-semibold tracking-wide text-admin-text-secondary uppercase">
            Cài đặt
          </p>
          <div className="space-y-1">
            {settingsItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.id}
                  to={item.to}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-admin-sidebar-active text-admin-text-primary shadow-sm'
                        : 'text-admin-sidebar-text hover:bg-admin-sidebar-hover'
                    }`
                  }
                >
                  <Icon size={20} className="text-admin-text-secondary" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-admin-border">
        <button 
          onClick={() => navigate('/login')}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-admin-text-secondary hover:bg-admin-status-error/10 hover:text-admin-status-error rounded-xl transition-colors"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};