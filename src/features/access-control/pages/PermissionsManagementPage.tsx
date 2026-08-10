import React, { useCallback, useEffect, useState } from 'react';
import { KeyRound, LockKeyhole, Pencil, Plus, RefreshCw, Search, ShieldOff, UsersRound } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Permission } from '@/features/auth/permissions';
import { useNavigation } from '@/features/navigation/context/NavigationContext';
import { ConfirmationPanel, SettingsDialog } from '@/features/settings/components/SettingsDialog';
import { PageHeader } from '@/shared/components/PageHeader';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { permissionsApi } from '../api/permissionsApi';
import type {
  PagedPermissions,
  PermissionFilters,
  PermissionManagementItem,
  SavePermissionPayload,
} from '../types/accessControl.types';

const emptyResult: PagedPermissions = {
  items: [], totalCount: 0, page: 1, pageSize: 25, totalPages: 0,
  hasNext: false, hasPrevious: false,
};

const emptyDraft = (): SavePermissionPayload => ({
  code: '', name: '', description: null, group: '', isActive: true, sortOrder: 0,
});

const inputClass = 'h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 text-sm text-admin-text-primary outline-none placeholder:text-admin-text-muted focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text';
const codePattern = /^[a-z0-9][a-z0-9._-]*\.[a-z0-9][a-z0-9._-]*$/;

