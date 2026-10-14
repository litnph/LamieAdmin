import React, { useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from '@/shared/icons/lucideAnimated';
import type { DailyRevenueAdjustment, DailyRevenueOrder, FinancialReportPoint } from '../types/financialReport.types';
import { useDialogFocus } from '../hooks/useDialogFocus';
import { downloadCsv, formatDate, formatMoney, formatWeekday } from '../utils/financeReportFormatters';

type Props = {
  points: FinancialReportPoint[];
  orders: DailyRevenueOrder[];
  adjustments: DailyRevenueAdjustment[];
  selectedDate: string;
  includeShipping: boolean;
  dialogOpen: boolean;
  onDialogOpen: (open: boolean) => void;
  onSelect: (date: string) => void;
};

export const SelectedDayPanel: React.FC<Props> = ({ points, orders, adjustments, selectedDate, includeShipping, dialogOpen, onDialogOpen, onSelect }) => {
  const index = Math.max(0, points.findIndex((point) => point.from === selectedDate));
  const point = points[index];
  const previous = index > 0 ? points[index - 1] : null;
  const dayOrders = orders.filter((order) => order.deliveryDate === selectedDate);
  const dayAdjustments = adjustments.filter((adjustment) => adjustment.date === selectedDate);
  const close = useCallback(() => onDialogOpen(false), [onDialogOpen]);
  const dialogRef = useDialogFocus<HTMLDivElement>(dialogOpen, close);
  if (!point) return null;

  const delta = previous ? point.revenue - previous.revenue : null;
  const comparison = !previous
    ? 'Không có dữ liệu ngày trước trong phạm vi đang xem'
    : previous.revenue === 0
      ? point.revenue === 0 ? 'Hai ngày liên tiếp chưa có doanh thu' : 'Ngày trước không có doanh thu nên không tính phần trăm'
      : `${delta! >= 0 ? '↗' : '↘'} ${Math.abs(delta! / previous.revenue * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}% so với ngày trước`;

  const exportDay = () => downloadCsv(`lamie-don-${selectedDate}.csv`, [
    ['Mã đơn', 'Ngày giao', 'Thời điểm hoàn tất', 'Sản phẩm thuần', 'Phí giao hàng', 'Tổng'],
    ...dayOrders.map((order) => [order.code, order.deliveryDate, order.completedAt, order.productRevenue, order.shippingFee, order.totalRevenue]),
    ...dayAdjustments.map((adjustment) => [`Điều chỉnh ${adjustment.orderCode}`, adjustment.date, adjustment.occurredAt, -adjustment.productRevenueAdjustment, -adjustment.shippingRevenueAdjustment, -adjustment.totalAdjustment]),
    ['Tổng', selectedDate, '', point.productRevenue, point.shippingFee, point.productRevenue + point.shippingFee],
  ]);

  return <>
    <aside className="finance-day-panel" aria-label="Chi tiết ngày được chọn">
      <div className="finance-day-top"><span>Ngày đang xem</span><div><button type="button" aria-label="Ngày trước" disabled={index === 0} onClick={() => onSelect(points[index - 1].from)}><ChevronLeft size={17} /></button><button type="button" aria-label="Ngày sau" disabled={index === points.length - 1} onClick={() => onSelect(points[index + 1].from)}><ChevronRight size={17} /></button></div></div>
      <label className="sr-only" htmlFor="selected-report-day">Chọn ngày để xem</label>
      <select id="selected-report-day" className="finance-day-select" value={selectedDate} onChange={(event) => onSelect(event.target.value)}>{points.map((item) => <option key={item.from} value={item.from}>{formatWeekday(item.from)}</option>)}</select>
      <strong className="finance-day-revenue">{formatMoney(point.revenue)}</strong>
      <p className={`finance-day-comparison ${delta !== null && delta < 0 ? 'negative' : ''}`}>{comparison}</p>
      <div className="finance-day-mini"><div><span>Đơn đã giao</span><b>{point.orderCount}<small> đơn</small></b></div><div><span>Trung bình / đơn</span><b>{formatMoney(point.orderCount ? point.revenue / point.orderCount : 0)}</b></div></div>
      <dl className="finance-day-breakdown"><div><dt>Tiền sản phẩm</dt><dd>{formatMoney(point.productRevenue)}</dd></div><div><dt>Phí giao hàng thu khách</dt><dd>{formatMoney(point.shippingFee)}</dd></div><div><dt>{includeShipping ? 'Tổng doanh thu ngày' : 'Đang xem: sản phẩm'}</dt><dd>{formatMoney(point.revenue)}</dd></div></dl>
      <button type="button" className="finance-primary-button w-full" onClick={() => onDialogOpen(true)}>Xem chi tiết ngày →</button>
      <p className="finance-day-note">Theo ngày giao hoàn tất thực tế.<br />Không phải số tiền nhận trong ngày.</p>
    </aside>
    {dialogOpen ? <div className="finance-modal-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) close(); }}>
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="daily-orders-title" className="finance-modal">
        <div className="finance-modal-head"><div><span>Đơn đã giao</span><h2 id="daily-orders-title">{formatDate(selectedDate)}</h2></div><button type="button" onClick={close} aria-label="Đóng"><X size={20} /></button></div>
        <div className="finance-modal-total"><span>Doanh thu sản phẩm</span><strong>{formatMoney(point.productRevenue)}</strong><small>{formatMoney(point.shippingFee)} phí giao hàng · {point.orderCount} đơn</small></div>
        {dayOrders.length ? <div className="finance-order-list">{dayOrders.map((order) => <article key={order.id}><div><strong>{order.code}</strong><small>Hoàn tất {new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' }).format(new Date(order.completedAt))}</small></div><div><b>{formatMoney(order.productRevenue)}</b><small>Ship {formatMoney(order.shippingFee)}</small></div></article>)}</div> : <div className="finance-empty">Không có đơn giao trong ngày này.</div>}
        {dayAdjustments.length ? <div className="finance-order-list">{dayAdjustments.map((adjustment) => <article key={adjustment.id}><div><strong>Hoàn doanh thu · {adjustment.orderCode}</strong><small>{new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' }).format(new Date(adjustment.occurredAt))}{adjustment.note ? ` · ${adjustment.note}` : ''}</small></div><div><b>{formatMoney(-adjustment.productRevenueAdjustment)}</b><small>Ship {formatMoney(-adjustment.shippingRevenueAdjustment)}</small></div></article>)}</div> : null}
        <p className="finance-note">Đây là doanh thu theo ngày giao, không phải tiền thực nhận. Số đơn và tổng tiền được lấy từ cùng truy vấn với biểu đồ.</p>
        <div className="finance-modal-actions"><button type="button" className="finance-secondary-button" onClick={close}>Đóng</button><button type="button" className="finance-primary-button" onClick={exportDay} disabled={!dayOrders.length && !dayAdjustments.length}>Xuất CSV ngày</button></div>
      </div>
    </div> : null}
  </>;
};
