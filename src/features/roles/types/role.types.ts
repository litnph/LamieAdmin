export type PermissionDefinition = {
  id: string;
  code: string;
  name: string;
  group: string;
  description?: string | null;
  isSystem?: boolean;
  isActive?: boolean;
};

export type RoleDefinition = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  isActive: boolean;
  userCount: number;
  permissionCodes: string[];
  createdAt: string;
  updatedAt: string;
};

export type SaveRolePayload = {
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  permissionCodes: string[];
};
