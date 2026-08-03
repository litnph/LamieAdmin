import React from 'react';
import { resolveApiResourceUrl } from '@/services/apiResourceUrl';
import {
  ArrowRight,
  Eye,
  LoaderCircle,
  PackageOpen,
  RefreshCw,
  SearchX,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { nextOrderStatuses, orderStatusLabel } from '../constants/orderLabels';
import type { OrderListItemDto } from '../types/order.types';
import { OrderStatus } from '../types/order.types';
import {
  formatOrderCurrency,
  formatDeliveryWindow,
  getDeliveryUrgency,
} from '../utils/orderListFormatters';
import { DeliveryUrgencyBadge, OrderStatusBadge, PaymentStatusBadge } from './OrderStatusBadges';

type OrderListContentProps = {
  orders: OrderListItemDto[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  updatingId: string | null;
  canManage: boolean;
  canDelete: boolean;
  onRetry: () => void;
  onClearFilters: () => void;
  onStatusChange: (order: OrderListItemDto, status: OrderStatus) => void;
  onDelete: (order: OrderListItemDto) => void;
};

const QUICK_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  [OrderStatus.Producing]: 'Chuẩn bị',
  [OrderStatus.Shipping]: 'Bắt đầu giao',
  [OrderStatus.Completed]: 'Hoàn tất',
};

const LoadingState: React.FC = () => (
  <div role="status" aria-label="Đang tải danh sách đơn hàng">
    <div className="space-y-3 p-3 md:hidden" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="animate-pulse rounded-admin-panel border border-admin-border bg-admin-surface p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="w-1/2 space-y-2">
              <div className="h-4 w-24 rounded bg-admin-muted" />
              <div className="h-4 w-full rounded bg-admin-muted" />
            </div>
            <div className="h-7 w-24 rounded-md bg-admin-muted" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="h-12 rounded-admin-control bg-admin-muted" />
            <div className="h-12 rounded-admin-control bg-admin-muted" />
          </div>
          <div className="mt-4 h-11 rounded-admin-control bg-admin-muted" />
        </div>
      ))}
    </div>
    <div className="hidden md:block" aria-hidden="true">
      <div className="h-11 border-b border-admin-border bg-admin-muted/55" />
      {Array.from({ length: 7 }, (_, index) => (
        <div key={index} className="grid animate-pulse grid-cols-[1fr_1.35fr_1fr_1.15fr_1fr_1.1fr] gap-4 border-b border-admin-border px-4 py-4">
          {Array.from({ length: 6 }, (_, cellIndex) => (
            <div key={cellIndex} className="h-5 rounded bg-admin-muted" />
          ))}
        </div>
      ))}
    </div>
    <span className="sr-only">Đang tải dữ liệu đơn hàng.</span>
  </div>
);

type ListStateProps = {
  error: string | null;
  hasActiveFilters: boolean;
  onRetry: () => void;
  onClearFilters: () => void;
};

const ListState: React.FC<ListStateProps> = ({ error, hasActiveFilters, onRetry, onClearFilters }) => {
  const Icon = error ? RefreshCw : hasActiveFilters ? SearchX : PackageOpen;
  const title = error
    ? 'Không thể tải danh sách đơn'
    : hasActiveFilters
      ? 'Không có kết quả phù hợp'
      : 'Chưa có đơn hàng';
  const description = error
    ? error
    : hasActiveFilters
      ? 'Thử thay đổi từ khóa hoặc xóa bớt điều kiện lọc.'
      : 'Đơn hàng mới sẽ xuất hiện tại đây sau khi được tạo.';

  return (
    <div
      className="flex min-h-72 flex-col items-center justify-center px-5 py-12 text-center"
      role={error ? 'alert' : 'status'}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-admin-panel bg-admin-muted text-admin-text-secondary">
        <Icon size={23} strokeWidth={1.7} aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-admin-text-primary">{title}</h2>
      <p className="mt-1 max-w-md text-sm leading-6 text-admin-text-secondary">{description}</p>
      {error ? (
        <button
          type="button"
          onClick={onRetry}
          className="btn-press mt-5 inline-flex min-h-11 items-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover"
        >
          <RefreshCw size={16} strokeWidth={1.8} aria-hidden="true" />
          Thử lại
        </button>
      ) : hasActiveFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="btn-press mt-5 min-h-11 rounded-admin-control border border-admin-border bg-admin-surface px-4 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted"
        >
          Xóa bộ lọc
        </button>
      ) : null}
    </div>
  );
};

type QuickActionsProps = {
  order: OrderListItemDto;
  updating: boolean;
  disabled: boolean;
  mobile?: boolean;
  canManage: boolean;
  canDeleteOrder: boolean;
  onStatusChange: (order: OrderListItemDto, status: OrderStatus) => void;
  onDelete: (order: OrderListItemDto) => void;
};

