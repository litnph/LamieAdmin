const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dateTimePartsFormatter = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const toDate = (value: string | number | Date): Date => {
  if (typeof value === 'string') {
    const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnly) {
      return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]), 12);
    }
  }
  return value instanceof Date ? value : new Date(value);
};

const getDateTimeParts = (value: string | number | Date) => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = Object.fromEntries(
    dateTimePartsFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );
  return parts as Record<'year' | 'month' | 'day' | 'hour' | 'minute', string>;
};

export const formatVndCurrency = (value: number): string =>
  Number.isFinite(value) ? vndFormatter.format(Math.round(value)) : '—';

export const formatDisplayDate = (value: string | number | Date): string => {
  const parts = getDateTimeParts(value);
  return parts ? `${parts.day}/${parts.month}/${parts.year}` : '—';
};

export const formatDisplayTime = (value: string | number | Date): string => {
  const parts = getDateTimeParts(value);
  return parts ? `${parts.hour}:${parts.minute}` : '—';
};

export const formatDisplayDateTime = (value: string | number | Date): string => {
  const parts = getDateTimeParts(value);
  return parts ? `${parts.hour}:${parts.minute} ${parts.day}/${parts.month}/${parts.year}` : '—';
};

export const formatVndInput = (value: number | string): string => {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) && numericValue > 0
    ? Math.round(numericValue).toLocaleString('vi-VN')
    : '';
};

export const parseVndInput = (value: string): number => Number(value.replace(/\D/g, '')) || 0;
