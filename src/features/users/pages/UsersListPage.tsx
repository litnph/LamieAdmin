import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/shared/components/PageHeader';
import { usersApi } from '../api/usersApi';
import type { AuthUser } from '@/features/auth/types';
import { UserRole } from '@/features/auth/types';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { Pencil, KeyRound } from 'lucide-react';

const roleLabel: Record<UserRole, string> = {
  [UserRole.Admin]: 'Admin',
  [UserRole.Manager]: 'Quản lý',
  [UserRole.Staff]: 'Nhân viên',
};

export const UsersListPage: React.FC = () => {
  const [rows, setRows] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [newPw, setNewPw] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await usersApi.list());
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submitReset = async () => {
    if (!resetId || newPw.length < 8) return;
    try {
      await usersApi.resetPassword(resetId, newPw);
      setResetId(null);
      setNewPw('');
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <PageHeader title="Người dùng" subtitle="Chỉ Admin mới gọi được API quản lý user." />
        <Link
          to="/admin/users/new"
          className="self-end px-4 py-2 rounded-xl bg-admin-primary text-white text-sm font-medium hover:bg-admin-primary-hover h-fit"
        >
          Tạo user
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">{error}</div>
      )}

      <div className="glass-strong rounded-2xl border border-white/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/60 text-slate-500 text-[11px] uppercase">
            <tr>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Tên</th>
              <th className="text-left px-4 py-3">Vai trò</th>
              <th className="text-left px-4 py-3">Trạng thái</th>
              <th className="text-right px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  Đang tải…
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id} className="hover:bg-white/50">
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.fullName}</td>
                  <td className="px-4 py-3">{roleLabel[u.role]}</td>
                  <td className="px-4 py-3">{u.isActive ? 'Hoạt động' : 'Khoá'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Link to={`/admin/users/${u.id}/edit`} className="inline-flex p-1.5 text-slate-500 hover:text-admin-primary">
                      <Pencil size={16} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setResetId(u.id);
                        setNewPw('');
                      }}
                      className="inline-flex p-1.5 text-slate-500 hover:text-admin-primary"
                      title="Đặt lại mật khẩu"
                    >
                      <KeyRound size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {resetId && (
        <div className="glass-strong rounded-2xl border border-white/50 p-5 max-w-md space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">Đặt lại mật khẩu</h3>
          <input
            type="password"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
            placeholder="Mật khẩu mới (tối thiểu 8 ký tự)"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void submitReset()}
              className="px-4 py-2 rounded-xl bg-admin-primary text-white text-sm"
            >
              Lưu
            </button>
            <button type="button" onClick={() => setResetId(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm">
              Huỷ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
