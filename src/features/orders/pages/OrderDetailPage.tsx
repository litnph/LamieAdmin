import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Edit3,
  Image as ImageIcon,
  LoaderCircle,
  MapPin,
  PackageOpen,
  Phone,
  RefreshCw,
  ShoppingBag,
  Truck,
  UserRound,
  WalletCards,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Permission } from '@/features/auth/permissions';
import { channelsApi, type ChannelDto } from '@/features/settings/channels/api/channelsApi';
import { ConfirmationPanel, SettingsDialog } from '@/features/settings/components/SettingsDialog';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { resolveApiResourceUrl } from '@/services/apiResourceUrl';
import { ordersApi } from '../api/ordersApi';
import { OrderStatusBadge, PaymentStatusBadge, DeliveryUrgencyBadge } from '../components/OrderStatusBadges';
import {
  nextOrderStatuses,
  nextPaymentStatuses,
  orderStatusLabel,
  paymentStatusLabel,
} from '../constants/orderLabels';
import type { OrderChangeLogDto, OrderDetailDto, OrderItemDto } from '../types/order.types';
import { OrderStatus, PaymentStatus } from '../types/order.types';
import {
  formatOrderCurrency,
  formatDeliveryWindow,
  getDeliveryUrgency,
} from '../utils/orderListFormatters';

