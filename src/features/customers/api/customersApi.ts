import axios from 'axios';
import { apiClient } from '@/services/apiClient';
import type {
  CustomerDetail,
  CustomerListQuery,
  CustomerOrderNotesResult,
  PagedCustomers,
} from '../types/customer.types';

const stripUndefined = (obj: object): Record<string, unknown> =>
  Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined && value !== ''));

export const customersApi = {
  list: async (query: CustomerListQuery): Promise<PagedCustomers> => {
    const { data } = await apiClient.get<PagedCustomers>('/api/customers', {
      params: stripUndefined(query),
    });
    return data;
  },

  getById: async (id: string): Promise<CustomerDetail | null> => {
    try {
      const { data } = await apiClient.get<CustomerDetail>(`/api/customers/${id}`);
      return data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    }
  },

  getOrderNotes: async (id: string): Promise<CustomerOrderNotesResult> => {
    const { data } = await apiClient.get<CustomerOrderNotesResult>(`/api/customers/${id}/order-notes`);
    return data;
  },

  updateNotes: async (id: string, notes: string): Promise<CustomerDetail> => {
    const { data } = await apiClient.patch<CustomerDetail>(`/api/customers/${id}/notes`, { notes });
    return data;
  },
};
