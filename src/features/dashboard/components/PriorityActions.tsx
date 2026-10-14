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
      label: 'Đơn mới',
      value: activeOrders?.awaitingConfirmationCount ?? null,
      description: 'Trạng thái Lên đơn',
      to: '/admin/orders',
      action: 'Chuẩn bị đơn',
    },
    {
      label: 'Làm hoa',
      value: activeOrders?.preparingCount ?? null,
      description: 'Cần hoàn thiện sản phẩm',
      to: '/admin/orders',
      action: 'Xem đơn làm hoa',
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
    <section aria-labelledby="priority-actions-title">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 id="priority-actions-title" className="text-xs font-semibold uppercase tracking-[0.12em] text-admin-text-secondary">Việc cần ưu tiên</h2>
      </div>
      <div className="grid grid-cols-2 overflow-hidden rounded-admin-panel border border-admin-border bg-admin-card shadow-admin-panel md:grid-cols-3 xl:grid-cols-6">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className={[
              'group min-h-[3.75rem] border-b border-r border-admin-border px-4 py-3 transition-colors',
              '[&:nth-child(2n)]:border-r-0 [&:nth-last-child(-n+2)]:border-b-0',
              'md:[&:nth-child(2n)]:border-r md:[&:nth-child(3n)]:border-r-0 md:[&:nth-last-child(-n+3)]:border-b-0',
              'xl:border-b-0 xl:[&:not(:last-child)]:border-r xl:[&:last-child]:border-r-0',
              item.urgent ? 'bg-red-50/75 hover:bg-red-50' : 'hover:bg-admin-muted/60',
            ].join(' ')}
            aria-label={`${item.action}: ${item.value === null ? 'chưa có dữ liệu' : formatInteger(item.value)} đơn vị`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-admin-text-secondary">{item.label}</p>
              <p className="text-xl font-semibold leading-none tracking-[-0.02em] text-admin-text-primary tabular-nums">
                {item.value === null ? 'Chưa có' : formatInteger(item.value)}
              </p>
            </div>
            <span className="sr-only">{item.description}</span>
            <span className="sr-only">{item.action}</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

