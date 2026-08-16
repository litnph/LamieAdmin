import type { ProductDto } from '@/features/product/api/productApi';
import { AdministrativeScheme, type BatchCreateOrderPayload } from '../types/order.types';
import type {
  ConfirmedQuickOrderReview,
  QuickOrderAttachment,
  QuickOrderDraft,
} from '../types/quickOrder.types';
import type { AddressResolutionDto } from '../types/administrativeAddress.types';
import type { ChatScreenshotAnalysis } from '../types/chatScreenshot.types';
import { validateQuickOrderFiles } from './quickOrderFiles';

const createClientId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

const normalize = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLocaleLowerCase('vi')
  .replace(/\s+/g, ' ')
  .trim();

const getProductName = (product: ProductDto) =>
  product.translations.find((translation) => translation.languageCode.toLowerCase().startsWith('vi'))?.name?.trim()
  || product.translations[0]?.name?.trim()
  || product.sku;

const matchProduct = (hint: string, products: ProductDto[]) => {
  const normalizedHint = normalize(hint);
  return products.find((product) => product.isActive && (
    normalize(product.sku) === normalizedHint
    || normalize(getProductName(product)) === normalizedHint
  ));
};

const toIso = (date: string, time: string) => new Date(`${date}T${time}`).toISOString();

const sameOptional = (left: string | null | undefined, right: string | null | undefined) =>
  (left ?? '') === (right ?? '');

const formatAdministrativeAddress = (review: ConfirmedQuickOrderReview) => {
  const address = review.administrativeAddress;
  return [
    address.detail.trim(),
    address.communeName,
    address.scheme === AdministrativeScheme.Legacy ? address.districtName : '',
    address.provinceName,
  ].filter(Boolean).join(', ');
};

const analysisMatchesVisibleAddress = (
  analysis: AddressResolutionDto | undefined,
  review: ConfirmedQuickOrderReview,
) => {
  const candidate = analysis?.selectedCandidate;
  const address = review.administrativeAddress;
  return Boolean(candidate
    && candidate.scheme === address.scheme
    && sameOptional(candidate.provinceCode, address.provinceCode)
    && sameOptional(candidate.districtCode, address.districtCode)
    && sameOptional(candidate.communeCode, address.communeCode)
    && normalize(candidate.addressDetail ?? '') === normalize(address.detail));
};

export type BuildQuickOrderDraftInput = {
  review: ConfirmedQuickOrderReview;
  sourceText: string;
  files: File[];
  products: ProductDto[];
  parserWarnings?: string[];
  addressAnalysis?: AddressResolutionDto;
  screenshotAnalysis?: ChatScreenshotAnalysis;
};

