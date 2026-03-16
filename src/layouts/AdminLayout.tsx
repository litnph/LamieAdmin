import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/shared/components/Sidebar';
import { Bell, Search, PanelLeft } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#F7F1EA] via-[#FBF5EF] to-[#F0E2D2] overflow-hidden font-sans text-admin-text-primary">
      <div className={sidebarOpen ? 'w-64' : 'w-0'} aria-hidden={!sidebarOpen}>
        <Sidebar open={sidebarOpen} />
      </div>
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-admin-card/90 backdrop-blur-xl border-b border-admin-border flex items-center justify-between px-6 lg:px-10 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className="p-2 text-admin-text-secondary hover:bg-admin-muted rounded-full transition-colors"
              aria-label="Toggle sidebar"
              title="Toggle sidebar"
            >
              <PanelLeft size={20} />
            </button>
            <div className="hidden sm:flex w-9 h-9 rounded-full bg-admin-secondary/70 border border-admin-border/60 shadow-sm items-center justify-center text-[11px] font-semibold text-admin-text-primary">
              LM
            </div>
            <div>
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-admin-text-secondary">
                Lamie Admin
              </p>
              <p className="text-sm font-semibold text-admin-text-primary">
                Flower Shop Operations
              </p>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center px-6 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-secondary" size={18} />
              <input 
                type="text" 
                placeholder="Search products, orders, tags..." 
                className="w-full pl-10 pr-4 py-2 bg-admin-bg border border-transparent focus:border-admin-input-focus rounded-full text-sm text-admin-text-primary placeholder-admin-text-muted focus:outline-none transition-all shadow-inner"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-admin-text-secondary hover:bg-admin-muted rounded-full relative transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-admin-status-error rounded-full border-2 border-admin-card"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-admin-border">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-admin-text-primary">Lamie Operator</p>
                <p className="text-xs text-admin-text-secondary">Administrator</p>
              </div>
              <div className="w-9 h-9 bg-admin-secondary rounded-full flex items-center justify-center border-2 border-admin-bg shadow-sm text-xs font-semibold text-admin-text-primary">
                LM
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 lg:p-8 scroll-smooth">
          <div className="max-w-6xl xl:max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};