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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const unwrapList = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (!isRecord(value)) return [];
  if (Array.isArray(value.items)) return value.items as T[];
  if (Array.isArray(value.data)) return value.data as T[];
  return [];
};

export const AttributesApi = {
  getAll: async <T extends AttributeItem = AttributeItem>(attribute: AttributeName): Promise<T[]> => {
    const { data } = await apiClient.get(basePath(attribute));
    return unwrapList<T>(data);
  },

  getAllLanguages: async (): Promise<LanguageAttributeItem[]> => {
    const { data } = await apiClient.get(basePath('languages'));
    return unwrapList<LanguageAttributeItem>(data);
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

