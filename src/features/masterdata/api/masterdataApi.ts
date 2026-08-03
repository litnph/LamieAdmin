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

type ListEnvelope<T> = T[] | { items: T[] } | { data: T[] };

const unwrapList = <T>(payload: ListEnvelope<T>): T[] => {
  if (Array.isArray(payload)) return payload;
  if ('items' in payload) return payload.items;
  return payload.data;
};

export const MasterdataApi = {
  // Languages (System)
  getLanguages: async (): Promise<Language[]> => {
    const { data } = await apiClient.get<ListEnvelope<Language>>('/api/system/languages');
    return unwrapList(data);
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
    const { data } = await apiClient.get<ListEnvelope<Tag>>('/api/masterdata/tags');
    return unwrapList(data);
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

  getColors: async (): Promise<Color[]> => {
    const { data } = await apiClient.get<Color[]>('/api/masterdata/colors');
    return data;
  },

  getCategories: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<Category[]>('/api/masterdata/categories');
    return data;
  },
};

