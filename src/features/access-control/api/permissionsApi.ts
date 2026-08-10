import { apiClient } from '@/services/apiClient';
import type {
  PagedPermissions,
  PermissionFilters,
  PermissionManagementItem,
  SavePermissionPayload,
} from '../types/accessControl.types';

export const permissionsApi = {
  list: async (filters: PermissionFilters): Promise<PagedPermissions> => {
    const { data } = await apiClient.get<PagedPermissions>('/api/admin/permissions', {
      params: filters,
    });
    return data;
  },

  create: async (payload: SavePermissionPayload): Promise<PermissionManagementItem> => {
    const { data } = await apiClient.post<PermissionManagementItem>('/api/admin/permissions', payload);
    return data;
  },

  update: async (id: string, payload: SavePermissionPayload): Promise<void> => {
    await apiClient.put(`/api/admin/permissions/${id}`, payload);
  },

  deactivate: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/admin/permissions/${id}`);
  },
};
