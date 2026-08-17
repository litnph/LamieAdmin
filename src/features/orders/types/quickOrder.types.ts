import type { AddressResolutionDto, AdministrativeAddressValue } from './administrativeAddress.types';
import type { ChatPlatform, ChatScreenshotAnalysis } from './chatScreenshot.types';
import type { AdministrativeAddressSnapshot, CreateOrderLine } from './order.types';

export const quickOrderReviewFields = [
  'channelId',
  'ordererName',
  'ordererPhone',
  'recipientName',
  'deliveryDate',
  'deliveryStartTime',
  'deliveryEndTime',
  'deliveryTimeMode',
  'deliveryMethod',
  'recipientPhone',
  'address',
  'productHint',
  'price',
  'quantity',
  'productNote',
  'shippingFee',
  'deposit',
  'hasCard',
  'cardMessage',
  'hasBanner',
  'bannerMessage',
  'contentNote',
] as const;

export type QuickOrderReviewField = typeof quickOrderReviewFields[number];

export type QuickOrderReviewState = Record<QuickOrderReviewField, string>;

export type QuickOrderReviewErrors = Partial<Record<QuickOrderReviewField, string>>;

export type ConfirmedQuickOrderReview = {
  channelId: string;
  ordererName: string;
  ordererPhone: string;
  recipientName: string;
  deliveryDate: string;
  deliveryStartTime: string;
  deliveryEndTime?: string;
  recipientPhone: string;
  pickupAtShop: boolean;
  provinceShipping: boolean;
  address?: string;
  administrativeAddress: AdministrativeAddressValue;
  productHint: string;
  price: number;
  quantity: number;
  productNote?: string;
  shippingFee: number;
  deposit?: number;
  hasCard: boolean;
  cardMessage?: string;
  hasBanner: boolean;
  bannerMessage?: string;
  contentNote?: string;
};

export type QuickOrderAttachment = {
  clientAttachmentId: string;
  file: File;
  orderItemIndex: number;
  sortOrder: number;
};

export type QuickOrderItemDraft = CreateOrderLine & {
  productHint: string;
};

export type QuickOrderDraft = AdministrativeAddressSnapshot & {
  clientDraftId: string;
  fingerprint: string;
  recipientName: string;
  recipientPhone: string;
  ordererName: string;
  ordererPhone: string;
  channelId: string;
  pickupAtShop: boolean;
  provinceShipping: boolean;
  deliveryDate: string;
  deliveryStartTime: string;
  deliveryEndTime?: string;
  deliveryAddress?: string;
  items: QuickOrderItemDraft[];
  shippingFee: number;
  deposit?: number;
  contentNote?: string;
  sourceText: string;
  attachments: QuickOrderAttachment[];
  addressRawText?: string;
  addressConfidence?: number;
  addressWarnings: string[];
  addressUsedDefaultProvince: boolean;
  addressAnalysis?: AddressResolutionDto;
  screenshotAnalysis?: ChatScreenshotAnalysis;
  detectedPlatform?: ChatPlatform;
  detectedOrdererName?: string;
  analysisWarnings: string[];
  warnings: string[];
  validationErrors: string[];
  isValid: boolean;
  apiError?: string;
};