export const buildQuickOrderDraft = ({
  review,
  sourceText,
  files,
  products,
  parserWarnings = [],
  addressAnalysis,
  screenshotAnalysis,
}: BuildQuickOrderDraftInput): QuickOrderDraft => {
  const resolvedRecipientName = review.recipientName.trim();
  const resolvedOrdererName = review.ordererName.trim();
  const resolvedChannelId = review.channelId;
  const applicableAddressAnalysis = analysisMatchesVisibleAddress(addressAnalysis, review)
    ? addressAnalysis
    : undefined;
  const administrativeAddress = review.administrativeAddress;
  const hasStructuredAddress = Boolean(
    administrativeAddress.provinceCode
    && administrativeAddress.communeCode
    && (administrativeAddress.scheme === AdministrativeScheme.Current || administrativeAddress.districtCode),
  );
  const visibleFullAddress = formatAdministrativeAddress(review);
  const productHint = review.productHint.trim();
  const product = productHint ? matchProduct(productHint, products) : undefined;
  const attachments: QuickOrderAttachment[] = files.map((file, index) => ({
    clientAttachmentId: createClientId(),
    file,
    orderItemIndex: 0,
    sortOrder: index,
  }));
  const validationErrors: string[] = [];

  if (!resolvedRecipientName) validationErrors.push('Thiếu tên người nhận.');
  if (!resolvedOrdererName) validationErrors.push('Thiếu tên người đặt.');
  if (!review.recipientPhone.trim()) validationErrors.push('Thiếu số điện thoại người nhận.');
  if (!review.deliveryDate || !review.deliveryStartTime) validationErrors.push('Thiếu ngày hoặc giờ nhận hàng.');
  if (!resolvedChannelId) validationErrors.push('Chưa xác định được kênh bán.');
  if (!productHint) validationErrors.push('Chưa nhận diện được sản phẩm.');
  if (review.price <= 0) validationErrors.push('Đơn giá sản phẩm phải lớn hơn 0.');
  if (!product && productHint && attachments.length === 0) {
    validationErrors.push('Sản phẩm ngoài danh mục cần ít nhất 1 ảnh minh họa.');
  }
  validationErrors.push(...validateQuickOrderFiles(files));
  if (review.shippingFee < 0) validationErrors.push('Phí giao hàng không được âm.');
  if (review.deposit != null && review.deposit < 0) validationErrors.push('Tiền cọc không được âm.');

  const warnings = parserWarnings.filter((warning) => {
    if (product && warning.includes('chưa chọn sản phẩm')) return false;
    if (resolvedOrdererName && warning.includes('người đặt')) return false;
    return true;
  });
  if (!administrativeAddress.detail && !hasStructuredAddress) {
    warnings.push('Chưa nhận diện được mô tả địa chỉ nhận.');
  }
  if (applicableAddressAnalysis && !applicableAddressAnalysis.isConfident && applicableAddressAnalysis.selectedCandidate) {
    warnings.push('Địa chỉ đã tự chọn kết quả có điểm cao nhất nhưng cần kiểm tra lại.');
  }
  if (applicableAddressAnalysis) warnings.push(...applicableAddressAnalysis.warnings);
  if (!product && productHint && attachments.length > 0) {
    warnings.push('Sản phẩm sẽ được lưu ngoài danh mục cùng ảnh minh họa.');
  }

  const fingerprint = [
    normalize(sourceText),
    normalize(resolvedRecipientName),
    normalize(resolvedOrdererName),
    resolvedChannelId,
    review.recipientPhone,
    review.deliveryDate,
    review.deliveryStartTime,
    review.deliveryEndTime ?? '',
    String(administrativeAddress.scheme),
    normalize(administrativeAddress.detail),
    administrativeAddress.provinceCode,
    administrativeAddress.districtCode,
    administrativeAddress.communeCode,
    normalize(productHint),
    String(review.price),
    String(review.shippingFee),
    String(review.deposit ?? ''),
    normalize(review.cardMessage ?? ''),
    normalize(review.bannerMessage ?? ''),
    ...files.map((file) => `${file.name}:${file.size}:${file.lastModified}`),
  ].join('|');

  return {
    clientDraftId: createClientId(),
    fingerprint,
    recipientName: resolvedRecipientName,
    recipientPhone: review.recipientPhone.trim(),
    ordererName: resolvedOrdererName,
    ordererPhone: '',
    channelId: resolvedChannelId,
    deliveryDate: review.deliveryDate,
    deliveryStartTime: review.deliveryStartTime,
    deliveryEndTime: review.deliveryEndTime,
    deliveryAddress: hasStructuredAddress ? undefined : administrativeAddress.detail || undefined,
    addressScheme: hasStructuredAddress ? administrativeAddress.scheme : undefined,
    provinceCode: hasStructuredAddress ? administrativeAddress.provinceCode : undefined,
    provinceName: hasStructuredAddress ? administrativeAddress.provinceName : undefined,
    districtCode: hasStructuredAddress && administrativeAddress.scheme === AdministrativeScheme.Legacy
      ? administrativeAddress.districtCode
      : undefined,
    districtName: hasStructuredAddress && administrativeAddress.scheme === AdministrativeScheme.Legacy
      ? administrativeAddress.districtName
      : undefined,
    communeCode: hasStructuredAddress ? administrativeAddress.communeCode : undefined,
    communeName: hasStructuredAddress ? administrativeAddress.communeName : undefined,
    addressDetail: administrativeAddress.detail || undefined,
    fullAddressSnapshot: hasStructuredAddress ? visibleFullAddress : undefined,
    addressRawText: applicableAddressAnalysis?.originalText ?? (administrativeAddress.detail || undefined),
    addressConfidence: applicableAddressAnalysis?.confidence,
    addressWarnings: applicableAddressAnalysis?.warnings ?? [],
    addressUsedDefaultProvince: applicableAddressAnalysis?.selectedCandidate?.usedDefaultProvince ?? false,
    addressAnalysis: applicableAddressAnalysis,
    screenshotAnalysis,
    detectedPlatform: screenshotAnalysis?.detectedPlatform,
    detectedOrdererName: screenshotAnalysis?.detectedOrdererName ?? undefined,
    analysisWarnings: screenshotAnalysis?.warnings ?? [],
    items: productHint ? [{
      productId: product ? String(product.id) : undefined,
      productSku: product?.sku,
      productName: product ? getProductName(product) : productHint,
      productHint,
      unitPrice: review.price,
      quantity: 1,
      hasCard: Boolean(review.cardMessage),
      cardMessage: review.cardMessage?.trim() || null,
      hasBanner: Boolean(review.bannerMessage),
      bannerMessage: review.bannerMessage?.trim() || null,
    }] : [],
    shippingFee: review.shippingFee,
    deposit: review.deposit,
    sourceText: sourceText.trim(),
    attachments,
    warnings: [...new Set(warnings)],
    validationErrors,
    isValid: validationErrors.length === 0,
  };
};

