import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
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
import { SettingsDialog } from '@/features/settings/components/SettingsDialog';
import { AdminSelect, type AdminSelectOption } from '@/shared/components/AdminSelect';
import { AttributeMultiSelect } from '@/shared/components/AttributeMultiSelect';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { formatVndInput, parseVndInput } from '@/shared/utils/displayFormatters';
import { resolveApiResourceUrl } from '@/services/apiResourceUrl';

type ProductImageItem = ProductImagePayload & {
  file?: File;
  previewUrl?: string;
  isFromServer?: boolean;
};

type ProductFormState = Omit<CreateProductRequest, 'translations' | 'images' | 'stock'> & {
  stock: number | '';
};
type FieldErrors = Record<string, string>;

const EMPTY_FORM: ProductFormState = {
  sku: '',
  price: 0,
  salePrice: 0,
  stock: '',
  tracksInventory: false,
  categoryId: 0,
  productTypeId: 0,
  thumbnailUrl: '',
  tagIds: [],
  colorIds: [],
  collectionIds: [],
  styleIds: [],
  occasionIds: [],
};

const EMPTY_TRANSLATION: ProductTranslation = {
  languageCode: '',
  name: '',
  slug: '',
  description: '',
};

const inputBaseClass =
  'min-h-11 w-full rounded-admin-control border bg-admin-card px-3.5 py-2.5 text-sm text-admin-text-primary transition-colors placeholder:text-admin-text-muted hover:border-admin-primary/45 focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:border-admin-border disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text';

const formatFileSize = (bytes: number) => {
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.max(1, Math.round(kb))} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const fileSignature = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim();

const toIdentifier = (value: string, uppercase = false) => {
  const normalized = normalizeText(value)
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return uppercase ? normalized.toUpperCase() : normalized.toLowerCase();
};

const getVietnameseAttributeName = (item: AttributeItem) =>
  item.translations?.find((translation) => translation.languageCode.toLowerCase() === 'vi')?.name
  ?? item.translations?.[0]?.name
  ?? item.code
  ?? '';

