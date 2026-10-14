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
  CreateOrderPaymentPayload,
  OrderDeliveryBoard,
  OrderPaymentDto,
  PaymentMethod,
  OrderWorkflowCommand,
  UpdateOrderChecklistPayload,
  UpdateOrderAssignmentPayload,
  UpdateOrderRecipientPayload,
} from '../types/order.types';

const stripUndefined = (obj: object): Record<string, unknown> =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== ''));

const appendCreateOrder = (fd: FormData, payload: CreateOrderPayload, prefix = '') => {
  const field = (name: string) => `${prefix}${name}`;
  const itemField = (index: number, name: string) => `${prefix}items[${index}].${name}`;
  const imageField = (index: number, name: string) => `${prefix}images[${index}].${name}`;

  fd.append(field('ordererName'), payload.ordererName);
  fd.append(field('ordererPhone'), payload.ordererPhone);
  if (payload.customerId) fd.append(field('customerId'), payload.customerId);
  if (payload.createMember !== undefined) fd.append(field('createMember'), String(payload.createMember));
  fd.append(field('channelId'), payload.channelId);
  if (payload.recipientName) fd.append(field('recipientName'), payload.recipientName);
  if (payload.recipientPhone) fd.append(field('recipientPhone'), payload.recipientPhone);
  if (payload.senderName) fd.append(field('senderName'), payload.senderName);
  if (payload.senderPhone) fd.append(field('senderPhone'), payload.senderPhone);
  fd.append(field('pickupAtShop'), String(payload.pickupAtShop));
  fd.append(field('provinceShipping'), String(payload.provinceShipping));
  if (payload.deliveryAddress) fd.append(field('deliveryAddress'), payload.deliveryAddress);
  if (payload.deliveryAddressDescription) fd.append(field('deliveryAddressDescription'), payload.deliveryAddressDescription);
  if (payload.addressScheme != null) fd.append(field('addressScheme'), String(payload.addressScheme));
  if (payload.provinceCode) fd.append(field('provinceCode'), payload.provinceCode);
  if (payload.provinceName) fd.append(field('provinceName'), payload.provinceName);
  if (payload.districtCode) fd.append(field('districtCode'), payload.districtCode);
  if (payload.districtName) fd.append(field('districtName'), payload.districtName);
  if (payload.communeCode) fd.append(field('communeCode'), payload.communeCode);
  if (payload.communeName) fd.append(field('communeName'), payload.communeName);
  if (payload.addressDetail) fd.append(field('addressDetail'), payload.addressDetail);
  if (payload.fullAddressSnapshot) fd.append(field('fullAddressSnapshot'), payload.fullAddressSnapshot);
  if (payload.deliveryLatitude != null) fd.append(field('deliveryLatitude'), String(payload.deliveryLatitude));
  if (payload.deliveryLongitude != null) fd.append(field('deliveryLongitude'), String(payload.deliveryLongitude));
  fd.append(field('deliveryAt'), payload.deliveryAt);
  if (payload.deliveryTo) fd.append(field('deliveryTo'), payload.deliveryTo);
  if (payload.depositAmount != null) fd.append(field('depositAmount'), String(payload.depositAmount));
  fd.append(field('isPaid'), String(payload.isPaid));
  if (payload.confirmPaymentReceived !== undefined) fd.append(field('confirmPaymentReceived'), String(payload.confirmPaymentReceived));
  if (payload.paymentReceivedAt) fd.append(field('paymentReceivedAt'), payload.paymentReceivedAt);
  if (payload.paymentMethod != null) fd.append(field('paymentMethod'), String(payload.paymentMethod));
  if (payload.paymentIdempotencyKey) fd.append(field('paymentIdempotencyKey'), payload.paymentIdempotencyKey);
  fd.append(field('shippingFee'), String(payload.shippingFee));
  if (payload.shippingFeeActual != null) fd.append(field('shippingFeeActual'), String(payload.shippingFeeActual));
  if (payload.description) fd.append(field('description'), payload.description);
  if (payload.contentNote) fd.append(field('contentNote'), payload.contentNote);

  payload.items.forEach((item, index) => {
    if (item.productId) fd.append(itemField(index, 'productId'), item.productId);
    if (item.categoryId) fd.append(itemField(index, 'categoryId'), String(item.categoryId));
    if (item.productTypeId) fd.append(itemField(index, 'productTypeId'), String(item.productTypeId));
    if (item.productSku) fd.append(itemField(index, 'productSku'), item.productSku);
    fd.append(itemField(index, 'productName'), item.productName);
    fd.append(itemField(index, 'unitPrice'), String(item.unitPrice));
    fd.append(itemField(index, 'quantity'), String(item.quantity));
    if (item.note) fd.append(itemField(index, 'note'), item.note);
    fd.append(itemField(index, 'hasCard'), String(item.hasCard));
    if (item.cardMessage) fd.append(itemField(index, 'cardMessage'), item.cardMessage);
    fd.append(itemField(index, 'hasBanner'), String(item.hasBanner));
    if (item.bannerMessage) fd.append(itemField(index, 'bannerMessage'), item.bannerMessage);
    if (item.ingredients !== undefined) {
      fd.append(itemField(index, 'ingredientsSpecified'), 'true');
      item.ingredients.forEach((ingredient, ingredientIndex) => {
        const ingredientField = (name: string) => itemField(index, `ingredients[${ingredientIndex}].${name}`);
        fd.append(ingredientField('ingredientId'), String(ingredient.ingredientId));
        fd.append(ingredientField('baseQuantity'), String(ingredient.baseQuantity));
        if (ingredient.note) fd.append(ingredientField('note'), ingredient.note);
        fd.append(ingredientField('sortOrder'), String(ingredient.sortOrder));
      });
    }
  });

  payload.imageFiles.forEach((image, index) => {
    fd.append(imageField(index, 'imageFile'), image.file);
    fd.append(imageField(index, 'orderItemIndex'), String(image.orderItemIndex));
    fd.append(imageField(index, 'sortOrder'), String(image.sortOrder));
  });
  if (payload.materials !== undefined) {
    fd.append(field('materialsSpecified'), 'true');
    payload.materials.forEach((material, index) => {
      const materialField = (name: string) => field(`materials[${index}].${name}`);
      if (material.id) fd.append(materialField('id'), material.id);
      fd.append(materialField('stockUnitId'), material.stockUnitId);
      fd.append(materialField('quantity'), String(material.quantity));
    });
  }
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
      customerId?: string | null;
      createMember?: boolean;
      channelId: string;
      recipientName: string;
      recipientPhone?: string;
      senderName: string;
      senderPhone: string;
      pickupAtShop: boolean;
      provinceShipping: boolean;
      deliveryAddress?: string;
      deliveryAddressDescription?: string;
      addressScheme?: number | null;
      provinceCode?: string | null;
      provinceName?: string | null;
      districtCode?: string | null;
      districtName?: string | null;
      communeCode?: string | null;
      communeName?: string | null;
      addressDetail?: string | null;
      fullAddressSnapshot?: string | null;
      deliveryLatitude?: number;
      deliveryLongitude?: number;
      deliveryAt: string;
      deliveryTo?: string;
      depositAmount: number;
      isPaid: boolean;
      shippingFee: number;
      shippingFeeActual?: number | null;
      rowVersion?: string;
      description?: string;
      contentNote?: string;
      items: UpdateOrderLine[];
      imageFiles: OrderImageUpload[];
      materials?: import('../types/order.types').SaveOrderMaterialItem[];
    },
  ): Promise<OrderDetailDto> => {
    const fd = new FormData();
    fd.append('id', id);
    if (body.rowVersion) fd.append('rowVersion', body.rowVersion);
    fd.append('ordererName', body.ordererName);
    fd.append('ordererPhone', body.ordererPhone);
    if (body.customerId) fd.append('customerId', body.customerId);
    if (body.createMember !== undefined) fd.append('createMember', String(body.createMember));
    fd.append('channelId', body.channelId);
    fd.append('recipientName', body.recipientName);
    if (body.recipientPhone) fd.append('recipientPhone', body.recipientPhone);
    if (body.senderName) fd.append('senderName', body.senderName);
    if (body.senderPhone) fd.append('senderPhone', body.senderPhone);
    fd.append('pickupAtShop', String(body.pickupAtShop));
    fd.append('provinceShipping', String(body.provinceShipping));
    if (body.deliveryAddress) fd.append('deliveryAddress', body.deliveryAddress);
    if (body.deliveryAddressDescription) fd.append('deliveryAddressDescription', body.deliveryAddressDescription);
    if (body.addressScheme != null) fd.append('addressScheme', String(body.addressScheme));
    if (body.provinceCode) fd.append('provinceCode', body.provinceCode);
    if (body.provinceName) fd.append('provinceName', body.provinceName);
    if (body.districtCode) fd.append('districtCode', body.districtCode);
    if (body.districtName) fd.append('districtName', body.districtName);
    if (body.communeCode) fd.append('communeCode', body.communeCode);
    if (body.communeName) fd.append('communeName', body.communeName);
    if (body.addressDetail) fd.append('addressDetail', body.addressDetail);
    if (body.fullAddressSnapshot) fd.append('fullAddressSnapshot', body.fullAddressSnapshot);
    if (body.deliveryLatitude != null) fd.append('deliveryLatitude', String(body.deliveryLatitude));
    if (body.deliveryLongitude != null) fd.append('deliveryLongitude', String(body.deliveryLongitude));
    fd.append('deliveryAt', body.deliveryAt);
    if (body.deliveryTo) fd.append('deliveryTo', body.deliveryTo);
    fd.append('depositAmount', String(body.depositAmount));
    fd.append('isPaid', String(body.isPaid));
    fd.append('shippingFee', String(body.shippingFee));
    if (body.shippingFeeActual != null) fd.append('shippingFeeActual', String(body.shippingFeeActual));
    if (body.description) fd.append('description', body.description);
    if (body.contentNote) fd.append('contentNote', body.contentNote);

    body.items.forEach((item, index) => {
      if (item.id) fd.append(`items[${index}].id`, item.id);
      if (item.productId) fd.append(`items[${index}].productId`, item.productId);
      if (item.categoryId) fd.append(`items[${index}].categoryId`, String(item.categoryId));
      if (item.productTypeId) fd.append(`items[${index}].productTypeId`, String(item.productTypeId));
      if (item.productSku) fd.append(`items[${index}].productSku`, item.productSku);
      fd.append(`items[${index}].productName`, item.productName);
      fd.append(`items[${index}].unitPrice`, String(item.unitPrice));
      fd.append(`items[${index}].quantity`, String(item.quantity));
      if (item.note) fd.append(`items[${index}].note`, item.note);
      fd.append(`items[${index}].hasCard`, String(item.hasCard));
      if (item.cardMessage) fd.append(`items[${index}].cardMessage`, item.cardMessage);
      fd.append(`items[${index}].hasBanner`, String(item.hasBanner));
      if (item.bannerMessage) fd.append(`items[${index}].bannerMessage`, item.bannerMessage);
      if (item.ingredients !== undefined) {
        fd.append(`items[${index}].ingredientsSpecified`, 'true');
        item.ingredients.forEach((ingredient, ingredientIndex) => {
          const prefix = `items[${index}].ingredients[${ingredientIndex}]`;
          fd.append(`${prefix}.ingredientId`, String(ingredient.ingredientId));
          fd.append(`${prefix}.baseQuantity`, String(ingredient.baseQuantity));
          if (ingredient.note) fd.append(`${prefix}.note`, ingredient.note);
          fd.append(`${prefix}.sortOrder`, String(ingredient.sortOrder));
        });
      }
    });
    body.imageFiles.forEach((image, index) => {
      fd.append(`images[${index}].imageFile`, image.file);
      fd.append(`images[${index}].orderItemIndex`, String(image.orderItemIndex));
      fd.append(`images[${index}].sortOrder`, String(image.sortOrder));
    });
    if (body.materials !== undefined) {
      fd.append('materialsSpecified', 'true');
      body.materials.forEach((material, index) => {
        if (material.id) fd.append(`materials[${index}].id`, material.id);
        fd.append(`materials[${index}].stockUnitId`, material.stockUnitId);
        fd.append(`materials[${index}].quantity`, String(material.quantity));
      });
    }

    const { data } = await apiClient.put<OrderDetailDto>(`/api/orders/${id}`, fd);
    return data;
  },

  changeStatus: async (id: string, status: OrderStatus): Promise<void> => {
    await apiClient.patch(`/api/orders/${id}/status`, { status });
  },

  runWorkflowAction: async (
    id: string,
    action: 'confirm' | 'prepare-order' | 'start-preparation' | 'ready' | 'dispatch' | 'delivered' | 'delivery-failed' | 'retry-delivery' | 'cancel',
    payload: OrderWorkflowCommand = {},
  ): Promise<OrderDetailDto> => {
    const { data } = await apiClient.post<OrderDetailDto>(`/api/orders/${id}/actions/${action}`, payload);
    return data;
  },

  updateRecipient: async (id: string, payload: UpdateOrderRecipientPayload): Promise<OrderDetailDto> => {
    const { data } = await apiClient.patch<OrderDetailDto>(`/api/orders/${id}/recipient`, payload);
    return data;
  },

  updateChecklist: async (id: string, payload: UpdateOrderChecklistPayload): Promise<OrderDetailDto> => {
    const { data } = await apiClient.patch<OrderDetailDto>(`/api/orders/${id}/checklist`, payload);
    return data;
  },

  updateAssignment: async (id: string, payload: UpdateOrderAssignmentPayload): Promise<OrderDetailDto> => {
    const { data } = await apiClient.patch<OrderDetailDto>(`/api/orders/${id}/assignment`, payload);
    return data;
  },

  hold: async (id: string, reason: string, rowVersion?: string | null): Promise<OrderDetailDto> => {
    const { data } = await apiClient.post<OrderDetailDto>(`/api/orders/${id}/hold`, { reason, rowVersion });
    return data;
  },

  resume: async (id: string, rowVersion?: string | null): Promise<OrderDetailDto> => {
    const { data } = await apiClient.post<OrderDetailDto>(`/api/orders/${id}/resume`, { rowVersion });
    return data;
  },

  deliveryBoard: async (query: OrderListQuery): Promise<OrderDeliveryBoard> => {
    const { data } = await apiClient.get<OrderDeliveryBoard>('/api/orders/delivery-board', { params: stripUndefined(query) });
    return data;
  },

  returnToPreviousStatus: async (id: string, rowVersion?: string): Promise<void> => {
    await apiClient.patch(`/api/orders/${id}/status/previous`, { rowVersion });
  },

  overrideStatus: async (
    id: string,
    status: OrderStatus,
    rowVersion?: string | null,
    reason?: string,
  ): Promise<OrderDetailDto> => {
    const { data } = await apiClient.patch<OrderDetailDto>(`/api/orders/${id}/status/override`, {
      status,
      rowVersion,
      reason,
    });
    return data;
  },

  changePaymentStatus: async (
    id: string,
    status: PaymentStatus,
    receipt?: { amount?: number; paidAt: string; method: PaymentMethod; idempotencyKey: string; note?: string },
  ): Promise<void> => {
    await apiClient.patch(`/api/orders/${id}/payment-status`, { status, ...receipt });
  },

  listPayments: async (id: string): Promise<OrderPaymentDto[]> => {
    const { data } = await apiClient.get<OrderPaymentDto[]>(`/api/orders/${id}/payments`);
    return data;
  },

  addPayment: async (id: string, payload: CreateOrderPaymentPayload): Promise<OrderPaymentDto> => {
    const { data } = await apiClient.post<OrderPaymentDto>(`/api/orders/${id}/payments`, payload);
    return data;
  },

  updateShippingFeeActual: async (
    id: string,
    shippingFeeActual: number | null,
    payment?: { incurredAt?: string; paidAt?: string; method?: PaymentMethod; idempotencyKey?: string; rowVersion?: string | null },
  ): Promise<void> => {
    await apiClient.patch(`/api/orders/${id}/shipping-fee-actual`, { shippingFeeActual, ...payment });
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/orders/${id}`);
  },

  saveMaterials: async (
    id: string,
    items: import('../types/order.types').SaveOrderMaterialItem[],
    orderRowVersion?: string | null,
  ): Promise<import('../types/order.types').OrderMaterialDto[]> => {
    const { data } = await apiClient.put<import('../types/order.types').OrderMaterialDto[]>(
      `/api/inventory/orders/${id}/inventory-usages`,
      { items, orderRowVersion },
    );
    return data;
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
