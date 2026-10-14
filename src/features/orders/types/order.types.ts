export enum OrderStatus {
  Created = 1,
  Producing = 2,
  Shipping = 3,
  Completed = 4,
  Confirmed = 5,
  Ready = 6,
  Delivered = 7,
  DeliveryFailed = 8,
  Cancelled = 99,
}

export type FulfillmentType = 'pickup' | 'local-delivery' | 'province-delivery';
export type OrderTrackingGroup = 'late' | 'today' | 'upcoming' | 'delivered-unpaid' | 'completed' | 'cancelled' | 'needs-schedule';
export type OrderChecklist = {
  designConfirmed: boolean;
  materialsPrepared: boolean;
  cardPrepared: boolean;
  qualityChecked: boolean;
};

export enum PaymentStatus {
  Unpaid = 1,
  Deposited = 2,
  Paid = 3,
}

export enum PaymentMethod {
  Cash = 1,
  BankTransfer = 2,
  Card = 3,
  Other = 99,
}

export enum OrderPaymentKind {
  Deposit = 1,
  Remainder = 2,
  Full = 3,
  Refund = 4,
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

export enum AdministrativeScheme {
  Current = 1,
  Legacy = 2,
}

export type AdministrativeAddressSnapshot = {
  addressScheme?: AdministrativeScheme | null;
  provinceCode?: string | null;
  provinceName?: string | null;
  districtCode?: string | null;
  districtName?: string | null;
  communeCode?: string | null;
  communeName?: string | null;
  addressDetail?: string | null;
  fullAddressSnapshot?: string | null;
};

export type OrderItemDto = {
  id: string;
  productId?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  productTypeId?: number | null;
  productTypeName?: string | null;
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
  ingredientSnapshotCapturedAt?: string | null;
  ingredientSnapshots: OrderItemIngredientSnapshotDto[];
  images?: OrderImageDto[];
};

export type OrderItemIngredientSnapshotDto = {
  id: string;
  ingredientId?: number | null;
  ingredientCode: string;
  ingredientName: string;
  baseUnitCode: string;
  baseUnitName: string;
  baseUnitSymbol?: string | null;
  perProductBaseQuantity: number;
  productQuantity: number;
  totalBaseQuantity: number;
  note?: string | null;
  sortOrder: number;
  capturedAt: string;
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
  recipientName?: string | null;
  recipientPhone?: string | null;
  channelName?: string | null;
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
  productSummary: string;
  paidAmount: number;
  remainingAmount: number;
  paymentHistoryIncomplete: boolean;
  completedAt?: string | null;
  deliveredAt?: string | null;
  paidInFullAt?: string | null;
  preparationDate?: string | null;
  assigneeId?: string | null;
  assigneeName?: string | null;
  holdReason?: string | null;
  holdAt?: string | null;
  fulfillmentType?: FulfillmentType;
  trackingGroup?: OrderTrackingGroup;
  quantityTotal?: number;
  hasCard?: boolean;
  cardMessage?: string | null;
  hasBanner?: boolean;
  bannerMessage?: string | null;
  rowVersion?: string | null;
};

export type OrderDetailDto = OrderListItemDto & AdministrativeAddressSnapshot & {
  customerId?: string | null;
  senderName?: string;
  senderPhone?: string;
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
  materials?: OrderMaterialDto[] | null;
  paidAmount: number;
  remainingAmount: number;
  paymentHistoryIncomplete: boolean;
  payments: OrderPaymentDto[];
  completedAt?: string | null;
  shippingFeeIncurredAt?: string | null;
  shippingFeePaidAt?: string | null;
  shippingFeePaymentMethod?: PaymentMethod | null;
  checklist?: OrderChecklist;
  cancelledReason?: string | null;
};

export type OrderPaymentDto = {
  id: string;
  orderId: string;
  amount: number;
  kind: OrderPaymentKind;
  method: PaymentMethod;
  paidAt: string;
  status: number;
  note?: string | null;
  affectsRecognizedRevenue?: boolean;
  productRevenueAdjustment?: number;
  shippingRevenueAdjustment?: number;
};

export type CreateOrderPaymentPayload = {
  amount: number;
  kind: OrderPaymentKind;
  method: PaymentMethod;
  paidAt: string;
  idempotencyKey: string;
  note?: string;
  affectsRecognizedRevenue?: boolean;
  productRevenueAdjustment?: number;
  shippingRevenueAdjustment?: number;
};

export type OrderMaterialDto = {
  id: string;
  stockUnitId: string;
  inventoryItemId: string;
  inventoryItemCode: string;
  inventoryItemName: string;
  sizeName?: string | null;
  unitName: string;
  unitSymbol?: string | null;
  requiredQuantity: number;
  deductedQuantity: number;
  currentStock: number;
  stockUnitIsActive: boolean;
};

export type SaveOrderMaterialItem = { id?: string; stockUnitId: string; quantity: number };

export type OrderCalendarItemDto = {
  id: string;
  orderCode: string;
  ordererName?: string | null;
  ordererPhone?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  deliveryAt: string;
  deliveryTo?: string | null;
  preparationDate?: string | null;
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
  statusGroup?: 'incomplete' | 'all';
  fulfillmentType?: FulfillmentType;
  includeBacklog?: boolean;
  completedFrom?: string;
  completedTo?: string;
  sortBy?: OrderSortBy;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
};

export type CreateOrderLine = {
  productId?: string;
  categoryId?: number;
  productTypeId?: number;
  productSku?: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  note?: string;
  hasCard: boolean;
  cardMessage?: string | null;
  hasBanner: boolean;
  bannerMessage?: string | null;
  ingredients?: OrderLineIngredientInput[];
};

export type OrderDeliveryBoard = {
  items: OrderListItemDto[];
  summary: {
    orderCount: number;
    todayCount: number;
    lateTodayCount: number;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    overdueBeforeTodayCount: number;
    lateCount?: number;
    undeliveredTodayCount?: number;
    upcomingCount?: number;
    deliveredUnpaidCount?: number;
    completedCount?: number;
    cancelledCount?: number;
  };
  generatedAt: string;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
};

export type OrderWorkflowCommand = {
  rowVersion?: string | null;
  reason?: string;
  assigneeId?: string | null;
  assigneeName?: string | null;
  preparationDate?: string | null;
  idempotencyKey?: string;
};

export type UpdateOrderRecipientPayload = {
  recipientName?: string | null;
  recipientPhone?: string | null;
  deliveryAddress?: string | null;
  rowVersion?: string | null;
};

export type UpdateOrderChecklistPayload = Partial<OrderChecklist> & { rowVersion?: string | null };

export type UpdateOrderAssignmentPayload = {
  assigneeId?: string | null;
  assigneeName?: string | null;
  preparationDate?: string | null;
  rowVersion?: string | null;
};

export type OrderLineIngredientInput = {
  ingredientId: number;
  baseQuantity: number;
  note?: string | null;
  sortOrder: number;
};

export type UpdateOrderLine = CreateOrderLine & { id?: string };

export type OrderImageUpload = {
  file: File;
  orderItemIndex: number;
  sortOrder: number;
};

export type CreateOrderPayload = AdministrativeAddressSnapshot & {
  ordererName: string;
  ordererPhone: string;
  customerId?: string | null;
  createMember?: boolean;
  channelId: string;
  recipientName?: string | null;
  recipientPhone?: string | null;
  senderName?: string;
  senderPhone?: string;
  pickupAtShop: boolean;
  provinceShipping: boolean;
  deliveryAddress?: string;
  deliveryAddressDescription?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  deliveryAt: string;
  deliveryTo?: string;
  depositAmount?: number | null;
  isPaid: boolean;
  confirmPaymentReceived?: boolean;
  paymentReceivedAt?: string;
  paymentMethod?: PaymentMethod;
  paymentIdempotencyKey?: string;
  shippingFee: number;
  shippingFeeActual?: number | null;
  description?: string;
  contentNote?: string;
  items: CreateOrderLine[];
  imageFiles: OrderImageUpload[];
  materials?: SaveOrderMaterialItem[];
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
