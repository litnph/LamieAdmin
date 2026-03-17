import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProductApi, type CreateProductRequest, type ProductImagePayload, type ProductTranslation } from '../api/productApi';
import { AttributesApi } from '@/features/settings/attributes/api/attributesApi';
import type { AttributeItem, LanguageAttributeItem } from '@/features/settings/attributes/types/attributes.types';
import { AdminSelect, type AdminSelectOption } from '@/shared/components/AdminSelect';

/** Ảnh chi tiết: FE chỉ lưu file + previewUrl (object URL) trên từng item để preview đúng khi kéo đổi thứ tự. */
type ProductImageItem = ProductImagePayload & { file?: File; previewUrl?: string };

const formatFileSize = (bytes: number) => {
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

interface AttributeChipMultiSelectProps {
  label: string;
  options: AttributeItem[];
  selectedIds: number[];
  onChange: (next: number[]) => void;
  loading?: boolean;
  placeholder?: string;
}

const AttributeChipMultiSelect: React.FC<AttributeChipMultiSelectProps> = ({
  label,
  options,
  selectedIds,
  onChange,
  loading,
  placeholder,
}) => {
  const selectOptions: AdminSelectOption<number>[] = useMemo(
    () =>
      options.map((opt) => ({
        value: opt.id,
        label: opt.translations?.[0]?.name ?? `#${opt.id}`,
      })),
    [options],
  );

  const selectedValue: AdminSelectOption<number>[] = useMemo(() => {
    const map = new Map(selectOptions.map((o) => [o.value, o] as const));
    return selectedIds.map((id) => map.get(id)).filter(Boolean) as AdminSelectOption<number>[];
  }, [selectOptions, selectedIds]);

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-admin-text-secondary mb-1">{label}</label>
      <AdminSelect<number>
        isMulti
        isDisabled={!!loading}
        isLoading={!!loading}
        options={selectOptions}
        value={selectedValue}
        placeholder={loading ? 'Loading...' : placeholder ?? 'Select'}
        onChange={(next) => onChange(next.map((x) => x.value))}
      />
    </div>
  );
};

