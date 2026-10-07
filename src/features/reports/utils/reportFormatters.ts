import type { PaymentMethod } from '../types/reporting.types';

export const formatVnd = (value: number | null | undefined): string => {
  if (value == null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND', maximumFractionDigits: 0,
  }).format(value);
};

export const formatCompactVnd = (value: number): string => {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value / 1_000_000_000)} tỷ`;
  if (absolute >= 1_000_000) return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value / 1_000_000)} tr`;
  if (absolute >= 1_000) return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value / 1_000)} nghìn`;
  return new Intl.NumberFormat('vi-VN').format(value);
};

export const formatPercent = (value: number | null | undefined): string => (
  value == null || !Number.isFinite(value)
    ? 'Không xác định'
    : `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value)}%`
);

export const formatReportDate = (value: string | null | undefined, withTime = false): string => {
  if (!value) return '—';
  const date = new Date(value.length === 10 ? `${value}T00:00:00+07:00` : value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  card: 'Thẻ',
  other: 'Khác',
};

export const changeLabel = (value: number | null): string => {
  if (value == null) return 'Chưa có kỳ so sánh';
  if (value === 0) return 'Không đổi so với kỳ trước';
  const direction = value > 0 ? 'Tăng' : 'Giảm';
  return `${direction} ${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(Math.abs(value))}% so với kỳ trước`;
};
