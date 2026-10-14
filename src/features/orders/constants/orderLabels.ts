import { OrderStatus, PaymentStatus } from '../types/order.types';

export const orderStatusLabel: Record<OrderStatus, string> = {
  [OrderStatus.Created]: 'Đơn mới',
  [OrderStatus.Producing]: 'Làm hoa',
  [OrderStatus.Shipping]: 'Đang giao hàng',
  [OrderStatus.Completed]: 'Hoàn tất',
  [OrderStatus.Confirmed]: 'Đơn mới',
  [OrderStatus.Ready]: 'Thành phẩm',
  [OrderStatus.Delivered]: 'Công nợ',
  [OrderStatus.DeliveryFailed]: 'Giao chưa thành công',
  [OrderStatus.Cancelled]: 'Đã hủy',
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  [PaymentStatus.Unpaid]: 'Chưa thanh toán đủ',
  [PaymentStatus.Deposited]: 'Chưa thanh toán đủ',
  [PaymentStatus.Paid]: 'Đã thanh toán',
};

export const nextOrderStatuses = (current: OrderStatus): OrderStatus[] => {
  switch (current) {
    case OrderStatus.Created:
      return [OrderStatus.Producing, OrderStatus.Cancelled];
    case OrderStatus.Confirmed:
      return [OrderStatus.Producing, OrderStatus.Cancelled];
    case OrderStatus.Producing:
      return [OrderStatus.Ready, OrderStatus.Cancelled];
    case OrderStatus.Ready:
      return [OrderStatus.Shipping, OrderStatus.Delivered, OrderStatus.Cancelled];
    case OrderStatus.Shipping:
      return [OrderStatus.Delivered, OrderStatus.DeliveryFailed];
    case OrderStatus.DeliveryFailed:
      return [OrderStatus.Ready];
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
