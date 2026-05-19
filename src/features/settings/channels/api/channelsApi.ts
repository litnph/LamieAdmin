import { apiClient } from '@/services/apiClient';

export type ChannelDto = {
  id: string;
  code: string;
  name: string;
  iconUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
};

export const channelsApi = {
  list: async (): Promise<ChannelDto[]> => {
    const { data } = await apiClient.get<ChannelDto[]>('/api/settings/attributes/channels');
    return data;
  },

  getById: async (id: string): Promise<ChannelDto> => {
    const { data } = await apiClient.get<ChannelDto>(`/api/settings/attributes/channels/${id}`);
    return data;
  },

  create: async (payload: {
    code: string;
    name: string;
    iconUrl?: string;
    sortOrder: number;
    isActive: boolean;
  }): Promise<string> => {
    const { data } = await apiClient.post<{ id: string }>('/api/settings/attributes/channels', payload);
    return data.id;
  },

  update: async (payload: {
    id: string;
    name: string;
    iconUrl?: string;
    sortOrder: number;
    isActive: boolean;
  }): Promise<void> => {
    await apiClient.put('/api/settings/attributes/channels', payload);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/settings/attributes/channels/${id}`);
  },
};
