import React from 'react';
import type { ProductDto } from '@/features/product/api/productApi';
import type { ChannelDto } from '@/features/settings/channels/api/channelsApi';
import { formatVndInput, parseVndInput } from '@/shared/utils/displayFormatters';
import type {
  AdministrativeAddressField,
  AdministrativeAddressValue,
} from '../types/administrativeAddress.types';
import type {
  QuickOrderReviewErrors,
  QuickOrderReviewField,
  QuickOrderReviewState,
} from '../types/quickOrder.types';
import { calculateDefaultDeposit } from '../utils/deposit';
import { formatOrderCurrency } from '../utils/orderListFormatters';
import { quickOrderReviewFieldIds } from '../utils/quickOrderReview';
import { AdministrativeAddressFields } from './AdministrativeAddressFields';

const inputClass =
  'min-h-9 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-2.5 py-1.5 text-[13px] text-admin-text-primary placeholder:text-admin-text-muted transition-colors focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text';
const labelClass = 'mb-0.5 block min-h-3 text-[11px] font-medium leading-4 text-admin-text-secondary';
const sectionClass = 'rounded-admin-control border border-admin-border bg-admin-card p-2.5';

type QuickOrderReviewFormProps = {
  review: QuickOrderReviewState;
  errors: QuickOrderReviewErrors;
  channels: readonly ChannelDto[];
  products: readonly ProductDto[];
  administrativeAddress: AdministrativeAddressValue;
  administrativeAddressInvalidField?: AdministrativeAddressField;
  onChange: (field: QuickOrderReviewField, value: string) => void;
  onAdministrativeAddressChange: (value: AdministrativeAddressValue) => void;
};

const errorId = (field: QuickOrderReviewField) => `${quickOrderReviewFieldIds[field]}-error`;

const fieldProps = (field: QuickOrderReviewField, errors: QuickOrderReviewErrors) => ({
  id: quickOrderReviewFieldIds[field],
  'aria-invalid': Boolean(errors[field]),
  'aria-describedby': errors[field] ? errorId(field) : undefined,
  className: `${inputClass} ${errors[field] ? 'border-admin-status-error ring-2 ring-admin-status-error/10' : ''}`,
});

const FieldError: React.FC<{ field: QuickOrderReviewField; errors: QuickOrderReviewErrors }> = ({ field, errors }) => (
  errors[field]
    ? <p id={errorId(field)} className="mt-0.5 text-[11px] leading-4 text-admin-status-error">{errors[field]}</p>
    : null
);

const productName = (product: ProductDto) =>
  product.translations.find((translation) => translation.languageCode.toLowerCase().startsWith('vi'))?.name?.trim()
  || product.translations[0]?.name?.trim()
  || product.sku;

const normalizeProduct = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/gi, 'd')
  .toLocaleLowerCase('vi')
  .trim();

