import type { ChannelDto } from '@/features/settings/channels/api/channelsApi';
import type {
  AdministrativeAddressField,
  AdministrativeAddressValue,
} from '../types/administrativeAddress.types';
import { AdministrativeScheme } from '../types/order.types';
import type {
  ConfirmedQuickOrderReview,
  QuickOrderReviewErrors,
  QuickOrderReviewField,
  QuickOrderReviewState,
} from '../types/quickOrder.types';
import { quickOrderReviewFields } from '../types/quickOrder.types';
import type { ParsedOrderText } from './orderTextParser';

export const quickOrderReviewFieldIds: Record<QuickOrderReviewField, string> = {
  channelId: 'quick-review-channel',
  ordererName: 'quick-review-orderer-name',
  ordererPhone: 'quick-review-orderer-phone',
  recipientName: 'quick-review-recipient-name',
  deliveryDate: 'quick-review-delivery-date',
  deliveryStartTime: 'quick-review-delivery-start-time',
  deliveryEndTime: 'quick-review-delivery-end-time',
  deliveryTimeMode: 'quick-review-delivery-time-mode',
  deliveryMethod: 'quick-review-delivery-method',
  recipientPhone: 'quick-review-recipient-phone',
  address: 'quick-review-address-detail',
  productHint: 'quick-review-product-hint',
  price: 'quick-review-price',
  quantity: 'quick-review-quantity',
  productNote: 'quick-review-product-note',
  shippingFee: 'quick-review-shipping-fee',
  deposit: 'quick-review-deposit',
  hasCard: 'quick-review-has-card',
  cardMessage: 'quick-review-card-message',
  hasBanner: 'quick-review-has-banner',
  bannerMessage: 'quick-review-banner-message',
  contentNote: 'quick-review-content-note',
};

const moneySuggestion = (value: number | undefined, fallback = '') =>
  value == null ? fallback : value.toLocaleString('vi-VN');

export const createQuickOrderAddress = (detail = ''): AdministrativeAddressValue => ({
  scheme: AdministrativeScheme.Current,
  provinceCode: '',
  provinceName: '',
  districtCode: '',
  districtName: '',
  communeCode: '',
  communeName: '',
  detail,
});

export const createQuickOrderReview = (
  channelId: string,
  recipientName = '',
  ordererName = '',
  recipientPhone = '',
  ordererPhone = '',
): QuickOrderReviewState => ({
  channelId,
  ordererName,
  ordererPhone,
  recipientName,
  deliveryDate: '',
  deliveryStartTime: '',
  deliveryEndTime: '',
  deliveryTimeMode: 'exact',
  deliveryMethod: 'local',
  recipientPhone,
  address: '',
  productHint: '',
  price: '',
  quantity: '1',
  productNote: '',
  shippingFee: '',
  deposit: '',
  hasCard: 'false',
  cardMessage: '',
  hasBanner: 'false',
  bannerMessage: '',
  contentNote: '',
});

export const reviewSuggestionsFromParsed = (parsed: ParsedOrderText): Partial<QuickOrderReviewState> => ({
  ordererName: parsed.ordererName ?? '',
  recipientName: parsed.recipientName ?? '',
  deliveryDate: parsed.deliveryDate ?? '',
  deliveryStartTime: parsed.deliveryStartTime ?? '',
  deliveryEndTime: parsed.deliveryEndTime ?? '',
  deliveryTimeMode: parsed.deliveryEndTime ? 'range' : 'exact',
  recipientPhone: parsed.phone ?? '',
  address: parsed.address ?? '',
  productHint: parsed.productHint ?? '',
  price: moneySuggestion(parsed.price),
  shippingFee: moneySuggestion(parsed.shippingFee, '0'),
  deposit: moneySuggestion(parsed.deposit),
  hasCard: parsed.cardMessage ? 'true' : 'false',
  cardMessage: parsed.cardMessage ?? '',
  hasBanner: parsed.bannerMessage ? 'true' : 'false',
  bannerMessage: parsed.bannerMessage ?? '',
});

export const mergeQuickOrderReviewSuggestions = (
  current: QuickOrderReviewState,
  suggestions: Partial<QuickOrderReviewState>,
  dirtyFields: ReadonlySet<QuickOrderReviewField>,
): QuickOrderReviewState => {
  const next = { ...current };
  quickOrderReviewFields.forEach((field) => {
    const value = suggestions[field];
    if (!dirtyFields.has(field) && typeof value === 'string') {
      Object.assign(next, { [field]: value });
    }
  });
  return next;
};

const parseMoney = (rawValue: string): number | null => {
  const compact = rawValue.trim().replace(/[\s.,₫đ]/gi, '');
  if (!compact || !/^-?\d+$/.test(compact)) return null;
  const value = Number(compact);
  return Number.isSafeInteger(value) ? value : null;
};

const validDate = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const candidate = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return candidate.getFullYear() === Number(match[1])
    && candidate.getMonth() === Number(match[2]) - 1
    && candidate.getDate() === Number(match[3]);
};

const timeToMinutes = (value: string): number | null => {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour <= 23 && minute <= 59 ? hour * 60 + minute : null;
};

const normalizePhone = (value: string) => value.replace(/[\s.-]/g, '').replace(/^\+84/, '0');

export type QuickOrderReviewValidation = {
  errors: QuickOrderReviewErrors;
  administrativeAddressInvalidField?: AdministrativeAddressField;
  confirmed?: ConfirmedQuickOrderReview;
};

