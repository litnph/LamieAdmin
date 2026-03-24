import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/shared/components/Sidebar';
import { PrimaryColorPicker } from '@/shared/components/PrimaryColorPicker';
import { Bell, Search, PanelLeft } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden font-sans text-admin-text-primary bg-gradient-to-br from-[#FAF8F5] via-[#FDF9F5] to-[#F5EFE8]">
      <div
        className={`transition-all duration-300 ease-out ${sidebarOpen ? 'w-64' : 'w-0'}`}
        aria-hidden={!sidebarOpen}
      >
        <Sidebar open={sidebarOpen} />
      </div>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 glass-strong border-b border-white/40 flex items-center justify-between px-6 lg:px-8 z-10 shadow-[0_1px_12px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className="p-2 text-admin-text-secondary hover:text-admin-text-primary hover:bg-admin-muted/60 rounded-xl transition-all duration-200"
              aria-label="Toggle sidebar"
              title="Toggle sidebar"
            >
              <PanelLeft size={20} />
            </button>
            <div className="hidden sm:flex w-8 h-8 rounded-lg bg-admin-primary/10 items-center justify-center text-[11px] font-bold text-admin-primary">
              LM
            </div>
            <div className="hidden sm:block">
              <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-admin-text-muted">
                Lamie Admin
              </p>
              <p className="text-sm font-semibold text-admin-text-primary leading-tight">
                Flower Shop
              </p>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center px-6 max-w-lg">
            <div className="relative w-full group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-text-muted group-focus-within:text-admin-primary transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search products, orders, tags..."
                className="w-full pl-10 pr-4 py-2 bg-admin-muted/50 border border-transparent focus:border-admin-primary/30 focus:bg-white rounded-xl text-sm text-admin-text-primary placeholder-admin-text-muted focus:outline-none focus:ring-2 focus:ring-admin-primary/10 transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <PrimaryColorPicker />
            <button className="p-2 text-admin-text-secondary hover:text-admin-text-primary hover:bg-admin-muted/60 rounded-xl relative transition-all duration-200">
              <Bell size={19} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-admin-status-error rounded-full ring-2 ring-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-admin-border/50">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-admin-text-primary leading-tight">Lamie</p>
                <p className="text-[11px] text-admin-text-muted">Admin</p>
              </div>
              <div className="w-8 h-8 bg-admin-primary/15 rounded-lg flex items-center justify-center text-xs font-bold text-admin-primary">
                LM
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-5 lg:p-8 scroll-smooth">
          <div className="max-w-6xl xl:max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