const hasCompleteStructuredAddress = (draft: QuickOrderDraft) => Boolean(
  draft.provinceCode
  && draft.communeCode
  && (draft.addressScheme === AdministrativeScheme.Current
    || (draft.addressScheme === AdministrativeScheme.Legacy && draft.districtCode)),
);

export const toBatchCreatePayload = (draft: QuickOrderDraft): BatchCreateOrderPayload => ({
  clientDraftId: draft.clientDraftId,
  ordererName: draft.ordererName,
  ordererPhone: draft.ordererPhone,
  channelId: draft.channelId,
  recipientName: draft.recipientName,
  recipientPhone: draft.recipientPhone,
  pickupAtShop: false,
  provinceShipping: false,
  deliveryAddress: draft.deliveryAddress,
  addressScheme: hasCompleteStructuredAddress(draft) ? draft.addressScheme : undefined,
  provinceCode: hasCompleteStructuredAddress(draft) ? draft.provinceCode : undefined,
  provinceName: hasCompleteStructuredAddress(draft) ? draft.provinceName : undefined,
  districtCode: hasCompleteStructuredAddress(draft) ? draft.districtCode : undefined,
  districtName: hasCompleteStructuredAddress(draft) ? draft.districtName : undefined,
  communeCode: hasCompleteStructuredAddress(draft) ? draft.communeCode : undefined,
  communeName: hasCompleteStructuredAddress(draft) ? draft.communeName : undefined,
  addressDetail: draft.addressDetail,
  fullAddressSnapshot: draft.fullAddressSnapshot,
  deliveryAt: toIso(draft.deliveryDate, draft.deliveryStartTime),
  deliveryTo: draft.deliveryEndTime
    ? toIso(draft.deliveryDate, draft.deliveryEndTime)
    : undefined,
  depositAmount: draft.deposit,
  shippingFee: draft.shippingFee,
  items: draft.items.map((item) => ({
    productId: item.productId,
    productSku: item.productSku,
    productName: item.productName,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    note: item.note,
    hasCard: item.hasCard,
    cardMessage: item.cardMessage,
    hasBanner: item.hasBanner,
    bannerMessage: item.bannerMessage,
  })),
  imageFiles: draft.attachments.map(({ file, orderItemIndex, sortOrder }) => ({
    file,
    orderItemIndex,
    sortOrder,
  })),
});