export const PermissionsManagementPage: React.FC = () => {
  const { hasPermission, refreshUser } = useAuth();
  const { refreshNavigation } = useNavigation();
  const canManage = hasPermission(Permission.RolesManage);
  const [filters, setFilters] = useState<PermissionFilters>({ page: 1, pageSize: 25 });
  const [searchDraft, setSearchDraft] = useState('');
  const [groupDraft, setGroupDraft] = useState('');
  const [systemDraft, setSystemDraft] = useState('all');
  const [activeDraft, setActiveDraft] = useState('all');
  const [result, setResult] = useState<PagedPermissions>(emptyResult);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PermissionManagementItem | null>(null);
  const [draft, setDraft] = useState<SavePermissionPayload>(emptyDraft);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState<PermissionManagementItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      setResult(await permissionsApi.list(filters));
    } catch (error) {
      setPageError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { void load(); }, [load]);

  const applyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    setFilters({
      page: 1,
      pageSize: 25,
      search: searchDraft.trim() || undefined,
      group: groupDraft.trim() || undefined,
      system: systemDraft === 'all' ? undefined : systemDraft === 'system',
      active: activeDraft === 'all' ? undefined : activeDraft === 'active',
    });
  };

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft());
    setFormError(null);
    setEditorOpen(true);
  };

  const openEdit = (item: PermissionManagementItem) => {
    setEditing(item);
    setDraft({
      code: item.code,
      name: item.name,
      description: item.description ?? null,
      group: item.group,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
    setFormError(null);
    setEditorOpen(true);
  };

  const save = async () => {
    const payload = {
      ...draft,
      code: draft.code.trim().toLowerCase(),
      name: draft.name.trim(),
      description: draft.description?.trim() || null,
      group: draft.group.trim(),
      sortOrder: Number(draft.sortOrder),
    };
    if (!codePattern.test(payload.code) || !payload.name || !payload.group
      || !Number.isInteger(payload.sortOrder) || payload.sortOrder < 0) {
      setFormError('Nhập mã dạng module.action, tên, nhóm và thứ tự không âm.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await permissionsApi.update(editing.id, payload);
        setSuccess(`Đã cập nhật quyền ${payload.code}.`);
      } else {
        await permissionsApi.create(payload);
        setSuccess(`Đã tạo quyền ${payload.code}.`);
      }
      setEditorOpen(false);
      setEditing(null);
      await Promise.all([load(), refreshUser().catch(() => undefined)]);
      refreshNavigation();
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async () => {
    if (!deactivating) return;
    setSaving(true);
    try {
      await permissionsApi.deactivate(deactivating.id);
      setSuccess(`Đã vô hiệu hóa quyền ${deactivating.code}.`);
      setDeactivating(null);
      await Promise.all([load(), refreshUser().catch(() => undefined)]);
      refreshNavigation();
    } catch (error) {
      setPageError(getApiErrorMessage(error));
      setDeactivating(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-w-0">
      <PageHeader
        title="Quyền hạn"
        description="Tra cứu permission trong database, cập nhật metadata và quản lý permission tùy chỉnh."
        actions={canManage ? (
          <button type="button" onClick={openCreate} className="btn-press inline-flex min-h-11 items-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground">
            <Plus size={17} aria-hidden="true" /> Thêm quyền tùy chỉnh
          </button>
        ) : undefined}
      />

      {success ? <div className="mb-4 rounded-admin-control border border-admin-status-success/30 bg-green-50 px-4 py-3 text-sm text-admin-status-success" role="status">{success}</div> : null}
      {pageError ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-admin-control border border-admin-status-error/30 bg-red-50 px-4 py-3 text-sm text-admin-status-error" role="alert">
          <span>{pageError}</span>
          <button type="button" onClick={() => void load()} className="inline-flex min-h-9 items-center gap-2 font-semibold underline"><RefreshCw size={15} /> Thử lại</button>
        </div>
      ) : null}

      <form onSubmit={applyFilters} className="mb-5 grid gap-3 rounded-admin-panel border border-admin-border bg-admin-surface p-4 shadow-admin-panel md:grid-cols-2 xl:grid-cols-[minmax(14rem,1.5fr)_minmax(10rem,1fr)_10rem_10rem_auto]">
        <label className="relative block">
          <span className="sr-only">Tìm quyền</span>
          <Search className="pointer-events-none absolute left-3 top-3.5 text-admin-text-muted" size={17} aria-hidden="true" />
          <input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} className={`${inputClass} pl-10`} placeholder="Mã, tên hoặc mô tả" />
        </label>
        <input value={groupDraft} onChange={(event) => setGroupDraft(event.target.value)} className={inputClass} placeholder="Nhóm quyền" aria-label="Lọc theo nhóm" />
        <select value={systemDraft} onChange={(event) => setSystemDraft(event.target.value)} className={inputClass} aria-label="Loại quyền">
          <option value="all">Mọi loại</option><option value="system">Hệ thống</option><option value="custom">Tùy chỉnh</option>
        </select>
        <select value={activeDraft} onChange={(event) => setActiveDraft(event.target.value)} className={inputClass} aria-label="Trạng thái quyền">
          <option value="all">Mọi trạng thái</option><option value="active">Hoạt động</option><option value="inactive">Đã tắt</option>
        </select>
        <button type="submit" className="min-h-11 rounded-admin-control border border-admin-primary bg-admin-primary px-4 text-sm font-semibold text-white">Áp dụng</button>
      </form>

      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-admin-panel border border-admin-border bg-admin-surface text-sm text-admin-text-secondary" role="status">Đang tải quyền…</div>
      ) : result.items.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-admin-panel border border-dashed border-admin-border bg-admin-surface text-center">
          <KeyRound size={28} className="text-admin-text-muted" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-admin-text-primary">Không có quyền phù hợp</p>
          <p className="mt-1 text-xs text-admin-text-muted">Thử thay đổi bộ lọc hoặc từ khóa.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {result.items.map((item) => (
            <article key={item.id} className="rounded-admin-panel border border-admin-border bg-admin-surface p-4 shadow-admin-panel">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-admin-text-primary">{item.name}</h2>
                    <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${item.isSystem ? 'bg-admin-primary/10 text-admin-primary' : 'bg-violet-50 text-violet-700'}`}>
                      {item.isSystem ? 'Hệ thống' : 'Tùy chỉnh'}
                    </span>
                    <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${item.isActive ? 'bg-admin-status-success/10 text-admin-status-success' : 'bg-admin-muted text-admin-text-secondary'}`}>{item.isActive ? 'Hoạt động' : 'Đã tắt'}</span>
                  </div>
                  <p className="mt-1 break-all font-mono text-xs text-admin-text-muted">{item.code}</p>
                  <p className="mt-2 text-sm text-admin-text-secondary">{item.description || 'Không có mô tả.'}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <span className="inline-flex min-h-9 items-center gap-1.5 rounded-admin-control bg-admin-muted px-3 text-xs text-admin-text-secondary"><UsersRound size={14} /> {item.roleCount} vai trò</span>
                  <span className="inline-flex min-h-9 items-center rounded-admin-control bg-admin-muted px-3 text-xs text-admin-text-secondary">{item.group} · #{item.sortOrder}</span>
                  {canManage && !item.isSystem ? (
                    <>
                      <button type="button" onClick={() => openEdit(item)} className="inline-flex h-11 w-11 items-center justify-center rounded-admin-control text-admin-text-secondary hover:bg-admin-muted" aria-label={`Sửa quyền ${item.code}`}><Pencil size={17} /></button>
                      {item.isActive ? <button type="button" onClick={() => setDeactivating(item)} className="inline-flex h-11 w-11 items-center justify-center rounded-admin-control text-admin-status-error hover:bg-red-50" aria-label={`Vô hiệu hóa quyền ${item.code}`}><ShieldOff size={17} /></button> : null}
                    </>
                  ) : null}
                  {item.isSystem ? <LockKeyhole size={16} className="text-admin-text-muted" aria-label="Permission hệ thống bất biến" /> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {result.totalPages > 1 ? (
        <nav className="mt-5 flex items-center justify-between gap-3" aria-label="Phân trang quyền">
          <span className="text-xs text-admin-text-muted">Trang {result.page}/{result.totalPages} · {result.totalCount} quyền</span>
          <div className="flex gap-2">
            <button type="button" disabled={!result.hasPrevious} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))} className="min-h-10 rounded-admin-control border border-admin-border px-3 text-sm disabled:opacity-40">Trang trước</button>
            <button type="button" disabled={!result.hasNext} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))} className="min-h-10 rounded-admin-control border border-admin-border px-3 text-sm disabled:opacity-40">Trang sau</button>
          </div>
        </nav>
      ) : null}

      <SettingsDialog
        open={editorOpen}
        title={editing ? `Cập nhật ${editing.code}` : 'Thêm quyền tùy chỉnh'}
        description="Mã permission là định danh bất biến sau khi tạo. Permission tùy chỉnh chỉ bảo vệ endpoint khi API có policy tương ứng."
        onRequestClose={() => !saving && setEditorOpen(false)}
        footer={<>
          <button type="button" disabled={saving} onClick={() => setEditorOpen(false)} className="h-11 rounded-admin-control border border-admin-border px-4 text-sm font-semibold">Hủy</button>
          <button type="button" disabled={saving} onClick={() => void save()} className="h-11 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-white">{saving ? 'Đang lưu…' : 'Lưu quyền'}</button>
        </>}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-medium">Mã quyền</span><input data-autofocus value={draft.code} disabled={Boolean(editing)} onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value }))} className={inputClass} placeholder="module.action" /></label>
          <label><span className="mb-1.5 block text-sm font-medium">Tên</span><input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className={inputClass} /></label>
          <label><span className="mb-1.5 block text-sm font-medium">Nhóm</span><input value={draft.group} onChange={(event) => setDraft((current) => ({ ...current, group: event.target.value }))} className={inputClass} /></label>
          <label><span className="mb-1.5 block text-sm font-medium">Thứ tự</span><input type="number" min={0} value={draft.sortOrder} onChange={(event) => setDraft((current) => ({ ...current, sortOrder: Number(event.target.value) }))} className={inputClass} /></label>
          <label className="flex min-h-11 items-center gap-3 self-end rounded-admin-control border border-admin-border px-3 text-sm"><input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))} className="h-4 w-4 accent-admin-primary" /> Đang hoạt động</label>
          <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-medium">Mô tả</span><textarea value={draft.description ?? ''} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} className={`${inputClass} min-h-24 resize-y py-2.5`} maxLength={500} /></label>
          {formError ? <p className="sm:col-span-2 text-sm text-admin-status-error" role="alert">{formError}</p> : null}
        </div>
      </SettingsDialog>

      <SettingsDialog open={Boolean(deactivating)} title="Vô hiệu hóa quyền" onRequestClose={() => !saving && setDeactivating(null)}>
        {deactivating ? <ConfirmationPanel title={`Vô hiệu hóa ${deactivating.code}?`} description={`Quyền đang được ${deactivating.roleCount} vai trò sử dụng. Grant được giữ lại nhưng không còn tạo quyền truy cập cho đến khi kích hoạt lại.`} confirmLabel="Vô hiệu hóa" busy={saving} tone="warning" onCancel={() => setDeactivating(null)} onConfirm={() => void deactivate()} /> : null}
      </SettingsDialog>
    </div>
  );
};