const PRIMARY_STATUS_ACTION: Partial<Record<OrderStatus, string>> = {
  [OrderStatus.Producing]: 'Bắt đầu chuẩn bị',
  [OrderStatus.Shipping]: 'Bắt đầu giao',
  [OrderStatus.Completed]: 'Hoàn tất đơn',
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const isOrderStatus = (value: number): value is OrderStatus =>
  [
    OrderStatus.Created,
    OrderStatus.Producing,
    OrderStatus.Shipping,
    OrderStatus.Completed,
    OrderStatus.Cancelled,
  ].includes(value as OrderStatus);

const isPaymentStatus = (value: number): value is PaymentStatus =>
  [PaymentStatus.Unpaid, PaymentStatus.Deposited, PaymentStatus.Paid].includes(value as PaymentStatus);

const formatLogField = (log: OrderChangeLogDto) => {
  const field = log.fieldName.toLocaleLowerCase('vi');
  if (field === 'orderstatus') return 'Trạng thái đơn';
  if (field === 'paymentstatus') return 'Trạng thái thanh toán';
  if (field === 'deliveryat') return 'Thời gian bắt đầu giao';
  if (field === 'deliveryto') return 'Thời gian kết thúc giao';
  if (field === 'shippingfeeactual') return 'Phí giao hàng thực tế';
  if (field === 'shippingfee') return 'Phí giao hàng dự kiến';
  if (field === 'depositamount') return 'Tiền cọc';
  return log.fieldName || log.changeType;
};

const formatLogValue = (fieldName: string, value?: string | null) => {
  if (value == null || value === '') return 'Không có';

  const numericValue = Number(value);
  const field = fieldName.toLocaleLowerCase('vi');
  if (field === 'orderstatus' && Number.isFinite(numericValue) && isOrderStatus(numericValue)) {
    return orderStatusLabel[numericValue];
  }
  if (field === 'paymentstatus' && Number.isFinite(numericValue) && isPaymentStatus(numericValue)) {
    return paymentStatusLabel[numericValue];
  }
  if (field === 'deliveryat' || field === 'deliveryto') {
    const date = new Date(value);
    if (Number.isFinite(date.getTime())) return formatDateTime(value);
  }
  return value;
};

const ProductVisual: React.FC<{ item: OrderItemDto; illustrationUrl?: string }> = ({ item, illustrationUrl }) => {
  const visuals = [
    item.thumbnailUrl ? { url: item.thumbnailUrl, alt: `Ảnh đại diện sản phẩm ${item.productName}` } : null,
    illustrationUrl ? { url: illustrationUrl, alt: `Ảnh minh họa ${item.productName}` } : null,
  ].filter((visual): visual is { url: string; alt: string } => visual !== null);

  return visuals.length > 0 ? (
    <div className="flex shrink-0 gap-1" aria-label={`Hình ảnh của ${item.productName}`}>
      {visuals.map((visual) => (
        <img
          key={`${visual.alt}-${visual.url}`}
          src={resolveApiResourceUrl(visual.url)}
          alt={visual.alt}
          title={visual.alt}
          className="h-12 w-12 rounded-admin-control border border-admin-border object-cover"
        />
      ))}
    </div>
  ) : (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-admin-control border border-admin-border bg-admin-muted text-admin-text-muted"
      role="img"
      aria-label={`Không có hình ảnh cho ${item.productName}`}
    >
      <PackageOpen size={21} strokeWidth={1.7} aria-hidden="true" />
    </div>
  );
};

const OrderTimeline: React.FC<{ logs: OrderChangeLogDto[] }> = ({ logs }) => (
  <section className="rounded-admin-panel border border-admin-border bg-admin-surface shadow-admin-panel" aria-labelledby="timeline-title">
    <div className="border-b border-admin-border px-4 py-4 sm:px-5">
      <div className="flex items-center gap-2">
        <Truck size={19} strokeWidth={1.8} className="text-admin-primary" aria-hidden="true" />
        <h2 id="timeline-title" className="text-base font-semibold text-admin-text-primary">Timeline trạng thái và thay đổi</h2>
      </div>
      <p className="mt-1 text-xs text-admin-text-muted">Mới nhất trước</p>
    </div>
    {logs.length === 0 ? (
      <p className="px-4 py-8 text-center text-sm text-admin-text-secondary" role="status">Chưa có lịch sử thay đổi.</p>
    ) : (
      <ol className="px-4 py-2 sm:px-5" aria-label="Lịch sử đơn hàng, sắp xếp mới nhất trước">
        {logs.map((log, index) => (
          <li key={log.id} className="relative grid grid-cols-[1rem_minmax(0,1fr)] gap-3 pb-5 pt-3 last:pb-3">
            {index < logs.length - 1 ? <span className="absolute bottom-0 left-[0.4375rem] top-7 w-px bg-admin-border" aria-hidden="true" /> : null}
            <span className="relative mt-1.5 h-3 w-3 rounded-full border-2 border-admin-surface bg-admin-primary ring-1 ring-admin-primary/30" aria-hidden="true" />
            <article className="min-w-0">
              <div className="flex flex-col gap-1">
                <h3 className="break-words text-sm font-semibold text-admin-text-primary">{formatLogField(log)}</h3>
                <time dateTime={log.changedAt} className="text-xs tabular-nums text-admin-text-muted">{formatDateTime(log.changedAt)}</time>
              </div>
              <p className="mt-1 break-words text-sm leading-6 text-admin-text-secondary">
                <span>{formatLogValue(log.fieldName, log.oldValue)}</span>
                <span className="mx-2 text-admin-text-muted" aria-hidden="true">→</span>
                <span className="font-medium text-admin-text-primary">{formatLogValue(log.fieldName, log.newValue)}</span>
              </p>
              <p className="mt-1 text-xs text-admin-text-muted">Thực hiện bởi {log.changedByName || 'Không có thông tin'}</p>
              {log.note ? <p className="mt-2 break-words text-sm leading-6 text-admin-text-secondary">{log.note}</p> : null}
            </article>
          </li>
        ))}
      </ol>
    )}
  </section>
);

const DetailLoadingState: React.FC = () => (
  <div role="status" aria-label="Đang tải chi tiết đơn hàng" className="space-y-5">
    <div className="animate-pulse space-y-3" aria-hidden="true">
      <div className="h-5 w-28 rounded bg-admin-muted" />
      <div className="h-8 w-52 rounded bg-admin-muted" />
      <div className="h-5 w-72 max-w-full rounded bg-admin-muted" />
    </div>
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)]">
      <div className="space-y-5 xl:col-start-1 xl:row-start-1">
        {['h-56', 'h-72', 'h-64'].map((heightClass) => (
          <div
            key={heightClass}
            className={`${heightClass} animate-pulse rounded-admin-panel border border-admin-border bg-admin-surface`}
            aria-hidden="true"
          />
        ))}
      </div>
      <div
        className="h-80 animate-pulse rounded-admin-panel border border-admin-border bg-admin-surface xl:col-start-2 xl:row-start-1"
        aria-hidden="true"
      />
    </div>
    <span className="sr-only">Đang tải dữ liệu đơn hàng.</span>
  </div>
);

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const canManageOrder = hasPermission(Permission.OrdersManage);
  const canCancelOrder = hasPermission(Permission.OrdersCancel);
  const [order, setOrder] = useState<OrderDetailDto | null>(null);
  const [channels, setChannels] = useState<ChannelDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const actionLockRef = useRef(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [channelData, orderData] = await Promise.all([channelsApi.list(), ordersApi.getById(id)]);
      setChannels(channelData);
      setOrder(orderData);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [id]);

  const refreshOrder = useCallback(async () => {
    if (!id) return;
    setOrder(await ordersApi.getById(id));
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const channelName = channels.find((channel) => channel.id === order?.channelId)?.name ?? order?.channelId;
  const orderTransitions = order ? nextOrderStatuses(order.orderStatus) : [];
  const paymentTransitions = order ? nextPaymentStatuses(order.paymentStatus) : [];
  const primaryStatus = orderTransitions.find((status) => status !== OrderStatus.Cancelled);
  const canCancel = orderTransitions.includes(OrderStatus.Cancelled);
  const deliveryUrgency = order ? getDeliveryUrgency(order.deliveryAt, order.orderStatus) : null;

  const sortedLogs = useMemo(
    () =>
      order
        ? [...order.changeLogs].sort(
            (left, right) => new Date(right.changedAt).getTime() - new Date(left.changedAt).getTime(),
          )
        : [],
    [order],
  );

  const paymentAmounts = useMemo(() => {
    if (!order) return { paid: 0, remaining: 0 };
    const paid =
      order.paymentStatus === PaymentStatus.Paid
        ? order.totalAmount
        : order.paymentStatus === PaymentStatus.Deposited
          ? Math.min(Math.max(order.depositAmount, 0), Math.max(order.totalAmount, 0))
          : 0;
    return { paid, remaining: Math.max(order.totalAmount - paid, 0) };
  }, [order]);

  const changeStatus = async (status: OrderStatus) => {
    if (
      !id ||
      !order ||
      busyAction ||
      actionLockRef.current ||
      !nextOrderStatuses(order.orderStatus).includes(status)
    ) return;
    actionLockRef.current = true;
    setBusyAction(`status-${status}`);
    setError(null);
    setActionMessage(null);
    try {
      await ordersApi.changeStatus(id, status);
      await refreshOrder();
      setPendingStatus(null);
      setActionMessage(`Đã cập nhật trạng thái đơn thành ${orderStatusLabel[status].toLocaleLowerCase('vi')}.`);
    } catch (updateError) {
      setError(getApiErrorMessage(updateError));
    } finally {
      actionLockRef.current = false;
      setBusyAction(null);
    }
  };

  const requestStatusChange = (status: OrderStatus) => {
    if (status === OrderStatus.Cancelled || status === OrderStatus.Completed) {
      setPendingStatus(status);
      return;
    }
    void changeStatus(status);
  };

  const changePaymentStatus = async (status: PaymentStatus) => {
    if (
      !id ||
      !order ||
      busyAction ||
      actionLockRef.current ||
      !nextPaymentStatuses(order.paymentStatus).includes(status)
    ) return;
    actionLockRef.current = true;
    setBusyAction(`payment-${status}`);
    setError(null);
    setActionMessage(null);
    try {
      await ordersApi.changePaymentStatus(id, status);
      await refreshOrder();
      setActionMessage(`Đã cập nhật thanh toán thành ${paymentStatusLabel[status].toLocaleLowerCase('vi')}.`);
    } catch (updateError) {
      setError(getApiErrorMessage(updateError));
    } finally {
      actionLockRef.current = false;
      setBusyAction(null);
    }
  };

  if (loading) return <DetailLoadingState />;

  if (!order) {
    return (
      <section
        className="flex min-h-72 flex-col items-center justify-center rounded-admin-panel border border-admin-border bg-admin-surface px-5 py-12 text-center"
        role="alert"
        aria-labelledby="order-load-error-title"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-admin-panel bg-admin-status-error/10 text-admin-status-error">
          <RefreshCw size={22} strokeWidth={1.8} aria-hidden="true" />
        </div>
        <h1 id="order-load-error-title" className="mt-4 text-lg font-semibold text-admin-text-primary">
          Không thể tải chi tiết đơn
        </h1>
        <p className="mt-1 max-w-md text-sm leading-6 text-admin-text-secondary">
          {error ?? 'Không tìm thấy dữ liệu đơn hàng.'}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link
            to="/admin/orders"
            className="btn-press inline-flex min-h-11 items-center justify-center rounded-admin-control border border-admin-border bg-admin-surface px-4 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted"
          >
            Về danh sách
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            className="btn-press inline-flex min-h-11 items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover"
          >
            <RefreshCw size={16} strokeWidth={1.8} aria-hidden="true" />
            Thử lại
          </button>
        </div>
      </section>
    );
  }

  const pendingStatusIsCancel = pendingStatus === OrderStatus.Cancelled;
  const statusDialogBusy = pendingStatus != null && busyAction === `status-${pendingStatus}`;

  return (
    <div className="min-w-0 pb-4">
      <Link
        to="/admin/orders"
        className="mb-4 inline-flex min-h-9 items-center gap-1.5 rounded-admin-control text-sm font-medium text-admin-text-secondary transition-colors hover:text-admin-primary"
      >
        <ArrowLeft size={16} strokeWidth={1.8} aria-hidden="true" />
        Danh sách đơn
      </Link>

      <header className="mb-5 border-b border-admin-border pb-5 sm:mb-6 sm:pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="break-words font-mono text-2xl font-semibold tracking-[-0.02em] text-admin-text-primary sm:text-[1.75rem]">
                {order.orderCode}
              </h1>
              <OrderStatusBadge status={order.orderStatus} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-admin-text-secondary">
              <span>Tạo lúc {formatDateTime(order.createdAt)}</span>
              {channelName ? <span className="text-admin-text-muted">Kênh {channelName}</span> : null}
            </p>
          </div>
          <div
            className={[
              'grid w-full shrink-0 grid-cols-1 gap-2 lg:w-auto',
              primaryStatus ? 'xs:grid-cols-2' : '',
            ].join(' ')}
          >
            {primaryStatus && canManageOrder ? (
              <button
                type="button"
                onClick={() => requestStatusChange(primaryStatus)}
                disabled={busyAction !== null}
                className="btn-press inline-flex min-h-11 items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-55"
              >
                {busyAction === `status-${primaryStatus}` ? (
                  <LoaderCircle size={17} strokeWidth={1.8} className="animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowRight size={17} strokeWidth={1.8} aria-hidden="true" />
                )}
                {busyAction === `status-${primaryStatus}`
                  ? 'Đang cập nhật'
                  : PRIMARY_STATUS_ACTION[primaryStatus] ?? orderStatusLabel[primaryStatus]}
              </button>
            ) : null}
            {canManageOrder ? (
              <Link
                to={`/admin/orders/${order.id}/edit`}
                className="btn-press inline-flex min-h-11 items-center justify-center gap-2 rounded-admin-control border border-admin-border bg-admin-surface px-4 text-sm font-semibold text-admin-text-primary transition-colors hover:border-admin-primary/45 hover:bg-admin-primary/5 hover:text-admin-primary"
              >
                <Edit3 size={17} strokeWidth={1.8} aria-hidden="true" />
                Sửa đơn
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <div aria-live="polite" aria-atomic="true">
        {error ? (
          <div className="mb-5 rounded-admin-control border border-admin-status-error/30 bg-red-50 px-4 py-3 text-sm text-admin-status-error" role="alert">
            {error}
          </div>
        ) : null}
        {actionMessage ? (
          <div className="mb-5 flex items-start gap-2 rounded-admin-control border border-admin-status-success/25 bg-admin-status-success/8 px-4 py-3 text-sm text-admin-status-success" role="status">
            <CheckCircle2 size={18} strokeWidth={1.8} className="mt-0.5 shrink-0" aria-hidden="true" />
            {actionMessage}
          </div>
        ) : null}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] xl:items-start">
        <aside
          className="space-y-5 xl:col-start-2 xl:row-start-1"
        >
          <section className="rounded-admin-panel border border-admin-border bg-admin-surface shadow-admin-panel" aria-labelledby="order-actions-title">
            <div className="border-b border-admin-border px-4 py-4 sm:px-5">
            <h2 id="order-actions-title" className="text-base font-semibold text-admin-text-primary">
              Trạng thái và hành động
            </h2>
            <p className="mt-1 text-sm leading-5 text-admin-text-secondary">Chỉ các bước hợp lệ tiếp theo được hiển thị.</p>
          </div>

            <div className="space-y-5 px-4 py-4 sm:px-5">
            <section aria-labelledby="order-status-action-title">
              <div className="flex items-center justify-between gap-3">
                <h3 id="order-status-action-title" className="text-sm font-semibold text-admin-text-primary">Đơn hàng</h3>
                <OrderStatusBadge status={order.orderStatus} />
              </div>
              {primaryStatus ? (
                <div className="mt-3 rounded-admin-control bg-admin-primary/5 px-3 py-2.5">
                  <p className="text-xs font-medium text-admin-text-muted">Bước tiếp theo</p>
                  <p className="mt-1 text-sm font-semibold text-admin-primary">
                    {PRIMARY_STATUS_ACTION[primaryStatus] ?? orderStatusLabel[primaryStatus]}
                  </p>
                </div>
              ) : (
                <p className="mt-3 rounded-admin-control bg-admin-muted px-3 py-2.5 text-sm text-admin-text-secondary">
                  Đơn không còn bước xử lý tiếp theo.
                </p>
              )}
              {canCancel && canCancelOrder ? (
                <button
                  type="button"
                  onClick={() => requestStatusChange(OrderStatus.Cancelled)}
                  disabled={busyAction !== null}
                  className="btn-press mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-admin-control text-sm font-semibold text-admin-status-error transition-colors hover:bg-admin-status-error/8 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <XCircle size={17} strokeWidth={1.8} aria-hidden="true" />
                  Hủy đơn
                </button>
              ) : null}
            </section>

            <section className="border-t border-admin-border pt-5" aria-labelledby="payment-action-title">
              <div className="flex items-center justify-between gap-3">
                <h3 id="payment-action-title" className="text-sm font-semibold text-admin-text-primary">Thanh toán</h3>
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
              {paymentTransitions.length > 0 && canManageOrder ? (
                <div className="mt-3 grid gap-2">
                  {paymentTransitions.map((status, index) => {
                    const updating = busyAction === `payment-${status}`;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => void changePaymentStatus(status)}
                        disabled={busyAction !== null}
                        className={[
                          'btn-press inline-flex min-h-11 items-center justify-center gap-2 rounded-admin-control px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                          index === 0
                            ? 'border border-admin-primary/35 bg-admin-primary/5 text-admin-primary hover:bg-admin-primary/10'
                            : 'text-admin-text-secondary hover:bg-admin-muted hover:text-admin-text-primary',
                        ].join(' ')}
                      >
                        {updating ? (
                          <LoaderCircle size={16} strokeWidth={1.8} className="animate-spin" aria-hidden="true" />
                        ) : (
                          <WalletCards size={16} strokeWidth={1.8} aria-hidden="true" />
                        )}
                        {updating ? 'Đang cập nhật' : paymentStatusLabel[status]}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 text-sm text-admin-text-secondary">Thanh toán đã hoàn tất.</p>
              )}
            </section>

            </div>
          </section>
          <OrderTimeline logs={sortedLogs} />
        </aside>

        <main className="min-w-0 space-y-5 xl:col-start-1 xl:row-start-1">
          <section
            className={[
              'overflow-hidden rounded-admin-panel border bg-admin-surface shadow-admin-panel',
              deliveryUrgency === 'late' ? 'border-admin-status-error/40' : 'border-admin-border',
            ].join(' ')}
            aria-labelledby="delivery-title"
          >
            <div className="flex flex-col gap-4 border-b border-admin-border px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <CalendarClock size={19} strokeWidth={1.8} className="shrink-0 text-admin-primary" aria-hidden="true" />
                  <h2 id="delivery-title" className="text-base font-semibold text-admin-text-primary">Giao hàng và khách hàng</h2>
                </div>
                <p className="mt-2 text-lg font-semibold tabular-nums text-admin-text-primary sm:text-xl">
                  {formatDeliveryWindow(order.deliveryAt, order.deliveryTo)}
                </p>
                {order.provinceShipping ? <p className="mt-1 text-xs font-medium text-admin-primary">Thời gian gửi đơn vị vận chuyển</p> : null}
              </div>
              {deliveryUrgency ? <DeliveryUrgencyBadge urgency={deliveryUrgency} /> : null}
            </div>

            {deliveryUrgency ? (
              <div
                className={[
                  'border-b px-4 py-3 text-sm font-medium sm:px-5',
                  deliveryUrgency === 'late'
                    ? 'border-admin-status-error/20 bg-admin-status-error/8 text-admin-status-error'
                    : 'border-admin-status-warning/20 bg-admin-status-warning/8 text-admin-status-warning',
                ].join(' ')}
                role={deliveryUrgency === 'late' ? 'alert' : 'status'}
              >
                {deliveryUrgency === 'late'
                  ? 'Đơn đã qua thời gian giao dự kiến và vẫn đang được xử lý.'
                  : 'Đơn cần được giao trong vòng 24 giờ tới.'}
              </div>
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-3">
              <div className="px-4 py-4 sm:px-5">
                <h3 className="text-sm font-semibold text-admin-text-primary">Người nhận</h3>
                <div className="mt-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-admin-control bg-admin-muted text-admin-text-secondary">
                    <UserRound size={19} strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-admin-text-primary">{order.recipientName}</p>
                    <a
                      href={`tel:${order.recipientPhone}`}
                      className="mt-1 inline-flex min-h-7 items-center gap-1.5 text-sm text-admin-text-secondary hover:text-admin-primary"
                      aria-label={`Gọi người nhận ${order.recipientName} theo số ${order.recipientPhone}`}
                    >
                      <Phone size={14} strokeWidth={1.8} aria-hidden="true" />
                      <span dir="ltr">{order.recipientPhone}</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="border-t border-admin-border px-4 py-4 sm:px-5 lg:border-l lg:border-t-0">
                <h3 className="text-sm font-semibold text-admin-text-primary">Người đặt</h3>
                <div className="mt-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-admin-control bg-admin-muted text-admin-text-secondary">
                    <UserRound size={19} strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-admin-text-primary">{order.ordererName}</p>
                    {order.ordererPhone ? (
                      <a href={`tel:${order.ordererPhone}`} className="mt-1 inline-flex min-h-7 items-center gap-1.5 text-sm text-admin-text-secondary hover:text-admin-primary" aria-label={`Gọi người đặt ${order.ordererName} theo số ${order.ordererPhone}`}>
                        <Phone size={14} strokeWidth={1.8} aria-hidden="true" />
                        <span dir="ltr">{order.ordererPhone}</span>
                      </a>
                    ) : <p className="mt-1 text-sm text-admin-text-muted">Chưa có số điện thoại</p>}
                    <p className="mt-1 text-xs text-admin-text-muted">Kênh {channelName || 'chưa xác định'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-admin-border px-4 py-4 sm:px-5 lg:border-l lg:border-t-0">
                <h3 className="text-sm font-semibold text-admin-text-primary">
                  {order.pickupAtShop ? 'Nhận tại cửa hàng' : order.provinceShipping ? 'Ship tỉnh' : 'Giao tận nơi'}
                </h3>
                <div className="mt-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-admin-control bg-admin-muted text-admin-text-secondary">
                    {order.pickupAtShop ? (
                      <ShoppingBag size={19} strokeWidth={1.8} aria-hidden="true" />
                    ) : (
                      <MapPin size={19} strokeWidth={1.8} aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 text-sm leading-6 text-admin-text-secondary">
                    <p className="break-words">
                      {order.pickupAtShop ? 'Khách nhận đơn trực tiếp tại shop.' : order.deliveryAddress || (order.provinceShipping ? 'Chưa có địa chỉ ship tỉnh.' : 'Chưa có địa chỉ giao.')}
                    </p>
                    {!order.pickupAtShop && order.deliveryAddressDescription ? (
                      <p className="mt-1.5 break-words rounded-admin-control bg-admin-muted px-2.5 py-2 text-xs leading-5 text-admin-text-primary">
                        {order.deliveryAddressDescription}
                      </p>
                    ) : null}
                    {!order.pickupAtShop && order.deliveryLatitude != null && order.deliveryLongitude != null ? (
                      <p className="mt-1 font-mono text-xs tabular-nums text-admin-text-muted">
                        {order.deliveryLatitude.toFixed(5)}, {order.deliveryLongitude.toFixed(5)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-admin-panel border border-admin-border bg-admin-surface shadow-admin-panel" aria-labelledby="products-title">
            <div className="flex items-center justify-between gap-3 border-b border-admin-border px-4 py-4 sm:px-5">
              <div className="flex min-w-0 items-center gap-2">
                <PackageOpen size={19} strokeWidth={1.8} className="shrink-0 text-admin-primary" aria-hidden="true" />
                <h2 id="products-title" className="text-base font-semibold text-admin-text-primary">Danh sách sản phẩm</h2>
              </div>
              <span className="shrink-0 text-sm tabular-nums text-admin-text-secondary">{order.items.length} dòng</span>
            </div>

            {order.items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-admin-text-secondary" role="status">
                Đơn chưa có sản phẩm.
              </div>
            ) : (
              <>
                <ol className="divide-y divide-admin-border md:hidden">
                  {order.items.map((item) => (
                    <li key={item.id} className="px-4 py-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <ProductVisual item={item} illustrationUrl={order.images.find((image) => image.orderItemId === item.id)?.imageUrl} />
                        <div className="min-w-0 flex-1">
                          <p className="break-words font-semibold leading-5 text-admin-text-primary">{item.productName}</p>
                          {item.productSku ? <p className="mt-1 font-mono text-xs text-admin-text-muted">{item.productSku}</p> : null}
                          {item.note ? (
                            <p className="mt-2 break-words rounded-admin-control bg-admin-muted px-2.5 py-2 text-xs leading-5 text-admin-text-secondary">
                              Ghi chú: {item.note}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-admin-border pt-3 text-sm">
                        <div>
                          <dt className="text-xs text-admin-text-muted">Đơn giá</dt>
                          <dd className="mt-1 tabular-nums text-admin-text-primary">{formatOrderCurrency(item.unitPrice)}</dd>
                        </div>
                        <div className="text-center">
                          <dt className="text-xs text-admin-text-muted">Số lượng</dt>
                          <dd className="mt-1 font-semibold tabular-nums text-admin-text-primary">{item.quantity}</dd>
                        </div>
                        <div className="text-right">
                          <dt className="text-xs text-admin-text-muted">Thành tiền</dt>
                          <dd className="mt-1 font-semibold tabular-nums text-admin-text-primary">{formatOrderCurrency(item.lineTotal)}</dd>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ol>

                <table className="hidden w-full table-fixed text-left text-sm md:table">
                  <caption className="sr-only">Sản phẩm trong đơn, đơn giá, số lượng và thành tiền</caption>
                  <colgroup>
                    <col className="w-[52%]" />
                    <col className="w-[18%]" />
                    <col className="w-[10%]" />
                    <col className="w-[20%]" />
                  </colgroup>
                  <thead className="border-b border-admin-border bg-admin-muted/55 text-xs text-admin-text-secondary">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold sm:px-5">Sản phẩm</th>
                      <th scope="col" className="px-3 py-3 text-right font-semibold">Đơn giá</th>
                      <th scope="col" className="px-3 py-3 text-right font-semibold">SL</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold sm:px-5">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-admin-border">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <th scope="row" className="px-4 py-4 font-normal sm:px-5">
                          <div className="flex min-w-0 items-start gap-3">
                            <ProductVisual item={item} illustrationUrl={order.images.find((image) => image.orderItemId === item.id)?.imageUrl} />
                            <div className="min-w-0">
                              <p className="break-words font-semibold leading-5 text-admin-text-primary">{item.productName}</p>
                              {item.productSku ? <p className="mt-1 font-mono text-xs text-admin-text-muted">{item.productSku}</p> : null}
                              {item.note ? (
                                <p className="mt-2 break-words text-xs leading-5 text-admin-text-secondary">Ghi chú: {item.note}</p>
                              ) : null}
                            </div>
                          </div>
                        </th>
                        <td className="px-3 py-4 text-right tabular-nums text-admin-text-secondary">{formatOrderCurrency(item.unitPrice)}</td>
                        <td className="px-3 py-4 text-right font-semibold tabular-nums text-admin-text-primary">{item.quantity}</td>
                        <td className="px-4 py-4 text-right font-semibold tabular-nums text-admin-text-primary sm:px-5">{formatOrderCurrency(item.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </section>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start">
            <section className="rounded-admin-panel border border-admin-border bg-admin-surface shadow-admin-panel" aria-labelledby="notes-title">
              <div className="flex items-center gap-2 border-b border-admin-border px-4 py-4 sm:px-5">
                <ShoppingBag size={19} strokeWidth={1.8} className="text-admin-primary" aria-hidden="true" />
                <h2 id="notes-title" className="text-base font-semibold text-admin-text-primary">Ghi chú</h2>
              </div>
              {order.description || order.contentNote ? (
                <dl className="divide-y divide-admin-border px-4 sm:px-5">
                  {order.description ? (
                    <div className="py-4">
                      <dt className="text-xs font-semibold text-admin-text-muted">Mô tả đơn</dt>
                      <dd className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 text-admin-text-primary">{order.description}</dd>
                    </div>
                  ) : null}
                  {order.contentNote ? (
                    <div className="py-4">
                      <dt className="text-xs font-semibold text-admin-text-muted">Nội dung cần thực hiện</dt>
                      <dd className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 text-admin-text-primary">{order.contentNote}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : (
                <p className="px-4 py-6 text-sm text-admin-text-secondary sm:px-5">Đơn không có ghi chú.</p>
              )}
            </section>

            <section className="rounded-admin-panel border border-admin-border bg-admin-surface shadow-admin-panel" aria-labelledby="payment-summary-title">
              <div className="flex items-center gap-2 border-b border-admin-border px-4 py-4 sm:px-5">
                <WalletCards size={19} strokeWidth={1.8} className="text-admin-primary" aria-hidden="true" />
                <h2 id="payment-summary-title" className="text-base font-semibold text-admin-text-primary">Tổng kết thanh toán</h2>
              </div>
              <dl className="space-y-3 px-4 py-4 text-sm sm:px-5">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-admin-text-secondary">Tạm tính</dt>
                  <dd className="shrink-0 font-medium tabular-nums text-admin-text-primary">{formatOrderCurrency(order.subTotal)}</dd>
                </div>
                {order.shippingFee > 0 ? (
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-admin-text-secondary">Phí giao dự kiến</dt>
                    <dd className="shrink-0 font-medium tabular-nums text-admin-text-primary">{formatOrderCurrency(order.shippingFee)}</dd>
                  </div>
                ) : null}
                {order.shippingFeeActual != null ? (
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-admin-text-secondary">Phí giao thực tế</dt>
                    <dd className="shrink-0 font-medium tabular-nums text-admin-text-primary">{formatOrderCurrency(order.shippingFeeActual)}</dd>
                  </div>
                ) : null}
                <div className="flex items-end justify-between gap-4 border-t border-admin-border pt-3">
                  <dt className="font-semibold text-admin-text-primary">Tổng cộng</dt>
                  <dd className="shrink-0 text-lg font-semibold tabular-nums text-admin-text-primary">{formatOrderCurrency(order.totalAmount)}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-admin-text-secondary">Đã thanh toán</dt>
                  <dd className="shrink-0 font-semibold tabular-nums text-admin-status-success">{formatOrderCurrency(paymentAmounts.paid)}</dd>
                </div>
                <div className="flex items-start justify-between gap-4 rounded-admin-control bg-admin-muted px-3 py-2.5">
                  <dt className="font-semibold text-admin-text-primary">Còn lại</dt>
                  <dd className="shrink-0 font-semibold tabular-nums text-admin-text-primary">{formatOrderCurrency(paymentAmounts.remaining)}</dd>
                </div>
                {order.depositAmount > 0 ? (
                  <p className="text-xs leading-5 text-admin-text-muted">Tiền cọc ghi nhận: {formatOrderCurrency(order.depositAmount)}</p>
                ) : null}
              </dl>
            </section>
          </div>

          {order.images.length > 0 ? (
            <section className="rounded-admin-panel border border-admin-border bg-admin-surface shadow-admin-panel" aria-labelledby="attachments-title">
              <div className="flex items-center justify-between gap-3 border-b border-admin-border px-4 py-4 sm:px-5">
                <div className="flex items-center gap-2">
                  <ImageIcon size={19} strokeWidth={1.8} className="text-admin-primary" aria-hidden="true" />
                  <div>
                    <h2 id="attachments-title" className="text-base font-semibold text-admin-text-primary">Ảnh đính kèm</h2>
                    <p className="mt-0.5 text-xs text-admin-text-muted">Nhấp đúp vào ảnh để mở bản đầy đủ.</p>
                  </div>
                </div>
                <span className="text-sm tabular-nums text-admin-text-secondary">{order.images.length} ảnh</span>
              </div>
              <ul className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:p-5 lg:grid-cols-4">
                {order.images.map((image, index) => {
                  const imageUrl = resolveApiResourceUrl(image.imageUrl);
                  const openPreview = () => window.open(imageUrl, '_blank', 'noopener,noreferrer');

                  return (
                    <li key={image.id} className="min-w-0">
                      <button
                        type="button"
                        onDoubleClick={openPreview}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter') return;
                          event.preventDefault();
                          openPreview();
                        }}
                        className="group block w-full cursor-zoom-in overflow-hidden rounded-admin-control border border-admin-border bg-admin-muted text-left transition-colors hover:border-admin-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/25"
                        aria-label={`Nhấp đúp để mở ảnh đính kèm ${index + 1} của đơn ${order.orderCode} trong cửa sổ mới`}
                        title="Nhấp đúp để mở ảnh trong cửa sổ mới"
                      >
                      <img
                        src={imageUrl}
                        alt={image.description || `Ảnh đính kèm ${index + 1} của đơn ${order.orderCode}`}
                        loading="lazy"
                        className="aspect-square w-full object-cover transition-opacity group-hover:opacity-90"
                      />
                      </button>
                      <p className="mt-1.5 break-words text-xs text-admin-text-secondary">
                        {order.items.find((item) => item.id === image.orderItemId)?.productName ?? image.description ?? 'Ảnh minh họa đơn hàng'}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

        </main>
      </div>

      <SettingsDialog
        open={pendingStatus != null}
        title={pendingStatusIsCancel ? `Hủy đơn ${order.orderCode}` : `Hoàn tất đơn ${order.orderCode}`}
        description={
          pendingStatusIsCancel
            ? 'Đơn đã hủy không thể chuyển sang trạng thái xử lý khác.'
            : 'Sau khi hoàn tất, đơn sẽ không còn bước trạng thái tiếp theo.'
        }
        onRequestClose={() => {
          if (!statusDialogBusy) setPendingStatus(null);
        }}
        closeLabel="Đóng xác nhận cập nhật trạng thái"
      >
        <ConfirmationPanel
          title={pendingStatusIsCancel ? 'Xác nhận hủy đơn' : 'Xác nhận hoàn tất đơn'}
          description={
            pendingStatusIsCancel
              ? 'Hãy kiểm tra với khách hàng trước khi hủy. Thao tác này chỉ đổi trạng thái đơn, không xóa dữ liệu.'
              : 'Hãy chắc chắn đơn đã được giao hoặc bàn giao đầy đủ trước khi hoàn tất.'
          }
          confirmLabel={pendingStatusIsCancel ? 'Hủy đơn' : 'Hoàn tất đơn'}
          tone={pendingStatusIsCancel ? 'danger' : 'warning'}
          busy={statusDialogBusy}
          onCancel={() => {
            if (!statusDialogBusy) setPendingStatus(null);
          }}
          onConfirm={() => {
            if (pendingStatus != null) void changeStatus(pendingStatus);
          }}
        />
      </SettingsDialog>

    </div>
  );
};
