import axios from 'axios';
import { OrderStatus, PaymentStatus } from '@/features/orders/types/order.types';
import {
  formatDisplayDate,
  formatDisplayDateTime,
  formatVndCurrency,
} from '@/shared/utils/displayFormatters';

export const formatCustomerCurrency = formatVndCurrency;

export const formatCustomerDate = (value: string | null): string => {
  if (!value) return 'Chưa có giao dịch thanh toán';
  return formatDisplayDate(value);
};

export const formatCustomerDateTime = formatDisplayDateTime;

export const isCustomerRequestForbidden = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 403;

export const isPaidPurchase = (paymentStatus: PaymentStatus, orderStatus: OrderStatus): boolean =>
  paymentStatus === PaymentStatus.Paid && orderStatus !== OrderStatus.Cancelled;
