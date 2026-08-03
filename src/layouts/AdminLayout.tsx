import React, { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PanelLeft } from 'lucide-react';
import { Sidebar } from '@/shared/components/Sidebar';
import { PrimaryColorPicker } from '@/shared/components/PrimaryColorPicker';
import { useAuth } from '@/features/auth/context/AuthContext';

const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

const getIsDesktop = () =>
  typeof window === 'undefined' ? true : window.matchMedia(DESKTOP_MEDIA_QUERY).matches;

export const AdminLayout: React.FC = () => {
  const [isDesktop, setIsDesktop] = useState(getIsDesktop);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarCloseButtonRef = useRef<HTMLButtonElement>(null);
  const { user } = useAuth();

  const sidebarVisible = isDesktop ? !desktopSidebarCollapsed : mobileSidebarOpen;

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
      if (event.matches) setMobileSidebarOpen(false);
    };

    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (isDesktop || !mobileSidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.requestAnimationFrame(() => {
      sidebarCloseButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMobileSidebarOpen(false);
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDesktop, mobileSidebarOpen]);

  const closeMobileSidebar = (restoreFocus = false) => {
    setMobileSidebarOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    }
  };

  const handleSidebarNavigation = () => {
    if (isDesktop) return;
    setMobileSidebarOpen(false);
    window.requestAnimationFrame(() => document.getElementById('admin-main-content')?.focus());
  };

  const toggleSidebar = () => {
    if (isDesktop) {
      setDesktopSidebarCollapsed((current) => !current);
      return;
    }
    setMobileSidebarOpen((current) => !current);
  };

  const menuButtonLabel = isDesktop
    ? desktopSidebarCollapsed
      ? 'Mở menu điều hướng'
      : 'Thu gọn menu điều hướng'
    : mobileSidebarOpen
      ? 'Đóng menu điều hướng'
      : 'Mở menu điều hướng';

  const initials = (user?.fullName ?? 'LM')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative flex h-[100dvh] min-h-[100dvh] w-full max-w-full overflow-hidden bg-admin-bg font-sans text-admin-text-primary">
      <a
        href="#admin-main-content"
        className="fixed left-3 top-3 z-admin-modal inline-flex min-h-11 -translate-y-20 items-center rounded-admin-control bg-admin-text-primary px-4 py-2 text-sm font-medium text-admin-text-inverse transition-transform focus:translate-y-0"
        aria-hidden={!isDesktop && mobileSidebarOpen}
        tabIndex={!isDesktop && mobileSidebarOpen ? -1 : undefined}
      >
        Đi đến nội dung chính
      </a>

      {!isDesktop && mobileSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-admin-overlay bg-slate-950/35 lg:hidden"
          onClick={() => closeMobileSidebar(true)}
          aria-label="Đóng menu điều hướng"
          tabIndex={-1}
        />
      ) : null}

      <div
        className={[
          'fixed inset-y-0 left-0 z-admin-sidebar w-admin-sidebar max-w-[calc(100vw-2rem)] transform-gpu transition-transform duration-200 ease-out',
          'lg:static lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:transition-[width] lg:duration-200',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          desktopSidebarCollapsed ? 'lg:w-0 lg:overflow-hidden' : 'lg:w-admin-sidebar',
        ].join(' ')}
        aria-hidden={!sidebarVisible}
        inert={!sidebarVisible}
      >
        <Sidebar
          closeButtonRef={sidebarCloseButtonRef}
          onClose={() => closeMobileSidebar(true)}
          onNavigate={handleSidebarNavigation}
        />
      </div>

      <div
        className="flex min-w-0 flex-1 flex-col overflow-hidden"
        aria-hidden={!isDesktop && mobileSidebarOpen}
        inert={!isDesktop && mobileSidebarOpen}
      >
        <header className="relative z-admin-header flex h-admin-header shrink-0 items-center justify-between gap-2 border-b border-admin-border bg-admin-card/95 px-3 shadow-admin-panel sm:gap-4 sm:px-5 lg:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={toggleSidebar}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-admin-control text-admin-text-secondary transition-colors hover:bg-admin-muted hover:text-admin-text-primary"
              aria-controls="admin-sidebar"
              aria-expanded={sidebarVisible}
              aria-label={menuButtonLabel}
              title={menuButtonLabel}
            >
              <PanelLeft size={20} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold leading-tight text-admin-text-primary">Lamie Admin</p>
              <p className="truncate text-[11px] text-admin-text-muted">Cửa hàng hoa</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-1 sm:gap-2">
            <PrimaryColorPicker />
            <div className="flex min-w-0 items-center gap-3 border-l border-admin-border pl-2 sm:pl-3" title={user?.email}>
              <div className="hidden min-w-0 text-right xl:block">
                <p className="max-w-40 truncate text-sm font-medium leading-tight text-admin-text-primary">
                  {user?.fullName ?? 'Tài khoản'}
                </p>
                <p className="mt-0.5 max-w-40 truncate text-[11px] text-admin-text-muted">{user?.email ?? ''}</p>
              </div>
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-admin-control bg-admin-primary/10 text-xs font-bold text-admin-primary"
                aria-label={user?.fullName ? `Tài khoản ${user.fullName}` : 'Tài khoản'}
                role="img"
              >
                {initials}
              </div>
            </div>
          </div>
        </header>

        <main
          id="admin-main-content"
          tabIndex={-1}
          className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-5 sm:px-5 sm:py-6 lg:px-8 lg:py-8 wide:px-10"
        >
          <div className="mx-auto w-full min-w-0 max-w-admin-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
