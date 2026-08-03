import {
  DASHBOARD_PERIODS,
  type DashboardPeriodKey,
  type DashboardPeriodRange,
} from '../types/dashboard.types';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const integerFormatter = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatCurrency = (value: number) => currencyFormatter.format(value);

export const formatInteger = (value: number) => integerFormatter.format(value);

export const formatDateTime = (value: string | Date) => dateTimeFormatter.format(new Date(value));

export const createDashboardPeriodRange = (
  key: DashboardPeriodKey,
  now = new Date(),
): DashboardPeriodRange => {
  const option = DASHBOARD_PERIODS.find((period) => period.key === key) ?? DASHBOARD_PERIODS[0];
  const currentEnd = new Date(now);
  const currentStart = new Date(now);
  currentStart.setHours(0, 0, 0, 0);
  currentStart.setDate(currentStart.getDate() - (option.days - 1));

  const previousEnd = new Date(currentStart.getTime() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setHours(0, 0, 0, 0);
  previousStart.setDate(previousStart.getDate() - (option.days - 1));

  return {
    key,
    label: option.label,
    days: option.days,
    currentStart: currentStart.toISOString(),
    currentEnd: currentEnd.toISOString(),
    previousStart: previousStart.toISOString(),
    previousEnd: previousEnd.toISOString(),
  };
};

export const formatRevenueChange = (current: number, previous: number) => {
  if (previous === 0) {
    return current === 0
      ? { direction: 'flat' as const, label: 'Không đổi so với kỳ trước' }
      : { direction: 'unavailable' as const, label: 'Kỳ trước chưa có doanh thu' };
  }

  const percentage = Math.abs(((current - previous) / previous) * 100);
  if (percentage < 0.05) {
    return { direction: 'flat' as const, label: 'Không đổi so với kỳ trước' };
  }

  const formatted = new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 1,
  }).format(percentage);

  return current > previous
    ? { direction: 'up' as const, label: `Tăng ${formatted}% so với kỳ trước` }
    : { direction: 'down' as const, label: `Giảm ${formatted}% so với kỳ trước` };
};

export const formatDeliveryDistance = (deliveryAt: string, now = new Date()) => {
  const differenceMs = new Date(deliveryAt).getTime() - now.getTime();
  const absoluteMinutes = Math.max(1, Math.round(Math.abs(differenceMs) / 60_000));
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;
  const duration = hours > 0 ? `${hours} giờ${minutes > 0 ? ` ${minutes} phút` : ''}` : `${minutes} phút`;

  return differenceMs < 0 ? `Trễ ${duration}` : `Còn ${duration}`;
};

