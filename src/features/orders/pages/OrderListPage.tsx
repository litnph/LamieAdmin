import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/shared/components/PageHeader';
import { ordersApi } from '../api/ordersApi';
import type { OrderListItemDto, OrderListQuery } from '../types/order.types';
import { OrderStatus, PaymentStatus } from '../types/order.types';
import { orderStatusLabel, paymentStatusLabel } from '../constants/orderLabels';
import { channelsApi, type ChannelDto } from '@/features/settings/channels/api/channelsApi';
import { getApiErrorMessage } from '@/shared/utils/apiError';

const inputClass =
  'w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary';

export const OrderListPage: React.FC = () => {
  const [rows, setRows] = useState<OrderListItemDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [channels, setChannels] = useState<ChannelDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<OrderListQuery>({
    page: 1,
    pageSize: 20,
  });

  const channelName = useMemo(() => {
    const map = new Map(channels.map((c) => [c.id, c.name]));
    return (id: string) => map.get(id) ?? id.slice(0, 8);
  }, [channels]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ch, data] = await Promise.all([
        channelsApi.list(),
        ordersApi.list({ ...filters, page, pageSize }),
      ]);
      setChannels(ch);
      setRows(data.items);
      setTotal(data.totalCount);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setFilters((f) => ({ ...f, page: 1 }));
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Đơn hàng" subtitle="Danh sách, lọc theo trạng thái, kênh và thời gian." />

      <form
        onSubmit={applyFilters}
        className="glass-strong rounded-2xl border border-white/50 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3"
      >
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Trạng thái đơn</label>
          <select
            className={inputClass}
            value={filters.orderStatus ?? ''}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                orderStatus: e.target.value ? (Number(e.target.value) as OrderStatus) : undefined,
              }))
            }
          >
            <option value="">Tất cả</option>
            {Object.entries(orderStatusLabel).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Thanh toán</label>
          <select
            className={inputClass}
            value={filters.paymentStatus ?? ''}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                paymentStatus: e.target.value ? (Number(e.target.value) as PaymentStatus) : undefined,
              }))
            }
          >
            <option value="">Tất cả</option>
            {Object.entries(paymentStatusLabel).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Kênh</label>
          <select
            className={inputClass}
            value={filters.channelId ?? ''}
            onChange={(e) =>
              setFilters((f) => ({ ...f, channelId: e.target.value || undefined }))
            }
          >
            <option value="">Tất cả</option>
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">SĐT</label>
          <input
            className={inputClass}
            value={filters.phone ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, phone: e.target.value || undefined }))}
            placeholder="Người nhận / đặt"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Tìm kiếm</label>
          <input
            className={inputClass}
            value={filters.search ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
            placeholder="Mã đơn, tên…"
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-admin-primary text-white text-sm font-medium hover:bg-admin-primary-hover transition-colors"
          >
            Lọc
          </button>
          <Link
            to="/admin/orders/new"
            className="px-4 py-2 rounded-xl border border-admin-primary/30 text-admin-primary text-sm font-medium hover:bg-admin-primary/5 transition-colors"
          >
            Tạo đơn
          </Link>
        </div>
      </form>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">{error}</div>
      )}

      <div className="glass-strong rounded-2xl border border-white/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/60 text-slate-500 text-[11px] uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 font-medium">Mã</th>
                <th className="px-4 py-3 font-medium">Người đặt</th>
                <th className="px-4 py-3 font-medium">Kênh</th>
                <th className="px-4 py-3 font-medium">Nhận</th>
                <th className="px-4 py-3 font-medium">Giao lúc</th>
                <th className="px-4 py-3 font-medium text-right">Tổng</th>
                <th className="px-4 py-3 font-medium">TT đơn</th>
                <th className="px-4 py-3 font-medium">TT TT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    Đang tải…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    Không có đơn phù hợp.
                  </td>
                </tr>
              ) : (
                rows.map((o) => (
                  <tr key={o.id} className="hover:bg-white/50">
                    <td className="px-4 py-3">
                      <Link to={`/admin/orders/${o.id}`} className="font-medium text-admin-primary hover:underline">
                        {o.orderCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div>{o.ordererName}</div>
                      <div className="text-[11px] text-slate-400">{o.ordererPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{channelName(o.channelId)}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <div>{o.recipientName}</div>
                      <div className="text-[11px] text-slate-400">{o.recipientPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {new Date(o.deliveryAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">
                      {o.totalAmount.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{orderStatusLabel[o.orderStatus]}</td>
                    <td className="px-4 py-3 text-slate-600">{paymentStatusLabel[o.paymentStatus]}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {total > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm text-slate-600">
            <span>
              {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} / {total}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={page * pageSize >= total}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
