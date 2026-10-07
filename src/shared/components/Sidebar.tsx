import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  LogOut,
  PanelLeftClose,
  Plus,
  RefreshCw,
  UserRound,
  X,
} from 'lucide-react';
import { getIconDefinition } from '@/app/modules/iconRegistry';
import type { ResolvedDynamicRoute } from '@/app/router/dynamicRouteBuilder';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useNavigation } from '@/features/navigation/context/NavigationContext';
import type { CurrentNavigationItem } from '@/features/navigation/types/navigation.types';

type SidebarProps = {
  collapsed?: boolean;
  isDesktop?: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
  onClose?: () => void;
  closeButtonRef?: React.RefObject<HTMLButtonElement | null>;
};

type TooltipState = {
  label: string;
  left: number;
  top: number;
};

type NavigationTreeProps = {
  items: readonly CurrentNavigationItem[];
  activeKey?: string;
  collapsed: boolean;
  depth?: number;
  onNavigate?: () => void;
  onShowTooltip: (element: HTMLElement, label: string) => void;
  onHideTooltip: () => void;
};

type NavigationNodeProps = Omit<NavigationTreeProps, 'items'> & {
  item: CurrentNavigationItem;
};

const normalizePath = (path: string): string =>
  path.length > 1 ? path.replace(/\/+$/, '') : path;

export const flattenNavigation = (
  items: readonly CurrentNavigationItem[],
): CurrentNavigationItem[] => items.flatMap((item) => [item, ...flattenNavigation(item.children)]);

export const findActiveNavigationKey = (
  items: readonly CurrentNavigationItem[],
  pathname: string,
  routes: readonly ResolvedDynamicRoute[],
): string | undefined => {
  const currentPath = normalizePath(pathname);
  const visibleMatch = flattenNavigation(items)
    .filter((item) => {
      if (!item.path) return false;
      const itemPath = normalizePath(item.path);
      return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
    })
    .sort((left, right) => (right.path?.length ?? 0) - (left.path?.length ?? 0))[0]?.key;
  if (visibleMatch) return visibleMatch;

  const currentSegments = currentPath.split('/').filter(Boolean);
  return routes
    .filter((route) => {
      const routeSegments = normalizePath(route.path).split('/').filter(Boolean);
      return routeSegments.length === currentSegments.length
        && routeSegments.every((segment, index) => segment.startsWith(':') || segment === currentSegments[index]);
    })
    .sort((left, right) => right.path.length - left.path.length)[0]?.activeMenuKey ?? undefined;
};

export const findActiveNavigationLabel = (
  items: readonly CurrentNavigationItem[],
  pathname: string,
  routes: readonly ResolvedDynamicRoute[],
): string => {
  const activeKey = findActiveNavigationKey(items, pathname, routes);
  return flattenNavigation(items).find((item) => item.key === activeKey)?.label ?? 'Quản trị cửa hàng';
};

const branchContainsActiveKey = (
  item: CurrentNavigationItem,
  activeKey?: string,
): boolean => item.key === activeKey
  || item.children.some((child) => branchContainsActiveKey(child, activeKey));

