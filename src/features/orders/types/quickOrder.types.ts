import type { CreateOrderLine } from './order.types';

export type QuickOrderAttachment = {
  clientAttachmentId: string;
  file: File;
  orderItemIndex: number;
  sortOrder: number;
};

export type QuickOrderItemDraft = CreateOrderLine & {
  productHint: string;
};

export type QuickOrderDraft = {
  clientDraftId: string;
  fingerprint: string;
  recipientName: string;
  recipientPhone: string;
  ordererName: string;
  ordererPhone: string;
  channelId: string;
  deliveryDate: string;
  deliveryStartTime: string;
  deliveryEndTime?: string;
  deliveryAddress?: string;
  items: QuickOrderItemDraft[];
  shippingFee: number;
  deposit?: number;
  sourceText: string;
  attachments: QuickOrderAttachment[];
  warnings: string[];
  validationErrors: string[];
  isValid: boolean;
  apiError?: string;
};
