import { apiClient } from '@/services/apiClient';
import type {
  CreateOrderLine,
  OrderCalendarItemDto,
  OrderDeliveryLocationDto,
  OrderDetailDto,
  OrderListQuery,
  PagedOrders,
  PaymentStatus,
  OrderStatus,
  UpdateOrderLine,
} from '../types/order.types';

const stripUndefined = <T extends Record<string, unknown>>(obj: T): Record<string, unknown> =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== ''));

export const ordersApi = {
  list: async (query: OrderListQuery): Promise<PagedOrders> => {
    const { data } = await apiClient.get<PagedOrders>('/api/orders', { params: stripUndefined(query as any) });
    return data;
  },

  getById: async (id: string): Promise<OrderDetailDto> => {
    const { data } = await apiClient.get<OrderDetailDto>(`/api/orders/${id}`);
    return data;
  },

  create: async (payload: {
    ordererName: string;
    ordererPhone: string;
    channelId: string;
    recipientName: string;
    recipientPhone: string;
    pickupAtShop: boolean;
    deliveryAddress?: string;
    deliveryLatitude?: number;
    deliveryLongitude?: number;
    deliveryAt: string;
    depositAmount: number;
    shippingFee: number;
    description?: string;
    contentNote?: string;
    items: CreateOrderLine[];
    imageFiles: File[];
  }): Promise<OrderDetailDto> => {
    const fd = new FormData();
    fd.append('ordererName', payload.ordererName);
    fd.append('ordererPhone', payload.ordererPhone);
    fd.append('channelId', payload.channelId);
    fd.append('recipientName', payload.recipientName);
    fd.append('recipientPhone', payload.recipientPhone);
    fd.append('pickupAtShop', String(payload.pickupAtShop));
    if (payload.deliveryAddress) fd.append('deliveryAddress', payload.deliveryAddress);
    if (payload.deliveryLatitude != null) fd.append('deliveryLatitude', String(payload.deliveryLatitude));
    if (payload.deliveryLongitude != null) fd.append('deliveryLongitude', String(payload.deliveryLongitude));
    fd.append('deliveryAt', payload.deliveryAt);
    fd.append('depositAmount', String(payload.depositAmount));
    fd.append('shippingFee', String(payload.shippingFee));
    if (payload.description) fd.append('description', payload.description);
    if (payload.contentNote) fd.append('contentNote', payload.contentNote);

    payload.items.forEach((item, i) => {
      if (item.productId) fd.append(`items[${i}].productId`, item.productId);
      if (item.productSku) fd.append(`items[${i}].productSku`, item.productSku);
      fd.append(`items[${i}].productName`, item.productName);
      fd.append(`items[${i}].unitPrice`, String(item.unitPrice));
      fd.append(`items[${i}].quantity`, String(item.quantity));
      if (item.note) fd.append(`items[${i}].note`, item.note);
    });

    payload.imageFiles.forEach((file, i) => {
      fd.append(`images[${i}].imageFile`, file);
      fd.append(`images[${i}].sortOrder`, String(i));
    });

    const { data } = await apiClient.post<OrderDetailDto>('/api/orders', fd);
    return data;
  },

  update: async (
    id: string,
    body: {
      ordererName: string;
      ordererPhone: string;
      channelId: string;
      recipientName: string;
      recipientPhone: string;
      pickupAtShop: boolean;
      deliveryAddress?: string;
      deliveryLatitude?: number;
      deliveryLongitude?: number;
      deliveryAt: string;
      depositAmount: number;
      shippingFee: number;
      shippingFeeActual?: number | null;
      description?: string;
      contentNote?: string;
      items: UpdateOrderLine[];
    },
  ): Promise<OrderDetailDto> => {
    const { data } = await apiClient.put<OrderDetailDto>(`/api/orders/${id}`, { ...body, id });
    return data;
  },

  changeStatus: async (id: string, status: OrderStatus): Promise<void> => {
    await apiClient.patch(`/api/orders/${id}/status`, { status });
  },

  changePaymentStatus: async (id: string, status: PaymentStatus): Promise<void> => {
    await apiClient.patch(`/api/orders/${id}/payment-status`, { status });
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/orders/${id}`);
  },

  calendar: async (date: string): Promise<OrderCalendarItemDto[]> => {
    const { data } = await apiClient.get<OrderCalendarItemDto[]>('/api/orders/calendar', { params: { date } });
    return data;
  },

  calendarLocations: async (date: string): Promise<OrderDeliveryLocationDto[]> => {
    const { data } = await apiClient.get<OrderDeliveryLocationDto[]>('/api/orders/calendar/locations', {
      params: { date },
    });
    return data;
  },
};
