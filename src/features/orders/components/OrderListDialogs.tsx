import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote, CalendarClock, CircleAlert, CreditCard, Pencil,
  MapPin, PackageCheck, Truck, UserRound,
} from '@/shared/icons/lucideAnimated';
import { SettingsDialog } from '@/features/settings/components/SettingsDialog';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { ordersApi } from '../api/ordersApi';
import { OrderStatusBadge, PaymentStatusBadge } from './OrderStatusBadges';
import { OrderStatus, PaymentMethod, PaymentStatus, type OrderListItemDto } from '../types/order.types';

const money = (value: number) => new Intl.NumberFormat('vi-VN', {
  style: 'currency', currency: 'VND', maximumFractionDigits: 0,
}).format(value);

const dateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh', weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hour12: false,
}).format(new Date(value));

const fulfillmentLabel = (order: OrderListItemDto) => order.pickupAtShop
  ? 'Ghé lấy tại tiệm'
  : order.provinceShipping ? 'Ship tỉnh' : 'Ship nội thành';

const nextAction = (order: OrderListItemDto): { key: Parameters<typeof ordersApi.runWorkflowAction>[1]; label: string } | null => {
  switch (order.orderStatus) {
    case OrderStatus.Created: return { key: 'prepare-order', label: 'Chuẩn bị đơn' };
    case OrderStatus.Confirmed: return { key: 'start-preparation', label: 'Chuẩn bị đơn' };
    case OrderStatus.Producing: return { key: 'ready', label: 'Đã làm xong' };
    case OrderStatus.Ready: return order.pickupAtShop
      ? { key: 'delivered', label: 'Khách đã nhận tại tiệm' }
      : { key: 'dispatch', label: 'Giao hàng' };
    case OrderStatus.Shipping: return { key: 'delivered', label: 'Giao thành công' };
    case OrderStatus.DeliveryFailed: return { key: 'retry-delivery', label: 'Hẹn giao lại' };
    default: return null;
  }
};

type DialogKind = 'summary' | 'extra' | 'shipping' | null;

type Props = {
  order: OrderListItemDto | null;
  kind: DialogKind;
  canManage: boolean;
  onClose: () => void;
  onUpdated: () => Promise<void> | void;
};

