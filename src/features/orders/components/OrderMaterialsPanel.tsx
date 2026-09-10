import React, { useEffect, useState } from 'react';
import { PackageOpen, Pencil, Plus, Trash2, X } from 'lucide-react';
import { inventoryApi } from '@/features/ingredients/api/inventoryApi';
import { formatDecimalQuantity } from '@/features/ingredients/components/IngredientShell';
import type { InventoryItem } from '@/features/ingredients/types/inventory.types';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { ordersApi } from '../api/ordersApi';
import { OrderStatus, type OrderDetailDto, type OrderMaterialDto } from '../types/order.types';

type DraftLine = { key: string; id?: string; inventoryItemId: string; stockUnitId: string; quantityText: string };
let keySequence = 0;
const newLine = (): DraftLine => ({ key: `inventory-usage-${++keySequence}`, inventoryItemId: '', stockUnitId: '', quantityText: '' });
const inputClass = 'h-10 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 text-sm text-admin-text-primary outline-none focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/15';

export const OrderMaterialsPanel: React.FC<{
  order: OrderDetailDto;
  canManage: boolean;
  onSaved: () => Promise<void>;
}> = ({ order, canManage, onSaved }) => {
  const usages = order.materials ?? [];
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [rows, setRows] = useState<DraftLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const terminal = order.orderStatus === OrderStatus.Completed || order.orderStatus === OrderStatus.Cancelled;

  const rowsFromUsages = (inventoryItems: InventoryItem[]) => usages.map((usage) => ({
    key: usage.id,
    id: usage.id,
    inventoryItemId: usage.inventoryItemId || inventoryItems.find((item) => item.stockUnits.some((unit) => unit.id === usage.stockUnitId))?.id || '',
    stockUnitId: usage.stockUnitId,
    quantityText: String(usage.requiredQuantity),
  }));

  useEffect(() => {
    if (editing) setRows(rowsFromUsages(items));
  }, [editing, order.id]); // Existing usages are refreshed before reopening the editor.

  const openEditor = async () => {
    setEditing(true); setLoading(true); setError('');
    try {
      const inventoryItems = await inventoryApi.listItems(true);
      setItems(inventoryItems);
      setRows(rowsFromUsages(inventoryItems));
    } catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setLoading(false); }
  };

  const selectItem = (key: string, inventoryItemId: string) => {
    const item = items.find((candidate) => candidate.id === inventoryItemId);
    const activeUnits = item?.stockUnits.filter((unit) => unit.isActive) ?? [];
    const stockUnitId = !item?.usesSizes && activeUnits.length === 1 ? activeUnits[0].id : '';
    setRows((current) => current.map((row) => row.key === key ? { ...row, inventoryItemId, stockUnitId } : row));
  };

  const save = async () => {
    const payload = rows.map((row) => ({ id: row.id, stockUnitId: row.stockUnitId, quantity: Number(row.quantityText) }));
    if (rows.some((row) => !row.inventoryItemId) || payload.some((item) => !item.stockUnitId || !Number.isFinite(item.quantity) || item.quantity <= 0)) { setError('Mỗi dòng cần hàng tồn, size khi có, và số lượng lớn hơn 0.'); return; }
    if (new Set(payload.map((item) => item.stockUnitId)).size !== payload.length) { setError('Một hàng tồn/size chỉ được xuất hiện một lần.'); return; }
    setSaving(true); setError('');
    try { await ordersApi.saveMaterials(order.id, payload, order.rowVersion); await onSaved(); setEditing(false); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setSaving(false); }
  };

  const summary = (usage: OrderMaterialDto) => {
    const size = usage.sizeName ? `Size ${usage.sizeName} · ` : '';
    const deduction = usage.deductedQuantity > 0 ? ` · đã trừ ${formatDecimalQuantity(usage.deductedQuantity)}` : ' · chưa trừ';
    return `${size}${formatDecimalQuantity(usage.requiredQuantity)} ${usage.unitSymbol || usage.unitName}${deduction}`;
  };

  return <section className="rounded-admin-panel border border-admin-border bg-admin-surface p-4 shadow-admin-panel sm:p-5" aria-labelledby="order-inventory-usage-title">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="order-inventory-usage-title" className="flex items-center gap-2 font-semibold"><PackageOpen size={18} /> Vật tư kho sử dụng</h2><p className="mt-1 text-xs leading-5 text-admin-text-muted">Chỉ các dòng này làm giảm Kho tồn khi đơn bắt đầu chuẩn bị. Danh sách nguyên liệu cần chuẩn bị theo ngày không trừ kho.</p></div>{canManage && !terminal && !editing ? <button type="button" onClick={() => void openEditor()} className="inline-flex min-h-10 items-center gap-2 rounded-admin-control border px-3 text-sm font-semibold text-admin-primary"><Pencil size={15} /> {usages.length ? 'Sửa vật tư kho' : 'Thêm vật tư kho'}</button> : null}</div>
    {!editing ? usages.length === 0 ? <p className="mt-4 rounded-admin-control border border-dashed px-4 py-7 text-center text-sm text-admin-text-muted">Đơn hàng chưa khai báo vật tư cần trừ từ Kho tồn.</p> : <div className="mt-4 divide-y rounded-admin-control border">{usages.map((usage) => <div key={usage.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"><div><p className="text-sm font-medium">{usage.inventoryItemName}</p><p className="mt-0.5 text-xs text-admin-text-muted">{usage.inventoryItemCode} · {summary(usage)}</p></div><p className="text-xs">Tồn hiện tại: <strong>{formatDecimalQuantity(usage.currentStock)}</strong></p></div>)}</div> : <div className="mt-4 space-y-3">
      {loading ? <p className="py-6 text-center text-sm">Đang tải Kho tồn...</p> : rows.map((row, index) => { const item = items.find((candidate) => candidate.id === row.inventoryItemId); const availableUnits = item?.stockUnits.filter((unit) => unit.isActive || unit.id === row.stockUnitId) ?? []; return <div key={row.key} className={`grid gap-2 rounded-admin-control border p-3 ${item?.usesSizes ? 'sm:grid-cols-[minmax(12rem,1fr)_9rem_8rem_auto]' : 'sm:grid-cols-[minmax(12rem,1fr)_8rem_auto]'} sm:items-end`}><label><span className="mb-1 block text-xs font-medium">Hàng tồn</span><select value={row.inventoryItemId} onChange={(event) => selectItem(row.key, event.target.value)} className={inputClass}><option value="">Chọn hàng tồn</option>{items.filter((candidate) => candidate.isActive || candidate.id === row.inventoryItemId).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.code} · {candidate.name}{candidate.isActive ? '' : ' (đã tắt)'}</option>)}</select></label>{item?.usesSizes ? <label><span className="mb-1 block text-xs font-medium">Size</span><select value={row.stockUnitId} onChange={(event) => setRows((current) => current.map((candidate) => candidate.key === row.key ? { ...candidate, stockUnitId: event.target.value } : candidate))} className={inputClass}><option value="">Chọn size</option>{availableUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.sizeName} · tồn {formatDecimalQuantity(unit.quantity)}</option>)}</select></label> : null}<label><span className="mb-1 block text-xs font-medium">Số lượng</span><input value={row.quantityText} onChange={(event) => setRows((current) => current.map((candidate) => candidate.key === row.key ? { ...candidate, quantityText: event.target.value } : candidate))} className={inputClass} inputMode="decimal" /></label><button type="button" onClick={() => setRows((current) => current.filter((candidate) => candidate.key !== row.key))} className="inline-flex h-10 w-10 items-center justify-center text-admin-status-error" aria-label={`Xóa vật tư kho ${index + 1}`}><Trash2 size={16} /></button></div>; })}
      {!loading ? <button type="button" onClick={() => setRows((current) => [...current, newLine()])} className="inline-flex min-h-10 items-center gap-2 rounded-admin-control border px-3 text-sm font-semibold text-admin-primary"><Plus size={15} /> Thêm dòng</button> : null}
      {error ? <p className="text-sm text-admin-status-error" role="alert">{error}</p> : null}<div className="flex justify-end gap-2 border-t pt-3"><button type="button" disabled={saving} onClick={() => setEditing(false)} className="inline-flex h-10 items-center gap-1 rounded-admin-control border px-3 text-sm font-semibold"><X size={15} /> Hủy</button><button type="button" disabled={saving || loading} onClick={() => void save()} className="h-10 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu vật tư kho'}</button></div>
    </div>}
  </section>;
};
