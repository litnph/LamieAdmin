import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { ordersApi } from '../api/ordersApi';
import type { OrderDetailDto } from '../types/order.types';
import { OrderStatus, PaymentStatus } from '../types/order.types';
import {
  nextOrderStatuses,
  nextPaymentStatuses,
  orderStatusLabel,
  paymentStatusLabel,
} from '../constants/orderLabels';
import { channelsApi, type ChannelDto } from '@/features/settings/channels/api/channelsApi';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { useAuth } from '@/features/auth/context/AuthContext';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isManagerOrAbove } = useAuth();
  const [order, setOrder] = useState<OrderDetailDto | null>(null);
  const [channels, setChannels] = useState<ChannelDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [ch, o] = await Promise.all([channelsApi.list(), ordersApi.getById(id)]);
      setChannels(ch);
      setOrder(o);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const channelName = channels.find((c) => c.id === order?.channelId)?.name ?? order?.channelId;

  const patchStatus = async (status: OrderStatus) => {
    if (!id) return;
    setBusy(true);
    try {
      await ordersApi.changeStatus(id, status);
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const patchPay = async (status: PaymentStatus) => {
    if (!id) return;
    setBusy(true);
    try {
      await ordersApi.changePaymentStatus(id, status);
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!id || !window.confirm('Xóa đơn hàng này?')) return;
    setBusy(true);
    try {
      await ordersApi.remove(id);
      navigate('/admin/orders');
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500 py-16 text-center">Đang tải đơn…</div>;
  }

  if (error && !order) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">
        {error}
      </div>
    );
  }

  if (!order) return null;

  const nextOs = nextOrderStatuses(order.orderStatus);
  const nextPs = nextPaymentStatuses(order.paymentStatus);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-admin-primary mb-2"
          >
            <ArrowLeft size={14} /> Danh sách đơn
          </Link>
          <PageHeader title={order.orderCode} subtitle={`Tạo ${new Date(order.createdAt).toLocaleString('vi-VN')}`} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/admin/orders/${order.id}/edit`}
            className="px-4 py-2 rounded-xl bg-admin-primary text-white text-sm font-medium hover:bg-admin-primary-hover"
          >
            Sửa đơn
          </Link>
          {isManagerOrAbove && (
            <button
              type="button"
              onClick={() => void remove()}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 text-red-700 text-sm hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={16} /> Xóa
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-sm px-4 py-3">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="glass-strong rounded-2xl border border-white/50 p-5 space-y-3 text-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Người đặt & kênh</h3>
          <p>
            <span className="text-slate-500">Tên:</span> {order.ordererName}
          </p>
          <p>
            <span className="text-slate-500">SĐT:</span> {order.ordererPhone}
          </p>
          <p>
            <span className="text-slate-500">Kênh:</span> {channelName}
          </p>
        </section>

        <section className="glass-strong rounded-2xl border border-white/50 p-5 space-y-3 text-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Người nhận & giao hàng</h3>
          <p>
            <span className="text-slate-500">Tên:</span> {order.recipientName}
          </p>
          <p>
            <span className="text-slate-500">SĐT:</span> {order.recipientPhone}
          </p>
          <p>
            <span className="text-slate-500">Ghé shop:</span> {order.pickupAtShop ? 'Có' : 'Không — giao tận nơi'}
          </p>
          {!order.pickupAtShop && (
            <>
              <p>
                <span className="text-slate-500">Địa chỉ:</span> {order.deliveryAddress ?? '—'}
              </p>
              {order.deliveryLatitude != null && order.deliveryLongitude != null && (
                <p className="text-slate-500">
                  Bản đồ: {order.deliveryLatitude.toFixed(5)}, {order.deliveryLongitude.toFixed(5)}
                </p>
              )}
            </>
          )}
          <p>
            <span className="text-slate-500">Thời gian nhận:</span>{' '}
            {new Date(order.deliveryAt).toLocaleString('vi-VN')}
          </p>
        </section>

        <section className="glass-strong rounded-2xl border border-white/50 p-5 space-y-3 text-sm lg:col-span-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nội dung & tài chính</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <p>
              <span className="text-slate-500">Cọc:</span> {order.depositAmount.toLocaleString('vi-VN')}
            </p>
            <p>
              <span className="text-slate-500">Phí ship (ước tính):</span> {order.shippingFee.toLocaleString('vi-VN')}
            </p>
            <p>
              <span className="text-slate-500">Phí ship thực tế:</span>{' '}
              {order.shippingFeeActual != null ? order.shippingFeeActual.toLocaleString('vi-VN') : '—'}
            </p>
            <p>
              <span className="text-slate-500">Tạm tính:</span> {order.subTotal.toLocaleString('vi-VN')}
            </p>
            <p className="font-semibold text-slate-900">
              <span className="text-slate-500 font-normal">Tổng:</span> {order.totalAmount.toLocaleString('vi-VN')}
            </p>
          </div>
          {order.description && (
            <p>
              <span className="text-slate-500">Mô tả:</span> {order.description}
            </p>
          )}
          {order.contentNote && (
            <p>
              <span className="text-slate-500">Nội dung đơn:</span> {order.contentNote}
            </p>
          )}
        </section>

        <section className="glass-strong rounded-2xl border border-white/50 p-5 space-y-3 text-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái đơn</h3>
          <p className="text-slate-800 font-medium">{orderStatusLabel[order.orderStatus]}</p>
          {nextOs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {nextOs.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busy}
                  onClick={() => void patchStatus(s)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs hover:border-admin-primary/40"
                >
                  → {orderStatusLabel[s]}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="glass-strong rounded-2xl border border-white/50 p-5 space-y-3 text-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Thanh toán</h3>
          <p className="text-slate-800 font-medium">{paymentStatusLabel[order.paymentStatus]}</p>
          {nextPs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {nextPs.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busy}
                  onClick={() => void patchPay(s)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs hover:border-admin-primary/40"
                >
                  → {paymentStatusLabel[s]}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="glass-strong rounded-2xl border border-white/50 p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Dòng hàng</h3>
        <div className="overflow-x-auto text-sm">
          <table className="w-full">
            <thead className="text-slate-500 text-[11px] uppercase">
              <tr>
                <th className="text-left py-2">Sản phẩm</th>
                <th className="text-right py-2">Đơn giá</th>
                <th className="text-right py-2">SL</th>
                <th className="text-right py-2">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((i) => (
                <tr key={i.id}>
                  <td className="py-2 pr-4">{i.productName}</td>
                  <td className="py-2 text-right">{i.unitPrice.toLocaleString('vi-VN')}</td>
                  <td className="py-2 text-right">{i.quantity}</td>
                  <td className="py-2 text-right font-medium">{i.lineTotal.toLocaleString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {order.images.length > 0 && (
        <section className="glass-strong rounded-2xl border border-white/50 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Hình ảnh</h3>
          <div className="flex flex-wrap gap-3">
            {order.images.map((img) => (
              <a
                key={img.id}
                href={img.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="block w-28 h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
              >
                <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="glass-strong rounded-2xl border border-white/50 p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Lịch sử thay đổi</h3>
        <div className="overflow-x-auto text-sm max-h-[420px] overflow-y-auto">
          <table className="w-full">
            <thead className="text-slate-500 text-[11px] uppercase sticky top-0 bg-white/90">
              <tr>
                <th className="text-left py-2 pr-2">Thời điểm</th>
                <th className="text-left py-2 pr-2">Trường</th>
                <th className="text-left py-2 pr-2">Cũ → Mới</th>
                <th className="text-left py-2">Bởi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.changeLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-slate-500 text-center">
                    Chưa có bản ghi.
                  </td>
                </tr>
              ) : (
                order.changeLogs.map((l) => (
                  <tr key={l.id}>
                    <td className="py-2 pr-2 whitespace-nowrap text-slate-600">
                      {new Date(l.changedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2 pr-2 text-slate-800">
                      {l.entityName}.{l.fieldName}
                    </td>
                    <td className="py-2 pr-2 text-slate-600 max-w-xs truncate" title={`${l.oldValue ?? ''} → ${l.newValue ?? ''}`}>
                      {l.oldValue ?? '∅'} → {l.newValue ?? '∅'}
                    </td>
                    <td className="py-2 text-slate-500">{l.changedByName ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
