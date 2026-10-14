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

type ExpenseWire = Omit<Expense, 'paidAmount' | 'outstandingAmount' | 'payments'>
  & Partial<Pick<Expense, 'paidAmount' | 'outstandingAmount' | 'payments'>>;

const normalizeExpense = (expense: ExpenseWire): Expense => {
  const legacyPaidAmount = expense.paidAt ? expense.amount : 0;
  const paidAmount = expense.paidAmount ?? legacyPaidAmount;
  return {
    ...expense,
    paidAmount,
    outstandingAmount: expense.outstandingAmount ?? Math.max(0, expense.amount - paidAmount),
    payments: expense.payments ?? [],
  };
};

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
    const { data } = await apiClient.get<Omit<PagedExpenses, 'items'> & { items: ExpenseWire[] }>('/api/expenses', { params });
    return { ...data, items: data.items.map(normalizeExpense) };
  },

  summary: async (from: string, to: string): Promise<ExpenseSummary> => {
    const { data } = await apiClient.get<ExpenseSummary>('/api/expenses/summary', {
      params: { from, to },
    });
    return data;
  },

  getById: async (id: string): Promise<Expense> => {
    const { data } = await apiClient.get<ExpenseWire>(`/api/expenses/${id}`);
    return normalizeExpense(data);
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

  addPayment: async (id: string, payload: { amount: number; paidAt: string; method: number; idempotencyKey: string; note: string | null }): Promise<void> => {
    await apiClient.post(`/api/finance/expenses/${id}/payments`, payload);
  },
};
