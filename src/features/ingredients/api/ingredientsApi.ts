import { apiClient } from '@/services/apiClient';
import type {
  CatalogListQuery,
  IngredientDemandQuery,
  IngredientDemandReportDto,
  IngredientDto,
  IngredientListQuery,
  MeasurementUnitDto,
  PagedResult,
  SaveIngredientRequest,
  SaveMeasurementUnitRequest,
} from '../types/ingredient.types';

const compactParams = (value: Record<string, unknown>) => Object.fromEntries(
  Object.entries(value).filter(([, item]) => item !== undefined && item !== ''),
);

type CatalogSelectorQuery = Omit<CatalogListQuery, 'page' | 'pageSize'>;

const collectCatalogPages = async <T>(
  loadPage: (query: CatalogListQuery) => Promise<PagedResult<T>>,
  query: CatalogSelectorQuery,
): Promise<T[]> => {
  const byId = new Map<number, T>();
  let page = 1;

  while (true) {
    const result = await loadPage({ ...query, page, pageSize: 100 });
    result.items.forEach((item) => {
      const id = (item as { id?: unknown }).id;
      if (typeof id === 'number') byId.set(id, item);
    });

    if (!result.hasNext || page >= result.totalPages) break;
    page += 1;
  }

  return Array.from(byId.values());
};

const listMeasurementUnits = async (query: CatalogListQuery): Promise<PagedResult<MeasurementUnitDto>> => {
  const { data } = await apiClient.get<PagedResult<MeasurementUnitDto>>('/api/settings/measurement-units', {
    params: compactParams(query),
  });
  return data;
};

const listIngredients = async (query: IngredientListQuery): Promise<PagedResult<IngredientDto>> => {
  const { data } = await apiClient.get<PagedResult<IngredientDto>>('/api/settings/ingredients', {
    params: compactParams(query),
  });
  return data;
};

export const measurementUnitsApi = {
  list: listMeasurementUnits,

  listAll: (query: CatalogSelectorQuery): Promise<MeasurementUnitDto[]> =>
    collectCatalogPages(listMeasurementUnits, query),

  create: async (payload: SaveMeasurementUnitRequest): Promise<{ id: number }> => {
    const { data } = await apiClient.post<{ id: number }>('/api/settings/measurement-units', payload);
    return data;
  },

  update: async (id: number, payload: SaveMeasurementUnitRequest): Promise<void> => {
    await apiClient.put(`/api/settings/measurement-units/${id}`, payload);
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/settings/measurement-units/${id}`);
  },
};

export const ingredientsApi = {
  list: listIngredients,

  listAll: (query: CatalogSelectorQuery): Promise<IngredientDto[]> =>
    collectCatalogPages(listIngredients, query),

  getById: async (id: number): Promise<IngredientDto> => {
    const { data } = await apiClient.get<IngredientDto>(`/api/settings/ingredients/${id}`);
    return data;
  },

  create: async (payload: SaveIngredientRequest): Promise<{ id: number }> => {
    const { data } = await apiClient.post<{ id: number }>('/api/settings/ingredients', payload);
    return data;
  },

  update: async (id: number, payload: SaveIngredientRequest): Promise<void> => {
    await apiClient.put(`/api/settings/ingredients/${id}`, payload);
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/settings/ingredients/${id}`);
  },
};

export const ingredientDemandApi = {
  get: async (query: IngredientDemandQuery): Promise<IngredientDemandReportDto> => {
    const { data } = await apiClient.get<IngredientDemandReportDto>('/api/reports/ingredient-demand', {
      params: {
        from: query.from,
        to: query.to,
        statuses: query.statuses.join(','),
        page: query.page,
        pageSize: query.pageSize,
      },
    });
    return data;
  },
};
