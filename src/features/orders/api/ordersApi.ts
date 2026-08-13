import { apiClient } from '@/services/apiClient';
import type {
  OrderCalendarItemDto,
  OrderDeliveryLocationDto,
  OrderDetailDto,
  OrderListQuery,
  PagedOrders,
  PaymentStatus,
  OrderStatus,
  UpdateOrderLine,
  OrderImageUpload,
  CreateOrderPayload,
  BatchCreateOrderPayload,
  BatchCreateOrdersDto,
} from '../types/order.types';

const stripUndefined = (obj: object): Record<string, unknown> =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== ''));

const appendCreateOrder = (fd: FormData, payload: CreateOrderPayload, prefix = '') => {
  const field = (name: string) => `${prefix}${name}`;
  const itemField = (index: number, name: string) => `${prefix}items[${index}].${name}`;
  const imageField = (index: number, name: string) => `${prefix}images[${index}].${name}`;

  fd.append(field('ordererName'), payload.ordererName);
  fd.append(field('ordererPhone'), payload.ordererPhone);
  fd.append(field('channelId'), payload.channelId);
  fd.append(field('recipientName'), payload.recipientName);
  fd.append(field('recipientPhone'), payload.recipientPhone);
  fd.append(field('pickupAtShop'), String(payload.pickupAtShop));
  fd.append(field('provinceShipping'), String(payload.provinceShipping));
  if (payload.deliveryAddress) fd.append(field('deliveryAddress'), payload.deliveryAddress);
  if (payload.deliveryAddressDescription) fd.append(field('deliveryAddressDescription'), payload.deliveryAddressDescription);
  if (payload.deliveryLatitude != null) fd.append(field('deliveryLatitude'), String(payload.deliveryLatitude));
  if (payload.deliveryLongitude != null) fd.append(field('deliveryLongitude'), String(payload.deliveryLongitude));
  fd.append(field('deliveryAt'), payload.deliveryAt);
  if (payload.deliveryTo) fd.append(field('deliveryTo'), payload.deliveryTo);
  if (payload.depositAmount != null) fd.append(field('depositAmount'), String(payload.depositAmount));
  fd.append(field('shippingFee'), String(payload.shippingFee));
  if (payload.description) fd.append(field('description'), payload.description);
  if (payload.contentNote) fd.append(field('contentNote'), payload.contentNote);

  payload.items.forEach((item, index) => {
    if (item.productId) fd.append(itemField(index, 'productId'), item.productId);
    if (item.productSku) fd.append(itemField(index, 'productSku'), item.productSku);
    fd.append(itemField(index, 'productName'), item.productName);
    fd.append(itemField(index, 'unitPrice'), String(item.unitPrice));
    fd.append(itemField(index, 'quantity'), String(item.quantity));
    if (item.note) fd.append(itemField(index, 'note'), item.note);
    fd.append(itemField(index, 'hasCard'), String(item.hasCard));
    if (item.cardMessage) fd.append(itemField(index, 'cardMessage'), item.cardMessage);
    fd.append(itemField(index, 'hasBanner'), String(item.hasBanner));
    if (item.bannerMessage) fd.append(itemField(index, 'bannerMessage'), item.bannerMessage);
  });

  payload.imageFiles.forEach((image, index) => {
    fd.append(imageField(index, 'imageFile'), image.file);
    fd.append(imageField(index, 'orderItemIndex'), String(image.orderItemIndex));
    fd.append(imageField(index, 'sortOrder'), String(image.sortOrder));
  });
};

