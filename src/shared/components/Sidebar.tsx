import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, RefreshCw, X } from 'lucide-react';
import { getIconDefinition } from '@/app/modules/iconRegistry';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useNavigation } from '@/features/navigation/context/NavigationContext';
import type { CurrentNavigationItem } from '@/features/navigation/types/navigation.types';
import type { ResolvedDynamicRoute } from '@/app/router/dynamicRouteBuilder';

type SidebarProps = {
  onNavigate?: () => void;
  onClose?: () => void;
  closeButtonRef?: React.RefObject<HTMLButtonElement | null>;
};

type NavigationTreeProps = {
  items: readonly CurrentNavigationItem[];
  activeKey?: string;
  depth?: number;
  onNavigate?: () => void;
};

type NavigationNodeProps = Omit<NavigationTreeProps, 'items'> & {
  item: CurrentNavigationItem;
};

const normalizePath = (path: string): string =>
  path.length > 1 ? path.replace(/\/+$/, '') : path;

const flattenNavigation = (
  items: readonly CurrentNavigationItem[],
): CurrentNavigationItem[] => items.flatMap((item) => [item, ...flattenNavigation(item.children)]);

const findActiveKey = (
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

const branchContainsActiveKey = (
  item: CurrentNavigationItem,
  activeKey?: string,
): boolean => item.key === activeKey
  || item.children.some((child) => branchContainsActiveKey(child, activeKey));

const NavigationNode: React.FC<NavigationNodeProps> = ({
  item,
  activeKey,
  depth = 0,
  onNavigate,
}) => {
  const Icon = getIconDefinition(item.iconKey);
  const isActive = item.key === activeKey;
  const hasChildren = item.children.length > 0;
  const branchIsActive = branchContainsActiveKey(item, activeKey);
  const [expanded, setExpanded] = useState(branchIsActive);
  const childrenId = `navigation-children-${item.id}`;
  const itemPadding = `${0.75 + Math.min(depth, 5) * 0.75}rem`;

  useEffect(() => {
    if (branchIsActive) setExpanded(true);
  }, [branchIsActive]);

  const iconAndLabel = (
    <>
      <Icon size={depth === 0 ? 19 : 17} strokeWidth={1.8} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
    </>
  );
  const chevron = hasChildren ? (
    <ChevronDown
      size={16}
      strokeWidth={1.8}
      className={`shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
      aria-hidden="true"
    />
  ) : null;

  return (
    <li>
      {item.path && hasChildren ? (
        <div
          className={[
            'flex min-h-11 w-full items-center rounded-admin-control transition-colors duration-150',
            isActive
              ? 'bg-admin-primary/10 text-admin-primary'
              : 'text-admin-sidebar-text hover:bg-admin-sidebar-hover hover:text-admin-text-primary',
          ].join(' ')}
        >
          <Link
            to={item.path}
            target={item.openInNewTab ? '_blank' : undefined}
            rel={item.openInNewTab ? 'noreferrer' : undefined}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            title={item.description ?? item.label}
            className="flex min-h-11 min-w-0 flex-1 items-center gap-3"
            style={{ paddingLeft: itemPadding }}
          >
            {iconAndLabel}
          </Link>
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            aria-expanded={expanded}
            aria-controls={childrenId}
            aria-label={`${expanded ? 'Thu gọn' : 'Mở rộng'} ${item.label}`}
            className="mr-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-admin-control transition-colors hover:bg-admin-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/30"
          >
            {chevron}
          </button>
        </div>
      ) : item.path ? (
        <Link
          to={item.path}
          target={item.openInNewTab ? '_blank' : undefined}
          rel={item.openInNewTab ? 'noreferrer' : undefined}
          onClick={onNavigate}
          aria-current={isActive ? 'page' : undefined}
          title={item.description ?? item.label}
          className={[
            'flex min-h-11 w-full items-center gap-3 rounded-admin-control pr-3 text-sm font-medium transition-colors duration-150',
            isActive
              ? 'bg-admin-primary/10 text-admin-primary'
              : 'text-admin-sidebar-text hover:bg-admin-sidebar-hover hover:text-admin-text-primary',
          ].join(' ')}
          style={{ paddingLeft: itemPadding }}
        >
          {iconAndLabel}
        </Link>
      ) : hasChildren ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-controls={childrenId}
          className="flex min-h-10 w-full items-center gap-2 rounded-admin-control px-3 pt-1 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-admin-text-muted transition-colors hover:bg-admin-sidebar-hover hover:text-admin-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/30"
          title={item.description ?? item.label}
        >
          {iconAndLabel}
          {chevron}
        </button>
      ) : (
        <div
          className="flex min-h-9 items-center gap-2 px-3 pt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-admin-text-muted"
          title={item.description ?? item.label}
        >
          {iconAndLabel}
        </div>
      )}

      {hasChildren ? (
        <div id={childrenId} hidden={!expanded}>
          <NavigationTree
            items={item.children}
            activeKey={activeKey}
            depth={depth + 1}
            onNavigate={onNavigate}
          />
        </div>
      ) : null}
    </li>
  );
};

const NavigationTree: React.FC<NavigationTreeProps> = ({
  items,
  activeKey,
  depth = 0,
  onNavigate,
}) => (
  <ul className={depth === 0 ? 'space-y-1' : 'mt-1 space-y-1'}>
    {items.map((item) => (
      <NavigationNode
        key={item.id}
        item={item}
        activeKey={activeKey}
        depth={depth}
        onNavigate={onNavigate}
      />
    ))}
  </ul>
);

const NavigationLoading: React.FC = () => (
  <div className="space-y-2 px-3 py-2" role="status" aria-live="polite" aria-label="Đang tải menu điều hướng">
    {[0, 1, 2, 3, 4].map((item) => (
      <div key={item} className="h-11 animate-pulse rounded-admin-control bg-admin-sidebar-hover" />
    ))}
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate, onClose, closeButtonRef }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const {
    items,
    routes,
    loading,
    error,
    refreshNavigation,
  } = useNavigation();
  const activeKey = useMemo(
    () => findActiveKey(items, location.pathname, routes),
    [items, location.pathname, routes],
  );

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

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Menu chính">
        {loading && items.length === 0 ? <NavigationLoading /> : null}
        {error ? (
          <div className="mb-3 rounded-admin-control border border-admin-status-warning/30 bg-admin-status-warning/10 p-3 text-xs text-admin-text-secondary" role="alert">
            <p>Không thể tải menu điều hướng.</p>
            <button
              type="button"
              onClick={refreshNavigation}
              className="mt-2 inline-flex min-h-9 items-center gap-2 rounded-admin-control px-2 font-semibold text-admin-primary hover:bg-admin-primary/10"
            >
              <RefreshCw size={15} strokeWidth={1.8} aria-hidden="true" />
              Thử lại
            </button>
          </div>
        ) : null}
        {!loading && !error && items.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-admin-text-muted">
            Không có mục điều hướng phù hợp.
          </p>
        ) : null}
        {items.length > 0 ? (
          <NavigationTree items={items} activeKey={activeKey} onNavigate={onNavigate} />
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
