import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Map as MapIcon } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { ordersApi } from '../api/ordersApi';
import type { OrderCalendarItemDto, OrderDeliveryLocationDto } from '../types/order.types';
import { orderStatusLabel, paymentStatusLabel } from '../constants/orderLabels';
import { OrdersDeliveryMap } from '../components/OrdersDeliveryMap';
import { getApiErrorMessage } from '@/shared/utils/apiError';

const todayLocal = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
      const [cal, locs] = await Promise.all([ordersApi.calendar(date), ordersApi.calendarLocations(date)]);
      setItems(cal);
      setLocations(locs);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(() => [...items].sort((a, b) => new Date(a.deliveryAt).getTime() - new Date(b.deliveryAt).getTime()), [items]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch giao trong ngày"
        subtitle="Đơn theo ngày nhận hàng, sắp xếp theo giờ; bản đồ các điểm giao (OpenStreetMap)."
      />

      <div className="flex flex-wrap items-center gap-3 glass-strong rounded-2xl border border-white/50 p-4">
        <Calendar size={18} className="text-admin-primary" />
        <label className="text-sm text-slate-600 flex items-center gap-2">
          Ngày
          <input
            type="date"
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => setShowMap((v) => !v)}
          className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-white"
        >
          <MapIcon size={16} />
          {showMap ? 'Ẩn bản đồ' : 'Hiện bản đồ'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">{error}</div>
      )}

      {showMap && !loading && locations.length > 0 && <OrdersDeliveryMap locations={locations} />}

      {showMap && !loading && locations.length === 0 && (
        <p className="text-sm text-slate-500 glass-strong rounded-2xl border border-white/40 px-4 py-3">
          Không có điểm giao có tọa độ trong ngày này (đơn lấy tại shop hoặc chưa ghim bản đồ).
        </p>
      )}

      <div className="glass-strong rounded-2xl border border-white/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium text-slate-700">
          {loading ? 'Đang tải…' : `${sorted.length} đơn`}
        </div>
        <ul className="divide-y divide-slate-100">
          {sorted.length === 0 && !loading ? (
            <li className="px-4 py-10 text-center text-slate-500 text-sm">Không có đơn trong ngày.</li>
          ) : (
            sorted.map((o) => (
              <li key={o.id} className="px-4 py-3 flex flex-wrap items-center gap-3 hover:bg-white/40 text-sm">
                <span className="text-slate-500 w-36 shrink-0">{new Date(o.deliveryAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                <Link to={`/admin/orders/${o.id}`} className="font-medium text-admin-primary hover:underline shrink-0">
                  {o.orderCode}
                </Link>
                <span className="text-slate-800">{o.recipientName}</span>
                <span className="text-slate-500 text-xs">{o.recipientPhone}</span>
                {o.pickupAtShop ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Lấy tại shop</span>
                ) : (
                  <span className="text-xs text-slate-500 truncate max-w-[200px]">{o.deliveryAddress}</span>
                )}
                <span className="ml-auto text-xs text-slate-500">
                  {orderStatusLabel[o.orderStatus]} · {paymentStatusLabel[o.paymentStatus]} ·{' '}
                  {o.totalAmount.toLocaleString('vi-VN')}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};
