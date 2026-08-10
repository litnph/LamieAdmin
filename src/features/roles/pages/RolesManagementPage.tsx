import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyRound,
  LockKeyhole,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UsersRound,
} from 'lucide-react';
import { getDefaultNavigationSeeds } from '@/app/modules/registry';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Permission } from '@/features/auth/permissions';
import { navigationApi } from '@/features/navigation/api/navigationApi';
import { useNavigation } from '@/features/navigation/context/NavigationContext';
import type { NavigationManagementItem } from '@/features/access-control/types/accessControl.types';
import { ConfirmationPanel, SettingsDialog } from '@/features/settings/components/SettingsDialog';
import { PageHeader } from '@/shared/components/PageHeader';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { rolesApi } from '../api/rolesApi';
import type { PermissionDefinition, RoleDefinition, SaveRolePayload } from '../types/role.types';

type RoleDraft = {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  permissionCodes: string[];
};

const emptyDraft = (): RoleDraft => ({
  code: '',
  name: '',
  description: '',
  isActive: true,
  permissionCodes: [],
});

const inputClass =
  'h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 text-sm text-admin-text-primary outline-none transition-colors placeholder:text-admin-text-muted focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text';

export const RolesManagementPage: React.FC = () => {
  const { hasPermission, refreshUser, user } = useAuth();
  const { refreshNavigation } = useNavigation();
  const canManage = hasPermission(Permission.RolesManage);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [permissions, setPermissions] = useState<PermissionDefinition[]>([]);
  const [managedNavigation, setManagedNavigation] = useState<NavigationManagementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<RoleDefinition | null>(null);
  const [draft, setDraft] = useState<RoleDraft>(emptyDraft);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<RoleDefinition | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [permissionSearch, setPermissionSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const [roleRows, permissionRows, navigationRows] = await Promise.all([
        rolesApi.list(false),
        rolesApi.permissions(),
        hasPermission(Permission.NavigationView)
          ? navigationApi.managementList().catch(() => [] as NavigationManagementItem[])
          : Promise.resolve([] as NavigationManagementItem[]),
      ]);
      setRoles(roleRows);
      setPermissions(permissionRows);
      setManagedNavigation(navigationRows);
    } catch (requestError) {
      setPageError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [hasPermission]);

  useEffect(() => {
    void load();
  }, [load]);

  const groups = useMemo(() => {
    const result = new Map<string, PermissionDefinition[]>();
    const query = permissionSearch.trim().toLocaleLowerCase('vi');
    permissions.filter((permission) => !query
      || permission.code.toLocaleLowerCase('vi').includes(query)
      || permission.name.toLocaleLowerCase('vi').includes(query)
      || permission.group.toLocaleLowerCase('vi').includes(query)).forEach((permission) => {
      const current = result.get(permission.group) ?? [];
      current.push(permission);
      result.set(permission.group, current);
    });
    return Array.from(result.entries());
  }, [permissionSearch, permissions]);

  const roleMenuPreview = useMemo(() => (managedNavigation.length > 0
    ? managedNavigation.map((item) => ({
      key: item.key,
      label: item.label,
      sortOrder: item.sortOrder,
      isEnabled: item.isEnabled,
      isVisible: item.isVisible,
      hasPath: Boolean(item.path),
      permissionCode: item.permissionCode,
    }))
    : getDefaultNavigationSeeds().map((item) => ({
      key: item.key,
      label: item.label,
      sortOrder: item.sortOrder,
      isEnabled: item.isEnabled,
      isVisible: item.isVisible,
      hasPath: Boolean(item.defaultPath),
      permissionCode: item.permissionCode,
    })))
    .filter((item) => item.isEnabled && item.isVisible && item.hasPath
      && (!item.permissionCode || draft.permissionCodes.includes(item.permissionCode)))
    .sort((left, right) => left.sortOrder - right.sortOrder || left.label.localeCompare(right.label, 'vi')),
  [draft.permissionCodes, managedNavigation]);

  const inactiveSelections = useMemo(() => permissions.filter((permission) =>
    permission.isActive === false && draft.permissionCodes.includes(permission.code)),
  [draft.permissionCodes, permissions]);

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft());
    setPermissionSearch('');
    setFormError(null);
    setPermissionSearch('');
    setEditorOpen(true);
  };

  const openEdit = (role: RoleDefinition) => {
    setEditing(role);
    setDraft({
      code: role.code,
      name: role.name,
      description: role.description ?? '',
      isActive: role.isActive,
      permissionCodes: role.code === 'admin'
        ? role.permissionCodes.filter((code) => permissions.find((item) => item.code === code)?.isActive !== false)
        : [...role.permissionCodes],
    });
    setFormError(null);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (saving) return;
    setEditorOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const togglePermission = (permission: PermissionDefinition) => {
    if (editing?.code === 'admin') return;
    const code = permission.code;
    if (permission.isActive === false && !draft.permissionCodes.includes(code)) return;
    setDraft((current) => ({
      ...current,
      permissionCodes: current.permissionCodes.includes(code)
        ? current.permissionCodes.filter((item) => item !== code)
        : [...current.permissionCodes, code],
    }));
  };

  const toggleGroup = (items: PermissionDefinition[]) => {
    if (editing?.code === 'admin') return;
    const codes = items.filter((item) => item.isActive !== false).map((item) => item.code);
    const allSelected = codes.every((code) => draft.permissionCodes.includes(code));
    setDraft((current) => ({
      ...current,
      permissionCodes: allSelected
        ? current.permissionCodes.filter((code) => !codes.includes(code))
        : Array.from(new Set([...current.permissionCodes, ...codes])),
    }));
  };

  const saveRole = async () => {
    if (inactiveSelections.length > 0) {
      setFormError('Bỏ chọn các quyền đã vô hiệu hóa trước khi lưu vai trò.');
      return;
    }
    if (!draft.code.trim() || !draft.name.trim() || draft.permissionCodes.length === 0) {
      setFormError('Vui lòng nhập mã, tên vai trò và chọn ít nhất một quyền.');
      return;
    }

    const payload: SaveRolePayload = {
      code: draft.code.trim().toLowerCase(),
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      isActive: draft.isActive,
      permissionCodes: draft.permissionCodes,
    };
    setSaving(true);
    setFormError(null);
    try {
      const affectsCurrentUser = Boolean(editing
        && (editing.id === user?.roleId || editing.code === user?.roleCode));
      if (editing) {
        await rolesApi.update(editing.id, payload);
        setSuccessMessage(`Đã cập nhật vai trò ${payload.name}.`);
      } else {
        await rolesApi.create(payload);
        setSuccessMessage(`Đã tạo vai trò ${payload.name}.`);
      }
      setEditorOpen(false);
      setEditing(null);
      await load();
      if (affectsCurrentUser) {
        await refreshUser().catch(() => undefined);
        refreshNavigation();
      }
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await rolesApi.delete(deleting.id);
      setSuccessMessage(`Đã xóa vai trò ${deleting.name}.`);
      setDeleting(null);
      await load();
    } catch (requestError) {
      setPageError(getApiErrorMessage(requestError));
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="min-w-0">
      <PageHeader
        title="Vai trò & quyền hạn"
        description="Cấp quyền theo vai trò và dùng vai trò đó khi quản lý tài khoản Admin."
        actions={canManage ? (
          <button
            type="button"
            onClick={openCreate}
            className="btn-press inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover sm:w-auto"
          >
            <Plus size={17} strokeWidth={1.8} aria-hidden="true" />
            Thêm vai trò
          </button>
        ) : undefined}
      />

      {successMessage ? (
        <div className="mb-5 rounded-admin-control border border-admin-status-success/30 bg-green-50 px-4 py-3 text-sm text-admin-status-success" role="status">
          {successMessage}
        </div>
      ) : null}

      {pageError ? (
        <div className="mb-5 rounded-admin-control border border-admin-status-error/30 bg-red-50 px-4 py-3 text-sm text-admin-status-error" role="alert">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{pageError}</span>
            <button type="button" onClick={() => void load()} className="inline-flex min-h-9 items-center gap-1.5 font-semibold underline underline-offset-2">
              <RefreshCw size={15} aria-hidden="true" /> Thử lại
            </button>
          </div>
        </div>
      ) : null}

      <section aria-labelledby="role-list-title">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="role-list-title" className="text-base font-semibold text-admin-text-primary">Danh sách vai trò</h2>
            <p className="mt-1 text-xs text-admin-text-muted">Vai trò hệ thống không thể xóa; vai trò đang có người dùng cũng được bảo vệ.</p>
          </div>
          <span className="text-xs text-admin-text-muted">{roles.length} vai trò</span>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center rounded-admin-panel border border-admin-border bg-admin-surface text-sm text-admin-text-secondary" role="status">
            Đang tải vai trò...
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {roles.map((role) => (
              <article key={role.id} className="rounded-admin-panel border border-admin-border bg-admin-surface p-4 shadow-admin-panel sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-admin-text-primary">{role.name}</h3>
                      {role.isSystem ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-admin-primary/10 px-2 py-1 text-[11px] font-semibold text-admin-primary">
                          <LockKeyhole size={12} aria-hidden="true" /> Hệ thống
                        </span>
                      ) : null}
                      <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${role.isActive ? 'bg-admin-status-success/10 text-admin-status-success' : 'bg-admin-muted text-admin-text-secondary'}`}>
                        {role.isActive ? 'Hoạt động' : 'Đã tắt'}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-admin-text-muted">{role.code}</p>
                  </div>
                  {canManage ? (
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(role)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-admin-control text-admin-text-secondary hover:bg-admin-muted hover:text-admin-primary"
                        aria-label={`Sửa vai trò ${role.name}`}
                      >
                        <Pencil size={17} aria-hidden="true" />
                      </button>
                      {!role.isSystem ? (
                        <button
                          type="button"
                          onClick={() => setDeleting(role)}
                          disabled={role.userCount > 0}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-admin-control text-admin-text-secondary hover:bg-admin-status-error/10 hover:text-admin-status-error disabled:cursor-not-allowed disabled:opacity-35"
                          aria-label={`Xóa vai trò ${role.name}`}
                          title={role.userCount > 0 ? 'Không thể xóa vai trò đang có người dùng.' : undefined}
                        >
                          <Trash2 size={17} aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <p className="mt-3 min-h-10 text-sm leading-5 text-admin-text-secondary">{role.description || 'Không có mô tả.'}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-admin-border pt-4 text-sm">
                  <div>
                    <dt className="inline-flex items-center gap-1.5 text-xs text-admin-text-muted"><UsersRound size={14} aria-hidden="true" /> Người dùng</dt>
                    <dd className="mt-1 font-semibold tabular-nums text-admin-text-primary">{role.userCount}</dd>
                  </div>
                  <div>
                    <dt className="inline-flex items-center gap-1.5 text-xs text-admin-text-muted"><KeyRound size={14} aria-hidden="true" /> Quyền được cấp</dt>
                    <dd className="mt-1 font-semibold tabular-nums text-admin-text-primary">{role.permissionCodes.length}/{permissions.length}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>

      <SettingsDialog
        open={editorOpen}
        title={editing ? `Cập nhật vai trò ${editing.name}` : 'Thêm vai trò'}
        description="Mỗi tài khoản nhận toàn bộ quyền của vai trò được gán."
        width="wide"
        onRequestClose={closeEditor}
        footer={
          <>
            <button type="button" onClick={closeEditor} disabled={saving} className="h-11 rounded-admin-control border border-admin-border bg-admin-card px-4 text-sm font-semibold text-admin-text-primary hover:bg-admin-muted disabled:opacity-50">
              Hủy
            </button>
            <button type="button" onClick={() => void saveRole()} disabled={saving || draft.permissionCodes.length === 0 || inactiveSelections.length > 0} className="h-11 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm vai trò'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="role-code" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Mã vai trò</label>
              <input
                id="role-code"
                value={draft.code}
                onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value }))}
                disabled={Boolean(editing)}
                className={inputClass}
                maxLength={80}
                pattern="[A-Za-z0-9._-]+"
                placeholder="vi-du: accountant"
                data-autofocus
              />
            </div>
            <div>
              <label htmlFor="role-name" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Tên vai trò</label>
              <input
                id="role-name"
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                className={inputClass}
                maxLength={120}
                placeholder="Ví dụ: Kế toán"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="role-description" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Mô tả</label>
              <textarea
                id="role-description"
                value={draft.description}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                className="min-h-20 w-full resize-y rounded-admin-control border border-admin-input-border bg-admin-card px-3 py-2.5 text-sm leading-5 text-admin-text-primary outline-none focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/15"
                maxLength={500}
              />
            </div>
          </div>

          <label className={`flex min-h-11 items-center gap-3 rounded-admin-control border border-admin-border px-3 text-sm text-admin-text-primary ${editing?.code === 'admin' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))}
              disabled={editing?.code === 'admin'}
              className="h-4 w-4 accent-admin-primary"
            />
            Vai trò đang hoạt động và có thể gán cho người dùng
          </label>

          <fieldset>
            <legend className="text-base font-semibold text-admin-text-primary">Quyền hạn</legend>
            <p className="mt-1 text-xs leading-5 text-admin-text-muted">Thay đổi quyền sẽ thu hồi các refresh token của người dùng thuộc vai trò.</p>
            {editing?.code === 'admin' ? (
              <div className="mt-3 rounded-admin-control border border-admin-primary/25 bg-admin-primary/5 px-3 py-2 text-xs leading-5 text-admin-primary" role="status">
                Vai trò quản trị viên luôn giữ toàn bộ quyền để tránh khóa hệ thống.
              </div>
            ) : null}
            {inactiveSelections.length ? (
              <div className="mt-3 rounded-admin-control border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950" role="alert">
                {inactiveSelections.length} quyền đã vô hiệu hóa vẫn đang được gán. Bỏ chọn các quyền này trước khi lưu vai trò.
              </div>
            ) : null}
            <label className="relative mt-4 block">
              <span className="sr-only">Tìm quyền trong vai trò</span>
              <Search size={16} className="pointer-events-none absolute left-3 top-3.5 text-admin-text-muted" aria-hidden="true" />
              <input value={permissionSearch} onChange={(event) => setPermissionSearch(event.target.value)} className={`${inputClass} pl-9`} placeholder="Tìm theo mã, tên hoặc nhóm quyền" />
            </label>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {groups.map(([group, items]) => {
                const activeItems = items.filter((item) => item.isActive !== false);
                const allSelected = activeItems.length > 0 && activeItems.every((item) => draft.permissionCodes.includes(item.code));
                return (
                  <section key={group} className="rounded-admin-control border border-admin-border p-3" aria-labelledby={`permission-group-${group}`}>
                    <div className="mb-2 flex items-center justify-between gap-3 border-b border-admin-border pb-2">
                      <h3 id={`permission-group-${group}`} className="text-sm font-semibold text-admin-text-primary">{group}</h3>
                      <button type="button" onClick={() => toggleGroup(items)} disabled={editing?.code === 'admin' || activeItems.length === 0} className="min-h-9 text-xs font-semibold text-admin-primary disabled:cursor-not-allowed disabled:opacity-50">
                        {allSelected ? 'Bỏ chọn nhóm' : 'Chọn cả nhóm'}
                      </button>
                    </div>
                    <div className="space-y-1">
                      {items.map((permission) => (
                        <label key={permission.code} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-admin-control px-2 py-2 hover:bg-admin-muted">
                          <input
                            type="checkbox"
                            checked={draft.permissionCodes.includes(permission.code)}
                            onChange={() => togglePermission(permission)}
                            disabled={editing?.code === 'admin' || (permission.isActive === false && !draft.permissionCodes.includes(permission.code))}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-admin-primary"
                          />
                          <span className="min-w-0">
                            <span className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-admin-text-primary">
                              {permission.name}
                              <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${permission.isSystem ? 'bg-admin-primary/10 text-admin-primary' : 'bg-violet-50 text-violet-700'}`}>{permission.isSystem ? 'Hệ thống' : 'Tùy chỉnh'}</span>
                              {permission.isActive === false ? <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800">Đã tắt</span> : null}
                            </span>
                            <span className="mt-0.5 block break-all font-mono text-[10px] text-admin-text-muted">{permission.code}</span>
                            <span className="mt-0.5 block text-xs leading-4 text-admin-text-muted">{permission.description}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </fieldset>
          <section aria-labelledby="role-menu-preview-title">
            <h3 id="role-menu-preview-title" className="text-base font-semibold text-admin-text-primary">Xem trước menu theo vai trò</h3>
            <p className="mt-1 text-xs text-admin-text-muted">Ưu tiên cấu hình navigation database; manifest mặc định chỉ được dùng khi API preview không khả dụng.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {roleMenuPreview.length ? roleMenuPreview.map((item) => (
                <div key={item.key} className="rounded-admin-control border border-admin-border bg-admin-muted/50 px-3 py-2 text-sm text-admin-text-primary">{item.label}</div>
              )) : <p className="text-sm text-admin-text-muted">Vai trò chưa có menu hiển thị phù hợp.</p>}
            </div>
          </section>
          {formError ? <p className="text-sm text-admin-status-error" role="alert">{formError}</p> : null}
        </div>
      </SettingsDialog>

      <SettingsDialog open={Boolean(deleting)} title="Xác nhận xóa vai trò" onRequestClose={() => !deleteBusy && setDeleting(null)}>
        {deleting ? (
          <ConfirmationPanel
            title={`Xóa vai trò ${deleting.name}?`}
            description="Vai trò và toàn bộ liên kết quyền sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác."
            confirmLabel="Xóa vai trò"
            busy={deleteBusy}
            onCancel={() => setDeleting(null)}
            onConfirm={() => void deleteRole()}
          />
        ) : null}
      </SettingsDialog>
    </div>
  );
};
