import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Edit3,
  Image as ImageIcon,
  Leaf,
  LoaderCircle,
  MapPin,
  PackageOpen,
  PauseCircle,
  Phone,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  Truck,
  UserRound,
  WalletCards,
  XCircle,
} from '@/shared/icons/lucideAnimated';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Permission } from '@/features/auth/permissions';
import { channelsApi, type ChannelDto } from '@/features/settings/channels/api/channelsApi';
import { ConfirmationPanel, SettingsDialog } from '@/features/settings/components/SettingsDialog';
import { ImagePreview, type ImagePreviewItem } from '@/shared/components/ImagePreview';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { ordersApi } from '../api/ordersApi';
import { OrderStatusBadge, PaymentStatusBadge, DeliveryUrgencyBadge } from '../components/OrderStatusBadges';
import { OrderMaterialsPanel } from '../components/OrderMaterialsPanel';
import {
  nextOrderStatuses,
  nextPaymentStatuses,
  orderStatusLabel,
  paymentStatusLabel,
} from '../constants/orderLabels';
import type { OrderChangeLogDto, OrderDetailDto, OrderImageDto, OrderItemDto } from '../types/order.types';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../types/order.types';
import {
  formatOrderCurrency,
  formatOrderDateTime,
  formatDeliveryWindow,
  getDeliveryUrgency,
} from '../utils/orderListFormatters';

const PRIMARY_STATUS_ACTION: Partial<Record<OrderStatus, string>> = {
  [OrderStatus.Confirmed]: 'Chuẩn bị đơn',
  [OrderStatus.Producing]: 'Chuẩn bị đơn',
  [OrderStatus.Ready]: 'Đã làm xong',
  [OrderStatus.Shipping]: 'Giao hàng',
  [OrderStatus.Delivered]: 'Giao thành công',
  [OrderStatus.DeliveryFailed]: 'Giao chưa thành công',
};

const navigationSuccessMessage = (state: unknown): string | null => {
  if (typeof state !== 'object' || state === null || !('successMessage' in state)) return null;
  const message = state.successMessage;
  return typeof message === 'string' && message.trim() ? message : null;
};

const isOrderStatus = (value: number): value is OrderStatus =>
  [
    OrderStatus.Created,
    OrderStatus.Producing,
    OrderStatus.Shipping,
    OrderStatus.Completed,
    OrderStatus.Confirmed,
    OrderStatus.Ready,
    OrderStatus.Delivered,
    OrderStatus.DeliveryFailed,
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
  if ([
    'depositamount',
    'shippingfee',
    'shippingfeeactual',
    'subtotal',
    'totalamount',
    'unitprice',
    'linetotal',
  ].includes(field) && Number.isFinite(numericValue)) {
    return formatOrderCurrency(numericValue);
  }
  if (field === 'deliveryat' || field === 'deliveryto') {
    const date = new Date(value);
    if (Number.isFinite(date.getTime())) return formatOrderDateTime(value);
  }
  return value;
};

