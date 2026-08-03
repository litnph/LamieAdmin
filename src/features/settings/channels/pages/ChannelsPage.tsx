import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Permission } from '@/features/auth/permissions';
import { ConfirmationPanel, SettingsDialog } from '@/features/settings/components/SettingsDialog';
import { SettingsShell, SettingsStatus } from '@/features/settings/components/SettingsShell';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { channelsApi, type ChannelDto } from '../api/channelsApi';

type ChannelDraft = {
  code: string;
  name: string;
  iconUrl: string;
  sortOrder: number;
  isActive: boolean;
};

type ConfirmationKind = 'discard' | 'discard-navigation' | 'deactivate' | 'delete' | null;

const emptyDraft = (sortOrder: number): ChannelDraft => ({
  code: '',
  name: '',
  iconUrl: '',
  sortOrder,
  isActive: true,
});

const draftFromChannel = (channel: ChannelDto): ChannelDraft => ({
  code: channel.code,
  name: channel.name,
  iconUrl: channel.iconUrl ?? '',
  sortOrder: channel.sortOrder,
  isActive: channel.isActive,
});

const serializeDraft = (draft: ChannelDraft) => JSON.stringify(draft);

const fieldClass =
  'h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 text-sm text-admin-text-primary placeholder-admin-text-muted focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text';

