import { OrderStatus, PaymentStatus } from '../types/order.types';

export const orderStatusLabel: Record<OrderStatus, string> = {
  [OrderStatus.Created]: 'Lên đơn',
  [OrderStatus.Producing]: 'Thành phẩm',
  [OrderStatus.Shipping]: 'Đang vận chuyển',
  [OrderStatus.Completed]: 'Hoàn tất',
  [OrderStatus.Cancelled]: 'Hủy đơn',
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  [PaymentStatus.Unpaid]: 'Chưa cọc',
  [PaymentStatus.Deposited]: 'Đã cọc',
  [PaymentStatus.Paid]: 'Đã thanh toán',
};

export const nextOrderStatuses = (current: OrderStatus): OrderStatus[] => {
  switch (current) {
    case OrderStatus.Created:
      return [OrderStatus.Producing, OrderStatus.Cancelled];
    case OrderStatus.Producing:
      return [OrderStatus.Shipping, OrderStatus.Cancelled];
    case OrderStatus.Shipping:
      return [OrderStatus.Completed, OrderStatus.Cancelled];
    default:
      return [];
  }
};

export const nextPaymentStatuses = (current: PaymentStatus): PaymentStatus[] => {
  switch (current) {
    case PaymentStatus.Unpaid:
      return [PaymentStatus.Deposited, PaymentStatus.Paid];
    case PaymentStatus.Deposited:
      return [PaymentStatus.Paid];
    default:
      return [];
  }
};
