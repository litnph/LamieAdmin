import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Plus, RefreshCw, Search, Trash2, X } from '@/shared/icons/lucideAnimated';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ConfirmationPanel, SettingsDialog } from '@/features/settings/components/SettingsDialog';
import { SettingsShell } from '@/features/settings/components/SettingsShell';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { ingredientsApi, measurementUnitsApi } from '../api/ingredientsApi';
import { IngredientStatus } from '../components/IngredientShell';
import type {
  IngredientDto,
  IngredientListItemDto,
  MeasurementUnitDto,
  PagedResult,
  SaveIngredientConversionRequest,
  SaveIngredientRequest,
} from '../types/ingredient.types';

type ConversionDraft = Omit<SaveIngredientConversionRequest, 'factorToBase'> & { clientKey: string; factorToBase: string };
type IngredientDraft = Omit<SaveIngredientRequest, 'conversions'> & { conversions: ConversionDraft[] };

const PAGE_SIZE = 20;
const inputClass = 'h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 text-sm text-admin-text-primary outline-none transition-colors placeholder:text-admin-text-muted focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:bg-admin-muted';
const CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
const emptyPage: PagedResult<IngredientListItemDto> = {
  items: [], totalCount: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0, hasNext: false, hasPrevious: false,
};

let conversionKey = 0;
const newConversion = (unitId = 0, sortOrder = 0): ConversionDraft => ({
  clientKey: `new-conversion-${++conversionKey}`,
  code: '',
  name: '',
  unitId,
  factorToBase: '',
  sortOrder,
  isActive: true,
});

const emptyDraft = (baseUnitId = 0): IngredientDraft => ({
  code: '',
  name: '',
  baseUnitId,
  note: '',
  isActive: true,
  conversions: [],
});

const normalize = (value: string) => value.trim().toLocaleLowerCase('vi');

const isDecimalGreaterThanOne = (value: string): boolean => {
  const match = value.trim().match(/^(\d+)(?:\.(\d+))?$/);
  if (!match) return false;
  const whole = match[1].replace(/^0+(?=\d)/, '');
  const fraction = (match[2] ?? '').replace(/0+$/, '');
  if (whole.length > 1) return true;
  if (whole === '1') return fraction.length > 0;
  return false;
};