export const ChannelsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, hasPermission } = useAuth();
  const canManageChannels = hasPermission(Permission.ChannelsManage);
  const [rows, setRows] = useState<ChannelDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ChannelDto | null>(null);
  const [draft, setDraft] = useState<ChannelDraft>(() => emptyDraft(0));
  const [initialDraft, setInitialDraft] = useState(() => serializeDraft(emptyDraft(0)));
  const [confirmation, setConfirmation] = useState<ConfirmationKind>(null);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      setRows(await channelsApi.list());
    } catch (error) {
      setPageError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isDirty = modalOpen && serializeDraft(draft) !== initialDraft;
  const isValid = draft.name.trim().length > 0 && draft.code.trim().length > 0 && Number.isFinite(draft.sortOrder);
  const canSave = canManageChannels && isDirty && isValid && !saving;

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;
    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!target || target.target === '_blank' || target.hasAttribute('download')) return;
      const url = new URL(target.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingNavigation(`${url.pathname}${url.search}${url.hash}`);
      setConfirmation('discard-navigation');
    };
    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, [isDirty]);

  const openCreate = () => {
    const nextDraft = emptyDraft(rows.length);
    setEditing(null);
    setDraft(nextDraft);
    setInitialDraft(serializeDraft(nextDraft));
    setFormError(null);
    setConfirmation(null);
    setModalOpen(true);
  };

  const openEdit = (channel: ChannelDto) => {
    const nextDraft = draftFromChannel(channel);
    setEditing(channel);
    setDraft(nextDraft);
    setInitialDraft(serializeDraft(nextDraft));
    setFormError(null);
    setConfirmation(null);
    setModalOpen(true);
  };

  const closeImmediately = useCallback(() => {
    setModalOpen(false);
    setConfirmation(null);
    setPendingNavigation(null);
    setFormError(null);
  }, []);

  const requestClose = useCallback(() => {
    if (saving) return;
    if (isDirty) {
      setConfirmation('discard');
      return;
    }
    closeImmediately();
  }, [closeImmediately, isDirty, saving]);

  const persistSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await channelsApi.update({
          id: editing.id,
          name: draft.name.trim(),
          iconUrl: draft.iconUrl.trim() || undefined,
          sortOrder: draft.sortOrder,
          isActive: draft.isActive,
        });
        setSuccessMessage(`Đã cập nhật kênh ${draft.name.trim()}.`);
      } else {
        await channelsApi.create({
          code: draft.code.trim().toUpperCase(),
          name: draft.name.trim(),
          iconUrl: draft.iconUrl.trim() || undefined,
          sortOrder: draft.sortOrder,
          isActive: draft.isActive,
        });
        setSuccessMessage(`Đã tạo kênh ${draft.name.trim()}.`);
      }
      closeImmediately();
      await load();
    } catch (error) {
      setFormError(getApiErrorMessage(error));
      setConfirmation(null);
    } finally {
      setSaving(false);
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    if (editing?.isActive && !draft.isActive) {
      setConfirmation('deactivate');
      return;
    }
    void persistSave();
  };

  const remove = async () => {
    if (!editing || !isAdmin) return;
    setSaving(true);
    setFormError(null);
    try {
      await channelsApi.delete(editing.id);
      setSuccessMessage(`Đã xóa kênh ${editing.name}.`);
      closeImmediately();
      await load();
    } catch (error) {
      setFormError(getApiErrorMessage(error));
      setConfirmation(null);
    } finally {
      setSaving(false);
    }
  };

  const confirmDiscard = () => {
    const destination = pendingNavigation;
    closeImmediately();
    if (destination) navigate(destination);
  };

  const confirmationContent = (() => {
    if (confirmation === 'discard' || confirmation === 'discard-navigation') {
      return (
        <ConfirmationPanel
          title="Bỏ các thay đổi chưa lưu?"
          description="Các giá trị bạn vừa nhập sẽ bị mất. Hành động này không thể hoàn tác."
          confirmLabel="Bỏ thay đổi"
          onCancel={() => {
            setConfirmation(null);
            setPendingNavigation(null);
          }}
          onConfirm={confirmDiscard}
        />
      );
    }
    if (confirmation === 'deactivate') {
      return (
        <ConfirmationPanel
          title="Vô hiệu hóa kênh bán này?"
          description="Kênh sẽ không còn được xem là đang hoạt động. Các đơn cũ vẫn giữ tham chiếu đến kênh này."
          confirmLabel="Vô hiệu hóa"
          busy={saving}
          tone="warning"
          onCancel={() => setConfirmation(null)}
          onConfirm={() => void persistSave()}
        />
      );
    }
    if (confirmation === 'delete') {
      return (
        <ConfirmationPanel
          title={`Xóa kênh ${editing?.name ?? ''}?`}
          description="Kênh sẽ bị xóa khỏi cấu hình. API có thể từ chối nếu kênh đang được đơn hàng sử dụng."
          confirmLabel="Xóa kênh"
          busy={saving}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => void remove()}
        />
      );
    }
    return null;
  })();

  const dialogTitle = confirmation ? 'Xác nhận thay đổi' : editing ? 'Chỉnh sửa kênh bán' : 'Thêm kênh bán';

  return (
    <SettingsShell
      title="Kênh bán"
      description="Kênh xác định nguồn tiếp nhận đơn. Mã kênh không thể đổi sau khi tạo."
      actions={
        <>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-admin-control border border-admin-border bg-admin-card px-3 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <RefreshCw size={17} strokeWidth={1.8} aria-hidden="true" />
            Tải lại
          </button>
          {canManageChannels ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover sm:w-auto"
            >
              <Plus size={18} strokeWidth={1.8} aria-hidden="true" />
              Thêm kênh
            </button>
          ) : null}
        </>
      }
    >
      <div className="space-y-4">
        {successMessage ? <SettingsStatus kind="success">{successMessage}</SettingsStatus> : null}
        {pageError ? <SettingsStatus kind="error">Không thể tải kênh bán: {pageError}</SettingsStatus> : null}
        {!canManageChannels ? (
          <SettingsStatus kind="info">Tài khoản của bạn chỉ có quyền xem kênh bán. Liên hệ quản lý để thay đổi cấu hình.</SettingsStatus>
        ) : null}

        <div className="overflow-hidden rounded-admin-panel border border-admin-border bg-admin-card shadow-admin-panel">
          <div className="hidden md:block">
            <table className="w-full table-fixed text-left text-sm">
              <caption className="sr-only">Danh sách kênh bán và trạng thái cấu hình</caption>
              <thead className="border-b border-admin-border bg-admin-muted/55 text-xs text-admin-text-muted">
                <tr>
                  <th scope="col" className="w-[18%] px-4 py-3 font-semibold">Mã</th>
                  <th scope="col" className="w-[36%] px-4 py-3 font-semibold">Tên hiển thị</th>
                  <th scope="col" className="w-[16%] px-4 py-3 font-semibold">Thứ tự</th>
                  <th scope="col" className="w-[18%] px-4 py-3 font-semibold">Trạng thái</th>
                  <th scope="col" className="w-[12%] px-4 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {loading ? (
                  Array.from({ length: 3 }, (_, index) => (
                    <tr key={index} aria-hidden="true">
                      <td colSpan={5} className="px-4 py-4">
                        <div className="h-5 animate-pulse rounded bg-admin-muted" />
                      </td>
                    </tr>
                  ))
                ) : pageError ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-admin-text-secondary">
                      Dữ liệu kênh bán tạm thời chưa khả dụng. Dùng nút Tải lại để thử lại.
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center">
                      <p className="font-semibold text-admin-text-primary">Chưa có kênh bán</p>
                      <p className="mt-1 text-sm text-admin-text-muted">Tạo kênh đầu tiên khi cửa hàng bắt đầu nhận đơn từ một nguồn mới.</p>
                    </td>
                  </tr>
                ) : (
                  rows.map((channel) => (
                    <tr key={channel.id} className="transition-colors hover:bg-admin-muted/35">
                      <td className="truncate px-4 py-3.5 font-mono text-xs text-admin-text-secondary">{channel.code}</td>
                      <td className="truncate px-4 py-3.5 font-medium text-admin-text-primary">{channel.name}</td>
                      <td className="px-4 py-3.5 tabular-nums text-admin-text-secondary">{channel.sortOrder}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={[
                            'inline-flex rounded-md px-2 py-1 text-xs font-semibold',
                            channel.isActive
                              ? 'bg-admin-status-success/10 text-admin-status-success'
                              : 'bg-admin-muted text-admin-text-muted',
                          ].join(' ')}
                        >
                          {channel.isActive ? 'Đang hoạt động' : 'Đã tắt'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {canManageChannels ? (
                          <button
                            type="button"
                            onClick={() => openEdit(channel)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-admin-control text-admin-text-secondary transition-colors hover:bg-admin-primary/10 hover:text-admin-primary"
                            aria-label={`Chỉnh sửa kênh ${channel.name}`}
                          >
                            <Pencil size={17} strokeWidth={1.8} aria-hidden="true" />
                          </button>
                        ) : (
                          <span className="text-xs text-admin-text-muted">Chỉ xem</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-admin-border md:hidden">
            {loading ? (
              Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="p-4" aria-hidden="true">
                  <div className="h-20 animate-pulse rounded-admin-control bg-admin-muted" />
                </div>
              ))
            ) : pageError ? (
              <div className="px-4 py-9 text-center text-sm leading-6 text-admin-text-secondary">
                Dữ liệu kênh bán tạm thời chưa khả dụng. Dùng nút Tải lại để thử lại.
              </div>
            ) : rows.length === 0 ? (
              <div className="px-4 py-9 text-center">
                <p className="font-semibold text-admin-text-primary">Chưa có kênh bán</p>
                <p className="mt-1 text-sm leading-5 text-admin-text-muted">Tạo kênh đầu tiên khi cửa hàng nhận đơn từ một nguồn mới.</p>
              </div>
            ) : (
              rows.map((channel) => (
                <article key={channel.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-admin-text-primary">{channel.name}</h3>
                      <p className="mt-1 font-mono text-xs text-admin-text-muted">{channel.code}</p>
                    </div>
                    <span
                      className={[
                        'shrink-0 rounded-md px-2 py-1 text-xs font-semibold',
                        channel.isActive
                          ? 'bg-admin-status-success/10 text-admin-status-success'
                          : 'bg-admin-muted text-admin-text-muted',
                      ].join(' ')}
                    >
                      {channel.isActive ? 'Hoạt động' : 'Đã tắt'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-admin-border pt-3">
                    <span className="text-xs text-admin-text-secondary">Thứ tự: {channel.sortOrder}</span>
                    {canManageChannels ? (
                      <button
                        type="button"
                        onClick={() => openEdit(channel)}
                        className="inline-flex h-10 items-center gap-2 rounded-admin-control border border-admin-border px-3 text-sm font-semibold text-admin-text-primary"
                      >
                        <Pencil size={16} strokeWidth={1.8} aria-hidden="true" />
                        Chỉnh sửa
                      </button>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>

      <SettingsDialog
        open={modalOpen}
        title={dialogTitle}
        description={confirmation ? 'Kiểm tra tác động trước khi tiếp tục.' : 'Mỗi kênh được lưu riêng ngay khi bạn xác nhận.'}
        onRequestClose={requestClose}
        focusKey={confirmation ?? 'form'}
        footer={
          confirmation ? undefined : (
            <>
              <button
                type="button"
                onClick={requestClose}
                disabled={saving}
                className="h-11 w-full rounded-admin-control border border-admin-border bg-admin-card px-4 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted disabled:opacity-50 sm:w-auto"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="channel-settings-form"
                disabled={!canSave}
                className="h-11 w-full rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text sm:w-auto"
              >
                {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Tạo kênh'}
              </button>
            </>
          )
        }
      >
        {confirmationContent ?? (
          <form id="channel-settings-form" onSubmit={submit} className="space-y-5">
            {formError ? <SettingsStatus kind="error">Không thể lưu thay đổi: {formError}</SettingsStatus> : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="channel-code" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">
                  Mã kênh
                </label>
                <input
                  id="channel-code"
                  data-autofocus={!editing ? true : undefined}
                  className={fieldClass}
                  value={draft.code}
                  onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value }))}
                  placeholder="META"
                  required
                  disabled={Boolean(editing)}
                  aria-describedby="channel-code-help"
                />
                <p id="channel-code-help" className="mt-1.5 text-xs leading-5 text-admin-text-muted">
                  Viết hoa tự động khi lưu và không thể đổi sau khi tạo.
                </p>
              </div>
              <div>
                <label htmlFor="channel-order" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">
                  Thứ tự hiển thị
                </label>
                <input
                  id="channel-order"
                  type="number"
                  className={fieldClass}
                  value={draft.sortOrder}
                  onChange={(event) => setDraft((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="channel-name" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">
                Tên hiển thị
              </label>
              <input
                id="channel-name"
                data-autofocus={editing ? true : undefined}
                className={fieldClass}
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Facebook"
                required
              />
            </div>

            <div>
              <label htmlFor="channel-icon" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">
                URL biểu tượng
              </label>
              <input
                id="channel-icon"
                type="url"
                className={fieldClass}
                value={draft.iconUrl}
                onChange={(event) => setDraft((current) => ({ ...current, iconUrl: event.target.value }))}
                placeholder="https://example.com/icon.svg"
                aria-describedby="channel-icon-help"
              />
              <p id="channel-icon-help" className="mt-1.5 text-xs leading-5 text-admin-text-muted">
                Tùy chọn. Trang này chưa có API upload, vì vậy chỉ lưu URL hiện có.
              </p>
            </div>

            <div className="rounded-admin-control border border-admin-border bg-admin-muted/35 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <label htmlFor="channel-active" className="text-sm font-semibold text-admin-text-primary">
                    Kênh đang hoạt động
                  </label>
                  <p className="mt-1 text-xs leading-5 text-admin-text-secondary">
                    Tắt kênh có thể làm kênh không còn xuất hiện trong các luồng tạo và xử lý đơn mới.
                  </p>
                </div>
                <input
                  id="channel-active"
                  type="checkbox"
                  role="switch"
                  checked={draft.isActive}
                  onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-admin-input-border text-admin-primary focus:ring-admin-primary/25"
                />
              </div>
              {!draft.isActive ? (
                <p className="mt-3 rounded-admin-control border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950" role="status">
                  Bạn sẽ cần xác nhận tác động trước khi lưu trạng thái đã tắt.
                </p>
              ) : null}
            </div>

            {editing && isAdmin ? (
              <section className="rounded-admin-control border border-admin-status-error/30 bg-red-50/70 p-4" aria-labelledby="channel-danger-title">
                <h3 id="channel-danger-title" className="text-sm font-semibold text-admin-status-error">
                  Vùng nguy hiểm
                </h3>
                <p className="mt-1 text-xs leading-5 text-admin-text-secondary">
                  Xóa kênh có thể ảnh hưởng dữ liệu đang tham chiếu. Chỉ Admin được thực hiện thao tác này.
                </p>
                <button
                  type="button"
                  onClick={() => setConfirmation('delete')}
                  className="mt-3 h-11 rounded-admin-control border border-admin-status-error/45 bg-admin-card px-4 text-sm font-semibold text-admin-status-error transition-colors hover:bg-red-100"
                >
                  Xóa kênh
                </button>
              </section>
            ) : null}
          </form>
        )}
      </SettingsDialog>
    </SettingsShell>
  );
};
