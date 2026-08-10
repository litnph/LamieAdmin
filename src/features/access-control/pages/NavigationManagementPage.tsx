import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CircleAlert, Eye, EyeOff, ListTree, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { getAllPageDefinitions, getPageDefinition, isSafeAdminRoutePath } from '@/app/modules/registry';
import { getAllIconKeys, getIconDefinition, hasIconDefinition } from '@/app/modules/iconRegistry';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Permission } from '@/features/auth/permissions';
import { navigationApi } from '@/features/navigation/api/navigationApi';
import { useNavigation } from '@/features/navigation/context/NavigationContext';
import { ConfirmationPanel, SettingsDialog } from '@/features/settings/components/SettingsDialog';
import { PageHeader } from '@/shared/components/PageHeader';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { permissionsApi } from '../api/permissionsApi';
import type {
  NavigationManagementItem,
  PermissionManagementItem,
  SaveNavigationPayload,
} from '../types/accessControl.types';

type TreeRow = { item: NavigationManagementItem; depth: number; orphan: boolean };

const emptyDraft = (): SaveNavigationPayload => ({
  key: '', parentId: null, moduleKey: null, pageKey: null, label: '', description: null,
  path: null, iconKey: 'circle', permissionCode: null, sortOrder: 10,
  isVisible: true, isEnabled: true, openInNewTab: false,
});

const inputClass = 'h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 text-sm text-admin-text-primary outline-none placeholder:text-admin-text-muted focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text';
const keyPattern = /^[a-z0-9][a-z0-9._-]*$/;

const ordered = (items: NavigationManagementItem[]) => [...items].sort((left, right) =>
  left.sortOrder - right.sortOrder || left.label.localeCompare(right.label, 'vi') || left.key.localeCompare(right.key));

const flattenTree = (items: NavigationManagementItem[]): TreeRow[] => {
  const ids = new Set(items.map((item) => item.id));
  const children = new Map<string | null, NavigationManagementItem[]>();
  for (const item of items) {
    const parentKey = item.parentId && ids.has(item.parentId) ? item.parentId : null;
    children.set(parentKey, [...(children.get(parentKey) ?? []), item]);
  }
  const rows: TreeRow[] = [];
  const visited = new Set<string>();
  const visit = (item: NavigationManagementItem, depth: number) => {
    if (visited.has(item.id)) return;
    visited.add(item.id);
    rows.push({ item, depth, orphan: Boolean(item.parentId && !ids.has(item.parentId)) });
    ordered(children.get(item.id) ?? []).forEach((child) => visit(child, depth + 1));
  };
  ordered(children.get(null) ?? []).forEach((item) => visit(item, 0));
  ordered(items.filter((item) => !visited.has(item.id))).forEach((item) => visit(item, 0));
  return rows;
};

const descendantsOf = (id: string, items: NavigationManagementItem[]): Set<string> => {
  const descendants = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of items) {
      if (descendants.has(item.id) || !item.parentId) continue;
      if (item.parentId === id || descendants.has(item.parentId)) {
        descendants.add(item.id);
        changed = true;
      }
    }
  }
  return descendants;
};

