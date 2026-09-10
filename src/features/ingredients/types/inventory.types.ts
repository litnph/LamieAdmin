import type { PagedResult } from './ingredient.types';

export enum InventoryStockStatus {
  Normal = 1,
  Low = 2,
  OutOfStock = 3,
}

export enum StockTransactionType {
  Receipt = 1,
  OrderUsage = 2,
  OrderReturn = 3,
  ManualIssue = 4,
  Adjustment = 5,
}

export type InventoryStockUnit = {
  id: string;
  inventoryItemId: string;
  inventoryItemCode: string;
  inventoryItemName: string;
  sizeName?: string | null;
  unitName: string;
  unitSymbol?: string | null;
  quantity: number;
  lowStockThreshold: number;
  status: InventoryStockStatus;
  isActive: boolean;
  updatedAt: string;
  rowVersion?: string | null;
};

export type InventoryItem = {
  id: string;
  code: string;
  name: string;
  measurementUnitId: number;
  unitName: string;
  unitSymbol?: string | null;
  note?: string | null;
  isActive: boolean;
  usesSizes: boolean;
  legacyIngredientId?: number | null;
  stockUnits: InventoryStockUnit[];
  updatedAt: string;
  rowVersion?: string | null;
};

export type SaveInventoryItem = {
  code: string;
  name: string;
  measurementUnitId: number;
  note?: string | null;
  isActive: boolean;
  stockUnits: SaveInventoryStockUnit[];
};

export type InventoryListQuery = {
  search?: string;
  status?: InventoryStockStatus;
  includeInactive?: boolean;
  page: number;
  pageSize: number;
};

export type SaveInventoryStockUnit = {
  id?: string;
  sizeName?: string | null;
  lowStockThreshold: number;
  isActive: boolean;
};

export type StockTransaction = {
  id: string;
  stockUnitId: string;
  type: StockTransactionType;
  quantityDelta: number;
  balanceAfter: number;
  receiptId?: string | null;
  receiptNumber?: string | null;
  orderId?: string | null;
  orderCode?: string | null;
  note?: string | null;
  createdAt: string;
};

export type ReceiptLineDraft = { stockUnitId: string; quantity: number };

export type CreateStockReceiptPayload = {
  clientRequestId: string;
  receivedDate: string;
  note?: string | null;
  items: ReceiptLineDraft[];
  invoice?: File | null;
  createExpense: boolean;
  expenseCategoryId?: string | null;
  expenseAmount?: number | null;
};

export type StockReceipt = {
  id: string;
  receiptNumber: string;
  clientRequestId: string;
  receivedDate: string;
  note?: string | null;
  invoiceUrl?: string | null;
  invoiceFileName?: string | null;
  expenseId?: string | null;
  items: Array<{
    id: string;
    stockUnitId: string;
    inventoryItemId: string;
    inventoryItemCode: string;
    inventoryItemName: string;
    sizeName?: string | null;
    unitName: string;
    unitSymbol?: string | null;
    quantity: number;
  }>;
  createdAt: string;
};

export type PagedInventory = PagedResult<InventoryStockUnit>;
export type PagedStockTransactions = PagedResult<StockTransaction>;

export type CreateStockIssue = {
  clientRequestId: string;
  quantity: number;
  note?: string | null;
  rowVersion?: string | null;
};

export type CreateStockAdjustment = {
  clientRequestId: string;
  countedQuantity: number;
  note?: string | null;
  rowVersion?: string | null;
};

export type ReplenishmentTask = {
  id: string;
  stockUnitId: string;
  inventoryItemId: string;
  inventoryItemCode: string;
  inventoryItemName: string;
  sizeName?: string | null;
  unitName: string;
  unitSymbol?: string | null;
  currentQuantity: number;
  lowStockThreshold: number;
  stockStatus: InventoryStockStatus;
  updatedAt: string;
};

export type PagedReplenishmentTasks = PagedResult<ReplenishmentTask> & {
  pendingCount: number;
};
