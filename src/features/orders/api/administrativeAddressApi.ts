import { apiClient } from '@/services/apiClient';
import { AdministrativeScheme } from '../types/order.types';
import type {
  AddressResolutionDto,
  AdministrativeTransitionDto,
  AdministrativeUnitDto,
} from '../types/administrativeAddress.types';

const schemeQuery = (scheme: AdministrativeScheme) =>
  scheme === AdministrativeScheme.Current ? 'current' : 'legacy';

export const administrativeAddressApi = {
  provinces: async (scheme: AdministrativeScheme): Promise<AdministrativeUnitDto[]> => {
    const { data } = await apiClient.get<AdministrativeUnitDto[]>('/api/admin/administrative-units/provinces', {
      params: { scheme: schemeQuery(scheme) },
    });
    return data;
  },

  children: async (
    parentCode: string,
    scheme: AdministrativeScheme,
    query?: string,
  ): Promise<AdministrativeUnitDto[]> => {
    const { data } = await apiClient.get<AdministrativeUnitDto[]>(
      `/api/admin/administrative-units/${encodeURIComponent(parentCode)}/children`,
      { params: { scheme: schemeQuery(scheme), query: query?.trim() || undefined, limit: 100 } },
    );
    return data;
  },

  resolve: async (
    text: string,
    preferredScheme?: AdministrativeScheme,
    signal?: AbortSignal,
  ): Promise<AddressResolutionDto> => {
    const { data } = await apiClient.post<AddressResolutionDto>('/api/admin/addresses/resolve', {
      text,
      preferredScheme: preferredScheme ?? null,
    }, {
      signal,
      timeout: 15_000,
    });
    return data;
  },

  transitions: async (legacyCode: string): Promise<AdministrativeTransitionDto[]> => {
    const { data } = await apiClient.get<AdministrativeTransitionDto[]>(
      `/api/admin/administrative-units/transitions/${encodeURIComponent(legacyCode)}`,
    );
    return data;
  },
};
