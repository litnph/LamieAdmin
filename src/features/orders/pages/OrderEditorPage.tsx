import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { ordersApi } from '../api/ordersApi';
import type { CreateOrderLine, UpdateOrderLine } from '../types/order.types';
import { channelsApi, type ChannelDto } from '@/features/settings/channels/api/channelsApi';
import { DeliveryLocationPicker } from '../components/DeliveryLocationPicker';
import { nominatimSearch } from '../utils/geocode';
import { getApiErrorMessage } from '@/shared/utils/apiError';

const inputClass =
  'w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary';

const emptyLine = (): CreateOrderLine => ({
  productName: '',
  unitPrice: 0,
  quantity: 1,
});

type EditorProps = {
  orderId?: string;
};

const OrderEditor: React.FC<EditorProps> = ({ orderId }) => {
  const navigate = useNavigate();
  const isEdit = !!orderId;
  const [channels, setChannels] = useState<ChannelDto[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ordererName, setOrdererName] = useState('');
  const [ordererPhone, setOrdererPhone] = useState('');
  const [channelId, setChannelId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [pickupAtShop, setPickupAtShop] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLatitude, setDeliveryLatitude] = useState<number | null>(null);
  const [deliveryLongitude, setDeliveryLongitude] = useState<number | null>(null);
  const [deliveryAt, setDeliveryAt] = useState('');
  const [depositAmount, setDepositAmount] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingFeeActual, setShippingFeeActual] = useState<string>('');
  const [description, setDescription] = useState('');
  const [contentNote, setContentNote] = useState('');
  const [items, setItems] = useState<UpdateOrderLine[]>([{ ...emptyLine() }]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [geoQuery, setGeoQuery] = useState('');
  const [geoResults, setGeoResults] = useState<Awaited<ReturnType<typeof nominatimSearch>>>([]);

  const toLocalInput = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const fromLocalInput = (v: string) => {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  };

  const load = useCallback(async () => {
    if (!orderId) {
      setChannels(await channelsApi.list());
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [ch, o] = await Promise.all([channelsApi.list(), ordersApi.getById(orderId)]);
      setChannels(ch);
      setOrdererName(o.ordererName);
      setOrdererPhone(o.ordererPhone);
      setChannelId(o.channelId);
      setRecipientName(o.recipientName);
      setRecipientPhone(o.recipientPhone);
      setPickupAtShop(o.pickupAtShop);
      setDeliveryAddress(o.deliveryAddress ?? '');
      setDeliveryLatitude(o.deliveryLatitude ?? null);
      setDeliveryLongitude(o.deliveryLongitude ?? null);
      setDeliveryAt(toLocalInput(o.deliveryAt));
      setDepositAmount(o.depositAmount);
      setShippingFee(o.shippingFee);
      setShippingFeeActual(o.shippingFeeActual != null ? String(o.shippingFeeActual) : '');
      setDescription(o.description ?? '');
      setContentNote(o.contentNote ?? '');
      setItems(
        o.items.length
          ? o.items.map((i) => ({
              id: i.id,
              productId: i.productId ?? undefined,
              productSku: i.productSku ?? undefined,
              productName: i.productName,
              unitPrice: i.unitPrice,
              quantity: i.quantity,
              note: i.note ?? undefined,
            }))
          : [{ ...emptyLine() }],
      );
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateLine = (index: number, patch: Partial<UpdateOrderLine>) => {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addLine = () => setItems((prev) => [...prev, { ...emptyLine() }]);
  const removeLine = (index: number) => setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));

  const runGeoSearch = async () => {
    const r = await nominatimSearch(geoQuery);
    setGeoResults(r);
  };

  const pickGeo = (lat: number, lon: number, label: string) => {
    setDeliveryLatitude(lat);
    setDeliveryLongitude(lon);
    if (!deliveryAddress.trim()) setDeliveryAddress(label);
    setGeoResults([]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const deliveryIso = fromLocalInput(deliveryAt);
      if (isEdit && orderId) {
        await ordersApi.update(orderId, {
          ordererName,
          ordererPhone,
          channelId,
          recipientName,
          recipientPhone,
          pickupAtShop,
          deliveryAddress: pickupAtShop ? undefined : deliveryAddress,
          deliveryLatitude: pickupAtShop ? undefined : deliveryLatitude ?? undefined,
          deliveryLongitude: pickupAtShop ? undefined : deliveryLongitude ?? undefined,
          deliveryAt: deliveryIso,
          depositAmount,
          shippingFee: pickupAtShop ? 0 : shippingFee,
          shippingFeeActual: pickupAtShop
            ? null
            : shippingFeeActual.trim() === ''
              ? null
              : Number(shippingFeeActual),
          description: description || undefined,
          contentNote: contentNote || undefined,
          items,
        });
        navigate(`/admin/orders/${orderId}`);
      } else {
        const created = await ordersApi.create({
          ordererName,
          ordererPhone,
          channelId,
          recipientName,
          recipientPhone,
          pickupAtShop,
          deliveryAddress: pickupAtShop ? undefined : deliveryAddress,
          deliveryLatitude: pickupAtShop ? undefined : deliveryLatitude ?? undefined,
          deliveryLongitude: pickupAtShop ? undefined : deliveryLongitude ?? undefined,
          deliveryAt: deliveryIso,
          depositAmount,
          shippingFee: pickupAtShop ? 0 : shippingFee,
          description: description || undefined,
          contentNote: contentNote || undefined,
          items: items.map(({ productName, unitPrice, quantity, note, productId, productSku }) => ({
            productName,
            unitPrice,
            quantity,
            note,
            productId,
            productSku,
          })),
          imageFiles,
        });
        navigate(`/admin/orders/${created.id}`);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500 py-16 text-center">Đang tải…</div>;
  }

  return (
    <div className="space-y-6">
      <Link
        to={orderId ? `/admin/orders/${orderId}` : '/admin/orders'}
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-admin-primary"
      >
        <ArrowLeft size={14} /> Quay lại
      </Link>
      <PageHeader title={isEdit ? 'Sửa đơn hàng' : 'Tạo đơn hàng'} subtitle="Đồng bộ với API Lamie (multipart khi tạo, JSON khi sửa)." />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">{error}</div>
      )}

      <form onSubmit={(e) => void submit(e)} className="space-y-6">
        <div className="glass-strong rounded-2xl border border-white/50 p-5 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Người đặt</label>
            <input className={inputClass} value={ordererName} onChange={(e) => setOrdererName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">SĐT người đặt</label>
            <input className={inputClass} value={ordererPhone} onChange={(e) => setOrdererPhone(e.target.value)} required />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Kênh</label>
            <select
              className={inputClass}
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              required
            >
              <option value="">Chọn kênh</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Thời gian nhận hàng</label>
            <input
              type="datetime-local"
              className={inputClass}
              value={deliveryAt}
              onChange={(e) => setDeliveryAt(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="glass-strong rounded-2xl border border-white/50 p-5 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Người nhận</label>
            <input className={inputClass} value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">SĐT người nhận</label>
            <input className={inputClass} value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} required />
          </div>
          <label className="sm:col-span-2 flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={pickupAtShop} onChange={(e) => setPickupAtShop(e.target.checked)} />
            Khách ghé shop lấy hàng (không giao)
          </label>
          {!pickupAtShop && (
            <>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Địa chỉ nhận</label>
                <textarea
                  className={`${inputClass} min-h-[72px]`}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required={!pickupAtShop}
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="block text-[11px] font-medium text-slate-500">Tìm vị trí (Nominatim / OSM)</label>
                <div className="flex gap-2">
                  <input
                    className={inputClass}
                    value={geoQuery}
                    onChange={(e) => setGeoQuery(e.target.value)}
                    placeholder="Địa chỉ, quận, TP…"
                  />
                  <button
                    type="button"
                    onClick={() => void runGeoSearch()}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-sm whitespace-nowrap hover:bg-slate-50"
                  >
                    Tìm
                  </button>
                </div>
                {geoResults.length > 0 && (
                  <ul className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-40 overflow-auto bg-white text-sm">
                    {geoResults.map((r, idx) => (
                      <li key={idx}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700"
                          onClick={() => pickGeo(r.lat, r.lon, r.display_name)}
                        >
                          {r.display_name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <DeliveryLocationPicker
                  latitude={deliveryLatitude}
                  longitude={deliveryLongitude}
                  onChange={(lat, lng) => {
                    setDeliveryLatitude(lat);
                    setDeliveryLongitude(lng);
                  }}
                />
              </div>
            </>
          )}
        </div>

        <div className="glass-strong rounded-2xl border border-white/50 p-5 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Tiền cọc</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className={inputClass}
              value={depositAmount}
              onChange={(e) => setDepositAmount(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Phí ship (ước tính)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className={inputClass}
              disabled={pickupAtShop}
              value={shippingFee}
              onChange={(e) => setShippingFee(Number(e.target.value))}
            />
          </div>
          {isEdit && (
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Phí ship thực tế</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className={inputClass}
                disabled={pickupAtShop}
                value={shippingFeeActual}
                onChange={(e) => setShippingFeeActual(e.target.value)}
                placeholder="Để trống = theo ước tính"
              />
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Mô tả</label>
            <textarea className={`${inputClass} min-h-[60px]`} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Nội dung đơn / ghi chú</label>
            <textarea className={`${inputClass} min-h-[60px]`} value={contentNote} onChange={(e) => setContentNote(e.target.value)} />
          </div>
        </div>

        <div className="glass-strong rounded-2xl border border-white/50 p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dòng hàng</h3>
            <button type="button" onClick={addLine} className="text-xs text-admin-primary font-medium hover:underline">
              + Thêm dòng
            </button>
          </div>
          {items.map((row, idx) => (
            <div key={idx} className="grid sm:grid-cols-12 gap-2 items-end border border-slate-100 rounded-xl p-3 bg-white/60">
              <div className="sm:col-span-5">
                <label className="text-[10px] text-slate-400">Tên SP</label>
                <input
                  className={inputClass}
                  value={row.productName}
                  onChange={(e) => updateLine(idx, { productName: e.target.value })}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] text-slate-400">Đơn giá</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={inputClass}
                  value={row.unitPrice}
                  onChange={(e) => updateLine(idx, { unitPrice: Number(e.target.value) })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] text-slate-400">SL</label>
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  value={row.quantity}
                  onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] text-slate-400">Ghi chú</label>
                <input className={inputClass} value={row.note ?? ''} onChange={(e) => updateLine(idx, { note: e.target.value })} />
              </div>
              <div className="sm:col-span-1 flex justify-end">
                <button type="button" onClick={() => removeLine(idx)} className="text-xs text-red-600 hover:underline">
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>

        {!isEdit && (
          <div className="glass-strong rounded-2xl border border-white/50 p-5 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hình ảnh minh họa (tuỳ chọn)</h3>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImageFiles(Array.from(e.target.files ?? []))}
              className="text-sm text-slate-600"
            />
          </div>
        )}
        {isEdit && (
          <p className="text-xs text-slate-500 px-1">
            Ảnh đính kèm chỉ thêm được lúc tạo đơn (API hiện tại không cập nhật ảnh qua PUT).
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-admin-primary text-white text-sm font-medium hover:bg-admin-primary-hover disabled:opacity-50"
          >
            {saving ? 'Đang lưu…' : isEdit ? 'Cập nhật' : 'Tạo đơn'}
          </button>
          <Link to="/admin/orders" className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-white">
            Huỷ
          </Link>
        </div>
      </form>
    </div>
  );
};

export const OrderCreatePage: React.FC = () => <OrderEditor />;

export const OrderEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <OrderEditor orderId={id} />;
};
