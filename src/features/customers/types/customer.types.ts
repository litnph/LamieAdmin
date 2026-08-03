import type { OrderListItemDto, OrderStatus } from '@/features/orders/types/order.types';

export type CustomerSummary = {
  id: string;
  name: string;
  phone: string;
  orderCount: number;
  paidOrderCount: number;
  totalSpent: number;
  latestOrder: OrderListItemDto;
  lastPurchaseAt: string | null;
};

export type CustomerAddress = {
  address: string;
  orderId: string;
  orderCode: string;
  deliveryAt: string;
};

export type CustomerDetail = CustomerSummary & {
  email?: string | null;
  notes?: string | null;
  orders: OrderListItemDto[];
  addresses: CustomerAddress[];
};

export type CustomerOrderNote = {
  id: string;
  orderId: string;
  orderCode: string;
  createdAt: string;
  label: 'Nội dung đơn' | 'Mô tả đơn';
  content: string;
};

export type CustomerOrderNotesResult = {
  items: CustomerOrderNote[];
  failedCount: number;
};

export type CustomerListQuery = {
  search?: string;
  orderStatus?: OrderStatus;
  page: number;
  pageSize: number;
};

export type PagedCustomers = {
  items: CustomerSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};
