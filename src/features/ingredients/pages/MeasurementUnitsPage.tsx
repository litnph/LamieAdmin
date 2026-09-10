import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ConfirmationPanel, SettingsDialog } from '@/features/settings/components/SettingsDialog';
import { SettingsShell } from '@/features/settings/components/SettingsShell';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { measurementUnitsApi } from '../api/ingredientsApi';
import { IngredientStatus } from '../components/IngredientShell';
import type { MeasurementUnitDto, PagedResult, SaveMeasurementUnitRequest } from '../types/ingredient.types';

const inputClass = 'h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 text-sm text-admin-text-primary outline-none transition-colors placeholder:text-admin-text-muted focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:bg-admin-muted';
const PAGE_SIZE = 20;
const CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
const emptyPage: PagedResult<MeasurementUnitDto> = {
  items: [], totalCount: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0, hasNext: false, hasPrevious: false,
};

const emptyDraft = (): SaveMeasurementUnitRequest => ({
  code: '',
  name: '',
  symbol: '',
  allowsFractional: true,
  isActive: true,
});

export const MeasurementUnitsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('ingredients.manage');
  const [result, setResult] = useState<PagedResult<MeasurementUnitDto>>(emptyPage);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState<MeasurementUnitDto | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<SaveMeasurementUnitRequest>(emptyDraft);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<MeasurementUnitDto | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      const response = await measurementUnitsApi.list({ includeInactive: true, page, pageSize: PAGE_SIZE });
      if (response.totalPages > 0 && page > response.totalPages) {
        setPage(response.totalPages);
        return;
      }
      setResult(response);
    } catch (error) {
      setPageError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedUnits = useMemo(
    () => [...result.items].sort((left, right) => left.name.localeCompare(right.name, 'vi')),
    [result.items],
  );

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft());
    setFormError('');
    setEditorOpen(true);
  };

  const openEdit = (unit: MeasurementUnitDto) => {
    setEditing(unit);
    setDraft({
      code: unit.code,
      name: unit.name,
      symbol: unit.symbol ?? '',
      allowsFractional: unit.allowsFractional,
      isActive: unit.isActive,
    });
    setFormError('');
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (!saving) setEditorOpen(false);
  };

  const save = async () => {
    const code = draft.code.trim();
    const name = draft.name.trim();
    if (!code || !name) {
      setFormError('Mã và tên đơn vị là bắt buộc.');
      return;
    }
    if (!CODE_PATTERN.test(code)) {
      setFormError('Mã đơn vị phải bắt đầu bằng chữ hoặc số và chỉ gồm chữ không dấu, số, gạch ngang hoặc gạch dưới.');
      return;
    }
    const normalizedCode = code.toLocaleLowerCase('vi');
    const normalizedName = name.toLocaleLowerCase('vi');
    const duplicate = result.items.find((unit) => unit.id !== editing?.id && (
      unit.code.trim().toLocaleLowerCase('vi') === normalizedCode
      || unit.name.trim().toLocaleLowerCase('vi') === normalizedName
    ));
    if (duplicate) {
      setFormError(`Mã hoặc tên đã được dùng bởi đơn vị “${duplicate.name}”.`);
      return;
    }

    setSaving(true);
    setFormError('');
    const payload: SaveMeasurementUnitRequest = {
      ...draft,
      code,
      name,
      symbol: draft.symbol?.trim() || null,
    };
    try {
      if (editing) {
        await measurementUnitsApi.update(editing.id, payload);
        setSuccess(`Đã cập nhật đơn vị ${name}.`);
      } else {
        await measurementUnitsApi.create(payload);
        setSuccess(`Đã thêm đơn vị ${name}.`);
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
    if (!deleting || deleting.canDelete === false || (deleting.referenceCount ?? 0) > 0) return;
    setDeleteBusy(true);
    try {
      await measurementUnitsApi.remove(deleting.id);
      setSuccess(`Đã xóa đơn vị ${deleting.name}.`);
      setDeleting(null);
      if (result.items.length === 1 && page > 1) setPage((current) => current - 1);
      else await load();
    } catch (error) {
      setPageError(getApiErrorMessage(error));
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <SettingsShell
      title="Đơn vị tính"
      description="Chuẩn hóa đơn vị gốc và đơn vị đóng gói trước khi cấu hình công thức sản phẩm."
      actions={canManage ? (
        <button type="button" onClick={openCreate} className="btn-press inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover sm:w-auto">
          <Plus size={17} strokeWidth={1.8} aria-hidden="true" /> Thêm đơn vị
        </button>
      ) : undefined}
    >
      <div className="space-y-4">
        {success ? <IngredientStatus kind="success">{success}</IngredientStatus> : null}
        {pageError ? (
          <IngredientStatus kind="error">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{pageError}</span>
              <button type="button" onClick={() => void load()} className="inline-flex min-h-9 items-center gap-1.5 font-semibold underline underline-offset-2">
                <RefreshCw size={15} aria-hidden="true" /> Thử lại
              </button>
            </div>
          </IngredientStatus>
        ) : null}

        {loading ? (
          <div className="flex min-h-64 items-center justify-center rounded-admin-panel border border-admin-border bg-admin-surface text-sm text-admin-text-secondary" role="status">Đang tải đơn vị tính...</div>
        ) : sortedUnits.length === 0 ? (
          <div className="rounded-admin-panel border border-dashed border-admin-border bg-admin-surface px-5 py-14 text-center">
            <p className="font-semibold text-admin-text-primary">Chưa có đơn vị tính</p>
            <p className="mt-1 text-sm text-admin-text-secondary">Tạo đơn vị đầu tiên để bắt đầu khai báo nguyên liệu.</p>
          </div>
        ) : (
          <section className="overflow-hidden rounded-admin-panel border border-admin-border bg-admin-surface shadow-admin-panel" aria-label="Danh sách đơn vị tính">
            <div className="hidden grid-cols-[minmax(9rem,1fr)_minmax(10rem,1.4fr)_minmax(6rem,.6fr)_8rem_7rem] gap-4 border-b border-admin-border bg-admin-muted/45 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-admin-text-muted md:grid">
              <span>Mã</span><span>Tên đơn vị</span><span>Ký hiệu</span><span>Kiểu số</span><span className="text-right">Thao tác</span>
            </div>
            <div className="divide-y divide-admin-border">
              {sortedUnits.map((unit) => (
                <article key={unit.id} className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(9rem,1fr)_minmax(10rem,1.4fr)_minmax(6rem,.6fr)_8rem_7rem] md:items-center md:gap-4 md:px-5">
                  <div>
                    <span className="md:hidden text-xs text-admin-text-muted">Mã đơn vị</span>
                    <p className="font-mono text-sm font-semibold text-admin-text-primary">{unit.code}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-admin-text-primary">{unit.name}</p>
                    <p className="mt-0.5 text-xs text-admin-text-muted">{unit.referenceCount ?? 0} liên kết đang tham chiếu</p>
                  </div>
                  <p className="text-sm text-admin-text-secondary"><span className="md:hidden text-admin-text-muted">Ký hiệu: </span>{unit.symbol || '—'}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-md bg-admin-muted px-2 py-1 text-[11px] font-semibold text-admin-text-secondary">{unit.allowsFractional ? 'Thập phân' : 'Số nguyên'}</span>
                    <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${unit.isActive ? 'bg-admin-status-success/10 text-admin-status-success' : 'bg-admin-muted text-admin-text-muted'}`}>{unit.isActive ? 'Hoạt động' : 'Đã tắt'}</span>
                  </div>
                  {canManage ? (
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => openEdit(unit)} className="inline-flex h-11 w-11 items-center justify-center rounded-admin-control text-admin-text-secondary hover:bg-admin-muted hover:text-admin-primary" aria-label={`Sửa đơn vị ${unit.name}`}>
                        <Pencil size={17} aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => setDeleting(unit)} disabled={unit.canDelete === false || (unit.referenceCount ?? 0) > 0} title={unit.canDelete === false || (unit.referenceCount ?? 0) > 0 ? 'Đơn vị đang được tham chiếu; hãy tắt thay vì xóa.' : undefined} className="inline-flex h-11 w-11 items-center justify-center rounded-admin-control text-admin-text-secondary hover:bg-admin-status-error/10 hover:text-admin-status-error disabled:cursor-not-allowed disabled:opacity-35" aria-label={`Xóa đơn vị ${unit.name}`}>
                        <Trash2 size={17} aria-hidden="true" />
                      </button>
                    </div>
                  ) : <span className="text-right text-xs text-admin-text-muted">Chỉ xem</span>}
                </article>
              ))}
            </div>
          </section>
        )}

        {!loading && result.totalPages > 1 ? (
          <nav className="flex flex-col gap-3 rounded-admin-control border border-admin-border bg-admin-surface px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between" aria-label="Phân trang đơn vị tính">
            <span className="text-admin-text-secondary">Trang {result.page}/{result.totalPages} · {result.totalCount} đơn vị</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={!result.hasPrevious} className="inline-flex h-11 items-center gap-1 rounded-admin-control border border-admin-border px-3 font-semibold text-admin-text-primary hover:bg-admin-muted disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={16} aria-hidden="true" /> Trước</button>
              <button type="button" onClick={() => setPage((current) => current + 1)} disabled={!result.hasNext} className="inline-flex h-11 items-center gap-1 rounded-admin-control border border-admin-border px-3 font-semibold text-admin-text-primary hover:bg-admin-muted disabled:cursor-not-allowed disabled:opacity-40">Sau <ChevronRight size={16} aria-hidden="true" /></button>
            </div>
          </nav>
        ) : null}
      </div>

      <SettingsDialog
        open={editorOpen}
        title={editing ? `Cập nhật đơn vị ${editing.name}` : 'Thêm đơn vị tính'}
        description="Mã dùng trong tích hợp; tên và ký hiệu được hiển thị cho người vận hành."
        onRequestClose={closeEditor}
        footer={(
          <>
            <button type="button" onClick={closeEditor} disabled={saving} className="h-11 rounded-admin-control border border-admin-border bg-admin-card px-4 text-sm font-semibold text-admin-text-primary hover:bg-admin-muted disabled:opacity-50">Hủy</button>
            <button type="button" onClick={() => void save()} disabled={saving} className="h-11 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm đơn vị'}</button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="unit-code" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Mã đơn vị <span aria-hidden="true">*</span></label>
              <input id="unit-code" value={draft.code} onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value }))} className={inputClass} maxLength={40} autoComplete="off" data-autofocus />
            </div>
            <div>
              <label htmlFor="unit-symbol" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Ký hiệu</label>
              <input id="unit-symbol" value={draft.symbol ?? ''} onChange={(event) => setDraft((current) => ({ ...current, symbol: event.target.value }))} className={inputClass} maxLength={20} autoComplete="off" placeholder="g, kg, ml..." />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="unit-name" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Tên đơn vị <span aria-hidden="true">*</span></label>
              <input id="unit-name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className={inputClass} maxLength={100} autoComplete="off" />
            </div>
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-admin-control border border-admin-border px-3 text-sm text-admin-text-primary">
            <input type="checkbox" checked={draft.allowsFractional} onChange={(event) => setDraft((current) => ({ ...current, allowsFractional: event.target.checked }))} className="h-4 w-4 accent-admin-primary" />
            Cho phép số lượng thập phân
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-admin-control border border-admin-border px-3 text-sm text-admin-text-primary">
            <input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))} className="h-4 w-4 accent-admin-primary" />
            Đang hoạt động
          </label>
          {(editing?.referenceCount ?? 0) > 0 ? <IngredientStatus kind="info">Đơn vị có {editing?.referenceCount} liên kết. Có thể tắt để ngừng sử dụng nhưng không nên đổi ý nghĩa của đơn vị.</IngredientStatus> : null}
          {formError ? <p className="text-sm text-admin-status-error" role="alert">{formError}</p> : null}
        </div>
      </SettingsDialog>

      <SettingsDialog open={Boolean(deleting)} title="Xác nhận xóa đơn vị" onRequestClose={() => !deleteBusy && setDeleting(null)}>
        {deleting ? (
          <ConfirmationPanel
            title={`Xóa đơn vị ${deleting.name}?`}
            description="Đơn vị không còn tham chiếu sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác."
            confirmLabel="Xóa đơn vị"
            busy={deleteBusy}
            onCancel={() => setDeleting(null)}
            onConfirm={() => void remove()}
          />
        ) : null}
      </SettingsDialog>
    </SettingsShell>
  );
};
