import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { Badge } from '@/shared/components/Badge';
import { AttributesApi } from '../api/attributesApi';
import type {
  AttributeItem,
  AttributeItemColor,
  AttributeName,
  AttributeTranslation,
  LanguageAttributeItem,
} from '../types/attributes.types';

const ATTRIBUTE_TABS: Array<{ key: AttributeName; label: string }> = [
  { key: 'categories', label: 'Categories' },
  { key: 'collections', label: 'Collections' },
  { key: 'colors', label: 'Colors' },
  { key: 'languages', label: 'Languages' },
  { key: 'occasions', label: 'Occasions' },
  { key: 'styles', label: 'Styles' },
  { key: 'tags', label: 'Tags' },
];

const isValidAttribute = (value: string | undefined): value is AttributeName =>
  !!value && ATTRIBUTE_TABS.some((t) => t.key === value);

const getDefaultTranslation = (translations: AttributeTranslation[], preferred: string[]) => {
  for (const code of preferred) {
    const t = translations.find((x) => x.languageCode === code);
    if (t) return t;
  }
  return translations[0];
};

const hexToRgbString = (hex: string): string | null => {
  const normalized = hex.trim().toUpperCase();
  const match = /^#([0-9A-F]{6})$/.exec(normalized);
  if (!match) return null;
  const raw = match[1];
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return `${r},${g},${b}`;
};

type DraftBase = {
  id?: number;
  isActive: boolean;
  translations: AttributeTranslation[];
};

type DraftColor = DraftBase & { hexCode: string; rgbCode: string };

