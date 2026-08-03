import { OrderStatus } from '../types/order.types';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
});

export type DeliveryUrgency = 'late' | 'upcoming' | null;

const ACTIVE_ORDER_STATUSES = new Set<OrderStatus>([
  OrderStatus.Created,
  OrderStatus.Producing,
  OrderStatus.Shipping,
]);

export const formatOrderCurrency = (value: number) => currencyFormatter.format(value);

export const formatOrderDate = (value: string) => dateFormatter.format(new Date(value));

export const formatOrderTime = (value: string) => timeFormatter.format(new Date(value));

export const formatOrderDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};

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