const NavigationNode: React.FC<NavigationNodeProps> = ({
  item,
  activeKey,
  collapsed,
  depth = 0,
  onNavigate,
  onShowTooltip,
  onHideTooltip,
}) => {
  const Icon = getIconDefinition(item.iconKey);
  const isActive = item.key === activeKey;
  const hasChildren = item.children.length > 0;
  const branchIsActive = branchContainsActiveKey(item, activeKey);
  const isTopLevelGroup = depth === 0 && !item.path && hasChildren;
  const [expanded, setExpanded] = useState(
    branchIsActive || (
      isTopLevelGroup
      && item.key !== 'group.finance'
      && item.key !== 'group.settings'
    ),
  );
  const childrenId = `navigation-children-${item.id}`;

  useEffect(() => {
    if (branchIsActive) setExpanded(true);
  }, [branchIsActive]);

  if (collapsed && isTopLevelGroup) {
    return (
      <li className={item.key === 'group.settings' ? 'border-t border-admin-border/80 pt-2' : undefined}>
        <span className="sr-only">{item.label}</span>
        <NavigationTree
          items={item.children}
          activeKey={activeKey}
          collapsed
          depth={0}
          onNavigate={onNavigate}
          onShowTooltip={onShowTooltip}
          onHideTooltip={onHideTooltip}
        />
      </li>
    );
  }

  const iconAndLabel = (
    <>
      <Icon size={19} strokeWidth={1.8} className={`shrink-0 ${isActive ? 'text-admin-primary' : ''}`} aria-hidden="true" />
      <span className={collapsed ? 'sr-only' : 'min-w-0 flex-1 truncate'}>{item.label}</span>
    </>
  );
  const linkClass = [
    'group relative flex min-h-11 w-full items-center rounded-admin-control text-sm font-medium transition-colors duration-150 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary focus-visible:ring-offset-1 focus-visible:ring-offset-admin-sidebar-bg',
    collapsed ? 'justify-center px-0' : `gap-3 pr-3 ${depth > 0 ? 'pl-3' : 'pl-3'}`,
    isActive
      ? 'bg-admin-primary/10 font-semibold text-admin-text-primary'
      : 'text-admin-sidebar-text hover:bg-admin-sidebar-hover hover:text-admin-text-primary active:bg-admin-sidebar-active',
  ].join(' ');
  const tooltipHandlers = collapsed ? {
    onMouseEnter: (event: React.MouseEvent<HTMLElement>) => onShowTooltip(event.currentTarget, item.label),
    onMouseLeave: onHideTooltip,
    onFocus: (event: React.FocusEvent<HTMLElement>) => onShowTooltip(event.currentTarget, item.label),
    onBlur: onHideTooltip,
  } : {};

  return (
    <li className={isTopLevelGroup && item.key === 'group.settings' ? 'border-t border-admin-border pt-3' : undefined}>
      {item.path && hasChildren ? (
        <div
          className={[
            'flex min-h-11 w-full items-center rounded-admin-control transition-colors duration-150',
            isActive
              ? 'bg-admin-primary/10 text-admin-text-primary'
              : 'text-admin-sidebar-text hover:bg-admin-sidebar-hover hover:text-admin-text-primary',
          ].join(' ')}
        >
          <Link
            to={item.path}
            target={item.openInNewTab ? '_blank' : undefined}
            rel={item.openInNewTab ? 'noreferrer' : undefined}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            aria-label={collapsed ? item.label : undefined}
            className={`flex min-h-11 min-w-0 flex-1 items-center ${collapsed ? 'justify-center' : 'gap-3 pl-3'}`}
            {...tooltipHandlers}
          >
            {iconAndLabel}
          </Link>
          {!collapsed ? (
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              aria-expanded={expanded}
              aria-controls={childrenId}
              aria-label={`${expanded ? 'Thu gọn' : 'Mở rộng'} ${item.label}`}
              className="mr-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-admin-control transition-colors hover:bg-admin-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary"
            >
              <ChevronDown size={16} strokeWidth={1.8} className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : item.path ? (
        <Link
          to={item.path}
          target={item.openInNewTab ? '_blank' : undefined}
          rel={item.openInNewTab ? 'noreferrer' : undefined}
          onClick={onNavigate}
          aria-current={isActive ? 'page' : undefined}
          aria-label={collapsed ? item.label : undefined}
          className={linkClass}
          {...tooltipHandlers}
        >
          {iconAndLabel}
        </Link>
      ) : hasChildren ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-controls={childrenId}
          className="flex min-h-11 w-full items-center gap-2 rounded-admin-control px-3 pt-1 text-left text-[11px] font-bold tracking-[0.045em] text-admin-text-secondary transition-colors hover:bg-admin-sidebar-hover hover:text-admin-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary"
        >
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          <ChevronDown size={15} strokeWidth={1.8} className={`shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      ) : null}

      {hasChildren && !collapsed ? (
        <div id={childrenId} hidden={!expanded}>
          <NavigationTree
            items={item.children}
            activeKey={activeKey}
            collapsed={false}
            depth={depth + 1}
            onNavigate={onNavigate}
            onShowTooltip={onShowTooltip}
            onHideTooltip={onHideTooltip}
          />
        </div>
      ) : null}
    </li>
  );
};

const NavigationTree: React.FC<NavigationTreeProps> = ({
  items,
  activeKey,
  collapsed,
  depth = 0,
  onNavigate,
  onShowTooltip,
  onHideTooltip,
}) => (
  <ul className={collapsed ? 'space-y-1.5' : depth === 0 ? 'space-y-1' : 'mt-0.5 space-y-1'}>
    {items.map((item) => (
      <NavigationNode
        key={item.id}
        item={item}
        activeKey={activeKey}
        collapsed={collapsed}
        depth={depth}
        onNavigate={onNavigate}
        onShowTooltip={onShowTooltip}
        onHideTooltip={onHideTooltip}
      />
    ))}
  </ul>
);

const NavigationLoading: React.FC<{ collapsed: boolean }> = ({ collapsed }) => (
  <div className={`space-y-2 py-2 ${collapsed ? 'px-1' : 'px-1'}`} role="status" aria-live="polite" aria-label="Đang tải menu điều hướng">
    {[0, 1, 2, 3, 4].map((item) => (
      <div key={item} className={`h-11 animate-pulse bg-admin-sidebar-hover ${collapsed ? 'mx-auto w-11 rounded-admin-control' : 'w-full rounded-admin-control'}`} />
    ))}
  </div>
);

const getRoleLabel = (roleCode?: string | null, roleName?: string | null) => {
  if (roleName?.trim()) return roleName;
  if (roleCode === 'admin') return 'Quản trị viên';
  if (roleCode === 'manager') return 'Quản lý cửa hàng';
  if (roleCode === 'staff') return 'Nhân viên';
  return 'Tài khoản Lamie';
};

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  isDesktop = false,
  onToggleCollapsed,
  onNavigate,
  onClose,
  closeButtonRef,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { items, routes, loading, error, refreshNavigation } = useNavigation();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountWrapRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const accountMenuActionRef = useRef<HTMLButtonElement>(null);
  const accountMenuId = 'sidebar-account-menu';
  const activeKey = useMemo(
    () => findActiveNavigationKey(items, location.pathname, routes),
    [items, location.pathname, routes],
  );
  const createOrderRoute = useMemo(
    () => routes.find((route) => route.pageKey === 'orders.create' || route.key === 'orders.create'),
    [routes],
  );

  const initials = (user?.fullName ?? 'LM')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const roleLabel = getRoleLabel(user?.roleCode, user?.roleName);

  useEffect(() => {
    setTooltip(null);
    setAccountOpen(false);
  }, [collapsed, location.pathname]);

  useEffect(() => {
    if (!accountOpen) return;
    const focusTimer = window.requestAnimationFrame(() => accountMenuActionRef.current?.focus());
    const handlePointerDown = (event: MouseEvent) => {
      if (!accountWrapRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setAccountOpen(false);
      window.requestAnimationFrame(() => accountButtonRef.current?.focus());
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusTimer);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [accountOpen]);

  const showTooltip = (element: HTMLElement, label: string) => {
    const bounds = element.getBoundingClientRect();
    setTooltip({ label, left: bounds.right + 10, top: bounds.top + bounds.height / 2 });
  };

  const handleLogout = async () => {
    await logout();
    onNavigate?.();
    navigate('/login');
  };

  return (
    <aside
      id="admin-sidebar"
      className={`relative flex h-full w-full min-w-0 flex-col border-r border-admin-border bg-admin-sidebar-bg ${collapsed ? 'px-2' : ''}`}
      aria-label="Điều hướng quản trị"
      data-collapsed={collapsed || undefined}
    >
      <div className={`flex h-admin-header shrink-0 items-center border-b border-admin-border ${collapsed ? 'justify-center px-0' : 'gap-3 px-4'}`}>
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            onMouseEnter={(event) => showTooltip(event.currentTarget, 'Mở rộng menu')}
            onMouseLeave={() => setTooltip(null)}
            onFocus={(event) => showTooltip(event.currentTarget, 'Mở rộng menu')}
            onBlur={() => setTooltip(null)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-admin-control bg-admin-primary/10 text-sm font-bold text-admin-primary transition-colors hover:bg-admin-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary"
            aria-label="Mở rộng menu điều hướng"
          >
            L
          </button>
        ) : (
          <>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-admin-control bg-admin-primary/10 text-sm font-bold text-admin-primary" aria-hidden="true">
              L
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight text-admin-text-primary">Lamie</p>
              <p className="truncate text-[11px] text-admin-text-secondary">Quản trị cửa hàng</p>
            </div>
            {isDesktop ? (
              <button
                type="button"
                onClick={onToggleCollapsed}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-admin-control text-admin-text-secondary transition-colors hover:bg-admin-sidebar-hover hover:text-admin-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary"
                aria-label="Thu gọn menu điều hướng"
                title="Thu gọn menu điều hướng"
              >
                <PanelLeftClose size={19} strokeWidth={1.8} aria-hidden="true" />
              </button>
            ) : (
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-admin-control text-admin-text-secondary transition-colors hover:bg-admin-sidebar-hover hover:text-admin-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary"
                aria-label="Đóng menu điều hướng"
              >
                <X size={20} strokeWidth={1.8} aria-hidden="true" />
              </button>
            )}
          </>
        )}
      </div>

      {createOrderRoute ? (
        <div className={`shrink-0 ${collapsed ? 'px-0 py-3' : 'px-3 py-3'}`}>
          <Link
            to={createOrderRoute.path}
            onClick={onNavigate}
            aria-label={collapsed ? 'Tạo đơn hàng' : undefined}
            onMouseEnter={collapsed ? (event) => showTooltip(event.currentTarget, 'Tạo đơn hàng') : undefined}
            onMouseLeave={collapsed ? () => setTooltip(null) : undefined}
            onFocus={collapsed ? (event) => showTooltip(event.currentTarget, 'Tạo đơn hàng') : undefined}
            onBlur={collapsed ? () => setTooltip(null) : undefined}
            className={`flex min-h-11 items-center rounded-admin-control bg-admin-primary font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover active:bg-admin-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-text-primary/80 focus-visible:ring-offset-2 focus-visible:ring-offset-admin-sidebar-bg ${collapsed ? 'mx-auto w-11 justify-center' : 'w-full gap-2.5 px-3 text-sm'}`}
          >
            <Plus size={19} strokeWidth={2} className="shrink-0" aria-hidden="true" />
            <span className={collapsed ? 'sr-only' : ''}>Tạo đơn hàng</span>
          </Link>
        </div>
      ) : null}

      <nav className={`min-h-0 flex-1 overflow-y-auto overscroll-contain py-2 ${collapsed ? 'px-0' : 'px-3'}`} aria-label="Menu chính">
        {loading && items.length === 0 ? <NavigationLoading collapsed={collapsed} /> : null}
        {error ? (
          collapsed ? (
            <button
              type="button"
              onClick={refreshNavigation}
              onMouseEnter={(event) => showTooltip(event.currentTarget, 'Tải lại menu')}
              onMouseLeave={() => setTooltip(null)}
              onFocus={(event) => showTooltip(event.currentTarget, 'Tải lại menu')}
              onBlur={() => setTooltip(null)}
              className="mx-auto flex h-11 w-11 items-center justify-center rounded-admin-control text-admin-status-warning hover:bg-admin-status-warning/10"
              aria-label="Tải lại menu điều hướng"
            >
              <RefreshCw size={18} strokeWidth={1.8} aria-hidden="true" />
            </button>
          ) : (
            <div className="mb-3 rounded-admin-control border border-admin-status-warning/30 bg-admin-status-warning/10 p-3 text-xs text-admin-text-secondary" role="alert">
              <p>Không thể tải menu điều hướng.</p>
              <button type="button" onClick={refreshNavigation} className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-admin-control px-2 font-semibold text-admin-primary hover:bg-admin-primary/10">
                <RefreshCw size={15} strokeWidth={1.8} aria-hidden="true" />
                Thử lại
              </button>
            </div>
          )
        ) : null}
        {!loading && !error && items.length === 0 ? (
          <p className={collapsed ? 'sr-only' : 'px-3 py-6 text-center text-xs text-admin-text-secondary'}>
            Không có mục điều hướng phù hợp.
          </p>
        ) : null}
        {items.length > 0 ? (
          <NavigationTree
            items={items}
            activeKey={activeKey}
            collapsed={collapsed}
            onNavigate={onNavigate}
            onShowTooltip={showTooltip}
            onHideTooltip={() => setTooltip(null)}
          />
        ) : null}
      </nav>

      <div ref={accountWrapRef} className={`relative shrink-0 border-t border-admin-border py-3 ${collapsed ? 'px-0' : 'px-3'}`}>
        {accountOpen ? (
          <div
            id={accountMenuId}
            role="dialog"
            aria-label="Tài khoản"
            className={[
              'absolute z-admin-popover w-60 rounded-admin-panel border border-admin-border bg-admin-card p-2 shadow-admin-popover',
              collapsed ? 'bottom-3 left-[calc(100%+0.75rem)]' : 'bottom-[calc(100%+0.5rem)] left-3',
            ].join(' ')}
          >
            <div className="border-b border-admin-border px-2.5 py-2">
              <p className="truncate text-sm font-semibold text-admin-text-primary" title={user?.fullName}>{user?.fullName ?? 'Tài khoản'}</p>
              <p className="mt-0.5 truncate text-xs text-admin-text-muted" title={user?.email}>{user?.email ?? roleLabel}</p>
            </div>
            <button
              ref={accountMenuActionRef}
              type="button"
              onClick={() => void handleLogout()}
              className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-admin-control px-2.5 text-sm font-medium text-admin-text-secondary transition-colors hover:bg-admin-status-error/10 hover:text-admin-status-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary"
            >
              <LogOut size={18} strokeWidth={1.8} aria-hidden="true" />
              Đăng xuất
            </button>
          </div>
        ) : null}
        <button
          ref={accountButtonRef}
          type="button"
          onClick={() => setAccountOpen((current) => !current)}
          onMouseEnter={collapsed ? (event) => showTooltip(event.currentTarget, 'Tài khoản') : undefined}
          onMouseLeave={collapsed ? () => setTooltip(null) : undefined}
          onFocus={collapsed ? (event) => showTooltip(event.currentTarget, 'Tài khoản') : undefined}
          onBlur={collapsed ? () => setTooltip(null) : undefined}
          aria-expanded={accountOpen}
          aria-controls={accountMenuId}
          aria-haspopup="dialog"
          aria-label={collapsed ? `Tài khoản ${user?.fullName ?? ''}`.trim() : undefined}
          className={`flex min-h-11 items-center rounded-admin-control text-left transition-colors hover:bg-admin-sidebar-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary ${collapsed ? 'mx-auto w-11 justify-center' : 'w-full gap-3 px-2'}`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-admin-primary/10 text-xs font-bold text-admin-primary" aria-hidden="true">
            {initials || <UserRound size={18} strokeWidth={1.8} />}
          </span>
          {!collapsed ? (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-admin-text-primary">{user?.fullName ?? 'Tài khoản'}</span>
              <span className="mt-0.5 block truncate text-[11px] text-admin-text-secondary">{roleLabel}</span>
            </span>
          ) : null}
          {!collapsed ? <ChevronDown size={16} strokeWidth={1.8} className={`shrink-0 text-admin-text-muted transition-transform ${accountOpen ? 'rotate-180' : ''}`} aria-hidden="true" /> : null}
        </button>
      </div>

      {collapsed && tooltip && typeof document !== 'undefined' ? createPortal(
        <div
          role="tooltip"
          className="pointer-events-none fixed z-admin-modal -translate-y-1/2 whitespace-nowrap rounded-admin-control bg-admin-text-primary px-2.5 py-1.5 text-xs font-medium text-admin-text-inverse shadow-admin-popover"
          style={{ left: tooltip.left, top: tooltip.top }}
        >
          {tooltip.label}
        </div>,
        document.body,
      ) : null}
    </aside>
  );
};
