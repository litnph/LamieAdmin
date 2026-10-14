import { PackageOpen, Plus, Trash2 } from '@/shared/icons/lucideAnimated';
import type { InventoryItem } from '../types/inventory.types';
import { formatDecimalQuantity } from './IngredientShell';

export type InventoryMaterialDraft = {
  key: string;
  id?: string;
  inventoryItemId: string;
  stockUnitId: string;
  quantity: string;
};

let materialKey = 0;

export const createInventoryMaterialDraft = (): InventoryMaterialDraft => ({
  key: `inventory-material-${++materialKey}`,
  inventoryItemId: '',
  stockUnitId: '',
  quantity: '',
});

type Props = {
  items: InventoryItem[];
  value: InventoryMaterialDraft[];
  onChange: (value: InventoryMaterialDraft[]) => void;
  disabled?: boolean;
  loading?: boolean;
  emptyMessage: string;
  addLabel?: string;
  integrated?: boolean;
  showAddButton?: boolean;
};

const inputClass = 'min-h-10 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 py-2 text-sm text-admin-text-primary outline-none transition-colors focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text';
const rowClass = 'grid min-w-0 grid-cols-[minmax(0,1fr)_2.5rem] gap-2 px-2 py-2.5 lg:grid-cols-[5.5rem_minmax(9rem,1.35fr)_5rem_6.5rem_minmax(8rem,1fr)_2.5rem] lg:items-start';
const headerClass = 'hidden grid-cols-[5.5rem_minmax(9rem,1.35fr)_5rem_6.5rem_minmax(8rem,1fr)_2.5rem] gap-2 border-b border-admin-border bg-admin-muted/35 px-2 py-2 text-[11px] font-semibold text-admin-text-muted lg:grid';

