export const STORE_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export const formatMoney = (value: number): string => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(value);

export const formatCompactMoney = (value: number): string => new Intl.NumberFormat('vi-VN', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
}).format(value).replace(' ', ' ');

export const formatDate = (value: string, withYear = true): string => new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'UTC',
  day: '2-digit',
  month: '2-digit',
  ...(withYear ? { year: 'numeric' as const } : {}),
}).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));

export const formatWeekday = (value: string): string => new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'UTC',
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
}).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));

export const vietnamToday = (): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: STORE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

export const csvCell = (value: string | number): string => `"${String(value).replaceAll('"', '""')}"`;

export const downloadCsv = (name: string, rows: Array<Array<string | number>>): void => {
  const body = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([body], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 5_000);
};
