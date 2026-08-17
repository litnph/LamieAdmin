import { OrderStatus } from '../types/order.types';
import {
  formatDisplayDate,
  formatDisplayDateTime,
  formatDisplayTime,
  formatVndCurrency,
} from '@/shared/utils/displayFormatters';

export type DeliveryUrgency = 'late' | 'upcoming' | null;

const ACTIVE_ORDER_STATUSES = new Set<OrderStatus>([
  OrderStatus.Created,
  OrderStatus.Producing,
  OrderStatus.Shipping,
]);

export const formatOrderCurrency = formatVndCurrency;

export const formatOrderDate = formatDisplayDate;

export const formatOrderTime = formatDisplayTime;

export const formatOrderDateTime = formatDisplayDateTime;

export const formatDeliveryWindow = (from: string, to?: string | null) => {
  if (!to) return formatOrderDateTime(from);
  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return '—';

  const sameDate = fromDate.getFullYear() === toDate.getFullYear()
    && fromDate.getMonth() === toDate.getMonth()
    && fromDate.getDate() === toDate.getDate();
  return sameDate
    ? `${formatOrderTime(from)}–${formatOrderTime(to)} ${formatOrderDate(from)}`
    : `${formatOrderDateTime(from)} – ${formatOrderDateTime(to)}`;
};

export const getDeliveryUrgency = (
  deliveryAt: string,
  orderStatus: OrderStatus,
  now = new Date(),
): DeliveryUrgency => {
  if (!ACTIVE_ORDER_STATUSES.has(orderStatus)) return null;

  const deliveryTime = new Date(deliveryAt).getTime();
  const nowTime = now.getTime();
  if (!Number.isFinite(deliveryTime)) return null;
  if (deliveryTime < nowTime) return 'late';
  if (deliveryTime <= nowTime + 24 * 60 * 60 * 1000) return 'upcoming';
  return null;
};

export const toLocalDateBoundaryIso = (value: string, endOfDay: boolean): string | undefined => {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;

  const date = endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0);
  return date.toISOString();
};
