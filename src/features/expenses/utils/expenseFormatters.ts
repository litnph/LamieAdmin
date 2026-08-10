const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Ho_Chi_Minh',
});

export const formatExpenseCurrency = (value: number): string => currencyFormatter.format(value);

export const formatExpenseDate = (value: string): string => {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return dateFormatter.format(new Date(Date.UTC(year, month - 1, day, 12)));
};

export const localDateInputValue = (date = new Date()): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

export const firstDayOfMonth = (dateValue: string): string => {
  const [year, month] = dateValue.split('-');
  return `${year}-${month}-01`;
};
