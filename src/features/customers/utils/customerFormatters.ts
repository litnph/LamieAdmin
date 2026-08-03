import axios from 'axios';
import { OrderStatus, PaymentStatus } from '@/features/orders/types/order.types';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export const formatCustomerCurrency = (value: number): string => currencyFormatter.format(value);

export const formatCustomerDate = (value: string | null): string => {
  if (!value) return 'Chưa có giao dịch thanh toán';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
};

export const formatCustomerDateTime = (value: string): string =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

export const isCustomerRequestForbidden = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 403;

export const isPaidPurchase = (paymentStatus: PaymentStatus, orderStatus: OrderStatus): boolean =>
  paymentStatus === PaymentStatus.Paid && orderStatus !== OrderStatus.Cancelled;
