import React, { useEffect, useState } from 'react';
import { PackageOpen, Pencil, X } from '@/shared/icons/lucideAnimated';
import { inventoryApi } from '@/features/ingredients/api/inventoryApi';
import { formatDecimalQuantity } from '@/features/ingredients/components/IngredientShell';
import {
  InventoryMaterialsEditor,
  type InventoryMaterialDraft,
} from '@/features/ingredients/components/InventoryMaterialsEditor';
import type { InventoryItem } from '@/features/ingredients/types/inventory.types';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { ordersApi } from '../api/ordersApi';
import { OrderStatus, type OrderDetailDto, type OrderMaterialDto } from '../types/order.types';

export const OrderMaterialsPanel: React.FC<{
  order: OrderDetailDto;
  canManage: boolean;
  onSaved: () => Promise<void>;
}> = ({ order, canManage, onSaved }) => {
  const usages = order.materials ?? [];
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [rows, setRows] = useState<InventoryMaterialDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const terminal = order.orderStatus === OrderStatus.Completed || order.orderStatus === OrderStatus.Cancelled;

  const rowsFromUsages = (inventoryItems: InventoryItem[]): InventoryMaterialDraft[] => usages.map((usage) => ({
    key: usage.id,
    id: usage.id,
    inventoryItemId: usage.inventoryItemId || inventoryItems.find((item) => item.stockUnits.some((unit) => unit.id === usage.stockUnitId))?.id || '',
    stockUnitId: usage.stockUnitId,
    quantity: String(usage.requiredQuantity),
  }));

  useEffect(() => {
    if (editing) setRows(rowsFromUsages(items));
  }, [editing, order.id]);

  const openEditor = async () => {
    setEditing(true);
    setLoading(true);
    setError('');
    try {
      const inventoryItems = await inventoryApi.listItems(true);
      setItems(inventoryItems);
      setRows(rowsFromUsages(inventoryItems));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    const payload = rows.map((row) => ({ id: row.id, stockUnitId: row.stockUnitId, quantity: Number(row.quantity) }));
    if (rows.some((row) => !row.inventoryItemId) || payload.some((item) => !item.stockUnitId || !Number.isFinite(item.quantity) || item.quantity <= 0)) {
      setError('Mỗi dòng cần hàng tồn kho, size khi có và số lượng lớn hơn 0.');
      return;
    }
    if (new Set(payload.map((item) => item.stockUnitId)).size !== payload.length) {
      setError('Một hàng tồn kho và size chỉ được xuất hiện một lần.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await ordersApi.saveMaterials(order.id, payload, order.rowVersion);
      await onSaved();
      setEditing(false);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const summary = (usage: OrderMaterialDto) => {
    const size = usage.sizeName ? `Size ${usage.sizeName} · ` : '';
    const deduction = usage.deductedQuantity > 0 ? ` · đã trừ ${formatDecimalQuantity(usage.deductedQuantity)}` : ' · chưa trừ';
    return `${size}${formatDecimalQuantity(usage.requiredQuantity)} ${usage.unitSymbol || usage.unitName}${deduction}`;
  };

  return (
    <section className="rounded-admin-panel border border-admin-border bg-admin-surface p-4 shadow-admin-panel sm:p-5" aria-labelledby="order-inventory-usage-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="order-inventory-usage-title" className="flex items-center gap-2 font-semibold"><PackageOpen size={18} aria-hidden="true" /> Vật tư kho sử dụng</h2>
          <p className="mt-1 text-xs leading-5 text-admin-text-muted">Chỉ các dòng này làm giảm Kho tồn khi đơn bắt đầu chuẩn bị. Danh sách nguyên liệu cần chuẩn bị theo ngày không trừ kho.</p>
        </div>
        {canManage && !terminal && !editing ? (
          <button type="button" onClick={() => void openEditor()} className="inline-flex min-h-10 items-center gap-2 rounded-admin-control border border-admin-border px-3 text-sm font-semibold text-admin-primary hover:bg-admin-muted focus:outline-none focus:ring-2 focus:ring-admin-primary/15">
            <Pencil size={15} aria-hidden="true" /> {usages.length ? 'Sửa vật tư kho' : 'Thêm vật tư kho'}
          </button>
        ) : null}
      </div>

      {!editing ? usages.length === 0 ? (
        <p className="mt-4 rounded-admin-control border border-dashed border-admin-border px-4 py-7 text-center text-sm text-admin-text-muted">Đơn hàng chưa khai báo vật tư cần trừ từ Kho tồn.</p>
      ) : (
        <div className="mt-4 divide-y divide-admin-border rounded-admin-control border border-admin-border">
          {usages.map((usage) => (
            <div key={usage.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-admin-text-primary">{usage.inventoryItemName}</p>
                <p className="mt-0.5 text-xs text-admin-text-muted">{usage.inventoryItemCode} · {summary(usage)}</p>
              </div>
              <p className="text-xs text-admin-text-secondary">Tồn hiện tại: <strong className="tabular-nums text-admin-text-primary">{formatDecimalQuantity(usage.currentStock)}</strong></p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <InventoryMaterialsEditor
            items={items}
            value={rows}
            onChange={setRows}
            disabled={saving}
            loading={loading}
            emptyMessage="Chưa có vật tư kho trong đơn hàng."
            addLabel="Thêm dòng"
          />
          {error ? <p className="mt-3 text-sm text-admin-status-error" role="alert">{error}</p> : null}
          <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-admin-border pt-3">
            <button type="button" disabled={saving} onClick={() => setEditing(false)} className="inline-flex min-h-10 items-center gap-1 rounded-admin-control border border-admin-border px-3 text-sm font-semibold hover:bg-admin-muted disabled:opacity-50"><X size={15} aria-hidden="true" /> Hủy</button>
            <button type="button" disabled={saving || loading} onClick={() => void save()} className="min-h-10 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu vật tư kho'}</button>
          </div>
        </div>
      )}
    </section>
  );
};
