import React from 'react';
import type { ChannelDto } from '@/features/settings/channels/api/channelsApi';
import type {
  AdministrativeAddressField,
  AdministrativeAddressValue,
} from '../types/administrativeAddress.types';
import type {
  QuickOrderReviewErrors,
  QuickOrderReviewField,
  QuickOrderReviewState,
} from '../types/quickOrder.types';
import { quickOrderReviewFieldIds } from '../utils/quickOrderReview';
import { AdministrativeAddressFields } from './AdministrativeAddressFields';

const inputClass =
  'min-h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 py-2 text-sm text-admin-text-primary placeholder:text-admin-text-muted transition-colors focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text';
const labelClass = 'mb-1 block text-xs font-medium text-admin-text-secondary';

type QuickOrderReviewFormProps = {
  review: QuickOrderReviewState;
  errors: QuickOrderReviewErrors;
  channels: readonly ChannelDto[];
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
    ? <p id={errorId(field)} className="mt-1 text-xs leading-5 text-admin-status-error">{errors[field]}</p>
    : null
);

export const QuickOrderReviewForm: React.FC<QuickOrderReviewFormProps> = ({
  review,
  errors,
  channels,
  administrativeAddress,
  administrativeAddressInvalidField,
  onChange,
  onAdministrativeAddressChange,
}) => (
  <div className="mt-3 grid gap-x-3 gap-y-3 sm:grid-cols-2">
    <div>
      <label htmlFor={quickOrderReviewFieldIds.channelId} className={labelClass}>Nguồn đơn</label>
      <select
        {...fieldProps('channelId', errors)}
        value={review.channelId}
        onChange={(event) => onChange('channelId', event.target.value)}
      >
        <option value="">Chọn nguồn đơn</option>
        {channels.filter((channel) => channel.isActive).map((channel) => (
          <option key={channel.id} value={channel.id}>{channel.name}</option>
        ))}
      </select>
      <FieldError field="channelId" errors={errors} />
    </div>

    <div>
      <label htmlFor={quickOrderReviewFieldIds.ordererName} className={labelClass}>Người đặt</label>
      <input
        {...fieldProps('ordererName', errors)}
        value={review.ordererName}
        onChange={(event) => onChange('ordererName', event.target.value)}
        autoComplete="name"
      />
      <FieldError field="ordererName" errors={errors} />
    </div>

    <div>
      <label htmlFor={quickOrderReviewFieldIds.recipientName} className={labelClass}>Người nhận</label>
      <input
        {...fieldProps('recipientName', errors)}
        value={review.recipientName}
        onChange={(event) => onChange('recipientName', event.target.value)}
        autoComplete="shipping name"
      />
      <FieldError field="recipientName" errors={errors} />
    </div>

    <div>
      <label htmlFor={quickOrderReviewFieldIds.recipientPhone} className={labelClass}>SĐT người nhận</label>
      <input
        {...fieldProps('recipientPhone', errors)}
        type="tel"
        value={review.recipientPhone}
        onChange={(event) => onChange('recipientPhone', event.target.value)}
        autoComplete="shipping tel"
      />
      <FieldError field="recipientPhone" errors={errors} />
    </div>

    <div>
      <label htmlFor={quickOrderReviewFieldIds.deliveryDate} className={labelClass}>Ngày nhận</label>
      <input
        {...fieldProps('deliveryDate', errors)}
        type="date"
        value={review.deliveryDate}
        onChange={(event) => onChange('deliveryDate', event.target.value)}
      />
      <FieldError field="deliveryDate" errors={errors} />
    </div>

    <div className="grid grid-cols-2 gap-2">
      <div>
        <label htmlFor={quickOrderReviewFieldIds.deliveryStartTime} className={labelClass}>Bắt đầu</label>
        <input
          {...fieldProps('deliveryStartTime', errors)}
          type="time"
          value={review.deliveryStartTime}
          onChange={(event) => onChange('deliveryStartTime', event.target.value)}
        />
        <FieldError field="deliveryStartTime" errors={errors} />
      </div>
      <div>
        <label htmlFor={quickOrderReviewFieldIds.deliveryEndTime} className={labelClass}>Kết thúc</label>
        <input
          {...fieldProps('deliveryEndTime', errors)}
          type="time"
          value={review.deliveryEndTime}
          onChange={(event) => onChange('deliveryEndTime', event.target.value)}
        />
        <FieldError field="deliveryEndTime" errors={errors} />
      </div>
    </div>

    <section className="sm:col-span-2" aria-labelledby="quick-review-address-title">
      <h5 id="quick-review-address-title" className="mb-2 text-xs font-semibold text-admin-text-primary">Địa chỉ nhận</h5>
      <AdministrativeAddressFields
        idPrefix="quick-review-address"
        value={administrativeAddress}
        onChange={onAdministrativeAddressChange}
        invalidField={errors.address ? administrativeAddressInvalidField : undefined}
        errorId={errors.address ? errorId('address') : undefined}
      />
      <FieldError field="address" errors={errors} />
    </section>

    <div className="sm:col-span-2">
      <label htmlFor={quickOrderReviewFieldIds.productHint} className={labelClass}>Sản phẩm</label>
      <input
        {...fieldProps('productHint', errors)}
        value={review.productHint}
        onChange={(event) => onChange('productHint', event.target.value)}
        placeholder="Tên hoặc mã sản phẩm"
      />
      <FieldError field="productHint" errors={errors} />
    </div>

    <div className="grid grid-cols-3 gap-2 sm:col-span-2">
      <div>
        <label htmlFor={quickOrderReviewFieldIds.price} className={labelClass}>Giá</label>
        <input
          {...fieldProps('price', errors)}
          type="text"
          inputMode="numeric"
          value={review.price}
          onChange={(event) => onChange('price', event.target.value)}
          placeholder="0"
        />
        <FieldError field="price" errors={errors} />
      </div>
      <div>
        <label htmlFor={quickOrderReviewFieldIds.shippingFee} className={labelClass}>Ship</label>
        <input
          {...fieldProps('shippingFee', errors)}
          type="text"
          inputMode="numeric"
          value={review.shippingFee}
          onChange={(event) => onChange('shippingFee', event.target.value)}
          placeholder="0"
        />
        <FieldError field="shippingFee" errors={errors} />
      </div>
      <div>
        <label htmlFor={quickOrderReviewFieldIds.deposit} className={labelClass}>Cọc</label>
        <input
          {...fieldProps('deposit', errors)}
          type="text"
          inputMode="numeric"
          value={review.deposit}
          onChange={(event) => onChange('deposit', event.target.value)}
          placeholder="Mặc định"
        />
        <FieldError field="deposit" errors={errors} />
      </div>
    </div>

    <div>
      <label htmlFor={quickOrderReviewFieldIds.cardMessage} className={labelClass}>Nội dung thiệp</label>
      <textarea
        {...fieldProps('cardMessage', errors)}
        className={`${fieldProps('cardMessage', errors).className} min-h-20 resize-y`}
        value={review.cardMessage}
        onChange={(event) => onChange('cardMessage', event.target.value)}
      />
      <FieldError field="cardMessage" errors={errors} />
    </div>

    <div>
      <label htmlFor={quickOrderReviewFieldIds.bannerMessage} className={labelClass}>Nội dung banner</label>
      <textarea
        {...fieldProps('bannerMessage', errors)}
        className={`${fieldProps('bannerMessage', errors).className} min-h-20 resize-y`}
        value={review.bannerMessage}
        onChange={(event) => onChange('bannerMessage', event.target.value)}
      />
      <FieldError field="bannerMessage" errors={errors} />
    </div>
  </div>
);