export const QuickOrderReviewForm: React.FC<QuickOrderReviewFormProps> = ({
  review,
  errors,
  channels,
  products,
  administrativeAddress,
  administrativeAddressInvalidField,
  onChange,
  onAdministrativeAddressChange,
}) => {
  const pickupAtShop = review.deliveryMethod === 'pickup';
  const provinceShipping = review.deliveryMethod === 'province';
  const rangeDelivery = review.deliveryTimeMode === 'range';
  const quantity = Number(review.quantity) || 1;
  const orderValue = parseVndInput(review.price) * quantity + (pickupAtShop ? 0 : parseVndInput(review.shippingFee));

  const updateMoney = (field: 'price' | 'shippingFee' | 'deposit', value: string) => {
    onChange(field, formatVndInput(parseVndInput(value)));
  };

  const updateProduct = (value: string) => {
    onChange('productHint', value);
    const normalizedValue = normalizeProduct(value);
    const selected = products.find((product) => product.isActive && (
      normalizeProduct(product.sku) === normalizedValue
      || normalizeProduct(productName(product)) === normalizedValue
    ));
    if (selected) onChange('price', formatVndInput(selected.salePrice ?? selected.price));
  };

  return (
    <div className="mt-2 space-y-2">
      <section className={sectionClass} aria-labelledby="quick-customer-title">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h5 id="quick-customer-title" className="text-[13px] font-semibold text-admin-text-primary">Khách hàng & lịch nhận</h5>
          <button
            type="button"
            onClick={() => {
              onChange('recipientName', review.ordererName);
              onChange('recipientPhone', review.ordererPhone);
            }}
            className="text-[11px] font-semibold text-admin-primary hover:underline"
          >
            Người nhận giống người đặt
          </button>
        </div>
        <div className="grid gap-x-2.5 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor={quickOrderReviewFieldIds.recipientName} className={labelClass}>Người nhận</label>
            <input {...fieldProps('recipientName', errors)} value={review.recipientName} onChange={(event) => onChange('recipientName', event.target.value)} autoComplete="shipping name" />
            <FieldError field="recipientName" errors={errors} />
          </div>
          <div>
            <label htmlFor={quickOrderReviewFieldIds.recipientPhone} className={labelClass}>SĐT người nhận</label>
            <input {...fieldProps('recipientPhone', errors)} type="tel" value={review.recipientPhone} onChange={(event) => onChange('recipientPhone', event.target.value)} autoComplete="shipping tel" />
            <FieldError field="recipientPhone" errors={errors} />
          </div>
          <div>
            <label htmlFor={quickOrderReviewFieldIds.ordererName} className={labelClass}>Người đặt</label>
            <input {...fieldProps('ordererName', errors)} value={review.ordererName} onChange={(event) => onChange('ordererName', event.target.value)} autoComplete="name" />
            <FieldError field="ordererName" errors={errors} />
          </div>
          <div>
            <label htmlFor={quickOrderReviewFieldIds.ordererPhone} className={labelClass}>SĐT người đặt <span className="font-normal text-admin-text-muted">(không bắt buộc)</span></label>
            <input {...fieldProps('ordererPhone', errors)} type="tel" value={review.ordererPhone} onChange={(event) => onChange('ordererPhone', event.target.value)} autoComplete="tel" />
            <FieldError field="ordererPhone" errors={errors} />
          </div>
          <div>
            <label htmlFor={quickOrderReviewFieldIds.channelId} className={labelClass}>Kênh bán <span className="sr-only">(Nguồn đơn)</span></label>
            <select {...fieldProps('channelId', errors)} value={review.channelId} onChange={(event) => onChange('channelId', event.target.value)}>
              <option value="">Chọn kênh</option>
              {channels.filter((channel) => channel.isActive).map((channel) => <option key={channel.id} value={channel.id}>{channel.name}</option>)}
            </select>
            <FieldError field="channelId" errors={errors} />
          </div>
          <fieldset className="sm:col-span-2 lg:col-span-3">
            <legend className={labelClass}>{provinceShipping ? 'Thời gian gửi đơn vị vận chuyển' : 'Thời gian nhận'}</legend>
            <div className="mb-1.5 inline-flex rounded-admin-control border border-admin-border bg-admin-muted p-0.5">
              {(['exact', 'range'] as const).map((mode) => (
                <button
                  key={mode}
                  id={mode === 'exact' ? quickOrderReviewFieldIds.deliveryTimeMode : undefined}
                  type="button"
                  onClick={() => {
                    onChange('deliveryTimeMode', mode);
                    if (mode === 'exact') onChange('deliveryEndTime', '');
                  }}
                  className={`min-h-8 rounded-admin-control px-2.5 text-[11px] font-semibold transition-colors ${review.deliveryTimeMode === mode ? 'bg-admin-card text-admin-primary shadow-sm' : 'text-admin-text-secondary hover:text-admin-text-primary'}`}
                  aria-pressed={review.deliveryTimeMode === mode}
                >
                  {mode === 'exact' ? 'Giờ cụ thể' : 'Khoảng thời gian'}
                </button>
              ))}
            </div>
            <div className={`grid gap-2 ${rangeDelivery ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
              <div>
                <label htmlFor={quickOrderReviewFieldIds.deliveryDate} className="mb-0.5 block text-[11px] text-admin-text-muted">Ngày nhận</label>
                <input {...fieldProps('deliveryDate', errors)} type="date" value={review.deliveryDate} onChange={(event) => onChange('deliveryDate', event.target.value)} />
                <FieldError field="deliveryDate" errors={errors} />
              </div>
              <div>
                <label htmlFor={quickOrderReviewFieldIds.deliveryStartTime} className="mb-0.5 block text-[11px] text-admin-text-muted">Bắt đầu</label>
                <input {...fieldProps('deliveryStartTime', errors)} type="time" value={review.deliveryStartTime} onChange={(event) => onChange('deliveryStartTime', event.target.value)} />
                <FieldError field="deliveryStartTime" errors={errors} />
              </div>
              {rangeDelivery ? (
                <div>
                  <label htmlFor={quickOrderReviewFieldIds.deliveryEndTime} className="mb-0.5 block text-[11px] text-admin-text-muted">Kết thúc</label>
                  <input {...fieldProps('deliveryEndTime', errors)} type="time" min={review.deliveryStartTime || undefined} value={review.deliveryEndTime} onChange={(event) => onChange('deliveryEndTime', event.target.value)} />
                  <FieldError field="deliveryEndTime" errors={errors} />
                </div>
              ) : null}
            </div>
          </fieldset>
        </div>
      </section>

      <section className={sectionClass}>
        <div className="mb-2">
          <h5 id="quick-product-title" className="text-[13px] font-semibold text-admin-text-primary">Sản phẩm</h5>
          <p className="mt-0.5 text-[11px] leading-4 text-admin-text-muted">Chọn từ danh mục hoặc nhập sản phẩm ngoài danh mục; sản phẩm ngoài danh mục cần ảnh.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(8rem,10rem)_4.5rem]">
          <div>
            <label htmlFor={quickOrderReviewFieldIds.productHint} className={labelClass}>Sản phẩm</label>
            <input
              {...fieldProps('productHint', errors)}
              list="quick-review-product-options"
              value={review.productHint}
              onChange={(event) => updateProduct(event.target.value)}
              placeholder="Tìm theo mã hoặc tên sản phẩm"
            />
            <datalist id="quick-review-product-options">
              {products.filter((product) => product.isActive).map((product) => (
                <option key={product.id} value={product.sku}>{productName(product)} - {formatOrderCurrency(product.salePrice ?? product.price)}</option>
              ))}
            </datalist>
            <FieldError field="productHint" errors={errors} />
          </div>
          <div>
            <label htmlFor={quickOrderReviewFieldIds.price} className={labelClass}>Đơn giá <span className="sr-only">(Giá)</span></label>
            <div className="relative">
              <input {...fieldProps('price', errors)} type="text" inputMode="numeric" className={`${fieldProps('price', errors).className} pr-8 text-right tabular-nums`} value={formatVndInput(parseVndInput(review.price))} onChange={(event) => updateMoney('price', event.target.value)} placeholder="0" />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-admin-text-muted">₫</span>
            </div>
            <FieldError field="price" errors={errors} />
          </div>
          <div>
            <label htmlFor={quickOrderReviewFieldIds.quantity} className={labelClass}>SL</label>
            <input {...fieldProps('quantity', errors)} type="number" min={1} step={1} value={review.quantity} onChange={(event) => onChange('quantity', event.target.value)} />
            <FieldError field="quantity" errors={errors} />
          </div>
        </div>
        <div className="mt-2">
          <label htmlFor={quickOrderReviewFieldIds.productNote} className={labelClass}>Ghi chú riêng cho sản phẩm</label>
          <textarea {...fieldProps('productNote', errors)} aria-label="Ghi chú riêng" className={`${fieldProps('productNote', errors).className} min-h-14 resize-y`} value={review.productNote} onChange={(event) => onChange('productNote', event.target.value)} placeholder="Màu hoa, kích thước và yêu cầu riêng" />
          <FieldError field="productNote" errors={errors} />
        </div>
        <div className="mt-2 border-t border-admin-border pt-2">
          <p className="mb-1 text-[11px] font-semibold text-admin-text-secondary">Thiệp & banner</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {([
              ['hasCard', 'cardMessage', 'Ghi thiệp', 'Nội dung thiệp'],
              ['hasBanner', 'bannerMessage', 'In banner', 'Nội dung banner'],
            ] as const).map(([toggleField, messageField, toggleLabel, messageLabel]) => {
              const enabled = review[toggleField] === 'true';
              return (
                <div key={toggleField}>
                  <label className="inline-flex min-h-7 cursor-pointer items-center gap-2 text-[11px] font-semibold text-admin-text-primary">
                    <input
                      id={quickOrderReviewFieldIds[toggleField]}
                      type="checkbox"
                      checked={enabled}
                      onChange={(event) => {
                        onChange(toggleField, String(event.target.checked));
                        if (!event.target.checked) onChange(messageField, '');
                      }}
                      className="h-4 w-4 accent-admin-primary"
                    />
                    {toggleLabel}
                  </label>
                  {enabled ? (
                    <>
                      <textarea {...fieldProps(messageField, errors)} aria-label={messageLabel} className={`${fieldProps(messageField, errors).className} mt-0.5 min-h-14 resize-y`} value={review[messageField]} onChange={(event) => onChange(messageField, event.target.value)} placeholder={messageLabel} />
                      <FieldError field={messageField} errors={errors} />
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className={sectionClass} aria-labelledby="quick-delivery-title">
        <h5 id="quick-delivery-title" className="text-[13px] font-semibold text-admin-text-primary">Giao nhận</h5>
        <div id={quickOrderReviewFieldIds.deliveryMethod} className="mt-1.5 grid grid-cols-3 gap-1 rounded-admin-control border border-admin-border bg-admin-muted p-0.5" role="radiogroup" aria-label="Hình thức giao nhận">
          {([
            ['local', 'Giao nội thành'],
            ['province', 'Ship tỉnh'],
            ['pickup', 'Lấy tại shop'],
          ] as const).map(([method, label]) => (
            <button
              key={method}
              type="button"
              role="radio"
              aria-checked={review.deliveryMethod === method}
              onClick={() => {
                onChange('deliveryMethod', method);
                if (method === 'pickup') onChange('shippingFee', '');
              }}
              className={`min-h-8 rounded-admin-control px-2 text-[11px] font-semibold transition-colors ${review.deliveryMethod === method ? 'bg-admin-card text-admin-primary shadow-sm' : 'text-admin-text-secondary hover:text-admin-text-primary'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {provinceShipping ? <p className="mt-1.5 rounded-admin-control bg-admin-primary/6 px-2.5 py-1.5 text-[11px] leading-4 text-admin-text-secondary">Thời gian đơn hàng là lúc bàn giao cho đơn vị vận chuyển, không phải thời gian người nhận nhận hàng.</p> : null}
        {!pickupAtShop ? (
          <div className="mt-2">
            <h6 className="mb-1.5 text-[11px] font-semibold text-admin-text-primary">Địa chỉ nhận</h6>
            <AdministrativeAddressFields
              compact
              idPrefix="quick-review-address"
              value={administrativeAddress}
              onChange={onAdministrativeAddressChange}
              invalidField={errors.address ? administrativeAddressInvalidField : undefined}
              errorId={errors.address ? errorId('address') : undefined}
            />
            <FieldError field="address" errors={errors} />
          </div>
        ) : <p className="mt-2 rounded-admin-control bg-admin-muted px-2.5 py-2 text-[11px] leading-4 text-admin-text-secondary">Không cần địa chỉ và phí giao hàng.</p>}
      </section>

      <section className={sectionClass} aria-labelledby="quick-cost-title">
        <h5 id="quick-cost-title" className="mb-2 text-[13px] font-semibold text-admin-text-primary">Chi phí & ghi chú</h5>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor={quickOrderReviewFieldIds.deposit} className={labelClass}>Tiền cọc <span className="sr-only">(Cọc)</span></label>
            <div className="relative">
              <input {...fieldProps('deposit', errors)} type="text" inputMode="numeric" className={`${fieldProps('deposit', errors).className} pr-8 text-right tabular-nums`} value={formatVndInput(parseVndInput(review.deposit))} onChange={(event) => updateMoney('deposit', event.target.value)} placeholder="Mặc định" />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-admin-text-muted">₫</span>
            </div>
            <button type="button" onClick={() => onChange('deposit', formatVndInput(calculateDefaultDeposit(orderValue)))} className="mt-0.5 text-[11px] font-semibold text-admin-primary hover:underline">Áp dụng cọc mặc định</button>
            <FieldError field="deposit" errors={errors} />
          </div>
          <div>
            <label htmlFor={quickOrderReviewFieldIds.shippingFee} className={labelClass}>Phí giao dự kiến <span className="sr-only">(Ship)</span></label>
            <div className="relative">
              <input {...fieldProps('shippingFee', errors)} type="text" inputMode="numeric" disabled={pickupAtShop} className={`${fieldProps('shippingFee', errors).className} pr-8 text-right tabular-nums`} value={formatVndInput(parseVndInput(review.shippingFee))} onChange={(event) => updateMoney('shippingFee', event.target.value)} placeholder="0" />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-admin-text-muted">₫</span>
            </div>
            <FieldError field="shippingFee" errors={errors} />
          </div>
        </div>
        <div className="mt-2">
          <label htmlFor={quickOrderReviewFieldIds.contentNote} className={labelClass}>Ghi chú đơn hàng</label>
          <textarea {...fieldProps('contentNote', errors)} className={`${fieldProps('contentNote', errors).className} min-h-14 resize-y`} value={review.contentNote} onChange={(event) => onChange('contentNote', event.target.value)} placeholder="Nội dung cần lưu ý (không bắt buộc)" />
          <FieldError field="contentNote" errors={errors} />
        </div>
      </section>
    </div>
  );
};