export const AttributesPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();

  const attribute: AttributeName = useMemo(() => {
    if (isValidAttribute(params.attributeKey)) return params.attributeKey;
    return 'categories';
  }, [params.attributeKey]);

  const isColor = attribute === 'colors';
  const isLanguage = attribute === 'languages';

  const [items, setItems] = useState<Array<AttributeItem | AttributeItemColor | LanguageAttributeItem>>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [languageOptions, setLanguageOptions] = useState<LanguageAttributeItem[]>([]);
  const [loadingLanguages, setLoadingLanguages] = useState(false);

  const [draft, setDraft] = useState<DraftBase | DraftColor>(() => ({
    isActive: true,
    translations: [
      { languageCode: 'vi', name: '', description: '' },
      { languageCode: 'en', name: '', description: '' },
    ],
    ...(isColor ? { hexCode: '#000000', rgbCode: '0,0,0' } : {}),
  }));

  const [languageDraft, setLanguageDraft] = useState<LanguageAttributeItem>(() => ({
    code: '',
    name: '',
    isActive: true,
  }));

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const resetDraft = () => {
    setDraft({
      isActive: true,
      translations: [
        { languageCode: '', name: '', description: '' },
      ],
      ...(isColor ? { hexCode: '#000000', rgbCode: '0,0,0' } : {}),
    } as any);
    setLanguageDraft({ code: '', name: '', isActive: true });
    setEditingId(null);
    setEditingCode(null);
  };

  const loadLanguages = async () => {
    setLoadingLanguages(true);
    try {
      const langs = await AttributesApi.getAllLanguages();
      setLanguageOptions(langs);
    } catch {
      setLanguageOptions([]);
    } finally {
      setLoadingLanguages(false);
    }
  };

  const openCreateModal = () => {
    resetDraft();
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetDraft();
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = isLanguage ? await AttributesApi.getAllLanguages() : await AttributesApi.getAll<any>(attribute);
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isValidAttribute(params.attributeKey)) {
      navigate('/admin/settings/attributes/categories', { replace: true });
      return;
    }
    resetDraft();
    void loadLanguages();
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attribute]);

  const canSubmit = useMemo(() => {
    if (isLanguage) {
      return languageDraft.code.trim().length > 0 && languageDraft.name.trim().length > 0;
    }
    const hasTranslationName = draft.translations.some((t) => (t.name ?? '').trim().length > 0);
    if (!hasTranslationName) return false;
    if (isColor) {
      const d = draft as DraftColor;
      return (d.hexCode ?? '').trim().length > 0 && (d.rgbCode ?? '').trim().length > 0;
    }
    return true;
  }, [draft, isColor, isLanguage, languageDraft.code, languageDraft.name]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      if (isLanguage) {
        if (editingCode != null) {
          await AttributesApi.updateLanguage(languageDraft);
        } else {
          await AttributesApi.createLanguage(languageDraft);
        }
      } else {
        if (editingId != null) {
          await AttributesApi.update(attribute, { id: editingId, ...(draft as any) });
        } else {
          const payload: any = { ...draft };
          delete payload.id;
          await AttributesApi.create(attribute, payload);
        }
      }
      resetDraft();
      setModalOpen(false);
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: AttributeItem | AttributeItemColor) => {
    setEditingId(item.id);
    setDraft({
      id: item.id,
      isActive: item.isActive,
      translations:
        item.translations?.length > 0
          ? item.translations.map((t) => ({
              languageCode: t.languageCode,
              name: t.name ?? '',
              description: t.description ?? '',
            }))
          : [
              { languageCode: 'vi', name: '', description: '' },
              { languageCode: 'en', name: '', description: '' },
            ],
      ...(isColor
        ? { hexCode: (item as AttributeItemColor).hexCode ?? '', rgbCode: (item as AttributeItemColor).rgbCode ?? '' }
        : {}),
    } as any);
    setModalOpen(true);
  };

  const startEditLanguage = (item: LanguageAttributeItem) => {
    setEditingCode(item.code);
    setLanguageDraft({ code: item.code, name: item.name, isActive: item.isActive });
    setModalOpen(true);
  };

  const remove = async (id: number) => {
    const ok = window.confirm('Delete this item?');
    if (!ok) return;
    setSaving(true);
    setError(null);
    try {
      await AttributesApi.remove(attribute, id);
      if (editingId === id) resetDraft();
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  const removeLanguage = async (code: string) => {
    const ok = window.confirm('Delete this item?');
    if (!ok) return;
    setSaving(true);
    setError(null);
    try {
      await AttributesApi.removeLanguage(code);
      if (editingCode === code) resetDraft();
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  const updateTranslation = (idx: number, patch: Partial<AttributeTranslation>) => {
    setDraft((prev: any) => {
      const next = { ...prev };
      const list = [...(next.translations ?? [])];
      list[idx] = { ...list[idx], ...patch };
      next.translations = list;
      return next;
    });
  };

  const addTranslation = () => {
    setDraft((prev: any) => ({
      ...prev,
      translations: [...(prev.translations ?? []), { languageCode: '', name: '', description: '' }],
    }));
  };

  const removeTranslation = (idx: number) => {
    setDraft((prev: any) => ({
      ...prev,
      translations: (prev.translations ?? []).filter((_: any, i: number) => i !== idx),
    }));
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Thuộc tính"
        description="Quản lý các thuộc tính masterdata dùng cho sản phẩm."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-admin-primary text-admin-text-inverse rounded-xl hover:bg-admin-primary-hover transition-colors shadow-lg shadow-admin-primary/20"
            >
              <Plus size={18} />
              <span className="text-sm font-medium">Tạo mới</span>
            </button>
            <button
              type="button"
              onClick={() => load()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-admin-card text-admin-text-primary rounded-xl border border-admin-border hover:bg-admin-muted transition-colors"
            >
              <RefreshCw size={18} />
              <span className="text-sm font-medium">Reload</span>
            </button>
          </div>
        }
      />

      <div className="bg-admin-card rounded-2xl shadow-sm border border-admin-border p-3">
        <div className="flex flex-wrap gap-2">
          {ATTRIBUTE_TABS.map((t) => (
            <NavLink
              key={t.key}
              to={`/admin/settings/attributes/${t.key}`}
              className={({ isActive }) =>
                `px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                  isActive
                    ? 'bg-admin-sidebar-active text-admin-text-primary border-admin-border'
                    : 'bg-admin-bg text-admin-text-secondary border-transparent hover:border-admin-border'
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </div>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            onClick={closeModal}
            aria-label="Close"
          />
          <div className="relative w-[min(900px,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] overflow-auto bg-admin-card rounded-2xl shadow-xl border border-admin-border">
            <div className="flex items-start justify-between gap-4 p-6 border-b border-admin-border">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-admin-text-primary">
                  {isLanguage
                    ? editingCode == null
                      ? 'Tạo mới language'
                      : `Sửa language: ${editingCode}`
                    : editingId == null
                      ? `Tạo mới ${attribute}`
                      : `Sửa ${attribute}: #${editingId}`}
                </p>
                <div className="flex items-center gap-2">
                  <Badge
                    status={
                      isLanguage
                        ? editingCode == null
                          ? 'Create'
                          : `Edit ${editingCode}`
                        : editingId == null
                          ? 'Create'
                          : `Edit #${editingId}`
                    }
                  />
                  {saving ? <span className="text-sm text-admin-text-secondary">Saving...</span> : null}
                  {error ? <span className="text-sm text-admin-status-error">{error}</span> : null}
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-xl border border-admin-border hover:bg-admin-muted transition-colors"
                aria-label="Close modal"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="p-6 space-y-5">
              <div className="flex items-center justify-end">
                <label className="inline-flex items-center gap-2 text-sm text-admin-text-secondary">
                  <input
                    type="checkbox"
                    className="rounded border-admin-input-border text-admin-primary focus:ring-admin-input-focus"
                    checked={isLanguage ? languageDraft.isActive : draft.isActive}
                    onChange={(e) =>
                      isLanguage
                        ? setLanguageDraft((prev) => ({ ...prev, isActive: e.target.checked }))
                        : setDraft((prev: any) => ({ ...prev, isActive: e.target.checked }))
                    }
                  />
                  Active
                </label>
              </div>

              {isLanguage ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-admin-text-secondary mb-1">Code</label>
                    <input
                      className="w-full px-3 py-2 text-sm rounded-lg border border-admin-input-border bg-admin-bg focus:outline-none focus:ring-2 focus:ring-admin-input-focus/20 focus:border-admin-input-focus"
                      value={languageDraft.code}
                      onChange={(e) => setLanguageDraft((prev) => ({ ...prev, code: e.target.value }))}
                      placeholder="vi"
                      required
                      disabled={editingCode != null}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-admin-text-secondary mb-1">Name</label>
                    <input
                      className="w-full px-3 py-2 text-sm rounded-lg border border-admin-input-border bg-admin-bg focus:outline-none focus:ring-2 focus:ring-admin-input-focus/20 focus:border-admin-input-focus"
                      value={languageDraft.name}
                      onChange={(e) => setLanguageDraft((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Tiếng Việt"
                      required
                    />
                  </div>
                </div>
              ) : null}

              {isColor ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-admin-text-secondary mb-1">Hex Code</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        className="h-10 w-14 rounded-xl border border-admin-border bg-admin-bg p-1"
                        value={(draft as DraftColor).hexCode}
                        onChange={(e) => {
                          const hexCode = e.target.value.toUpperCase();
                          const rgb = hexToRgbString(hexCode);
                          setDraft((prev: any) => ({
                            ...prev,
                            hexCode,
                            rgbCode: rgb ?? prev.rgbCode,
                          }));
                        }}
                        aria-label="Pick color"
                        title="Pick color"
                      />
                      <input
                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-admin-input-border bg-admin-bg focus:outline-none focus:ring-2 focus:ring-admin-input-focus/20 focus:border-admin-input-focus"
                        value={(draft as DraftColor).hexCode}
                        onChange={(e) => {
                          const hexCode = e.target.value.toUpperCase();
                          const rgb = hexToRgbString(hexCode);
                          setDraft((prev: any) => ({
                            ...prev,
                            hexCode,
                            rgbCode: rgb ?? prev.rgbCode,
                          }));
                        }}
                        placeholder="#FF0000"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-admin-text-secondary mb-1">RGB Code</label>
                    <input
                      className="w-full px-3 py-2 text-sm rounded-lg border border-admin-input-border bg-admin-bg focus:outline-none focus:ring-2 focus:ring-admin-input-focus/20 focus:border-admin-input-focus"
                      value={(draft as DraftColor).rgbCode}
                      onChange={(e) => setDraft((prev: any) => ({ ...prev, rgbCode: e.target.value }))}
                      placeholder="255,0,0"
                      required
                      disabled
                    />
                    <p className="mt-1 text-[11px] text-admin-text-secondary">Tự động theo Hex.</p>
                  </div>
                </div>
              ) : null}

              {!isLanguage ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-admin-text-primary">Translations</p>
                    <button
                      type="button"
                      onClick={addTranslation}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-admin-muted text-admin-text-primary rounded-xl hover:bg-admin-muted/80 transition-colors"
                    >
                      <Plus size={16} />
                      <span className="text-sm font-medium">Add translation</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {draft.translations.map((t, idx) => (
                      <div key={`${t.languageCode}-${idx}`} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-admin-text-secondary mb-1">Language</label>
                          <select
                            className="w-full px-3 py-2 text-sm rounded-lg border border-admin-input-border bg-admin-bg focus:outline-none focus:ring-2 focus:ring-admin-input-focus/20 focus:border-admin-input-focus"
                            value={t.languageCode}
                            onChange={(e) => updateTranslation(idx, { languageCode: e.target.value })}
                            required
                            disabled={loadingLanguages}
                          >
                            <option value="" disabled>
                              {loadingLanguages ? 'Loading...' : 'Select'}
                            </option>
                            {languageOptions
                              .filter((opt) => {
                                const used = draft.translations
                                  .filter((_, i) => i !== idx)
                                  .map((x) => x.languageCode)
                                  .filter(Boolean);
                                return !used.includes(opt.code);
                              })
                              .map((opt) => (
                                <option key={opt.code} value={opt.code}>
                                  {opt.code} - {opt.name}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-xs font-medium text-admin-text-secondary mb-1">Name</label>
                          <input
                            className="w-full px-3 py-2 text-sm rounded-lg border border-admin-input-border bg-admin-bg focus:outline-none focus:ring-2 focus:ring-admin-input-focus/20 focus:border-admin-input-focus"
                            value={t.name}
                            onChange={(e) => updateTranslation(idx, { name: e.target.value })}
                            placeholder="Tên hiển thị"
                            required
                          />
                        </div>
                        <div className="md:col-span-5">
                          <label className="block text-xs font-medium text-admin-text-secondary mb-1">Description</label>
                          <input
                            className="w-full px-3 py-2 text-sm rounded-lg border border-admin-input-border bg-admin-bg focus:outline-none focus:ring-2 focus:ring-admin-input-focus/20 focus:border-admin-input-focus"
                            value={t.description ?? ''}
                            onChange={(e) => updateTranslation(idx, { description: e.target.value })}
                            placeholder="Mô tả (tuỳ chọn)"
                          />
                        </div>
                        <div className="md:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeTranslation(idx)}
                            className="p-2 rounded-xl border border-admin-border hover:bg-admin-muted transition-colors text-admin-text-secondary hover:text-admin-status-error"
                            title="Remove translation"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-admin-card text-admin-text-primary rounded-xl border border-admin-border hover:bg-admin-muted transition-colors"
                >
                  <span className="text-sm font-medium">Hủy</span>
                </button>
                <button
                  type="submit"
                  disabled={saving || loading || !canSubmit}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-admin-primary text-admin-text-inverse rounded-xl hover:bg-admin-primary-hover transition-colors shadow-lg shadow-admin-primary/20 disabled:opacity-60"
                >
                  <span className="text-sm font-medium">{isLanguage ? (editingCode == null ? 'Lưu' : 'Cập nhật') : editingId == null ? 'Lưu' : 'Cập nhật'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="bg-admin-card rounded-2xl shadow-sm border border-admin-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-admin-border bg-admin-muted/50">
                {isLanguage ? (
                  <>
                    <th className="px-6 py-3 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">Name</th>
                  </>
                ) : (
                  <th className="px-6 py-3 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">ID</th>
                )}
                {!isLanguage && isColor ? (
                  <>
                    <th className="px-6 py-3 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">Color</th>
                    <th className="px-6 py-3 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">Hex</th>
                    <th className="px-6 py-3 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">RGB</th>
                  </>
                ) : !isLanguage ? (
                  <th className="px-6 py-3 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">
                    Name (vi/en)
                  </th>
                ) : null}
                <th className="px-6 py-3 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">Active</th>
                <th className="px-6 py-3 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {loading ? (
                <tr>
                  <td className="px-6 py-4 text-sm text-admin-text-secondary" colSpan={isColor ? 6 : 4}>
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-6 py-4 text-sm text-admin-text-secondary" colSpan={isColor ? 6 : 4}>
                    No items found.
                  </td>
                </tr>
              ) : (
                items.map((it: any) => {
                  const preferred = isLanguage ? null : getDefaultTranslation(it.translations ?? [], ['vi', 'en']);
                  const en = isLanguage ? null : getDefaultTranslation(it.translations ?? [], ['en']);
                  return (
                    <tr key={isLanguage ? it.code : it.id} className="hover:bg-admin-bg transition-colors">
                      {isLanguage ? (
                        <>
                          <td className="px-6 py-3 text-sm text-admin-text-primary">{it.code}</td>
                          <td className="px-6 py-3 text-sm text-admin-text-primary">{it.name}</td>
                        </>
                      ) : (
                        <td className="px-6 py-3 text-sm text-admin-text-primary">{it.id}</td>
                      )}
                      {!isLanguage && isColor ? (
                        <>
                          <td className="px-6 py-3 text-sm text-admin-text-primary">
                            <div className="flex items-center gap-3">
                              <span
                                className="w-5 h-5 rounded-full border border-admin-border"
                                style={{ backgroundColor: it.hexCode }}
                              />
                              {(preferred?.name ?? '-') as any}
                            </div>
                          </td>
                          <td className="px-6 py-3 text-sm text-admin-text-primary">{it.hexCode}</td>
                          <td className="px-6 py-3 text-sm text-admin-text-primary">{it.rgbCode}</td>
                        </>
                      ) : !isLanguage ? (
                        <td className="px-6 py-3 text-sm text-admin-text-primary">
                          <div className="flex flex-col">
                            <span className="font-medium">{preferred?.name ?? '-'}</span>
                            <span className="text-xs text-admin-text-secondary">{en?.name ? `en: ${en.name}` : null}</span>
                          </div>
                        </td>
                      ) : null}
                      <td className="px-6 py-3 text-sm text-admin-text-primary">{it.isActive ? 'Yes' : 'No'}</td>
                      <td className="px-6 py-3 text-sm text-admin-text-primary">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => (isLanguage ? startEditLanguage(it) : startEdit(it))}
                            className="p-2 rounded-xl border border-admin-border hover:bg-admin-muted transition-colors"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => (isLanguage ? removeLanguage(it.code) : remove(it.id))}
                            className="p-2 rounded-xl border border-admin-border hover:bg-admin-muted transition-colors text-admin-text-secondary hover:text-admin-status-error"
                            title="Delete"
                            disabled={saving}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