const ProductVisual: React.FC<{ item: OrderItemDto; illustrations: OrderImageDto[] }> = ({ item, illustrations }) => {
  const productTitle = [item.productSku, item.productName].filter(Boolean).join(' - ');
  const visuals: ImagePreviewItem[] = [
    ...(item.thumbnailUrl ? [{
      src: item.thumbnailUrl,
      alt: `Ảnh đại diện sản phẩm ${item.productName}`,
      title: productTitle,
      caption: 'Ảnh đại diện được lưu cùng đơn hàng',
    }] : []),
    ...[...illustrations]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((image, index) => ({
        src: image.imageUrl,
        alt: image.description || `${index === 0 ? 'Ảnh minh họa' : `Ảnh minh họa ${index + 1}`} ${item.productName}`,
        title: productTitle,
        caption: image.description || `Ảnh đính kèm sản phẩm ${item.productName}`,
      })),
  ];

  return visuals.length > 0 ? (
    <div className="flex shrink-0 gap-1" aria-label={`Hình ảnh của ${item.productName}`}>
      {visuals.map((visual) => (
        <ImagePreview
          key={`${visual.alt}-${visual.src}`}
          src={visual.src}
          alt={visual.alt}
          title={visual.title}
          caption={visual.caption}
          previewTitle={productTitle}
          gallery={visuals}
          buttonClassName="h-12 w-12 rounded-admin-control"
          thumbnailClassName="h-12 w-12 rounded-admin-control border border-admin-border object-cover"
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

const WORKFLOW_ACTION: Partial<Record<OrderStatus, Parameters<typeof ordersApi.runWorkflowAction>[1]>> = {
  [OrderStatus.Confirmed]: 'confirm',
  [OrderStatus.Producing]: 'start-preparation',
  [OrderStatus.Ready]: 'ready',
  [OrderStatus.Shipping]: 'dispatch',
  [OrderStatus.Delivered]: 'delivered',
  [OrderStatus.DeliveryFailed]: 'delivery-failed',
  [OrderStatus.Cancelled]: 'cancel',
};

const previousOrderStatus = (status: OrderStatus): OrderStatus | null => {
  if (status === OrderStatus.Confirmed) return OrderStatus.Created;
  if (status === OrderStatus.Producing) return OrderStatus.Created;
  if (status === OrderStatus.Ready) return OrderStatus.Producing;
  if (status === OrderStatus.Shipping) return OrderStatus.Ready;
  if (status === OrderStatus.DeliveryFailed) return OrderStatus.Shipping;
  return null;
};

const OrderItemIngredients: React.FC<{ item: OrderItemDto }> = ({ item }) => (
  <div className="mt-3 rounded-admin-control border border-admin-border bg-admin-muted/35 px-3 py-2.5">
    <div className="flex items-center justify-between gap-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-admin-text-primary">
        <Leaf size={14} className="text-admin-primary" aria-hidden="true" /> Nguyên liệu cần chuẩn bị
      </p>
      <span className="text-xs tabular-nums text-admin-text-muted">{item.ingredientSnapshots?.length ?? 0} loại</span>
    </div>
    {item.ingredientSnapshots?.length ? (
      <ul className="mt-2 space-y-1.5">
        {[...item.ingredientSnapshots].sort((left, right) => left.sortOrder - right.sortOrder).map((ingredient) => (
          <li key={ingredient.id} className="flex items-start justify-between gap-3 text-xs">
            <span className="min-w-0 text-admin-text-secondary">
              <span className="font-medium text-admin-text-primary">{ingredient.ingredientName}</span>
              {ingredient.note ? <span className="ml-1 text-admin-text-muted">· {ingredient.note}</span> : null}
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-admin-text-primary">
              {ingredient.totalBaseQuantity.toLocaleString('vi-VN')} {ingredient.baseUnitSymbol || ingredient.baseUnitName}
            </span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="mt-2 text-xs leading-5 text-admin-text-muted">Dòng sản phẩm này không có nguyên liệu đã lưu.</p>
    )}
  </div>
);

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
                <time dateTime={log.changedAt} className="text-xs tabular-nums text-admin-text-muted">{formatOrderDateTime(log.changedAt)}</time>
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
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canManageOrder = hasPermission(Permission.OrdersManage);
  const canCancelOrder = hasPermission(Permission.OrdersCancel);
  const canReverseOrderStatus = hasPermission(Permission.OrdersReverseStatus);
  const canChangeOrderStatus = hasPermission(Permission.OrdersChangeStatus);
  const [order, setOrder] = useState<OrderDetailDto | null>(null);
  const [channels, setChannels] = useState<ChannelDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(() => navigationSuccessMessage(location.state));
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [reverseDialogOpen, setReverseDialogOpen] = useState(false);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState<OrderStatus>(OrderStatus.Created);
  const [overrideReason, setOverrideReason] = useState('');
  const [shippingFeeDialogOpen, setShippingFeeDialogOpen] = useState(false);
  const [shippingFeeActualInput, setShippingFeeActualInput] = useState('');
  const [shippingFeeIncurredAt, setShippingFeeIncurredAt] = useState('');
  const [shippingFeePaid, setShippingFeePaid] = useState(false);
  const [shippingFeePaidAt, setShippingFeePaidAt] = useState('');
  const [shippingFeeMethod, setShippingFeeMethod] = useState<PaymentMethod>(PaymentMethod.Cash);
  const [paymentDialogStatus, setPaymentDialogStatus] = useState<PaymentStatus | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentReceivedAt, setPaymentReceivedAt] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [holdDialogOpen, setHoldDialogOpen] = useState(false);
  const [holdReason, setHoldReason] = useState('');
  const [recipientDialogOpen, setRecipientDialogOpen] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
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
  const primaryStatus = order
    ? order.orderStatus === OrderStatus.Ready
      ? order.pickupAtShop ? OrderStatus.Delivered : OrderStatus.Shipping
      : orderTransitions.find((nextStatus) => nextStatus !== OrderStatus.Cancelled)
    : undefined;
  const canCancel = orderTransitions.includes(OrderStatus.Cancelled);
  const previousStatus = order ? previousOrderStatus(order.orderStatus) : null;
  const canEditShippingFeeActual = Boolean(
    order
    && canManageOrder
    && !order.pickupAtShop
    && order.orderStatus !== OrderStatus.Cancelled,
  );
  const deliveryUrgency = order ? getDeliveryUrgency(order.deliveryAt, order.orderStatus) : null;
  const returnTo = typeof location.state === 'object' && location.state !== null && 'from' in location.state
    && typeof location.state.from === 'string'
    ? location.state.from
    : '/admin/orders';

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
    const paid = order.paidAmount ?? (order.paymentStatus === PaymentStatus.Paid
      ? order.totalAmount
      : order.paymentStatus === PaymentStatus.Deposited
        ? Math.min(Math.max(order.depositAmount, 0), Math.max(order.totalAmount, 0))
        : 0);
    return { paid, remaining: Math.max(order.totalAmount - paid, 0) };
  }, [order]);

  const imagesByItemId = useMemo(() => {
    const grouped = new Map<string, OrderImageDto[]>();
    order?.images.forEach((image) => {
      if (!image.orderItemId) return;
      const current = grouped.get(image.orderItemId) ?? [];
      current.push(image);
      grouped.set(image.orderItemId, current);
    });
    return grouped;
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
      const action = order.orderStatus === OrderStatus.Created && status === OrderStatus.Producing
        ? 'prepare-order'
        : WORKFLOW_ACTION[status];
      if (!action) throw new Error('Thao tác trạng thái không được hỗ trợ.');
      const updated = await ordersApi.runWorkflowAction(id, action, {
        rowVersion: order.rowVersion,
        reason: status === OrderStatus.Cancelled ? cancelReason.trim() : undefined,
        idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `${action}-${id}-${Date.now()}`,
      });
      setOrder(updated);
      setPendingStatus(null);
      setCancelReason('');
      setActionMessage(`Đã cập nhật trạng thái đơn thành ${orderStatusLabel[status].toLocaleLowerCase('vi')}.`);
    } catch (updateError) {
      setError(getApiErrorMessage(updateError));
    } finally {
      actionLockRef.current = false;
      setBusyAction(null);
    }
  };

  const requestStatusChange = (status: OrderStatus) => {
    if (status === OrderStatus.Cancelled) {
      setPendingStatus(status);
      return;
    }
    void changeStatus(status);
  };

  const openPaymentDialog = (status: PaymentStatus) => {
    if (!order) return;
    const nowParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    const part = (type: string) => nowParts.find(item => item.type === type)?.value ?? '';
    setPaymentDialogStatus(status);
    setPaymentAmountInput(String(status === PaymentStatus.Paid ? (order.remainingAmount ?? paymentAmounts.remaining) : Math.min(order.depositAmount, paymentAmounts.remaining)));
    setPaymentReceivedAt(`${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`);
  };

  const openRecipientDialog = () => {
    if (!order) return;
    setRecipientName(order.recipientName ?? '');
    setRecipientPhone(order.recipientPhone ?? '');
    setRecipientAddress(order.deliveryAddress ?? '');
    setRecipientDialogOpen(true);
  };

  const saveRecipient = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id || !order || busyAction || actionLockRef.current) return;
    actionLockRef.current = true;
    setBusyAction('recipient');
    setError(null);
    try {
      const updated = await ordersApi.updateRecipient(id, {
        recipientName: recipientName.trim() || null,
        recipientPhone: recipientPhone.trim() || null,
        deliveryAddress: recipientAddress.trim() || null,
        rowVersion: order.rowVersion,
      });
      setOrder(updated);
      setRecipientDialogOpen(false);
      setActionMessage('Đã cập nhật thông tin người nhận.');
    } catch (updateError) {
      setError(getApiErrorMessage(updateError));
    } finally {
      actionLockRef.current = false;
      setBusyAction(null);
    }
  };

  const holdOrResume = async () => {
    if (!id || !order || busyAction || actionLockRef.current) return;
    if (!order.holdReason && !holdReason.trim()) {
      setError('Vui lòng nhập lý do tạm dừng.');
      return;
    }
    actionLockRef.current = true;
    setBusyAction(order.holdReason ? 'resume' : 'hold');
    setError(null);
    try {
      const updated = order.holdReason
        ? await ordersApi.resume(id, order.rowVersion)
        : await ordersApi.hold(id, holdReason.trim(), order.rowVersion);
      setOrder(updated);
      setHoldDialogOpen(false);
      setHoldReason('');
      setActionMessage(order.holdReason ? 'Đã tiếp tục xử lý đơn.' : 'Đã tạm dừng xử lý đơn.');
    } catch (updateError) {
      setError(getApiErrorMessage(updateError));
    } finally {
      actionLockRef.current = false;
      setBusyAction(null);
    }
  };

  const changePaymentStatus = async (event: React.FormEvent) => {
    event.preventDefault();
    const status = paymentDialogStatus;
    if (
      status == null ||
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
      const amount = Number(paymentAmountInput.replace(/\D/g, ''));
      if (!amount || !paymentReceivedAt) throw new Error('Vui lòng nhập số tiền và thời điểm thực nhận.');
      await ordersApi.changePaymentStatus(id, status, {
        amount,
        paidAt: `${paymentReceivedAt}:00+07:00`,
        method: PaymentMethod.Other,
        idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `payment-${id}-${Date.now()}`,
      });
      await refreshOrder();
      setPaymentDialogStatus(null);
      setActionMessage(`Đã cập nhật thanh toán thành ${paymentStatusLabel[status].toLocaleLowerCase('vi')}.`);
    } catch (updateError) {
      setError(getApiErrorMessage(updateError));
    } finally {
      actionLockRef.current = false;
      setBusyAction(null);
    }
  };

  const returnToPreviousStatus = async () => {
    if (!id || !order || previousStatus == null || busyAction || actionLockRef.current) return;
    actionLockRef.current = true;
    setBusyAction('reverse-status');
    setError(null);
    setActionMessage(null);
    try {
      await ordersApi.returnToPreviousStatus(id, order.rowVersion);
      await refreshOrder();
      setReverseDialogOpen(false);
      setActionMessage(`Đã trả đơn về trạng thái ${orderStatusLabel[previousStatus].toLocaleLowerCase('vi')}.`);
    } catch (updateError) {
      setError(getApiErrorMessage(updateError));
    } finally {
      actionLockRef.current = false;
      setBusyAction(null);
    }
  };

  const openOverrideStatusDialog = () => {
    if (!order) return;
    const firstAvailable = [
      OrderStatus.Created,
      OrderStatus.Producing,
      OrderStatus.Ready,
      OrderStatus.Shipping,
      OrderStatus.Delivered,
      OrderStatus.DeliveryFailed,
    ].find(status => status !== order.orderStatus);
    if (firstAvailable == null) return;
    setOverrideStatus(firstAvailable);
    setOverrideReason('');
    setOverrideDialogOpen(true);
  };

  const overrideOrderStatus = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id || !order || !canChangeOrderStatus || busyAction || actionLockRef.current) return;
    actionLockRef.current = true;
    setBusyAction('override-status');
    setError(null);
    setActionMessage(null);
    try {
      const updated = await ordersApi.overrideStatus(
        id,
        overrideStatus,
        order.rowVersion,
        overrideReason.trim() || undefined,
      );
      setOrder(updated);
      setOverrideDialogOpen(false);
      setActionMessage(`Đã chuyển trạng thái đơn thành ${orderStatusLabel[updated.orderStatus].toLocaleLowerCase('vi')}.`);
    } catch (updateError) {
      setError(getApiErrorMessage(updateError));
    } finally {
      actionLockRef.current = false;
      setBusyAction(null);
    }
  };

  const openShippingFeeDialog = () => {
    if (!order) return;
    const toLocalInput = (value?: string | null) => value ? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value)).replace(' ', 'T') : '';
    setShippingFeeActualInput(order.shippingFeeActual == null ? '' : String(order.shippingFeeActual));
    setShippingFeeIncurredAt(toLocalInput(order.shippingFeeIncurredAt ?? order.completedAt));
    setShippingFeePaid(Boolean(order.shippingFeePaidAt));
    setShippingFeePaidAt(toLocalInput(order.shippingFeePaidAt));
    setShippingFeeMethod(order.shippingFeePaymentMethod ?? PaymentMethod.Cash);
    setShippingFeeDialogOpen(true);
  };

  const updateShippingFeeActual = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id || !canEditShippingFeeActual || busyAction || actionLockRef.current) return;
    const normalizedInput = shippingFeeActualInput.replace(/\D/g, '');
    const value = normalizedInput === '' ? null : Number(normalizedInput);
    actionLockRef.current = true;
    setBusyAction('shipping-fee-actual');
    setError(null);
    setActionMessage(null);
    try {
      await ordersApi.updateShippingFeeActual(id, value, {
        rowVersion: order?.rowVersion,
        incurredAt: value != null && shippingFeeIncurredAt ? `${shippingFeeIncurredAt}:00+07:00` : undefined,
        paidAt: value != null && shippingFeePaid && shippingFeePaidAt ? `${shippingFeePaidAt}:00+07:00` : undefined,
        method: value != null && shippingFeePaid ? shippingFeeMethod : undefined,
        idempotencyKey: value != null && shippingFeePaid ? (order?.shippingFeePaidAt ? undefined : (globalThis.crypto?.randomUUID?.() ?? `shipping-${id}-${Date.now()}`)) : undefined,
      });
      await refreshOrder();
      setShippingFeeDialogOpen(false);
      setActionMessage(value == null ? 'Đã xóa phí giao hàng thực tế.' : 'Đã cập nhật phí giao hàng thực tế.');
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

  const statusDialogBusy = pendingStatus != null && busyAction === `status-${pendingStatus}`;
  const attachmentGallery: ImagePreviewItem[] = order.images.map((image, index) => {
    const item = order.items.find((orderItem) => orderItem.id === image.orderItemId);
    return {
      src: image.imageUrl,
      alt: image.description || `Ảnh đính kèm ${index + 1} của đơn ${order.orderCode}`,
      title: item
        ? `${item.productSku ? `${item.productSku} - ` : ''}${item.productName}`
        : `Ảnh đính kèm đơn ${order.orderCode}`,
      caption: image.description || item?.productName,
    };
  });

  return (
    <div className="min-w-0 pb-4">
      <button
        type="button"
        onClick={() => navigate(returnTo, { state: { restoreScrollY: typeof location.state === 'object' && location.state !== null && 'scrollY' in location.state ? location.state.scrollY : 0 } })}
        className="mb-4 inline-flex min-h-9 items-center gap-1.5 rounded-admin-control text-sm font-medium text-admin-text-secondary transition-colors hover:text-admin-primary"
      >
        <ArrowLeft size={16} strokeWidth={1.8} aria-hidden="true" />
        Danh sách đơn
      </button>

      <header className="mb-5 border-b border-admin-border pb-5 sm:mb-6 sm:pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="break-words font-mono text-2xl font-semibold tracking-[-0.02em] text-admin-text-primary sm:text-3xl">
                {order.orderCode}
              </h1>
              <OrderStatusBadge status={order.orderStatus} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-admin-text-secondary">
              <span>Tạo lúc {formatOrderDateTime(order.createdAt)}</span>
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
            {canManageOrder && order.orderStatus === OrderStatus.Created ? (
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
              {previousStatus != null && canReverseOrderStatus ? (
                <button
                  type="button"
                  onClick={() => setReverseDialogOpen(true)}
                  disabled={busyAction !== null}
                  className="btn-press mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-admin-control border border-admin-border bg-admin-surface px-3 text-sm font-semibold text-admin-text-secondary transition-colors hover:border-admin-primary/45 hover:bg-admin-primary/5 hover:text-admin-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw size={17} strokeWidth={1.8} aria-hidden="true" />
                  Trả về {orderStatusLabel[previousStatus]}
                </button>
              ) : null}
              {canChangeOrderStatus && ![OrderStatus.Completed, OrderStatus.Cancelled].includes(order.orderStatus) ? (
                <button
                  type="button"
                  onClick={openOverrideStatusDialog}
                  disabled={busyAction !== null}
                  className="btn-press mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-admin-control border border-admin-primary/35 bg-admin-primary/5 px-3 text-sm font-semibold text-admin-primary transition-colors hover:bg-admin-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw size={17} strokeWidth={1.8} aria-hidden="true" />
                  Chuyển trạng thái
                </button>
              ) : null}
              {canManageOrder && ![OrderStatus.Completed, OrderStatus.Cancelled].includes(order.orderStatus) ? (
                <button
                  type="button"
                  onClick={() => {
                    if (order.holdReason) void holdOrResume();
                    else setHoldDialogOpen(true);
                  }}
                  disabled={busyAction !== null}
                  className="btn-press mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-admin-control border border-admin-border bg-admin-surface px-3 text-sm font-semibold text-admin-text-secondary transition-colors hover:border-admin-primary/45 hover:bg-admin-primary/5 hover:text-admin-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {order.holdReason ? <PlayCircle size={17} aria-hidden="true" /> : <PauseCircle size={17} aria-hidden="true" />}
                  {busyAction === 'hold' || busyAction === 'resume' ? 'Đang cập nhật' : order.holdReason ? 'Tiếp tục xử lý' : 'Tạm dừng xử lý'}
                </button>
              ) : null}
              {order.holdReason ? (
                <p className="mt-2 rounded-admin-control border border-admin-status-warning/25 bg-admin-status-warning/8 px-3 py-2 text-xs leading-5 text-admin-text-secondary">
                  <strong className="text-admin-status-warning">Đang tạm dừng:</strong> {order.holdReason}
                </p>
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
                        onClick={() => openPaymentDialog(status)}
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
              <dl className="mt-4 grid grid-cols-2 gap-3 rounded-admin-control bg-admin-muted/60 p-3 text-xs">
                <div><dt className="text-admin-text-muted">Đã thu thực tế</dt><dd className="mt-1 font-semibold tabular-nums">{formatOrderCurrency(paymentAmounts.paid)}</dd></div>
                <div><dt className="text-admin-text-muted">Còn phải thu</dt><dd className="mt-1 font-semibold tabular-nums">{formatOrderCurrency(paymentAmounts.remaining)}</dd></div>
              </dl>
              {order.paymentHistoryIncomplete ? <p className="mt-3 text-xs font-medium text-admin-status-warning">Trạng thái cũ chưa có ngày thu tiền. Cần bổ sung lịch sử, hệ thống không tự suy từ ngày cập nhật.</p> : null}
              {order.payments?.length ? <ol className="mt-4 space-y-2 border-t border-admin-border pt-3">{order.payments.map(payment => <li key={payment.id} className="flex items-start justify-between gap-3 text-xs"><span><strong>{payment.kind === 1 ? 'Nhận cọc' : payment.kind === 2 ? 'Thu còn lại' : payment.kind === 3 ? 'Thu toàn bộ' : 'Hoàn khách'}</strong><span className="mt-0.5 block text-admin-text-muted">{formatOrderDateTime(payment.paidAt)}</span></span><strong className="tabular-nums">{formatOrderCurrency(payment.amount)}</strong></li>)}</ol> : null}
            </section>

            </div>
          </section>
          <OrderTimeline logs={sortedLogs} />
        </aside>

        <main className="min-w-0 space-y-5 xl:col-start-1 xl:row-start-1">
          <OrderMaterialsPanel order={order} canManage={canManageOrder} onSaved={refreshOrder} />
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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
              <div className="px-4 py-4 sm:px-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-admin-text-primary">Người nhận</h3>
                  {canManageOrder && ![OrderStatus.Completed, OrderStatus.Cancelled].includes(order.orderStatus) ? (
                    <button type="button" onClick={openRecipientDialog} className="min-h-9 rounded-admin-control px-2 text-xs font-semibold text-admin-primary hover:bg-admin-primary/8">Cập nhật</button>
                  ) : null}
                </div>
                <div className="mt-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-admin-control bg-admin-muted text-admin-text-secondary">
                    <UserRound size={19} strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-admin-text-primary">{order.recipientName || 'Chưa có thông tin'}</p>
                    {order.recipientPhone ? <a
                      href={`tel:${order.recipientPhone}`}
                      className="mt-1 inline-flex min-h-7 items-center gap-1.5 text-sm text-admin-text-secondary hover:text-admin-primary"
                      aria-label={`Gọi người nhận ${order.recipientName} theo số ${order.recipientPhone}`}
                    >
                      <Phone size={14} strokeWidth={1.8} aria-hidden="true" />
                      <span dir="ltr">{order.recipientPhone}</span>
                    </a> : <p className="mt-1 text-sm text-admin-text-muted">Chưa có số điện thoại</p>}
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
                    <p className="break-words font-semibold text-admin-text-primary">{order.ordererName || 'Chưa có thông tin'}</p>
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

              <div className="border-t border-admin-border px-4 py-4 sm:px-5 md:border-l md:border-t-0 xl:border-l">
                <h3 className="text-sm font-semibold text-admin-text-primary">Người gửi</h3>
                <div className="mt-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-admin-control bg-admin-muted text-admin-text-secondary">
                    <UserRound size={19} strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-admin-text-primary">{order.senderName || 'Chưa có thông tin'}</p>
                    {order.senderPhone ? (
                      <a href={`tel:${order.senderPhone}`} className="mt-1 inline-flex min-h-7 items-center gap-1.5 text-sm text-admin-text-secondary hover:text-admin-primary" aria-label={`Gọi người gửi ${order.senderName || ''} theo số ${order.senderPhone}`}>
                        <Phone size={14} strokeWidth={1.8} aria-hidden="true" />
                        <span dir="ltr">{order.senderPhone}</span>
                      </a>
                    ) : <p className="mt-1 text-sm text-admin-text-muted">Chưa có SĐT người gửi</p>}
                  </div>
                </div>
              </div>

              <div className="border-t border-admin-border px-4 py-4 sm:px-5 md:border-l xl:border-t-0">
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
                        <ProductVisual item={item} illustrations={imagesByItemId.get(item.id) ?? []} />
                        <div className="min-w-0 flex-1">
                          <p className="break-words font-semibold leading-5 text-admin-text-primary">{item.productName}</p>
                          {item.productSku ? <p className="mt-1 font-mono text-xs text-admin-text-muted">{item.productSku}</p> : null}
                          {item.note ? (
                            <p className="mt-2 break-words rounded-admin-control bg-admin-muted px-2.5 py-2 text-xs leading-5 text-admin-text-secondary">
                              Ghi chú: {item.note}
                            </p>
                          ) : null}
                          {item.hasCard && item.cardMessage ? <p className="mt-2 break-words text-xs leading-5 text-admin-text-secondary"><strong>Thiệp:</strong> {item.cardMessage}</p> : null}
                          {item.hasBanner && item.bannerMessage ? <p className="mt-1 break-words text-xs leading-5 text-admin-text-secondary"><strong>Banner:</strong> {item.bannerMessage}</p> : null}
                          <OrderItemIngredients item={item} />
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
                            <ProductVisual item={item} illustrations={imagesByItemId.get(item.id) ?? []} />
                            <div className="min-w-0">
                              <p className="break-words font-semibold leading-5 text-admin-text-primary">{item.productName}</p>
                              {item.productSku ? <p className="mt-1 font-mono text-xs text-admin-text-muted">{item.productSku}</p> : null}
                              {item.note ? (
                                <p className="mt-2 break-words text-xs leading-5 text-admin-text-secondary">Ghi chú: {item.note}</p>
                              ) : null}
                              {item.hasCard && item.cardMessage ? <p className="mt-2 break-words text-xs leading-5 text-admin-text-secondary"><strong>Thiệp:</strong> {item.cardMessage}</p> : null}
                              {item.hasBanner && item.bannerMessage ? <p className="mt-1 break-words text-xs leading-5 text-admin-text-secondary"><strong>Banner:</strong> {item.bannerMessage}</p> : null}
                              <OrderItemIngredients item={item} />
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
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-admin-text-secondary">
                    Phí giao thực tế
                    {canEditShippingFeeActual ? (
                      <button
                        type="button"
                        onClick={openShippingFeeDialog}
                        className="ml-2 rounded text-xs font-semibold text-admin-primary hover:underline"
                      >
                        Điều chỉnh
                      </button>
                    ) : null}
                  </dt>
                  <dd className="shrink-0 font-medium tabular-nums text-admin-text-primary">
                    {order.shippingFeeActual == null ? 'Chưa có' : formatOrderCurrency(order.shippingFeeActual)}
                  </dd>
                </div>
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
                    <p className="mt-0.5 text-xs text-admin-text-muted">Nhấp đúp vào ảnh để xem ảnh lớn.</p>
                  </div>
                </div>
                <span className="text-sm tabular-nums text-admin-text-secondary">{order.images.length} ảnh</span>
              </div>
              <ul className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:p-5 lg:grid-cols-4">
                {order.images.map((image, index) => {
                  const item = order.items.find((orderItem) => orderItem.id === image.orderItemId);
                  const imageAlt = image.description || `Ảnh đính kèm ${index + 1} của đơn ${order.orderCode}`;

                  return (
                    <li key={image.id} className="min-w-0">
                      <ImagePreview
                        src={image.imageUrl}
                        alt={imageAlt}
                        title={item
                          ? `${item.productSku ? `${item.productSku} - ` : ''}${item.productName}`
                          : `Ảnh đính kèm đơn ${order.orderCode}`}
                        caption={image.description || item?.productName}
                        gallery={attachmentGallery}
                        buttonClassName="block w-full rounded-admin-control border border-admin-border bg-admin-muted transition-colors hover:border-admin-primary/45"
                        thumbnailClassName="aspect-square w-full rounded-admin-control object-cover"
                        fallbackClassName="border border-admin-border"
                      />
                      <p className="mt-1.5 break-words text-xs text-admin-text-secondary">
                        {item?.productName ?? image.description ?? 'Ảnh minh họa đơn hàng'}
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
        title={`Hủy đơn ${order.orderCode}`}
        description="Đơn đã hủy không thể chuyển sang trạng thái xử lý khác; các khoản đã nhận vẫn được giữ trong lịch sử để xử lý hoàn tiền đúng quy trình."
        onRequestClose={() => {
          if (!statusDialogBusy) setPendingStatus(null);
        }}
        closeLabel="Đóng xác nhận cập nhật trạng thái"
      >
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-admin-text-primary">Lý do hủy <span className="text-admin-status-error">*</span>
            <textarea autoFocus value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} rows={3} className="mt-1.5 w-full rounded-admin-control border border-admin-input-border bg-admin-surface px-3 py-2 text-sm" placeholder="Ví dụ: khách đổi kế hoạch, trùng đơn…" />
          </label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setPendingStatus(null)} disabled={statusDialogBusy} className="h-11 rounded-admin-control border border-admin-border px-4 text-sm font-semibold">Quay lại</button>
            <button type="button" onClick={() => { if (!cancelReason.trim()) { setError('Vui lòng nhập lý do hủy đơn.'); return; } void changeStatus(OrderStatus.Cancelled); }} disabled={statusDialogBusy || !cancelReason.trim()} className="inline-flex h-11 items-center justify-center gap-2 rounded-admin-control bg-admin-status-error px-4 text-sm font-semibold text-white disabled:opacity-50">{statusDialogBusy ? <LoaderCircle size={16} className="animate-spin" /> : <XCircle size={16} />}Xác nhận hủy đơn</button>
          </div>
        </div>
      </SettingsDialog>

      <SettingsDialog open={holdDialogOpen} title={`Tạm dừng đơn ${order.orderCode}`} description="Đơn giữ nguyên bước hiện tại và không thể chuyển tiếp cho đến khi được tiếp tục." onRequestClose={() => { if (busyAction !== 'hold') setHoldDialogOpen(false); }} closeLabel="Đóng tạm dừng đơn">
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-admin-text-primary">Lý do tạm dừng <span className="text-admin-status-error">*</span><textarea autoFocus value={holdReason} onChange={(event) => setHoldReason(event.target.value)} rows={3} className="mt-1.5 w-full rounded-admin-control border border-admin-input-border bg-admin-surface px-3 py-2 text-sm" placeholder="Ví dụ: chờ khách xác nhận mẫu…" /></label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setHoldDialogOpen(false)} disabled={busyAction === 'hold'} className="h-11 rounded-admin-control border border-admin-border px-4 text-sm font-semibold">Hủy</button><button type="button" onClick={() => void holdOrResume()} disabled={busyAction === 'hold' || !holdReason.trim()} className="inline-flex h-11 items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground disabled:opacity-50">{busyAction === 'hold' ? <LoaderCircle size={16} className="animate-spin" /> : <PauseCircle size={16} />}Tạm dừng</button></div>
        </div>
      </SettingsDialog>

      <SettingsDialog open={recipientDialogOpen} title="Cập nhật người nhận" description="Có thể để trống khi chưa có thông tin; đơn ship chỉ yêu cầu đủ người nhận trước lúc bàn giao." onRequestClose={() => { if (busyAction !== 'recipient') setRecipientDialogOpen(false); }} closeLabel="Đóng cập nhật người nhận">
        <form className="space-y-4" onSubmit={(event) => void saveRecipient(event)}>
          <label className="block text-sm font-semibold text-admin-text-primary">Tên người nhận<input autoFocus value={recipientName} onChange={(event) => setRecipientName(event.target.value)} className="mt-1.5 h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-surface px-3 text-sm" /></label>
          <label className="block text-sm font-semibold text-admin-text-primary">Số điện thoại<input value={recipientPhone} onChange={(event) => setRecipientPhone(event.target.value)} inputMode="tel" className="mt-1.5 h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-surface px-3 text-sm" /></label>
          {!order.pickupAtShop ? <label className="block text-sm font-semibold text-admin-text-primary">Địa chỉ nhận<textarea value={recipientAddress} onChange={(event) => setRecipientAddress(event.target.value)} rows={3} className="mt-1.5 w-full rounded-admin-control border border-admin-input-border bg-admin-surface px-3 py-2 text-sm" /></label> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setRecipientDialogOpen(false)} disabled={busyAction === 'recipient'} className="h-11 rounded-admin-control border border-admin-border px-4 text-sm font-semibold">Hủy</button><button type="submit" disabled={busyAction === 'recipient'} className="inline-flex h-11 items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground disabled:opacity-50">{busyAction === 'recipient' ? <LoaderCircle size={16} className="animate-spin" /> : null}Lưu người nhận</button></div>
        </form>
      </SettingsDialog>

      <SettingsDialog
        open={paymentDialogStatus != null}
        title={paymentDialogStatus === PaymentStatus.Paid ? 'Xác nhận khoản nhận còn lại' : 'Ghi nhận tiền cọc'}
        description="Chỉ khoản tiền thực nhận lần này được thêm vào dòng tiền; doanh thu vẫn chờ đơn giao hoàn tất."
        onRequestClose={() => { if (!busyAction?.startsWith('payment-')) setPaymentDialogStatus(null); }}
        closeLabel="Đóng xác nhận thanh toán"
      >
        <form className="space-y-4" onSubmit={(event) => void changePaymentStatus(event)}>
          <label className="block text-sm font-semibold text-admin-text-primary">Số tiền thực nhận
            <input autoFocus inputMode="numeric" value={paymentAmountInput === '' ? '' : Number(paymentAmountInput.replace(/\D/g, '')).toLocaleString('vi-VN')} onChange={event => setPaymentAmountInput(event.target.value.replace(/\D/g, ''))} className="mt-1.5 h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-surface px-3 text-right text-sm tabular-nums" />
          </label>
          <label className="block text-sm font-semibold text-admin-text-primary">Thời điểm thực nhận
            <input type="datetime-local" value={paymentReceivedAt} onChange={event => setPaymentReceivedAt(event.target.value)} className="mt-1.5 h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-surface px-3 text-sm" />
          </label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setPaymentDialogStatus(null)} disabled={Boolean(busyAction?.startsWith('payment-'))} className="h-11 rounded-admin-control border border-admin-border px-4 text-sm font-semibold">Hủy</button><button type="submit" disabled={Boolean(busyAction?.startsWith('payment-'))} className="inline-flex h-11 items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-white">{busyAction?.startsWith('payment-') ? <LoaderCircle size={16} className="animate-spin" /> : null}Xác nhận đã nhận</button></div>
        </form>
      </SettingsDialog>

      <SettingsDialog
        open={overrideDialogOpen}
        title={`Chuyển trạng thái đơn ${order.orderCode}`}
        description="Thao tác quản trị có phân quyền và được lưu vào lịch sử. Trạng thái hoàn tất vẫn chỉ được hệ thống xác lập khi đã giao và đã thanh toán đủ."
        onRequestClose={() => { if (busyAction !== 'override-status') setOverrideDialogOpen(false); }}
        closeLabel="Đóng chuyển trạng thái"
      >
        <form className="space-y-4" onSubmit={(event) => void overrideOrderStatus(event)}>
          <label className="block text-sm font-semibold text-admin-text-primary">Trạng thái đích
            <select autoFocus value={overrideStatus} onChange={event => setOverrideStatus(Number(event.target.value) as OrderStatus)} className="mt-1.5 h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-surface px-3 text-sm">
              {[
                OrderStatus.Created,
                OrderStatus.Producing,
                OrderStatus.Ready,
                OrderStatus.Shipping,
                OrderStatus.Delivered,
                OrderStatus.DeliveryFailed,
              ].filter(status => status !== order.orderStatus).map(status => <option key={status} value={status}>{orderStatusLabel[status]}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-admin-text-primary">Lý do / ghi chú
            <textarea value={overrideReason} onChange={event => setOverrideReason(event.target.value)} rows={3} maxLength={1000} className="mt-1.5 w-full rounded-admin-control border border-admin-input-border bg-admin-surface px-3 py-2 text-sm" placeholder="Ví dụ: điều chỉnh theo tình trạng thực tế" />
          </label>
          <div className="rounded-admin-control border border-admin-status-warning/30 bg-admin-status-warning/8 px-3 py-2 text-xs leading-5 text-admin-text-secondary">Đơn ship vẫn cần đủ thông tin người nhận trước khi chuyển sang Đang giao hàng. Xác nhận giao thành công sẽ chuyển đơn chưa đủ tiền sang Công nợ, hoặc tự Hoàn tất nếu đã thanh toán đủ.</div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setOverrideDialogOpen(false)} disabled={busyAction === 'override-status'} className="h-11 rounded-admin-control border border-admin-border px-4 text-sm font-semibold">Hủy</button><button type="submit" disabled={busyAction === 'override-status'} className="inline-flex h-11 items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-white disabled:opacity-50">{busyAction === 'override-status' ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCw size={16} />}Xác nhận chuyển</button></div>
        </form>
      </SettingsDialog>

      <SettingsDialog
        open={reverseDialogOpen && previousStatus != null}
        title={`Trả trạng thái đơn ${order.orderCode}`}
        description={previousStatus == null ? undefined : `Đơn sẽ trở về trạng thái ${orderStatusLabel[previousStatus].toLocaleLowerCase('vi')}.`}
        onRequestClose={() => {
          if (busyAction !== 'reverse-status') setReverseDialogOpen(false);
        }}
        closeLabel="Đóng xác nhận trả trạng thái"
      >
        <ConfirmationPanel
          title="Xác nhận trả về bước trước"
          description={
            order.orderStatus === OrderStatus.Producing
              ? 'Tồn kho sản phẩm và nguyên liệu đã trừ sẽ được hoàn lại để đơn có thể chỉnh sửa ở trạng thái chờ xác nhận.'
              : 'Lịch sử thay đổi vẫn được lưu để có thể kiểm tra người thực hiện và thời điểm thao tác.'
          }
          confirmLabel={previousStatus == null ? 'Trả trạng thái' : `Trả về ${orderStatusLabel[previousStatus]}`}
          tone="warning"
          busy={busyAction === 'reverse-status'}
          onCancel={() => {
            if (busyAction !== 'reverse-status') setReverseDialogOpen(false);
          }}
          onConfirm={() => void returnToPreviousStatus()}
        />
      </SettingsDialog>

      <SettingsDialog
        open={shippingFeeDialogOpen}
        title="Điều chỉnh phí giao hàng thực tế"
        description="Có thể cập nhật hoặc để trống để xóa khoản phí này trước khi đơn hoàn tất."
        onRequestClose={() => {
          if (busyAction !== 'shipping-fee-actual') setShippingFeeDialogOpen(false);
        }}
        closeLabel="Đóng điều chỉnh phí giao hàng"
      >
        <form className="space-y-5" onSubmit={(event) => void updateShippingFeeActual(event)}>
          <div>
            <label htmlFor="detail-shipping-fee-actual" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">
              Phí giao hàng thực tế
            </label>
            <div className="relative">
              <input
                id="detail-shipping-fee-actual"
                data-autofocus
                type="text"
                inputMode="numeric"
                value={shippingFeeActualInput === '' ? '' : Number(shippingFeeActualInput.replace(/\D/g, '')).toLocaleString('vi-VN')}
                onChange={(event) => setShippingFeeActualInput(event.target.value.replace(/\D/g, ''))}
                placeholder="Chưa có"
                className="h-11 w-full rounded-admin-control border border-admin-border bg-admin-surface px-3 pr-10 text-right text-sm tabular-nums text-admin-text-primary outline-none transition focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/15"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-admin-text-muted">₫</span>
            </div>
          </div>
          <label className="block text-sm font-semibold text-admin-text-primary">Ngày phát sinh phí
            <input type="datetime-local" value={shippingFeeIncurredAt} onChange={event => setShippingFeeIncurredAt(event.target.value)} className="mt-1.5 h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-surface px-3 text-sm" />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-admin-text-primary"><input type="checkbox" checked={shippingFeePaid} onChange={event => setShippingFeePaid(event.target.checked)} className="h-4 w-4 rounded border-admin-input-border text-admin-primary" />Đã thực trả phí ship</label>
          {shippingFeePaid ? <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold text-admin-text-primary">Thời điểm thực trả<input type="datetime-local" value={shippingFeePaidAt} onChange={event => setShippingFeePaidAt(event.target.value)} className="mt-1.5 h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-surface px-3 text-sm" /></label><label className="text-sm font-semibold text-admin-text-primary">Phương thức<select value={shippingFeeMethod} onChange={event => setShippingFeeMethod(Number(event.target.value) as PaymentMethod)} className="mt-1.5 h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-surface px-3 text-sm"><option value={PaymentMethod.Cash}>Tiền mặt</option><option value={PaymentMethod.BankTransfer}>Chuyển khoản</option><option value={PaymentMethod.Card}>Thẻ</option><option value={PaymentMethod.Other}>Khác</option></select></label></div> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setShippingFeeDialogOpen(false)}
              disabled={busyAction === 'shipping-fee-actual'}
              className="h-11 rounded-admin-control border border-admin-border bg-admin-card px-4 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={busyAction === 'shipping-fee-actual'}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover disabled:opacity-50"
            >
              {busyAction === 'shipping-fee-actual' ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : null}
              {busyAction === 'shipping-fee-actual' ? 'Đang lưu' : 'Lưu phí thực tế'}
            </button>
          </div>
        </form>
      </SettingsDialog>

    </div>
  );
};
