import React from 'react';
import { Link } from 'react-router-dom';
import type { DashboardActiveOrdersData, DashboardInventoryData } from '../types/dashboard.types';
import { formatInteger } from '../utils/dashboardFormatters';

type PriorityActionsProps = {
  newOrdersCount: number | null;
  periodLabel: string;
  activeOrders: DashboardActiveOrdersData | null;
  inventory: DashboardInventoryData | null;
};

type PriorityItem = {
  label: string;
  value: number | null;
  description: string;
  to: string;
  action: string;
  urgent?: boolean;
};

export const PriorityActions: React.FC<PriorityActionsProps> = ({
  newOrdersCount,
  periodLabel,
  activeOrders,
  inventory,
}) => {
  const items: PriorityItem[] = [
    {
      label: 'Đơn mới',
      value: newOrdersCount,
      description: periodLabel,
      to: '/admin/orders',
      action: 'Xem đơn mới',
    },
    {
      label: 'Chờ xác nhận',
      value: activeOrders?.awaitingConfirmationCount ?? null,
      description: 'Trạng thái Lên đơn',
      to: '/admin/orders',
      action: 'Xử lý đơn chờ',
    },
    {
      label: 'Đang chuẩn bị',
      value: activeOrders?.preparingCount ?? null,
      description: 'Cần hoàn thiện sản phẩm',
      to: '/admin/orders',
      action: 'Xem đơn chuẩn bị',
    },
    {
      label: 'Giao trễ',
      value: activeOrders?.lateDeliveryCount ?? null,
      description: 'Quá giờ giao dự kiến',
      to: '/admin/orders/calendar',
      action: 'Mở lịch giao',
      urgent: (activeOrders?.lateDeliveryCount ?? 0) > 0,
    },
    {
      label: 'Sắp hết hàng',
      value: inventory?.lowStockCount ?? null,
      description: 'Còn từ 1 đến 5 sản phẩm',
      to: '/admin/products',
      action: 'Kiểm tra tồn kho',
    },
    {
      label: 'Hết hàng',
      value: inventory?.outOfStockCount ?? null,
      description: 'Tồn kho bằng 0',
      to: '/admin/products',
      action: 'Bổ sung hàng',
      urgent: (inventory?.outOfStockCount ?? 0) > 0,
    },
  ];

  return (
    <section className="rounded-admin-panel border border-admin-border bg-admin-card shadow-admin-panel" aria-labelledby="priority-actions-title">
      <div className="border-b border-admin-border px-4 py-4 sm:px-5">
        <h2 id="priority-actions-title" className="text-base font-semibold text-admin-text-primary">
          Việc cần ưu tiên
        </h2>
        <p className="mt-1 text-xs text-admin-text-muted">Bắt đầu từ các đơn và cảnh báo đang cần hành động.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className={[
              'group flex min-h-32 flex-col justify-between border-b border-admin-border p-4 transition-colors last:border-b-0',
              'sm:[&:nth-child(odd)]:border-r sm:[&:nth-last-child(-n+2)]:border-b-0',
              'lg:[&:nth-child(odd)]:border-r-0 lg:[&:not(:nth-child(3n))]:border-r lg:[&:nth-last-child(-n+3)]:border-b-0',
              'xl:min-h-36 xl:border-b-0 xl:[&:not(:last-child)]:border-r',
              item.urgent ? 'bg-red-50/75 hover:bg-red-50' : 'hover:bg-admin-muted/60',
            ].join(' ')}
            aria-label={`${item.action}: ${item.value === null ? 'chưa có dữ liệu' : formatInteger(item.value)} đơn vị`}
          >
            <div>
              <p className="text-sm font-semibold text-admin-text-primary">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-admin-text-muted">{item.description}</p>
            </div>
            <div className="mt-4 flex items-end justify-between gap-3">
              <p className="text-2xl font-semibold leading-none tracking-[-0.02em] text-admin-text-primary tabular-nums">
                {item.value === null ? 'Chưa có' : formatInteger(item.value)}
              </p>
              <span className="text-right text-xs font-semibold text-admin-primary group-hover:underline">{item.action}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

