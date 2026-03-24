import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { Badge } from '@/shared/components/Badge';
import { AdminSelect, type AdminSelectOption } from '@/shared/components/AdminSelect';
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

const modalInputClass =
  'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-all duration-200';

/** Inputs trong block màu — giữ touch target thoải mái hơn */
const modalColorInputClass =
  'w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-all duration-200';

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

  const translationRowLimit = languageOptions.length;

  const canAddMoreTranslations = useMemo(() => {
    if (isLanguage || translationRowLimit <= 0) return false;
    return draft.translations.length < translationRowLimit;
  }, [draft.translations.length, isLanguage, translationRowLimit]);

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
    if (!canAddMoreTranslations) return;
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
    <div className="space-y-6">
      <PageHeader
        title="Thuộc tính"
        description="Quản lý các thuộc tính masterdata dùng cho sản phẩm."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-admin-primary text-white rounded-xl hover:bg-admin-primary-hover transition-all duration-200 shadow-lg shadow-admin-primary/15 btn-press"
            >
              <Plus size={16} />
              <span className="text-sm font-medium">Tạo mới</span>
            </button>
            <button
              type="button"
              onClick={() => load()}
              className="inline-flex items-center gap-2 px-4 py-2 glass border border-white/40 text-admin-text-primary rounded-xl hover:bg-white/60 transition-all duration-200 btn-press"
            >
              <RefreshCw size={16} />
              <span className="text-sm font-medium">Reload</span>
            </button>
          </div>
        }
      />

      <div className="glass border border-white/40 rounded-2xl shadow-sm p-2.5 animate-fade-in-up">
        <div className="flex flex-wrap gap-1.5">
          {ATTRIBUTE_TABS.map((t) => (
            <NavLink
              key={t.key}
              to={`/admin/settings/attributes/${t.key}`}
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-admin-primary/10 text-admin-primary shadow-sm'
                    : 'text-admin-text-secondary hover:bg-white/50 hover:text-admin-text-primary'
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </div>
      </div>

      {modalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
            onClick={closeModal}
            aria-label="Close"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative flex min-h-0 max-h-[min(90vh,820px)] w-full max-w-[min(880px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl bg-white shadow-[0_20px_64px_rgba(15,23,42,0.2)] ring-1 ring-slate-900/10 animate-scale-in"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-base font-serif font-semibold leading-tight text-slate-900">
                  {isLanguage
                    ? editingCode == null
                      ? 'Tạo mới language'
                      : `Sửa language: ${editingCode}`
                    : editingId == null
                      ? `Tạo mới ${attribute}`
                      : `Sửa ${attribute}: #${editingId}`}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
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
                  {saving ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="h-3 w-3 border-2 border-admin-primary/30 border-t-admin-primary rounded-full animate-spin" />
                      Đang lưu…
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <label className="inline-flex cursor-pointer select-none items-center gap-1.5 text-xs font-medium text-slate-600">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-slate-300 text-admin-primary focus:ring-admin-primary/25"
                    checked={isLanguage ? languageDraft.isActive : draft.isActive}
                    onChange={(e) =>
                      isLanguage
                        ? setLanguageDraft((prev) => ({ ...prev, isActive: e.target.checked }))
                        : setDraft((prev: any) => ({ ...prev, isActive: e.target.checked }))
                    }
                  />
                  Active
                </label>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-800"
                  aria-label="Close modal"
                  title="Close"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3">
                {error ? (
                  <div
                    role="alert"
                    className="rounded-lg border border-admin-status-error/30 bg-red-50 px-3 py-2 text-sm text-red-900"
                  >
                    {error}
                  </div>
                ) : null}

              {isLanguage ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Code</label>
                    <input
                      className={modalInputClass}
                      value={languageDraft.code}
                      onChange={(e) => setLanguageDraft((prev) => ({ ...prev, code: e.target.value }))}
                      placeholder="vi"
                      required
                      disabled={editingCode != null}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
                    <input
                      className={modalInputClass}
                      value={languageDraft.name}
                      onChange={(e) => setLanguageDraft((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Tiếng Việt"
                      required
                    />
                  </div>
                </div>
              ) : null}

              {isColor ? (
                <div className="rounded-xl border border-slate-200/90 bg-slate-50/90 p-3.5">
                  <p className="mb-2.5 text-xs font-semibold text-slate-700">Màu</p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-600">Hex</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          className="h-11 w-14 cursor-pointer rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
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
                          className={`flex-1 ${modalColorInputClass}`}
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
                      <label className="mb-1.5 block text-xs font-medium text-slate-600">RGB</label>
                      <input
                        className={`${modalColorInputClass} bg-slate-100/80 text-slate-600`}
                        value={(draft as DraftColor).rgbCode}
                        onChange={(e) => setDraft((prev: any) => ({ ...prev, rgbCode: e.target.value }))}
                        placeholder="255,0,0"
                        required
                        disabled
                      />
                      <p className="mt-1.5 text-[11px] text-slate-500">Tự động theo Hex.</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {!isLanguage ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Translations</p>
                      <p className="text-[11px] text-slate-500">
                        {translationRowLimit > 0
                          ? `Tối đa ${translationRowLimit} dòng — mỗi ngôn ngữ một lần`
                          : 'Đang tải danh sách ngôn ngữ…'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addTranslation}
                      disabled={!canAddMoreTranslations || loadingLanguages}
                      title={
                        !translationRowLimit
                          ? 'Đang tải danh sách ngôn ngữ'
                          : canAddMoreTranslations
                            ? 'Thêm bản dịch'
                            : `Đã đủ ${translationRowLimit} ngôn ngữ`
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-admin-primary/8 px-2.5 py-1.5 text-xs font-medium text-admin-primary transition-colors hover:bg-admin-primary/12 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <Plus size={13} />
                      Thêm
                    </button>
                  </div>

                  <div className="space-y-2">
                    {draft.translations.map((t, idx) => (
                      <div
                        key={`${t.languageCode}-${idx}`}
                        className="grid grid-cols-1 items-end gap-2 rounded-lg border border-slate-100 bg-slate-50/40 p-2 md:grid-cols-12"
                      >
                        <div className="md:col-span-2">
                          <label className="mb-1 block text-xs font-medium text-slate-600">Language</label>
                          <AdminSelect<string>
                            menuInPortal
                            options={(languageOptions ?? [])
                              .map(
                                (opt): AdminSelectOption<string> => ({
                                  value: opt.code,
                                  label: opt.name?.trim() ? opt.name : opt.code,
                                }),
                              )
                              .filter((opt) => {
                                const used = draft.translations
                                  .filter((_, i) => i !== idx)
                                  .map((x) => x.languageCode)
                                  .filter(Boolean);
                                return !used.includes(opt.value);
                              })}
                            isDisabled={loadingLanguages}
                            isLoading={loadingLanguages}
                            placeholder={loadingLanguages ? 'Loading...' : 'Select'}
                            value={
                              (languageOptions ?? [])
                                .map(
                                  (opt): AdminSelectOption<string> => ({
                                    value: opt.code,
                                    label: opt.name?.trim() ? opt.name : opt.code,
                                  }),
                                )
                                .find((o) => o.value === t.languageCode) ?? null
                            }
                            onChange={(next) => updateTranslation(idx, { languageCode: next?.value ?? '' })}
                          />
                        </div>
                        <div className="md:col-span-4">
                          <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
                          <input
                            className={modalInputClass}
                            value={t.name}
                            onChange={(e) => updateTranslation(idx, { name: e.target.value })}
                            placeholder="Tên hiển thị"
                            required
                          />
                        </div>
                        <div className="md:col-span-5">
                          <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
                          <input
                            className={modalInputClass}
                            value={t.description ?? ''}
                            onChange={(e) => updateTranslation(idx, { description: e.target.value })}
                            placeholder="Mô tả (tuỳ chọn)"
                          />
                        </div>
                        <div className="flex justify-end md:col-span-1">
                          <button
                            type="button"
                            onClick={() => removeTranslation(idx)}
                            className="rounded-lg border border-transparent p-1.5 text-slate-500 transition-all hover:border-red-100 hover:bg-red-50 hover:text-admin-status-error"
                            title="Xóa dòng"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              </div>

              <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/95 px-4 py-2.5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 btn-press"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving || loading || !canSubmit}
                  className="inline-flex items-center rounded-lg bg-admin-primary px-4 py-1.5 text-sm font-medium text-white shadow-md shadow-admin-primary/20 transition-all hover:bg-admin-primary-hover disabled:opacity-50 btn-press"
                >
                  {isLanguage ? (editingCode == null ? 'Lưu' : 'Cập nhật') : editingId == null ? 'Lưu' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>,
            document.body,
          )
        : null}

      <div className="glass border border-white/40 rounded-2xl shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-admin-border/30 bg-admin-muted/20">
                {isLanguage ? (
                  <>
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-admin-text-muted uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-admin-text-muted uppercase tracking-wider">Name</th>
                  </>
                ) : (
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-admin-text-muted uppercase tracking-wider">ID</th>
                )}
                {!isLanguage && isColor ? (
                  <>
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-admin-text-muted uppercase tracking-wider">Color</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-admin-text-muted uppercase tracking-wider">Hex</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-admin-text-muted uppercase tracking-wider">RGB</th>
                  </>
                ) : !isLanguage ? (
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-admin-text-muted uppercase tracking-wider">
                    Name (vi/en)
                  </th>
                ) : null}
                <th className="px-6 py-3.5 text-[11px] font-semibold text-admin-text-muted uppercase tracking-wider">Active</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold text-admin-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border/20">
              {loading ? (
                <tr>
                  <td className="px-6 py-8 text-center" colSpan={isColor ? 6 : 4}>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-admin-primary/30 border-t-admin-primary rounded-full animate-spin" />
                      <span className="text-sm text-admin-text-muted">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-center text-sm text-admin-text-muted" colSpan={isColor ? 6 : 4}>
                    No items found.
                  </td>
                </tr>
              ) : (
                items.map((it: any) => {
                  const preferred = isLanguage ? null : getDefaultTranslation(it.translations ?? [], ['vi', 'en']);
                  const en = isLanguage ? null : getDefaultTranslation(it.translations ?? [], ['en']);
                  return (
                    <tr key={isLanguage ? it.code : it.id} className="hover:bg-white/40 transition-colors duration-150">
                      {isLanguage ? (
                        <>
                          <td className="px-6 py-3 text-sm text-admin-text-primary font-mono">{it.code}</td>
                          <td className="px-6 py-3 text-sm text-admin-text-primary">{it.name}</td>
                        </>
                      ) : (
                        <td className="px-6 py-3 text-sm text-admin-text-muted font-mono">{it.id}</td>
                      )}
                      {!isLanguage && isColor ? (
                        <>
                          <td className="px-6 py-3 text-sm text-admin-text-primary">
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-5 h-5 rounded-full border border-admin-border/50 shadow-sm"
                                style={{ backgroundColor: it.hexCode }}
                              />
                              {(preferred?.name ?? '-') as any}
                            </div>
                          </td>
                          <td className="px-6 py-3 text-sm text-admin-text-secondary font-mono">{it.hexCode}</td>
                          <td className="px-6 py-3 text-sm text-admin-text-secondary font-mono">{it.rgbCode}</td>
                        </>
                      ) : !isLanguage ? (
                        <td className="px-6 py-3 text-sm text-admin-text-primary">
                          <div className="flex flex-col">
                            <span className="font-medium">{preferred?.name ?? '-'}</span>
                            <span className="text-[11px] text-admin-text-muted">{en?.name ? `en: ${en.name}` : null}</span>
                          </div>
                        </td>
                      ) : null}
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${it.isActive ? 'bg-admin-status-success/10 text-admin-status-success' : 'bg-admin-muted text-admin-text-muted'}`}>
                          {it.isActive ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => (isLanguage ? startEditLanguage(it) : startEdit(it))}
                            className="p-2 rounded-lg text-admin-text-muted hover:text-admin-primary hover:bg-admin-primary/8 transition-all duration-200"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => (isLanguage ? removeLanguage(it.code) : remove(it.id))}
                            className="p-2 rounded-lg text-admin-text-muted hover:text-admin-status-error hover:bg-admin-status-error/8 transition-all duration-200"
                            title="Delete"
                            disabled={saving}
                          >
                            <Trash2 size={15} />
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
