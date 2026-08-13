import type { ProductDto } from '@/features/product/api/productApi';
import type { BatchCreateOrderPayload } from '../types/order.types';
import type { QuickOrderAttachment, QuickOrderDraft } from '../types/quickOrder.types';
import type { ParsedOrderText } from './orderTextParser';

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
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const maximumImageBytes = 10 * 1024 * 1024;

export type BuildQuickOrderDraftInput = {
  parsed: ParsedOrderText;
  sourceText: string;
  recipientName: string;
  ordererName: string;
  channelId: string;
  files: File[];
  products: ProductDto[];
};

export const buildQuickOrderDraft = ({
  parsed,
  sourceText,
  recipientName,
  ordererName,
  channelId,
  files,
  products,
}: BuildQuickOrderDraftInput): QuickOrderDraft => {
  const resolvedRecipientName = recipientName.trim() || parsed.recipientName?.trim() || '';
  const resolvedOrdererName = ordererName.trim() || parsed.ordererName?.trim() || '';
  const productHint = parsed.productHint?.trim() || '';
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
  if (!parsed.phone?.trim()) validationErrors.push('Thiếu số điện thoại người nhận.');
  if (!parsed.deliveryDate || !parsed.deliveryStartTime) validationErrors.push('Thiếu ngày hoặc giờ nhận hàng.');
  if (!channelId) validationErrors.push('Chưa xác định được kênh bán.');
  if (!productHint) validationErrors.push('Chưa nhận diện được sản phẩm.');
  if (parsed.price == null || parsed.price <= 0) validationErrors.push('Đơn giá sản phẩm phải lớn hơn 0.');
  if (!product && productHint && attachments.length === 0) {
    validationErrors.push('Sản phẩm ngoài danh mục cần ít nhất 1 ảnh minh họa.');
  }
  if (attachments.length > 10) validationErrors.push('Mỗi đơn chỉ được tải tối đa 10 ảnh.');
  if (files.some((file) => !allowedImageTypes.has(file.type) || file.size <= 0 || file.size > maximumImageBytes)) {
    validationErrors.push('Ảnh phải là JPG, PNG, WEBP hoặc GIF và không vượt quá 10 MB.');
  }
  if ((parsed.shippingFee ?? 0) < 0) validationErrors.push('Phí giao hàng không được âm.');
  if (parsed.deposit != null && parsed.deposit < 0) validationErrors.push('Tiền cọc không được âm.');

  const warnings = parsed.warnings.filter((warning) => {
    if (product && warning.includes('chưa chọn sản phẩm')) return false;
    if (resolvedOrdererName && warning.includes('người đặt')) return false;
    return true;
  });
  if (!parsed.address) warnings.push('Chưa nhận diện được mô tả địa chỉ nhận.');
  if (!product && productHint && attachments.length > 0) {
    warnings.push('Sản phẩm sẽ được lưu ngoài danh mục cùng ảnh minh họa.');
  }

  const fingerprint = [
    normalize(sourceText),
    normalize(resolvedRecipientName),
    normalize(resolvedOrdererName),
    ...files.map((file) => `${file.name}:${file.size}:${file.lastModified}`),
  ].join('|');

  return {
    clientDraftId: createClientId(),
    fingerprint,
    recipientName: resolvedRecipientName,
    recipientPhone: parsed.phone?.trim() || '',
    ordererName: resolvedOrdererName,
    ordererPhone: '',
    channelId,
    deliveryDate: parsed.deliveryDate || '',
    deliveryStartTime: parsed.deliveryStartTime || '',
    deliveryEndTime: parsed.deliveryEndTime,
    deliveryAddress: parsed.address?.trim() || undefined,
    items: productHint ? [{
      productId: product ? String(product.id) : undefined,
      productSku: product?.sku,
      productName: product ? getProductName(product) : productHint,
      productHint,
      unitPrice: parsed.price ?? 0,
      quantity: 1,
      hasCard: Boolean(parsed.cardMessage),
      cardMessage: parsed.cardMessage?.trim() || null,
      hasBanner: Boolean(parsed.bannerMessage),
      bannerMessage: parsed.bannerMessage?.trim() || null,
    }] : [],
    shippingFee: parsed.shippingFee ?? 0,
    deposit: parsed.deposit,
    sourceText: sourceText.trim(),
    attachments,
    warnings: [...new Set(warnings)],
    validationErrors,
    isValid: validationErrors.length === 0,
  };
};

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
