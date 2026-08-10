import { hasIconDefinition } from './iconRegistry';
import type {
  AdminModuleManifest,
  AdminRegistrySnapshot,
  DiscoveredManifest,
  PermissionMetadata,
  RegisteredAdminModule,
  RegisteredAdminPage,
  RegisteredNavigationSeed,
  RegisteredPermissionMetadata,
  RegistryBuildMode,
  RegistryDiagnostic,
} from './types';

type ManifestModule = { manifest?: AdminModuleManifest };

const identifierPattern = /^[a-z0-9][a-z0-9._-]*$/;
const versionPattern = /^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/;
const routeParameterPattern = /^:[A-Za-z_][A-Za-z0-9_-]*$/;

export class AdminRegistryError extends Error {
  readonly code: string;
  readonly key: string;
  readonly source: string;

  constructor(diagnostic: RegistryDiagnostic) {
    super(`[admin-registry:${diagnostic.code}] ${diagnostic.key} (${diagnostic.source})`);
    this.name = 'AdminRegistryError';
    this.code = diagnostic.code;
    this.key = diagnostic.key;
    this.source = diagnostic.source;
  }
}

const isIdentifier = (value: string, maximumLength: number): boolean =>
  value.length > 0
  && value.length <= maximumLength
  && identifierPattern.test(value);