const QuickActions: React.FC<QuickActionsProps> = ({
  order,
  updating,
  disabled,
  mobile = false,
  canManage,
  canDeleteOrder,
  onStatusChange,
  onDelete,
}) => {
  const transitions = nextOrderStatuses(order.orderStatus);
  const primaryStatus = transitions.find((status) => status !== OrderStatus.Cancelled);
  const actionLabel = primaryStatus ? QUICK_ACTION_LABEL[primaryStatus] ?? orderStatusLabel[primaryStatus] : null;

  return (
    <div className={mobile ? 'mt-4 grid grid-cols-2 gap-2' : 'flex items-center justify-end gap-1.5'}>
      {canManage && primaryStatus && actionLabel ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onStatusChange(order, primaryStatus)}
          className={[
            'btn-press inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-admin-control bg-admin-primary px-3 text-xs font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-55',
            mobile ? 'col-span-2 min-h-11 text-sm' : '',
          ].join(' ')}
          aria-label={`${actionLabel} cho đơn ${order.orderCode}`}
        >
          {updating ? (
            <LoaderCircle size={15} strokeWidth={1.8} className="animate-spin" aria-hidden="true" />
          ) : (
            <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
          )}
          {updating ? 'Đang cập nhật' : actionLabel}
        </button>
      ) : null}
      <Link
        to={`/admin/orders/${order.id}`}
        className={[
          'btn-press inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-admin-control border border-admin-border bg-admin-surface px-3 text-xs font-semibold text-admin-text-primary transition-colors hover:border-admin-primary/45 hover:bg-admin-primary/5 hover:text-admin-primary',
          mobile ? 'min-h-11 text-sm' : '',
        ].join(' ')}
        aria-label={`Xem chi tiết đơn ${order.orderCode}`}
      >
        <Eye size={15} strokeWidth={1.8} aria-hidden="true" />
        Xem
      </Link>
      {canDeleteOrder ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onDelete(order)}
          className={[
            'btn-press inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-admin-control px-2.5 text-xs font-semibold text-admin-status-error transition-colors hover:bg-admin-status-error/8 disabled:cursor-not-allowed disabled:opacity-45',
            mobile ? 'min-h-11 border border-admin-status-error/25 text-sm' : '',
          ].join(' ')}
          aria-label={`Xóa đơn ${order.orderCode}`}
        >
          <Trash2 size={16} strokeWidth={1.8} aria-hidden="true" />
          <span className={mobile ? '' : 'sr-only'}>Xóa</span>
        </button>
      ) : null}
    </div>
  );
};

