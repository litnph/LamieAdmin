export enum OrderStatus {
  Created = 1,
  Producing = 2,
  Shipping = 3,
  Completed = 4,
  Cancelled = 99,
}

export enum PaymentStatus {
  Unpaid = 1,
  Deposited = 2,
  Paid = 3,
}

export enum OrderSortBy {
  DeliveryAt = 1,
  CreatedAt = 2,
  TotalAmount = 3,
}

export enum SortDirection {
  Ascending = 1,
  Descending = 2,
}

export type OrderItemDto = {
  id: string;
  productId?: string | null;
  productSku?: string | null;
  productName: string;
  thumbnailUrl?: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  note?: string | null;
  hasCard: boolean;
  cardMessage?: string | null;
  hasBanner: boolean;
  bannerMessage?: string | null;
  images?: OrderImageDto[];
};

export type OrderImageDto = {
  id: string;
  orderItemId?: string | null;
  imageUrl: string;
  sortOrder: number;
  description?: string | null;
};

export type OrderChangeLogDto = {
  id: string;
  entityName: string;
  fieldName: string;
  oldValue?: string | null;
  newValue?: string | null;
  changeType: string;
  changedById?: string | null;
  changedByName?: string | null;
  changedAt: string;
  note?: string | null;
};

export type OrderListItemDto = {
  id: string;
  orderCode: string;
  ordererName: string;
  ordererPhone: string;
  channelId: string;
  recipientName: string;
  recipientPhone: string;
  pickupAtShop: boolean;
  provinceShipping: boolean;
  deliveryAddress?: string | null;
  deliveryAt: string;
  deliveryTo?: string | null;
  depositAmount: number;
  shippingFee: number;
  shippingFeeActual?: number | null;
  subTotal: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  contentNote?: string | null;
  imageUrl?: string | null;
};

export type OrderDetailDto = OrderListItemDto & {
  deliveryAddressDescription?: string | null;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  description?: string | null;
  contentNote?: string | null;
  updatedAt?: string | null;
  rowVersion?: string | null;
  items: OrderItemDto[];
  images: OrderImageDto[];
  changeLogs: OrderChangeLogDto[];
};

export type OrderCalendarItemDto = {
  id: string;
  orderCode: string;
  recipientName: string;
  recipientPhone: string;
  deliveryAt: string;
  deliveryTo?: string | null;
  pickupAtShop: boolean;
  provinceShipping: boolean;
  deliveryAddress?: string | null;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
};

export type OrderDeliveryLocationDto = {
  id: string;
  orderCode: string;
  recipientName: string;
  deliveryAddress?: string | null;
  latitude: number;
  longitude: number;
  deliveryAt: string;
  orderStatus: OrderStatus;
};

export type PagedOrders = {
  items: OrderListItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type OrderListQuery = {
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  channelId?: string;
  deliveryFrom?: string;
  deliveryTo?: string;
  createdFrom?: string;
  createdTo?: string;
  phone?: string;
  search?: string;
  sortBy?: OrderSortBy;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
};

export type CreateOrderLine = {
  productId?: string;
  productSku?: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  note?: string;
  hasCard: boolean;
  cardMessage?: string | null;
  hasBanner: boolean;
  bannerMessage?: string | null;
};

export type UpdateOrderLine = CreateOrderLine & { id?: string };

export type OrderImageUpload = {
  file: File;
  orderItemIndex: number;
  sortOrder: number;
};

export type CreateOrderPayload = {
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
  depositAmount?: number | null;
  shippingFee: number;
  description?: string;
  contentNote?: string;
  items: CreateOrderLine[];
  imageFiles: OrderImageUpload[];
};

export type BatchCreateOrderPayload = CreateOrderPayload & {
  clientDraftId: string;
};

export type BatchCreatedOrderDto = {
  clientDraftId: string;
  orderId: string;
  orderNumber: string;
};

export type BatchCreateOrdersDto = {
  createdCount: number;
  orders: BatchCreatedOrderDto[];
};
