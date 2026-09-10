import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, History, PackageMinus, PackagePlus, Pencil, Plus, Scale, Search, Trash2 } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Permission } from '@/features/auth/permissions';
import { expenseCategoriesApi } from '@/features/expenses/api/expensesApi';
import type { ExpenseCategory } from '@/features/expenses/types/expense.types';
import { SettingsDialog } from '@/features/settings/components/SettingsDialog';
import { SettingsShell } from '@/features/settings/components/SettingsShell';
import { PageHeader } from '@/shared/components/PageHeader';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { formatVndInput, parseVndInput } from '@/shared/utils/displayFormatters';
import { measurementUnitsApi } from '../api/ingredientsApi';
import { inventoryApi } from '../api/inventoryApi';
import { formatDecimalQuantity, IngredientStatus } from '../components/IngredientShell';
import type { MeasurementUnitDto } from '../types/ingredient.types';
import {
  InventoryStockStatus,
  StockTransactionType,
  type InventoryItem,
  type InventoryStockUnit,
  type PagedInventory,
  type SaveInventoryStockUnit,
  type StockTransaction,
} from '../types/inventory.types';

const PAGE_SIZE = 20;
const inputClass = 'h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 text-sm text-admin-text-primary outline-none focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/15 disabled:bg-admin-muted';
const emptyResult: PagedInventory = { items: [], totalCount: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0, hasNext: false, hasPrevious: false };
const today = () => new Date().toISOString().slice(0, 10);
let rowKey = 0;

type StockUnitDraft = SaveInventoryStockUnit & { key: string; thresholdText: string };
type ItemDraft = { id?: string; code: string; name: string; measurementUnitId: number; note: string; isActive: boolean; usesSizes: boolean; stockUnits: StockUnitDraft[] };
type ReceiptLine = { key: string; inventoryItemId: string; stockUnitId: string; quantityText: string };
type MovementMode = 'issue' | 'adjustment';

const newStockUnit = (sizeName = ''): StockUnitDraft => ({ key: `stock-${++rowKey}`, sizeName, lowStockThreshold: 0, thresholdText: '0', isActive: true });
const emptyItem = (measurementUnitId = 0): ItemDraft => ({ code: '', name: '', measurementUnitId, note: '', isActive: true, usesSizes: false, stockUnits: [newStockUnit()] });
const newReceiptLine = (): ReceiptLine => ({ key: `receipt-${++rowKey}`, inventoryItemId: '', stockUnitId: '', quantityText: '' });

const statusMeta = {
  [InventoryStockStatus.Normal]: { label: 'Bình thường', className: 'bg-green-50 text-admin-status-success' },
  [InventoryStockStatus.Low]: { label: 'Tồn thấp', className: 'bg-amber-50 text-admin-status-warning' },
  [InventoryStockStatus.OutOfStock]: { label: 'Hết hàng', className: 'bg-red-50 text-admin-status-error' },
};
const transactionLabel = {
  [StockTransactionType.Receipt]: 'Nhập kho',
  [StockTransactionType.OrderUsage]: 'Dùng cho đơn',
  [StockTransactionType.OrderReturn]: 'Hoàn từ đơn',
  [StockTransactionType.ManualIssue]: 'Xuất kho',
  [StockTransactionType.Adjustment]: 'Điều chỉnh tồn',
};

type InventoryPageMode = 'stock' | 'receiving' | 'transactions' | 'catalog';