export const OrderListContent: React.FC<OrderListContentProps> = ({
  orders,
  loading,
  error,
  hasActiveFilters,
  updatingId,
  canManage,
  canDelete,
  onRetry,
  onClearFilters,
  onStatusChange,
  onDelete,
}) => {
  if (loading) return <LoadingState />;
  if (error || orders.length === 0) {
    return (
      <ListState
        error={error}
        hasActiveFilters={hasActiveFilters}
        onRetry={onRetry}
        onClearFilters={onClearFilters}
      />
    );
  }

  const now = new Date();

  return (
    <>
      <div className="space-y-3 p-3 md:hidden">
        {orders.map((order) => {
          const urgency = getDeliveryUrgency(order.deliveryAt, order.orderStatus, now);
          return (
            <article
              key={order.id}
              className={[
                'rounded-admin-panel border bg-admin-surface p-4',
                urgency === 'late' ? 'border-admin-status-error/35' : 'border-admin-border',
              ].join(' ')}
              aria-labelledby={`mobile-order-${order.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  {order.imageUrl ? (
                    <img
                      src={resolveApiResourceUrl(order.imageUrl)}
                      alt={`Ảnh đơn ${order.orderCode}`}
                      className="h-14 w-14 shrink-0 rounded-admin-control border border-admin-border bg-admin-muted object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-admin-control border border-dashed border-admin-border bg-admin-muted text-admin-text-muted" aria-label="Đơn chưa có ảnh">
                      <PackageOpen size={18} aria-hidden="true" />
                    </div>
                  )}
                  <div className="min-w-0">
                  <Link
                    id={`mobile-order-${order.id}`}
                    to={`/admin/orders/${order.id}`}
                    className="font-mono text-sm font-semibold text-admin-primary hover:underline"
                  >
                    {order.orderCode}
                  </Link>
                  <p className="mt-1 truncate text-base font-semibold text-admin-text-primary">{order.recipientName}</p>
                  <a
                    href={`tel:${order.recipientPhone}`}
                    className="mt-1 inline-flex min-h-6 items-center text-sm text-admin-text-secondary hover:text-admin-primary"
                    aria-label={`Gọi người nhận ${order.recipientName} theo số ${order.recipientPhone}`}
                  >
                    <span dir="ltr">{order.recipientPhone}</span>
                  </a>
                  </div>
                </div>
                <OrderStatusBadge status={order.orderStatus} />
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-admin-border pt-4 text-sm">
                <div>
                  <dt className="text-xs text-admin-text-muted">Tổng tiền</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-admin-text-primary">
                    {formatOrderCurrency(order.totalAmount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-admin-text-muted">Thanh toán</dt>
                  <dd className="mt-1"><PaymentStatusBadge status={order.paymentStatus} /></dd>
                </div>
                <div>
                  <dt className="text-xs text-admin-text-muted">Thời gian giao</dt>
                  <dd className="mt-1 font-medium tabular-nums text-admin-text-primary">
                    {formatDeliveryWindow(order.deliveryAt, order.deliveryTo)}
                  </dd>
                  {order.provinceShipping ? <p className="mt-1 text-[11px] font-medium text-admin-primary">Gửi đơn vị vận chuyển</p> : null}
                  {urgency ? <DeliveryUrgencyBadge urgency={urgency} /> : null}
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-admin-text-muted">Ghi chú</dt>
                  <dd className="mt-1 line-clamp-2 text-admin-text-secondary">{order.contentNote?.trim() || 'Không có ghi chú'}</dd>
                </div>
              </dl>

              <QuickActions
                order={order}
                updating={updatingId === order.id}
                disabled={updatingId !== null}
                canManage={canManage}
                canDeleteOrder={canDelete}
                mobile
                onStatusChange={onStatusChange}
                onDelete={onDelete}
              />
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1320px] text-left text-sm">
          <caption className="sr-only">
            Danh sách đơn hàng gồm mã đơn, ảnh, thời gian giao, người nhận, ghi chú, số tiền, thanh toán, trạng thái và hành động
          </caption>
          <thead className="border-b border-admin-border bg-admin-muted/55 text-xs text-admin-text-secondary">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Mã đơn</th>
              <th scope="col" className="px-3 py-3 font-semibold">Ảnh</th>
              <th scope="col" className="px-4 py-3 font-semibold">Thời gian giao</th>
              <th scope="col" className="px-4 py-3 font-semibold">Người nhận</th>
              <th scope="col" className="px-4 py-3 font-semibold">Ghi chú</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Số tiền</th>
              <th scope="col" className="px-4 py-3 font-semibold">Thanh toán</th>
              <th scope="col" className="px-4 py-3 font-semibold">Trạng thái</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border">
            {orders.map((order) => {
              const urgency = getDeliveryUrgency(order.deliveryAt, order.orderStatus, now);
              return (
                <tr
                  key={order.id}
                  className={[
                    'transition-colors hover:bg-admin-muted/45',
                    urgency === 'late' ? 'bg-admin-status-error/[0.025]' : '',
                  ].join(' ')}
                >
                  <th scope="row" className="px-4 py-3.5 font-normal">
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="font-mono text-sm font-semibold text-admin-primary hover:underline"
                    >
                      {order.orderCode}
                    </Link>
                  </th>
                  <td className="px-3 py-3.5">
                    {order.imageUrl ? (
                      <img
                        src={resolveApiResourceUrl(order.imageUrl)}
                        alt={`Ảnh đơn ${order.orderCode}`}
                        className="h-12 w-12 rounded-admin-control border border-admin-border bg-admin-muted object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-admin-control border border-dashed border-admin-border bg-admin-muted text-admin-text-muted" aria-label="Đơn chưa có ảnh">
                        <PackageOpen size={16} aria-hidden="true" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="max-w-52 font-semibold tabular-nums text-admin-text-primary">{formatDeliveryWindow(order.deliveryAt, order.deliveryTo)}</p>
                    {order.provinceShipping ? <p className="mt-1 text-[11px] font-medium text-admin-primary">Gửi đơn vị vận chuyển</p> : null}
                    {urgency ? <DeliveryUrgencyBadge urgency={urgency} /> : null}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="max-w-44 truncate font-semibold text-admin-text-primary">{order.recipientName}</p>
                    <a
                      href={`tel:${order.recipientPhone}`}
                      className="mt-1 inline-flex text-xs text-admin-text-muted hover:text-admin-primary"
                      aria-label={`Gọi người nhận ${order.recipientName} theo số ${order.recipientPhone}`}
                    >
                      <span dir="ltr">{order.recipientPhone}</span>
                    </a>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="line-clamp-2 max-w-52 text-xs leading-5 text-admin-text-secondary" title={order.contentNote ?? undefined}>
                      {order.contentNote?.trim() || '—'}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold tabular-nums text-admin-text-primary">
                    {formatOrderCurrency(order.totalAmount)}
                  </td>
                  <td className="px-4 py-3.5">
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </td>
                  <td className="px-4 py-3.5">
                    <OrderStatusBadge status={order.orderStatus} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <QuickActions
                      order={order}
                      updating={updatingId === order.id}
                      disabled={updatingId !== null}
                      canManage={canManage}
                      canDeleteOrder={canDelete}
                      onStatusChange={onStatusChange}
                      onDelete={onDelete}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};
