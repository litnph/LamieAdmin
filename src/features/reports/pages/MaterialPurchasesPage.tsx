import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Permission } from '@/features/auth/permissions';
import { PageHeader } from '@/shared/components/PageHeader';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { financeApi, type MaterialPurchase, type PurchaseLineInput } from '../api/financeApi';
import { formatDate, formatMoney, vietnamToday } from '../utils/financeReportFormatters';

const groups: Record<number, string> = { 1: 'Hoa tươi', 2: 'Phụ liệu', 3: 'Giỏ, bình & phụ kiện', 99: 'Khác' };
const blankLine = (): PurchaseLineInput => ({ group: 1, description: '', amount: 0 });

export const MaterialPurchasesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(Permission.ExpensesManage);
  const today = useMemo(vietnamToday, []);
  const [range, setRange] = useState({ from: `${today.slice(0, 8)}01`, to: today });
  const [items, setItems] = useState<MaterialPurchase[]>([]);
  const [form, setForm] = useState({ purchaseDate: today, receivedDate: today, invoiceDate: '', vendorName: '', vendorAddress: '', vendorTaxId: '', documentStatus: 1, taxEligibilityStatus: 1, documentReference: '', attachmentUrl: '', notes: '' });
  const [lines, setLines] = useState<PurchaseLineInput[]>([blankLine()]);
  const [paymentFor, setPaymentFor] = useState<string | null>(null);
  const [payment, setPayment] = useState({ amount: 0, paidAt: `${today}T12:00`, method: 2, note: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setBusy(true); setError(null); try { setItems(await financeApi.purchases(range.from, range.to)); } catch (e) { setError(getApiErrorMessage(e)); } finally { setBusy(false); } }, [range]);
  useEffect(() => { void load(); }, [load]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      await financeApi.createPurchase({ ...form, invoiceDate: form.invoiceDate || null, vendorAddress: form.vendorAddress || null, vendorTaxId: form.vendorTaxId || null, documentReference: form.documentReference || null, attachmentUrl: form.attachmentUrl || null, notes: form.notes || null, lines });
      setForm((value) => ({ ...value, invoiceDate: '', vendorName: '', vendorAddress: '', vendorTaxId: '', documentReference: '', attachmentUrl: '', notes: '' })); setLines([blankLine()]); await load();
    } catch (e) { setError(getApiErrorMessage(e)); } finally { setBusy(false); }
  };
  const pay = async (event: React.FormEvent) => {
    event.preventDefault(); if (!paymentFor) return; setBusy(true); setError(null);
    try { await financeApi.addPurchasePayment(paymentFor, { amount: payment.amount, paidAt: new Date(payment.paidAt).toISOString(), method: payment.method, idempotencyKey: crypto.randomUUID(), note: payment.note || null }); setPaymentFor(null); await load(); }
    catch (e) { setError(getApiErrorMessage(e)); } finally { setBusy(false); }
  };
  return <div className="finance-page min-w-0"><PageHeader eyebrow="Lamie / Finance Studio" title="Mua nguyên liệu" description="Một phiếu mua có nhiều nhóm; công nợ và từng lần trả được lưu riêng." />
    {error ? <div className="finance-error" role="alert">{error}</div> : null}
    {canManage ? <section className="finance-card"><div className="finance-card-head"><div><h2>Phiếu mua mới</h2><p>Ngày nhận hàng quyết định kỳ nguyên liệu; ngày trả tiền quyết định dòng tiền.</p></div></div><form className="finance-card-body grid gap-4 md:grid-cols-2" onSubmit={submit}>
      <label>Ngày mua<input type="date" required className="finance-input" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} /></label><label>Ngày nhận hàng<input type="date" required className="finance-input" value={form.receivedDate} onChange={(e) => setForm({ ...form, receivedDate: e.target.value })} /></label>
      <label>Ngày hóa đơn<input type="date" className="finance-input" value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} /><span className="mt-1 block text-xs text-admin-text-muted">Tách riêng ngày mua và ngày nhận; để trống khi chưa có hóa đơn.</span></label>
      <label>Nhà cung cấp<input required maxLength={200} className="finance-input" value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} /></label><label>Địa chỉ / sạp<input className="finance-input" value={form.vendorAddress} onChange={(e) => setForm({ ...form, vendorAddress: e.target.value })} /></label>
      <label>Thông tin định danh / MST<input className="finance-input" value={form.vendorTaxId} onChange={(e) => setForm({ ...form, vendorTaxId: e.target.value })} /></label><label>Trạng thái chứng từ<select className="finance-input" value={form.documentStatus} onChange={(e) => setForm({ ...form, documentStatus: Number(e.target.value) })}><option value={1}>Thiếu</option><option value={2}>Cần kiểm tra</option><option value={3}>Có tài liệu, chờ kiểm tra</option><option value={4}>Đã đối soát</option></select></label>
      <label>Đánh giá thuế<select className="finance-input" value={form.taxEligibilityStatus} onChange={(e) => setForm({ ...form, taxEligibilityStatus: Number(e.target.value) })}><option value={1}>Chưa đánh giá</option><option value={2}>Cần kiểm tra</option><option value={3}>Được đánh giá đủ điều kiện</option><option value={4}>Không đủ điều kiện</option></select></label><label>Tham chiếu chứng từ<input className="finance-input" placeholder="Số phiếu / số hóa đơn" value={form.documentReference} onChange={(e) => setForm({ ...form, documentReference: e.target.value })} /></label>
      <label>URL tệp đính kèm<input className="finance-input" type="url" placeholder="https://…" value={form.attachmentUrl} onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })} /></label><label>Ghi chú<input className="finance-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
      <div className="md:col-span-2"><div className="finance-card-head"><strong>Các dòng nhóm nguyên liệu</strong><button type="button" className="finance-secondary-button" onClick={() => setLines([...lines, blankLine()])}>+ Thêm dòng</button></div>{lines.map((line, index) => <div className="grid gap-3 md:grid-cols-[1fr_2fr_1fr_auto] mb-3" key={index}><select className="finance-input" value={line.group} onChange={(e) => setLines(lines.map((item, i) => i === index ? { ...item, group: Number(e.target.value) } : item))}>{Object.entries(groups).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select><input className="finance-input" placeholder="Mô tả" value={line.description} onChange={(e) => setLines(lines.map((item, i) => i === index ? { ...item, description: e.target.value } : item))} /><input className="finance-input" type="number" min="1" step="1" required placeholder="Giá trị" value={line.amount || ''} onChange={(e) => setLines(lines.map((item, i) => i === index ? { ...item, amount: Number(e.target.value) } : item))} /><button type="button" disabled={lines.length === 1} onClick={() => setLines(lines.filter((_, i) => i !== index))}>Xóa</button></div>)}</div>
      <button disabled={busy} className="finance-primary-button md:col-span-2" type="submit">Lưu phiếu mua</button>
    </form></section> : <div className="finance-data-warning"><strong>Chế độ chỉ xem</strong><span>Bạn có thể đối soát phiếu mua nhưng không có quyền tạo phiếu hoặc ghi thanh toán.</span></div>}
    <section className="finance-card">
      <div className="finance-card-head">
        <div><h2>Phiếu mua trong kỳ</h2><p>{formatDate(range.from)} — {formatDate(range.to)}</p></div>
        <div className="flex gap-2"><input className="finance-input" type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} /><input className="finance-input" type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /></div>
      </div>
      <div className="finance-table-scroll"><table className="finance-table"><thead><tr><th>Ngày nhận</th><th>Nhà cung cấp</th><th>Nhóm</th><th>Chứng từ / thuế</th><th className="num">Giá trị</th><th className="num">Đã trả</th><th className="num">Còn nợ</th><th /></tr></thead><tbody>
        {items.map((item) => <tr key={item.id}><td>{formatDate(item.receivedDate)}</td><td>{item.vendorName}</td><td>{item.lines.map((line) => groups[line.group]).join(', ')}</td><td>{item.documentStatus === 4 ? 'Đã đối soát' : 'Cần bổ sung'} / {item.taxEligibilityStatus === 1 ? 'Chưa đánh giá thuế' : 'Đã có đánh giá'}</td><td className="num">{formatMoney(item.totalAmount)}</td><td className="num">{formatMoney(item.paidAmount)}</td><td className="num">{formatMoney(item.outstandingAmount)}</td><td>{canManage ? <button type="button" disabled={item.outstandingAmount <= 0} className="finance-text-link" onClick={() => { setPaymentFor(item.id); setPayment((value) => ({ ...value, amount: item.outstandingAmount })); }}>Ghi trả tiền</button> : null}</td></tr>)}
      </tbody></table>{!items.length && !busy ? <div className="finance-empty">Chưa có phiếu mua trong khoảng này.</div> : null}</div>
    </section>
    {canManage && paymentFor ? <div className="finance-dialog-backdrop" role="presentation"><form className="finance-dialog" role="dialog" aria-modal="true" aria-label="Ghi nhận trả tiền nhà cung cấp" onSubmit={pay}><div className="finance-card-head"><h2>Ghi nhận trả tiền</h2><button type="button" onClick={() => setPaymentFor(null)}>Đóng</button></div><div className="finance-card-body grid gap-3"><label>Số tiền<input className="finance-input" type="number" min="1" required value={payment.amount || ''} onChange={(e) => setPayment({ ...payment, amount: Number(e.target.value) })} /></label><label>Thời điểm trả<input className="finance-input" type="datetime-local" required value={payment.paidAt} onChange={(e) => setPayment({ ...payment, paidAt: e.target.value })} /></label><label>Phương thức<select className="finance-input" value={payment.method} onChange={(e) => setPayment({ ...payment, method: Number(e.target.value) })}><option value={1}>Tiền mặt</option><option value={2}>Chuyển khoản</option><option value={3}>Thẻ</option><option value={99}>Khác</option></select></label><button className="finance-primary-button" type="submit">Lưu giao dịch</button></div></form></div> : null}
  </div>;
};
