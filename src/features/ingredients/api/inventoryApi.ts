import { apiClient } from '@/services/apiClient';
import type {
  CreateStockReceiptPayload,
  CreateStockAdjustment,
  CreateStockIssue,
  InventoryListQuery,
  InventoryItem,
  InventoryStockUnit,
  PagedInventory,
  PagedReplenishmentTasks,
  PagedStockTransactions,
  SaveInventoryStockUnit,
  SaveInventoryItem,
  StockReceipt,
  StockTransaction,
} from '../types/inventory.types';

const compact = (value: Record<string, unknown>) => Object.fromEntries(
  Object.entries(value).filter(([, item]) => item !== undefined && item !== ''),
);

const list = async (query: InventoryListQuery): Promise<PagedInventory> => {
  const { data } = await apiClient.get<PagedInventory>('/api/inventory/stock-units', { params: compact(query) });
  return data;
};

export const inventoryApi = {
  list,

  replenishmentTasks: async (query: Pick<InventoryListQuery, 'search' | 'page' | 'pageSize'>): Promise<PagedReplenishmentTasks> => {
    const { data } = await apiClient.get<PagedReplenishmentTasks>('/api/inventory/replenishment-tasks', { params: compact(query) });
    return data;
  },

  listItems: async (includeInactive = false): Promise<InventoryItem[]> => {
    const { data } = await apiClient.get<InventoryItem[]>('/api/inventory/items', { params: { includeInactive } });
    return data;
  },

  createItem: async (payload: SaveInventoryItem): Promise<InventoryItem> => {
    const { data } = await apiClient.post<InventoryItem>('/api/inventory/items', payload);
    return data;
  },

  updateItem: async (id: string, payload: SaveInventoryItem): Promise<InventoryItem> => {
    const { data } = await apiClient.put<InventoryItem>(`/api/inventory/items/${id}`, payload);
    return data;
  },

  listAll: async (includeInactive = false): Promise<InventoryStockUnit[]> => {
    const result: InventoryStockUnit[] = [];
    let page = 1;
    while (true) {
      const current = await list({ includeInactive, page, pageSize: 100 });
      result.push(...current.items);
      if (!current.hasNext) break;
      page += 1;
    }
    return result;
  },

  getIngredientStockUnits: async (ingredientId: number): Promise<InventoryStockUnit[]> => {
    const { data } = await apiClient.get<InventoryStockUnit[]>(`/api/inventory/ingredients/${ingredientId}/stock-units`);
    return data;
  },

  saveIngredientStockUnits: async (ingredientId: number, items: SaveInventoryStockUnit[]): Promise<InventoryStockUnit[]> => {
    const { data } = await apiClient.put<InventoryStockUnit[]>(`/api/inventory/ingredients/${ingredientId}/stock-units`, { items });
    return data;
  },

  getItemStockUnits: async (inventoryItemId: string): Promise<InventoryStockUnit[]> => {
    const { data } = await apiClient.get<InventoryStockUnit[]>(`/api/inventory/items/${inventoryItemId}/stock-units`);
    return data;
  },

  saveItemStockUnits: async (inventoryItemId: string, items: SaveInventoryStockUnit[]): Promise<InventoryStockUnit[]> => {
    const { data } = await apiClient.put<InventoryStockUnit[]>(`/api/inventory/items/${inventoryItemId}/stock-units`, { items });
    return data;
  },

  transactions: async (stockUnitId: string, page = 1, pageSize = 20): Promise<PagedStockTransactions> => {
    const { data } = await apiClient.get<PagedStockTransactions>(`/api/inventory/stock-units/${stockUnitId}/transactions`, { params: { page, pageSize } });
    return data;
  },

  createIssue: async (stockUnitId: string, payload: CreateStockIssue): Promise<StockTransaction> => {
    const { data } = await apiClient.post<StockTransaction>(`/api/inventory/stock-units/${stockUnitId}/issues`, payload);
    return data;
  },

  createAdjustment: async (stockUnitId: string, payload: CreateStockAdjustment): Promise<StockTransaction> => {
    const { data } = await apiClient.post<StockTransaction>(`/api/inventory/stock-units/${stockUnitId}/adjustments`, payload);
    return data;
  },

  createReceipt: async (payload: CreateStockReceiptPayload): Promise<StockReceipt> => {
    const form = new FormData();
    form.append('clientRequestId', payload.clientRequestId);
    form.append('receivedDate', payload.receivedDate);
    if (payload.note) form.append('note', payload.note);
    payload.items.forEach((item, index) => {
      form.append(`items[${index}].stockUnitId`, item.stockUnitId);
      form.append(`items[${index}].quantity`, String(item.quantity));
    });
    if (payload.invoice) form.append('invoice', payload.invoice);
    form.append('createExpense', String(payload.createExpense));
    if (payload.expenseCategoryId) form.append('expenseCategoryId', payload.expenseCategoryId);
    if (payload.expenseAmount != null) form.append('expenseAmount', String(payload.expenseAmount));
    const { data } = await apiClient.post<StockReceipt>('/api/inventory/receipts', form);
    return data;
  },
};