export const validateQuickOrderReview = (
  review: QuickOrderReviewState,
  channels: readonly ChannelDto[],
  administrativeAddress: AdministrativeAddressValue,
): QuickOrderReviewValidation => {
  const errors: QuickOrderReviewErrors = {};
  const ordererName = review.ordererName.trim();
  const ordererPhone = normalizePhone(review.ordererPhone);
  const recipientName = review.recipientName.trim();
  const recipientPhone = normalizePhone(review.recipientPhone);
  const productHint = review.productHint.trim();
  const price = parseMoney(review.price);
  const shippingFee = review.shippingFee.trim() ? parseMoney(review.shippingFee) : 0;
  const deposit = review.deposit.trim() ? parseMoney(review.deposit) : undefined;
  const quantity = Number(review.quantity);
  const pickupAtShop = review.deliveryMethod === 'pickup';
  const provinceShipping = review.deliveryMethod === 'province';
  const startMinutes = timeToMinutes(review.deliveryStartTime);
  const endMinutes = review.deliveryEndTime ? timeToMinutes(review.deliveryEndTime) : null;
  let administrativeAddressInvalidField: AdministrativeAddressField | undefined;
  const hasStructuredAddress = Boolean(
    administrativeAddress.provinceCode
    || administrativeAddress.districtCode
    || administrativeAddress.communeCode,
  );

  if (!review.channelId) errors.channelId = 'Vui lòng chọn nguồn đơn.';
  else if (!channels.some((channel) => channel.id === review.channelId && channel.isActive)) {
    errors.channelId = 'Kênh bán đã chọn không còn hoạt động.';
  }
  if (!ordererName) errors.ordererName = 'Vui lòng nhập tên người đặt.';
  if (!recipientName) errors.recipientName = 'Vui lòng nhập tên người nhận.';
  if (!validDate(review.deliveryDate)) errors.deliveryDate = 'Ngày nhận không hợp lệ.';
  if (startMinutes == null) errors.deliveryStartTime = 'Giờ bắt đầu không hợp lệ.';
  if (review.deliveryTimeMode === 'range' && !review.deliveryEndTime) {
    errors.deliveryEndTime = 'Vui lòng chọn thời gian kết thúc.';
  } else if (review.deliveryEndTime && endMinutes == null) errors.deliveryEndTime = 'Giờ kết thúc không hợp lệ.';
  else if (startMinutes != null && endMinutes != null && endMinutes < startMinutes) {
    errors.deliveryEndTime = 'Giờ kết thúc phải sau hoặc bằng giờ bắt đầu.';
  }
  if (!/^(?:0)(?:3|5|7|8|9)\d{8}$/.test(recipientPhone)) {
    errors.recipientPhone = 'Số điện thoại người nhận không hợp lệ.';
  }
  if (!pickupAtShop && hasStructuredAddress) {
    if (!administrativeAddress.provinceCode) {
      errors.address = 'Vui lòng chọn tỉnh hoặc thành phố.';
      administrativeAddressInvalidField = 'province';
    } else if (administrativeAddress.scheme === AdministrativeScheme.Legacy && !administrativeAddress.districtCode) {
      errors.address = 'Vui lòng chọn đơn vị cấp huyện cho địa chỉ cũ.';
      administrativeAddressInvalidField = 'district';
    } else if (!administrativeAddress.communeCode) {
      errors.address = 'Vui lòng chọn xã, phường hoặc đơn vị tương ứng.';
      administrativeAddressInvalidField = 'commune';
    }
  }
  if (!productHint) errors.productHint = 'Vui lòng nhập sản phẩm.';
  if (price == null || price <= 0) errors.price = 'Giá sản phẩm phải lớn hơn 0.';
  if (!Number.isInteger(quantity) || quantity < 1) errors.quantity = 'Số lượng phải là số nguyên từ 1 trở lên.';
  if (!pickupAtShop && (shippingFee == null || shippingFee < 0)) errors.shippingFee = 'Phí giao hàng không hợp lệ.';
  if (deposit == null && review.deposit.trim()) errors.deposit = 'Tiền cọc không hợp lệ.';
  else if (deposit != null && deposit < 0) errors.deposit = 'Tiền cọc không được âm.';
  if (review.hasCard === 'true' && !review.cardMessage.trim()) errors.cardMessage = 'Vui lòng nhập nội dung thiệp hoặc tắt Ghi thiệp.';
  if (review.hasBanner === 'true' && !review.bannerMessage.trim()) errors.bannerMessage = 'Vui lòng nhập nội dung banner hoặc tắt In banner.';

  if (Object.keys(errors).length > 0 || price == null || shippingFee == null) {
    return { errors, administrativeAddressInvalidField };
  }

  return {
    errors,
    confirmed: {
      channelId: review.channelId,
      ordererName,
      ordererPhone,
      recipientName,
      deliveryDate: review.deliveryDate,
      deliveryStartTime: review.deliveryStartTime,
      deliveryEndTime: review.deliveryTimeMode === 'range' ? review.deliveryEndTime || undefined : undefined,
      recipientPhone,
      pickupAtShop,
      provinceShipping,
      address: administrativeAddress.detail.trim() || undefined,
      administrativeAddress: {
        ...administrativeAddress,
        detail: administrativeAddress.detail.trim(),
      },
      productHint,
      price,
      quantity,
      productNote: review.productNote.trim() || undefined,
      shippingFee: pickupAtShop ? 0 : shippingFee,
      deposit,
      hasCard: review.hasCard === 'true',
      cardMessage: review.hasCard === 'true' ? review.cardMessage.trim() || undefined : undefined,
      hasBanner: review.hasBanner === 'true',
      bannerMessage: review.hasBanner === 'true' ? review.bannerMessage.trim() || undefined : undefined,
      contentNote: review.contentNote.trim() || undefined,
    },
  };
};
