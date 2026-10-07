import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { PrimaryColorPicker } from '@/shared/components/PrimaryColorPicker';
import { Sidebar, findActiveNavigationLabel } from '@/shared/components/Sidebar';
import { useNavigation } from '@/features/navigation/context/NavigationContext';

const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';
const SIDEBAR_STORAGE_KEY = 'lamie_admin_sidebar_collapsed';
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const getIsDesktop = () =>
  typeof window === 'undefined' ? true : window.matchMedia(DESKTOP_MEDIA_QUERY).matches;

const getInitialDesktopCollapsed = () => {
  if (typeof window === 'undefined') return false;
  try {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored !== null) return stored === 'true';
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
  return window.innerWidth >= 1024 && window.innerWidth < 1200;
};

export const AdminLayout: React.FC = () => {
  const [isDesktop, setIsDesktop] = useState(getIsDesktop);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(getInitialDesktopCollapsed);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarCloseButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarContainerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { items, routes } = useNavigation();

  const currentPageLabel = useMemo(
    () => findActiveNavigationLabel(items, location.pathname, routes),
    [items, location.pathname, routes],
  );

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
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(desktopSidebarCollapsed));
    } catch {
      // The preference is optional; the sidebar remains fully usable without storage.
    }
  }, [desktopSidebarCollapsed]);

  useEffect(() => {
    if (isDesktop || !mobileSidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.requestAnimationFrame(() => sidebarCloseButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMobileSidebarOpen(false);
        window.requestAnimationFrame(() => menuButtonRef.current?.focus());
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = [...(sidebarContainerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [])]
        .filter((element) => !element.hasAttribute('inert') && element.getClientRects().length > 0);
      if (focusable.length === 0) {
        event.preventDefault();
        sidebarCloseButtonRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
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
    if (restoreFocus) window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  const handleSidebarNavigation = () => {
    if (isDesktop) return;
    setMobileSidebarOpen(false);
    window.requestAnimationFrame(() => document.getElementById('admin-main-content')?.focus());
  };

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
        <div
          className="fixed inset-0 z-admin-overlay bg-admin-text-primary/40 lg:hidden"
          onClick={() => closeMobileSidebar(true)}
          aria-hidden="true"
        />
      ) : null}

      <div
        ref={sidebarContainerRef}
        className={[
          'fixed inset-y-0 left-0 z-admin-sidebar w-admin-sidebar max-w-[calc(100vw-2rem)] transform-gpu transition-transform duration-200 ease-out',
          'lg:static lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:transition-[width] lg:duration-200',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={isDesktop ? { width: desktopSidebarCollapsed ? '4.75rem' : '16rem' } : undefined}
        aria-hidden={!isDesktop && !mobileSidebarOpen}
        inert={!isDesktop && !mobileSidebarOpen}
      >
        <Sidebar
          collapsed={isDesktop && desktopSidebarCollapsed}
          isDesktop={isDesktop}
          closeButtonRef={sidebarCloseButtonRef}
          onClose={() => closeMobileSidebar(true)}
          onToggleCollapsed={() => setDesktopSidebarCollapsed((current) => !current)}
          onNavigate={handleSidebarNavigation}
        />
      </div>

      <div
        className="flex min-w-0 flex-1 flex-col overflow-hidden"
        aria-hidden={!isDesktop && mobileSidebarOpen}
        inert={!isDesktop && mobileSidebarOpen}
      >
        <header className="relative z-admin-header flex h-admin-header shrink-0 items-center justify-between gap-3 border-b border-admin-border bg-admin-card/95 px-3 shadow-admin-panel sm:px-5 lg:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-admin-control text-admin-text-secondary transition-colors hover:bg-admin-muted hover:text-admin-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/45 lg:hidden"
              aria-controls="admin-sidebar"
              aria-expanded={mobileSidebarOpen}
              aria-label="Mở menu điều hướng"
            >
              <Menu size={20} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <p className="truncate text-sm font-semibold text-admin-text-primary" aria-live="polite">{currentPageLabel}</p>
          </div>
          <PrimaryColorPicker />
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
