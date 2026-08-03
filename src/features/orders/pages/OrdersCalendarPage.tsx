import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, LoaderCircle, Map as MapIcon, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { ordersApi } from '../api/ordersApi';
import type { OrderCalendarItemDto, OrderDeliveryLocationDto } from '../types/order.types';
import { orderStatusLabel, paymentStatusLabel } from '../constants/orderLabels';
import { OrdersDeliveryMap } from '../components/OrdersDeliveryMap';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { formatDeliveryWindow } from '../utils/orderListFormatters';

const todayLocal = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const OrdersCalendarPage: React.FC = () => {
  const [date, setDate] = useState(todayLocal());
  const [items, setItems] = useState<OrderCalendarItemDto[]>([]);
  const [locations, setLocations] = useState<OrderDeliveryLocationDto[]>([]);
  const [showMap, setShowMap] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [calendarItems, deliveryLocations] = await Promise.all([
        ordersApi.calendar(date),
        ordersApi.calendarLocations(date),
      ]);
      setItems(calendarItems);
      setLocations(deliveryLocations);
    } catch (requestError) {
      setItems([]);
      setLocations([]);
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(
    () => [...items].sort((left, right) => new Date(left.deliveryAt).getTime() - new Date(right.deliveryAt).getTime()),
    [items],
  );

  return (
    <div className="min-w-0 space-y-6" aria-busy={loading}>
      <PageHeader
        title="Lịch giao trong ngày"
        subtitle="Theo dõi đơn theo giờ nhận hàng và vị trí giao trong ngày đã chọn."
        actions={
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-admin-control border border-admin-border bg-admin-card px-4 text-sm font-semibold text-admin-text-primary hover:bg-admin-muted disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
          >
            <RefreshCw size={17} className={loading ? 'animate-spin' : undefined} aria-hidden="true" />
            Tải lại
          </button>
        }
      />

      <section
        className="flex flex-col gap-3 rounded-admin-panel border border-admin-border bg-admin-card p-4 shadow-admin-panel sm:flex-row sm:items-end"
        aria-labelledby="delivery-calendar-filter-title"
      >
        <div className="min-w-0 flex-1">
          <h2 id="delivery-calendar-filter-title" className="sr-only">Bộ lọc lịch giao</h2>
          <label htmlFor="delivery-calendar-date" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">
            Ngày giao
          </label>
          <div className="relative max-w-sm">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" size={17} aria-hidden="true" />
            <input
              id="delivery-calendar-date"
              type="date"
              className="min-h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card pl-10 pr-3 text-sm text-admin-text-primary focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/15"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowMap((current) => !current)}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-admin-control border border-admin-border px-4 text-sm font-semibold text-admin-text-primary hover:bg-admin-muted sm:w-auto"
          aria-expanded={showMap}
          aria-controls="delivery-calendar-map"
        >
          <MapIcon size={17} aria-hidden="true" />
          {showMap ? 'Ẩn bản đồ' : 'Hiện bản đồ'}
        </button>
      </section>

      {error ? (
        <section className="rounded-admin-panel border border-admin-status-error/30 bg-red-50 p-5 text-center" role="alert">
          <h2 className="text-base font-semibold text-admin-text-primary">Không thể tải lịch giao</h2>
          <p className="mx-auto mt-1 max-w-xl break-words text-sm leading-6 text-admin-text-secondary">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover"
          >
            <RefreshCw size={16} aria-hidden="true" /> Thử lại
          </button>
        </section>
      ) : null}

      {!error && showMap ? (
        <section id="delivery-calendar-map" aria-labelledby="delivery-map-title">
          <h2 id="delivery-map-title" className="sr-only">Bản đồ điểm giao</h2>
          {loading ? (
            <div className="flex min-h-72 items-center justify-center rounded-admin-panel border border-admin-border bg-admin-card" role="status">
              <LoaderCircle size={18} className="mr-2 animate-spin text-admin-primary" aria-hidden="true" />
              <span className="text-sm text-admin-text-secondary">Đang tải bản đồ</span>
            </div>
          ) : locations.length > 0 ? (
            <OrdersDeliveryMap locations={locations} />
          ) : (
            <div className="rounded-admin-panel border border-admin-border bg-admin-card px-5 py-8 text-center" role="status">
              <p className="font-semibold text-admin-text-primary">Chưa có điểm giao trên bản đồ</p>
              <p className="mx-auto mt-1 max-w-xl text-sm leading-6 text-admin-text-secondary">
                Các đơn lấy tại cửa hàng hoặc chưa có tọa độ sẽ không xuất hiện trên bản đồ.
              </p>
            </div>
          )}
        </section>
      ) : null}

      {!error ? (
        <section className="overflow-hidden rounded-admin-panel border border-admin-border bg-admin-card shadow-admin-panel" aria-labelledby="delivery-list-title">
          <header className="flex min-h-12 items-center justify-between border-b border-admin-border bg-admin-muted/45 px-4">
            <h2 id="delivery-list-title" className="text-sm font-semibold text-admin-text-primary">Danh sách giao hàng</h2>
            <span className="text-xs tabular-nums text-admin-text-muted" aria-live="polite">
              {loading ? 'Đang tải' : `${sorted.length} đơn`}
            </span>
          </header>

          {loading ? (
            <div className="space-y-3 p-4" role="status" aria-label="Đang tải danh sách giao hàng">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-admin-control bg-admin-muted" aria-hidden="true" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="px-5 py-10 text-center" role="status">
              <p className="font-semibold text-admin-text-primary">Không có đơn trong ngày</p>
              <p className="mt-1 text-sm text-admin-text-muted">Chọn ngày khác để xem lịch giao.</p>
            </div>
          ) : (
            <ul className="divide-y divide-admin-border">
              {sorted.map((order) => (
                <li key={order.id} className="grid gap-3 px-4 py-4 text-sm hover:bg-admin-muted/35 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center">
                  <time className="font-mono font-semibold tabular-nums text-admin-text-secondary" dateTime={order.deliveryAt}>
                    {formatDeliveryWindow(order.deliveryAt, order.deliveryTo)}
                  </time>
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <Link to={`/admin/orders/${order.id}`} className="inline-flex min-h-11 items-center font-mono font-semibold text-admin-primary hover:underline">
                        {order.orderCode}
                      </Link>
                      <span className="min-w-0 break-words font-semibold text-admin-text-primary">{order.recipientName}</span>
                    </div>
                    <p className="break-words text-xs leading-5 text-admin-text-muted">
                      {order.recipientPhone}
                      {order.pickupAtShop ? ' - Lấy tại cửa hàng' : order.provinceShipping ? ' - Gửi đơn vị vận chuyển' : order.deliveryAddress ? ` - ${order.deliveryAddress}` : ''}
                    </p>
                  </div>
                  <p className="text-xs leading-5 text-admin-text-secondary sm:text-right">
                    {orderStatusLabel[order.orderStatus]}<br />
                    {paymentStatusLabel[order.paymentStatus]} - {order.totalAmount.toLocaleString('vi-VN')} đ
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
};
