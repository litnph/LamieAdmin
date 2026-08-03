import React from 'react';
import { Link } from 'react-router-dom';
import { OrderStatus, type OrderListItemDto } from '@/features/orders/types/order.types';
import { SectionEmpty, SectionUnavailable } from './DashboardStates';
import { formatCurrency, formatDateTime } from '../utils/dashboardFormatters';

type AttentionOrdersListProps = {
  orders: OrderListItemDto[] | null;
};

const getAttentionLabel = (status: OrderStatus) =>
  status === OrderStatus.Created ? 'Chờ xác nhận' : 'Đang chuẩn bị';

export const AttentionOrdersList: React.FC<AttentionOrdersListProps> = ({ orders }) => (
  <section
    className="min-w-0 overflow-hidden rounded-admin-panel border border-admin-border bg-admin-card shadow-admin-panel"
    aria-labelledby="attention-orders-title"
  >
    <div className="flex items-start justify-between gap-4 border-b border-admin-border px-4 py-4 sm:px-5">
      <div className="min-w-0">
        <h2 id="attention-orders-title" className="text-base font-semibold text-admin-text-primary">
          Đơn cần xử lý
        </h2>
        <p className="mt-1 text-xs text-admin-text-muted">Ưu tiên đơn chờ xác nhận trước đơn đang chuẩn bị.</p>
      </div>
      <Link to="/admin/orders" className="shrink-0 text-sm font-semibold text-admin-primary hover:underline">
        Xem tất cả đơn
      </Link>
    </div>

    {orders === null ? (
      <SectionUnavailable title="Chưa tải được đơn cần xử lý" description="Các phần dữ liệu khác trên Dashboard vẫn được giữ nguyên." />
    ) : orders.length === 0 ? (
      <SectionEmpty title="Không có đơn đang chờ" description="Hiện không có đơn ở trạng thái Lên đơn hoặc Thành phẩm." />
    ) : (
      <ol className="divide-y divide-admin-border">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              to={`/admin/orders/${order.id}`}
              className="grid min-h-[4.75rem] grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-3 transition-colors hover:bg-admin-muted/55 sm:px-5"
              aria-label={`${order.orderCode}, ${getAttentionLabel(order.orderStatus)}, người nhận ${order.recipientName}, ${formatCurrency(order.totalAmount)}`}
            >
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-mono text-sm font-semibold text-admin-text-primary">{order.orderCode}</span>
                  <span className="rounded-md bg-admin-primary/10 px-2 py-0.5 text-[11px] font-semibold text-admin-primary">
                    {getAttentionLabel(order.orderStatus)}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-admin-text-secondary">
                  {order.recipientName} <span className="text-admin-text-muted">({order.recipientPhone})</span>
                </p>
              </div>
              <div className="text-right">
                <p className="whitespace-nowrap text-sm font-semibold text-admin-text-primary tabular-nums">
                  {formatCurrency(order.totalAmount)}
                </p>
                <p className="mt-1 whitespace-nowrap text-[11px] text-admin-text-muted">
                  Giao {formatDateTime(order.deliveryAt)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    )}
  </section>
);

