import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateFinancialReport } from '../../src/features/reports/domain/reportCalculations.ts';
import type { ReportFilters, ReportingDataset } from '../../src/features/reports/types/reporting.types.ts';

const filters = (date: string): ReportFilters => ({
  tab: 'overview', from: date, to: date, groupBy: 'day', compare: false,
  orderStatus: 'all', paymentStatus: 'all', paymentMethod: 'all', expenseCategory: 'all', channel: 'all',
});

const baseDataset = (): ReportingDataset => ({ generatedAt: '2026-09-15T12:00:00+07:00', orders: [], payments: [], expenses: [] });

test('đặt cọc: dòng tiền đi trước doanh thu và trả trước về 0 sau khi giao', () => {
  const dataset = baseDataset();
  dataset.orders.push({
    id: 'order-1', code: 'T-001', customerName: 'Khách A', createdAt: '2026-09-09T09:00:00+07:00',
    expectedDeliveryAt: '2026-09-13T10:00:00+07:00', completedAt: '2026-09-13T10:00:00+07:00',
    productRevenueAfterDiscount: 1_000_000, shippingFeeCharged: 200_000, status: 'completed',
    channel: 'Cửa hàng', productLine: 'Hoa tươi', category: 'Hoa bó',
  });
  dataset.payments.push(
    { id: 'pay-1', orderId: 'order-1', paidAt: '2026-09-10T09:00:00+07:00', amount: 400_000, kind: 'deposit', method: 'bank_transfer', status: 'succeeded' },
    { id: 'pay-2', orderId: 'order-1', paidAt: '2026-09-13T10:00:00+07:00', amount: 800_000, kind: 'remainder', method: 'cash', status: 'succeeded' },
  );

  const september10 = calculateFinancialReport(dataset, filters('2026-09-10'));
  assert.equal(september10.metrics.cashIn.value, 400_000);
  assert.equal(september10.metrics.recognizedRevenue.value, 0);
  assert.equal(september10.metrics.customerAdvance.value, 400_000);

  const september13 = calculateFinancialReport(dataset, filters('2026-09-13'));
  assert.equal(september13.metrics.recognizedRevenue.value, 1_200_000);
  assert.equal(september13.metrics.cashIn.value, 800_000);
  assert.equal(september13.metrics.customerAdvance.value, 0);
  assert.equal(september13.metrics.receivables.value, 0);
});

test('thanh toán toàn bộ trước: ghi dòng tiền ngày trả và doanh thu ngày giao', () => {
  const dataset = baseDataset();
  dataset.orders.push({
    id: 'order-2', code: 'T-002', customerName: 'Khách B', createdAt: '2026-09-09T09:00:00+07:00',
    expectedDeliveryAt: '2026-09-13T10:00:00+07:00', completedAt: '2026-09-13T10:00:00+07:00',
    productRevenueAfterDiscount: 1_000_000, shippingFeeCharged: 0, status: 'completed',
    channel: 'Website', productLine: 'Hoa tươi', category: 'Giỏ hoa',
  });
  dataset.payments.push({ id: 'pay-3', orderId: 'order-2', paidAt: '2026-09-10T09:00:00+07:00', amount: 1_000_000, kind: 'full', method: 'bank_transfer', status: 'succeeded' });

  const september10 = calculateFinancialReport(dataset, filters('2026-09-10'));
  assert.equal(september10.metrics.cashIn.value, 1_000_000);
  assert.equal(september10.metrics.recognizedRevenue.value, 0);
  assert.equal(september10.metrics.customerAdvance.value, 1_000_000);

  const september13 = calculateFinancialReport(dataset, filters('2026-09-13'));
  assert.equal(september13.metrics.recognizedRevenue.value, 1_000_000);
  assert.equal(september13.metrics.cashIn.value, 0);
  assert.equal(september13.metrics.customerAdvance.value, 0);
});

test('chi phí dùng incurredAt cho hiệu quả kinh doanh và paidAt cho dòng tiền', () => {
  const dataset = baseDataset();
  dataset.expenses.push({
    id: 'expense-1', categoryId: 'operations', categoryName: 'Vận hành', description: 'Bảo trì', amount: 300_000,
    incurredAt: '2026-09-13T08:00:00+07:00', paidAt: '2026-09-15T09:00:00+07:00', vendor: 'Nhà cung cấp',
    method: 'bank_transfer', orderId: null, scope: 'operating',
  });

  const september13 = calculateFinancialReport(dataset, filters('2026-09-13'));
  assert.equal(september13.metrics.recognizedExpenses.value, 300_000);
  assert.equal(september13.metrics.cashOut.value, 0);

  const september15 = calculateFinancialReport(dataset, filters('2026-09-15'));
  assert.equal(september15.metrics.recognizedExpenses.value, 0);
  assert.equal(september15.metrics.cashOut.value, 300_000);
});

test('hoàn doanh thu hợp lệ giảm cả doanh thu và tổng giá trị còn phải thu', () => {
  const dataset = baseDataset();
  dataset.orders.push({
    id: 'order-refund', code: 'T-003', customerName: 'Khách C', createdAt: '2026-09-09T09:00:00+07:00',
    expectedDeliveryAt: '2026-09-11T10:00:00+07:00', completedAt: '2026-09-11T10:00:00+07:00',
    productRevenueAfterDiscount: 1_800_000, shippingFeeCharged: 200_000, status: 'completed',
    channel: 'Cửa hàng', productLine: 'Hoa nhập khẩu', category: 'Kệ hoa',
  });
  dataset.payments.push(
    { id: 'pay-full', orderId: 'order-refund', paidAt: '2026-09-10T09:00:00+07:00', amount: 2_000_000, kind: 'full', method: 'bank_transfer', status: 'succeeded' },
    { id: 'pay-refund', orderId: 'order-refund', paidAt: '2026-09-12T09:00:00+07:00', amount: 200_000, kind: 'refund', method: 'bank_transfer', status: 'succeeded', affectsRecognizedRevenue: true },
  );

  const report = calculateFinancialReport(dataset, { ...filters('2026-09-12'), from: '2026-09-11' });
  assert.equal(report.metrics.recognizedRevenue.value, 1_800_000);
  assert.equal(report.metrics.receivables.value, 0);
  assert.equal(report.recognizedOrders[0].recognitionDates.includes('2026-09-12'), true);
});
