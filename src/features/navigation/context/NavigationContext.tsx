import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  buildDynamicRoutes,
  PLATFORM_ADMIN_ROUTE_PATHS,
  type DynamicRouteDiagnostic,
  type ResolvedDynamicRoute,
} from '@/app/router/dynamicRouteBuilder';
import { isSafeAdminRoutePath } from '@/app/modules/registry';
import { useAuth } from '@/features/auth/context/AuthContext';
import { navigationApi } from '@/features/navigation/api/navigationApi';
import type {
  CurrentNavigationItem,
  CurrentNavigationRoute,
} from '@/features/navigation/types/navigation.types';

type NavigationContextValue = {
  items: readonly CurrentNavigationItem[];
  loading: boolean;
  error: boolean;
  routes: readonly ResolvedDynamicRoute[];
  routesLoading: boolean;
  routesError: boolean;
  routeDiagnostics: readonly DynamicRouteDiagnostic[];
  refreshNavigation: () => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

const orderItems = (items: CurrentNavigationItem[]): CurrentNavigationItem[] =>
  [...items].sort((left, right) =>
    left.sortOrder - right.sortOrder
    || left.label.localeCompare(right.label, 'vi')
    || left.key.localeCompare(right.key));

const sanitizeRemoteItems = (
  items: readonly CurrentNavigationItem[],
  ancestors = new Set<string>(),
): CurrentNavigationItem[] => orderItems(items.flatMap((item) => {
  if (!item.id || !item.key || !item.label?.trim() || ancestors.has(item.id)) return [];
  if (item.path && (
    !isSafeAdminRoutePath(item.path)
    || item.path.split('/').some((segment) => segment.startsWith(':'))
  )) return [];
  const nextAncestors = new Set(ancestors).add(item.id);
  const children = sanitizeRemoteItems(item.children ?? [], nextAncestors);
  if (!item.path && children.length === 0) return [];
  return [{ ...item, label: item.label.trim(), children }];
}));

const warnedRouteDiagnostics = new Set<string>();
const warnRouteDiagnostic = (diagnostic: DynamicRouteDiagnostic) => {
  if (!import.meta.env.DEV) return;
  const warningKey = `${diagnostic.code}:${diagnostic.routeKey}`;
  if (warnedRouteDiagnostics.has(warningKey)) return;
  warnedRouteDiagnostics.add(warningKey);
  console.warn(`[dynamic-router:${diagnostic.code}] route skipped`);
};

const resolveRoutes = (records: readonly CurrentNavigationRoute[]) => buildDynamicRoutes(records, {
  reservedPaths: PLATFORM_ADMIN_ROUTE_PATHS,
  warn: warnRouteDiagnostic,
});

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [remoteItems, setRemoteItems] = useState<CurrentNavigationItem[]>([]);
  const [remoteRoutes, setRemoteRoutes] = useState<CurrentNavigationRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [routesError, setRoutesError] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRemoteItems([]);
      setLoading(false);
      setError(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(false);
    void navigationApi.currentMenu()
      .then((items) => {
        if (!active) return;
        setRemoteItems(sanitizeRemoteItems(items));
      })
      .catch(() => {
        if (!active) return;
        setRemoteItems([]);
        setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authLoading, revision, user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRemoteRoutes([]);
      setRoutesLoading(false);
      setRoutesError(false);
      return;
    }

    let active = true;
    setRoutesLoading(true);
    setRoutesError(false);
    void navigationApi.currentRoutes()
      .then((records) => {
        if (!active) return;
        setRemoteRoutes(records);
      })
      .catch(() => {
        if (!active) return;
        setRemoteRoutes([]);
        setRoutesError(true);
      })
      .finally(() => {
        if (active) setRoutesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authLoading, revision, user?.id]);

  const refreshNavigation = useCallback(() => setRevision((value) => value + 1), []);
  const remoteRouteResult = useMemo(() => resolveRoutes(remoteRoutes), [remoteRoutes]);
  const value = useMemo<NavigationContextValue>(() => ({
    items: remoteItems,
    loading,
    error,
    routes: remoteRouteResult.routes,
    routesLoading,
    routesError,
    routeDiagnostics: remoteRouteResult.diagnostics,
    refreshNavigation,
  }), [
    error,
    loading,
    remoteItems,
    remoteRouteResult.diagnostics,
    remoteRouteResult.routes,
    refreshNavigation,
    routesError,
    routesLoading,
  ]);

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};

export const useNavigation = (): NavigationContextValue => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useNavigation must be used within NavigationProvider');
  return context;
};
