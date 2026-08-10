export type PermissionManagementItem = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  group: string;
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
  roleCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PagedPermissions = {
  items: PermissionManagementItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type PermissionFilters = {
  search?: string;
  group?: string;
  system?: boolean;
  active?: boolean;
  page: number;
  pageSize: number;
};

export type SavePermissionPayload = {
  code: string;
  name: string;
  description?: string | null;
  group: string;
  isActive: boolean;
  sortOrder: number;
};

export type NavigationManagementItem = {
  id: string;
  key: string;
  parentId?: string | null;
  moduleKey?: string | null;
  pageKey?: string | null;
  label: string;
  description?: string | null;
  path?: string | null;
  iconKey?: string | null;
  permissionCode?: string | null;
  permissionIsActive?: boolean | null;
  sortOrder: number;
  isVisible: boolean;
  isEnabled: boolean;
  isSystem: boolean;
  openInNewTab: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  warnings: string[];
};

export type SaveNavigationPayload = {
  key: string;
  parentId?: string | null;
  moduleKey?: string | null;
  pageKey?: string | null;
  label: string;
  description?: string | null;
  path?: string | null;
  iconKey?: string | null;
  permissionCode?: string | null;
  sortOrder: number;
  isVisible: boolean;
  isEnabled: boolean;
  openInNewTab: boolean;
};

export type NavigationReorderPayload = {
  items: Array<{ id: string; parentId?: string | null; sortOrder: number }>;
};