export const IngredientsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('ingredients.manage');
  const [result, setResult] = useState<PagedResult<IngredientListItemDto>>(emptyPage);
  const [units, setUnits] = useState<MeasurementUnitDto[]>([]);
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [success, setSuccess] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editing, setEditing] = useState<IngredientDto | null>(null);
  const [draft, setDraft] = useState<IngredientDraft>(emptyDraft);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<IngredientListItemDto | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const editRequest = useRef(0);

  const load = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      const [items, unitItems] = await Promise.all([
        ingredientsApi.list({ search, includeInactive, page, pageSize: PAGE_SIZE }),
        measurementUnitsApi.listAll({ includeInactive: true }),
      ]);
      setResult(items);
      setUnits(unitItems);
    } catch (error) {
      setPageError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [includeInactive, page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeUnits = useMemo(() => units.filter((unit) => unit.isActive), [units]);
  const selectedBaseUnit = units.find((unit) => unit.id === draft.baseUnitId);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchText.trim());
  };

  const openCreate = () => {
    const baseUnitId = activeUnits[0]?.id ?? 0;
    setEditing(null);
    setDraft(emptyDraft(baseUnitId));
    setFormError(activeUnits.length ? '' : 'Hãy tạo ít nhất một đơn vị tính đang hoạt động trước.');
    setEditorOpen(true);
  };

  const openEdit = async (item: IngredientListItemDto) => {
    const requestId = ++editRequest.current;
    setEditorOpen(true);
    setEditorLoading(true);
    setEditing(null);
    setFormError('');
    try {
      const detail = await ingredientsApi.getById(item.id);
      if (requestId !== editRequest.current) return;
      setEditing(detail);
      setDraft({
        code: detail.code,
        name: detail.name,
        baseUnitId: detail.baseUnit.id,
        note: detail.note ?? '',
        isActive: detail.isActive,
        conversions: detail.conversions.map((conversion) => ({
          id: conversion.id,
          clientKey: String(conversion.id),
          code: conversion.code,
          name: conversion.name,
          unitId: conversion.unit.id,
        factorToBase: String(conversion.factorToBase),
          sortOrder: conversion.sortOrder,
          isActive: conversion.isActive,
        })),
      });
    } catch (error) {
      if (requestId === editRequest.current) setFormError(getApiErrorMessage(error));
    } finally {
      if (requestId === editRequest.current) setEditorLoading(false);
    }
  };

  const closeEditor = () => {
    if (saving) return;
    editRequest.current += 1;
    setEditorOpen(false);
    setEditorLoading(false);
  };

  const updateConversion = (clientKey: string, patch: Partial<ConversionDraft>) => {
    setDraft((current) => ({
      ...current,
      conversions: current.conversions.map((conversion) => (
        conversion.clientKey === clientKey ? { ...conversion, ...patch } : conversion
      )),
    }));
  };

  const addConversion = () => {
    const availableUnit = activeUnits.find((unit) => unit.id !== draft.baseUnitId)?.id ?? 0;
    setDraft((current) => ({
      ...current,
      conversions: [...current.conversions, newConversion(availableUnit, current.conversions.length)],
    }));
  };

  const validate = (): string => {
    const code = draft.code.trim();
    const name = draft.name.trim();
    if (!code || !name || !draft.baseUnitId) return 'Mã, tên và đơn vị gốc là bắt buộc.';
    if (!CODE_PATTERN.test(code)) return 'Mã nguyên liệu phải bắt đầu bằng chữ hoặc số và chỉ gồm chữ không dấu, số, gạch ngang hoặc gạch dưới.';
    const knownDuplicate = result.items.find((item) => item.id !== editing?.id && (
      normalize(item.code) === normalize(code) || normalize(item.name) === normalize(name)
    ));
    if (knownDuplicate) return `Mã hoặc tên trùng với nguyên liệu “${knownDuplicate.name}”.`;

    const codes = new Set<string>();
    const names = new Set<string>();
    const factors = new Set<string>();
    for (let index = 0; index < draft.conversions.length; index += 1) {
      const conversion = draft.conversions[index];
      const position = index + 1;
      if (!conversion.code.trim() || !conversion.name.trim() || !conversion.unitId) return `Quy cách ${position}: mã, tên và đơn vị là bắt buộc.`;
      if (!/^[A-Za-z0-9._-]+$/.test(conversion.code.trim())) return `Quy cách ${position}: mã không đúng định dạng.`;
      if (conversion.unitId === draft.baseUnitId) return `Quy cách ${position}: đơn vị đóng gói phải khác đơn vị gốc.`;
      if (!isDecimalGreaterThanOne(conversion.factorToBase)) return `Quy cách ${position}: hệ số quy đổi phải là số thập phân lớn hơn 1.`;
      const normalizedCode = normalize(conversion.code);
      const normalizedName = normalize(conversion.name);
      const normalizedFactor = conversion.factorToBase.trim().replace(/^0+(?=\d)/, '').replace(/\.0+$/, '');
      if (codes.has(normalizedCode)) return `Quy cách ${position}: mã quy cách bị trùng.`;
      if (names.has(normalizedName)) return `Quy cách ${position}: tên quy cách bị trùng.`;
      if (factors.has(normalizedFactor)) return `Quy cách ${position}: hệ số quy đổi bị trùng.`;
      codes.add(normalizedCode);
      names.add(normalizedName);
      factors.add(normalizedFactor);
    }
    return '';
  };

  const save = async () => {
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setSaving(true);
    setFormError('');
    const payload: SaveIngredientRequest = {
      code: draft.code.trim(),
      name: draft.name.trim(),
      baseUnitId: draft.baseUnitId,
      note: draft.note?.trim() || null,
      isActive: draft.isActive,
      conversions: draft.conversions.map(({ clientKey: _clientKey, ...conversion }, index) => ({
        ...conversion,
        code: conversion.code.trim(),
        name: conversion.name.trim(),
        factorToBase: Number(conversion.factorToBase),
        sortOrder: index,
      })),
    };
    try {
      if (editing) {
        await ingredientsApi.update(editing.id, payload);
        setSuccess(`Đã cập nhật nguyên liệu ${payload.name}.`);
      } else {
        await ingredientsApi.create(payload);
        setSuccess(`Đã thêm nguyên liệu ${payload.name}.`);
      }
      setEditorOpen(false);
      await load();
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting || deleting.canDelete === false || (deleting.productCount ?? 0) + (deleting.snapshotCount ?? 0) + (deleting.inventoryUnitCount ?? 0) > 0) return;
    setDeleteBusy(true);
    try {
      await ingredientsApi.remove(deleting.id);
      setSuccess(`Đã xóa nguyên liệu ${deleting.name}.`);
      setDeleting(null);
      await load();
    } catch (error) {
      setPageError(getApiErrorMessage(error));
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <SettingsShell
      title="Danh mục nguyên liệu"
      description="Quản lý đơn vị gốc, quy cách đóng gói và hệ số quy đổi dùng trong công thức."
      actions={canManage ? (
        <button type="button" onClick={openCreate} className="btn-press inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover sm:w-auto">
          <Plus size={17} aria-hidden="true" /> Thêm nguyên liệu
        </button>
      ) : undefined}
    >
      <div className="space-y-4">
        {success ? <IngredientStatus kind="success">{success}</IngredientStatus> : null}
        {pageError ? (
          <IngredientStatus kind="error"><div className="flex flex-wrap items-center justify-between gap-3"><span>{pageError}</span><button type="button" onClick={() => void load()} className="inline-flex min-h-9 items-center gap-1.5 font-semibold underline underline-offset-2"><RefreshCw size={15} aria-hidden="true" /> Thử lại</button></div></IngredientStatus>
        ) : null}

        <form onSubmit={submitSearch} className="flex flex-col gap-3 rounded-admin-panel border border-admin-border bg-admin-surface p-4 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1">
            <span className="mb-1.5 block text-sm font-medium text-admin-text-primary">Tìm nguyên liệu</span>
            <span className="relative block">
              <Search size={17} className="pointer-events-none absolute left-3 top-3 text-admin-text-muted" aria-hidden="true" />
              <input value={searchText} onChange={(event) => setSearchText(event.target.value)} className={`${inputClass} pl-9`} placeholder="Mã hoặc tên nguyên liệu" />
            </span>
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-admin-control border border-admin-border px-3 text-sm text-admin-text-primary">
            <input type="checkbox" checked={includeInactive} onChange={(event) => { setIncludeInactive(event.target.checked); setPage(1); }} className="h-4 w-4 accent-admin-primary" /> Hiện mục đã tắt
          </label>
          <button type="submit" className="h-11 rounded-admin-control bg-admin-primary px-5 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover">Tìm kiếm</button>
        </form>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center rounded-admin-panel border border-admin-border bg-admin-surface text-sm text-admin-text-secondary" role="status">Đang tải nguyên liệu...</div>
        ) : result.items.length === 0 ? (
          <div className="rounded-admin-panel border border-dashed border-admin-border bg-admin-surface px-5 py-14 text-center"><p className="font-semibold text-admin-text-primary">Không tìm thấy nguyên liệu</p><p className="mt-1 text-sm text-admin-text-secondary">Thử đổi từ khóa hoặc thêm nguyên liệu mới.</p></div>
        ) : (
          <section className="overflow-hidden rounded-admin-panel border border-admin-border bg-admin-surface shadow-admin-panel" aria-label="Danh sách nguyên liệu">
            <div className="hidden grid-cols-[minmax(9rem,.8fr)_minmax(12rem,1.5fr)_minmax(8rem,.8fr)_7rem_9rem] gap-4 border-b border-admin-border bg-admin-muted/45 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-admin-text-muted md:grid"><span>Mã</span><span>Nguyên liệu</span><span>Đơn vị gốc</span><span>Quy cách</span><span className="text-right">Thao tác</span></div>
            <div className="divide-y divide-admin-border">
              {result.items.map((item) => {
                const isReferenced = item.canDelete === false || (item.productCount ?? 0) + (item.snapshotCount ?? 0) + (item.inventoryUnitCount ?? 0) > 0;
                return (
                  <article key={item.id} className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(9rem,.8fr)_minmax(12rem,1.5fr)_minmax(8rem,.8fr)_7rem_9rem] md:items-center md:gap-4 md:px-5">
                    <p className="font-mono text-sm font-semibold text-admin-text-primary">{item.code}</p>
                    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium text-admin-text-primary">{item.name}</h3><span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${item.isActive ? 'bg-admin-status-success/10 text-admin-status-success' : 'bg-admin-muted text-admin-text-muted'}`}>{item.isActive ? 'Hoạt động' : 'Đã tắt'}</span></div><p className="mt-1 line-clamp-2 text-xs text-admin-text-muted">{item.note || `${item.productCount ?? 0} công thức · ${item.snapshotCount ?? 0} bản chụp · ${item.inventoryUnitCount ?? 0} stock unit`}</p></div>
                    <p className="text-sm text-admin-text-secondary"><span className="md:hidden text-admin-text-muted">Đơn vị gốc: </span>{item.baseUnit.name}{item.baseUnit.symbol ? ` (${item.baseUnit.symbol})` : ''}</p>
                    <p className="text-sm tabular-nums text-admin-text-secondary"><span className="md:hidden text-admin-text-muted">Quy cách: </span>{item.conversions.length}</p>
                    {canManage ? (
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => void openEdit(item)} className="inline-flex h-11 w-11 items-center justify-center rounded-admin-control text-admin-text-secondary hover:bg-admin-muted hover:text-admin-primary" aria-label={`Sửa nguyên liệu ${item.name}`}><Pencil size={17} aria-hidden="true" /></button>
                        <button type="button" onClick={() => setDeleting(item)} disabled={isReferenced} title={isReferenced ? 'Nguyên liệu đã dùng trong công thức hoặc đơn hàng; hãy tắt thay vì xóa.' : undefined} className="inline-flex h-11 w-11 items-center justify-center rounded-admin-control text-admin-text-secondary hover:bg-admin-status-error/10 hover:text-admin-status-error disabled:cursor-not-allowed disabled:opacity-35" aria-label={`Xóa nguyên liệu ${item.name}`}><Trash2 size={17} aria-hidden="true" /></button>
                      </div>
                    ) : <span className="text-right text-xs text-admin-text-muted">Chỉ xem</span>}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {!loading && result.totalPages > 1 ? (
          <div className="flex flex-col gap-3 rounded-admin-control border border-admin-border bg-admin-surface px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between" aria-label="Phân trang nguyên liệu">
            <span className="text-admin-text-secondary">Trang {result.page}/{result.totalPages} · {result.totalCount} nguyên liệu</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={!result.hasPrevious} className="inline-flex h-11 items-center gap-1 rounded-admin-control border border-admin-border px-3 font-semibold text-admin-text-primary hover:bg-admin-muted disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={16} aria-hidden="true" /> Trước</button>
              <button type="button" onClick={() => setPage((current) => current + 1)} disabled={!result.hasNext} className="inline-flex h-11 items-center gap-1 rounded-admin-control border border-admin-border px-3 font-semibold text-admin-text-primary hover:bg-admin-muted disabled:cursor-not-allowed disabled:opacity-40">Sau <ChevronRight size={16} aria-hidden="true" /></button>
            </div>
          </div>
        ) : null}
      </div>

      <SettingsDialog
        open={editorOpen}
        title={editing ? `Cập nhật ${editing.name}` : 'Thêm nguyên liệu'}
        description="Hệ số quy đổi cho biết một quy cách chứa bao nhiêu đơn vị gốc."
        width="wide"
        onRequestClose={closeEditor}
        footer={!editorLoading ? (
          <>
            <button type="button" onClick={closeEditor} disabled={saving} className="h-11 rounded-admin-control border border-admin-border bg-admin-card px-4 text-sm font-semibold text-admin-text-primary hover:bg-admin-muted disabled:opacity-50">Hủy</button>
            <button type="button" onClick={() => void save()} disabled={saving || (!editing && activeUnits.length === 0)} className="h-11 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm nguyên liệu'}</button>
          </>
        ) : undefined}
      >
        {editorLoading ? (
          <div className="flex min-h-56 items-center justify-center text-sm text-admin-text-secondary" role="status">Đang tải chi tiết nguyên liệu...</div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="ingredient-code" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Mã nguyên liệu *</label><input id="ingredient-code" value={draft.code} onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value }))} className={inputClass} maxLength={60} data-autofocus /></div>
              <div><label htmlFor="ingredient-name" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Tên nguyên liệu *</label><input id="ingredient-name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className={inputClass} maxLength={160} /></div>
              <div><label htmlFor="ingredient-base-unit" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Đơn vị gốc *</label><select id="ingredient-base-unit" value={draft.baseUnitId} onChange={(event) => setDraft((current) => ({ ...current, baseUnitId: Number(event.target.value) }))} disabled={Boolean(editing && ((editing.productCount ?? 0) + (editing.snapshotCount ?? 0) + (editing.inventoryUnitCount ?? 0) > 0))} className={inputClass}><option value={0}>Chọn đơn vị</option>{units.map((unit) => <option key={unit.id} value={unit.id} disabled={!unit.isActive && unit.id !== draft.baseUnitId}>{unit.name}{unit.symbol ? ` (${unit.symbol})` : ''}{unit.isActive ? '' : ' — đã tắt'}</option>)}</select>{editing && ((editing.productCount ?? 0) + (editing.snapshotCount ?? 0) + (editing.inventoryUnitCount ?? 0) > 0) ? <p className="mt-1.5 text-xs leading-5 text-admin-text-muted">Không thể đổi đơn vị gốc sau khi nguyên liệu đã được dùng hoặc đã cấu hình kho.</p> : null}{selectedBaseUnit && !selectedBaseUnit.isActive ? <p className="mt-1.5 text-xs leading-5 text-amber-700">Đơn vị hiện tại đã tắt. Tham chiếu cũ được giữ lại, nhưng không thể chọn đơn vị này cho nguyên liệu mới.</p> : null}</div>
              <label className="mt-6 flex min-h-11 cursor-pointer items-center gap-3 rounded-admin-control border border-admin-border px-3 text-sm text-admin-text-primary"><input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))} className="h-4 w-4 accent-admin-primary" /> Đang hoạt động</label>
              <div className="sm:col-span-2"><label htmlFor="ingredient-note" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Ghi chú</label><textarea id="ingredient-note" value={draft.note ?? ''} onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))} className="min-h-20 w-full resize-y rounded-admin-control border border-admin-input-border bg-admin-card px-3 py-2.5 text-sm text-admin-text-primary outline-none focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/15" maxLength={500} /></div>
            </div>

            <section aria-labelledby="conversion-heading">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div><h3 id="conversion-heading" className="font-semibold text-admin-text-primary">Quy cách đóng gói</h3><p className="mt-1 text-xs leading-5 text-admin-text-muted">Ví dụ: 1 thùng = 24 chai; hệ số phải lớn hơn 1 và không trùng nhau.</p></div>
                <button type="button" onClick={addConversion} className="inline-flex min-h-10 items-center gap-2 rounded-admin-control border border-admin-border px-3 text-sm font-semibold text-admin-primary hover:bg-admin-muted"><Plus size={15} aria-hidden="true" /> Thêm quy cách</button>
              </div>
              {draft.conversions.length === 0 ? <div className="mt-3 rounded-admin-control border border-dashed border-admin-border px-4 py-8 text-center text-sm text-admin-text-muted">Không bắt buộc có quy cách đóng gói.</div> : (
                <div className="mt-3 space-y-3">
                  {draft.conversions.map((conversion, index) => {
                    const selectedConversionUnit = units.find((unit) => unit.id === conversion.unitId);
                    return (
                    <fieldset key={conversion.clientKey} className="rounded-admin-control border border-admin-border p-4">
                      <legend className="px-1 text-sm font-semibold text-admin-text-primary">Quy cách {index + 1}</legend>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div><label htmlFor={`conversion-code-${conversion.clientKey}`} className="mb-1 block text-xs font-medium text-admin-text-secondary">Mã *</label><input id={`conversion-code-${conversion.clientKey}`} value={conversion.code} onChange={(event) => updateConversion(conversion.clientKey, { code: event.target.value })} className={inputClass} maxLength={60} /></div>
                        <div><label htmlFor={`conversion-name-${conversion.clientKey}`} className="mb-1 block text-xs font-medium text-admin-text-secondary">Tên *</label><input id={`conversion-name-${conversion.clientKey}`} value={conversion.name} onChange={(event) => updateConversion(conversion.clientKey, { name: event.target.value })} className={inputClass} maxLength={120} /></div>
                        <div><label htmlFor={`conversion-unit-${conversion.clientKey}`} className="mb-1 block text-xs font-medium text-admin-text-secondary">Đơn vị *</label><select id={`conversion-unit-${conversion.clientKey}`} value={conversion.unitId} onChange={(event) => updateConversion(conversion.clientKey, { unitId: Number(event.target.value) })} className={inputClass}><option value={0}>Chọn đơn vị</option>{units.map((unit) => <option key={unit.id} value={unit.id} disabled={unit.id === draft.baseUnitId || (!unit.isActive && unit.id !== conversion.unitId)}>{unit.name}{unit.symbol ? ` (${unit.symbol})` : ''}</option>)}</select></div>
                        <div><label htmlFor={`conversion-factor-${conversion.clientKey}`} className="mb-1 block text-xs font-medium text-admin-text-secondary">Hệ số về đơn vị gốc *</label><input id={`conversion-factor-${conversion.clientKey}`} value={conversion.factorToBase} onChange={(event) => updateConversion(conversion.clientKey, { factorToBase: event.target.value })} className={inputClass} inputMode="decimal" placeholder="24" /></div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm text-admin-text-secondary"><input type="checkbox" checked={conversion.isActive} onChange={(event) => updateConversion(conversion.clientKey, { isActive: event.target.checked })} className="h-4 w-4 accent-admin-primary" /> Đang hoạt động</label>
                        <button type="button" onClick={() => setDraft((current) => ({ ...current, conversions: current.conversions.filter((item) => item.clientKey !== conversion.clientKey) }))} className="inline-flex min-h-10 items-center gap-1.5 rounded-admin-control px-3 text-sm font-semibold text-admin-status-error hover:bg-admin-status-error/10" aria-label={`Bỏ quy cách ${index + 1}`}><X size={16} aria-hidden="true" /> Bỏ quy cách</button>
                      </div>
                      {selectedConversionUnit && !selectedConversionUnit.isActive ? <p className="mt-2 text-xs leading-5 text-amber-700">Đơn vị quy đổi hiện tại đã tắt. Tham chiếu cũ được giữ lại; hãy chọn đơn vị đang hoạt động nếu muốn thay đổi quy cách.</p> : null}
                    </fieldset>
                    );
                  })}
                </div>
              )}
            </section>

            {editing && ((editing.productCount ?? 0) + (editing.snapshotCount ?? 0) + (editing.inventoryUnitCount ?? 0) > 0) ? <IngredientStatus kind="warning">Nguyên liệu đã có tham chiếu công thức, đơn hàng hoặc kho. Có thể tắt, nhưng không thể xóa dữ liệu lịch sử.</IngredientStatus> : null}
            {formError ? <p className="text-sm text-admin-status-error" role="alert">{formError}</p> : null}
          </div>
        )}
      </SettingsDialog>

      <SettingsDialog open={Boolean(deleting)} title="Xác nhận xóa nguyên liệu" onRequestClose={() => !deleteBusy && setDeleting(null)}>
        {deleting ? <ConfirmationPanel title={`Xóa nguyên liệu ${deleting.name}?`} description="Nguyên liệu chưa được tham chiếu sẽ bị xóa vĩnh viễn cùng các quy cách. Thao tác này không thể hoàn tác." confirmLabel="Xóa nguyên liệu" busy={deleteBusy} onCancel={() => setDeleting(null)} onConfirm={() => void remove()} /> : null}
      </SettingsDialog>
    </SettingsShell>
  );
};