const createProductCodeSuffix = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`.replace(/[^a-z0-9]/gi, '').slice(-4).toUpperCase().padStart(4, '0');

const buildCategoryIdentifiers = (category: AttributeItem | undefined, suffix: string) => {
  if (!category) return { sku: '', slug: '' };
  const source = category.code?.trim() || getVietnameseAttributeName(category) || `DM-${category.id}`;
  const slugPrefix = toIdentifier(getVietnameseAttributeName(category) || source) || `danh-muc-${category.id}`;
  return {
    sku: suffix,
    slug: `${slugPrefix}-${suffix.toLowerCase()}`,
  };
};

export type ProductFormMode = 'create' | 'edit';

export type ProductCreatePageProps = {
  mode?: ProductFormMode;
  productId?: number;
  initialProduct?: ProductDto | null;
};

function mapDtoToFormState(product: ProductDto): ProductFormState {
  return {
    sku: product.sku ?? '',
    price: product.price ?? 0,
    salePrice: product.salePrice ?? 0,
    stock: product.stock ?? 0,
    tracksInventory: product.tracksInventory,
    categoryId: product.categoryId ?? 0,
    productTypeId: product.productTypeId ?? 0,
    thumbnailUrl: product.thumbnailUrl ?? '',
    tagIds: [...(product.tagIds ?? [])],
    colorIds: [...(product.colorIds ?? [])],
    collectionIds: [...(product.collectionIds ?? [])],
    styleIds: [...(product.styleIds ?? [])],
    occasionIds: [...(product.occasionIds ?? [])],
  };
}

function mapDtoImagesToItems(product: ProductDto): ProductImageItem[] {
  return [...(product.images ?? [])]
    .filter((image) => image.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((image) => {
      const imageUrl = image.imageUrl ?? '';
      const fileName = imageUrl.split('/').pop() || `image-${image.id}`;
      return {
        id: image.id,
        imageUrl,
        sortOrder: image.sortOrder,
        content: '',
        fileName,
        contentType: 'image/*',
        isFromServer: true,
      };
    });
}

function mapDtoTranslations(product: ProductDto): ProductTranslation[] {
  if (!product.translations?.length) return [{ ...EMPTY_TRANSLATION }];
  return product.translations.map((translation) => ({
    languageCode: translation.languageCode,
    name: translation.name ?? '',
    slug: translation.slug ?? '',
    description: translation.description ?? '',
  }));
}

function serializeDraft(
  form: ProductFormState,
  translations: ProductTranslation[],
  images: ProductImageItem[],
  thumbnailFile: File | null,
) {
  return JSON.stringify({
    form,
    translations,
    images: images.map((image) => ({
      id: image.id,
      imageUrl: image.imageUrl,
      sortOrder: image.sortOrder,
      file: image.file ? fileSignature(image.file) : null,
    })),
    thumbnailFile: thumbnailFile ? fileSignature(thumbnailFile) : null,
  });
}

function validateProduct(
  form: ProductFormState,
  translations: ProductTranslation[],
  mode: ProductFormMode,
  originalSku?: string,
): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.sku.trim()) errors.sku = 'Nhập mã SKU để nhận diện sản phẩm.';
  else if (mode === 'create' && !/^[A-Z0-9]{4}$/.test(form.sku)) errors.sku = 'SKU mới phải gồm đúng 4 chữ in hoa hoặc số.';
  else if (mode === 'edit' && form.sku !== originalSku) errors.sku = 'SKU không thể thay đổi sau khi tạo sản phẩm.';
  if (!Number.isFinite(form.price) || form.price <= 0) errors.price = 'Giá bán phải là số lớn hơn 0.';
  if (!Number.isFinite(form.salePrice) || form.salePrice < 0) {
    errors.salePrice = 'Giá khuyến mãi phải là số từ 0 trở lên.';
  } else if (form.salePrice > 0 && form.salePrice >= form.price) {
    errors.salePrice = 'Giá khuyến mãi phải thấp hơn giá bán.';
  }
  if (form.tracksInventory && form.stock !== '' && (!Number.isInteger(form.stock) || form.stock < 0)) {
    errors.stock = 'Tồn kho phải là số nguyên từ 0 trở lên.';
  }
  if (!form.categoryId) errors.categoryId = 'Chọn một danh mục cho sản phẩm.';
  if (!form.productTypeId) errors.productTypeId = 'Chọn một dòng sản phẩm.';

  if (translations.length === 0) {
    errors.translations = 'Thêm ít nhất một nội dung ngôn ngữ.';
  }

  const languageCodes = new Set<string>();
  translations.forEach((translation, index) => {
    const prefix = `translation-${index}`;
    if (!translation.languageCode) {
      errors[`${prefix}-languageCode`] = 'Chọn ngôn ngữ cho nội dung này.';
    } else if (languageCodes.has(translation.languageCode)) {
      errors[`${prefix}-languageCode`] = 'Ngôn ngữ này đã được sử dụng.';
    } else {
      languageCodes.add(translation.languageCode);
    }
    if (!translation.name.trim()) errors[`${prefix}-name`] = 'Nhập tên sản phẩm.';
    if (!translation.slug.trim()) errors[`${prefix}-slug`] = 'Nhập đường dẫn slug.';
  });

  return errors;
}

function FieldMessage({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-xs leading-5 text-admin-status-error">
      <AlertCircle className="mt-0.5 shrink-0" size={14} strokeWidth={2} aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <div className="mb-5">
      <h2 id={id} className="text-base font-semibold text-admin-text-primary">{title}</h2>
      <p className="mt-1 max-w-[65ch] text-sm leading-6 text-admin-text-secondary">{description}</p>
    </div>
  );
}

export const ProductCreatePage: React.FC<ProductCreatePageProps> = ({
  mode = 'create',
  productId,
  initialProduct,
}) => {
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [categories, setCategories] = useState<AttributeItem[]>([]);
  const [productTypes, setProductTypes] = useState<AttributeItem[]>([]);
  const [tags, setTags] = useState<AttributeItem[]>([]);
  const [colors, setColors] = useState<AttributeItem[]>([]);
  const [collections, setCollections] = useState<AttributeItem[]>([]);
  const [styles, setStyles] = useState<AttributeItem[]>([]);
  const [occasions, setOccasions] = useState<AttributeItem[]>([]);
  const [languages, setLanguages] = useState<LanguageAttributeItem[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(false);
  const [masterError, setMasterError] = useState<string | null>(null);

  const [form, setForm] = useState<ProductFormState>({ ...EMPTY_FORM });
  const [translations, setTranslations] = useState<ProductTranslation[]>([{ ...EMPTY_TRANSLATION }]);
  const [images, setImages] = useState<ProductImageItem[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailMeta, setThumbnailMeta] = useState<{ name: string; size: number } | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);

  const initialDraftRef = useRef('');
  const savedRef = useRef(false);
  const defaultsAppliedRef = useRef(false);
  const productCodeSuffixRef = useRef(createProductCodeSuffix());
  const nextImageIdRef = useRef(-1);
  const thumbnailPreviewRef = useRef<string | null>(null);
  const imagesRef = useRef<ProductImageItem[]>([]);

  thumbnailPreviewRef.current = thumbnailPreviewUrl;
  imagesRef.current = images;

  const categoryOptions: AdminSelectOption<number>[] = useMemo(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: getVietnameseAttributeName(category) || `Danh mục #${category.id}`,
      })),
    [categories],
  );

  const productTypeOptions: AdminSelectOption<number>[] = useMemo(
    () =>
      productTypes
        .filter((productType) => productType.isActive || productType.id === form.productTypeId)
        .map((productType) => ({
          value: productType.id,
          label: productType.translations?.find((translation) => translation.languageCode === 'vi')?.name
            ?? productType.translations?.[0]?.name
            ?? productType.code
            ?? `Dòng sản phẩm #${productType.id}`,
        })),
    [form.productTypeId, productTypes],
  );

  const languageOptions: AdminSelectOption<string>[] = useMemo(
    () =>
      languages.map((language) => ({
        value: language.code,
        label: language.name?.trim() ? language.name : language.code,
      })),
    [languages],
  );

  const currentDraft = useMemo(
    () => serializeDraft(form, translations, images, thumbnailFile),
    [form, images, thumbnailFile, translations],
  );
  const isDirty = draftReady && currentDraft !== initialDraftRef.current;
  const hasPendingFiles = Boolean(thumbnailFile || images.some((image) => image.file));

  useEffect(() => {
    return () => {
      if (thumbnailPreviewRef.current) URL.revokeObjectURL(thumbnailPreviewRef.current);
      imagesRef.current.forEach((image) => {
        if (image.previewUrl) URL.revokeObjectURL(image.previewUrl);
      });
    };
  }, []);

  useEffect(() => {
    const loadMasterData = async () => {
      setLoadingMaster(true);
      setMasterError(null);
      try {
        const [categoryItems, productTypeItems, tagItems, colorItems, collectionItems, styleItems, occasionItems, languageItems] =
          await Promise.all([
            AttributesApi.getAll<AttributeItem>('categories'),
            AttributesApi.getAll<AttributeItem>('product-types'),
            AttributesApi.getAll<AttributeItem>('tags'),
            AttributesApi.getAll<AttributeItem>('colors'),
            AttributesApi.getAll<AttributeItem>('collections'),
            AttributesApi.getAll<AttributeItem>('styles'),
            AttributesApi.getAll<AttributeItem>('occasions'),
            AttributesApi.getAllLanguages(),
          ]);
        setCategories(categoryItems);
        setProductTypes(productTypeItems);
        setTags(tagItems);
        setColors(colorItems);
        setCollections(collectionItems);
        setStyles(styleItems);
        setOccasions(occasionItems);
        setLanguages(languageItems);
      } catch (requestError) {
        setMasterError(getApiErrorMessage(requestError));
      } finally {
        setLoadingMaster(false);
      }
    };
    void loadMasterData();
  }, []);

  useEffect(() => {
    savedRef.current = false;
    defaultsAppliedRef.current = mode === 'edit';
    setFieldErrors({});
    setSubmitError(null);

    if (mode === 'edit' && initialProduct) {
      const nextForm = mapDtoToFormState(initialProduct);
      const nextTranslations = mapDtoTranslations(initialProduct);
      const nextImages = mapDtoImagesToItems(initialProduct);
      setForm(nextForm);
      setTranslations(nextTranslations);
      setImages(nextImages);
      setThumbnailFile(null);
      setThumbnailMeta(null);
      setThumbnailPreviewUrl(null);
      initialDraftRef.current = serializeDraft(nextForm, nextTranslations, nextImages, null);
      setDraftReady(true);
      return;
    }

    if (mode === 'create') {
      const nextForm = { ...EMPTY_FORM };
      const nextTranslations = [{ ...EMPTY_TRANSLATION }];
      setForm(nextForm);
      setTranslations(nextTranslations);
      setImages([]);
      setThumbnailFile(null);
      setThumbnailMeta(null);
      setThumbnailPreviewUrl(null);
      initialDraftRef.current = serializeDraft(nextForm, nextTranslations, [], null);
      setDraftReady(true);
    }
  }, [initialProduct, mode]);

  useEffect(() => {
    if (
      mode !== 'create'
      || defaultsAppliedRef.current
      || !draftReady
      || loadingMaster
      || categories.length === 0
      || productTypes.length === 0
      || languages.length === 0
    ) return;

    const vietnamese = languages.find((language) => language.code.toLowerCase() === 'vi')
      ?? languages.find((language) => normalizeText(language.name).toLowerCase().includes('tieng viet'));
    const freshFlower = productTypes.find((productType) => productType.code?.toUpperCase() === 'FRESH_FLOWER')
      ?? productTypes.find((productType) => normalizeText(getVietnameseAttributeName(productType)).toLowerCase() === 'hoa tuoi');
    const bouquet = categories.find((category) => {
      const code = toIdentifier(category.code ?? '', true);
      const name = normalizeText(getVietnameseAttributeName(category)).toLowerCase();
      return ['HOA-BO', 'HOA-BOUQUET', 'BOUQUET'].includes(code) || name === 'hoa bo';
    }) ?? categories.find((category) =>
      normalizeText(getVietnameseAttributeName(category)).toLowerCase().includes('hoa bo'));

    const selectedCategory = categories.find((category) => category.id === form.categoryId) ?? bouquet;
    const identifiers = buildCategoryIdentifiers(selectedCategory, productCodeSuffixRef.current);
    const nextForm: ProductFormState = {
      ...form,
      categoryId: form.categoryId || selectedCategory?.id || 0,
      productTypeId: form.productTypeId || freshFlower?.id || productTypes[0].id,
      sku: form.sku || identifiers.sku,
    };
    const nextTranslations = (translations.length ? translations : [{ ...EMPTY_TRANSLATION }]).map((translation, index) => ({
      ...translation,
      languageCode: translation.languageCode || (index === 0 ? vietnamese?.code ?? 'vi' : ''),
      slug: translation.slug || identifiers.slug,
    }));

    defaultsAppliedRef.current = true;
    setForm(nextForm);
    setTranslations(nextTranslations);
    initialDraftRef.current = serializeDraft(nextForm, nextTranslations, images, thumbnailFile);
  }, [categories, draftReady, form, images, languages, loadingMaster, mode, productTypes, thumbnailFile, translations]);

  useEffect(() => {
    if (!isDirty || savedRef.current) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty || savedRef.current) return;
    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingNavigation(`${url.pathname}${url.search}${url.hash}`);
      setExitDialogOpen(true);
    };
    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, [isDirty]);

  const clearFieldError = (key: string) => {
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const updateForm = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    clearFieldError(String(key));
  };

  const updateTranslation = (index: number, patch: Partial<ProductTranslation>) => {
    setTranslations((current) => {
      const next = [...current];
      next[index] = { ...next[index], ...patch };
      return next;
    });
    Object.keys(patch).forEach((key) => clearFieldError(`translation-${index}-${key}`));
    clearFieldError('translations');
  };

  const handleCategoryChange = (categoryId: number) => {
    clearFieldError('categoryId');
    if (mode !== 'create') {
      setForm((current) => ({ ...current, categoryId }));
      return;
    }

    const identifiers = buildCategoryIdentifiers(
      categories.find((category) => category.id === categoryId),
      productCodeSuffixRef.current,
    );
    setForm((current) => ({ ...current, categoryId, sku: identifiers.sku }));
    setTranslations((current) => current.map((translation) => ({ ...translation, slug: identifiers.slug })));
    clearFieldError('sku');
    translations.forEach((_, index) => clearFieldError(`translation-${index}-slug`));
  };

  const addTranslation = () => {
    setTranslations((current) => [...current, { ...EMPTY_TRANSLATION }]);
    clearFieldError('translations');
  };

  const removeTranslation = (index: number) => {
    setTranslations((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setFieldErrors({});
  };

  const isImageFile = (file: File) => file.type.startsWith('image/');

  const handleThumbnailFile = (file: File) => {
    if (!isImageFile(file)) {
      setThumbnailError('File đã chọn không phải ảnh. Hãy chọn một file ảnh hợp lệ.');
      return;
    }
    setThumbnailError(null);
    setThumbnailPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    setThumbnailMeta({ name: file.name, size: file.size || 0 });
    setThumbnailFile(file);
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailMeta(null);
    setThumbnailError(null);
    setThumbnailPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    updateForm('thumbnailUrl', '');
  };

  const handleAddImages = (files: File[]) => {
    const validFiles = files.filter(isImageFile);
    const knownSignatures = new Set(
      images.flatMap((image) => (image.file ? [fileSignature(image.file)] : [])),
    );
    const uniqueFiles = validFiles.filter((file) => {
      const signature = fileSignature(file);
      if (knownSignatures.has(signature)) return false;
      knownSignatures.add(signature);
      return true;
    });

    if (validFiles.length === 0) {
      setImagesError('Không có file ảnh hợp lệ. Hãy chọn file ảnh rồi thử lại.');
      return;
    }

    const ignoredInvalid = files.length - validFiles.length;
    const ignoredDuplicate = validFiles.length - uniqueFiles.length;
    if (ignoredInvalid || ignoredDuplicate) {
      const reasons = [
        ignoredInvalid ? `${ignoredInvalid} file không phải ảnh` : '',
        ignoredDuplicate ? `${ignoredDuplicate} file trùng` : '',
      ].filter(Boolean);
      setImagesError(`Đã bỏ qua ${reasons.join(' và ')}.`);
    } else {
      setImagesError(null);
    }

    if (uniqueFiles.length === 0) return;

    const newImages: ProductImageItem[] = uniqueFiles.map((file) => ({
      id: nextImageIdRef.current--,
      imageUrl: '',
      sortOrder: 0,
      content: '',
      fileName: file.name,
      contentType: file.type || 'image/*',
      file,
      previewUrl: URL.createObjectURL(file),
      isFromServer: false,
    }));
    setImages((current) =>
      [...current, ...newImages].map((image, index) => ({ ...image, sortOrder: index + 1 })),
    );
  };

  const removeImage = (id: number) => {
    setImages((current) => {
      const item = current.find((image) => image.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return current
        .filter((image) => image.id !== id)
        .map((image, index) => ({ ...image, sortOrder: index + 1 }));
    });
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    setImages((current) => {
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= current.length || toIndex >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((image, index) => ({ ...image, sortOrder: index + 1 }));
    });
  };


  const requestExit = () => {
    if (saving || deleting) return;
    if (isDirty) {
      setPendingNavigation('/admin/products');
      setExitDialogOpen(true);
      return;
    }
    navigate('/admin/products');
  };

  const focusFirstError = () => {
    window.requestAnimationFrame(() => {
      const firstInvalid = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      if (!firstInvalid) return;
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid.focus({ preventScroll: true });
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || deleting) return;

    const nextErrors = validateProduct(form, translations, mode, initialProduct?.sku);
    setFieldErrors(nextErrors);
    setSubmitError(null);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError();
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      if (mode === 'edit' && productId) {
        formData.append('Id', String(productId));
      }
      formData.append('Sku', form.sku);
      formData.append('Price', String(Number(form.price) || 0));
      if (form.salePrice > 0) {
        formData.append('SalePrice', String(form.salePrice));
      }
      formData.append('TracksInventory', String(form.tracksInventory));
      if (form.tracksInventory && form.stock !== '') {
        formData.append('Stock', String(Number(form.stock) || 0));
      } else if (mode === 'edit') {
        formData.append('Stock', '0');
      }
      formData.append('CategoryId', String(Number(form.categoryId) || 0));
      formData.append('ProductTypeId', String(Number(form.productTypeId) || 0));

      if (thumbnailFile) {
        formData.append('ThumbnailFile', thumbnailFile);
      } else if (form.thumbnailUrl) {
        formData.append('ThumbnailUrl', form.thumbnailUrl);
      }

      form.tagIds.forEach((id, index) => formData.append(`TagIds[${index}]`, String(id)));
      form.colorIds.forEach((id, index) => formData.append(`ColorIds[${index}]`, String(id)));
      form.collectionIds.forEach((id, index) => formData.append(`CollectionIds[${index}]`, String(id)));
      form.styleIds.forEach((id, index) => formData.append(`StyleIds[${index}]`, String(id)));
      form.occasionIds.forEach((id, index) => formData.append(`OccasionIds[${index}]`, String(id)));

      translations.forEach((translation, index) => {
        formData.append(`Translations[${index}].LanguageCode`, translation.languageCode);
        formData.append(`Translations[${index}].Name`, translation.name);
        formData.append(`Translations[${index}].Slug`, translation.slug);
        if (translation.description) {
          formData.append(`Translations[${index}].Description`, translation.description);
        }
      });

      images.forEach((image, index) => {
        formData.append(`Images[${index}].SortOrder`, String(index + 1));
        if (mode === 'edit' && image.isFromServer) {
          formData.append(`Images[${index}].Id`, String(image.id));
        }
        if (image.file) {
          formData.append(`Images[${index}].ImageFile`, image.file);
        } else if (image.imageUrl) {
          formData.append(`Images[${index}].ImageUrl`, image.imageUrl);
        }
      });

      if (mode === 'edit' && productId) {
        await ProductApi.updateWithFormData(productId, formData);
      } else {
        await ProductApi.createWithFormData(formData);
      }

      savedRef.current = true;
      navigate('/admin/products');
    } catch (requestError) {
      setSubmitError(getApiErrorMessage(requestError));
      window.requestAnimationFrame(() => {
        document.getElementById('product-submit-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!productId || deleting || saving) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await ProductApi.remove(productId);
      savedRef.current = true;
      navigate('/admin/products');
    } catch (requestError) {
      setDeleteError(getApiErrorMessage(requestError));
    } finally {
      setDeleting(false);
    }
  };

  const formInputClass = (key: string) =>
    `${inputBaseClass} ${fieldErrors[key] ? 'border-admin-status-error focus:border-admin-status-error focus:ring-admin-status-error/15' : 'border-admin-input-border'}`;

  const saveLabel = saving
    ? hasPendingFiles
      ? 'Đang tải ảnh và lưu...'
      : 'Đang lưu...'
    : mode === 'edit'
      ? 'Lưu thay đổi'
      : 'Lưu sản phẩm';

  return (
    <div className="mx-auto max-w-admin-content pb-24 lg:pb-8">
      <header className="mb-6 flex items-start gap-3">
        <button
          type="button"
          onClick={requestExit}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-admin-control border border-admin-border bg-admin-card text-admin-text-secondary transition-colors hover:bg-admin-muted hover:text-admin-text-primary"
          aria-label="Quay lại danh sách sản phẩm"
        >
          <ArrowLeft size={19} strokeWidth={1.8} aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-admin-text-primary">
            {mode === 'edit' ? 'Chỉnh sửa sản phẩm' : 'Tạo sản phẩm'}
          </h1>
          <p className="mt-1 text-sm leading-6 text-admin-text-secondary">
            {mode === 'edit' && productId
              ? `Cập nhật thông tin cho sản phẩm #${productId}.`
              : 'Điền các thông tin cần thiết để thêm sản phẩm vào cửa hàng.'}
          </p>
          {isDirty ? (
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-admin-status-warning">
              <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
              Có thay đổi chưa lưu
            </p>
          ) : null}
        </div>
      </header>

      {masterError ? (
        <div className="mb-5 rounded-admin-control border border-admin-status-error/30 bg-red-50 px-4 py-3" role="alert">
          <p className="font-medium text-admin-status-error">Không tải được dữ liệu danh mục.</p>
          <p className="mt-1 text-sm text-admin-status-error">{masterError}</p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        <div className="overflow-hidden rounded-admin-panel border border-admin-border bg-admin-card lg:col-span-8 xl:col-span-9">
          <section className="p-4 sm:p-5" aria-labelledby="product-basic-heading">
            <div className="mb-4">
              <h2 id="product-basic-heading" className="text-base font-semibold text-admin-text-primary">Thông tin sản phẩm</h2>
              <p className="mt-1 text-sm text-admin-text-secondary">
                Chọn danh mục trước; SKU và slug sẽ được điền tự động nhưng vẫn có thể sửa.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="product-type" className="block text-sm font-medium text-admin-text-primary">
                  Dòng sản phẩm <span className="text-admin-status-error" aria-hidden="true">*</span>
                </label>
                <div className="mt-2">
                  <AdminSelect<number>
                    inputId="product-type"
                    options={productTypeOptions}
                    isDisabled={loadingMaster}
                    isLoading={loadingMaster}
                    placeholder={loadingMaster ? 'Đang tải...' : 'Chọn dòng sản phẩm'}
                    value={productTypeOptions.find((option) => option.value === form.productTypeId) ?? null}
                    onChange={(next) => updateForm('productTypeId', next?.value ?? 0)}
                    aria-invalid={Boolean(fieldErrors.productTypeId)}
                    aria-describedby={fieldErrors.productTypeId ? 'product-type-error' : undefined}
                  />
                </div>
                <FieldMessage id="product-type-error" message={fieldErrors.productTypeId} />
              </div>
              <div>
                <label htmlFor="product-category" className="block text-sm font-medium text-admin-text-primary">
                  Danh mục <span className="text-admin-status-error" aria-hidden="true">*</span>
                </label>
                <div className="mt-2">
                  <AdminSelect<number>
                    inputId="product-category"
                    options={categoryOptions}
                    isDisabled={loadingMaster}
                    isLoading={loadingMaster}
                    placeholder={loadingMaster ? 'Đang tải...' : 'Chọn danh mục'}
                    value={categoryOptions.find((option) => option.value === form.categoryId) ?? null}
                    onChange={(next) => handleCategoryChange(next?.value ?? 0)}
                    aria-invalid={Boolean(fieldErrors.categoryId)}
                    aria-describedby={fieldErrors.categoryId ? 'product-category-error' : undefined}
                  />
                </div>
                <FieldMessage id="product-category-error" message={fieldErrors.categoryId} />
              </div>
            </div>

            <FieldMessage id="product-translations-error" message={fieldErrors.translations} />
            <div className="mt-4 space-y-4">
              {translations.map((translation, index) => {
                const prefix = `translation-${index}`;
                const languageError = fieldErrors[`${prefix}-languageCode`];
                const nameError = fieldErrors[`${prefix}-name`];
                const slugError = fieldErrors[`${prefix}-slug`];
                const availableLanguages = languageOptions.filter((option) =>
                  !translations.some((item, itemIndex) => itemIndex !== index && item.languageCode === option.value));

                return (
                  <fieldset
                    key={index}
                    className={index === 0 ? '' : 'rounded-admin-control border border-admin-border bg-admin-muted/30 p-4'}
                  >
                    {index > 0 ? <legend className="px-1 text-sm font-semibold text-admin-text-primary">Ngôn ngữ bổ sung {index}</legend> : null}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label htmlFor={`${prefix}-language`} className="block text-sm font-medium text-admin-text-primary">
                          Ngôn ngữ <span className="text-admin-status-error" aria-hidden="true">*</span>
                        </label>
                        <div className="mt-2">
                          <AdminSelect<string>
                            inputId={`${prefix}-language`}
                            options={availableLanguages}
                            isDisabled={loadingMaster}
                            isLoading={loadingMaster}
                            placeholder={loadingMaster ? 'Đang tải...' : 'Chọn ngôn ngữ'}
                            value={languageOptions.find((option) => option.value === translation.languageCode) ?? null}
                            onChange={(next) => updateTranslation(index, { languageCode: next?.value ?? '' })}
                            aria-invalid={Boolean(languageError)}
                            aria-describedby={languageError ? `${prefix}-language-error` : undefined}
                          />
                        </div>
                        <FieldMessage id={`${prefix}-language-error`} message={languageError} />
                      </div>
                      {index === 0 ? (
                        <div>
                          <label htmlFor="product-sku" className="block text-sm font-medium text-admin-text-primary">
                            Mã SKU <span className="text-admin-status-error" aria-hidden="true">*</span>
                          </label>
                          <input
                            id="product-sku"
                            className={`mt-2 ${formInputClass('sku')}`}
                            value={form.sku}
                            onChange={(event) => updateForm('sku', event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, mode === 'create' ? 4 : 50))}
                            maxLength={mode === 'create' ? 4 : 50}
                            disabled={mode === 'edit'}
                            aria-invalid={Boolean(fieldErrors.sku)}
                            aria-describedby={fieldErrors.sku ? 'product-sku-error' : undefined}
                          />
                          <FieldMessage id="product-sku-error" message={fieldErrors.sku} />
                          {mode === 'edit' ? <p className="mt-1.5 text-xs text-admin-text-muted">SKU được giữ nguyên để không làm sai watermark và dữ liệu đơn hàng cũ.</p> : null}
                        </div>
                      ) : null}
                      <div>
                        <label htmlFor={`${prefix}-name`} className="block text-sm font-medium text-admin-text-primary">
                          Tên sản phẩm <span className="text-admin-status-error" aria-hidden="true">*</span>
                        </label>
                        <input
                          id={`${prefix}-name`}
                          className={`mt-2 ${formInputClass(`${prefix}-name`)}`}
                          value={translation.name}
                          onChange={(event) => updateTranslation(index, { name: event.target.value })}
                          aria-invalid={Boolean(nameError)}
                          aria-describedby={nameError ? `${prefix}-name-error` : undefined}
                        />
                        <FieldMessage id={`${prefix}-name-error`} message={nameError} />
                      </div>
                      <div>
                        <label htmlFor={`${prefix}-slug`} className="block text-sm font-medium text-admin-text-primary">
                          Slug <span className="text-admin-status-error" aria-hidden="true">*</span>
                        </label>
                        <input
                          id={`${prefix}-slug`}
                          className={`mt-2 ${formInputClass(`${prefix}-slug`)}`}
                          value={translation.slug}
                          onChange={(event) => updateTranslation(index, { slug: event.target.value })}
                          aria-invalid={Boolean(slugError)}
                          aria-describedby={slugError ? `${prefix}-slug-error` : undefined}
                        />
                        <FieldMessage id={`${prefix}-slug-error`} message={slugError} />
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor={`${prefix}-description`} className="block text-sm font-medium text-admin-text-primary">
                          Mô tả <span className="font-normal text-admin-text-secondary">(không bắt buộc)</span>
                        </label>
                        <textarea
                          id={`${prefix}-description`}
                          rows={3}
                          className={`mt-2 resize-y ${inputBaseClass} border-admin-input-border`}
                          value={translation.description}
                          onChange={(event) => updateTranslation(index, { description: event.target.value })}
                        />
                      </div>
                    </div>
                    {index > 0 ? (
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeTranslation(index)}
                          className="inline-flex min-h-10 items-center gap-2 rounded-admin-control px-3 text-sm font-medium text-admin-status-error hover:bg-red-50"
                        >
                          <Trash2 size={16} aria-hidden="true" /> Xóa ngôn ngữ
                        </button>
                      </div>
                    ) : null}
                  </fieldset>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addTranslation}
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-admin-control border border-admin-border px-3 text-sm font-semibold text-admin-text-secondary transition-colors hover:bg-admin-muted hover:text-admin-text-primary"
            >
              <Plus size={16} aria-hidden="true" /> Thêm ngôn ngữ khác
            </button>
          </section>

          <details className="group border-t border-admin-border">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4 text-sm font-semibold text-admin-text-primary sm:px-5">
              Thuộc tính bổ sung
              <span className="text-xs font-normal text-admin-text-secondary group-open:hidden">Mở khi cần</span>
              <span className="hidden text-xs font-normal text-admin-text-secondary group-open:inline">Thu gọn</span>
            </summary>
            <div className="grid grid-cols-1 gap-4 border-t border-admin-border bg-admin-muted/20 p-4 md:grid-cols-2 sm:p-5">
              <AttributeMultiSelect
                label="Thẻ (không bắt buộc)"
                inputId="product-tags"
                options={tags}
                selectedIds={form.tagIds}
                onChange={(next) => updateForm('tagIds', next)}
                loading={loadingMaster}
                placeholder="Chọn thẻ"
              />
              <AttributeMultiSelect
                label="Màu sắc (không bắt buộc)"
                inputId="product-colors"
                variant="colors"
                options={colors}
                selectedIds={form.colorIds}
                onChange={(next) => updateForm('colorIds', next)}
                loading={loadingMaster}
                placeholder="Chọn màu"
              />
              <AttributeMultiSelect
                label="Bộ sưu tập (không bắt buộc)"
                inputId="product-collections"
                options={collections}
                selectedIds={form.collectionIds}
                onChange={(next) => updateForm('collectionIds', next)}
                loading={loadingMaster}
                placeholder="Chọn bộ sưu tập"
              />
              <AttributeMultiSelect
                label="Phong cách (không bắt buộc)"
                inputId="product-styles"
                options={styles}
                selectedIds={form.styleIds}
                onChange={(next) => updateForm('styleIds', next)}
                loading={loadingMaster}
                placeholder="Chọn phong cách"
              />
              <div className="md:col-span-2">
                <AttributeMultiSelect
                  label="Dịp tặng (không bắt buộc)"
                  inputId="product-occasions"
                  options={occasions}
                  selectedIds={form.occasionIds}
                  onChange={(next) => updateForm('occasionIds', next)}
                  loading={loadingMaster}
                  placeholder="Chọn dịp tặng"
                />
              </div>
            </div>
          </details>

          <section className="border-t border-admin-border p-4 sm:p-6" aria-labelledby="product-price-heading">
            <div className="mb-5">
              <h2 id="product-price-heading" className="text-base font-semibold text-admin-text-primary">
                Giá bán và tồn kho
              </h2>
              <p className="mt-1 max-w-[65ch] text-sm leading-6 text-admin-text-secondary">
                Chọn cách bán phù hợp: lấy từ hàng có sẵn hoặc chỉ làm khi khách đặt.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label
                htmlFor="product-tracks-inventory"
                className={`md:col-span-3 flex cursor-pointer items-start gap-3 rounded-admin-control border p-3.5 transition-colors ${form.tracksInventory ? 'border-admin-primary/40 bg-admin-primary/5' : 'border-admin-border bg-admin-muted/35 hover:border-admin-primary/35'}`}
              >
                <input
                  id="product-tracks-inventory"
                  type="checkbox"
                  checked={form.tracksInventory}
                  onChange={(event) => updateForm('tracksInventory', event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-admin-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/25"
                  aria-describedby="product-tracks-inventory-help"
                />
                <span>
                  <span className="block text-sm font-semibold text-admin-text-primary">Sản phẩm có quản lý tồn kho</span>
                  <span id="product-tracks-inventory-help" className="mt-0.5 block text-xs leading-5 text-admin-text-secondary">
                    Bật cho sản phẩm có sẵn để hệ thống kiểm tra và trừ tồn kho. Tắt cho hoa bó hoặc sản phẩm chỉ làm khi có đơn.
                  </span>
                </span>
              </label>
              <div>
                <label htmlFor="product-price" className="block text-sm font-medium text-admin-text-primary">
                  Giá bán <span className="text-admin-status-error" aria-hidden="true">*</span>
                </label>
                <p id="product-price-help" className="mt-1 text-xs leading-5 text-admin-text-secondary">Đơn vị: VNĐ.</p>
                <div className="relative mt-2">
                  <input
                    id="product-price"
                    type="text"
                    inputMode="numeric"
                    className={`pr-8 text-right font-mono tabular-nums ${formInputClass('price')}`}
                    value={formatVndInput(form.price)}
                    onChange={(event) => updateForm('price', parseVndInput(event.target.value))}
                    aria-invalid={Boolean(fieldErrors.price)}
                    aria-describedby={fieldErrors.price ? 'product-price-help product-price-error' : 'product-price-help'}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-admin-text-muted">₫</span>
                </div>
                <FieldMessage id="product-price-error" message={fieldErrors.price} />
              </div>
              <div>
                <label htmlFor="product-sale-price" className="block text-sm font-medium text-admin-text-primary">
                  Giá khuyến mãi
                </label>
                <p id="product-sale-price-help" className="mt-1 text-xs leading-5 text-admin-text-secondary">
                  Nhập 0 khi không áp dụng.
                </p>
                <div className="relative mt-2">
                  <input
                    id="product-sale-price"
                    type="text"
                    inputMode="numeric"
                    className={`pr-8 text-right font-mono tabular-nums ${formInputClass('salePrice')}`}
                    value={formatVndInput(form.salePrice)}
                    onChange={(event) => updateForm('salePrice', parseVndInput(event.target.value))}
                    placeholder="0"
                    aria-invalid={Boolean(fieldErrors.salePrice)}
                    aria-describedby={fieldErrors.salePrice ? 'product-sale-price-help product-sale-price-error' : 'product-sale-price-help'}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-admin-text-muted">₫</span>
                </div>
                <FieldMessage id="product-sale-price-error" message={fieldErrors.salePrice} />
              </div>
              <div>
                <label htmlFor="product-stock" className="block text-sm font-medium text-admin-text-primary">
                  Tồn kho <span className="text-xs font-normal text-admin-text-muted">(không bắt buộc)</span>
                </label>
                <p id="product-stock-help" className="mt-1 text-xs leading-5 text-admin-text-secondary">
                  {form.tracksInventory ? 'Để trống nếu số lượng hiện tại là 0.' : 'Không áp dụng cho sản phẩm làm theo đơn.'}
                </p>
                <input
                  id="product-stock"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  className={`mt-2 font-mono tabular-nums ${formInputClass('stock')}`}
                  disabled={!form.tracksInventory}
                  value={form.stock}
                  onChange={(event) => updateForm('stock', event.target.value === '' ? '' : Number(event.target.value))}
                  placeholder="0"
                  aria-invalid={Boolean(fieldErrors.stock)}
                  aria-describedby={fieldErrors.stock ? 'product-stock-help product-stock-error' : 'product-stock-help'}
                />
                <FieldMessage id="product-stock-error" message={fieldErrors.stock} />
              </div>
            </div>
          </section>

          <section className="border-t border-admin-border p-4 sm:p-6" aria-labelledby="product-images-heading">
            <SectionHeading
              id="product-images-heading"
              title="Hình ảnh chi tiết"
              description="Chọn nhiều ảnh cùng lúc. Ảnh chỉ được tải lên khi bạn lưu sản phẩm."
            />

            <label
              htmlFor="product-images-input"
              className="flex min-h-24 cursor-pointer items-center justify-center gap-3 rounded-admin-control border border-dashed border-admin-border bg-admin-muted/35 px-4 py-4 text-center transition-colors hover:border-admin-primary/55 hover:bg-admin-primary-light"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (event.dataTransfer.files?.length) handleAddImages(Array.from(event.dataTransfer.files));
              }}
            >
              <UploadCloud size={24} strokeWidth={1.6} className="shrink-0 text-admin-primary" aria-hidden="true" />
              <span className="text-left">
                <span className="block text-sm font-semibold text-admin-text-primary">Chọn hoặc kéo thả ảnh chi tiết</span>
                <span className="mt-0.5 block text-xs text-admin-text-secondary">Có thể chọn nhiều ảnh cùng lúc.</span>
              </span>
              <input
                id="product-images-input"
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(event) => {
                  if (event.target.files?.length) handleAddImages(Array.from(event.target.files));
                  event.target.value = '';
                }}
              />
            </label>

            {imagesError ? (
              <div className="mt-3 flex items-start justify-between gap-3 rounded-admin-control border border-admin-status-warning/30 bg-amber-50 px-3 py-2.5 text-sm text-admin-status-warning" role="status">
                <span>{imagesError}</span>
                <label htmlFor="product-images-input" className="shrink-0 cursor-pointer font-semibold underline underline-offset-2">
                  Chọn lại
                </label>
              </div>
            ) : null}

            {images.length === 0 ? (
              <div className="mt-4 flex items-center gap-3 rounded-admin-control bg-admin-muted/50 px-4 py-3 text-sm text-admin-text-muted">
                <ImagePlus size={20} strokeWidth={1.7} aria-hidden="true" />
                Chưa có ảnh chi tiết.
              </div>
            ) : (
              <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Thứ tự ảnh chi tiết">
                {images.map((image, index) => {
                  const preview = image.previewUrl ?? resolveApiResourceUrl(image.imageUrl);
                  return (
                    <li
                      key={image.id}
                      className="min-w-0 overflow-hidden rounded-admin-control border border-admin-border bg-admin-card"
                    >
                      <div className="relative aspect-square bg-admin-muted">
                        {preview ? (
                          <img
                            src={preview}
                            alt={`Ảnh chi tiết ${index + 1}: ${image.fileName}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-admin-text-muted">Không có bản xem trước</div>
                        )}
                        <span className="absolute left-2 top-2 rounded-md bg-slate-950/75 px-2 py-1 text-xs font-semibold text-white">
                          {index + 1}
                        </span>
                        {image.file ? (
                          <span className="absolute bottom-2 left-2 rounded-md bg-admin-status-warning px-2 py-1 text-[11px] font-semibold text-white">
                            Chờ tải
                          </span>
                        ) : (
                          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-admin-status-success px-2 py-1 text-[11px] font-semibold text-white">
                            <CheckCircle2 size={12} aria-hidden="true" /> Đã lưu
                          </span>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="truncate text-xs font-medium text-admin-text-secondary" title={image.fileName}>{image.fileName}</p>
                        <div className="mt-2 grid grid-cols-3 gap-1">
                          <button
                            type="button"
                            onClick={() => moveImage(index, index - 1)}
                            disabled={index === 0}
                            className="inline-flex min-h-10 items-center justify-center rounded-md text-admin-text-secondary transition-colors hover:bg-admin-muted disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label={`Đưa ảnh ${index + 1} lên trước`}
                          >
                            <ArrowUp size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImage(index, index + 1)}
                            disabled={index === images.length - 1}
                            className="inline-flex min-h-10 items-center justify-center rounded-md text-admin-text-secondary transition-colors hover:bg-admin-muted disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label={`Đưa ảnh ${index + 1} xuống sau`}
                          >
                            <ArrowDown size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(image.id)}
                            className="inline-flex min-h-10 items-center justify-center rounded-md text-admin-status-error transition-colors hover:bg-red-50"
                            aria-label={`Xóa ảnh ${index + 1}`}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        <aside className="space-y-5 lg:col-span-4 xl:col-span-3" aria-label="Ảnh đại diện và trạng thái">
          <section className="rounded-admin-panel border border-admin-border bg-admin-card p-4 sm:p-5" aria-labelledby="product-thumbnail-heading">
            <h2 id="product-thumbnail-heading" className="text-base font-semibold text-admin-text-primary">Ảnh đại diện</h2>
            <p className="mt-1 text-sm leading-6 text-admin-text-secondary">Ảnh chính hiển thị trong danh sách sản phẩm.</p>

            <div className="mt-4 overflow-hidden rounded-admin-control border border-admin-border bg-admin-muted">
              <div
                className="relative aspect-square"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const file = event.dataTransfer.files?.[0];
                  if (file) handleThumbnailFile(file);
                }}
              >
                {thumbnailPreviewUrl || form.thumbnailUrl.trim() ? (
                  <img src={thumbnailPreviewUrl ?? resolveApiResourceUrl(form.thumbnailUrl)} alt="Xem trước ảnh đại diện sản phẩm" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-4 text-center text-admin-text-muted">
                    <ImagePlus size={28} strokeWidth={1.5} aria-hidden="true" />
                    <p className="mt-2 text-xs leading-5">Chưa có ảnh đại diện</p>
                  </div>
                )}
                {thumbnailPreviewUrl || form.thumbnailUrl.trim() ? (
                  <button
                    type="button"
                    onClick={removeThumbnail}
                    className="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-admin-control bg-slate-950/75 text-white transition-colors hover:bg-slate-950"
                    aria-label="Xóa ảnh đại diện"
                  >
                    <X size={17} aria-hidden="true" />
                  </button>
                ) : null}
                {thumbnailFile ? (
                  <span className="absolute bottom-2 left-2 rounded-md bg-admin-status-warning px-2 py-1 text-[11px] font-semibold text-white">Chờ tải</span>
                ) : form.thumbnailUrl ? (
                  <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-admin-status-success px-2 py-1 text-[11px] font-semibold text-white">
                    <CheckCircle2 size={12} aria-hidden="true" /> Đã lưu
                  </span>
                ) : null}
              </div>
            </div>

            {thumbnailMeta ? (
              <div className="mt-2 text-xs text-admin-text-muted">
                <p className="truncate font-medium text-admin-text-secondary" title={thumbnailMeta.name}>{thumbnailMeta.name}</p>
                <p>{formatFileSize(thumbnailMeta.size)}</p>
              </div>
            ) : null}

            <label
              htmlFor="product-thumbnail-input"
              className="mt-4 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-admin-control border border-admin-border bg-admin-card px-3 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted"
            >
              <UploadCloud size={17} strokeWidth={1.8} aria-hidden="true" />
              {thumbnailPreviewUrl || form.thumbnailUrl ? 'Thay ảnh' : 'Chọn ảnh'}
              <input
                id="product-thumbnail-input"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleThumbnailFile(file);
                  event.target.value = '';
                }}
              />
            </label>
            {thumbnailError ? (
              <div className="mt-3 rounded-admin-control border border-admin-status-error/30 bg-red-50 p-3 text-sm text-admin-status-error" role="alert">
                <p>{thumbnailError}</p>
                <label htmlFor="product-thumbnail-input" className="mt-2 inline-block cursor-pointer font-semibold underline underline-offset-2">Chọn lại ảnh</label>
              </div>
            ) : null}
          </section>

          <section className="rounded-admin-panel border border-admin-border bg-admin-card p-4 sm:p-5" aria-labelledby="product-status-heading">
            <h2 id="product-status-heading" className="text-base font-semibold text-admin-text-primary">Trạng thái hiển thị</h2>
            <div className="mt-3 rounded-admin-control border border-admin-border bg-admin-disabled-bg px-3.5 py-3" aria-disabled="true">
              <p className="text-sm font-semibold text-admin-disabled-text">
                {mode === 'edit'
                  ? initialProduct?.isActive
                    ? 'Đang kinh doanh'
                    : 'Đang tạm ẩn'
                  : 'Theo mặc định hệ thống'}
              </p>
              <p className="mt-1 text-xs leading-5 text-admin-text-muted">
                Trạng thái chỉ hiển thị để tham khảo vì API sản phẩm hiện chưa nhận trường cập nhật này.
              </p>
            </div>
          </section>

          {mode === 'edit' && productId ? (
            <section className="rounded-admin-panel border border-admin-status-error/25 bg-admin-card p-4 sm:p-5" aria-labelledby="product-danger-heading">
              <h2 id="product-danger-heading" className="text-base font-semibold text-admin-text-primary">Xóa sản phẩm</h2>
              <p className="mt-1 text-sm leading-6 text-admin-text-secondary">Thao tác này được tách riêng và cần xác nhận.</p>
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setDeleteDialogOpen(true);
                }}
                disabled={saving || deleting}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-admin-control border border-admin-status-error/40 bg-admin-card px-3 text-sm font-semibold text-admin-status-error transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={17} strokeWidth={1.8} aria-hidden="true" />
                Xóa sản phẩm
              </button>
            </section>
          ) : null}
        </aside>

        <div className="fixed inset-x-0 bottom-0 z-admin-header border-t border-admin-border bg-admin-card/95 px-4 py-3 backdrop-blur-sm lg:static lg:z-auto lg:col-span-12 lg:rounded-admin-panel lg:border lg:px-5">
          <div className="mx-auto flex max-w-admin-content flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={requestExit}
              disabled={saving || deleting}
              className="min-h-11 rounded-admin-control border border-admin-border bg-admin-card px-4 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hủy
            </button>
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              {submitError ? (
                <p id="product-submit-error" className="max-w-xl text-sm leading-5 text-admin-status-error" role="alert">
                  Không thể lưu: {submitError} Bạn có thể kiểm tra thông tin và thử lại.
                </p>
              ) : null}
              <button
                type="submit"
                disabled={saving || deleting || loadingMaster}
                className="inline-flex min-h-11 min-w-36 items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-5 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-55"
              >
                {saving ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : null}
                {saveLabel}
              </button>
            </div>
          </div>
        </div>
      </form>

      <SettingsDialog
        open={exitDialogOpen}
        title="Rời trang khi chưa lưu?"
        description="Các thay đổi trên form sản phẩm sẽ bị mất."
        closeLabel="Tiếp tục chỉnh sửa"
        onRequestClose={() => {
          setExitDialogOpen(false);
          setPendingNavigation(null);
        }}
        footer={
          <>
            <button
              type="button"
              data-autofocus
              onClick={() => {
                setExitDialogOpen(false);
                setPendingNavigation(null);
              }}
              className="min-h-11 rounded-admin-control border border-admin-border bg-admin-card px-4 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted"
            >
              Tiếp tục chỉnh sửa
            </button>
            <button
              type="button"
              onClick={() => {
                savedRef.current = true;
                navigate(pendingNavigation ?? '/admin/products');
              }}
              className="min-h-11 rounded-admin-control bg-admin-status-warning px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-800"
            >
              Bỏ thay đổi và rời trang
            </button>
          </>
        }
      >
        <p className="text-sm leading-6 text-admin-text-secondary">Chọn tiếp tục chỉnh sửa nếu bạn muốn quay lại form và lưu dữ liệu.</p>
      </SettingsDialog>

      <SettingsDialog
        open={deleteDialogOpen}
        title="Xóa sản phẩm?"
        description="Sản phẩm sẽ bị xóa khỏi hệ thống nếu máy chủ cho phép thao tác này."
        closeLabel="Đóng xác nhận xóa"
        onRequestClose={() => {
          if (!deleting) setDeleteDialogOpen(false);
        }}
        footer={
          <>
            <button
              type="button"
              data-autofocus
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
              className="min-h-11 rounded-admin-control border border-admin-border bg-admin-card px-4 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-admin-control bg-admin-status-error px-4 text-sm font-semibold text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <Trash2 size={17} aria-hidden="true" />}
              {deleting ? 'Đang xóa...' : 'Xóa sản phẩm'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="rounded-admin-control border border-admin-status-error/25 bg-red-50 p-3 text-sm leading-6 text-admin-status-error">
            Không thể hoàn tác thao tác này từ giao diện quản trị.
          </div>
          {deleteError ? <p className="text-sm text-admin-status-error" role="alert">Không thể xóa: {deleteError}</p> : null}
        </div>
      </SettingsDialog>
    </div>
  );
};
