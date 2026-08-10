import { apiClient } from '@/services/apiClient';
import type { PermissionDefinition, RoleDefinition, SaveRolePayload } from '../types/role.types';

export const rolesApi = {
  list: async (activeOnly = false): Promise<RoleDefinition[]> => {
    const { data } = await apiClient.get<RoleDefinition[]>('/api/roles', { params: { activeOnly } });
    return data;
  },

  permissions: async (): Promise<PermissionDefinition[]> => {
    const { data } = await apiClient.get<PermissionDefinition[]>('/api/roles/permissions');
    return data;
  },

  create: async (payload: SaveRolePayload): Promise<RoleDefinition> => {
    const { data } = await apiClient.post<RoleDefinition>('/api/roles', payload);
    return data;
  },

  update: async (id: string, payload: SaveRolePayload): Promise<void> => {
    await apiClient.put(`/api/roles/${id}`, payload);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/roles/${id}`);
  },
};
