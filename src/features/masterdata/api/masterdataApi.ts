import { apiClient } from '@/services/apiClient';
import type {
  Language,
  CreateLanguageRequest,
  UpdateLanguageRequest,
  Tag,
  CreateTagRequest,
  UpdateTagRequest,
  Color,
  Category,
} from '../types/masterdata.types';

export const MasterdataApi = {
  // Languages (System)
  getLanguages: async (): Promise<Language[]> => {
    const { data } = await apiClient.get('/api/system/languages');
    if (Array.isArray(data)) return data;
    if (Array.isArray((data as any).items)) return (data as any).items;
    if (Array.isArray((data as any).data)) return (data as any).data;
    return [];
  },

  createLanguage: async (payload: CreateLanguageRequest): Promise<void> => {
    await apiClient.post('/api/system/languages', payload);
  },

  updateLanguage: async (code: string, payload: UpdateLanguageRequest): Promise<void> => {
    await apiClient.put(`/api/system/languages/${encodeURIComponent(code)}`, payload);
  },

  deleteLanguage: async (code: string): Promise<void> => {
    await apiClient.delete(`/api/system/languages/${encodeURIComponent(code)}`);
  },

  // Tags (MasterData)
  getTags: async (): Promise<Tag[]> => {
    const { data } = await apiClient.get('/api/masterdata/tags');
    if (Array.isArray(data)) return data;
    if (Array.isArray((data as any).items)) return (data as any).items;
    if (Array.isArray((data as any).data)) return (data as any).data;
    return [];
  },

  createTag: async (payload: CreateTagRequest): Promise<void> => {
    await apiClient.post('/api/masterdata/tags', payload);
  },

  updateTag: async (id: number, payload: UpdateTagRequest): Promise<void> => {
    await apiClient.put(`/api/masterdata/tags/${id}`, payload);
  },

  deleteTag: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/masterdata/tags/${id}`);
  },

  // Placeholder for colors/categories until APIs are available
  getColors: async (): Promise<Color[]> => {
    const { data } = await apiClient.get<Color[]>('/api/masterdata/colors');
    return data;
  },

  getCategories: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<Category[]>('/api/masterdata/categories');
    return data;
  },
};

