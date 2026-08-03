import React from 'react';
import { Link } from 'react-router-dom';
import type { DashboardDeliveryRisk } from '../types/dashboard.types';
import { SectionEmpty, SectionUnavailable } from './DashboardStates';
import { formatDateTime, formatDeliveryDistance } from '../utils/dashboardFormatters';

type DeliveryRiskListProps = {
  orders: DashboardDeliveryRisk[] | null;
};

export const DeliveryRiskList: React.FC<DeliveryRiskListProps> = ({ orders }) => (
  <section
    className="min-w-0 overflow-hidden rounded-admin-panel border border-admin-border bg-admin-card shadow-admin-panel"
    aria-labelledby="delivery-risk-title"
  >
    <div className="flex items-start justify-between gap-4 border-b border-admin-border px-4 py-4 sm:px-5">
      <div className="min-w-0">
        <h2 id="delivery-risk-title" className="text-base font-semibold text-admin-text-primary">
          Sắp giao và giao trễ
        </h2>
        <p className="mt-1 text-xs text-admin-text-muted">Đơn quá hạn trước, sau đó là đơn giao trong 24 giờ tới.</p>
      </div>
      <Link to="/admin/orders/calendar" className="shrink-0 text-sm font-semibold text-admin-primary hover:underline">
        Mở lịch giao
      </Link>
    </div>

    {orders === null ? (
      <SectionUnavailable title="Chưa tải được lịch giao" description="Hãy thử tải lại từ cảnh báo dữ liệu ở đầu trang." />
    ) : orders.length === 0 ? (
      <SectionEmpty title="Không có cảnh báo giao hàng" description="Không có đơn trễ hoặc cần giao trong 24 giờ tới." />
    ) : (
      <ol className="divide-y divide-admin-border">
        {orders.map((order) => {
          const late = order.deliveryState === 'late';
          return (
            <li key={order.id}>
              <Link
                to={`/admin/orders/${order.id}`}
                className="grid min-h-[4.75rem] grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-3 transition-colors hover:bg-admin-muted/55 sm:px-5"
                aria-label={`${order.orderCode}, ${late ? 'giao trễ' : 'sắp giao'}, ${formatDeliveryDistance(order.deliveryAt)}`}
              >
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-mono text-sm font-semibold text-admin-text-primary">{order.orderCode}</span>
                    <span
                      className={[
                        'rounded-md px-2 py-0.5 text-[11px] font-semibold',
                        late
                          ? 'bg-admin-status-error/12 text-admin-status-error'
                          : 'bg-admin-status-warning/12 text-admin-status-warning',
                      ].join(' ')}
                    >
                      {late ? 'Giao trễ' : 'Sắp giao'}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-admin-text-secondary">{order.recipientName}</p>
                </div>
                <div className="text-right">
                  <p className={late ? 'text-sm font-semibold text-admin-status-error' : 'text-sm font-semibold text-admin-status-warning'}>
                    {formatDeliveryDistance(order.deliveryAt)}
                  </p>
                  <p className="mt-1 whitespace-nowrap text-[11px] text-admin-text-muted">{formatDateTime(order.deliveryAt)}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    )}
  </section>
);
