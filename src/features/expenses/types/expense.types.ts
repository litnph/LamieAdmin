export type ExpenseCategory = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  expenseCount: number;
  totalAmount: number;
};

export type Expense = {
  id: string;
  expenseCategoryId: string;
  expenseCategoryName: string;
  expenseDate: string;
  amount: number;
  description: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExpensePayload = {
  expenseCategoryId: string;
  expenseDate: string;
  amount: number;
  description: string;
  notes?: string | null;
};

export type ExpenseCategoryPayload = {
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type ExpenseListParams = {
  search?: string;
  expenseCategoryId?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
};

export type PagedExpenses = {
  items: Expense[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type ExpenseCategorySummary = {
  expenseCategoryId: string;
  expenseCategoryName: string;
  totalAmount: number;
  expenseCount: number;
};

export type ExpenseSummary = {
  from: string;
  to: string;
  totalAmount: number;
  expenseCount: number;
  averageAmount: number;
  byCategory: ExpenseCategorySummary[];
};
