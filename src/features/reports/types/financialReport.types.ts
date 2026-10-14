export type FinancialReportPeriod = {
  from: string;
  to: string;
  groupBy: 'day' | 'month';
  days: number;
};

export type FinancialReportPoint = {
  from: string;
  to: string;
  label: string;
  revenue: number;
  productRevenue: number;
  shippingFee: number;
  shippingFeeActual: number;
  otherExpense: number;
  expense: number;
  profit: number;
  orderCount: number;
  expenseCount: number;
};

export type FinancialReportExpenseCategory = {
  expenseCategoryId: string;
  expenseCategoryName: string;
  totalAmount: number;
  expenseCount: number;
};

export type ProductRevenueBreakdown = {
  id: number | null;
  name: string;
  revenue: number;
};

export type DailyRevenueOrder = {
  id: string;
  code: string;
  deliveryDate: string;
  completedAt: string;
  productRevenue: number;
  shippingFee: number;
  totalRevenue: number;
};

export type DailyRevenueAdjustment = {
  id: string;
  orderCode: string;
  date: string;
  occurredAt: string;
  productRevenueAdjustment: number;
  shippingRevenueAdjustment: number;
  totalAdjustment: number;
  note: string | null;
};

export type FinancialReport = {
  period: FinancialReportPeriod;
  generatedAt: string;
  revenue: number;
  productRevenue: number;
  shippingFee: number;
  shippingFeeActual: number;
  otherExpense: number;
  temporaryDifference: number;
  incompleteExpenseHistoryCount: number;
  unreconciledShippingCount?: number;
  materialProductCogs: number;
  materialWaste: number;
  isProfitProvisional: boolean;
  profitProvisionalReasons: string[];
  includeShippingFeeInRevenue: boolean;
  expense: number;
  profit: number;
  profitMarginPercent: number | null;
  orderCount: number;
  expenseCount: number;
  points: FinancialReportPoint[];
  expensesByCategory: FinancialReportExpenseCategory[];
  revenueByProductLine?: ProductRevenueBreakdown[];
  revenueByCategory?: ProductRevenueBreakdown[];
  dailyOrders?: DailyRevenueOrder[];
  dailyRevenueAdjustments?: DailyRevenueAdjustment[];
  revenueBasis: string;
  profitBasis: string;
};

export type FinancialReportParams = {
  from: string;
  to: string;
  groupBy: 'auto' | 'day' | 'month';
  includeShippingFeeInRevenue: boolean;
};

export type ManagerialFinanceSummary = {
  from: string; to: string; periodId: string | null; periodStatus: number | null;
  isProvisional: boolean; provisionalReasons: string[];
  productRevenue: number; customerShippingFee: number; actualCarrierCost: number;
  operatingExpense: number; materialProductCogs: number; materialWaste: number;
  profitBeforeTax: number; profitMarginPercent: number | null;
  openingCashBalance: number | null; cashIn: number; cashOut: number; closingCashBalance: number | null;
  supplierDebt: number; operatingExpenseDebt: number;
  materials: Array<{ group: number; openingValue: number; purchasesValue: number; endingValue: number; consumptionValue: number; wasteValue: number; productCogsValue: number; isEstimated: boolean }>;
  documents: Array<{ status: number; count: number; amount: number }>;
  taxConfigured: boolean; taxMessage: string; unreconciledShippingCount: number; incompleteExpensePaymentCount: number;
};

export type CashFlowReport = {
  period: FinancialReportPeriod;
  generatedAt: string;
  cashIn: number;
  cashOut: number;
  netCash: number;
  points: Array<{ date: string; label: string; cashIn: number; cashOut: number; netCash: number }>;
  transactions: Array<{
    id: string;
    occurredAt: string;
    direction: 'in' | 'out';
    kind: string;
    reference: string;
    deliveryDate?: string | null;
    method: string;
    amount: number;
    note?: string | null;
    needsSupplementation: boolean;
  }>;
  today: {
    date: string;
    deposits: number;
    remainders: number;
    shippingPaid: number;
    otherExpensesPaid: number;
    netCash: number;
  };
  incompleteHistoryCount: number;
};