export const isSafeAdminRoutePath = (path: string): boolean => {
  if (!path.startsWith('/admin/') || path.length > 400 || /[?#\\\u0000-\u001f\u007f]/.test(path)) {
    return false;
  }
  const segments = path.split('/').slice(1);
  if (segments.length < 2 || segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    return false;
  }
  return segments.every((segment) => (
    segment.startsWith(':')
      ? routeParameterPattern.test(segment)
      : /^[\p{L}\p{N}._~-]+$/u.test(segment)
  ));
};

const samePermissionMetadata = (left: PermissionMetadata, right: PermissionMetadata): boolean =>
  left.code === right.code
  && left.name === right.name
  && left.group === right.group
  && (left.description ?? '') === (right.description ?? '');

const validateManifest = (manifest: AdminModuleManifest): string | null => {
  if (!isIdentifier(manifest.moduleKey, 120)) return 'invalid_module_key';
  if (!manifest.displayName.trim() || manifest.displayName.trim().length > 160) return 'invalid_module_name';
  if (!versionPattern.test(manifest.version)) return 'invalid_module_version';
  if (!Array.isArray(manifest.permissions) || !Array.isArray(manifest.pages)) return 'invalid_module_collections';
  return null;
};

const validatePermission = (permission: PermissionMetadata): string | null => {
  if (!isIdentifier(permission.code, 120) || !permission.code.includes('.')) return 'invalid_permission_code';
  if (!permission.name.trim() || permission.name.trim().length > 160) return 'invalid_permission_name';
  if (!permission.group.trim() || permission.group.trim().length > 120) return 'invalid_permission_group';
  if ((permission.description?.length ?? 0) > 500) return 'invalid_permission_description';
  return null;
};

export const buildAdminRegistries = (
  discovered: readonly DiscoveredManifest[],
  mode: RegistryBuildMode,
  warn: (message: string) => void = console.warn,
): AdminRegistrySnapshot => {
  const modules = new Map<string, RegisteredAdminModule>();
  const pages = new Map<string, RegisteredAdminPage>();
  const permissions = new Map<string, RegisteredPermissionMetadata>();
  const navigation = new Map<string, RegisteredNavigationSeed>();
  const diagnostics: RegistryDiagnostic[] = [];
  const warned = new Set<string>();

  const reject = (code: string, key: string, source: string): false => {
    const diagnostic = { code, key, source };
    if (mode === 'development') throw new AdminRegistryError(diagnostic);
    diagnostics.push(diagnostic);
    const warningKey = `${code}:${key}`;
    if (!warned.has(warningKey)) {
      warned.add(warningKey);
      warn(`[admin-registry:${code}] skipped ${key}`);
    }
    return false;
  };

  for (const { source, manifest } of [...discovered].sort((left, right) =>
    left.source.localeCompare(right.source))) {
    const manifestError = validateManifest(manifest);
    if (manifestError && !reject(manifestError, manifest.moduleKey || 'unknown', source)) continue;
    if (modules.has(manifest.moduleKey)
        && !reject('duplicate_module_key', manifest.moduleKey, source)) continue;

    const pageKeys: string[] = [];
    const permissionCodes: string[] = [];
    const navigationKeys: string[] = [];

    for (const permission of manifest.permissions) {
      const permissionError = validatePermission(permission);
      if (permissionError && !reject(permissionError, permission.code || 'unknown', source)) continue;
      const existing = permissions.get(permission.code);
      if (existing) {
        if (!samePermissionMetadata(existing, permission)) {
          reject('conflicting_permission_metadata', permission.code, source);
          continue;
        }
        permissions.set(permission.code, {
          ...existing,
          moduleKeys: [...new Set([...existing.moduleKeys, manifest.moduleKey])].sort(),
        });
      } else {
        permissions.set(permission.code, { ...permission, moduleKeys: [manifest.moduleKey] });
      }
      permissionCodes.push(permission.code);
    }

    for (const page of manifest.pages) {
      if (!isIdentifier(page.pageKey, 160)
          && !reject('invalid_page_key', page.pageKey || 'unknown', source)) continue;
      if (!isSafeAdminRoutePath(page.defaultPath)
          && !reject('invalid_page_path', page.pageKey, source)) continue;
      if (page.requiredPermission && !isIdentifier(page.requiredPermission, 120)
          && !reject('invalid_page_permission', page.pageKey, source)) continue;
      if (typeof page.lazyComponent !== 'function'
          && !reject('invalid_page_component', page.pageKey, source)) continue;
      if (pages.has(page.pageKey)
          && !reject('duplicate_page_key', page.pageKey, source)) continue;
      pages.set(page.pageKey, { ...page, moduleKey: manifest.moduleKey, source });
      pageKeys.push(page.pageKey);
    }

    for (const seed of manifest.defaultNavigation ?? []) {
      if (!isIdentifier(seed.key, 120)
          && !reject('invalid_navigation_key', seed.key || 'unknown', source)) continue;
      if (seed.parentKey && !isIdentifier(seed.parentKey, 120)
          && !reject('invalid_navigation_parent_key', seed.key, source)) continue;
      const hasPageBinding = Boolean(seed.moduleKey || seed.pageKey || seed.defaultPath);
      if (hasPageBinding && (!seed.moduleKey || !seed.pageKey || !seed.defaultPath)
          && !reject('incomplete_navigation_page_binding', seed.key, source)) continue;
      if (seed.defaultPath && !isSafeAdminRoutePath(seed.defaultPath)
          && !reject('invalid_navigation_path', seed.key, source)) continue;
      if (seed.isVisible && seed.defaultPath?.split('/').some((segment) => segment.startsWith(':'))
          && !reject('visible_parameterized_navigation_path', seed.key, source)) continue;
      if (seed.sortOrder < 0
          && !reject('invalid_navigation_sort_order', seed.key, source)) continue;
      if (seed.openInNewTab
          && !reject('unsafe_navigation_target', seed.key, source)) continue;
      if (navigation.has(seed.key)
          && !reject('duplicate_navigation_key', seed.key, source)) continue;
      navigation.set(seed.key, { ...seed, sourceModuleKey: manifest.moduleKey, source });
      navigationKeys.push(seed.key);
    }

    modules.set(manifest.moduleKey, {
      moduleKey: manifest.moduleKey,
      displayName: manifest.displayName.trim(),
      version: manifest.version,
      enabled: manifest.enabled !== false,
      source,
      permissionCodes: [...new Set(permissionCodes)].sort(),
      pageKeys: [...new Set(pageKeys)].sort(),
      navigationKeys: [...new Set(navigationKeys)].sort(),
    });
  }

  for (const [pageKey, page] of [...pages]) {
    if (page.requiredPermission && !permissions.has(page.requiredPermission)) {
      reject('missing_page_permission', pageKey, page.source);
      if (mode === 'production') pages.delete(pageKey);
    }
  }

  for (const [key, seed] of [...navigation]) {
    if (seed.parentKey && !navigation.has(seed.parentKey)) {
      reject('missing_navigation_parent', key, seed.source);
      if (mode === 'production') navigation.delete(key);
      continue;
    }
    if (seed.pageKey) {
      const page = pages.get(seed.pageKey);
      if (!page || page.moduleKey !== seed.moduleKey) {
        reject('missing_navigation_page', key, seed.source);
        if (mode === 'production') navigation.delete(key);
        continue;
      }
    }
    if (seed.permissionCode && !permissions.has(seed.permissionCode)) {
      reject('missing_navigation_permission', key, seed.source);
      if (mode === 'production') navigation.delete(key);
      continue;
    }
    if (seed.iconKey && !hasIconDefinition(seed.iconKey)) {
      const diagnostic = { code: 'unknown_icon_key', key: seed.iconKey, source: seed.source };
      diagnostics.push(diagnostic);
      const warningKey = `${diagnostic.code}:${diagnostic.key}`;
      if (!warned.has(warningKey)) {
        warned.add(warningKey);
        warn(`[admin-registry:unknown_icon_key] fallback for ${seed.iconKey}`);
      }
    }
  }

  if (mode === 'production') {
    let removedOrphan: boolean;
    do {
      removedOrphan = false;
      for (const [key, seed] of navigation) {
        if (seed.parentKey && !navigation.has(seed.parentKey)) {
          reject('missing_navigation_parent', key, seed.source);
          navigation.delete(key);
          removedOrphan = true;
        }
      }
    } while (removedOrphan);
  }

  for (const [moduleKey, module] of modules) {
    modules.set(moduleKey, {
      ...module,
      permissionCodes: module.permissionCodes.filter((code) => permissions.has(code)),
      pageKeys: module.pageKeys.filter((pageKey) => pages.get(pageKey)?.moduleKey === moduleKey),
      navigationKeys: module.navigationKeys.filter((key) =>
        navigation.get(key)?.sourceModuleKey === moduleKey),
    });
  }

  return { modules, pages, permissions, navigation, diagnostics };
};

const discoveredModules = import.meta.glob<ManifestModule>(
  '/src/features/**/manifest.ts',
  { eager: true },
);

const discoveryDiagnostics: RegistryDiagnostic[] = [];
const discovered: DiscoveredManifest[] = [];
for (const [source, module] of Object.entries(discoveredModules).sort(([left], [right]) =>
  left.localeCompare(right))) {
  if (module.manifest) {
    discovered.push({ source, manifest: module.manifest });
    continue;
  }
  const diagnostic = { code: 'missing_manifest_export', key: source, source };
  if (import.meta.env.DEV) throw new AdminRegistryError(diagnostic);
  discoveryDiagnostics.push(diagnostic);
  console.warn('[admin-registry:missing_manifest_export] skipped manifest module');
}

const registry = buildAdminRegistries(
  discovered,
  import.meta.env.DEV ? 'development' : 'production',
);

export const getModuleDefinition = (moduleKey: string): RegisteredAdminModule | undefined =>
  registry.modules.get(moduleKey);

export const getPageDefinition = (pageKey: string): RegisteredAdminPage | undefined =>
  registry.pages.get(pageKey);

export const getAllModuleDefinitions = (): readonly RegisteredAdminModule[] =>
  [...registry.modules.values()].sort((left, right) => left.moduleKey.localeCompare(right.moduleKey));

export const getAllPageDefinitions = (): readonly RegisteredAdminPage[] =>
  [...registry.pages.values()].sort((left, right) => left.pageKey.localeCompare(right.pageKey));

export const getAllPermissionMetadata = (): readonly RegisteredPermissionMetadata[] =>
  [...registry.permissions.values()].sort((left, right) => left.code.localeCompare(right.code));

export const getDefaultNavigationSeeds = (): readonly RegisteredNavigationSeed[] =>
  [...registry.navigation.values()].sort((left, right) => left.key.localeCompare(right.key));

export const getRegistryDiagnostics = (): readonly RegistryDiagnostic[] =>
  [...discoveryDiagnostics, ...registry.diagnostics];