export const OrderListDialogs: React.FC<Props> = ({ order, kind, canManage, onClose, onUpdated }) => {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shippingInput, setShippingInput] = useState('');
  const [shippingMode, setShippingMode] = useState(false);
  const [paymentMode, setPaymentMode] = useState(false);
  const [paymentReceivedAt, setPaymentReceivedAt] = useState('');
  const action = useMemo(() => order ? nextAction(order) : null, [order]);

  useEffect(() => {
    if ((kind !== 'shipping' && kind !== 'summary') || !order) return;
    setShippingInput(order.shippingFeeActual == null ? '' : String(order.shippingFeeActual));
    setShippingMode(false);
    setError(null);
  }, [kind, order]);

  if (!order || !kind) return null;

  const close = () => {
    if (busy) return;
    setError(null);
    setPaymentMode(false);
    setShippingMode(false);
    onClose();
  };

  const refresh = async () => {
    await onUpdated();
    setError(null);
  };

  const runAction = async () => {
    if (!action) return;
    setBusy(action.key); setError(null);
    try {
      await ordersApi.runWorkflowAction(order.id, action.key, {
        rowVersion: order.rowVersion,
        idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `${action.key}-${order.id}-${Date.now()}`,
      });
      await refresh();
      onClose();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setBusy(null);
    }
  };

  const saveShipping = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = shippingInput.replace(/\D/g, '');
    const amount = normalized === '' ? null : Number(normalized);
    if (amount != null && (!Number.isFinite(amount) || amount < 0)) {
      setError('Phí ship thực tế phải là số không âm.');
      return;
    }
    setBusy('shipping'); setError(null);
    try {
      await ordersApi.updateShippingFeeActual(order.id, amount, { rowVersion: order.rowVersion });
      await refresh();
      onClose();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setBusy(null);
    }
  };

  const confirmPayment = async () => {
    if (order.remainingAmount <= 0) return;
    setBusy('payment'); setError(null);
    if (!paymentReceivedAt) {
      setError('Vui lòng nhập thời điểm thực nhận tiền.');
      setBusy(null);
      return;
    }
    try {
      await ordersApi.changePaymentStatus(order.id, PaymentStatus.Paid, {
        amount: order.remainingAmount,
        paidAt: `${paymentReceivedAt}:00+07:00`,
        method: PaymentMethod.Other,
        idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `payment-${order.id}-${Date.now()}`,
        note: 'Xác nhận thanh toán từ đơn hàng',
      });
      await refresh();
      onClose();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setBusy(null);
    }
  };

  if (kind === 'extra') {
    const hasAny = Boolean(order.hasCard || order.hasBanner);
    return <SettingsDialog
      open
      title={`${order.orderCode} - Nội dung thêm`}
      description={`${order.ordererName} · Nội dung được hiển thị nguyên văn`}
      onRequestClose={close}
      footer={<button type="button" onClick={close} className="min-h-11 rounded-admin-control border border-admin-border bg-admin-card px-4 text-sm font-semibold">Đóng</button>}
    >
      {!hasAny ? <p className="text-sm text-admin-text-secondary">Đơn này không có thiệp hoặc banner.</p> : <div className="space-y-4">
        {order.hasCard ? <section aria-labelledby="card-message-title">
          <h3 id="card-message-title" className="text-sm font-semibold text-admin-text-primary">Thiệp</h3>
          <p className="mt-2 whitespace-pre-wrap rounded-admin-control bg-admin-muted px-4 py-3 text-sm leading-6 text-admin-text-primary">{order.cardMessage || 'Chưa nhập nội dung thiệp'}</p>
        </section> : null}
        {order.hasBanner ? <section aria-labelledby="banner-message-title">
          <h3 id="banner-message-title" className="text-sm font-semibold text-admin-text-primary">Banner</h3>
          <p className="mt-2 whitespace-pre-wrap rounded-admin-control bg-admin-muted px-4 py-3 text-sm leading-6 text-admin-text-primary">{order.bannerMessage || 'Chưa nhập nội dung banner'}</p>
        </section> : null}
      </div>}
    </SettingsDialog>;
  }

  if (kind === 'shipping') {
    return <SettingsDialog open title={`${order.orderCode} - Phí ship thực tế`} description="Khoản cửa hàng thực trả. Không làm thay đổi phí ship tính khách." onRequestClose={close}>
      <form onSubmit={saveShipping} className="space-y-4">
        <div className="grid grid-cols-2 gap-3 rounded-admin-control bg-admin-muted p-4 text-sm">
          <div><span className="block text-xs text-admin-text-muted">Ship tính khách</span><strong className="mt-1 block tabular-nums">{money(order.shippingFee)}</strong></div>
          <div><span className="block text-xs text-admin-text-muted">Đang ghi nhận</span><strong className="mt-1 block tabular-nums">{order.shippingFeeActual == null ? 'Chưa chốt' : money(order.shippingFeeActual)}</strong></div>
        </div>
        <label htmlFor="quick-shipping-fee" className="block text-sm font-semibold">Phí ship thực tế</label>
        <div className="relative">
          <input id="quick-shipping-fee" data-autofocus inputMode="numeric" value={shippingInput} onChange={event => setShippingInput(event.target.value.replace(/\D/g, ''))} placeholder={order.shippingFeeActual == null ? 'Để trống nếu chưa biết' : String(order.shippingFeeActual)} className="h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 pr-9 text-right text-sm tabular-nums focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/15" />
          <span className="pointer-events-none absolute right-3 top-3 text-sm text-admin-text-muted">đ</span>
        </div>
        {error ? <p role="alert" className="text-sm font-medium text-admin-status-error">{error}</p> : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={close} disabled={Boolean(busy)} className="h-11 rounded-admin-control border border-admin-border px-4 text-sm font-semibold">Hủy</button><button type="submit" disabled={Boolean(busy)} className="h-11 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang lưu...' : 'Lưu phí ship'}</button></div>
      </form>
    </SettingsDialog>;
  }

  return <SettingsDialog
    open
    width="wide"
    title={`${order.orderCode} - Tóm tắt`}
    description={`${order.productSummary || 'Đơn hoa'} · ${dateTime(order.deliveryAt)}`}
    onRequestClose={close}
  >
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2"><OrderStatusBadge status={order.orderStatus} /><PaymentStatusBadge status={order.paymentStatus} />{order.trackingGroup ? <span className="rounded-full bg-admin-muted px-2.5 py-1 text-xs font-semibold text-admin-text-secondary">{order.trackingGroup === 'late' ? 'Đang trễ' : order.trackingGroup === 'today' ? 'Chưa giao hôm nay' : order.trackingGroup === 'upcoming' ? 'Sắp tới' : order.trackingGroup === 'delivered-unpaid' ? 'Công nợ' : order.trackingGroup === 'completed' ? 'Hoàn tất' : order.trackingGroup === 'cancelled' ? 'Đã hủy' : 'Cần bổ sung lịch'}</span> : null}</div>

      <dl className="grid gap-4 border-y border-admin-border py-5 sm:grid-cols-3">
        <div><dt className="flex items-center gap-2 text-xs font-medium text-admin-text-muted"><UserRound size={15} />Người đặt</dt><dd className="mt-1.5 font-semibold">{order.ordererName}</dd><dd className="mt-0.5 text-sm text-admin-text-secondary">{order.ordererPhone}</dd><dd className="mt-1 text-xs text-admin-text-muted">{order.channelName || 'Chưa rõ kênh'}</dd></div>
        <div><dt className="flex items-center gap-2 text-xs font-medium text-admin-text-muted"><MapPin size={15} />Nhận hàng</dt><dd className="mt-1.5 font-semibold">{fulfillmentLabel(order)}</dd><dd className="mt-0.5 text-sm text-admin-text-secondary">{order.pickupAtShop ? 'Tại tiệm Lamie' : order.recipientName || 'Chưa có người nhận'}</dd><dd className="mt-1 text-xs text-admin-text-muted">{order.recipientPhone || (order.pickupAtShop ? 'Không bắt buộc' : 'Chưa có liên hệ')}</dd></div>
        <div><dt className="flex items-center gap-2 text-xs font-medium text-admin-text-muted"><CalendarClock size={15} />Lịch hẹn</dt><dd className="mt-1.5 font-semibold tabular-nums">{dateTime(order.deliveryAt)}</dd><dd className="mt-1 text-xs text-admin-text-muted">{order.quantityTotal ?? 0} sản phẩm</dd></div>
      </dl>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="bg-admin-muted p-4" aria-labelledby="summary-payment"><h3 id="summary-payment" className="flex items-center gap-2 text-sm font-semibold"><Banknote size={16} />Thanh toán</h3><div className="mt-3 flex items-end justify-between gap-3"><div><span className="block text-xs text-admin-text-muted">Tổng đơn</span><strong className="mt-1 block text-lg tabular-nums">{money(order.totalAmount)}</strong></div><div className="text-right"><span className="block text-xs text-admin-text-muted">Còn lại</span><strong className={`mt-1 block text-lg tabular-nums ${order.remainingAmount > 0 ? 'text-admin-status-error' : 'text-admin-status-success'}`}>{money(order.remainingAmount)}</strong></div></div></section>
        <section className="bg-admin-muted p-4" aria-labelledby="summary-extra"><h3 id="summary-extra" className="flex items-center gap-2 text-sm font-semibold"><PackageCheck size={16} />Nội dung thêm</h3><p className="mt-3 text-sm text-admin-text-secondary">{order.hasCard && order.hasBanner ? 'Thiệp và banner' : order.hasCard ? 'Có thiệp' : order.hasBanner ? 'Có banner' : 'Không kèm nội dung in'}</p><p className="mt-2 line-clamp-2 whitespace-pre-line text-xs text-admin-text-muted">{order.contentNote || 'Không có ghi chú nội bộ'}</p></section>
      </div>

      {!order.pickupAtShop && canManage ? <section className="border-t border-admin-border pt-4" aria-labelledby="summary-shipping-fee">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 id="summary-shipping-fee" className="text-sm font-semibold">Phí ship thực tế</h3><p className="mt-1 text-sm tabular-nums text-admin-text-secondary">{order.shippingFeeActual == null ? 'Chưa chốt' : money(order.shippingFeeActual)}</p></div>
          {!shippingMode ? <button type="button" onClick={() => setShippingMode(true)} disabled={Boolean(busy)} className="inline-flex min-h-10 items-center gap-2 rounded-admin-control border border-admin-border bg-admin-card px-3 text-sm font-semibold text-admin-primary"><Pencil size={15} />Sửa phí ship</button> : null}
        </div>
        {shippingMode ? <form onSubmit={saveShipping} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <label htmlFor="summary-shipping-fee-input" className="flex-1 text-xs font-semibold text-admin-text-secondary">Số tiền thực tế<div className="relative mt-1.5"><input id="summary-shipping-fee-input" data-autofocus inputMode="numeric" value={shippingInput} onChange={event => setShippingInput(event.target.value.replace(/\D/g, ''))} placeholder="Để trống nếu chưa biết" className="h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 pr-9 text-right text-sm font-normal tabular-nums text-admin-text-primary" /><span className="pointer-events-none absolute right-3 top-3 text-sm text-admin-text-muted">đ</span></div></label>
          <div className="flex gap-2"><button type="button" onClick={() => setShippingMode(false)} disabled={Boolean(busy)} className="h-11 rounded-admin-control border border-admin-border px-3 text-sm font-semibold">Hủy</button><button type="submit" disabled={Boolean(busy)} className="h-11 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-white disabled:opacity-50">{busy === 'shipping' ? 'Đang lưu...' : 'Lưu phí ship'}</button></div>
        </form> : null}
      </section> : null}

      {order.holdReason ? <div className="flex items-start gap-2 border border-admin-status-warning/30 bg-admin-status-warning-bg p-3 text-sm text-admin-status-warning"><CircleAlert size={17} className="mt-0.5 shrink-0" /><span><strong>Đang tạm dừng.</strong> {order.holdReason}</span></div> : null}
      {!order.pickupAtShop && (!order.recipientName || !order.recipientPhone || !order.deliveryAddress) && order.orderStatus === OrderStatus.Ready ? <div className="flex items-start gap-2 border border-admin-status-warning/30 bg-admin-status-warning-bg p-3 text-sm text-admin-status-warning"><Truck size={17} className="mt-0.5 shrink-0" /><span>Cần bổ sung tên, số điện thoại và địa chỉ người nhận trước khi bàn giao.</span></div> : null}
      {error ? <p role="alert" className="text-sm font-medium text-admin-status-error">{error}</p> : null}

      {paymentMode ? <div className="space-y-4 border-t border-admin-border pt-4"><div><h3 className="text-sm font-semibold">Xác nhận đã nhận {money(order.remainingAmount)}</h3><p className="mt-1 text-xs text-admin-text-secondary">Ghi nhận đúng số tiền và thời điểm thực nhận; thao tác này không tự tạo giao dịch ngân hàng.</p></div><label className="block text-xs font-semibold text-admin-text-secondary">Thời điểm thực nhận<input type="datetime-local" value={paymentReceivedAt} onChange={(event) => setPaymentReceivedAt(event.target.value)} className="mt-1.5 h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 text-sm font-normal text-admin-text-primary" /></label><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setPaymentMode(false)} disabled={Boolean(busy)} className="h-11 rounded-admin-control border border-admin-border px-4 text-sm font-semibold">Quay lại</button><button type="button" onClick={() => void confirmPayment()} disabled={Boolean(busy) || !paymentReceivedAt} className="inline-flex h-11 items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-white disabled:opacity-50"><CreditCard size={16} />{busy === 'payment' ? 'Đang ghi nhận...' : 'Xác nhận đã nhận tiền'}</button></div></div> : <div className="flex flex-col gap-2 border-t border-admin-border pt-4 sm:flex-row sm:flex-wrap sm:items-center">
        {canManage && action && !order.holdReason ? <button type="button" onClick={() => void runAction()} disabled={Boolean(busy)} className="min-h-11 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-white disabled:opacity-50">{busy === action.key ? 'Đang cập nhật...' : action.label}</button> : null}
        {canManage && order.remainingAmount > 0 && order.orderStatus !== OrderStatus.Cancelled ? <button type="button" onClick={() => { const local = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()).replace(' ', 'T'); setPaymentReceivedAt(local); setPaymentMode(true); }} disabled={Boolean(busy)} className="min-h-11 rounded-admin-control border border-admin-border bg-admin-card px-4 text-sm font-semibold">Đánh dấu đã thanh toán</button> : null}
        <Link to={`/admin/orders/${order.id}`} state={{ from: `${window.location.pathname}${window.location.search}` }} className="inline-flex min-h-11 items-center justify-center rounded-admin-control border border-admin-border bg-admin-card px-4 text-sm font-semibold text-admin-primary hover:bg-admin-muted sm:ml-auto">Xem chi tiết đầy đủ</Link>
      </div>}
    </div>
  </SettingsDialog>;
};
