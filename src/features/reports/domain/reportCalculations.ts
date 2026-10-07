import type {
  CashTransactionRow,
  CategoryAmount,
  FinancialReportView,
  PaymentTransaction,
  ReceivableOrderRow,
  RecognizedOrderRow,
  RecognizedExpenseRow,
  ReportExpense,
  ReportFilters,
  ReportMetric,
  ReportOrder,
  ReportPaymentStatus,
  ReportSeriesPoint,
  ReportingDataset,
} from '../types/reporting.types.ts';

const DAY_MS = 86_400_000;
const isoDate = (value: string): string => value.slice(0, 10);
const utcDay = (value: string): number => Date.parse(`${isoDate(value)}T00:00:00Z`);
const inRange = (value: string | null, from: string, to: string): boolean => (
  Boolean(value) && isoDate(value as string) >= from && isoDate(value as string) <= to
);
const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

export const orderTotal = (order: ReportOrder): number => (
  Math.max(0, order.productRevenueAfterDiscount) + Math.max(0, order.shippingFeeCharged)
);

export const adjustedOrderTotal = (order: ReportOrder, payments: readonly PaymentTransaction[], asOf: string): number => {
  const revenueRefunds = sum(successfulPayments(payments)
    .filter((payment) => payment.orderId === order.id && payment.kind === 'refund' && payment.affectsRecognizedRevenue && isoDate(payment.paidAt) <= asOf)
    .map((payment) => Math.max(0, payment.amount)));
  return Math.max(0, orderTotal(order) - revenueRefunds);
};

export const successfulPayments = (payments: readonly PaymentTransaction[]): PaymentTransaction[] => (
  payments.filter((payment) => payment.status === 'succeeded')
);

export const netPaidForOrder = (orderId: string, payments: readonly PaymentTransaction[], asOf?: string): number => (
  sum(successfulPayments(payments)
    .filter((payment) => payment.orderId === orderId && (!asOf || isoDate(payment.paidAt) <= asOf))
    .map((payment) => payment.kind === 'refund' ? -Math.max(0, payment.amount) : Math.max(0, payment.amount)))
);

export const paymentStatusForOrder = (order: ReportOrder, payments: readonly PaymentTransaction[], asOf: string): ReportPaymentStatus => {
  const netPaid = netPaidForOrder(order.id, payments, asOf);
  const refunded = successfulPayments(payments).some((payment) => payment.orderId === order.id && payment.kind === 'refund' && isoDate(payment.paidAt) <= asOf);
  if (refunded && netPaid <= 0) return 'refunded';
  if (netPaid <= 0) return 'unpaid';
  const adjustedTotal = adjustedOrderTotal(order, payments, asOf);
  if (netPaid < adjustedTotal) return 'deposited';
  if (netPaid > adjustedTotal) return 'overpaid';
  return 'paid';
};

export const receivableForOrder = (order: ReportOrder, payments: readonly PaymentTransaction[], asOf: string): number => (
  order.status === 'cancelled' ? 0 : Math.max(0, adjustedOrderTotal(order, payments, asOf) - netPaidForOrder(order.id, payments, asOf))
);

export const customerAdvanceForOrder = (order: ReportOrder, payments: readonly PaymentTransaction[], asOf: string): number => {
  if (order.status === 'cancelled' || (order.completedAt && isoDate(order.completedAt) <= asOf)) return 0;
  return Math.max(0, netPaidForOrder(order.id, payments, asOf));
};

export const recognizedRevenueForOrder = (order: ReportOrder, payments: readonly PaymentTransaction[], from: string, to: string): number => {
  const base = order.status === 'completed' && inRange(order.completedAt, from, to) ? orderTotal(order) : 0;
  const adjustments = sum(successfulPayments(payments)
    .filter((payment) => payment.orderId === order.id
      && payment.kind === 'refund'
      && payment.affectsRecognizedRevenue === true
      && inRange(payment.paidAt, from, to))
    .map((payment) => Math.max(0, payment.amount)));
  return base - adjustments;
};

