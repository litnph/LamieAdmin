import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  ProductApi,
  type CreateProductRequest,
  type ProductDto,
  type ProductImagePayload,
  type ProductTranslation,
} from '../api/productApi';
import { AttributesApi } from '@/features/settings/attributes/api/attributesApi';
import type { AttributeItem, LanguageAttributeItem } from '@/features/settings/attributes/types/attributes.types';
import { AdminSelect, type AdminSelectOption } from '@/shared/components/AdminSelect';
import { AttributeMultiSelect } from '@/shared/components/AttributeMultiSelect';

type ProductImageItem = ProductImagePayload & {
  file?: File;
  previewUrl?: string;
  /** true = ảnh đã có trên server (gửi Id khi update); false = ảnh mới thêm */
  isFromServer?: boolean;
};

const formatFileSize = (bytes: number) => {
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

export type ProductFormMode = 'create' | 'edit';

export type ProductCreatePageProps = {
  mode?: ProductFormMode;
  /** Khi mode === 'edit', hiển thị trong tiêu đề phụ */
  productId?: number;
  /** Dữ liệu sản phẩm đã load (chỉ dùng khi edit) */
  initialProduct?: ProductDto | null;
};

function mapDtoToFormState(p: ProductDto): Omit<CreateProductRequest, 'translations' | 'images'> {
  return {
    sku: p.sku ?? '',
    price: p.price ?? 0,
    salePrice: p.salePrice ?? 0,
    stock: p.stock ?? 0,
    categoryId: p.categoryId ?? 0,
    thumbnailUrl: p.thumbnailUrl ?? '',
    tagIds: [...(p.tagIds ?? [])],
    colorIds: [...(p.colorIds ?? [])],
    collectionIds: [...(p.collectionIds ?? [])],
    styleIds: [...(p.styleIds ?? [])],
    occasionIds: [...(p.occasionIds ?? [])],
  };
}

function mapDtoImagesToItems(p: ProductDto): ProductImageItem[] {
  const list = [...(p.images ?? [])]
    .filter((im) => im.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return list.map((im) => {
    const url = im.imageUrl ?? '';
    const tail = url.split('/').pop() || '';
    return {
      id: im.id,
      imageUrl: url,
      sortOrder: im.sortOrder,
      content: '',
      fileName: tail || `image-${im.id}`,
      contentType: 'image/*',
      isFromServer: true,
    };
  });
}

export const ProductCreatePage: React.FC<ProductCreatePageProps> = ({
  mode = 'create',
  productId,
  initialProduct,
}) => {
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
  const draggingImageIdRef = useRef<number | null>(null);
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
        label: l.name?.trim() ? l.name : l.code,
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

  useEffect(() => {
    if (mode !== 'edit' || !initialProduct) return;

    setError(null);
    setForm(mapDtoToFormState(initialProduct));
    setTranslations(
      initialProduct.translations?.length
        ? initialProduct.translations.map((t) => ({
            languageCode: t.languageCode,
            name: t.name ?? '',
            slug: t.slug ?? '',
            description: t.description ?? '',
          }))
        : [{ languageCode: '', name: '', slug: '', description: '' }],
    );
    setImages(mapDtoImagesToItems(initialProduct));
    setThumbnailFile(null);
    setThumbnailMeta(null);
    setThumbnailPreviewUrl(null);
  }, [mode, initialProduct]);

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
    const tempBase = -Date.now();
    const newItems: ProductImageItem[] = imageFiles.map((file, i) => ({
      id: tempBase - i,
      imageUrl: '',
      sortOrder: images.length + i + 1,
      content: '',
      fileName: file.name,
      contentType: file.type || 'image/*',
      file,
      previewUrl: URL.createObjectURL(file),
      isFromServer: false,
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
        formData.append(`Images[${idx}].SortOrder`, String(idx + 1));
        if (mode === 'edit' && img.isFromServer) {
          formData.append(`Images[${idx}].Id`, String(img.id));
        }
        if (img.file) {
          formData.append(`Images[${idx}].ImageFile`, img.file);
        } else if (img.imageUrl) {
          formData.append(`Images[${idx}].ImageUrl`, img.imageUrl);
        }
      });

      if (mode === 'edit' && productId) {
        await ProductApi.updateWithFormData(productId, formData);
      } else {
        await ProductApi.createWithFormData(formData);
      }
      navigate('/admin/products');
    } catch (e: any) {
      setError(e?.message ?? (mode === 'edit' ? 'Cập nhật sản phẩm thất bại' : 'Tạo sản phẩm thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 text-sm rounded-xl border border-admin-input-border/80 bg-white/50 focus:outline-none focus:ring-2 focus:ring-admin-primary/10 focus:border-admin-primary/40 focus:bg-white/70 transition-all duration-200';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="p-2 rounded-xl glass border border-white/40 hover:bg-white/60 transition-all duration-200"
              aria-label="Back"
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-2xl font-serif font-bold text-admin-text-primary tracking-tight">
                {mode === 'edit' ? 'Sửa sản phẩm' : 'Tạo sản phẩm'}
              </h2>
              <p className="text-admin-text-secondary mt-0.5 text-sm">
                {mode === 'edit' && productId ? (
                  <>
                    ID: <span className="font-mono text-xs text-admin-text-muted">{productId}</span>
                  </>
                ) : (
                  <>
                    Gửi dữ liệu theo cấu trúc{' '}
                    <span className="font-mono text-xs text-admin-text-muted">/api/settings/products</span>
                  </>
                )}
              </p>
            </div>
          </div>
          {error ? <p className="mt-3 text-sm text-admin-status-error animate-fade-in">{error}</p> : null}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-9 glass border border-white/40 rounded-2xl shadow-sm p-6 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-admin-text-secondary mb-1.5">SKU</label>
              <input
                className={inputClass}
                value={form.sku}
                onChange={(e) => updateForm('sku', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-admin-text-secondary mb-1.5">Price</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className={inputClass}
                value={form.price}
                onChange={(e) => updateForm('price', Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-admin-text-secondary mb-1.5">Sale Price</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className={inputClass}
                value={form.salePrice}
                onChange={(e) => updateForm('salePrice', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-admin-text-secondary mb-1.5">Stock</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.stock}
                onChange={(e) => updateForm('stock', Number(e.target.value))}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-admin-text-secondary mb-1.5">Category</label>
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
              <AttributeMultiSelect
                label="Tags"
                options={tags}
                selectedIds={form.tagIds}
                onChange={(next) => updateForm('tagIds', next)}
                loading={loadingMaster}
              />
              <AttributeMultiSelect
                label="Colors"
                variant="colors"
                options={colors}
                selectedIds={form.colorIds}
                onChange={(next) => updateForm('colorIds', next)}
                loading={loadingMaster}
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-admin-text-primary">Collections / Styles / Occasions</p>
              <AttributeMultiSelect
                label="Collections"
                options={collections}
                selectedIds={form.collectionIds}
                onChange={(next) => updateForm('collectionIds', next)}
                loading={loadingMaster}
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:items-start">
                <AttributeMultiSelect
                  label="Styles"
                  options={styles}
                  selectedIds={form.styleIds}
                  onChange={(next) => updateForm('styleIds', next)}
                  loading={loadingMaster}
                />
                <AttributeMultiSelect
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-admin-primary/8 text-admin-primary rounded-lg hover:bg-admin-primary/12 transition-colors duration-200 text-sm font-medium"
              >
                <Plus size={14} />
                Thêm
              </button>
            </div>
            <div className="space-y-3">
              {translations.map((t, idx) => (
                <div key={`${t.languageCode}-${idx}`} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-admin-text-secondary mb-1.5">Language</label>
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
                    <label className="block text-xs font-medium text-admin-text-secondary mb-1.5">Name</label>
                    <input
                      className={inputClass}
                      value={t.name}
                      onChange={(e) => updateTranslation(idx, { name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-admin-text-secondary mb-1.5">Slug</label>
                    <input
                      className={inputClass}
                      value={t.slug}
                      onChange={(e) => updateTranslation(idx, { slug: e.target.value })}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-admin-text-secondary mb-1.5">Description</label>
                    <input
                      className={inputClass}
                      value={t.description}
                      onChange={(e) => updateTranslation(idx, { description: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeTranslationRow(idx)}
                      className="p-2 text-admin-text-muted hover:text-admin-status-error hover:bg-admin-status-error/8 rounded-lg transition-all duration-200"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-admin-text-primary">Ảnh chi tiết</p>
            <div
              className="rounded-2xl border-2 border-dashed border-admin-border/60 bg-white/30 px-4 py-6 text-center transition-colors duration-200 hover:border-admin-primary/30 hover:bg-admin-primary/3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const fileList = e.dataTransfer.files;
                if (fileList?.length) handleAddImagesFromFiles(Array.from(fileList));
              }}
            >
              <p className="text-sm text-admin-text-muted mb-2">Kéo thả nhiều ảnh vào đây hoặc chọn bên dưới</p>
              <input
                type="file"
                accept="image/*"
                multiple
                className="block w-full max-w-xs mx-auto text-xs text-admin-text-secondary file:mr-2 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-admin-primary file:text-white hover:file:bg-admin-primary-hover cursor-pointer"
                onChange={(e) => {
                  const list = e.target.files;
                  if (list?.length) handleAddImagesFromFiles(Array.from(list));
                  e.target.value = '';
                }}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              {images.length === 0 ? (
                <p className="text-xs text-admin-text-muted">Chưa có ảnh chi tiết.</p>
              ) : (
                images.map((img, idx) => {
                  const preview = img.previewUrl ?? img.imageUrl;
                  const order = idx + 1;
                  return (
                    <div
                      key={`${img.id}-${idx}`}
                      className="w-28 flex-shrink-0 cursor-grab active:cursor-grabbing"
                      draggable
                      onDragStart={(e) => {
                        draggingImageIdRef.current = img.id;
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', String(img.id));
                      }}
                      onDragEnd={() => {
                        draggingImageIdRef.current = null;
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.types.includes('Files')) {
                          e.dataTransfer.dropEffect = 'copy';
                        } else {
                          e.dataTransfer.dropEffect = 'move';
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file && isImageFile(file)) {
                          handleImageFile(idx, file);
                          draggingImageIdRef.current = null;
                          return;
                        }
                        const fromId = draggingImageIdRef.current;
                        if (fromId != null && fromId !== img.id) {
                          moveImage(fromId, img.id);
                        }
                        draggingImageIdRef.current = null;
                      }}
                    >
                      <div className="relative aspect-square overflow-hidden rounded-xl border border-white/40 bg-admin-muted/50 shadow-sm">
                        {preview ? (
                          <img
                            src={preview}
                            alt={img.fileName || `Ảnh ${order}`}
                            className="h-full w-full object-cover"
                            draggable={false}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] text-admin-text-muted">
                            Kéo thả ảnh
                          </div>
                        )}
                        <button
                          type="button"
                          className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                          aria-label="Remove image"
                          title="Xóa"
                          onClick={() => removeImageById(img.id)}
                        >
                          <X size={10} />
                        </button>
                        <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] font-bold text-white">
                          {order}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-admin-border/30">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="inline-flex items-center gap-2 px-4 py-2 glass border border-white/40 text-admin-text-primary rounded-xl hover:bg-white/60 transition-all duration-200 btn-press"
            >
              <span className="text-sm font-medium">Hủy</span>
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 bg-admin-primary text-white rounded-xl hover:bg-admin-primary-hover transition-all duration-200 shadow-lg shadow-admin-primary/15 disabled:opacity-50 btn-press"
            >
              <span className="text-sm font-medium">
                {saving ? 'Đang lưu...' : mode === 'edit' ? 'Cập nhật sản phẩm' : 'Lưu sản phẩm'}
              </span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-5">
          <div className="glass border border-white/40 rounded-2xl shadow-sm p-5 space-y-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <p className="text-sm font-semibold text-admin-text-primary">Thumbnail</p>

            <div className="rounded-xl bg-admin-muted/30 p-3">
              <div
                className="relative rounded-xl overflow-hidden bg-admin-muted/50 aspect-square border border-white/40"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleThumbnailFile(file);
                }}
              >
                {thumbnailPreviewUrl || (form.thumbnailUrl && form.thumbnailUrl.trim()) ? (
                  <>
                    <img
                      src={thumbnailPreviewUrl ?? form.thumbnailUrl}
                      alt="Thumbnail preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                      aria-label="Remove thumbnail"
                      title="Remove"
                      onClick={() => {
                        setThumbnailFile(null);
                        setThumbnailMeta(null);
                        setThumbnailPreviewUrl((prev) => {
                          if (prev) URL.revokeObjectURL(prev);
                          return null;
                        });
                        updateForm('thumbnailUrl', '');
                      }}
                    >
                      <X size={14} />
                    </button>
                    {thumbnailMeta ? (
                      <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-black/50 px-2.5 py-1.5 text-white backdrop-blur-sm">
                        <p className="truncate text-[11px] font-medium">{thumbnailMeta.name}</p>
                        <p className="text-[10px] text-white/70">{formatFileSize(thumbnailMeta.size)}</p>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-admin-text-muted">
                    Kéo thả hoặc chọn ảnh
                  </div>
                )}
              </div>
            </div>

            <input
              type="file"
              accept="image/*"
              className="block w-full text-xs text-admin-text-secondary file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-admin-primary file:text-white hover:file:bg-admin-primary-hover cursor-pointer"
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
