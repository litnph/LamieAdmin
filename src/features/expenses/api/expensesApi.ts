import { apiClient } from '@/services/apiClient';
import type {
  Expense,
  ExpenseCategory,
  ExpenseCategoryPayload,
  ExpenseListParams,
  ExpensePayload,
  ExpenseSummary,
  PagedExpenses,
} from '../types/expense.types';

export const expenseCategoriesApi = {
  list: async (includeInactive = false): Promise<ExpenseCategory[]> => {
    const { data } = await apiClient.get<ExpenseCategory[]>('/api/expense-categories', {
      params: { includeInactive },
    });
    return data;
  },

  getById: async (id: string): Promise<ExpenseCategory> => {
    const { data } = await apiClient.get<ExpenseCategory>(`/api/expense-categories/${id}`);
    return data;
  },

  create: async (payload: ExpenseCategoryPayload): Promise<string> => {
    const { data } = await apiClient.post<{ id: string }>('/api/expense-categories', payload);
    return data.id;
  },

  update: async (id: string, payload: ExpenseCategoryPayload): Promise<void> => {
    await apiClient.put(`/api/expense-categories/${id}`, payload);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/expense-categories/${id}`);
  },
};

export const expensesApi = {
  list: async (params: ExpenseListParams): Promise<PagedExpenses> => {
    const { data } = await apiClient.get<PagedExpenses>('/api/expenses', { params });
    return data;
  },

  summary: async (from: string, to: string): Promise<ExpenseSummary> => {
    const { data } = await apiClient.get<ExpenseSummary>('/api/expenses/summary', {
      params: { from, to },
    });
    return data;
  },

  getById: async (id: string): Promise<Expense> => {
    const { data } = await apiClient.get<Expense>(`/api/expenses/${id}`);
    return data;
  },

  create: async (payload: ExpensePayload): Promise<string> => {
    const { data } = await apiClient.post<{ id: string }>('/api/expenses', payload);
    return data.id;
  },

  update: async (id: string, payload: ExpensePayload): Promise<void> => {
    await apiClient.put(`/api/expenses/${id}`, payload);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/expenses/${id}`);
  },
};
