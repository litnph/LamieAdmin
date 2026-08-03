import React from 'react';
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock3,
  PackageCheck,
  PackageOpen,
  Truck,
  XCircle,
} from 'lucide-react';
import { orderStatusLabel, paymentStatusLabel } from '../constants/orderLabels';
import { OrderStatus, PaymentStatus } from '../types/order.types';
import type { DeliveryUrgency } from '../utils/orderListFormatters';

export const OrderStatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const config = {
    [OrderStatus.Created]: {
      className: 'bg-admin-status-warning/10 text-admin-status-warning',
      icon: Clock3,
    },
    [OrderStatus.Producing]: {
      className: 'bg-admin-muted text-admin-text-secondary',
      icon: PackageOpen,
    },
    [OrderStatus.Shipping]: {
      className: 'bg-admin-status-info/10 text-admin-status-info',
      icon: Truck,
    },
    [OrderStatus.Completed]: {
      className: 'bg-admin-status-success/10 text-admin-status-success',
      icon: CheckCircle2,
    },
    [OrderStatus.Cancelled]: {
      className: 'bg-admin-status-error/10 text-admin-status-error',
      icon: XCircle,
    },
  }[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-xs font-semibold ${config.className}`}
      aria-label={`Trạng thái đơn: ${orderStatusLabel[status]}`}
    >
      <Icon size={14} strokeWidth={1.8} aria-hidden="true" />
      {orderStatusLabel[status]}
    </span>
  );
};

export const PaymentStatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const config = {
    [PaymentStatus.Unpaid]: {
      className: 'bg-admin-status-warning/10 text-admin-status-warning',
      icon: Banknote,
    },
    [PaymentStatus.Deposited]: {
      className: 'bg-admin-status-info/10 text-admin-status-info',
      icon: PackageCheck,
    },
    [PaymentStatus.Paid]: {
      className: 'bg-admin-status-success/10 text-admin-status-success',
      icon: CheckCircle2,
    },
  }[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-xs font-semibold ${config.className}`}
      aria-label={`Trạng thái thanh toán: ${paymentStatusLabel[status]}`}
    >
      <Icon size={14} strokeWidth={1.8} aria-hidden="true" />
      {paymentStatusLabel[status]}
    </span>
  );
};

export const DeliveryUrgencyBadge: React.FC<{ urgency: Exclude<DeliveryUrgency, null> }> = ({ urgency }) => {
  const late = urgency === 'late';
  const label = late ? 'Giao trễ' : 'Sắp giao';

  return (
    <span
      className={[
        'mt-1 inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-semibold',
        late
          ? 'bg-admin-status-error/10 text-admin-status-error'
          : 'bg-admin-status-warning/10 text-admin-status-warning',
      ].join(' ')}
      aria-label={`Cảnh báo giao hàng: ${label}`}
    >
      <AlertTriangle size={13} strokeWidth={1.9} aria-hidden="true" />
      {label}
    </span>
  );
};
