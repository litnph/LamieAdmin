import {
  getModuleDefinition,
  getPageDefinition,
  isSafeAdminRoutePath,
} from '@/app/modules/registry';
import type { RegisteredAdminPage } from '@/app/modules/types';
import type { CurrentNavigationRoute } from '@/features/navigation/types/navigation.types';

export type DynamicRouteDiagnosticCode =
  | 'invalid-route'
  | 'missing-module'
  | 'disabled-module'
  | 'missing-page'
  | 'module-page-mismatch'
  | 'route-conflict';

export type DynamicRouteDiagnostic = {
  code: DynamicRouteDiagnosticCode;
  routeKey: string;
};

export type ResolvedDynamicRoute = CurrentNavigationRoute & {
  page: RegisteredAdminPage;
  relativePath: string;
  requiredPermissions: readonly string[];
};

export type DynamicRouteBuildResult = {
  routes: readonly ResolvedDynamicRoute[];
  diagnostics: readonly DynamicRouteDiagnostic[];
};

type BuildOptions = {
  reservedPaths?: readonly string[];
  warn?: (diagnostic: DynamicRouteDiagnostic) => void;
};

export const PLATFORM_ADMIN_ROUTE_PATHS = [
  '/admin/unauthorized',
  '/admin/not-found',
  '/admin/settings/attributes',
  '/admin/masterdata/languages',
  '/admin/masterdata/tags',
  '/admin/masterdata/colors',
  '/admin/masterdata/categories',
] as const;

const permissionPattern = /^[a-z0-9][a-z0-9._-]*$/;

const routeSignature = (path: string): string => path
  .split('/')
  .map((segment) => segment.startsWith(':') ? ':' : segment.toLocaleLowerCase('en-US'))
  .join('/');

const isValidRoute = (route: unknown): route is CurrentNavigationRoute => {
  if (!route || typeof route !== 'object') return false;
  const candidate = route as Partial<CurrentNavigationRoute>;
  return typeof candidate.id === 'string'
  && Boolean(candidate.id.trim())
  && typeof candidate.key === 'string'
  && Boolean(candidate.key.trim())
  && typeof candidate.moduleKey === 'string'
  && Boolean(candidate.moduleKey.trim())
  && typeof candidate.pageKey === 'string'
  && Boolean(candidate.pageKey.trim())
  && typeof candidate.path === 'string'
  && typeof candidate.sortOrder === 'number'
  && Number.isInteger(candidate.sortOrder)
  && candidate.sortOrder >= 0
  && isSafeAdminRoutePath(candidate.path)
  && (candidate.permissionCode == null
    || (typeof candidate.permissionCode === 'string'
      && permissionPattern.test(candidate.permissionCode)));
};

export const buildDynamicRoutes = (
  records: readonly unknown[],
  options: BuildOptions = {},
): DynamicRouteBuildResult => {
  const diagnostics: DynamicRouteDiagnostic[] = [];
  const routes: ResolvedDynamicRoute[] = [];
  const usedIds = new Set<string>();
  const usedKeys = new Set<string>();
  const usedSignatures = new Set((options.reservedPaths ?? []).map(routeSignature));

  const reject = (code: DynamicRouteDiagnosticCode, routeKey: string) => {
    const diagnostic = { code, routeKey: routeKey || 'unknown' };
    diagnostics.push(diagnostic);
    options.warn?.(diagnostic);
  };

  const validRecords: CurrentNavigationRoute[] = [];
  for (const record of records) {
    if (isValidRoute(record)) {
      validRecords.push(record);
      continue;
    }
    const routeKey = record && typeof record === 'object'
      && typeof (record as { key?: unknown }).key === 'string'
      ? (record as { key: string }).key
      : 'unknown';
    reject('invalid-route', routeKey);
  }

  const ordered = validRecords.sort((left, right) =>
    left.sortOrder - right.sortOrder
    || left.path.localeCompare(right.path)
    || left.key.localeCompare(right.key));

  for (const record of ordered) {
    const module = getModuleDefinition(record.moduleKey);
    if (!module) {
      reject('missing-module', record.key);
      continue;
    }
    if (!module.enabled) {
      reject('disabled-module', record.key);
      continue;
    }

    const page = getPageDefinition(record.pageKey);
    if (!page) {
      reject('missing-page', record.key);
      continue;
    }
    if (page.moduleKey !== record.moduleKey) {
      reject('module-page-mismatch', record.key);
      continue;
    }

    const signature = routeSignature(record.path);
    if (usedIds.has(record.id) || usedKeys.has(record.key) || usedSignatures.has(signature)) {
      reject('route-conflict', record.key);
      continue;
    }

    usedIds.add(record.id);
    usedKeys.add(record.key);
    usedSignatures.add(signature);
    routes.push({
      ...record,
      page,
      relativePath: record.path.slice('/admin/'.length),
      requiredPermissions: [...new Set([
        page.requiredPermission,
        record.permissionCode ?? undefined,
      ].filter((permission): permission is string => Boolean(permission)))],
    });
  }

  return { routes, diagnostics };
};
