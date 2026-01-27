import React from 'react';
import { Sidebar } from './Sidebar';
import { Bell, Search } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, activePage, onNavigate, onLogout }) => {
  return (
    <div className="flex h-screen bg-admin-bg overflow-hidden font-sans text-admin-text-primary">
      <Sidebar activePage={activePage} onNavigate={onNavigate} onLogout={onLogout} />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-admin-card/80 backdrop-blur-sm border-b border-admin-border flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4 w-96">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-secondary" size={18} />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="w-full pl-10 pr-4 py-2 bg-admin-bg border border-transparent focus:border-admin-input-focus rounded-lg text-sm text-admin-text-primary placeholder-admin-text-muted focus:outline-none transition-all"
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
                <p className="text-sm font-medium text-admin-text-primary">Isabella F.</p>
                <p className="text-xs text-admin-text-secondary">Admin</p>
              </div>
              <div className="w-10 h-10 bg-admin-secondary rounded-full overflow-hidden border-2 border-admin-bg shadow-sm">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&h=100" alt="Admin" />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};