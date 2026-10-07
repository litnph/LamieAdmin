export type ReportTab = 'overview' | 'performance' | 'cashflow' | 'expenses' | 'receivables';
export type ReportGroupBy = 'day' | 'week' | 'month';
export type OrderLifecycleStatus = 'created' | 'producing' | 'shipping' | 'completed' | 'cancelled';
export type ReportPaymentStatus = 'unpaid' | 'deposited' | 'paid' | 'overpaid' | 'refunded';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'other';
export type PaymentKind = 'deposit' | 'remainder' | 'full' | 'refund';
export type PaymentTransactionStatus = 'succeeded' | 'failed' | 'voided';
export type ExpensePaymentStatus = 'paid' | 'unpaid';

export type ReportOrder = {
  id: string;
  code: string;
  customerName: string;
  createdAt: string;
  expectedDeliveryAt: string;
  completedAt: string | null;
  productRevenueAfterDiscount: number;
  shippingFeeCharged: number;
  status: OrderLifecycleStatus;
  channel: string;
  productLine: string;
  category: string;
};

export type PaymentTransaction = {
  id: string;
  orderId: string;
  paidAt: string;
  amount: number;
  kind: PaymentKind;
  method: PaymentMethod;
  status: PaymentTransactionStatus;
  affectsRecognizedRevenue?: boolean;
  note?: string;
};

export type ReportExpense = {
  id: string;
  categoryId: string;
  categoryName: string;
  description: string;
  amount: number;
  incurredAt: string;
  paidAt: string | null;
  vendor: string;
  method: PaymentMethod | null;
  orderId: string | null;
  scope: 'direct' | 'operating';
  evidenceUrl?: string | null;
  note?: string;
};

export type ReportingDataset = {
  generatedAt: string;
  orders: ReportOrder[];
  payments: PaymentTransaction[];
  expenses: ReportExpense[];
};

export type ReportFilters = {
  tab: ReportTab;
  from: string;
  to: string;
  groupBy: ReportGroupBy;
  compare: boolean;
  orderStatus: OrderLifecycleStatus | 'all';
  paymentStatus: ReportPaymentStatus | 'all';
  paymentMethod: PaymentMethod | 'all';
  expenseCategory: string | 'all';
  channel: string | 'all';
};

export type ReportMetric = {
  value: number;
  previousValue: number | null;
  changePercent: number | null;
};

export type ReportSeriesPoint = {
  key: string;
  label: string;
  from: string;
  to: string;
  revenue: number;
  productRevenue: number;
  shippingRevenue: number;
  expenses: number;
  profit: number;
  cashIn: number;
  refunds: number;
  cashOut: number;
  netCash: number;
};

export type RecognizedOrderRow = ReportOrder & {
  recognizedRevenue: number;
  recognitionDates: string[];
  netPaid: number;
  receivable: number;
  paymentStatus: ReportPaymentStatus;
};

export type RecognizedExpenseRow = ReportExpense & { recognizedAt: string };

export type CashTransactionRow = {
  id: string;
  occurredAt: string;
  direction: 'in' | 'out';
  kind: string;
  reference: string;
  counterparty: string;
  method: PaymentMethod | null;
  amount: number;
  status: 'succeeded' | 'unpaid';
  note?: string;
};

export type ReceivableOrderRow = ReportOrder & {
  total: number;
  netPaid: number;
  receivable: number;
  advance: number;
  paymentStatus: ReportPaymentStatus;
  isOverdue: boolean;
  isDueSoon: boolean;
};

export type CategoryAmount = { id: string; name: string; amount: number; count: number };

export type FinancialReportView = {
  generatedAt: string;
  filters: ReportFilters;
  metrics: {
    recognizedRevenue: ReportMetric;
    productRevenue: ReportMetric;
    shippingRevenue: ReportMetric;
    recognizedExpenses: ReportMetric;
    directExpenses: ReportMetric;
    operatingExpenses: ReportMetric;
    unpaidExpenses: ReportMetric;
    profit: ReportMetric;
    marginPercent: ReportMetric;
    cashIn: ReportMetric;
    refunds: ReportMetric;
    cashOut: ReportMetric;
    netCash: ReportMetric;
    customerAdvance: ReportMetric;
    receivables: ReportMetric;
    completedOrders: ReportMetric;
    averageOrderValue: ReportMetric;
  };
  series: ReportSeriesPoint[];
  recognizedOrders: RecognizedOrderRow[];
  cashTransactions: CashTransactionRow[];
  expenses: RecognizedExpenseRow[];
  receivableOrders: ReceivableOrderRow[];
  revenueComposition: CategoryAmount[];
  expenseCategories: CategoryAmount[];
  paymentMethods: CategoryAmount[];
  assumptions: string[];
};