export const ProductCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<AttributeItem[]>([]);
  const [tags, setTags] = useState<AttributeItem[]>([]);
  const [colors, setColors] = useState<AttributeItem[]>([]);
  const [collections, setCollections] = useState<AttributeItem[]>([]);
  const [styles, setStyles] = useState<AttributeItem[]>([]);
  const [occasions, setOccasions] = useState<AttributeItem[]>([]);
  const [languages, setLanguages] = useState<LanguageAttributeItem[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(false);

  const [form, setForm] = useState<Omit<CreateProductRequest, 'translations' | 'images'>>({
    sku: '',
    price: 0,
    salePrice: 0,
    stock: 0,
    categoryId: 0,
    thumbnailUrl: '',
    tagIds: [],
    colorIds: [],
    collectionIds: [],
    styleIds: [],
    occasionIds: [],
  });

  const [translations, setTranslations] = useState<ProductTranslation[]>([
    { languageCode: '', name: '', slug: '', description: '' },
  ]);

  const [images, setImages] = useState<ProductImageItem[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailMeta, setThumbnailMeta] = useState<{ name: string; size: number } | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [draggingImageId, setDraggingImageId] = useState<number | null>(null);
  const thumbnailPreviewRef = useRef<string | null>(null);
  const imagesRef = useRef<ProductImageItem[]>([]);
  thumbnailPreviewRef.current = thumbnailPreviewUrl;
  imagesRef.current = images;

  useEffect(() => {
    return () => {
      if (thumbnailPreviewRef.current) URL.revokeObjectURL(thumbnailPreviewRef.current);
      imagesRef.current.forEach((img) => {
        if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
      });
    };
  }, []);

  const categoryOptions: AdminSelectOption<number>[] = useMemo(
    () =>
      categories.map((c) => ({
        value: c.id,
        label: c.translations?.[0]?.name ?? `#${c.id}`,
      })),
    [categories],
  );

  const languageSelectOptions: AdminSelectOption<string>[] = useMemo(
    () =>
      languages.map((l) => ({
        value: l.code,
        label: `${l.code} - ${l.name}`,
      })),
    [languages],
  );

  useEffect(() => {
    const loadMaster = async () => {
      setLoadingMaster(true);
      try {
        const [cats, tgs, cols, colls, stls, occs, langs] = await Promise.all([
          AttributesApi.getAll<AttributeItem>('categories'),
          AttributesApi.getAll<AttributeItem>('tags'),
          AttributesApi.getAll<AttributeItem>('colors'),
          AttributesApi.getAll<AttributeItem>('collections'),
          AttributesApi.getAll<AttributeItem>('styles'),
          AttributesApi.getAll<AttributeItem>('occasions'),
          AttributesApi.getAllLanguages(),
        ]);
        setCategories(cats);
        setTags(tgs);
        setColors(cols);
        setCollections(colls);
        setStyles(stls);
        setOccasions(occs);
        setLanguages(langs);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load master data');
      } finally {
        setLoadingMaster(false);
      }
    };
    void loadMaster();
  }, []);

  const updateForm = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateTranslation = (idx: number, patch: Partial<ProductTranslation>) => {
    setTranslations((prev) => {
      const list = [...prev];
      list[idx] = { ...list[idx], ...patch };
      return list;
    });
  };

  const addTranslationRow = () => {
    setTranslations((prev) => [...prev, { languageCode: '', name: '', slug: '', description: '' }]);
  };

  const removeTranslationRow = (idx: number) => {
    setTranslations((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeImageById = (id: number) => {
    setImages((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  };

  const moveImage = (fromId: number, toId: number) => {
    setImages((prev) => {
      const fromIndex = prev.findIndex((x) => x.id === fromId);
      const toIndex = prev.findIndex((x) => x.id === toId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((x, i) => ({ ...x, sortOrder: i + 1 }));
    });
  };

  const isImageFile = (file: File) => file.type.startsWith('image/');

  const handleThumbnailFile = (file: File) => {
    if (!isImageFile(file)) {
      setError('Vui lòng chọn file ảnh hợp lệ cho thumbnail.');
      return;
    }
    setError(null);
    setThumbnailPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setThumbnailMeta({ name: file.name, size: file.size || 0 });
    setThumbnailFile(file);
  };

  const handleImageFile = (idx: number, file: File) => {
    if (!isImageFile(file)) {
      setError('Vui lòng chọn file ảnh hợp lệ cho ảnh chi tiết.');
      return;
    }
    setError(null);
    const previewUrl = URL.createObjectURL(file);
    setImages((prev) => {
      const list = [...prev];
      if (!list[idx]) return prev;
      const old = list[idx];
      if (old.previewUrl) URL.revokeObjectURL(old.previewUrl);
      list[idx] = {
        ...old,
        file,
        fileName: file.name,
        contentType: file.type || 'image/*',
        previewUrl,
      };
      return list;
    });
  };

  const handleAddImagesFromFiles = (files: File[]) => {
    const imageFiles = files.filter(isImageFile);
    if (imageFiles.length === 0) {
      setError('Vui lòng chọn file ảnh hợp lệ cho ảnh chi tiết.');
      return;
    }
    if (imageFiles.length < files.length) setError('Một số file không phải ảnh đã bỏ qua.');
    else setError(null);
    const maxId = images.length ? Math.max(...images.map((i) => i.id)) : 0;
    const newItems: ProductImageItem[] = imageFiles.map((file, i) => ({
      id: maxId + i + 1,
      imageUrl: '',
      sortOrder: images.length + i + 1,
      content: '',
      fileName: file.name,
      contentType: file.type || 'image/*',
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newItems].map((img, idx) => ({ ...img, sortOrder: idx + 1 })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('Sku', form.sku);
      formData.append('Price', String(Number(form.price) || 0));
      if (form.salePrice !== null && form.salePrice !== undefined && form.salePrice !== '') {
        formData.append('SalePrice', String(Number(form.salePrice)));
      }
      formData.append('Stock', String(Number(form.stock) || 0));
      formData.append('CategoryId', String(Number(form.categoryId) || 0));

      if (thumbnailFile) {
        formData.append('ThumbnailFile', thumbnailFile);
      } else if (form.thumbnailUrl) {
        formData.append('ThumbnailUrl', form.thumbnailUrl);
      }

      form.tagIds.forEach((id, idx) => {
        formData.append(`TagIds[${idx}]`, String(id));
      });
      form.colorIds.forEach((id, idx) => {
        formData.append(`ColorIds[${idx}]`, String(id));
      });
      form.collectionIds.forEach((id, idx) => {
        formData.append(`CollectionIds[${idx}]`, String(id));
      });
      form.styleIds.forEach((id, idx) => {
        formData.append(`StyleIds[${idx}]`, String(id));
      });
      form.occasionIds.forEach((id, idx) => {
        formData.append(`OccasionIds[${idx}]`, String(id));
      });

      const validTranslations = translations.filter((t) => t.languageCode && t.name);
      validTranslations.forEach((t, idx) => {
        formData.append(`Translations[${idx}].LanguageCode`, t.languageCode);
        formData.append(`Translations[${idx}].Name`, t.name);
        formData.append(`Translations[${idx}].Slug`, t.slug);
        if (t.description) {
          formData.append(`Translations[${idx}].Description`, t.description);
        }
      });

      images.forEach((img, idx) => {
        // CreateProductImageDto: Id?, ImageUrl?, SortOrder?, ImageFile?
        formData.append(`Images[${idx}].SortOrder`, String(idx + 1));
        if (img.file) {
          formData.append(`Images[${idx}].ImageFile`, img.file);
        } else if (img.imageUrl) {
          formData.append(`Images[${idx}].ImageUrl`, img.imageUrl);
        }
      });

      await ProductApi.createWithFormData(formData);
      navigate('/admin/products');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="p-2 rounded-xl border border-admin-border hover:bg-admin-muted transition-colors"
              aria-label="Back"
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-2xl font-serif font-bold text-admin-text-primary">Tạo sản phẩm</h2>
              <p className="text-admin-text-secondary mt-1 text-sm">
                Gửi dữ liệu theo cấu trúc <span className="font-mono text-xs">/api/settings/products</span>.
              </p>
            </div>
          </div>
          {error ? <p className="mt-3 text-sm text-admin-status-error">{error}</p> : null}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-9 bg-admin-card rounded-2xl shadow-sm border border-admin-border p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-admin-text-secondary mb-1">SKU</label>
              <input
                className="w-full px-3 py-2 text-sm rounded-lg border border-admin-input-border bg-admin-bg focus:outline-none focus:ring-2 focus:ring-admin-input-focus/20 focus:border-admin-input-focus"
                value={form.sku}
                onChange={(e) => updateForm('sku', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-admin-text-secondary mb-1">Price</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-full px-3 py-2 text-sm rounded-lg border border-admin-input-border bg-admin-bg focus:outline-none focus:ring-2 focus:ring-admin-input-focus/20 focus:border-admin-input-focus"
                value={form.price}
                onChange={(e) => updateForm('price', Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-admin-text-secondary mb-1">Sale Price</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-full px-3 py-2 text-sm rounded-lg border border-admin-input-border bg-admin-bg focus:outline-none focus:ring-2 focus:ring-admin-input-focus/20 focus:border-admin-input-focus"
                value={form.salePrice}
                onChange={(e) => updateForm('salePrice', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-admin-text-secondary mb-1">Stock</label>
              <input
                type="number"
                min={0}
                className="w-full px-3 py-2 text-sm rounded-lg border border-admin-input-border bg-admin-bg focus:outline-none focus:ring-2 focus:ring-admin-input-focus/20 focus:border-admin-input-focus"
                value={form.stock}
                onChange={(e) => updateForm('stock', Number(e.target.value))}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-admin-text-secondary mb-1">Category</label>
              <AdminSelect<number>
                options={categoryOptions}
                isDisabled={loadingMaster}
                isLoading={loadingMaster}
                placeholder={loadingMaster ? 'Loading...' : 'Chọn category'}
                value={categoryOptions.find((o) => o.value === form.categoryId) ?? null}
                onChange={(next) => updateForm('categoryId', next?.value ?? 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-admin-text-primary">Tags / Colors</p>
            <AttributeChipMultiSelect
              label="Tags"
              options={tags}
              selectedIds={form.tagIds}
              onChange={(next) => updateForm('tagIds', next)}
              loading={loadingMaster}
            />
            <AttributeChipMultiSelect
              label="Colors"
              options={colors}
              selectedIds={form.colorIds}
              onChange={(next) => updateForm('colorIds', next)}
              loading={loadingMaster}
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-admin-text-primary">Collections / Styles / Occasions</p>
            <AttributeChipMultiSelect
              label="Collections"
              options={collections}
              selectedIds={form.collectionIds}
              onChange={(next) => updateForm('collectionIds', next)}
              loading={loadingMaster}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <AttributeChipMultiSelect
                label="Styles"
                options={styles}
                selectedIds={form.styleIds}
                onChange={(next) => updateForm('styleIds', next)}
                loading={loadingMaster}
              />
              <AttributeChipMultiSelect
                label="Occasions"
                options={occasions}
                selectedIds={form.occasionIds}
                onChange={(next) => updateForm('occasionIds', next)}
                loading={loadingMaster}
              />
            </div>
          </div>
        </div>

          <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-admin-text-primary">Translations</p>
            <button
              type="button"
              onClick={addTranslationRow}
              className="inline-flex items-center gap-2 px-3 py-2 bg-admin-muted text-admin-text-primary rounded-xl hover:bg-admin-muted/80 transition-colors"
            >
              <Plus size={16} />
              <span className="text-sm font-medium">Thêm translation</span>
            </button>
          </div>
          <div className="space-y-3">
            {translations.map((t, idx) => (
              <div key={`${t.languageCode}-${idx}`} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-admin-text-secondary mb-1">Language</label>
                  <AdminSelect<string>
                    options={languageSelectOptions.filter((opt) => {
                      const used = translations
                        .filter((_, i) => i !== idx)
                        .map((x) => x.languageCode)
                        .filter(Boolean);
                      return !used.includes(opt.value);
                    })}
                    isDisabled={loadingMaster}
                    isLoading={loadingMaster}
                    placeholder={loadingMaster ? 'Loading...' : 'Select'}
                    value={languageSelectOptions.find((o) => o.value === t.languageCode) ?? null}
                    onChange={(next) => updateTranslation(idx, { languageCode: next?.value ?? '' })}
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-admin-text-secondary mb-1">Name</label>
                  <input
                    className="w-full px-3 py-2 text-sm rounded-lg border border-admin-input-border bg-admin-bg focus:outline-none focus:ring-2 focus:ring-admin-input-focus/20 focus:border-admin-input-focus"
                    value={t.name}
                    onChange={(e) => updateTranslation(idx, { name: e.target.value })}
                    required
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-admin-text-secondary mb-1">Slug</label>
                  <input
                    className="w-full px-3 py-2 text-sm rounded-lg border border-admin-input-border bg-admin-bg focus:outline-none focus:ring-2 focus:ring-admin-input-focus/20 focus:border-admin-input-focus"
                    value={t.slug}
                    onChange={(e) => updateTranslation(idx, { slug: e.target.value })}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-admin-text-secondary mb-1">Description</label>
                  <input
                    className="w-full px-3 py-2 text-sm rounded-lg border border-admin-input-border bg-admin-bg focus:outline-none focus:ring-2 focus:ring-admin-input-focus/20 focus:border-admin-input-focus"
                    value={t.description}
                    onChange={(e) => updateTranslation(idx, { description: e.target.value })}
                  />
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeTranslationRow(idx)}
                    className="px-3 py-2 text-sm text-admin-text-secondary border border-admin-border rounded-xl hover:bg-admin-muted hover:text-admin-status-error transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-admin-text-primary">Ảnh chi tiết</p>
            <div
              className="rounded-2xl border border-dashed border-admin-border bg-admin-bg/60 px-4 py-4 text-center text-xs text-admin-text-secondary"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const fileList = e.dataTransfer.files;
                if (fileList?.length) handleAddImagesFromFiles(Array.from(fileList));
              }}
            >
              <p className="mb-2">Kéo thả nhiều ảnh vào đây hoặc chọn nhiều ảnh bên dưới</p>
              <input
                type="file"
                accept="image/*"
                multiple
                className="block w-full max-w-xs mx-auto text-xs text-admin-text-secondary file:mr-2 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-admin-primary file:text-admin-text-inverse hover:file:bg-admin-primary-hover cursor-pointer"
                onChange={(e) => {
                  const list = e.target.files;
                  if (list?.length) handleAddImagesFromFiles(Array.from(list));
                  e.target.value = '';
                }}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              {images.length === 0 ? (
                <p className="text-xs text-admin-text-secondary">Chưa có ảnh chi tiết.</p>
              ) : (
                images.map((img, idx) => {
                  const preview = img.previewUrl ?? img.imageUrl;
                  const order = idx + 1;
                  return (
                    <div
                      key={img.id}
                      className="flex-shrink-0 w-32"
                      draggable
                      onDragStart={() => setDraggingImageId(img.id)}
                      onDragEnd={() => setDraggingImageId(null)}
                      onDragOver={(e) => {
                        if (draggingImageId == null || draggingImageId === img.id) return;
                        e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggingImageId != null && draggingImageId !== img.id) {
                          moveImage(draggingImageId, img.id);
                        }
                        setDraggingImageId(null);
                      }}
                    >
                      <div
                        className="relative rounded-xl overflow-hidden bg-admin-muted aspect-square"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleImageFile(idx, file);
                        }}
                      >
                        {preview ? (
                          <img src={preview} alt={img.fileName || `Ảnh ${order}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-admin-text-secondary text-center px-1">
                            Kéo thả hoặc chọn ảnh
                          </div>
                        )}
                        <button
                          type="button"
                          className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center"
                          aria-label="Remove image"
                          title="Xóa"
                          onClick={() => removeImageById(img.id)}
                        >
                          <X size={12} />
                        </button>
                        <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center text-xs font-semibold">
                          {order}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-admin-card text-admin-text-primary rounded-xl border border-admin-border hover:bg-admin-muted transition-colors"
            >
              <span className="text-sm font-medium">Hủy</span>
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-admin-primary text-admin-text-inverse rounded-xl hover:bg-admin-primary-hover transition-colors shadow-lg shadow-admin-primary/20 disabled:opacity-60"
            >
              <span className="text-sm font-medium">{saving ? 'Đang lưu...' : 'Lưu sản phẩm'}</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-admin-card rounded-2xl shadow-sm border border-admin-border p-5 space-y-3">
            <p className="text-sm font-semibold text-admin-text-primary">Thumbnail</p>

            <div className="rounded-2xl bg-admin-bg p-4">
              <div
                className="relative rounded-xl overflow-hidden bg-admin-muted aspect-square"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleThumbnailFile(file);
                }}
              >
                {thumbnailPreviewUrl ? (
                  <>
                    <img
                      src={thumbnailPreviewUrl}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center"
                      aria-label="Remove thumbnail"
                      title="Remove"
                      onClick={() => {
                        setThumbnailFile(null);
                        setThumbnailMeta(null);
                        setThumbnailPreviewUrl((prev) => {
                          if (prev) URL.revokeObjectURL(prev);
                          return null;
                        });
                      }}
                    >
                      <X size={16} />
                    </button>
                    {thumbnailMeta ? (
                      <div className="absolute top-3 left-14 right-3 rounded-xl bg-black/60 text-white px-3 py-2">
                        <p className="text-xs font-medium truncate">{thumbnailMeta.name}</p>
                        <p className="text-[11px] text-white/80">{formatFileSize(thumbnailMeta.size)}</p>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-admin-text-secondary">
                    Kéo thả hoặc bấm để chọn ảnh
                  </div>
                )}
              </div>
            </div>

            <input
              type="file"
              accept="image/*"
              className="block w-full text-xs text-admin-text-secondary file:mr-2 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-admin-primary file:text-admin-text-inverse hover:file:bg-admin-primary-hover cursor-pointer"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleThumbnailFile(file);
              }}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

