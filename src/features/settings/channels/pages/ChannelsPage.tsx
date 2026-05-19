import React, { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/shared/components/PageHeader';
import { channelsApi, type ChannelDto } from '../api/channelsApi';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Pencil, Plus, Trash2, X } from 'lucide-react';

const inputClass =
  'w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary';

export const ChannelsPage: React.FC = () => {
  const { isAdmin, isManagerOrAbove } = useAuth();
  const [rows, setRows] = useState<ChannelDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ChannelDto | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await channelsApi.list());
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setCode('');
    setName('');
    setIconUrl('');
    setSortOrder(rows.length);
    setIsActive(true);
    setModal(true);
  };

  const openEdit = (c: ChannelDto) => {
    setEditing(c);
    setCode(c.code);
    setName(c.name);
    setIconUrl(c.iconUrl ?? '');
    setSortOrder(c.sortOrder);
    setIsActive(c.isActive);
    setModal(true);
  };

  const save = async () => {
    if (!isManagerOrAbove) return;
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await channelsApi.update({
          id: editing.id,
          name,
          iconUrl: iconUrl || undefined,
          sortOrder,
          isActive,
        });
      } else {
        await channelsApi.create({
          code: code.trim().toUpperCase(),
          name,
          iconUrl: iconUrl || undefined,
          sortOrder,
          isActive,
        });
      }
      setModal(false);
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: ChannelDto) => {
    if (!isAdmin || !window.confirm(`Xóa kênh ${c.name}?`)) return;
    setError(null);
    try {
      await channelsApi.delete(c.id);
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Kênh bán hàng" subtitle="Meta, TikTok, Zalo… — master data đồng bộ với API." />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">{error}</div>
      )}

      <div className="flex justify-end">
        {isManagerOrAbove && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-admin-primary text-white text-sm font-medium hover:bg-admin-primary-hover"
          >
            <Plus size={18} /> Thêm kênh
          </button>
        )}
      </div>

      <div className="glass-strong rounded-2xl border border-white/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/60 text-slate-500 text-[11px] uppercase">
            <tr>
              <th className="text-left px-4 py-3">Mã</th>
              <th className="text-left px-4 py-3">Tên</th>
              <th className="text-left px-4 py-3">Thứ tự</th>
              <th className="text-left px-4 py-3">Hoạt động</th>
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
              rows.map((c) => (
                <tr key={c.id} className="hover:bg-white/50">
                  <td className="px-4 py-3 font-mono text-xs">{c.code}</td>
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3">{c.sortOrder}</td>
                  <td className="px-4 py-3">{c.isActive ? 'Có' : 'Không'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {isManagerOrAbove && (
                      <button type="button" onClick={() => openEdit(c)} className="p-1.5 text-slate-500 hover:text-admin-primary">
                        <Pencil size={16} />
                      </button>
                    )}
                    {isAdmin && (
                      <button type="button" onClick={() => void remove(c)} className="p-1.5 text-slate-500 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-slate-900">{editing ? 'Sửa kênh' : 'Kênh mới'}</h3>
              <button type="button" onClick={() => setModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            {!editing && (
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Mã (không đổi sau tạo)</label>
                <input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} placeholder="META" required />
              </div>
            )}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Tên hiển thị</label>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Icon URL (tuỳ chọn)</label>
              <input className={inputClass} value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Thứ tự</label>
              <input
                type="number"
                className={inputClass}
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Đang hoạt động
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm">
                Đóng
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void save()}
                className="px-4 py-2 rounded-xl bg-admin-primary text-white text-sm disabled:opacity-50"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
