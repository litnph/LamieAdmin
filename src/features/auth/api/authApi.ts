import { apiClient } from '@/services/apiClient';
import type { AuthResult, AuthUser } from '../types';

export const authApi = {
  login: async (login: string, password: string): Promise<AuthResult> => {
    const { data } = await apiClient.post<AuthResult>('/api/auth/login', { login, password });
    return data;
  },

  refresh: async (refreshToken: string): Promise<AuthResult> => {
    const { data } = await apiClient.post<AuthResult>('/api/auth/refresh', { refreshToken });
    return data;
  },

  me: async (): Promise<AuthUser> => {
    const { data } = await apiClient.get<AuthUser>('/api/auth/me');
    return data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/api/auth/logout', { refreshToken });
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/api/auth/change-password', { currentPassword, newPassword });
  },
};
