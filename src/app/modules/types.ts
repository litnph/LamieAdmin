import type { ComponentType } from 'react';

export type PermissionMetadata = {
  code: string;
  name: string;
  group: string;
  description?: string;
};

export type AdminPageDefinition = {
  pageKey: string;
  defaultPath: string;
  requiredPermission?: string;
  lazyComponent: () => Promise<{ default: ComponentType }>;
};

export type NavigationSeed = {
  key: string;
  parentKey?: string;
  moduleKey?: string;
  pageKey?: string;
  label: string;
  description?: string;
  defaultPath?: string;
  iconKey?: string;
  permissionCode?: string;
  sortOrder: number;
  isVisible: boolean;
  isEnabled: boolean;
  isSystem: boolean;
  openInNewTab?: boolean;
};

export type AdminModuleManifest = {
  moduleKey: string;
  displayName: string;
  version: string;
  enabled?: boolean;
  permissions: PermissionMetadata[];
  pages: AdminPageDefinition[];
  defaultNavigation?: NavigationSeed[];
};

export type RegisteredAdminModule = {
  moduleKey: string;
  displayName: string;
  version: string;
  enabled: boolean;
  source: string;
  permissionCodes: readonly string[];
  pageKeys: readonly string[];
  navigationKeys: readonly string[];
};

export type RegisteredAdminPage = AdminPageDefinition & {
  moduleKey: string;
  source: string;
};

export type RegisteredPermissionMetadata = PermissionMetadata & {
  moduleKeys: readonly string[];
};

export type RegisteredNavigationSeed = NavigationSeed & {
  sourceModuleKey: string;
  source: string;
};

export type RegistryDiagnostic = {
  code: string;
  key: string;
  source: string;
};

export type DiscoveredManifest = {
  source: string;
  manifest: AdminModuleManifest;
};

export type RegistryBuildMode = 'development' | 'production';

export type AdminRegistrySnapshot = {
  modules: ReadonlyMap<string, RegisteredAdminModule>;
  pages: ReadonlyMap<string, RegisteredAdminPage>;
  permissions: ReadonlyMap<string, RegisteredPermissionMetadata>;
  navigation: ReadonlyMap<string, RegisteredNavigationSeed>;
  diagnostics: readonly RegistryDiagnostic[];
};
