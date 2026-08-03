import React from 'react';
import { orderStatusLabel } from '@/features/orders/constants/orderLabels';
import { OrderStatus } from '@/features/orders/types/order.types';

const statusClass: Record<OrderStatus, string> = {
  [OrderStatus.Created]: 'bg-admin-status-warning/12 text-admin-status-warning',
  [OrderStatus.Producing]: 'bg-admin-status-info/12 text-admin-status-info',
  [OrderStatus.Shipping]: 'bg-admin-primary/12 text-admin-primary',
  [OrderStatus.Completed]: 'bg-admin-status-success/12 text-admin-status-success',
  [OrderStatus.Cancelled]: 'bg-admin-status-error/12 text-admin-status-error',
};

export const CustomerStatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => (
  <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${statusClass[status]}`}>
    {orderStatusLabel[status]}
  </span>
);
