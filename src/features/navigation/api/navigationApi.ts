import { apiClient } from '@/services/apiClient';
import type {
  CurrentNavigationItem,
  CurrentNavigationRoute,
} from '../types/navigation.types';
import type {
  NavigationManagementItem,
  NavigationReorderPayload,
  SaveNavigationPayload,
} from '@/features/access-control/types/accessControl.types';

export const navigationApi = {
  currentMenu: async (): Promise<CurrentNavigationItem[]> => {
    const { data } = await apiClient.get<CurrentNavigationItem[]>('/api/admin/navigation/me');
    return data;
  },

  currentRoutes: async (): Promise<CurrentNavigationRoute[]> => {
    const { data } = await apiClient.get<CurrentNavigationRoute[]>('/api/admin/navigation/me/routes');
    if (!Array.isArray(data)) throw new Error('Invalid current navigation route response');
    return data;
  },

  managementList: async (): Promise<NavigationManagementItem[]> => {
    const { data } = await apiClient.get<NavigationManagementItem[]>('/api/admin/navigation');
    return data;
  },

  create: async (payload: SaveNavigationPayload): Promise<NavigationManagementItem> => {
    const { data } = await apiClient.post<NavigationManagementItem>('/api/admin/navigation', payload);
    return data;
  },

  update: async (id: string, payload: SaveNavigationPayload): Promise<void> => {
    await apiClient.put(`/api/admin/navigation/${id}`, payload);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/admin/navigation/${id}`);
  },

  reorder: async (payload: NavigationReorderPayload): Promise<void> => {
    await apiClient.post('/api/admin/navigation/reorder', payload);
  },

  setEnabled: async (id: string, enabled: boolean): Promise<void> => {
    await apiClient.post(`/api/admin/navigation/${id}/${enabled ? 'enable' : 'disable'}`);
  },
};
