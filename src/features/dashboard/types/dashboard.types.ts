import type { OrderListItemDto } from '@/features/orders/types/order.types';

export type DashboardPeriodKey = '7d' | '30d' | '90d';

export const DASHBOARD_PERIODS: ReadonlyArray<{
  key: DashboardPeriodKey;
  label: string;
  shortLabel: string;
  days: number;
}> = [
  { key: '7d', label: '7 ngày gần đây', shortLabel: '7 ngày', days: 7 },
  { key: '30d', label: '30 ngày gần đây', shortLabel: '30 ngày', days: 30 },
  { key: '90d', label: '90 ngày gần đây', shortLabel: '90 ngày', days: 90 },
];

export type DashboardPeriodRange = {
  key: DashboardPeriodKey;
  label: string;
  days: number;
  currentStart: string;
  currentEnd: string;
  previousStart: string;
  previousEnd: string;
};

export type RevenuePoint = {
  key: string;
  label: string;
  shortLabel: string;
  revenue: number;
  orderCount: number;
};

export type DashboardRevenueData = {
  currentRevenue: number;
  previousRevenue: number;
  paidOrderCount: number;
  points: RevenuePoint[];
};

export type DashboardDeliveryRisk = OrderListItemDto & {
  deliveryState: 'late' | 'upcoming';
};

export type DashboardActiveOrdersData = {
  awaitingConfirmationCount: number;
  preparingCount: number;
  shippingCount: number;
  needActionCount: number;
  lateDeliveryCount: number;
  upcomingDeliveryCount: number;
  attentionOrders: OrderListItemDto[];
  deliveryRisks: DashboardDeliveryRisk[];
};

export type DashboardStockProduct = {
  id: number;
  sku: string;
  name: string;
  stock: number;
  thumbnailUrl: string | null;
};

export type DashboardInventoryData = {
  lowStockCount: number;
  outOfStockCount: number;
  products: DashboardStockProduct[];
};

export type DashboardSourceKey = 'newOrders' | 'activeOrders' | 'revenue' | 'inventory';

export type DashboardSourceError = {
  source: DashboardSourceKey;
  label: string;
  message: string;
};

export type DashboardData = {
  period: DashboardPeriodRange;
  generatedAt: string;
  newOrdersCount: number | null;
  activeOrders: DashboardActiveOrdersData | null;
  revenue: DashboardRevenueData | null;
  inventory: DashboardInventoryData | null;
  sourceErrors: DashboardSourceError[];
};

