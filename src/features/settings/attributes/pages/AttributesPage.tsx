import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ConfirmationPanel, SettingsDialog } from '@/features/settings/components/SettingsDialog';
import { SettingsShell, SettingsStatus } from '@/features/settings/components/SettingsShell';
import { AdminSelect, type AdminSelectOption } from '@/shared/components/AdminSelect';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { AttributesApi } from '../api/attributesApi';
import type {
  AttributeItem,
  AttributeItemColor,
  AttributeName,
  AttributeTranslation,
  LanguageAttributeItem,
} from '../types/attributes.types';

type AttributeMeta = {
  label: string;
  singular: string;
  description: string;
  emptyDescription: string;
};

const ATTRIBUTE_META: Record<AttributeName, AttributeMeta> = {
  categories: {
    label: 'Danh mục',
    singular: 'danh mục',
    description: 'Nhóm sản phẩm chính dùng để tổ chức danh sách và hỗ trợ khách tìm hoa.',
    emptyDescription: 'Tạo danh mục đầu tiên để bắt đầu phân nhóm sản phẩm.',
  },
  collections: {
    label: 'Bộ sưu tập',
    singular: 'bộ sưu tập',
    description: 'Nhóm sản phẩm theo mùa, chiến dịch hoặc chủ đề bán hàng.',
    emptyDescription: 'Tạo bộ sưu tập khi cần gom sản phẩm theo một chủ đề.',
  },
  colors: {
    label: 'Màu sắc',
    singular: 'màu sắc',
    description: 'Màu dùng để mô tả, lọc và hiển thị sản phẩm nhất quán.',
    emptyDescription: 'Tạo màu đầu tiên để gắn cho sản phẩm.',
  },
  languages: {
    label: 'Ngôn ngữ',
    singular: 'ngôn ngữ',
    description: 'Danh sách ngôn ngữ có thể dùng cho tên và mô tả thuộc tính.',
    emptyDescription: 'Tạo ngôn ngữ trước khi thêm nội dung dịch cho các thuộc tính khác.',
  },
  occasions: {
    label: 'Dịp',
    singular: 'dịp',
    description: 'Các dịp tặng hoa dùng để phân loại và gợi ý sản phẩm.',
    emptyDescription: 'Tạo dịp đầu tiên để hỗ trợ phân loại sản phẩm theo nhu cầu tặng hoa.',
  },
  'product-types': {
    label: 'Dòng sản phẩm',
    singular: 'dòng sản phẩm',
    description: 'Phân biệt loại hoa chính như Hoa tươi, Hoa sáp mà không làm thay đổi danh mục hình thức.',
    emptyDescription: 'Tạo dòng sản phẩm đầu tiên để phân loại sản phẩm theo loại hoa.',
  },
  styles: {
    label: 'Phong cách',
    singular: 'phong cách',
    description: 'Phong cách thiết kế giúp mô tả và lọc mẫu hoa.',
    emptyDescription: 'Tạo phong cách đầu tiên để mô tả thiết kế sản phẩm.',
  },
  tags: {
    label: 'Thẻ',
    singular: 'thẻ',
    description: 'Nhãn linh hoạt hỗ trợ tìm kiếm và nhóm sản phẩm theo nhu cầu vận hành.',
    emptyDescription: 'Tạo thẻ khi cần thêm một cách nhóm sản phẩm linh hoạt.',
  },
};

const ATTRIBUTE_NAMES = Object.keys(ATTRIBUTE_META) as AttributeName[];

const isValidAttribute = (value: string | undefined): value is AttributeName =>
  Boolean(value && ATTRIBUTE_NAMES.includes(value as AttributeName));

const getDefaultTranslation = (translations: AttributeTranslation[], preferred: string[]) => {
  for (const code of preferred) {
    const translation = translations.find((item) => item.languageCode === code);
    if (translation) return translation;
  }
  return translations[0];
};

const hexToRgbString = (hex: string): string | null => {
  const normalized = hex.trim().toUpperCase();
  const match = /^#([0-9A-F]{6})$/.exec(normalized);
  if (!match) return null;
  const raw = match[1];
  return `${parseInt(raw.slice(0, 2), 16)},${parseInt(raw.slice(2, 4), 16)},${parseInt(raw.slice(4, 6), 16)}`;
};

type DraftBase = {
  isActive: boolean;
  code?: string;
  sortOrder?: number;
  translations: AttributeTranslation[];
};

