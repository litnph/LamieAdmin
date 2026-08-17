import { formatDisplayDate, formatVndCurrency } from '@/shared/utils/displayFormatters';

export const formatExpenseCurrency = formatVndCurrency;

export const formatExpenseDate = formatDisplayDate;

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