export const recognizedExpenseDate = (expense: ReportExpense, orderMap: ReadonlyMap<string, ReportOrder>): string | null => {
  if (expense.scope === 'direct' && expense.orderId) {
    const order = orderMap.get(expense.orderId);
    return order?.status === 'completed' && order.completedAt ? isoDate(order.completedAt) : null;
  }
  return isoDate(expense.incurredAt);
};

export const recognizedExpenseInRange = (
  expense: ReportExpense,
  orders: readonly ReportOrder[],
  from: string,
  to: string,
): number => {
  const date = recognizedExpenseDate(expense, new Map(orders.map((order) => [order.id, order])));
  return date && date >= from && date <= to ? Math.max(0, expense.amount) : 0;
};

const previousRange = (from: string, to: string): { from: string; to: string } => {
  const duration = Math.round((utcDay(to) - utcDay(from)) / DAY_MS) + 1;
  const previousTo = new Date(utcDay(from) - DAY_MS);
  const previousFrom = new Date(previousTo.getTime() - (duration - 1) * DAY_MS);
  return { from: previousFrom.toISOString().slice(0, 10), to: previousTo.toISOString().slice(0, 10) };
};

const changePercent = (value: number, previousValue: number): number | null => {
  if (previousValue === 0) return value === 0 ? 0 : null;
  return ((value - previousValue) / Math.abs(previousValue)) * 100;
};

const metric = (value: number, previousValue: number | null): ReportMetric => ({
  value,
  previousValue,
  changePercent: previousValue == null ? null : changePercent(value, previousValue),
});

const relevantOrders = (dataset: ReportingDataset, filters: ReportFilters): ReportOrder[] => dataset.orders.filter((order) => {
  if (filters.orderStatus !== 'all' && order.status !== filters.orderStatus) return false;
  if (filters.channel !== 'all' && order.channel !== filters.channel) return false;
  if (filters.paymentStatus !== 'all' && paymentStatusForOrder(order, dataset.payments, filters.to) !== filters.paymentStatus) return false;
  if (filters.paymentMethod !== 'all') {
    const usesMethod = successfulPayments(dataset.payments).some((payment) => payment.orderId === order.id && payment.method === filters.paymentMethod);
    if (!usesMethod) return false;
  }
  return true;
});

const relevantExpenses = (dataset: ReportingDataset, filters: ReportFilters, orderIds: ReadonlySet<string>): ReportExpense[] => (
  dataset.expenses.filter((expense) => {
    if (filters.expenseCategory !== 'all' && expense.categoryId !== filters.expenseCategory) return false;
    if (filters.paymentMethod !== 'all' && expense.method !== filters.paymentMethod) return false;
    if (expense.orderId && !orderIds.has(expense.orderId)) return false;
    return true;
  })
);

type PeriodTotals = {
  revenue: number; productRevenue: number; shippingRevenue: number; expenses: number; profit: number;
  cashIn: number; refunds: number; cashOut: number; netCash: number; completedOrders: number; averageOrderValue: number;
};

const totalsForPeriod = (
  orders: readonly ReportOrder[],
  payments: readonly PaymentTransaction[],
  expenses: readonly ReportExpense[],
  from: string,
  to: string,
): PeriodTotals => {
  const completed = orders.filter((order) => order.status === 'completed' && inRange(order.completedAt, from, to));
  const revenueAdjustments = sum(successfulPayments(payments)
    .filter((payment) => payment.kind === 'refund' && payment.affectsRecognizedRevenue && inRange(payment.paidAt, from, to))
    .map((payment) => Math.max(0, payment.amount)));
  const productRevenue = sum(completed.map((order) => Math.max(0, order.productRevenueAfterDiscount)));
  const shippingRevenue = sum(completed.map((order) => Math.max(0, order.shippingFeeCharged)));
  const revenue = productRevenue + shippingRevenue - revenueAdjustments;
  const recognizedExpenses = sum(expenses.map((expense) => recognizedExpenseInRange(expense, orders, from, to)));
  const cashIn = sum(successfulPayments(payments)
    .filter((payment) => payment.kind !== 'refund' && inRange(payment.paidAt, from, to))
    .map((payment) => Math.max(0, payment.amount)));
  const refunds = sum(successfulPayments(payments)
    .filter((payment) => payment.kind === 'refund' && inRange(payment.paidAt, from, to))
    .map((payment) => Math.max(0, payment.amount)));
  const cashOut = sum(expenses.filter((expense) => inRange(expense.paidAt, from, to)).map((expense) => Math.max(0, expense.amount)));
  return {
    revenue, productRevenue, shippingRevenue, expenses: recognizedExpenses,
    profit: revenue - recognizedExpenses,
    cashIn, refunds, cashOut, netCash: cashIn - refunds - cashOut,
    completedOrders: completed.length,
    averageOrderValue: completed.length ? revenue / completed.length : 0,
  };
};

