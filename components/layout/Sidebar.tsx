import React from 'react';
import { LayoutDashboard, Flower2, ShoppingBag, Settings, LogOut, Users } from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Flower2 },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-admin-sidebar-bg border-r border-admin-border flex flex-col h-full">
      <div className="p-8 pb-4">
        <h1 className="font-serif text-2xl font-bold text-admin-text-primary flex items-center gap-2">
          <Flower2 className="text-admin-primary" />
          <span>Florist.</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-admin-sidebar-active text-admin-text-primary shadow-sm'
                  : 'text-admin-sidebar-text hover:bg-admin-sidebar-hover'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-admin-text-primary' : 'text-admin-text-secondary'} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-admin-border">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-admin-text-secondary hover:bg-admin-status-error/10 hover:text-admin-status-error rounded-xl transition-colors"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};