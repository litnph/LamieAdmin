import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Pencil, Plus, RefreshCw, UserRound } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { SettingsDialog } from '@/features/settings/components/SettingsDialog';
import { usersApi } from '../api/usersApi';
import type { AuthUser } from '@/features/auth/types';
import { UserRole } from '@/features/auth/types';
import { getApiErrorMessage } from '@/shared/utils/apiError';

const roleLabel: Record<UserRole, string> = {
  [UserRole.Admin]: 'Admin',
  [UserRole.Manager]: 'Quản lý',
  [UserRole.Staff]: 'Nhân viên',
};

const actionClass =
  'inline-flex h-11 w-11 items-center justify-center rounded-admin-control text-admin-text-secondary transition-colors hover:bg-admin-muted hover:text-admin-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary focus-visible:ring-offset-2';

export const UsersListPage: React.FC = () => {
  const [rows, setRows] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetUser = useMemo(() => rows.find((user) => user.id === resetId) ?? null, [resetId, rows]);

  const load = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      setRows(await usersApi.list());
    } catch (requestError) {
      setPageError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openReset = (userId: string) => {
    setResetId(userId);
    setNewPassword('');
    setResetError(null);
    setSuccessMessage(null);
  };

  const closeReset = () => {
    if (resetting) return;
    setResetId(null);
    setNewPassword('');
    setResetError(null);
  };

  const submitReset = async () => {
    if (!resetId) return;
    if (newPassword.length < 8) {
      setResetError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }

    setResetting(true);
    setResetError(null);
    try {
      await usersApi.resetPassword(resetId, newPassword);
      const accountName = resetUser?.fullName || resetUser?.email || 'tài khoản';
      setResetId(null);
      setNewPassword('');
      setSuccessMessage(`Đã đặt lại mật khẩu cho ${accountName}.`);
    } catch (requestError) {
      setResetError(getApiErrorMessage(requestError));
    } finally {
      setResetting(false);
    }
  };

  const content = (() => {
    if (loading) {
      return (
        <div
          className="flex min-h-64 items-center justify-center rounded-admin-panel border border-admin-border bg-admin-surface px-5 text-sm text-admin-text-secondary"
          role="status"
          aria-live="polite"
        >
          Đang tải danh sách người dùng…
        </div>
      );
    }

    if (pageError) {
      return (
        <section className="rounded-admin-panel border border-admin-status-error/30 bg-red-50 px-5 py-10 text-center" role="alert">
          <h2 className="text-base font-semibold text-admin-status-error">Không thể tải danh sách người dùng</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-admin-status-error">{pageError}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-admin-control border border-admin-status-error/35 bg-admin-surface px-4 text-sm font-semibold text-admin-status-error transition-colors hover:bg-red-100"
          >
            <RefreshCw size={17} aria-hidden="true" />
            Thử lại
          </button>
        </section>
      );
    }

    if (rows.length === 0) {
      return (
        <section className="flex min-h-64 flex-col items-center justify-center rounded-admin-panel border border-admin-border bg-admin-surface px-5 py-10 text-center" role="status">
          <span className="flex h-11 w-11 items-center justify-center rounded-admin-control bg-admin-muted text-admin-text-secondary" aria-hidden="true">
            <UserRound size={21} />
          </span>
          <h2 className="mt-4 text-base font-semibold text-admin-text-primary">Chưa có người dùng</h2>
          <p className="mt-1 max-w-md text-sm leading-6 text-admin-text-secondary">Tạo tài khoản đầu tiên để phân quyền vận hành cửa hàng.</p>
        </section>
      );
    }

    return (
      <>
        <div className="space-y-3 md:hidden" aria-label="Danh sách tài khoản quản trị">
          {rows.map((user) => (
            <article key={user.id} className="rounded-admin-panel border border-admin-border bg-admin-surface p-4 shadow-admin-panel">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-admin-text-primary">{user.fullName}</h2>
                  <p className="mt-1 truncate text-sm text-admin-text-secondary" title={user.email}>{user.email}</p>
                </div>
                <span
                  className={[
                    'shrink-0 rounded-md px-2 py-1 text-xs font-semibold',
                    user.isActive
                      ? 'bg-admin-status-success/10 text-admin-status-success'
                      : 'bg-admin-muted text-admin-text-secondary',
                  ].join(' ')}
                >
                  {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-admin-border pt-4 text-sm">
                <div>
                  <dt className="text-xs text-admin-text-muted">Tên đăng nhập</dt>
                  <dd className="mt-1 truncate font-medium text-admin-text-primary" title={user.userName}>{user.userName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-admin-text-muted">Vai trò</dt>
                  <dd className="mt-1 font-medium text-admin-text-primary">{roleLabel[user.role]}</dd>
                </div>
              </dl>
              <div className="mt-4 flex justify-end gap-1 border-t border-admin-border pt-3">
                <Link to={`/admin/users/${user.id}/edit`} className={actionClass} aria-label={`Sửa người dùng ${user.fullName}`}>
                  <Pencil size={18} aria-hidden="true" />
                </Link>
                <button type="button" onClick={() => openReset(user.id)} className={actionClass} aria-label={`Đặt lại mật khẩu cho ${user.fullName}`}>
                  <KeyRound size={18} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto rounded-admin-panel border border-admin-border bg-admin-surface shadow-admin-panel md:block">
          <table className="w-full min-w-[760px] text-left text-sm">
            <caption className="sr-only">Danh sách tài khoản quản trị</caption>
            <thead className="bg-admin-muted/70 text-xs font-semibold uppercase tracking-wide text-admin-text-secondary">
              <tr>
                <th scope="col" className="px-4 py-3">Email</th>
                <th scope="col" className="px-4 py-3">Tên</th>
                <th scope="col" className="px-4 py-3">Vai trò</th>
                <th scope="col" className="px-4 py-3">Trạng thái</th>
                <th scope="col" className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {rows.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-admin-muted/45">
                  <th scope="row" className="px-4 py-3.5 font-normal">
                    <span className="block font-medium text-admin-text-primary">{user.email}</span>
                    <span className="mt-0.5 block text-xs text-admin-text-muted">{user.userName}</span>
                  </th>
                  <td className="px-4 py-3.5 text-admin-text-primary">{user.fullName}</td>
                  <td className="px-4 py-3.5 text-admin-text-secondary">{roleLabel[user.role]}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={[
                        'inline-flex rounded-md px-2 py-1 text-xs font-semibold',
                        user.isActive
                          ? 'bg-admin-status-success/10 text-admin-status-success'
                          : 'bg-admin-muted text-admin-text-secondary',
                      ].join(' ')}
                    >
                      {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Link to={`/admin/users/${user.id}/edit`} className={actionClass} aria-label={`Sửa người dùng ${user.fullName}`}>
                        <Pencil size={18} aria-hidden="true" />
                      </Link>
                      <button type="button" onClick={() => openReset(user.id)} className={actionClass} aria-label={`Đặt lại mật khẩu cho ${user.fullName}`}>
                        <KeyRound size={18} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  })();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title="Người dùng" subtitle="Quản lý tài khoản và vai trò truy cập hệ thống." />
        <Link
          to="/admin/users/new"
          className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-admin-primary-hover sm:w-auto"
        >
          <Plus size={18} aria-hidden="true" />
          Tạo người dùng
        </Link>
      </div>

      {successMessage ? (
        <div className="rounded-admin-control border border-admin-status-success/25 bg-admin-status-success/10 px-4 py-3 text-sm text-admin-status-success" role="status" aria-live="polite">
          {successMessage}
        </div>
      ) : null}

      {content}

      <SettingsDialog
        open={Boolean(resetId)}
        title="Đặt lại mật khẩu"
        description={resetUser ? `Tạo mật khẩu mới cho ${resetUser.fullName}.` : 'Tạo mật khẩu mới cho tài khoản đã chọn.'}
        closeLabel="Đóng hộp thoại đặt lại mật khẩu"
        onRequestClose={closeReset}
        footer={
          <>
            <button
              type="button"
              onClick={closeReset}
              disabled={resetting}
              className="h-11 rounded-admin-control border border-admin-border bg-admin-surface px-4 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="reset-user-password-form"
              disabled={resetting || newPassword.length < 8}
              className="h-11 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resetting ? 'Đang lưu…' : 'Lưu mật khẩu'}
            </button>
          </>
        }
      >
        <form
          id="reset-user-password-form"
          onSubmit={(event) => {
            event.preventDefault();
            void submitReset();
          }}
          className="space-y-3"
        >
          <div>
            <label htmlFor="reset-user-password" className="block text-sm font-medium text-admin-text-primary">
              Mật khẩu mới
            </label>
            <input
              id="reset-user-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              data-autofocus
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value);
                setResetError(null);
              }}
              aria-describedby={`reset-password-help${resetError ? ' reset-password-error' : ''}`}
              aria-invalid={Boolean(resetError)}
              className="mt-2 h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-surface px-3 text-sm text-admin-text-primary outline-none transition-colors focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/15"
            />
            <p id="reset-password-help" className="mt-1.5 text-xs leading-5 text-admin-text-secondary">
              Sử dụng ít nhất 8 ký tự.
            </p>
          </div>
          {resetError ? (
            <p id="reset-password-error" className="rounded-admin-control border border-admin-status-error/30 bg-red-50 px-3 py-2 text-sm text-admin-status-error" role="alert">
              {resetError}
            </p>
          ) : null}
        </form>
      </SettingsDialog>
    </div>
  );
};