const addDays = (date: string, days: number): string => new Date(utcDay(date) + days * DAY_MS).toISOString().slice(0, 10);
const startOfWeek = (date: string): string => {
  const current = new Date(utcDay(date));
  const offset = (current.getUTCDay() + 6) % 7;
  return addDays(date, -offset);
};
const endOfMonth = (date: string): string => {
  const [year, month] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
};
const shortDate = (date: string): string => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));

const buildBuckets = (from: string, to: string, groupBy: ReportFilters['groupBy']): Array<{ key: string; from: string; to: string; label: string }> => {
  const buckets: Array<{ key: string; from: string; to: string; label: string }> = [];
  let cursor = from;
  while (cursor <= to) {
    let bucketTo = cursor;
    if (groupBy === 'week') bucketTo = addDays(startOfWeek(cursor), 6);
    if (groupBy === 'month') bucketTo = endOfMonth(cursor);
    if (bucketTo > to) bucketTo = to;
    const label = groupBy === 'day'
      ? shortDate(cursor)
      : groupBy === 'week'
        ? `${shortDate(cursor)}–${shortDate(bucketTo)}`
        : new Intl.DateTimeFormat('vi-VN', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${cursor}T00:00:00Z`));
    buckets.push({ key: cursor, from: cursor, to: bucketTo, label });
    cursor = addDays(bucketTo, 1);
  }
  return buckets;
};

const seriesForPeriod = (
  orders: readonly ReportOrder[], payments: readonly PaymentTransaction[], expenses: readonly ReportExpense[], filters: ReportFilters,
): ReportSeriesPoint[] => buildBuckets(filters.from, filters.to, filters.groupBy).map((bucket) => ({
  key: bucket.key, label: bucket.label, from: bucket.from, to: bucket.to,
  ...totalsForPeriod(orders, payments, expenses, bucket.from, bucket.to),
}));

const groupAmounts = <T>(
  rows: readonly T[], keyOf: (row: T) => { id: string; name: string }, amountOf: (row: T) => number,
): CategoryAmount[] => {
  const grouped = new Map<string, CategoryAmount>();
  rows.forEach((row) => {
    const key = keyOf(row);
    const current = grouped.get(key.id) ?? { ...key, amount: 0, count: 0 };
    current.amount += amountOf(row);
    current.count += 1;
    grouped.set(key.id, current);
  });
  return [...grouped.values()].sort((a, b) => b.amount - a.amount);
};

export const calculateFinancialReport = (dataset: ReportingDataset, filters: ReportFilters): FinancialReportView => {
  const orders = relevantOrders(dataset, filters);
  const orderIds = new Set(orders.map((order) => order.id));
  const payments = dataset.payments.filter((payment) => orderIds.has(payment.orderId)
    && (filters.paymentMethod === 'all' || payment.method === filters.paymentMethod));
  const expenses = relevantExpenses(dataset, filters, orderIds);
  const current = totalsForPeriod(orders, payments, expenses, filters.from, filters.to);
  const previousDates = previousRange(filters.from, filters.to);
  const previous = filters.compare ? totalsForPeriod(orders, payments, expenses, previousDates.from, previousDates.to) : null;

  const recognizedOrders: RecognizedOrderRow[] = orders
    .filter((order) => recognizedRevenueForOrder(order, payments, filters.from, filters.to) !== 0)
    .map((order) => ({
      ...order,
      recognizedRevenue: recognizedRevenueForOrder(order, payments, filters.from, filters.to),
      recognitionDates: [
        ...(order.completedAt && inRange(order.completedAt, filters.from, filters.to) ? [isoDate(order.completedAt)] : []),
        ...successfulPayments(payments).filter((payment) => payment.orderId === order.id && payment.kind === 'refund' && payment.affectsRecognizedRevenue && inRange(payment.paidAt, filters.from, filters.to)).map((payment) => isoDate(payment.paidAt)),
      ],
      netPaid: netPaidForOrder(order.id, payments, filters.to),
      receivable: receivableForOrder(order, payments, filters.to),
      paymentStatus: paymentStatusForOrder(order, payments, filters.to),
    }))
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));

  const cashTransactions: CashTransactionRow[] = [
    ...successfulPayments(payments).filter((payment) => inRange(payment.paidAt, filters.from, filters.to)).map((payment) => {
      const order = orders.find((item) => item.id === payment.orderId);
      return {
        id: payment.id, occurredAt: payment.paidAt, direction: payment.kind === 'refund' ? 'out' as const : 'in' as const,
        kind: payment.kind, reference: order?.code ?? payment.orderId, counterparty: order?.customerName ?? 'Khách hàng',
        method: payment.method, amount: Math.max(0, payment.amount), status: 'succeeded' as const, note: payment.note,
      };
    }),
    ...expenses.filter((expense) => inRange(expense.paidAt, filters.from, filters.to)).map((expense) => ({
      id: `expense-${expense.id}`, occurredAt: expense.paidAt as string, direction: 'out' as const,
      kind: 'expense', reference: expense.description, counterparty: expense.vendor, method: expense.method,
      amount: Math.max(0, expense.amount), status: 'succeeded' as const, note: expense.note,
    })),
  ].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  const receivableOrders: ReceivableOrderRow[] = orders.filter((order) => order.status !== 'cancelled').map((order) => {
    const netPaid = netPaidForOrder(order.id, payments, filters.to);
    const deliveryDate = isoDate(order.completedAt ?? order.expectedDeliveryAt);
    const receivable = receivableForOrder(order, payments, filters.to);
    return {
      ...order, total: adjustedOrderTotal(order, payments, filters.to), netPaid, receivable,
      advance: customerAdvanceForOrder(order, payments, filters.to),
      paymentStatus: paymentStatusForOrder(order, payments, filters.to),
      isOverdue: receivable > 0 && deliveryDate < filters.to,
      isDueSoon: receivable > 0 && deliveryDate >= filters.to && deliveryDate <= addDays(filters.to, 3),
    };
  }).filter((order) => order.receivable > 0 || order.advance > 0)
    .sort((a, b) => a.expectedDeliveryAt.localeCompare(b.expectedDeliveryAt));

  const asOf = filters.to;
  const customerAdvance = sum(orders.map((order) => customerAdvanceForOrder(order, payments, asOf)));
  const receivables = sum(orders.map((order) => receivableForOrder(order, payments, asOf)));
  const previousAdvance = previous ? sum(orders.map((order) => customerAdvanceForOrder(order, payments, previousDates.to))) : null;
  const previousReceivables = previous ? sum(orders.map((order) => receivableForOrder(order, payments, previousDates.to))) : null;
  const margin = current.revenue === 0 ? 0 : (current.profit / current.revenue) * 100;
  const previousMargin = previous ? (previous.revenue === 0 ? 0 : (previous.profit / previous.revenue) * 100) : null;

  const orderMap = new Map(orders.map((order) => [order.id, order]));
  const recognizedExpenseRows: RecognizedExpenseRow[] = expenses.flatMap((expense) => {
    const recognizedAt = recognizedExpenseDate(expense, orderMap);
    return recognizedAt && recognizedAt >= filters.from && recognizedAt <= filters.to ? [{ ...expense, recognizedAt }] : [];
  });
  const directExpenses = sum(recognizedExpenseRows.filter((expense) => expense.scope === 'direct').map((expense) => expense.amount));
  const operatingExpenses = sum(recognizedExpenseRows.filter((expense) => expense.scope === 'operating').map((expense) => expense.amount));
  const unpaidExpenses = sum(recognizedExpenseRows.filter((expense) => !expense.paidAt).map((expense) => expense.amount));
  return {
    generatedAt: dataset.generatedAt,
    filters,
    metrics: {
      recognizedRevenue: metric(current.revenue, previous?.revenue ?? null),
      productRevenue: metric(current.productRevenue, previous?.productRevenue ?? null),
      shippingRevenue: metric(current.shippingRevenue, previous?.shippingRevenue ?? null),
      recognizedExpenses: metric(current.expenses, previous?.expenses ?? null),
      directExpenses: metric(directExpenses, null),
      operatingExpenses: metric(operatingExpenses, null),
      unpaidExpenses: metric(unpaidExpenses, null),
      profit: metric(current.profit, previous?.profit ?? null),
      marginPercent: metric(margin, previousMargin),
      cashIn: metric(current.cashIn, previous?.cashIn ?? null),
      refunds: metric(current.refunds, previous?.refunds ?? null),
      cashOut: metric(current.cashOut, previous?.cashOut ?? null),
      netCash: metric(current.netCash, previous?.netCash ?? null),
      customerAdvance: metric(customerAdvance, previousAdvance),
      receivables: metric(receivables, previousReceivables),
      completedOrders: metric(current.completedOrders, previous?.completedOrders ?? null),
      averageOrderValue: metric(current.averageOrderValue, previous?.averageOrderValue ?? null),
    },
    series: seriesForPeriod(orders, payments, expenses, filters),
    recognizedOrders,
    cashTransactions,
    expenses: recognizedExpenseRows.sort((a, b) => b.incurredAt.localeCompare(a.incurredAt)),
    receivableOrders,
    revenueComposition: [
      { id: 'product', name: 'Sản phẩm/hoa', amount: current.productRevenue, count: current.completedOrders },
      { id: 'shipping', name: 'Phí giao hàng thu khách', amount: current.shippingRevenue, count: current.completedOrders },
      ...(current.productRevenue + current.shippingRevenue !== current.revenue ? [{ id: 'adjustments', name: 'Điều chỉnh/hoàn doanh thu', amount: current.revenue - current.productRevenue - current.shippingRevenue, count: 1 }] : []),
    ],
    expenseCategories: groupAmounts(recognizedExpenseRows, (expense) => ({ id: expense.categoryId, name: expense.categoryName }), (expense) => expense.amount),
    paymentMethods: groupAmounts(
      successfulPayments(payments).filter((payment) => payment.kind !== 'refund' && inRange(payment.paidAt, filters.from, filters.to)),
      (payment) => ({ id: payment.method, name: payment.method }), (payment) => payment.amount,
    ),
    assumptions: [
      'completedAt được dùng làm ngày khách thực nhận hoa trong dữ liệu mẫu.',
      'Hoàn tiền chỉ điều chỉnh doanh thu khi affectsRecognizedRevenue = true.',
      'Chi phí trực tiếp theo đơn ghi nhận vào ngày đơn hoàn tất; chi phí vận hành theo incurredAt.',
    ],
  };
};

export const filterRowsByBucket = <T extends { completedAt?: string | null; occurredAt?: string; incurredAt?: string; recognizedAt?: string }>(
  rows: readonly T[], bucket: { from: string; to: string } | null, dateField: 'completedAt' | 'occurredAt' | 'incurredAt' | 'recognizedAt',
): T[] => !bucket ? [...rows] : rows.filter((row) => inRange(row[dateField] ?? null, bucket.from, bucket.to));

export const filterRecognizedOrdersByBucket = (rows: readonly RecognizedOrderRow[], bucket: { from: string; to: string } | null): RecognizedOrderRow[] => (
  !bucket ? [...rows] : rows.filter((row) => row.recognitionDates.some((date) => inRange(date, bucket.from, bucket.to)))
);
