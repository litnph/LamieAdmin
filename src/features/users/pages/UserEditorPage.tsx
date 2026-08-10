import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { usersApi } from '../api/usersApi';
import { UserRole } from '@/features/auth/types';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { rolesApi } from '@/features/roles/api/rolesApi';
import type { RoleDefinition } from '@/features/roles/types/role.types';

const inputClass =
  'h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-surface px-3 text-sm text-admin-text-primary outline-none transition-colors placeholder:text-admin-text-muted focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/15';

const labelClass = 'mb-2 block text-sm font-medium text-admin-text-primary';

type Props = { userId?: string };

const UserEditor: React.FC<Props> = ({ userId }) => {
  const navigate = useNavigate();
  const isEdit = Boolean(userId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [roleId, setRoleId] = useState('');
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [roleRows, user] = await Promise.all([
        rolesApi.list(false),
        userId ? usersApi.getById(userId) : Promise.resolve(null),
      ]);
      setRoles(roleRows);
      if (user) {
        setEmail(user.email);
        setUserName(user.userName);
        setFullName(user.fullName);
        setPhone(user.phone ?? '');
        setRoleId(user.roleId ?? roleRows.find((item) => item.code === UserRole[user.role].toLowerCase())?.id ?? '');
        setIsActive(user.isActive);
      } else {
        setRoleId(roleRows.find((item) => item.code === 'staff' && item.isActive)?.id ?? roleRows.find((item) => item.isActive)?.id ?? '');
      }
    } catch (requestError) {
      setLoadError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSubmitError(null);
    try {
      const selectedRole = roles.find((item) => item.id === roleId);
      if (!selectedRole) throw new Error('Vui lòng chọn một vai trò đang tồn tại.');
      const legacyRole = selectedRole.code === 'admin'
        ? UserRole.Admin
        : selectedRole.code === 'manager'
          ? UserRole.Manager
          : UserRole.Staff;
      if (isEdit && userId) {
        await usersApi.update(userId, { fullName, phone: phone || undefined, role: legacyRole, roleId, isActive });
      } else {
        await usersApi.create({
          email,
          userName,
          password,
          fullName,
          phone: phone || undefined,
          role: legacyRole,
          roleId,
          isActive,
        });
      }
      navigate('/admin/users');
    } catch (requestError) {
      setSubmitError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const heading = isEdit ? 'Sửa người dùng' : 'Tạo người dùng';
  const subtitle = isEdit
    ? 'Cập nhật thông tin, vai trò và trạng thái tài khoản.'
    : 'Tạo tài khoản mới và chọn vai trò phù hợp.';

  if (loading) {
    return (
      <div className="max-w-2xl space-y-5">
        <PageHeader title={heading} subtitle={subtitle} />
        <div
          className="flex min-h-64 items-center justify-center rounded-admin-panel border border-admin-border bg-admin-surface px-5 text-sm text-admin-text-secondary"
          role="status"
          aria-live="polite"
        >
          Đang tải thông tin người dùng…
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-2xl space-y-5">
        <Link
          to="/admin/users"
          className="inline-flex min-h-11 items-center gap-2 rounded-admin-control px-2 text-sm font-medium text-admin-text-secondary transition-colors hover:bg-admin-muted hover:text-admin-primary"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Danh sách người dùng
        </Link>
        <PageHeader title={heading} subtitle={subtitle} />
        <section className="rounded-admin-panel border border-admin-status-error/30 bg-red-50 px-5 py-10 text-center" role="alert">
          <h2 className="text-base font-semibold text-admin-status-error">Không thể tải người dùng</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-admin-status-error">{loadError}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-admin-control border border-admin-status-error/35 bg-admin-surface px-4 text-sm font-semibold text-admin-status-error transition-colors hover:bg-red-100"
          >
            <RefreshCw size={17} aria-hidden="true" />
            Thử lại
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      <Link
        to="/admin/users"
        className="inline-flex min-h-11 items-center gap-2 rounded-admin-control px-2 text-sm font-medium text-admin-text-secondary transition-colors hover:bg-admin-muted hover:text-admin-primary"
      >
        <ArrowLeft size={17} aria-hidden="true" />
        Danh sách người dùng
      </Link>

      <PageHeader title={heading} subtitle={subtitle} />

      {submitError ? (
        <div id="user-submit-error" className="rounded-admin-control border border-admin-status-error/30 bg-red-50 px-4 py-3 text-sm text-admin-status-error" role="alert">
          Không thể lưu người dùng: {submitError}
        </div>
      ) : null}

      <form
        onSubmit={(event) => void submit(event)}
        className="space-y-5 rounded-admin-panel border border-admin-border bg-admin-surface p-4 shadow-admin-panel sm:p-6"
        aria-describedby={submitError ? 'user-submit-error' : undefined}
      >
        {!isEdit ? (
          <fieldset className="space-y-4">
            <legend className="text-base font-semibold text-admin-text-primary">Thông tin đăng nhập</legend>
            <div>
              <label htmlFor="user-email" className={labelClass}>Email</label>
              <input
                id="user-email"
                type="email"
                autoComplete="email"
                className={inputClass}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="user-name" className={labelClass}>Tên đăng nhập</label>
              <input
                id="user-name"
                autoComplete="username"
                className={inputClass}
                value={userName}
                onChange={(event) => setUserName(event.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="user-password" className={labelClass}>Mật khẩu</label>
              <input
                id="user-password"
                type="password"
                autoComplete="new-password"
                className={inputClass}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                aria-describedby="user-password-help"
              />
              <p id="user-password-help" className="mt-1.5 text-xs leading-5 text-admin-text-secondary">
                Sử dụng ít nhất 8 ký tự.
              </p>
            </div>
          </fieldset>
        ) : null}

        <fieldset className="space-y-4 border-t border-admin-border pt-5">
          <legend className="mb-4 text-base font-semibold text-admin-text-primary">Thông tin tài khoản</legend>
          <div>
            <label htmlFor="user-full-name" className={labelClass}>Họ tên</label>
            <input
              id="user-full-name"
              autoComplete="name"
              className={inputClass}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="user-phone" className={labelClass}>Số điện thoại</label>
            <input
              id="user-phone"
              type="tel"
              autoComplete="tel"
              className={inputClass}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="user-role" className={labelClass}>Vai trò</label>
            <select
              id="user-role"
              className={inputClass}
              value={roleId}
              onChange={(event) => setRoleId(event.target.value)}
              required
            >
              <option value="">Chọn vai trò</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id} disabled={!role.isActive && role.id !== roleId}>
                  {role.name}{role.isActive ? '' : ' (đã tắt)'}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs leading-5 text-admin-text-secondary">Quyền truy cập được lấy từ vai trò đã chọn.</p>
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-admin-control border border-admin-border px-3 text-sm text-admin-text-primary">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4 accent-admin-primary"
            />
            Tài khoản đang hoạt động
          </label>
        </fieldset>

        <div className="flex flex-col-reverse gap-2 border-t border-admin-border pt-5 sm:flex-row sm:justify-end">
          <Link
            to="/admin/users"
            className="inline-flex min-h-11 items-center justify-center rounded-admin-control border border-admin-border bg-admin-surface px-5 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={saving}
            aria-busy={saving}
            className="min-h-11 rounded-admin-control bg-admin-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Đang lưu…' : 'Lưu người dùng'}
          </button>
        </div>
      </form>
    </div>
  );
};

export const UserCreatePage: React.FC = () => <UserEditor />;

export const UserEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <UserEditor userId={id} />;
};