export const ordersApi = {
  list: async (query: OrderListQuery): Promise<PagedOrders> => {
    const { data } = await apiClient.get<PagedOrders>('/api/orders', { params: stripUndefined(query) });
    return data;
  },

  getById: async (id: string): Promise<OrderDetailDto> => {
    const { data } = await apiClient.get<OrderDetailDto>(`/api/orders/${id}`);
    return data;
  },

  create: async (payload: CreateOrderPayload): Promise<OrderDetailDto> => {
    const fd = new FormData();
    appendCreateOrder(fd, payload);

    const { data } = await apiClient.post<OrderDetailDto>('/api/orders', fd);
    return data;
  },

  createBatch: async (payloads: BatchCreateOrderPayload[]): Promise<BatchCreateOrdersDto> => {
    const fd = new FormData();
    payloads.forEach((payload, index) => {
      fd.append(`orders[${index}].clientDraftId`, payload.clientDraftId);
      appendCreateOrder(fd, payload, `orders[${index}].`);
    });
    const { data } = await apiClient.post<BatchCreateOrdersDto>('/api/orders/batch', fd);
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
      provinceShipping: boolean;
      deliveryAddress?: string;
      deliveryAddressDescription?: string;
      deliveryLatitude?: number;
      deliveryLongitude?: number;
      deliveryAt: string;
      deliveryTo?: string;
      depositAmount: number;
      shippingFee: number;
      shippingFeeActual?: number | null;
      rowVersion?: string;
      description?: string;
      contentNote?: string;
      items: UpdateOrderLine[];
      imageFiles: OrderImageUpload[];
    },
  ): Promise<OrderDetailDto> => {
    const fd = new FormData();
    fd.append('id', id);
    if (body.rowVersion) fd.append('rowVersion', body.rowVersion);
    fd.append('ordererName', body.ordererName);
    fd.append('ordererPhone', body.ordererPhone);
    fd.append('channelId', body.channelId);
    fd.append('recipientName', body.recipientName);
    fd.append('recipientPhone', body.recipientPhone);
    fd.append('pickupAtShop', String(body.pickupAtShop));
    fd.append('provinceShipping', String(body.provinceShipping));
    if (body.deliveryAddress) fd.append('deliveryAddress', body.deliveryAddress);
    if (body.deliveryAddressDescription) fd.append('deliveryAddressDescription', body.deliveryAddressDescription);
    if (body.deliveryLatitude != null) fd.append('deliveryLatitude', String(body.deliveryLatitude));
    if (body.deliveryLongitude != null) fd.append('deliveryLongitude', String(body.deliveryLongitude));
    fd.append('deliveryAt', body.deliveryAt);
    if (body.deliveryTo) fd.append('deliveryTo', body.deliveryTo);
    fd.append('depositAmount', String(body.depositAmount));
    fd.append('shippingFee', String(body.shippingFee));
    if (body.shippingFeeActual != null) fd.append('shippingFeeActual', String(body.shippingFeeActual));
    if (body.description) fd.append('description', body.description);
    if (body.contentNote) fd.append('contentNote', body.contentNote);

    body.items.forEach((item, index) => {
      if (item.id) fd.append(`items[${index}].id`, item.id);
      if (item.productId) fd.append(`items[${index}].productId`, item.productId);
      if (item.productSku) fd.append(`items[${index}].productSku`, item.productSku);
      fd.append(`items[${index}].productName`, item.productName);
      fd.append(`items[${index}].unitPrice`, String(item.unitPrice));
      fd.append(`items[${index}].quantity`, String(item.quantity));
      if (item.note) fd.append(`items[${index}].note`, item.note);
      fd.append(`items[${index}].hasCard`, String(item.hasCard));
      if (item.cardMessage) fd.append(`items[${index}].cardMessage`, item.cardMessage);
      fd.append(`items[${index}].hasBanner`, String(item.hasBanner));
      if (item.bannerMessage) fd.append(`items[${index}].bannerMessage`, item.bannerMessage);
    });
    body.imageFiles.forEach((image, index) => {
      fd.append(`images[${index}].imageFile`, image.file);
      fd.append(`images[${index}].orderItemIndex`, String(image.orderItemIndex));
      fd.append(`images[${index}].sortOrder`, String(image.sortOrder));
    });

    const { data } = await apiClient.put<OrderDetailDto>(`/api/orders/${id}`, fd);
    return data;
  },

  changeStatus: async (id: string, status: OrderStatus): Promise<void> => {
    await apiClient.patch(`/api/orders/${id}/status`, { status });
  },

  changePaymentStatus: async (id: string, status: PaymentStatus): Promise<void> => {
    await apiClient.patch(`/api/orders/${id}/payment-status`, { status });
  },

  delete: async (id: string): Promise<void> => {
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