export const NavigationManagementPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { refreshNavigation } = useNavigation();
  const canManage = hasPermission(Permission.NavigationManage);
  const [items, setItems] = useState<NavigationManagementItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionManagementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<NavigationManagementItem | null>(null);
  const [draft, setDraft] = useState<SaveNavigationPayload>(emptyDraft);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<NavigationManagementItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const [navigationRows, permissionRows] = await Promise.all([
        navigationApi.managementList(),
        permissionsApi.list({ page: 1, pageSize: 100 }),
      ]);
      setItems(navigationRows);
      setPermissions(permissionRows.items);
    } catch (error) {
      setPageError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const rows = useMemo(() => flattenTree(items), [items]);
  const pageDefinitions = useMemo(() => getAllPageDefinitions(), []);
  const iconKeys = useMemo(() => getAllIconKeys(), []);
  const permissionByCode = useMemo(() => new Map(permissions.map((item) => [item.code, item])), [permissions]);
  const excludedParents = useMemo(() => editing
    ? new Set([editing.id, ...descendantsOf(editing.id, items)])
    : new Set<string>(), [editing, items]);

  const warningsFor = (item: NavigationManagementItem, orphan: boolean): string[] => {
    const warnings = new Set(item.warnings ?? []);
    if (orphan) warnings.add('parent_missing');
    if (item.iconKey && !hasIconDefinition(item.iconKey)) warnings.add('icon_missing');
    if (item.permissionCode && !permissionByCode.has(item.permissionCode)) warnings.add('permission_missing');
    if (item.permissionCode && permissionByCode.get(item.permissionCode)?.isActive === false) warnings.add('permission_inactive');
    if (item.pageKey) {
      const page = getPageDefinition(item.pageKey);
      if (!page || page.moduleKey !== item.moduleKey) warnings.add('page_missing');
    }
    return [...warnings];
  };

  const openCreate = () => {
    const rootSort = Math.max(0, ...items.filter((item) => !item.parentId).map((item) => item.sortOrder)) + 10;
    setEditing(null);
    setDraft({ ...emptyDraft(), sortOrder: rootSort });
    setFormError(null);
    setEditorOpen(true);
  };

  const openEdit = (item: NavigationManagementItem) => {
    setEditing(item);
    setDraft({
      key: item.key,
      parentId: item.parentId ?? null,
      moduleKey: item.moduleKey ?? null,
      pageKey: item.pageKey ?? null,
      label: item.label,
      description: item.description ?? null,
      path: item.path ?? null,
      iconKey: item.iconKey ?? null,
      permissionCode: item.permissionCode ?? null,
      sortOrder: item.sortOrder,
      isVisible: item.isVisible,
      isEnabled: item.isEnabled,
      openInNewTab: false,
    });
    setFormError(null);
    setEditorOpen(true);
  };

  const selectPage = (pageKey: string) => {
    if (!pageKey) {
      setDraft((current) => ({ ...current, moduleKey: null, pageKey: null, path: null }));
      return;
    }
    const page = getPageDefinition(pageKey);
    if (!page) return;
    setDraft((current) => ({
      ...current,
      moduleKey: page.moduleKey,
      pageKey: page.pageKey,
      path: page.defaultPath,
      permissionCode: page.requiredPermission ?? current.permissionCode,
    }));
  };

  const save = async () => {
    const payload: SaveNavigationPayload = {
      ...draft,
      key: draft.key.trim().toLowerCase(),
      label: draft.label.trim(),
      description: draft.description?.trim() || null,
      path: draft.path?.trim() || null,
      iconKey: draft.iconKey || null,
      permissionCode: draft.permissionCode || null,
      parentId: draft.parentId || null,
      sortOrder: Number(draft.sortOrder),
      openInNewTab: false,
    };
    const hasAnyBinding = Boolean(payload.moduleKey || payload.pageKey || payload.path);
    const hasCompleteBinding = Boolean(payload.moduleKey && payload.pageKey && payload.path);
    if (!keyPattern.test(payload.key) || !payload.label || !Number.isInteger(payload.sortOrder)
      || payload.sortOrder < 0 || (hasAnyBinding && !hasCompleteBinding)
      || (payload.path && !isSafeAdminRoutePath(payload.path))
      || (payload.isVisible && payload.path?.split('/').some((segment) => segment.startsWith(':')))) {
      setFormError('Kiểm tra key, nhãn, page binding, đường dẫn /admin/ nội bộ và thứ tự không âm. Route có tham số phải ẩn khỏi Sidebar.');
      return;
    }
    if (items.some((item) => item.id !== editing?.id
      && (item.parentId ?? null) === payload.parentId && item.sortOrder === payload.sortOrder)) {
      setFormError('Thứ tự phải duy nhất trong cùng một menu cha.');
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      if (editing) {
        await navigationApi.update(editing.id, payload);
        setSuccess(`Đã cập nhật ${payload.label}.`);
      } else {
        await navigationApi.create(payload);
        setSuccess(`Đã tạo ${payload.label}.`);
      }
      setEditorOpen(false);
      setEditing(null);
      await load();
      refreshNavigation();
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const toggleEnabled = async (item: NavigationManagementItem) => {
    setBusy(true);
    try {
      await navigationApi.setEnabled(item.id, !item.isEnabled);
      setSuccess(`${item.label} đã ${item.isEnabled ? 'tắt' : 'bật'}.`);
      await load();
      refreshNavigation();
    } catch (error) {
      setPageError(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const move = async (item: NavigationManagementItem, direction: -1 | 1) => {
    const siblings = ordered(items.filter((candidate) => (candidate.parentId ?? null) === (item.parentId ?? null)));
    const index = siblings.findIndex((candidate) => candidate.id === item.id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= siblings.length) return;
    [siblings[index], siblings[nextIndex]] = [siblings[nextIndex], siblings[index]];
    setBusy(true);
    try {
      await navigationApi.reorder({
        items: siblings.map((candidate, order) => ({
          id: candidate.id, parentId: candidate.parentId ?? null, sortOrder: (order + 1) * 10,
        })),
      });
      await load();
      refreshNavigation();
    } catch (error) {
      setPageError(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const deleteItem = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await navigationApi.delete(deleting.id);
      setSuccess(`Đã xóa ${deleting.label}.`);
      setDeleting(null);
      await load();
      refreshNavigation();
    } catch (error) {
      setPageError(getApiErrorMessage(error));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const previewItems = rows.filter(({ item }) => item.isEnabled && item.isVisible);

  return (
    <div className="min-w-0">
      <PageHeader
        title="Menu & Điều hướng"
        description="Quản lý cây Sidebar và ánh xạ route tới page đã đăng ký an toàn trong source Admin."
        actions={canManage ? <button type="button" onClick={openCreate} className="btn-press inline-flex min-h-11 items-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-white"><Plus size={17} /> Thêm mục</button> : undefined}
      />
      {success ? <div className="mb-4 rounded-admin-control border border-admin-status-success/30 bg-green-50 px-4 py-3 text-sm text-admin-status-success" role="status">{success}</div> : null}
      {pageError ? <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-admin-control border border-admin-status-error/30 bg-red-50 px-4 py-3 text-sm text-admin-status-error" role="alert"><span>{pageError}</span><button type="button" onClick={() => void load()} className="inline-flex min-h-9 items-center gap-2 font-semibold underline"><RefreshCw size={15} /> Thử lại</button></div> : null}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-admin-panel border border-admin-border bg-admin-surface text-sm text-admin-text-secondary" role="status">Đang tải cấu hình điều hướng…</div>
      ) : items.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-admin-panel border border-dashed border-admin-border bg-admin-surface text-center">
          <ListTree size={30} className="text-admin-text-muted" />
          <p className="mt-3 text-sm font-semibold">Chưa có cấu hình điều hướng</p>
          <p className="mt-1 text-xs text-admin-text-muted">Dữ liệu mặc định sẽ được upsert an toàn ở PHASE 9.</p>
        </div>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(17rem,0.75fr)]">
          <section aria-labelledby="navigation-tree-title">
            <div className="mb-3 flex items-end justify-between"><div><h2 id="navigation-tree-title" className="text-base font-semibold">Cây điều hướng</h2><p className="mt-1 text-xs text-admin-text-muted">Dùng lên/xuống để đổi thứ tự trong cùng cấp.</p></div><span className="text-xs text-admin-text-muted">{items.length} mục</span></div>
            <div className="overflow-hidden rounded-admin-panel border border-admin-border bg-admin-surface shadow-admin-panel">
              {rows.map(({ item, depth, orphan }, index) => {
                const Icon = getIconDefinition(item.iconKey);
                const warnings = warningsFor(item, orphan);
                const siblings = ordered(items.filter((candidate) => (candidate.parentId ?? null) === (item.parentId ?? null)));
                const siblingIndex = siblings.findIndex((candidate) => candidate.id === item.id);
                const hasChildren = items.some((candidate) => candidate.parentId === item.id);
                return (
                  <article key={item.id} className={`flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:justify-between sm:p-4 ${index ? 'border-t border-admin-border' : ''}`} style={{ paddingLeft: `${Math.min(depth, 5) * 18 + 16}px` }}>
                    <div className="flex min-w-0 gap-3">
                      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-admin-control bg-admin-muted text-admin-text-secondary"><Icon size={17} /></span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">{item.label}</h3><span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${item.isEnabled ? 'bg-green-50 text-admin-status-success' : 'bg-admin-muted text-admin-text-muted'}`}>{item.isEnabled ? 'Bật' : 'Tắt'}</span>{item.isVisible ? null : <span className="rounded-md bg-admin-muted px-2 py-0.5 text-[10px] text-admin-text-muted">Route ẩn</span>}{item.isSystem ? <span className="rounded-md bg-admin-primary/10 px-2 py-0.5 text-[10px] text-admin-primary">Hệ thống</span> : null}</div>
                        <p className="mt-1 break-all font-mono text-[11px] text-admin-text-muted">{item.key}{item.path ? ` · ${item.path}` : ''}</p>
                        {warnings.length ? <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-700"><CircleAlert size={14} /> {warnings.join(', ')}</p> : null}
                      </div>
                    </div>
                    {canManage ? <div className="flex shrink-0 items-center justify-end gap-1">
                      <button type="button" disabled={busy || siblingIndex <= 0} onClick={() => void move(item, -1)} className="inline-flex h-10 w-10 items-center justify-center rounded-admin-control hover:bg-admin-muted disabled:opacity-30" aria-label={`Đưa ${item.label} lên`}><ArrowUp size={16} /></button>
                      <button type="button" disabled={busy || siblingIndex >= siblings.length - 1} onClick={() => void move(item, 1)} className="inline-flex h-10 w-10 items-center justify-center rounded-admin-control hover:bg-admin-muted disabled:opacity-30" aria-label={`Đưa ${item.label} xuống`}><ArrowDown size={16} /></button>
                      <button type="button" disabled={busy} onClick={() => void toggleEnabled(item)} className="inline-flex h-10 w-10 items-center justify-center rounded-admin-control hover:bg-admin-muted" aria-label={`${item.isEnabled ? 'Tắt' : 'Bật'} ${item.label}`}>{item.isEnabled ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                      <button type="button" onClick={() => openEdit(item)} className="inline-flex h-10 w-10 items-center justify-center rounded-admin-control hover:bg-admin-muted" aria-label={`Sửa ${item.label}`}><Pencil size={16} /></button>
                      {!item.isSystem ? <button type="button" disabled={hasChildren} onClick={() => setDeleting(item)} className="inline-flex h-10 w-10 items-center justify-center rounded-admin-control text-admin-status-error hover:bg-red-50 disabled:opacity-30" aria-label={`Xóa ${item.label}`} title={hasChildren ? 'Di chuyển hoặc xóa menu con trước.' : undefined}><Trash2 size={16} /></button> : null}
                    </div> : null}
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="rounded-admin-panel border border-admin-border bg-admin-surface p-4 shadow-admin-panel xl:sticky xl:top-0" aria-labelledby="sidebar-preview-title">
            <h2 id="sidebar-preview-title" className="text-base font-semibold">Xem trước Sidebar</h2>
            <p className="mt-1 text-xs text-admin-text-muted">Mô phỏng mục đang bật và hiển thị; quyền người dùng vẫn được API lọc khi chạy thật.</p>
            <div className="mt-4 space-y-1 rounded-admin-control bg-slate-950 p-3 text-slate-200">
              {previewItems.length ? previewItems.map(({ item, depth }) => {
                const Icon = getIconDefinition(item.iconKey);
                return <div key={item.id} className="flex min-h-9 items-center gap-2 rounded-md px-2 text-xs" style={{ paddingLeft: `${depth * 14 + 8}px` }}><Icon size={14} className="text-slate-400" /><span className="truncate">{item.label}</span></div>;
              }) : <p className="px-2 py-4 text-center text-xs text-slate-400">Không có mục hiển thị.</p>}
            </div>
          </aside>
        </div>
      )}

      <SettingsDialog open={editorOpen} title={editing ? `Cập nhật ${editing.label}` : 'Thêm mục điều hướng'} description="Chọn page từ Page Registry hoặc để trống page để tạo nhóm chứa menu con." width="wide" onRequestClose={() => !busy && setEditorOpen(false)} footer={<><button type="button" disabled={busy} onClick={() => setEditorOpen(false)} className="h-11 rounded-admin-control border border-admin-border px-4 text-sm font-semibold">Hủy</button><button type="button" disabled={busy} onClick={() => void save()} className="h-11 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-white">{busy ? 'Đang lưu…' : 'Lưu mục'}</button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label><span className="mb-1.5 block text-sm font-medium">Key</span><input data-autofocus value={draft.key} disabled={Boolean(editing)} onChange={(event) => setDraft((current) => ({ ...current, key: event.target.value }))} className={inputClass} placeholder="module.page" /></label>
          <label><span className="mb-1.5 block text-sm font-medium">Nhãn</span><input value={draft.label} onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))} className={inputClass} /></label>
          <label><span className="mb-1.5 block text-sm font-medium">Menu cha</span><select value={draft.parentId ?? ''} onChange={(event) => setDraft((current) => ({ ...current, parentId: event.target.value || null }))} className={inputClass}><option value="">Cấp gốc</option>{rows.filter(({ item }) => !excludedParents.has(item.id)).map(({ item, depth }) => <option key={item.id} value={item.id}>{'— '.repeat(depth)}{item.label}</option>)}</select></label>
          <label><span className="mb-1.5 block text-sm font-medium">Page Registry</span><select aria-label="Page Registry" value={draft.pageKey ?? ''} onChange={(event) => selectPage(event.target.value)} className={inputClass}><option value="">Nhóm không có route</option>{pageDefinitions.map((page) => <option key={page.pageKey} value={page.pageKey}>{page.pageKey} · {page.defaultPath}</option>)}</select></label>
          <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-medium">Đường dẫn nội bộ</span><input value={draft.path ?? ''} disabled={!draft.pageKey} onChange={(event) => setDraft((current) => ({ ...current, path: event.target.value || null }))} className={inputClass} placeholder="/admin/..." /></label>
          <label><span className="mb-1.5 block text-sm font-medium">Icon</span><select value={draft.iconKey ?? ''} onChange={(event) => setDraft((current) => ({ ...current, iconKey: event.target.value || null }))} className={inputClass}><option value="">Icon fallback</option>{iconKeys.map((key) => <option key={key} value={key}>{key}</option>)}</select></label>
          <label><span className="mb-1.5 block text-sm font-medium">Permission</span><select value={draft.permissionCode ?? ''} onChange={(event) => setDraft((current) => ({ ...current, permissionCode: event.target.value || null }))} className={inputClass}><option value="">Không yêu cầu</option>{permissions.map((permission) => <option key={permission.id} value={permission.code} disabled={!permission.isActive}>{permission.code}{permission.isActive ? '' : ' (đã tắt)'}</option>)}</select></label>
          <label><span className="mb-1.5 block text-sm font-medium">Thứ tự</span><input type="number" min={0} value={draft.sortOrder} onChange={(event) => setDraft((current) => ({ ...current, sortOrder: Number(event.target.value) }))} className={inputClass} /></label>
          <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-medium">Mô tả</span><textarea value={draft.description ?? ''} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} className={`${inputClass} min-h-20 resize-y py-2.5`} /></label>
          <div className="sm:col-span-2 grid gap-2 sm:grid-cols-2"><label className="flex min-h-11 items-center gap-3 rounded-admin-control border border-admin-border px-3 text-sm"><input type="checkbox" checked={draft.isVisible} onChange={(event) => setDraft((current) => ({ ...current, isVisible: event.target.checked }))} className="h-4 w-4 accent-admin-primary" /> Hiển thị trong Sidebar</label><label className="flex min-h-11 items-center gap-3 rounded-admin-control border border-admin-border px-3 text-sm"><input type="checkbox" checked={draft.isEnabled} onChange={(event) => setDraft((current) => ({ ...current, isEnabled: event.target.checked }))} className="h-4 w-4 accent-admin-primary" /> Đang bật</label></div>
          {formError ? <p className="sm:col-span-2 text-sm text-admin-status-error" role="alert">{formError}</p> : null}
        </div>
      </SettingsDialog>

      <SettingsDialog open={Boolean(deleting)} title="Xóa mục điều hướng" onRequestClose={() => !busy && setDeleting(null)}>{deleting ? <ConfirmationPanel title={`Xóa ${deleting.label}?`} description="Mục tùy chỉnh sẽ bị xóa vĩnh viễn. Các mục hệ thống và mục còn menu con được bảo vệ." confirmLabel="Xóa mục" busy={busy} onCancel={() => setDeleting(null)} onConfirm={() => void deleteItem()} /> : null}</SettingsDialog>
    </div>
  );
};