type DraftColor = DraftBase & {
  hexCode: string;
  rgbCode: string;
};

type AttributeDraft = DraftBase | DraftColor;
type ConfirmationKind = 'discard' | 'discard-navigation' | 'delete' | null;

const createDraft = (
  isColor: boolean,
  languageCode = '',
  isSortable = false,
  isProductType = false,
): AttributeDraft => ({
  isActive: true,
  ...(isSortable ? { sortOrder: 0 } : {}),
  ...(isProductType ? { code: '' } : {}),
  translations: [{ languageCode, name: '', description: '' }],
  ...(isColor ? { hexCode: '#000000', rgbCode: '0,0,0' } : {}),
});

const serializeForm = (isLanguage: boolean, draft: AttributeDraft, languageDraft: LanguageAttributeItem) =>
  JSON.stringify(isLanguage ? languageDraft : draft);

const fieldClass =
  'h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 text-sm text-admin-text-primary placeholder-admin-text-muted focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text';

export const AttributesPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const attribute: AttributeName = isValidAttribute(params.attributeKey) ? params.attributeKey : 'categories';
  const meta = ATTRIBUTE_META[attribute];
  const isColor = attribute === 'colors';
  const isLanguage = attribute === 'languages';
  const isCategory = attribute === 'categories';
  const isProductType = attribute === 'product-types';
  const isSortable = isCategory || isProductType;

  const [attributeItems, setAttributeItems] = useState<Array<AttributeItem | AttributeItemColor>>([]);
  const [languageItems, setLanguageItems] = useState<LanguageAttributeItem[]>([]);
  const [languageOptions, setLanguageOptions] = useState<LanguageAttributeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLanguages, setLoadingLanguages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<AttributeDraft>(() => createDraft(isColor, '', isSortable, isProductType));
  const [languageDraft, setLanguageDraft] = useState<LanguageAttributeItem>({ code: '', name: '', isActive: true });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [initialForm, setInitialForm] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationKind>(null);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const loadLanguages = useCallback(async () => {
    setLoadingLanguages(true);
    try {
      const languages = await AttributesApi.getAllLanguages();
      setLanguageOptions(languages);
      return languages;
    } catch {
      setLanguageOptions([]);
      return [];
    } finally {
      setLoadingLanguages(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      if (isLanguage) {
        const languages = await AttributesApi.getAllLanguages();
        setLanguageItems(languages);
        setLanguageOptions(languages);
        setAttributeItems([]);
      } else {
        const items = isColor
          ? await AttributesApi.getAll<AttributeItemColor>(attribute)
          : await AttributesApi.getAll<AttributeItem>(attribute);
        setAttributeItems(items);
        setLanguageItems([]);
      }
    } catch (error) {
      setPageError(getApiErrorMessage(error));
      setAttributeItems([]);
      setLanguageItems([]);
    } finally {
      setLoading(false);
    }
  }, [attribute, isColor, isLanguage]);

  useEffect(() => {
    if (!isValidAttribute(params.attributeKey)) {
      navigate('/admin/settings/attributes/categories', { replace: true });
      return;
    }
    setModalOpen(false);
    setConfirmation(null);
    setSuccessMessage(null);
    void load();
    if (!isLanguage) void loadLanguages();
  }, [attribute, isLanguage, load, loadLanguages, navigate, params.attributeKey]);

  const currentForm = serializeForm(isLanguage, draft, languageDraft);
  const isDirty = modalOpen && currentForm !== initialForm;
  const isEditing = isLanguage ? editingCode !== null : editingId !== null;
  const translationsValid = draft.translations.some(
    (translation) => translation.languageCode.trim().length > 0 && translation.name.trim().length > 0,
  );
  const colorValid = !isColor || ('hexCode' in draft && Boolean(hexToRgbString(draft.hexCode)));
  const sortOrderValid = !isSortable || (Number.isInteger(draft.sortOrder) && (draft.sortOrder ?? -1) >= 0);
  const productTypeValid = !isProductType || Boolean(draft.code?.trim()) && (draft.code?.trim().length ?? 0) <= 50;
  const isValid = isLanguage
    ? languageDraft.code.trim().length > 0 && languageDraft.name.trim().length > 0
    : translationsValid && colorValid && sortOrderValid && productTypeValid;
  const canSave = isDirty && isValid && !saving;

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

  const prepareForm = (nextDraft: AttributeDraft, nextLanguageDraft: LanguageAttributeItem) => {
    setDraft(nextDraft);
    setLanguageDraft(nextLanguageDraft);
    setInitialForm(serializeForm(isLanguage, nextDraft, nextLanguageDraft));
    setFormError(null);
    setConfirmation(null);
    setPendingNavigation(null);
    setModalOpen(true);
  };

  const openCreate = () => {
    const firstLanguage = languageOptions.find((language) => language.isActive)?.code ?? languageOptions[0]?.code ?? '';
    setEditingId(null);
    setEditingCode(null);
    prepareForm(createDraft(isColor, firstLanguage, isSortable, isProductType), { code: '', name: '', isActive: true });
  };

  const openEditAttribute = (item: AttributeItem | AttributeItemColor) => {
    setEditingId(item.id);
    setEditingCode(null);
    const nextDraft: AttributeDraft = isColor
      ? {
          isActive: item.isActive,
          translations: item.translations.map((translation) => ({ ...translation })),
          hexCode: (item as AttributeItemColor).hexCode,
          rgbCode: (item as AttributeItemColor).rgbCode,
        }
      : {
          isActive: item.isActive,
          ...(isSortable ? { sortOrder: item.sortOrder ?? 0 } : {}),
          ...(isProductType ? { code: item.code ?? '' } : {}),
          translations: item.translations.map((translation) => ({ ...translation })),
        };
    prepareForm(nextDraft, { code: '', name: '', isActive: true });
  };

  const openEditLanguage = (item: LanguageAttributeItem) => {
    setEditingId(null);
    setEditingCode(item.code);
    prepareForm(createDraft(false), { ...item });
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
      if (isLanguage) {
        const payload = {
          code: languageDraft.code.trim().toLowerCase(),
          name: languageDraft.name.trim(),
          isActive: languageDraft.isActive,
        };
        if (editingCode) await AttributesApi.updateLanguage(payload);
        else await AttributesApi.createLanguage(payload);
      } else if (isColor) {
        const colorDraft = draft as DraftColor;
        const payload = {
          isActive: colorDraft.isActive,
          translations: colorDraft.translations,
          hexCode: colorDraft.hexCode.trim().toUpperCase(),
          rgbCode: colorDraft.rgbCode,
        };
        if (editingId !== null) await AttributesApi.update(attribute, { id: editingId, ...payload });
        else await AttributesApi.create(attribute, payload);
      } else {
        const payload = {
          isActive: draft.isActive,
          translations: draft.translations,
          ...(isSortable ? { sortOrder: draft.sortOrder ?? 0 } : {}),
          ...(isProductType ? { code: draft.code?.trim().toUpperCase() ?? '' } : {}),
        };
        if (editingId !== null) await AttributesApi.update(attribute, { id: editingId, ...payload });
        else await AttributesApi.create(attribute, payload);
      }
      setSuccessMessage(`Đã ${isEditing ? 'cập nhật' : 'tạo'} ${meta.singular}.`);
      closeImmediately();
      await load();
      if (isLanguage) await loadLanguages();
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    void persistSave();
  };

  const remove = async () => {
    if (!isEditing) return;
    setSaving(true);
    setFormError(null);
    try {
      if (isLanguage && editingCode) await AttributesApi.removeLanguage(editingCode);
      else if (!isLanguage && editingId !== null) await AttributesApi.remove(attribute, editingId);
      setSuccessMessage(`Đã xóa ${meta.singular}.`);
      closeImmediately();
      await load();
      if (isLanguage) await loadLanguages();
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

  const updateTranslation = (index: number, patch: Partial<AttributeTranslation>) => {
    setDraft((current) => ({
      ...current,
      translations: current.translations.map((translation, translationIndex) =>
        translationIndex === index ? { ...translation, ...patch } : translation,
      ),
    }));
  };

  const addTranslation = () => {
    const usedLanguages = new Set(draft.translations.map((translation) => translation.languageCode));
    const nextLanguage = languageOptions.find((language) => !usedLanguages.has(language.code));
    if (!nextLanguage) return;
    setDraft((current) => ({
      ...current,
      translations: [
        ...current.translations,
        { languageCode: nextLanguage.code, name: '', description: '' },
      ],
    }));
  };

  const removeTranslation = (index: number) => {
    setDraft((current) => ({
      ...current,
      translations: current.translations.filter((_, translationIndex) => translationIndex !== index),
    }));
  };

  const availableTranslationCount = Math.max(0, languageOptions.length - draft.translations.length);
  const itemCount = isLanguage ? languageItems.length : attributeItems.length;

  const confirmationContent = (() => {
    if (confirmation === 'discard' || confirmation === 'discard-navigation') {
      return (
        <ConfirmationPanel
          title="Bỏ các thay đổi chưa lưu?"
          description="Nội dung bạn vừa nhập sẽ bị mất. Hành động này không thể hoàn tác."
          confirmLabel="Bỏ thay đổi"
          onCancel={() => {
            setConfirmation(null);
            setPendingNavigation(null);
          }}
          onConfirm={confirmDiscard}
        />
      );
    }
    if (confirmation === 'delete') {
      return (
        <ConfirmationPanel
          title={`Xóa ${meta.singular} này?`}
          description="Mục này sẽ bị xóa khỏi cấu hình. API có thể từ chối nếu dữ liệu vẫn đang được sản phẩm sử dụng."
          confirmLabel={`Xóa ${meta.singular}`}
          busy={saving}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => void remove()}
        />
      );
    }
    return null;
  })();

  const dialogTitle = confirmation
    ? 'Xác nhận thay đổi'
    : isEditing
      ? `Chỉnh sửa ${meta.singular}`
      : `Thêm ${meta.singular}`;

  const renderStatus = (isActive: boolean) => (
    <span
      className={[
        'inline-flex rounded-md px-2 py-1 text-xs font-semibold',
        isActive ? 'bg-admin-status-success/10 text-admin-status-success' : 'bg-admin-muted text-admin-text-muted',
      ].join(' ')}
    >
      {isActive ? 'Đang dùng' : 'Đã tắt'}
    </span>
  );

  return (
    <SettingsShell
      title={meta.label}
      description={meta.description}
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
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover sm:w-auto"
          >
            <Plus size={18} strokeWidth={1.8} aria-hidden="true" />
            Thêm {meta.singular}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {successMessage ? <SettingsStatus kind="success">{successMessage}</SettingsStatus> : null}
        {pageError ? <SettingsStatus kind="error">Không thể tải {meta.label.toLowerCase()}: {pageError}</SettingsStatus> : null}
        <SettingsStatus kind="info">
          Mỗi mục được lưu riêng. Nhóm này hiện cho phép mọi tài khoản đã đăng nhập tạo, sửa và xóa.
        </SettingsStatus>

        <div className="overflow-hidden rounded-admin-panel border border-admin-border bg-admin-card shadow-admin-panel">
          <div className="hidden md:block">
            <table className="w-full table-fixed text-left text-sm">
              <caption className="sr-only">Danh sách {meta.label.toLowerCase()} và trạng thái cấu hình</caption>
              <thead className="border-b border-admin-border bg-admin-muted/55 text-xs text-admin-text-muted">
                <tr>
                  {isLanguage ? (
                    <>
                      <th scope="col" className="w-[22%] px-4 py-3 font-semibold">Mã</th>
                      <th scope="col" className="w-[44%] px-4 py-3 font-semibold">Tên ngôn ngữ</th>
                    </>
                  ) : isColor ? (
                    <>
                      <th scope="col" className="w-[44%] px-4 py-3 font-semibold">Màu và tên</th>
                      <th scope="col" className="w-[22%] px-4 py-3 font-semibold">Mã Hex</th>
                    </>
                  ) : (
                    <>
                      <th scope="col" className="w-[18%] px-4 py-3 font-semibold">{isProductType ? 'Mã' : 'ID'}</th>
                      <th scope="col" className="w-[48%] px-4 py-3 font-semibold">Tên hiển thị</th>
                    </>
                  )}
                  <th scope="col" className="w-[22%] px-4 py-3 font-semibold">Trạng thái</th>
                  <th scope="col" className="w-[12%] px-4 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {loading ? (
                  Array.from({ length: 4 }, (_, index) => (
                    <tr key={index} aria-hidden="true">
                      <td colSpan={4} className="px-4 py-4">
                        <div className="h-5 animate-pulse rounded bg-admin-muted" />
                      </td>
                    </tr>
                  ))
                ) : pageError ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-admin-text-secondary">
                      Dữ liệu {meta.label.toLowerCase()} tạm thời chưa khả dụng. Dùng nút Tải lại để thử lại.
                    </td>
                  </tr>
                ) : itemCount === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center">
                      <p className="font-semibold text-admin-text-primary">Chưa có {meta.label.toLowerCase()}</p>
                      <p className="mt-1 text-sm text-admin-text-muted">{meta.emptyDescription}</p>
                    </td>
                  </tr>
                ) : isLanguage ? (
                  languageItems.map((item) => (
                    <tr key={item.code} className="transition-colors hover:bg-admin-muted/35">
                      <td className="px-4 py-3.5 font-mono text-xs text-admin-text-secondary">{item.code}</td>
                      <td className="truncate px-4 py-3.5 font-medium text-admin-text-primary">{item.name}</td>
                      <td className="px-4 py-3.5">{renderStatus(item.isActive)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => openEditLanguage(item)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-admin-control text-admin-text-secondary transition-colors hover:bg-admin-primary/10 hover:text-admin-primary"
                          aria-label={`Chỉnh sửa ngôn ngữ ${item.name}`}
                        >
                          <Pencil size={17} strokeWidth={1.8} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  attributeItems.map((item) => {
                    const preferred = getDefaultTranslation(item.translations, ['vi', 'en']);
                    const english = item.translations.find((translation) => translation.languageCode === 'en');
                    const color = isColor ? (item as AttributeItemColor) : null;
                    return (
                      <tr key={item.id} className="transition-colors hover:bg-admin-muted/35">
                        {color ? (
                          <>
                            <td className="px-4 py-3.5">
                              <div className="flex min-w-0 items-center gap-3">
                                <span
                                  className="h-7 w-7 shrink-0 rounded-admin-control border border-admin-border"
                                  style={{ backgroundColor: color.hexCode }}
                                  aria-hidden="true"
                                />
                                <span className="truncate font-medium text-admin-text-primary">{preferred?.name ?? 'Chưa đặt tên'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 font-mono text-xs text-admin-text-secondary">{color.hexCode}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3.5 font-mono text-xs text-admin-text-muted">{isProductType ? item.code : item.id}</td>
                            <td className="px-4 py-3.5">
                              <p className="truncate font-medium text-admin-text-primary">{preferred?.name ?? 'Chưa đặt tên'}</p>
                              {english?.name && english !== preferred ? (
                                <p className="mt-0.5 truncate text-xs text-admin-text-muted">Tiếng Anh: {english.name}</p>
                              ) : null}
                            </td>
                          </>
                        )}
                        <td className="px-4 py-3.5">{renderStatus(item.isActive)}</td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => openEditAttribute(item)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-admin-control text-admin-text-secondary transition-colors hover:bg-admin-primary/10 hover:text-admin-primary"
                            aria-label={`Chỉnh sửa ${preferred?.name ?? meta.singular}`}
                          >
                            <Pencil size={17} strokeWidth={1.8} aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-admin-border md:hidden">
            {loading ? (
              Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="p-4" aria-hidden="true">
                  <div className="h-20 animate-pulse rounded-admin-control bg-admin-muted" />
                </div>
              ))
            ) : pageError ? (
              <div className="px-4 py-9 text-center text-sm leading-6 text-admin-text-secondary">
                Dữ liệu {meta.label.toLowerCase()} tạm thời chưa khả dụng. Dùng nút Tải lại để thử lại.
              </div>
            ) : itemCount === 0 ? (
              <div className="px-4 py-9 text-center">
                <p className="font-semibold text-admin-text-primary">Chưa có {meta.label.toLowerCase()}</p>
                <p className="mt-1 text-sm leading-5 text-admin-text-muted">{meta.emptyDescription}</p>
              </div>
            ) : isLanguage ? (
              languageItems.map((item) => (
                <article key={item.code} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-admin-text-primary">{item.name}</h3>
                      <p className="mt-1 font-mono text-xs text-admin-text-muted">{item.code}</p>
                    </div>
                    {renderStatus(item.isActive)}
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditLanguage(item)}
                    className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-admin-control border border-admin-border text-sm font-semibold text-admin-text-primary"
                  >
                    <Pencil size={16} strokeWidth={1.8} aria-hidden="true" />
                    Chỉnh sửa
                  </button>
                </article>
              ))
            ) : (
              attributeItems.map((item) => {
                const preferred = getDefaultTranslation(item.translations, ['vi', 'en']);
                const color = isColor ? (item as AttributeItemColor) : null;
                return (
                  <article key={item.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {color ? (
                          <span
                            className="h-8 w-8 shrink-0 rounded-admin-control border border-admin-border"
                            style={{ backgroundColor: color.hexCode }}
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-admin-text-primary">{preferred?.name ?? 'Chưa đặt tên'}</h3>
                          <p className="mt-1 text-xs text-admin-text-muted">
                            {color ? color.hexCode : isProductType ? item.code : `${item.translations.length} bản dịch`}
                          </p>
                        </div>
                      </div>
                      {renderStatus(item.isActive)}
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditAttribute(item)}
                      className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-admin-control border border-admin-border text-sm font-semibold text-admin-text-primary"
                    >
                      <Pencil size={16} strokeWidth={1.8} aria-hidden="true" />
                      Chỉnh sửa
                    </button>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>

      <SettingsDialog
        open={modalOpen}
        title={dialogTitle}
        description={confirmation ? 'Kiểm tra tác động trước khi tiếp tục.' : 'Mục này được lưu độc lập với các cài đặt khác.'}
        onRequestClose={requestClose}
        width={isLanguage ? 'medium' : 'wide'}
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
                form="attribute-settings-form"
                disabled={!canSave}
                className="h-11 w-full rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text sm:w-auto"
              >
                {saving ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : `Tạo ${meta.singular}`}
              </button>
            </>
          )
        }
      >
        {confirmationContent ?? (
          <form id="attribute-settings-form" onSubmit={submit} className="space-y-5">
            {formError ? <SettingsStatus kind="error">Không thể lưu thay đổi: {formError}</SettingsStatus> : null}

            {isLanguage ? (
              <div className="grid gap-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
                <div>
                  <label htmlFor="language-code" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">
                    Mã ngôn ngữ
                  </label>
                  <input
                    id="language-code"
                    data-autofocus={!isEditing ? true : undefined}
                    className={fieldClass}
                    value={languageDraft.code}
                    onChange={(event) => setLanguageDraft((current) => ({ ...current, code: event.target.value }))}
                    placeholder="vi"
                    required
                    disabled={isEditing}
                    aria-describedby="language-code-help"
                  />
                  <p id="language-code-help" className="mt-1.5 text-xs leading-5 text-admin-text-muted">
                    Không thể đổi sau khi tạo.
                  </p>
                </div>
                <div>
                  <label htmlFor="language-name" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">
                    Tên ngôn ngữ
                  </label>
                  <input
                    id="language-name"
                    data-autofocus={isEditing ? true : undefined}
                    className={fieldClass}
                    value={languageDraft.name}
                    onChange={(event) => setLanguageDraft((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Tiếng Việt"
                    required
                  />
                </div>
              </div>
            ) : (
              <>
                {isColor ? (
                  <section className="rounded-admin-control border border-admin-border bg-admin-muted/35 p-4" aria-labelledby="color-value-title">
                    <h3 id="color-value-title" className="text-sm font-semibold text-admin-text-primary">Giá trị màu</h3>
                    <p className="mt-1 text-xs leading-5 text-admin-text-secondary">RGB được tính tự động từ mã Hex hợp lệ.</p>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="attribute-color-hex" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">
                          Mã Hex
                        </label>
                        <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-2">
                          <input
                            id="attribute-color-picker"
                            type="color"
                            className="h-11 w-12 cursor-pointer rounded-admin-control border border-admin-input-border bg-admin-card p-1"
                            value={(draft as DraftColor).hexCode}
                            onChange={(event) => {
                              const hexCode = event.target.value.toUpperCase();
                              setDraft((current) => ({ ...current, hexCode, rgbCode: hexToRgbString(hexCode) ?? '' } as DraftColor));
                            }}
                            aria-label="Chọn màu"
                          />
                          <input
                            id="attribute-color-hex"
                            data-autofocus
                            className={fieldClass}
                            value={(draft as DraftColor).hexCode}
                            onChange={(event) => {
                              const hexCode = event.target.value.toUpperCase();
                              setDraft((current) => ({ ...current, hexCode, rgbCode: hexToRgbString(hexCode) ?? '' } as DraftColor));
                            }}
                            placeholder="#D96B8A"
                            required
                            aria-invalid={!colorValid}
                          />
                        </div>
                        {!colorValid ? <p className="mt-1.5 text-xs text-admin-status-error">Nhập mã màu gồm 6 ký tự, ví dụ #D96B8A.</p> : null}
                      </div>
                      <div>
                        <label htmlFor="attribute-color-rgb" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">
                          Giá trị RGB
                        </label>
                        <input
                          id="attribute-color-rgb"
                          className={fieldClass}
                          value={(draft as DraftColor).rgbCode}
                          readOnly
                          aria-readonly="true"
                        />
                      </div>
                    </div>
                  </section>
                ) : null}

                {isProductType ? (
                  <section className="rounded-admin-control border border-admin-border bg-admin-muted/35 p-4" aria-labelledby="product-type-code-title">
                    <h3 id="product-type-code-title" className="text-sm font-semibold text-admin-text-primary">Mã dòng sản phẩm</h3>
                    <p className="mt-1 text-xs leading-5 text-admin-text-secondary">
                      Mã ổn định dùng cho tích hợp và bộ lọc. Chỉ nên dùng chữ in hoa, số và dấu gạch dưới.
                    </p>
                    <div className="mt-3 max-w-md">
                      <label htmlFor="product-type-code" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">
                        Mã <span className="text-admin-status-error">*</span>
                      </label>
                      <input
                        id="product-type-code"
                        className={fieldClass}
                        value={draft.code ?? ''}
                        maxLength={50}
                        onChange={(event) => setDraft((current) => ({
                          ...current,
                          code: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
                        }))}
                        placeholder="FRESH_FLOWER"
                        required
                        aria-invalid={!productTypeValid}
                      />
                    </div>
                  </section>
                ) : null}

                {isSortable ? (
                  <section className="rounded-admin-control border border-admin-border bg-admin-muted/35 p-4" aria-labelledby="attribute-order-title">
                    <h3 id="attribute-order-title" className="text-sm font-semibold text-admin-text-primary">Thứ tự hiển thị</h3>
                    <p className="mt-1 text-xs leading-5 text-admin-text-secondary">
                      Số nhỏ hơn được ưu tiên hiển thị trước. Giá trị này được gửi lại khi chỉnh sửa để không làm mất thứ tự hiện có.
                    </p>
                    <div className="mt-3 max-w-xs">
                      <label htmlFor="attribute-sort-order" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">
                        Thứ tự
                      </label>
                      <input
                        id="attribute-sort-order"
                        type="number"
                        min={0}
                        step={1}
                        className={fieldClass}
                        value={draft.sortOrder ?? 0}
                        onChange={(event) => setDraft((current) => ({
                          ...current,
                          sortOrder: Number(event.target.value),
                        }))}
                        required
                        aria-invalid={!sortOrderValid}
                        aria-describedby={!sortOrderValid ? 'attribute-sort-order-error' : undefined}
                      />
                      {!sortOrderValid ? (
                        <p id="attribute-sort-order-error" className="mt-1.5 text-xs text-admin-status-error">
                          Thứ tự phải là số nguyên từ 0 trở lên.
                        </p>
                      ) : null}
                    </div>
                  </section>
                ) : null}

                <section aria-labelledby="translations-title">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 id="translations-title" className="text-sm font-semibold text-admin-text-primary">Tên và mô tả theo ngôn ngữ</h3>
                      <p className="mt-1 text-xs leading-5 text-admin-text-secondary">
                        Mỗi ngôn ngữ chỉ xuất hiện một lần. Cần ít nhất một tên hợp lệ để lưu.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addTranslation}
                      disabled={loadingLanguages || availableTranslationCount === 0}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-admin-control border border-admin-border bg-admin-card px-3 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      <Plus size={16} strokeWidth={1.8} aria-hidden="true" />
                      Thêm bản dịch
                    </button>
                  </div>

                  {languageOptions.length === 0 && !loadingLanguages ? (
                    <div className="mt-3">
                      <SettingsStatus kind="error">Chưa có ngôn ngữ để gán. Hãy tạo ngôn ngữ trước khi lưu thuộc tính.</SettingsStatus>
                    </div>
                  ) : null}

                  <div className="mt-3 space-y-3">
                    {draft.translations.map((translation, index) => {
                      const usedCodes = new Set(
                        draft.translations
                          .filter((_, translationIndex) => translationIndex !== index)
                          .map((item) => item.languageCode),
                      );
                      const options = languageOptions
                        .filter((language) => !usedCodes.has(language.code))
                        .map(
                          (language): AdminSelectOption<string> => ({
                            value: language.code,
                            label: language.name || language.code,
                          }),
                        );
                      const selected = options.find((option) => option.value === translation.languageCode) ?? null;
                      return (
                        <fieldset key={`${translation.languageCode}-${index}`} className="rounded-admin-control border border-admin-border p-3 sm:p-4">
                          <legend className="px-1 text-xs font-semibold text-admin-text-muted">Bản dịch {index + 1}</legend>
                          <div className="grid gap-3 lg:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1.2fr)_2.75rem] lg:items-end">
                            <div>
                              <label htmlFor={`translation-language-${index}`} className="mb-1.5 block text-sm font-semibold text-admin-text-primary">
                                Ngôn ngữ
                              </label>
                              <AdminSelect<string>
                                inputId={`translation-language-${index}`}
                                menuInPortal
                                options={options}
                                value={selected}
                                onChange={(option) => updateTranslation(index, { languageCode: option?.value ?? '' })}
                                placeholder={loadingLanguages ? 'Đang tải...' : 'Chọn'}
                                isLoading={loadingLanguages}
                                isDisabled={loadingLanguages}
                              />
                            </div>
                            <div>
                              <label htmlFor={`translation-name-${index}`} className="mb-1.5 block text-sm font-semibold text-admin-text-primary">
                                Tên hiển thị
                              </label>
                              <input
                                id={`translation-name-${index}`}
                                data-autofocus={!isColor && index === 0 ? true : undefined}
                                className={fieldClass}
                                value={translation.name}
                                onChange={(event) => updateTranslation(index, { name: event.target.value })}
                                placeholder="Tên hiển thị"
                                required
                              />
                            </div>
                            <div>
                              <label htmlFor={`translation-description-${index}`} className="mb-1.5 block text-sm font-semibold text-admin-text-primary">
                                Mô tả
                              </label>
                              <input
                                id={`translation-description-${index}`}
                                className={fieldClass}
                                value={translation.description ?? ''}
                                onChange={(event) => updateTranslation(index, { description: event.target.value })}
                                placeholder="Tùy chọn"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeTranslation(index)}
                              disabled={draft.translations.length === 1}
                              className="inline-flex h-11 w-full items-center justify-center rounded-admin-control border border-admin-border text-admin-text-secondary transition-colors hover:bg-admin-muted hover:text-admin-text-primary disabled:cursor-not-allowed disabled:opacity-40 lg:w-11"
                              aria-label={`Xóa bản dịch ${index + 1}`}
                            >
                              <Trash2 size={17} strokeWidth={1.8} aria-hidden="true" />
                            </button>
                          </div>
                        </fieldset>
                      );
                    })}
                  </div>
                </section>
              </>
            )}

            <div className="rounded-admin-control border border-admin-border bg-admin-muted/35 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <label htmlFor="attribute-active" className="text-sm font-semibold text-admin-text-primary">
                    {isLanguage ? 'Ngôn ngữ đang hoạt động' : `${meta.label} đang được sử dụng`}
                  </label>
                  <p className="mt-1 text-xs leading-5 text-admin-text-secondary">
                    Mục đã tắt vẫn được giữ lại nhưng có thể không còn xuất hiện trong lựa chọn cho dữ liệu mới.
                  </p>
                </div>
                <input
                  id="attribute-active"
                  type="checkbox"
                  role="switch"
                  checked={isLanguage ? languageDraft.isActive : draft.isActive}
                  onChange={(event) => {
                    if (isLanguage) setLanguageDraft((current) => ({ ...current, isActive: event.target.checked }));
                    else setDraft((current) => ({ ...current, isActive: event.target.checked }));
                  }}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-admin-input-border text-admin-primary focus:ring-admin-primary/25"
                />
              </div>
            </div>

            {isEditing ? (
              <section className="rounded-admin-control border border-admin-status-error/30 bg-red-50/70 p-4" aria-labelledby="attribute-danger-title">
                <h3 id="attribute-danger-title" className="text-sm font-semibold text-admin-status-error">Vùng nguy hiểm</h3>
                <p className="mt-1 text-xs leading-5 text-admin-text-secondary">
                  Xóa mục có thể ảnh hưởng sản phẩm đang tham chiếu. API sẽ quyết định thao tác có được phép hay không.
                </p>
                <button
                  type="button"
                  onClick={() => setConfirmation('delete')}
                  className="mt-3 h-11 rounded-admin-control border border-admin-status-error/45 bg-admin-card px-4 text-sm font-semibold text-admin-status-error transition-colors hover:bg-red-100"
                >
                  Xóa {meta.singular}
                </button>
              </section>
            ) : null}
          </form>
        )}
      </SettingsDialog>
    </SettingsShell>
  );
};
