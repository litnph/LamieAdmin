import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { usersApi } from '../api/usersApi';
import { UserRole } from '@/features/auth/types';
import { getApiErrorMessage } from '@/shared/utils/apiError';

const inputClass =
  'w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary';

type Props = { userId?: string };

const UserEditor: React.FC<Props> = ({ userId }) => {
  const navigate = useNavigate();
  const isEdit = !!userId;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.Staff);
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const u = await usersApi.getById(userId);
      setEmail(u.email);
      setUserName(u.userName);
      setFullName(u.fullName);
      setPhone(u.phone ?? '');
      setRole(u.role);
      setIsActive(u.isActive);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEdit && userId) {
        await usersApi.update(userId, { fullName, phone: phone || undefined, role, isActive });
        navigate('/admin/users');
      } else {
        await usersApi.create({
          email,
          userName,
          password,
          fullName,
          phone: phone || undefined,
          role,
          isActive,
        });
        navigate('/admin/users');
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500 py-16 text-center">Đang tải…</div>;
  }

  return (
    <div className="space-y-6 max-w-lg">
      <Link to="/admin/users" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-admin-primary">
        <ArrowLeft size={14} /> Danh sách
      </Link>
      <PageHeader title={isEdit ? 'Sửa người dùng' : 'Tạo người dùng'} subtitle="API /api/users (Admin)." />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">{error}</div>
      )}

      <form onSubmit={(e) => void submit(e)} className="glass-strong rounded-2xl border border-white/50 p-6 space-y-4">
        {!isEdit && (
          <>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Email</label>
              <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Tên đăng nhập</label>
              <input className={inputClass} value={userName} onChange={(e) => setUserName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Mật khẩu</label>
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
          </>
        )}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Họ tên</label>
          <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">SĐT</label>
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Vai trò</label>
          <select className={inputClass} value={role} onChange={(e) => setRole(Number(e.target.value) as UserRole)}>
            <option value={UserRole.Admin}>Admin</option>
            <option value={UserRole.Manager}>Quản lý</option>
            <option value={UserRole.Staff}>Nhân viên</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Đang hoạt động
        </label>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-admin-primary text-white text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Đang lưu…' : 'Lưu'}
          </button>
          <Link to="/admin/users" className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600">
            Huỷ
          </Link>
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