export const InventoryMaterialsEditor = ({
  items,
  value,
  onChange,
  disabled = false,
  loading = false,
  emptyMessage,
  addLabel = 'Thêm vật tư kho',
  integrated = false,
  showAddButton = true,
}: Props) => {
  const update = (key: string, patch: Partial<InventoryMaterialDraft>) => {
    onChange(value.map((row) => row.key === key ? { ...row, ...patch } : row));
  };

  const selectItem = (key: string, inventoryItemId: string) => {
    const item = items.find((candidate) => candidate.id === inventoryItemId);
    const activeUnits = item?.stockUnits.filter((unit) => unit.isActive) ?? [];
    const stockUnitId = !item?.usesSizes && activeUnits.length === 1 ? activeUnits[0].id : '';
    update(key, { inventoryItemId, stockUnitId });
  };

  const rows = value.map((row, index) => {
    const selectedItem = items.find((item) => item.id === row.inventoryItemId)
      ?? items.find((item) => item.stockUnits.some((unit) => unit.id === row.stockUnitId));
    const availableUnits = selectedItem?.stockUnits.filter((unit) => unit.isActive || unit.id === row.stockUnitId) ?? [];
    const selectedUnit = availableUnits.find((unit) => unit.id === row.stockUnitId);
    const usedStockUnits = new Set(value.filter((item) => item.key !== row.key).map((item) => item.stockUnitId));
    const isInactive = Boolean(selectedItem && (!selectedItem.isActive || !selectedUnit?.isActive));

    return (
      <div key={row.key} className={`${rowClass} bg-admin-status-success/[0.035]`} role="group" aria-label={`Vật tư ${index + 1}`}>
        <div className="col-start-1 row-start-1 self-center lg:col-auto lg:row-auto lg:pt-2">
          <span className="inline-flex rounded-md bg-admin-status-success/12 px-2 py-0.5 text-[11px] font-semibold text-admin-status-success">Có tồn kho</span>
        </div>
        <label className="col-span-2 row-start-2 min-w-0 lg:col-span-1 lg:col-start-2 lg:row-start-1">
          <span className="mb-1 block text-xs font-medium text-admin-text-secondary lg:sr-only">Nguyên liệu / vật tư</span>
          <select
            value={selectedItem?.id ?? ''}
            onChange={(event) => selectItem(row.key, event.target.value)}
            className={inputClass}
            disabled={disabled}
            aria-label={`Hàng tồn kho ${index + 1}`}
          >
            <option value="">Chọn hàng tồn kho</option>
            {items
              .filter((item) => item.isActive || item.id === selectedItem?.id)
              .map((item) => (
                <option key={item.id} value={item.id} disabled={!item.isActive && item.id !== selectedItem?.id}>
                  {item.code} · {item.name}{item.isActive ? '' : ' · đã tắt'}
                </option>
              ))}
          </select>
        </label>
        <div className="col-span-2 row-start-3 min-w-0 lg:col-span-1 lg:col-start-3 lg:row-start-1">
          {selectedItem?.usesSizes ? (
            <label className="min-w-0">
              <span className="mb-1 block text-xs font-medium text-admin-text-secondary lg:sr-only">Size</span>
              <select
                value={row.stockUnitId}
                onChange={(event) => update(row.key, { stockUnitId: event.target.value })}
                className={inputClass}
                disabled={disabled}
                aria-label={`Size vật tư ${index + 1}`}
              >
                <option value="">Chọn size</option>
                {availableUnits.map((unit) => (
                  <option key={unit.id} value={unit.id} disabled={usedStockUnits.has(unit.id) || (!unit.isActive && unit.id !== row.stockUnitId)}>
                    {unit.sizeName || 'Không size'} · tồn {formatDecimalQuantity(unit.quantity)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="hidden min-h-10 items-center text-xs text-admin-text-muted lg:flex">—</div>
          )}
        </div>
        <label className="col-span-2 row-start-4 min-w-0 lg:col-span-1 lg:col-start-4 lg:row-start-1">
          <span className="mb-1 block text-xs font-medium text-admin-text-secondary lg:sr-only">Số lượng {selectedUnit?.unitSymbol || selectedUnit?.unitName ? `(${selectedUnit.unitSymbol || selectedUnit.unitName})` : ''}</span>
          <input
            type="number"
            min="0.000001"
            step="0.000001"
            inputMode="decimal"
            value={row.quantity}
            onChange={(event) => update(row.key, { quantity: event.target.value })}
            className={`${inputClass} text-right tabular-nums`}
            disabled={disabled}
            aria-label={`Số lượng vật tư ${index + 1}`}
          />
        </label>
        <div className="col-span-2 row-start-5 min-w-0 text-xs leading-5 lg:col-span-1 lg:col-start-5 lg:row-start-1 lg:pt-2">
          <span className="mb-1 block font-medium text-admin-text-secondary lg:sr-only">Ghi chú</span>
          {isInactive ? <span className="text-amber-700">Vật tư hoặc size đã tắt; tham chiếu cũ vẫn được giữ.</span> : <span className="text-admin-text-muted">—</span>}
        </div>
        <button
          type="button"
          onClick={() => onChange(value.filter((item) => item.key !== row.key))}
          className="col-start-2 row-start-1 inline-flex h-10 w-10 items-center justify-center rounded-admin-control text-admin-status-error transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-admin-status-error/20 disabled:cursor-not-allowed disabled:opacity-50 lg:col-start-6"
          disabled={disabled}
          aria-label={`Xóa vật tư kho ${index + 1}`}
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
    );
  });

  const emptyState = integrated ? null : (
    <div className="rounded-admin-control border border-dashed border-admin-border bg-admin-muted/20 px-4 py-7 text-center">
      <PackageOpen className="mx-auto text-admin-text-muted" size={22} aria-hidden="true" />
      <p className="mt-2 text-sm text-admin-text-muted">{emptyMessage}</p>
    </div>
  );

  const content = loading ? (
    <div className="flex min-h-20 items-center justify-center text-sm text-admin-text-muted" role="status">Đang tải danh mục hàng tồn kho...</div>
  ) : value.length === 0 ? emptyState : (
    <div className="divide-y divide-admin-border">{rows}</div>
  );

  return (
    <div className={integrated ? '' : 'space-y-3'}>
      {integrated ? content : (
        <div className="overflow-hidden rounded-admin-control border border-admin-border">
          <div className={headerClass}>
            <span>Loại</span>
            <span>Nguyên liệu / vật tư</span>
            <span>Size</span>
            <span className="pr-2 text-right">Số lượng</span>
            <span>Ghi chú</span>
            <span className="sr-only">Thao tác</span>
          </div>
          {content}
        </div>
      )}

      {showAddButton ? (
        <button
          type="button"
          onClick={() => onChange([...value, createInventoryMaterialDraft()])}
          disabled={disabled || !items.some((item) => item.isActive && item.stockUnits.some((unit) => unit.isActive))}
          className="inline-flex min-h-10 items-center gap-2 rounded-admin-control border border-admin-border px-3 text-sm font-semibold text-admin-primary transition-colors hover:bg-admin-muted focus:outline-none focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Plus size={15} aria-hidden="true" /> {addLabel}
        </button>
      ) : null}
    </div>
  );
};