export const InventoryPage: React.FC<{ mode?: InventoryPageMode; embedded?: boolean }> = ({
  mode = 'stock',
  embedded = false,
}) => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('inventory.manage');
  const canCreateExpense = hasPermission(Permission.ExpensesManage);
  const [result, setResult] = useState<PagedInventory>(emptyResult);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [units, setUnits] = useState<MeasurementUnitDto[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<InventoryStockStatus | ''>('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [itemOpen, setItemOpen] = useState(false);
  const [itemDraft, setItemDraft] = useState<ItemDraft>(emptyItem());
  const [itemBusy, setItemBusy] = useState(false);
  const [itemError, setItemError] = useState('');

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptDate, setReceiptDate] = useState(today);
  const [receiptNote, setReceiptNote] = useState('');
  const [receiptRows, setReceiptRows] = useState<ReceiptLine[]>([newReceiptLine()]);
  const [invoice, setInvoice] = useState<File | null>(null);
  const [createExpense, setCreateExpense] = useState(false);
  const [expenseCategoryId, setExpenseCategoryId] = useState('');
  const [expenseAmountText, setExpenseAmountText] = useState('');
  const [receiptBusy, setReceiptBusy] = useState(false);
  const [receiptError, setReceiptError] = useState('');

  const [movementMode, setMovementMode] = useState<MovementMode>('issue');
  const [movementUnit, setMovementUnit] = useState<InventoryStockUnit | null>(null);
  const [movementQuantity, setMovementQuantity] = useState('');
  const [movementNote, setMovementNote] = useState('');
  const [movementBusy, setMovementBusy] = useState(false);
  const [movementError, setMovementError] = useState('');

  const [ledgerUnit, setLedgerUnit] = useState<InventoryStockUnit | null>(null);
  const [ledger, setLedger] = useState<StockTransaction[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [stock, inventoryItems, measurementUnits, expenseCategories] = await Promise.all([
        inventoryApi.list({ search, status: status || undefined, includeInactive, page, pageSize: PAGE_SIZE }),
        inventoryApi.listItems(true),
        measurementUnitsApi.listAll({ includeInactive: true }),
        canCreateExpense ? expenseCategoriesApi.list(false) : Promise.resolve([]),
      ]);
      setResult(stock);
      setItems(inventoryItems);
      setUnits(measurementUnits);
      setCategories(expenseCategories);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [canCreateExpense, includeInactive, page, search, status]);

  useEffect(() => { void load(); }, [load]);

  const activeItems = useMemo(() => items.filter((item) => item.isActive && item.stockUnits.some((unit) => unit.isActive)), [items]);

  const openCreateItem = () => {
    setItemDraft(emptyItem(units.find((unit) => unit.isActive)?.id ?? 0));
    setItemError('');
    setItemOpen(true);
  };

  const openEditItem = (item: InventoryItem) => {
    setItemDraft({
      id: item.id,
      code: item.code,
      name: item.name,
      measurementUnitId: item.measurementUnitId,
      note: item.note ?? '',
      isActive: item.isActive,
      usesSizes: item.usesSizes,
      stockUnits: item.stockUnits.map((unit) => ({ key: unit.id, id: unit.id, sizeName: unit.sizeName ?? '', lowStockThreshold: unit.lowStockThreshold, thresholdText: String(unit.lowStockThreshold), isActive: unit.isActive })),
    });
    setItemError('');
    setItemOpen(true);
  };

  const setUsesSizes = (usesSizes: boolean) => setItemDraft((current) => ({
    ...current,
    usesSizes,
    stockUnits: usesSizes
      ? current.stockUnits.map((unit) => ({ ...unit }))
      : [{ ...current.stockUnits[0], sizeName: '' }],
  }));

  const saveItem = async () => {
    const normalizedSizes = itemDraft.stockUnits.map((unit) => (unit.sizeName ?? '').trim().toLocaleLowerCase('vi'));
    if (!itemDraft.code.trim() || !itemDraft.name.trim() || !itemDraft.measurementUnitId) { setItemError('Mã, tên và đơn vị tính là bắt buộc.'); return; }
    if (itemDraft.usesSizes && normalizedSizes.some((size) => !size)) { setItemError('Mỗi size phải có tên.'); return; }
    if (!itemDraft.usesSizes && itemDraft.stockUnits.length !== 1) { setItemError('Hàng không dùng size phải có đúng một đơn vị tồn.'); return; }
    if (new Set(normalizedSizes).size !== normalizedSizes.length) { setItemError('Tên size không được trùng nhau.'); return; }
    if (itemDraft.stockUnits.some((unit) => unit.thresholdText.trim() === '' || !Number.isFinite(Number(unit.thresholdText)) || Number(unit.thresholdText) < 0)) { setItemError('Ngưỡng tồn phải là số không âm.'); return; }
    const payload = {
      code: itemDraft.code.trim(), name: itemDraft.name.trim(), measurementUnitId: itemDraft.measurementUnitId,
      note: itemDraft.note.trim() || null, isActive: itemDraft.isActive,
      stockUnits: itemDraft.stockUnits.map((unit) => ({ id: unit.id, sizeName: itemDraft.usesSizes ? unit.sizeName?.trim() || null : null, lowStockThreshold: Number(unit.thresholdText), isActive: unit.isActive })),
    };
    setItemBusy(true);
    setItemError('');
    try {
      if (itemDraft.id) await inventoryApi.updateItem(itemDraft.id, payload);
      else await inventoryApi.createItem(payload);
      setItemOpen(false);
      setMessage(`Đã ${itemDraft.id ? 'cập nhật' : 'tạo'} hàng tồn ${payload.name}.`);
      await load();
    } catch (requestError) {
      setItemError(getApiErrorMessage(requestError));
    } finally {
      setItemBusy(false);
    }
  };

  const selectReceiptItem = (key: string, inventoryItemId: string) => {
    const item = items.find((candidate) => candidate.id === inventoryItemId);
    const activeUnits = item?.stockUnits.filter((unit) => unit.isActive) ?? [];
    const stockUnitId = !item?.usesSizes && activeUnits.length === 1 ? activeUnits[0].id : '';
    setReceiptRows((rows) => rows.map((row) => row.key === key ? { ...row, inventoryItemId, stockUnitId } : row));
  };

  const openReceipt = () => {
    setReceiptDate(today()); setReceiptNote(''); setInvoice(null); setCreateExpense(false);
    setExpenseCategoryId(''); setExpenseAmountText(''); setReceiptRows([newReceiptLine()]); setReceiptError(''); setReceiptOpen(true);
  };

  const saveReceipt = async () => {
    const receiptItems = receiptRows.map((row) => ({ stockUnitId: row.stockUnitId, quantity: Number(row.quantityText) }));
    if (!receiptDate || receiptRows.some((row) => !row.inventoryItemId) || receiptItems.some((item) => !item.stockUnitId || !Number.isFinite(item.quantity) || item.quantity <= 0)) { setReceiptError('Chọn hàng tồn, size khi có, và nhập số lượng dương.'); return; }
    if (new Set(receiptItems.map((item) => item.stockUnitId)).size !== receiptItems.length) { setReceiptError('Một hàng tồn/size chỉ được xuất hiện một lần trong phiếu.'); return; }
    const expenseAmount = parseVndInput(expenseAmountText);
    if (createExpense && (!expenseCategoryId || !expenseAmount || expenseAmount <= 0)) { setReceiptError('Chọn danh mục và nhập số tiền chi phí lớn hơn 0.'); return; }
    setReceiptBusy(true); setReceiptError('');
    try {
      const receipt = await inventoryApi.createReceipt({ clientRequestId: crypto.randomUUID(), receivedDate: receiptDate, note: receiptNote.trim() || null, items: receiptItems, invoice, createExpense, expenseCategoryId: createExpense ? expenseCategoryId : null, expenseAmount: createExpense ? expenseAmount : null });
      setReceiptOpen(false);
      setMessage(`Đã nhập kho theo phiếu ${receipt.receiptNumber}${receipt.expenseId ? ' và ghi nhận chi phí' : ''}.`);
      await load();
    } catch (requestError) { setReceiptError(getApiErrorMessage(requestError)); } finally { setReceiptBusy(false); }
  };

  const openLedger = async (unit: InventoryStockUnit) => {
    setLedgerUnit(unit); setLedger([]); setLedgerLoading(true); setLedgerError('');
    try { setLedger((await inventoryApi.transactions(unit.id, 1, 100)).items); }
    catch (requestError) { setLedgerError(getApiErrorMessage(requestError)); }
    finally { setLedgerLoading(false); }
  };

  const openMovement = (unit: InventoryStockUnit, nextMode: MovementMode) => {
    setMovementMode(nextMode);
    setMovementUnit(unit);
    setMovementQuantity(nextMode === 'adjustment' ? String(unit.quantity) : '');
    setMovementNote('');
    setMovementError('');
  };

  const saveMovement = async () => {
    if (!movementUnit) return;
    const quantity = Number(movementQuantity);
    if (!Number.isFinite(quantity) || (movementMode === 'issue' ? quantity <= 0 : quantity < 0)) {
      setMovementError(movementMode === 'issue' ? 'Số lượng xuất phải lớn hơn 0.' : 'Tồn đếm thực tế phải là số không âm.');
      return;
    }
    if (movementMode === 'issue' && quantity > movementUnit.quantity) {
      setMovementError(`Không thể xuất vượt tồn hiện tại ${formatDecimalQuantity(movementUnit.quantity)}.`);
      return;
    }
    if (movementMode === 'adjustment' && quantity === movementUnit.quantity) {
      setMovementError('Tồn đếm thực tế chưa thay đổi so với tồn hiện tại.');
      return;
    }
    setMovementBusy(true);
    setMovementError('');
    try {
      const common = { clientRequestId: crypto.randomUUID(), note: movementNote.trim() || null, rowVersion: movementUnit.rowVersion };
      if (movementMode === 'issue') await inventoryApi.createIssue(movementUnit.id, { ...common, quantity });
      else await inventoryApi.createAdjustment(movementUnit.id, { ...common, countedQuantity: quantity });
      setMovementUnit(null);
      setMessage(movementMode === 'issue'
        ? `Đã xuất ${formatDecimalQuantity(quantity)} ${movementUnit.unitSymbol || movementUnit.unitName} ${movementUnit.inventoryItemName}.`
        : `Đã điều chỉnh tồn ${movementUnit.inventoryItemName} về ${formatDecimalQuantity(quantity)}.`);
      await load();
    } catch (requestError) {
      setMovementError(getApiErrorMessage(requestError));
    } finally {
      setMovementBusy(false);
    }
  };

  const pageMeta = {
    stock: {
      title: 'Kho hàng',
      description: 'Theo dõi tồn kho, tạo phiếu nhập và mở lịch sử giao dịch của từng mặt hàng trong một màn hình.',
    },
    receiving: {
      title: 'Nhập kho',
      description: 'Ghi nhận phiếu nhập kho; tồn kho chỉ thay đổi sau khi giao dịch hoàn tất thành công.',
    },
    transactions: {
      title: 'Lịch sử giao dịch',
      description: 'Chọn một hàng tồn để xem các giao dịch nhập kho, sử dụng cho đơn và hoàn trả.',
    },
    catalog: {
      title: 'Danh mục hàng tồn kho',
      description: 'Quản lý mặt hàng, size, đơn vị tính và ngưỡng cảnh báo tồn kho.',
    },
  }[mode];
  const pageActions = canManage && mode === 'catalog' ? (
    <button type="button" onClick={openCreateItem} className="inline-flex min-h-11 items-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground"><Plus size={17} /> Thêm hàng tồn</button>
  ) : canManage && (mode === 'receiving' || mode === 'stock') ? (
    <button type="button" onClick={openReceipt} className="inline-flex min-h-11 items-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground"><PackagePlus size={17} /> Tạo phiếu nhập kho</button>
  ) : undefined;

  return <div className="min-w-0">
    {!embedded ? <PageHeader title={pageMeta.title} description={pageMeta.description} actions={pageActions} /> : pageActions ? <div className="mb-4 flex justify-end">{pageActions}</div> : null}
    <div className="space-y-4">
      {message ? <IngredientStatus kind="success">{message}</IngredientStatus> : null}
      {error ? <IngredientStatus kind="error">{error}</IngredientStatus> : null}
      <form onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchText.trim()); }} className="grid gap-3 rounded-admin-panel border border-admin-border bg-admin-surface p-4 md:grid-cols-[minmax(14rem,1fr)_12rem_auto_auto] md:items-end">
        <label><span className="mb-1.5 block text-sm font-medium">Tìm hàng tồn</span><span className="relative block"><Search size={17} className="absolute left-3 top-3 text-admin-text-muted" /><input value={searchText} onChange={(event) => setSearchText(event.target.value)} className={`${inputClass} pl-9`} placeholder="Mã, tên hoặc size" /></span></label>
        <label><span className="mb-1.5 block text-sm font-medium">Trạng thái tồn</span><select value={status} onChange={(event) => { setStatus(event.target.value ? Number(event.target.value) as InventoryStockStatus : ''); setPage(1); }} className={inputClass}><option value="">Tất cả</option><option value={InventoryStockStatus.Normal}>Bình thường</option><option value={InventoryStockStatus.Low}>Tồn thấp</option><option value={InventoryStockStatus.OutOfStock}>Hết hàng</option></select></label>
        <label className="flex h-11 items-center gap-2 rounded-admin-control border border-admin-border px-3 text-sm"><input type="checkbox" checked={includeInactive} onChange={(event) => { setIncludeInactive(event.target.checked); setPage(1); }} /> Hiện mục đã tắt</label>
        <button type="submit" className="h-11 rounded-admin-control bg-admin-primary px-5 text-sm font-semibold text-admin-primary-foreground">Tìm</button>
      </form>
      {loading ? <div className="flex min-h-64 items-center justify-center rounded-admin-panel border border-admin-border bg-admin-surface text-sm">Đang tải tồn kho...</div> : result.items.length === 0 ? <div className="rounded-admin-panel border border-dashed border-admin-border bg-admin-surface px-5 py-14 text-center"><p className="font-semibold">Chưa có hàng tồn phù hợp</p><p className="mt-1 text-sm text-admin-text-secondary">Tạo hàng tồn không size hoặc khai báo các size thực tế để bắt đầu.</p></div> : <section className="overflow-hidden rounded-admin-panel border border-admin-border bg-admin-surface shadow-admin-panel">
        <div className="hidden grid-cols-[minmax(13rem,1.4fr)_8rem_9rem_9rem_12rem] gap-4 border-b border-admin-border bg-admin-muted/45 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-admin-text-muted md:grid"><span>Hàng tồn</span><span>Size</span><span className="text-right">Tồn / Ngưỡng</span><span>Trạng thái</span><span className="text-right">Thao tác</span></div>
        <div className="divide-y divide-admin-border">{result.items.map((unit) => { const meta = statusMeta[unit.status]; return <article key={unit.id} className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(13rem,1.4fr)_8rem_9rem_9rem_12rem] md:items-center md:gap-4 md:px-5"><div><p className="font-medium">{unit.inventoryItemName}</p><p className="mt-0.5 font-mono text-xs text-admin-text-muted">{unit.inventoryItemCode} · {unit.unitSymbol || unit.unitName}{unit.isActive ? '' : ' · Đã tắt'}</p></div><p className="text-sm text-admin-text-secondary">{unit.sizeName || <span className="sr-only">Không phân loại theo size</span>}</p><p className="text-right text-sm tabular-nums"><strong>{formatDecimalQuantity(unit.quantity)}</strong><span className="text-admin-text-muted"> / {formatDecimalQuantity(unit.lowStockThreshold)}</span></p><span className={`w-fit rounded-md px-2 py-1 text-xs font-semibold ${meta.className}`}>{meta.label}</span><div className="flex justify-end gap-1">{canManage && unit.isActive ? <><button type="button" onClick={() => openMovement(unit, 'issue')} className="inline-flex h-11 w-11 items-center justify-center rounded-admin-control text-admin-status-error hover:bg-admin-status-error/10" aria-label={`Xuất kho ${unit.inventoryItemName}`}><PackageMinus size={17} /></button><button type="button" onClick={() => openMovement(unit, 'adjustment')} className="inline-flex h-11 w-11 items-center justify-center rounded-admin-control text-admin-primary hover:bg-admin-primary/10" aria-label={`Điều chỉnh tồn ${unit.inventoryItemName}`}><Scale size={17} /></button></> : null}<button type="button" onClick={() => void openLedger(unit)} className="inline-flex h-11 w-11 items-center justify-center rounded-admin-control hover:bg-admin-muted" aria-label={`Lịch sử ${unit.inventoryItemName}`}><History size={17} /></button>{canManage ? <button type="button" onClick={() => { const item = items.find((candidate) => candidate.id === unit.inventoryItemId); if (item) openEditItem(item); }} className="inline-flex h-11 w-11 items-center justify-center rounded-admin-control hover:bg-admin-muted" aria-label={`Sửa ${unit.inventoryItemName}`}><Pencil size={17} /></button> : null}</div></article>; })}</div>
      </section>}
      {result.totalPages > 1 ? <div className="flex justify-end gap-2"><button disabled={!result.hasPrevious} onClick={() => setPage((value) => value - 1)} className="h-10 rounded-admin-control border px-3 disabled:opacity-40">Trước</button><span className="py-2 text-sm">{result.page}/{result.totalPages}</span><button disabled={!result.hasNext} onClick={() => setPage((value) => value + 1)} className="h-10 rounded-admin-control border px-3 disabled:opacity-40">Sau</button></div> : null}
    </div>

    <SettingsDialog open={itemOpen} title={itemDraft.id ? 'Cập nhật hàng tồn' : 'Thêm hàng tồn'} description="Size là tùy chọn. Hàng không dùng size vẫn có tồn, ngưỡng và lịch sử riêng." width="wide" onRequestClose={() => !itemBusy && setItemOpen(false)} footer={<><button type="button" onClick={() => setItemOpen(false)} disabled={itemBusy} className="h-11 rounded-admin-control border px-4 font-semibold">Hủy</button><button type="button" onClick={() => void saveItem()} disabled={itemBusy} className="h-11 rounded-admin-control bg-admin-primary px-4 font-semibold text-admin-primary-foreground disabled:opacity-50">{itemBusy ? 'Đang lưu...' : 'Lưu hàng tồn'}</button></>}>
      <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><label><span className="mb-1 block text-sm font-medium">Mã *</span><input value={itemDraft.code} onChange={(event) => setItemDraft((draft) => ({ ...draft, code: event.target.value }))} className={inputClass} /></label><label><span className="mb-1 block text-sm font-medium">Tên *</span><input value={itemDraft.name} onChange={(event) => setItemDraft((draft) => ({ ...draft, name: event.target.value }))} className={inputClass} /></label><label><span className="mb-1 block text-sm font-medium">Đơn vị tính *</span><select value={itemDraft.measurementUnitId} onChange={(event) => setItemDraft((draft) => ({ ...draft, measurementUnitId: Number(event.target.value) }))} className={inputClass}><option value={0}>Chọn đơn vị</option>{units.map((unit) => <option key={unit.id} value={unit.id} disabled={!unit.isActive && unit.id !== itemDraft.measurementUnitId}>{unit.code} · {unit.name}</option>)}</select></label><label className="flex h-11 items-center gap-2 self-end rounded-admin-control border px-3 text-sm"><input type="checkbox" checked={itemDraft.isActive} onChange={(event) => setItemDraft((draft) => ({ ...draft, isActive: event.target.checked }))} /> Đang hoạt động</label></div>
        <label><span className="mb-1 block text-sm font-medium">Ghi chú</span><textarea value={itemDraft.note} onChange={(event) => setItemDraft((draft) => ({ ...draft, note: event.target.value }))} className="min-h-20 w-full rounded-admin-control border bg-admin-card px-3 py-2 text-sm" /></label>
        <label className="flex items-center gap-2 rounded-admin-control border border-admin-border p-3 text-sm font-semibold"><input type="checkbox" checked={itemDraft.usesSizes} onChange={(event) => setUsesSizes(event.target.checked)} /> Hàng này có phân loại size</label>
        {itemDraft.id ? <IngredientStatus kind="info">Không thể đổi cấu hình size hoặc đơn vị tính nếu hàng đã có tồn hay lịch sử. Hãy tắt size cũ và thêm size mới.</IngredientStatus> : null}
        <div className="space-y-3">{itemDraft.stockUnits.map((unit, index) => <div key={unit.key} className="grid gap-3 rounded-admin-control border p-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">{itemDraft.usesSizes ? <label><span className="mb-1 block text-xs font-medium">Size *</span><input value={unit.sizeName ?? ''} onChange={(event) => setItemDraft((draft) => ({ ...draft, stockUnits: draft.stockUnits.map((row) => row.key === unit.key ? { ...row, sizeName: event.target.value } : row) }))} className={inputClass} /></label> : <div><p className="text-xs font-medium">Tồn trực tiếp trên hàng</p><p className="mt-1 text-xs text-admin-text-muted">Không có trường size</p></div>}<label><span className="mb-1 block text-xs font-medium">Ngưỡng tồn thấp</span><input value={unit.thresholdText} onChange={(event) => setItemDraft((draft) => ({ ...draft, stockUnits: draft.stockUnits.map((row) => row.key === unit.key ? { ...row, thresholdText: event.target.value } : row) }))} className={inputClass} inputMode="decimal" /></label><label className="flex h-11 items-center gap-2 px-2 text-sm"><input type="checkbox" checked={unit.isActive} onChange={(event) => setItemDraft((draft) => ({ ...draft, stockUnits: draft.stockUnits.map((row) => row.key === unit.key ? { ...row, isActive: event.target.checked } : row) }))} /> Hoạt động</label>{itemDraft.usesSizes ? <button type="button" disabled={itemDraft.stockUnits.length === 1} onClick={() => setItemDraft((draft) => ({ ...draft, stockUnits: draft.stockUnits.filter((row) => row.key !== unit.key) }))} className="inline-flex h-11 w-11 items-center justify-center text-admin-status-error disabled:opacity-30" aria-label={`Xóa size ${index + 1}`}><Trash2 size={17} /></button> : <span />}</div>)}</div>
        {itemDraft.usesSizes ? <button type="button" onClick={() => setItemDraft((draft) => ({ ...draft, stockUnits: [...draft.stockUnits, newStockUnit()] }))} className="inline-flex h-10 items-center gap-2 rounded-admin-control border px-3 text-sm font-semibold text-admin-primary"><Plus size={16} /> Thêm size</button> : null}
        {itemError ? <IngredientStatus kind="error">{itemError}</IngredientStatus> : null}
      </div>
    </SettingsDialog>

    <SettingsDialog open={receiptOpen} title="Nhập kho" description="Chọn hàng trước; trường size chỉ xuất hiện với hàng có phân loại size. Hóa đơn và chi phí là tùy chọn." width="wide" onRequestClose={() => !receiptBusy && setReceiptOpen(false)} footer={<><button type="button" onClick={() => setReceiptOpen(false)} disabled={receiptBusy} className="h-11 rounded-admin-control border px-4 font-semibold">Hủy</button><button type="button" onClick={() => void saveReceipt()} disabled={receiptBusy || activeItems.length === 0} className="h-11 rounded-admin-control bg-admin-primary px-4 font-semibold text-admin-primary-foreground disabled:opacity-50">{receiptBusy ? 'Đang nhập...' : 'Xác nhận nhập kho'}</button></>}>
      <div className="space-y-5">{activeItems.length === 0 ? <IngredientStatus kind="warning"><AlertTriangle className="mr-2 inline" size={16} />Chưa có hàng tồn đang hoạt động.</IngredientStatus> : null}<div className="grid gap-3 sm:grid-cols-2"><label><span className="mb-1 block text-sm font-medium">Ngày nhập *</span><input type="date" value={receiptDate} onChange={(event) => setReceiptDate(event.target.value)} className={inputClass} /></label><label><span className="mb-1 block text-sm font-medium">Hóa đơn (tùy chọn)</span><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf" onChange={(event) => setInvoice(event.target.files?.[0] ?? null)} className={`${inputClass} py-2`} /></label></div>
        <div className="space-y-3"><h3 className="text-sm font-semibold">Hàng nhập</h3>{receiptRows.map((row, index) => { const item = items.find((candidate) => candidate.id === row.inventoryItemId); const itemUnits = item?.stockUnits.filter((unit) => unit.isActive) ?? []; return <div key={row.key} className={`grid gap-3 rounded-admin-control border p-3 ${item?.usesSizes ? 'sm:grid-cols-[1fr_10rem_8rem_auto]' : 'sm:grid-cols-[1fr_8rem_auto]'} sm:items-end`}><label><span className="mb-1 block text-xs font-medium">Hàng tồn *</span><select value={row.inventoryItemId} onChange={(event) => selectReceiptItem(row.key, event.target.value)} className={inputClass}><option value="">Chọn hàng tồn</option>{activeItems.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.code} · {candidate.name}</option>)}</select></label>{item?.usesSizes ? <label><span className="mb-1 block text-xs font-medium">Size *</span><select value={row.stockUnitId} onChange={(event) => setReceiptRows((rows) => rows.map((candidate) => candidate.key === row.key ? { ...candidate, stockUnitId: event.target.value } : candidate))} className={inputClass}><option value="">Chọn size</option>{itemUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.sizeName}</option>)}</select></label> : null}<label><span className="mb-1 block text-xs font-medium">Số lượng *</span><input value={row.quantityText} onChange={(event) => setReceiptRows((rows) => rows.map((candidate) => candidate.key === row.key ? { ...candidate, quantityText: event.target.value } : candidate))} className={inputClass} inputMode="decimal" /></label><button type="button" disabled={receiptRows.length === 1} onClick={() => setReceiptRows((rows) => rows.filter((candidate) => candidate.key !== row.key))} className="inline-flex h-11 w-11 items-center justify-center text-admin-status-error disabled:opacity-30" aria-label={`Xóa dòng ${index + 1}`}><Trash2 size={17} /></button></div>; })}</div>
        <button type="button" onClick={() => setReceiptRows((rows) => [...rows, newReceiptLine()])} className="inline-flex h-10 items-center gap-2 rounded-admin-control border px-3 text-sm font-semibold text-admin-primary"><Plus size={16} /> Thêm dòng</button><label><span className="mb-1 block text-sm font-medium">Ghi chú</span><textarea value={receiptNote} onChange={(event) => setReceiptNote(event.target.value)} className="min-h-20 w-full rounded-admin-control border px-3 py-2 text-sm" /></label>
        {canCreateExpense ? <section className="rounded-admin-control border p-4"><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={createExpense} onChange={(event) => setCreateExpense(event.target.checked)} /> Ghi nhận vào Chi phí</label>{createExpense ? <div className="mt-3 grid gap-3 sm:grid-cols-2"><label><span className="mb-1 block text-xs font-medium">Danh mục chi phí *</span><select value={expenseCategoryId} onChange={(event) => setExpenseCategoryId(event.target.value)} className={inputClass}><option value="">Chọn danh mục</option>{categories.filter((category) => category.isActive).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label><span className="mb-1 block text-xs font-medium">Số tiền *</span><input value={formatVndInput(expenseAmountText)} onChange={(event) => setExpenseAmountText(event.target.value)} className={inputClass} inputMode="numeric" /></label></div> : null}</section> : null}{receiptError ? <IngredientStatus kind="error">{receiptError}</IngredientStatus> : null}
      </div>
    </SettingsDialog>

    <SettingsDialog
      open={Boolean(movementUnit)}
      title={movementMode === 'issue' ? 'Xuất kho thủ công' : 'Điều chỉnh tồn kho'}
      description={movementUnit ? `${movementUnit.inventoryItemCode} · ${movementUnit.inventoryItemName}${movementUnit.sizeName ? ` · Size ${movementUnit.sizeName}` : ''}` : undefined}
      onRequestClose={() => !movementBusy && setMovementUnit(null)}
      footer={<><button type="button" onClick={() => setMovementUnit(null)} disabled={movementBusy} className="h-11 rounded-admin-control border px-4 font-semibold">Hủy</button><button type="button" onClick={() => void saveMovement()} disabled={movementBusy} className={`h-11 rounded-admin-control px-4 font-semibold text-white disabled:opacity-50 ${movementMode === 'issue' ? 'bg-admin-status-error' : 'bg-admin-primary'}`}>{movementBusy ? 'Đang ghi nhận...' : movementMode === 'issue' ? 'Xác nhận xuất kho' : 'Lưu điều chỉnh'}</button></>}
    >
      {movementUnit ? <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 rounded-admin-control border border-admin-border bg-admin-muted/45 p-3 text-sm">
          <div><p className="text-xs text-admin-text-muted">Tồn hiện tại</p><p className="mt-1 font-semibold tabular-nums">{formatDecimalQuantity(movementUnit.quantity)} {movementUnit.unitSymbol || movementUnit.unitName}</p></div>
          <div><p className="text-xs text-admin-text-muted">Sau thao tác</p><p className="mt-1 font-semibold tabular-nums">{formatDecimalQuantity(movementMode === 'issue' ? Math.max(0, movementUnit.quantity - (Number(movementQuantity) || 0)) : Number(movementQuantity) || 0)} {movementUnit.unitSymbol || movementUnit.unitName}</p></div>
        </div>
        {movementMode === 'issue' ? <IngredientStatus kind="warning"><AlertTriangle className="mr-2 inline" size={16} />Thao tác này làm giảm tồn và được ghi vĩnh viễn vào lịch sử biến động.</IngredientStatus> : <IngredientStatus kind="info">Nhập số lượng đếm thực tế. Hệ thống sẽ tự ghi nhận phần chênh lệch tăng hoặc giảm.</IngredientStatus>}
        <label><span className="mb-1 block text-sm font-medium">{movementMode === 'issue' ? 'Số lượng xuất *' : 'Tồn đếm thực tế *'}</span><input autoFocus value={movementQuantity} onChange={(event) => setMovementQuantity(event.target.value)} className={inputClass} inputMode="decimal" /></label>
        <label><span className="mb-1 block text-sm font-medium">Lý do / ghi chú</span><textarea value={movementNote} onChange={(event) => setMovementNote(event.target.value)} className="min-h-20 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 py-2 text-sm" placeholder="Ví dụ: hư hỏng, sử dụng nội bộ, kiểm kê thực tế" /></label>
        {movementError ? <IngredientStatus kind="error">{movementError}</IngredientStatus> : null}
      </div> : null}
    </SettingsDialog>

    <SettingsDialog open={Boolean(ledgerUnit)} title={ledgerUnit ? `Lịch sử · ${ledgerUnit.inventoryItemName}` : 'Lịch sử tồn kho'} description={ledgerUnit ? `${ledgerUnit.sizeName ? `Size ${ledgerUnit.sizeName} · ` : ''}tồn hiện tại ${formatDecimalQuantity(ledgerUnit.quantity)}` : undefined} width="wide" onRequestClose={() => setLedgerUnit(null)}>
      {ledgerLoading ? <p className="py-10 text-center text-sm">Đang tải lịch sử...</p> : ledgerError ? <IngredientStatus kind="error">{ledgerError}</IngredientStatus> : ledger.length === 0 ? <p className="py-10 text-center text-sm text-admin-text-muted">Chưa có biến động tồn kho.</p> : <div className="divide-y rounded-admin-control border">{ledger.map((transaction) => <div key={transaction.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[9rem_1fr_8rem]"><div><p className="text-sm font-semibold">{transactionLabel[transaction.type]}</p><p className="text-xs text-admin-text-muted">{new Date(transaction.createdAt).toLocaleString('vi-VN')}</p></div><p className="text-sm">{transaction.receiptNumber ? `Phiếu ${transaction.receiptNumber}` : transaction.orderCode ? `Đơn ${transaction.orderCode}` : transaction.note}</p><p className={`text-right text-sm font-semibold ${transaction.quantityDelta > 0 ? 'text-admin-status-success' : 'text-admin-status-error'}`}>{transaction.quantityDelta > 0 ? '+' : ''}{formatDecimalQuantity(transaction.quantityDelta)} → {formatDecimalQuantity(transaction.balanceAfter)}</p></div>)}</div>}
    </SettingsDialog>
  </div>;
};

export const InventoryReceivingPage: React.FC = () => <InventoryPage mode="receiving" />;

export const InventoryTransactionsPage: React.FC = () => <InventoryPage mode="transactions" />;

export const InventoryCatalogPage: React.FC = () => (
  <SettingsShell
    title="Danh mục hàng tồn kho"
    description="Quản lý mặt hàng, size, đơn vị tính và ngưỡng cảnh báo đang dùng trong vận hành kho."
  >
    <InventoryPage mode="catalog" embedded />
  </SettingsShell>
);
