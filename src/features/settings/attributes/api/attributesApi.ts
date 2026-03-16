import { apiClient } from '@/services/apiClient';
import type {
  AttributeName,
  AttributeItem,
  AttributeItemColor,
  CreateAttributeRequest,
  LanguageAttributeItem,
  UpdateAttributeRequest,
} from '../types/attributes.types';

const basePath = (attribute: AttributeName) => `/api/settings/attributes/${encodeURIComponent(attribute)}`;

export const AttributesApi = {
  getAll: async <T extends AttributeItem = AttributeItem>(attribute: AttributeName): Promise<T[]> => {
    const { data } = await apiClient.get(basePath(attribute));
    if (Array.isArray(data)) return data as T[];
    if (Array.isArray((data as any).items)) return (data as any).items as T[];
    if (Array.isArray((data as any).data)) return (data as any).data as T[];
    return [];
  },

  getAllLanguages: async (): Promise<LanguageAttributeItem[]> => {
    const { data } = await apiClient.get(basePath('languages'));
    if (Array.isArray(data)) return data as LanguageAttributeItem[];
    if (Array.isArray((data as any).items)) return (data as any).items as LanguageAttributeItem[];
    if (Array.isArray((data as any).data)) return (data as any).data as LanguageAttributeItem[];
    return [];
  },

  getLanguageByCode: async (code: string): Promise<LanguageAttributeItem> => {
    const { data } = await apiClient.get(`${basePath('languages')}/${encodeURIComponent(code)}`);
    return data as LanguageAttributeItem;
  },

  createLanguage: async (payload: LanguageAttributeItem): Promise<void> => {
    await apiClient.post(basePath('languages'), payload);
  },

  updateLanguage: async (payload: LanguageAttributeItem): Promise<void> => {
    await apiClient.put(basePath('languages'), payload);
  },

  removeLanguage: async (code: string): Promise<void> => {
    await apiClient.delete(`${basePath('languages')}/${encodeURIComponent(code)}`);
  },

  getById: async <T extends AttributeItem = AttributeItem>(attribute: AttributeName, id: number): Promise<T> => {
    const { data } = await apiClient.get(`${basePath(attribute)}/${id}`);
    return data as T;
  },

  create: async (attribute: AttributeName, payload: CreateAttributeRequest | CreateAttributeRequest<AttributeItemColor>): Promise<void> => {
    await apiClient.post(basePath(attribute), payload);
  },

  update: async (attribute: AttributeName, payload: UpdateAttributeRequest | UpdateAttributeRequest<AttributeItemColor>): Promise<void> => {
    await apiClient.put(basePath(attribute), payload);
  },

  remove: async (attribute: AttributeName, id: number): Promise<void> => {
    await apiClient.delete(`${basePath(attribute)}/${id}`);
  },
};

