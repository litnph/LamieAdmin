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

export type FinancialReport = {
  period: FinancialReportPeriod;
  generatedAt: string;
  revenue: number;
  productRevenue: number;
  shippingFee: number;
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
  revenueBasis: string;
  profitBasis: string;
};

export type FinancialReportParams = {
  from: string;
  to: string;
  groupBy: 'auto' | 'day' | 'month';
  includeShippingFeeInRevenue: boolean;
};
