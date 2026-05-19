import { apiClient } from '@/services/apiClient';
import type { AuthUser } from '@/features/auth/types';
import { UserRole } from '@/features/auth/types';

export const usersApi = {
  list: async (): Promise<AuthUser[]> => {
    const { data } = await apiClient.get<AuthUser[]>('/api/users');
    return data;
  },

  getById: async (id: string): Promise<AuthUser> => {
    const { data } = await apiClient.get<AuthUser>(`/api/users/${id}`);
    return data;
  },

  create: async (payload: {
    email: string;
    userName: string;
    password: string;
    fullName: string;
    phone?: string;
    role: UserRole;
    isActive: boolean;
  }): Promise<AuthUser> => {
    const { data } = await apiClient.post<AuthUser>('/api/users', payload);
    return data;
  },

  update: async (
    id: string,
    body: { fullName: string; phone?: string; role: UserRole; isActive: boolean },
  ): Promise<void> => {
    await apiClient.put(`/api/users/${id}`, { id, ...body });
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/users/${id}`);
  },

  resetPassword: async (id: string, newPassword: string): Promise<void> => {
    await apiClient.patch(`/api/users/${id}/reset-password`, { newPassword });
  },
};
