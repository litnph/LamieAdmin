import { useEffect, useId, useRef, useState } from 'react';
import {
  Boxes,
  ChevronDown,
  ChevronUp,
  Leaf,
  LoaderCircle,
  PackageOpen,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from '@/shared/icons/lucideAnimated';
import type { InventoryMaterialDraft } from '@/features/ingredients/components/InventoryMaterialsEditor';
import { formatDecimalQuantity } from '@/features/ingredients/components/IngredientShell';
import type { IngredientDto } from '@/features/ingredients/types/ingredient.types';
import type { InventoryItem, InventoryStockUnit } from '@/features/ingredients/types/inventory.types';
import { SettingsDialog } from '@/features/settings/components/SettingsDialog';

export type OrderLineIngredientDraft = {
  key: string;
  ingredientId: number;
  baseQuantity: number;
  note: string;
  sortOrder: number;
};

export type OrderLineIngredientOrigin = 'default' | 'order' | 'custom' | 'empty';

type PendingKind = 'ingredient' | 'inventory' | null;

type Props = {
  lineIndex: number;
  productName: string;
  productQuantity: number;
  ingredients: OrderLineIngredientDraft[];
  ingredientCatalog: IngredientDto[];
  inventoryMaterials: InventoryMaterialDraft[];
  inventoryCatalog: InventoryItem[];
  orderRequiredQuantityByStockUnit: Record<string, number>;
  inventoryLoading?: boolean;
  disabled?: boolean;
  canApplyDefaults: boolean;
  onIngredientsChange: (ingredients: OrderLineIngredientDraft[]) => void;
  onInventoryMaterialsChange: (materials: InventoryMaterialDraft[]) => void;
  onApplyDefaults: () => Promise<void> | void;
};

const inputClass = 'min-h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-2.5 py-2 text-sm text-admin-text-primary outline-none transition-colors placeholder:text-admin-text-muted focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/20 disabled:cursor-not-allowed disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text xl:min-h-10';
const desktopGrid = 'xl:grid-cols-[minmax(13rem,1.45fr)_minmax(6.5rem,.65fr)_minmax(8rem,.7fr)_minmax(9rem,.8fr)_minmax(10rem,1fr)_2.75rem]';

const createKey = (prefix: string) =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random()}`;

const ingredientUnit = (ingredient: IngredientDto | undefined) =>
  ingredient?.baseUnit.symbol?.trim() || ingredient?.baseUnit.name || '';

const stockUnitLabel = (unit: InventoryStockUnit | undefined) =>
  unit?.unitSymbol?.trim() || unit?.unitName || '';

const productCountLabel = (quantity: number) => `${formatDecimalQuantity(Math.max(0, quantity))} sản phẩm`;

const TypeIcon = ({ kind }: { kind: Exclude<PendingKind, null> }) => {
  const label = kind === 'ingredient'
    ? 'Nguyên liệu — không trừ kho'
    : 'Vật tư kho — có trừ kho';
  const tooltipId = useId();
  const Icon = kind === 'ingredient' ? Leaf : PackageOpen;
  return (
    <span className="group/type relative inline-flex shrink-0" tabIndex={0} role="img" aria-label={label} aria-describedby={tooltipId}>
      <Icon
        size={17}
        className={kind === 'ingredient' ? 'text-admin-accent' : 'text-admin-status-success'}
        aria-hidden="true"
      />
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-admin-popover mt-2 hidden w-max max-w-56 rounded-admin-control bg-admin-text-primary px-2.5 py-1.5 text-xs font-medium text-admin-text-inverse shadow-admin-popover group-hover/type:block group-focus/type:block"
      >
        {label}
      </span>
    </span>
  );
};

const TotalValue = ({ perProduct, productQuantity, unit }: { perProduct: number; productQuantity: number; unit: string }) => {
  const total = Number.isFinite(perProduct) ? perProduct * Math.max(0, productQuantity) : 0;
  return (
    <div className="text-right xl:text-left">
      <strong className="block text-sm font-semibold tabular-nums text-admin-text-primary">
        {formatDecimalQuantity(total)}{unit ? ` ${unit}` : ''}
      </strong>
      {productQuantity > 1 ? (
        <span className="mt-0.5 block text-[11px] leading-4 text-admin-text-muted">
          {formatDecimalQuantity(perProduct)} × {productCountLabel(productQuantity)}
        </span>
      ) : null}
    </div>
  );
};

export const OrderLineIngredientsEditor = ({
  lineIndex,
  productName,
  productQuantity,
  ingredients,
  ingredientCatalog,
  inventoryMaterials,
  inventoryCatalog,
  orderRequiredQuantityByStockUnit,
  inventoryLoading = false,
  disabled = false,
  canApplyDefaults,
  onIngredientsChange,
  onInventoryMaterialsChange,
  onApplyDefaults,
}: Props) => {
  const lineLabel = `${lineIndex + 1}. ${productName}`;
  const [expanded, setExpanded] = useState(true);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [pendingKind, setPendingKind] = useState<PendingKind>(null);
  const [pendingIngredientId, setPendingIngredientId] = useState('');
  const [pendingInventoryItemId, setPendingInventoryItemId] = useState('');
  const [pendingStockUnitId, setPendingStockUnitId] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [openNotes, setOpenNotes] = useState<Set<string>>(() => new Set());
  const pendingSelectRef = useRef<HTMLSelectElement>(null);
  const sectionId = useId();

  useEffect(() => {
    if (!pendingKind) return;
    const frame = requestAnimationFrame(() => pendingSelectRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [pendingKind]);

  const resetComposer = () => {
    setPendingKind(null);
    setPendingIngredientId('');
    setPendingInventoryItemId('');
    setPendingStockUnitId('');
  };

  const beginAdd = (kind: Exclude<PendingKind, null>) => {
    setAddMenuOpen(false);
    setPendingKind(kind);
    setSuccessMessage(null);
  };

  const usedIngredientIds = new Set(ingredients.map((item) => item.ingredientId));
  const availableIngredients = ingredientCatalog.filter((item) => item.isActive && !usedIngredientIds.has(item.id));
  const usedStockUnitIds = new Set(inventoryMaterials.map((item) => item.stockUnitId));
  const availableInventoryItems = inventoryCatalog.filter((item) =>
    item.isActive && item.stockUnits.some((unit) => unit.isActive && !usedStockUnitIds.has(unit.id)));
  const pendingInventoryItem = inventoryCatalog.find((item) => item.id === pendingInventoryItemId);
  const pendingUnits = pendingInventoryItem?.stockUnits.filter((unit) => unit.isActive && !usedStockUnitIds.has(unit.id)) ?? [];

  const selectPendingInventoryItem = (inventoryItemId: string) => {
    const item = inventoryCatalog.find((candidate) => candidate.id === inventoryItemId);
    const units = item?.stockUnits.filter((unit) => unit.isActive && !usedStockUnitIds.has(unit.id)) ?? [];
    setPendingInventoryItemId(inventoryItemId);
    setPendingStockUnitId(!item?.usesSizes && units.length === 1 ? units[0].id : '');
  };

  const confirmIngredient = () => {
    const ingredientId = Number(pendingIngredientId);
    if (!ingredientId || usedIngredientIds.has(ingredientId)) return;
    setSuccessMessage(null);
    onIngredientsChange([
      ...ingredients,
      {
        key: createKey('order-ingredient'),
        ingredientId,
        baseQuantity: 1,
        note: '',
        sortOrder: ingredients.length,
      },
    ]);
    resetComposer();
  };

  const confirmInventoryMaterial = () => {
    if (!pendingInventoryItemId || !pendingStockUnitId || usedStockUnitIds.has(pendingStockUnitId)) return;
    setSuccessMessage(null);
    onInventoryMaterialsChange([
      ...inventoryMaterials,
      {
        key: createKey('order-inventory-material'),
        inventoryItemId: pendingInventoryItemId,
        stockUnitId: pendingStockUnitId,
        quantity: '1',
      },
    ]);
    resetComposer();
  };

  const updateIngredient = (index: number, patch: Partial<OrderLineIngredientDraft>) => {
    setSuccessMessage(null);
    onIngredientsChange(ingredients.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };

  const removeIngredient = (index: number) => {
    setSuccessMessage(null);
    onIngredientsChange(ingredients
      .filter((_, itemIndex) => itemIndex !== index)
      .map((item, sortOrder) => ({ ...item, sortOrder })));
  };

  const updateInventoryMaterial = (key: string, patch: Partial<InventoryMaterialDraft>) => {
    setSuccessMessage(null);
    onInventoryMaterialsChange(inventoryMaterials.map((item) => item.key === key ? { ...item, ...patch } : item));
  };

  const selectInventoryItem = (row: InventoryMaterialDraft, inventoryItemId: string) => {
    const item = inventoryCatalog.find((candidate) => candidate.id === inventoryItemId);
    const activeUnits = item?.stockUnits.filter((unit) => unit.isActive) ?? [];
    updateInventoryMaterial(row.key, {
      inventoryItemId,
      stockUnitId: !item?.usesSizes && activeUnits.length === 1 ? activeUnits[0].id : '',
    });
  };

  const applyDefaults = async () => {
    if (applying) return;
    setApplying(true);
    setApplyError(null);
    try {
      await onApplyDefaults();
      setConfirmOpen(false);
      setSuccessMessage(`Đã áp dụng định mức cho “${productName}”.`);
    } catch {
      setApplyError('Không thể áp dụng định mức. Dữ liệu đang chỉnh sửa vẫn được giữ nguyên; vui lòng thử lại.');
    } finally {
      setApplying(false);
    }
  };

  const ingredientRows = ingredients.map((item, index) => {
    const selected = ingredientCatalog.find((ingredient) => ingredient.id === item.ingredientId);
    const usedByOtherRows = new Set(ingredients.filter((_, itemIndex) => itemIndex !== index).map((ingredient) => ingredient.ingredientId));
    const noteOpen = Boolean(item.note) || openNotes.has(item.key);
    return (
      <div
        key={item.key}
        className={`relative grid min-w-0 grid-cols-2 gap-3 border-l-[3px] border-admin-accent bg-admin-accent-light/55 px-3 py-3 ${desktopGrid} xl:items-start`}
        role="row"
        aria-label={`Nguyên liệu ${index + 1}`}
      >
        <div className="col-span-2 min-w-0 pr-12 xl:col-span-1 xl:col-start-1 xl:pr-0" role="cell">
          <label htmlFor={`order-line-ingredient-${lineIndex}-${index}`} className="mb-1 block text-xs font-medium text-admin-text-secondary xl:sr-only">Thành phần</label>
          <div className="flex min-w-0 items-center gap-2">
            <TypeIcon kind="ingredient" />
            <select
              id={`order-line-ingredient-${lineIndex}-${index}`}
              className={inputClass}
              value={item.ingredientId || ''}
              disabled={disabled}
              onChange={(event) => updateIngredient(index, { ingredientId: Number(event.target.value) })}
            >
              <option value="">Chọn nguyên liệu</option>
              {ingredientCatalog
                .filter((ingredient) => !usedByOtherRows.has(ingredient.id) && (ingredient.isActive || ingredient.id === item.ingredientId))
                .map((ingredient) => (
                  <option key={ingredient.id} value={ingredient.id}>{ingredient.code} · {ingredient.name}</option>
                ))}
            </select>
          </div>
        </div>
        <div className="hidden xl:block" role="cell" aria-label="Không có quy cách riêng" />
        <label className="min-w-0 xl:col-start-3" role="cell">
          <span className="mb-1 block text-xs font-medium text-admin-text-secondary xl:sr-only">Định mức cho một sản phẩm</span>
          <div className="relative">
            <input
              id={`order-line-ingredient-quantity-${lineIndex}-${index}`}
              type="number"
              min="0.000001"
              step="any"
              inputMode="decimal"
              className={`${inputClass} pr-12 text-right tabular-nums`}
              value={Number.isFinite(item.baseQuantity) ? item.baseQuantity : ''}
              disabled={disabled}
              onChange={(event) => updateIngredient(index, { baseQuantity: Number(event.target.value) })}
              aria-label={`Định mức nguyên liệu ${index + 1} cho một sản phẩm`}
            />
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[11px] text-admin-text-muted">{ingredientUnit(selected)}</span>
          </div>
        </label>
        <div className="min-w-0 self-end xl:col-start-4 xl:self-auto xl:pt-1" role="cell">
          <span className="mb-1 block text-xs font-medium text-admin-text-secondary xl:sr-only">Tổng cho đơn</span>
          <TotalValue perProduct={item.baseQuantity} productQuantity={productQuantity} unit={ingredientUnit(selected)} />
        </div>
        <div className="col-span-2 min-w-0 xl:col-span-1 xl:col-start-5" role="cell">
          <span className="mb-1 block text-xs font-medium text-admin-text-secondary xl:sr-only">Ghi chú</span>
          {noteOpen ? (
            <textarea
              id={`order-line-ingredient-note-${lineIndex}-${index}`}
              rows={2}
              className={`${inputClass} min-h-10 resize-y`}
              value={item.note}
              autoFocus={openNotes.has(item.key)}
              disabled={disabled}
              onChange={(event) => updateIngredient(index, { note: event.target.value })}
              aria-label={`Ghi chú nguyên liệu ${index + 1}`}
              placeholder="Ghi chú cho thành phần"
            />
          ) : (
            <button
              type="button"
              onClick={() => setOpenNotes((current) => new Set(current).add(item.key))}
              disabled={disabled}
              className="inline-flex min-h-11 items-center text-xs font-semibold text-admin-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/30 xl:min-h-10"
            >
              + Thêm ghi chú
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => removeIngredient(index)}
          disabled={disabled}
          title="Xóa nguyên liệu"
          className="group/delete absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-admin-control text-admin-text-muted transition-colors hover:bg-admin-status-error/10 hover:text-admin-status-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-status-error/35 disabled:cursor-not-allowed disabled:opacity-45 xl:static xl:col-start-6 xl:justify-self-end"
          aria-label={`Xóa nguyên liệu ${index + 1}`}
        >
          <Trash2 size={16} aria-hidden="true" />
          <span role="tooltip" className="pointer-events-none absolute right-0 top-full z-admin-popover mt-1 hidden w-max rounded-admin-control bg-admin-text-primary px-2 py-1 text-xs font-medium text-admin-text-inverse shadow-admin-popover group-hover/delete:block group-focus/delete:block">Xóa nguyên liệu</span>
        </button>
      </div>
    );
  });

  const inventoryRows = inventoryMaterials.map((row, index) => {
    const selectedItem = inventoryCatalog.find((item) => item.id === row.inventoryItemId)
      ?? inventoryCatalog.find((item) => item.stockUnits.some((unit) => unit.id === row.stockUnitId));
    const units = selectedItem?.stockUnits.filter((unit) => unit.isActive || unit.id === row.stockUnitId) ?? [];
    const selectedUnit = units.find((unit) => unit.id === row.stockUnitId);
    const usedByOtherRows = new Set(inventoryMaterials.filter((item) => item.key !== row.key).map((item) => item.stockUnitId));
    const required = Number(row.quantity) * Math.max(0, productQuantity);
    const orderRequired = row.stockUnitId
      ? orderRequiredQuantityByStockUnit[row.stockUnitId] ?? required
      : required;
    const stockAfter = (selectedUnit?.quantity ?? 0) - (Number.isFinite(orderRequired) ? orderRequired : 0);
    const isInactive = Boolean(selectedItem && (!selectedItem.isActive || !selectedUnit?.isActive));
    const isShort = Boolean(selectedUnit && stockAfter < 0);
    return (
      <div
        key={row.key}
        className={`relative grid min-w-0 grid-cols-2 gap-3 border-l-[3px] border-admin-status-success/70 bg-admin-status-success/[0.055] px-3 py-3 ${desktopGrid} xl:items-start`}
        role="row"
        aria-label={`Vật tư kho ${index + 1}`}
      >
        <div className="col-span-2 min-w-0 pr-12 xl:col-span-1 xl:col-start-1 xl:pr-0" role="cell">
          <label className="mb-1 block text-xs font-medium text-admin-text-secondary xl:sr-only">Thành phần</label>
          <div className="flex min-w-0 items-center gap-2">
            <TypeIcon kind="inventory" />
            <select
              value={selectedItem?.id ?? ''}
              onChange={(event) => selectInventoryItem(row, event.target.value)}
              className={inputClass}
              disabled={disabled}
              aria-label={`Vật tư kho ${index + 1}`}
            >
              <option value="">Chọn vật tư kho</option>
              {inventoryCatalog
                .filter((item) => item.isActive || item.id === selectedItem?.id)
                .map((item) => (
                  <option key={item.id} value={item.id} disabled={!item.isActive && item.id !== selectedItem?.id}>
                    {item.code} · {item.name}{item.isActive ? '' : ' · đã tắt'}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div className={`${selectedItem?.usesSizes ? 'col-span-2' : 'hidden xl:block'} min-w-0 xl:col-span-1 xl:col-start-2`} role="cell">
          {selectedItem?.usesSizes ? (
            <label>
              <span className="mb-1 block text-xs font-medium text-admin-text-secondary xl:sr-only">Quy cách hoặc size</span>
              <select
                value={row.stockUnitId}
                onChange={(event) => updateInventoryMaterial(row.key, { stockUnitId: event.target.value })}
                className={inputClass}
                disabled={disabled}
                aria-label={`Size vật tư kho ${index + 1}`}
              >
                <option value="">Chọn size</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id} disabled={usedByOtherRows.has(unit.id) || (!unit.isActive && unit.id !== row.stockUnitId)}>
                    {unit.sizeName || 'Không size'}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
        <label className="min-w-0 xl:col-start-3" role="cell">
          <span className="mb-1 block text-xs font-medium text-admin-text-secondary xl:sr-only">Định mức cho một sản phẩm</span>
          <div className="relative">
            <input
              id={`order-line-inventory-quantity-${lineIndex}-${index}`}
              type="number"
              min="0.000001"
              step="0.000001"
              inputMode="decimal"
              value={row.quantity}
              onChange={(event) => updateInventoryMaterial(row.key, { quantity: event.target.value })}
              className={`${inputClass} pr-12 text-right tabular-nums`}
              disabled={disabled}
              aria-label={`Định mức vật tư kho ${index + 1} cho một sản phẩm`}
            />
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[11px] text-admin-text-muted">{stockUnitLabel(selectedUnit)}</span>
          </div>
        </label>
        <div className="min-w-0 self-end xl:col-start-4 xl:self-auto xl:pt-1" role="cell">
          <span className="mb-1 block text-xs font-medium text-admin-text-secondary xl:sr-only">Tổng cho đơn</span>
          <TotalValue perProduct={Number(row.quantity)} productQuantity={productQuantity} unit={stockUnitLabel(selectedUnit)} />
        </div>
        <div className="col-span-2 min-w-0 text-xs leading-5 xl:col-span-1 xl:col-start-5 xl:pt-1" role="cell">
          <span className="mb-1 block font-medium text-admin-text-secondary xl:sr-only">Tồn kho</span>
          {isInactive ? (
            <span className="font-medium text-admin-status-warning">Vật tư hoặc size đã tắt; tham chiếu cũ vẫn được giữ.</span>
          ) : selectedUnit ? (
            <span className={isShort ? 'font-semibold text-admin-status-error' : 'text-admin-text-secondary'}>
              Còn {formatDecimalQuantity(selectedUnit.quantity)} {stockUnitLabel(selectedUnit)} · Sau đơn còn {formatDecimalQuantity(stockAfter)} {stockUnitLabel(selectedUnit)}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => { setSuccessMessage(null); onInventoryMaterialsChange(inventoryMaterials.filter((item) => item.key !== row.key)); }}
          disabled={disabled}
          title="Xóa vật tư kho"
          className="group/delete absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-admin-control text-admin-text-muted transition-colors hover:bg-admin-status-error/10 hover:text-admin-status-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-status-error/35 disabled:cursor-not-allowed disabled:opacity-45 xl:static xl:col-start-6 xl:justify-self-end"
          aria-label={`Xóa vật tư kho ${index + 1}`}
        >
          <Trash2 size={16} aria-hidden="true" />
          <span role="tooltip" className="pointer-events-none absolute right-0 top-full z-admin-popover mt-1 hidden w-max rounded-admin-control bg-admin-text-primary px-2 py-1 text-xs font-medium text-admin-text-inverse shadow-admin-popover group-hover/delete:block group-focus/delete:block">Xóa vật tư kho</span>
        </button>
      </div>
    );
  });

  return (
    <section className="border-b border-admin-border last:border-b-0" aria-labelledby={`${sectionId}-title`}>
      <header className="flex flex-col gap-3 bg-admin-muted/25 px-3 py-3 sm:flex-row sm:items-start sm:justify-between">
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/30"
          aria-expanded={expanded}
          aria-controls={`${sectionId}-content`}
          aria-label={`${expanded ? 'Thu gọn' : 'Mở'} thành phần của sản phẩm ${lineIndex + 1}: ${productName}`}
        >
          <span className="flex items-start gap-2">
            {expanded ? <ChevronUp size={17} className="mt-0.5 shrink-0 text-admin-text-muted" aria-hidden="true" /> : <ChevronDown size={17} className="mt-0.5 shrink-0 text-admin-text-muted" aria-hidden="true" />}
            <span className="min-w-0">
              <span id={`${sectionId}-title`} className="block truncate text-sm font-semibold text-admin-text-primary">{lineLabel}</span>
              <span className="mt-1 block text-xs leading-5 text-admin-text-secondary">
                Số lượng: <strong className="font-semibold tabular-nums text-admin-text-primary">{formatDecimalQuantity(productQuantity)}</strong>
                {' · '}{ingredients.length} nguyên liệu{' · '}{inventoryMaterials.length} vật tư kho
              </span>
            </span>
          </span>
        </button>
        <div className="flex flex-wrap items-center gap-1 sm:justify-end">
          <button
            type="button"
            onClick={() => { setApplyError(null); setConfirmOpen(true); }}
            disabled={disabled || !canApplyDefaults || applying}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-admin-control px-2.5 text-xs font-semibold text-admin-text-secondary transition-colors hover:bg-admin-muted hover:text-admin-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/30 disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-10"
            title={canApplyDefaults ? 'Ghi đè thành phần bằng định mức của sản phẩm này' : 'Sản phẩm ngoài danh mục không có định mức'}
          >
            {applying ? <LoaderCircle size={14} className="animate-spin" aria-hidden="true" /> : <RotateCcw size={14} aria-hidden="true" />}
            Áp dụng định mức
          </button>
          <button
            type="button"
            onClick={() => { setExpanded(true); setAddMenuOpen((current) => !current); resetComposer(); }}
            disabled={disabled}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-admin-control px-2.5 text-xs font-semibold text-admin-primary transition-colors hover:bg-admin-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/30 disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-10"
            aria-expanded={addMenuOpen}
          >
            <Plus size={14} aria-hidden="true" /> Thêm thành phần
          </button>
        </div>
      </header>

      {expanded ? (
        <div id={`${sectionId}-content`}>
          {addMenuOpen ? (
            <div className="grid gap-2 border-t border-admin-border bg-admin-card px-3 py-3 sm:grid-cols-2" aria-label="Chọn loại thành phần">
              <button
                type="button"
                onClick={() => beginAdd('ingredient')}
                className="flex min-h-14 items-center gap-3 rounded-admin-control border border-admin-accent/35 bg-admin-accent-light/45 px-3 text-left transition-colors hover:bg-admin-accent-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/30 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Leaf size={18} className="shrink-0 text-admin-accent" aria-hidden="true" />
                <span><strong className="block text-sm text-admin-text-primary">Thêm nguyên liệu</strong><span className="text-xs text-admin-text-secondary">Không trừ tồn kho</span></span>
              </button>
              <button
                type="button"
                onClick={() => beginAdd('inventory')}
                disabled={inventoryLoading}
                className="flex min-h-14 items-center gap-3 rounded-admin-control border border-admin-status-success/25 bg-admin-status-success/[0.055] px-3 text-left transition-colors hover:bg-admin-status-success/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/30 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <PackageOpen size={18} className="shrink-0 text-admin-status-success" aria-hidden="true" />
                <span><strong className="block text-sm text-admin-text-primary">Thêm vật tư kho</strong><span className="text-xs text-admin-text-secondary">Có trừ tồn kho</span></span>
              </button>
            </div>
          ) : null}

          {pendingKind ? (
            <div className={`border-t border-admin-border px-3 py-3 ${pendingKind === 'ingredient' ? 'bg-admin-accent-light/45' : 'bg-admin-status-success/[0.055]'}`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                {pendingKind === 'ingredient' ? (
                  <label className="min-w-0 flex-1">
                    <span className="mb-1 block text-xs font-medium text-admin-text-secondary">Nguyên liệu</span>
                    <select ref={pendingSelectRef} value={pendingIngredientId} onChange={(event) => setPendingIngredientId(event.target.value)} className={inputClass} aria-label="Chọn nguyên liệu để thêm">
                      <option value="">Chọn nguyên liệu</option>
                      {availableIngredients.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}
                    </select>
                  </label>
                ) : (
                  <>
                    <label className="min-w-0 flex-1">
                      <span className="mb-1 block text-xs font-medium text-admin-text-secondary">Vật tư kho</span>
                      <select ref={pendingSelectRef} value={pendingInventoryItemId} onChange={(event) => selectPendingInventoryItem(event.target.value)} className={inputClass} aria-label="Chọn vật tư kho để thêm">
                        <option value="">Chọn vật tư kho</option>
                        {availableInventoryItems.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}
                      </select>
                    </label>
                    {pendingInventoryItem?.usesSizes ? (
                      <label className="min-w-0 sm:w-40">
                        <span className="mb-1 block text-xs font-medium text-admin-text-secondary">Size</span>
                        <select value={pendingStockUnitId} onChange={(event) => setPendingStockUnitId(event.target.value)} className={inputClass}>
                          <option value="">Chọn size</option>
                          {pendingUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.sizeName || 'Không size'}</option>)}
                        </select>
                      </label>
                    ) : null}
                  </>
                )}
                <div className="flex gap-1 sm:justify-end">
                  <button
                    type="button"
                    onClick={resetComposer}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-admin-control text-admin-text-secondary hover:bg-admin-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/30"
                    aria-label="Hủy thêm thành phần"
                    title="Hủy"
                  ><X size={17} aria-hidden="true" /></button>
                  <button
                    type="button"
                    onClick={pendingKind === 'ingredient' ? confirmIngredient : confirmInventoryMaterial}
                    disabled={pendingKind === 'ingredient' ? !pendingIngredientId : !pendingStockUnitId}
                    className="min-h-11 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/35 disabled:cursor-not-allowed disabled:opacity-45"
                  >Thêm</button>
                </div>
              </div>
              {(pendingKind === 'ingredient' ? availableIngredients.length === 0 : availableInventoryItems.length === 0) ? (
                <p className="mt-2 text-xs text-admin-text-muted" role="status">Không còn thành phần phù hợp để thêm vào sản phẩm này.</p>
              ) : null}
            </div>
          ) : null}

          <div role="table" aria-label={`Thành phần của ${lineLabel}`}>
            <div className={`hidden gap-3 border-y border-admin-border bg-admin-muted/45 px-3 py-2 text-[11px] font-semibold text-admin-text-secondary ${desktopGrid} xl:grid`} role="row">
              <span role="columnheader">Thành phần</span>
              <span role="columnheader">Quy cách/Size</span>
              <span role="columnheader" className="text-right">Định mức/SP</span>
              <span role="columnheader">Tổng cho đơn</span>
              <span role="columnheader">Ghi chú / tồn kho</span>
              <span role="columnheader" className="sr-only">Thao tác</span>
            </div>
            {ingredients.length === 0 && inventoryMaterials.length === 0 ? (
              <div className="px-4 py-7 text-center">
                <Boxes className="mx-auto text-admin-text-muted" size={22} aria-hidden="true" />
                <p className="mt-2 text-sm font-medium text-admin-text-secondary">Sản phẩm chưa có thành phần.</p>
                <p className="mt-1 text-xs text-admin-text-muted">Dùng “Thêm thành phần” hoặc áp dụng định mức đã thiết lập.</p>
              </div>
            ) : (
              <div className="divide-y divide-admin-border/70">{ingredientRows}{inventoryRows}</div>
            )}
          </div>
          {successMessage ? <p className="border-t border-admin-status-success/20 bg-admin-status-success/[0.055] px-3 py-2 text-xs font-medium text-admin-status-success" role="status" aria-live="polite">{successMessage}</p> : null}
        </div>
      ) : null}

      <SettingsDialog
        open={confirmOpen}
        title={`Ghi đè thành phần của “${productName}”?`}
        onRequestClose={() => { if (!applying) setConfirmOpen(false); }}
        footer={(
          <>
            <button type="button" onClick={() => setConfirmOpen(false)} disabled={applying} className="min-h-11 rounded-admin-control border border-admin-border bg-admin-card px-4 text-sm font-semibold text-admin-text-primary hover:bg-admin-muted disabled:opacity-50">Hủy</button>
            <button type="button" data-autofocus onClick={() => void applyDefaults()} disabled={applying} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-admin-control bg-admin-status-warning px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
              {applying ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : null}
              {applying ? 'Đang áp dụng...' : 'Ghi đè theo định mức'}
            </button>
          </>
        )}
      >
        <div className="space-y-3">
          <p className="text-sm leading-6 text-admin-text-secondary">
            Toàn bộ nguyên liệu và vật tư hiện tại của sản phẩm này sẽ được thay thế bằng định mức đã thiết lập. Thành phần của các sản phẩm khác không bị ảnh hưởng.
          </p>
          {applyError ? <p className="rounded-admin-control border border-admin-status-error/25 bg-admin-status-error/5 px-3 py-2 text-sm text-admin-status-error" role="alert">{applyError}</p> : null}
        </div>
      </SettingsDialog>
    </section>
  );
};
