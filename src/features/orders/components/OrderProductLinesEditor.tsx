import React, { useEffect, useId, useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  ImageOff,
  ImagePlus,
  Images,
  PackageSearch,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { AdminSelect, type AdminSelectOption } from '@/shared/components/AdminSelect';
import { ImagePreview, type ImagePreviewItem } from '@/shared/components/ImagePreview';
import { SettingsDialog } from '@/features/settings/components/SettingsDialog';
import type { ProductDto } from '@/features/product/api/productApi';
import type { AttributeItem } from '@/features/settings/attributes/types/attributes.types';
import type { OrderImageDto, UpdateOrderLine } from '../types/order.types';
import type {
  OrderLineIngredientDraft,
  OrderLineIngredientOrigin,
} from './OrderLineIngredientsEditor';
import { resolveApiResourceUrl } from '@/services/apiResourceUrl';
import { formatVndInput, parseVndInput } from '@/shared/utils/displayFormatters';
import { formatOrderCurrency } from '../utils/orderListFormatters';

export type OrderProductLineDraft = UpdateOrderLine & {
  key: string;
  imageFiles: File[];
  existingImages: OrderImageDto[];
  snapshotThumbnailUrl?: string | null;
  ingredientDrafts: OrderLineIngredientDraft[];
  ingredientOrigin: OrderLineIngredientOrigin;
};

export type ProductLineValidationError = {
  message: string;
  fieldId: string;
  inDetails: boolean;
};

type ProductSelectOption = AdminSelectOption<string> & {
  searchText: string;
  productCode?: string;
  productName: string;
  price?: number;
  thumbnailUrl?: string | null;
  isManual?: boolean;
};

type Props = {
  items: OrderProductLineDraft[];
  products: ProductDto[];
  categories: AttributeItem[];
  productTypes: AttributeItem[];
  lineErrors: Record<number, ProductLineValidationError>;
  expandedLineKeys: Set<string>;
  inventoryMaterialLineKeys: Set<string>;
  disabled?: boolean;
  onAddCatalogProduct: (productId: string) => void;
  onAddManualProduct: () => void;
  onSelectProduct: (index: number, value: string) => void;
  onUpdateLine: (index: number, patch: Partial<OrderProductLineDraft>) => void;
  onRemoveLine: (index: number) => void;
  onToggleExpanded: (lineKey: string) => void;
};

const inputClass =
  'min-h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 py-2 text-sm text-admin-text-primary placeholder:text-admin-text-muted transition-colors focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text';
const labelClass = 'mb-1 block min-h-4 text-xs font-medium leading-4 text-admin-text-secondary';
const OUTSIDE_CATALOG_PRODUCT_NAME = 'Sản phẩm ngoài danh mục';

const attributeName = (attribute: AttributeItem) =>
  attribute.translations.find((translation) => translation.languageCode.toLowerCase().startsWith('vi'))?.name?.trim()
  || attribute.translations[0]?.name?.trim()
  || attribute.code
  || `Thuộc tính #${attribute.id}`;

const productName = (product: ProductDto) =>
  product.translations.find((translation) => translation.languageCode.toLowerCase().startsWith('vi'))?.name?.trim()
  || product.translations[0]?.name?.trim()
  || product.sku;

const productCode = (value?: string | null) => value?.trim() || 'Chưa có mã';

const normalizeProductSearch = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLocaleLowerCase('vi')
  .trim();

const productImageSource = (product: ProductDto) => {
  const detailImage = [...product.images]
    .filter((image) => image.isActive)
    .sort((left, right) => left.sortOrder - right.sortOrder)[0]?.imageUrl;
  return product.thumbnailUrl || detailImage || '';
};

const productPreviewItems = (
  product: ProductDto | undefined,
  fallbackSrc: string | null | undefined,
  alt: string,
): ImagePreviewItem[] => {
  const catalogImages = product
    ? [
        product.thumbnailUrl,
        ...[...product.images]
          .filter((image) => image.isActive)
          .sort((left, right) => left.sortOrder - right.sortOrder)
          .map((image) => image.imageUrl),
      ]
    : [];

  return [fallbackSrc, ...catalogImages]
    .filter((source): source is string => Boolean(source?.trim()))
    .map((source, index) => ({
      src: source,
      alt: index === 0 ? alt : `${alt}, ảnh ${index + 1}`,
      title: alt,
    }));
};

const ProductOptionThumbnail: React.FC<{ src?: string | null; size?: 'small' | 'large' }> = ({
  src,
  size = 'small',
}) => {
  const resolvedSrc = resolveApiResourceUrl(src);
  const [failed, setFailed] = useState(false);
  const sizeClass = size === 'large' ? 'h-12 w-12' : 'h-9 w-9';

  useEffect(() => setFailed(false), [resolvedSrc]);

  if (!resolvedSrc || failed) {
    return (
      <span
        className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-admin-control border border-admin-border bg-admin-muted text-admin-text-muted`}
        role="img"
        aria-label="Sản phẩm chưa có ảnh"
        title="Sản phẩm chưa có ảnh"
      >
        <ImageOff size={size === 'large' ? 19 : 16} strokeWidth={1.7} aria-hidden="true" />
      </span>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt=""
      aria-hidden="true"
      width={size === 'large' ? 48 : 36}
      height={size === 'large' ? 48 : 36}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`${sizeClass} shrink-0 rounded-admin-control border border-admin-border object-cover`}
    />
  );
};

const ProductOptionContent: React.FC<{
  option: ProductSelectOption;
  context: 'menu' | 'value';
}> = ({ option, context }) => {
  if (context === 'value') {
    return <span className="block truncate" title={option.label}>{option.label}</span>;
  }

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <ProductOptionThumbnail src={option.thumbnailUrl} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-admin-text-primary" title={option.label}>
          {option.productCode ? <span className="text-xs font-semibold tabular-nums">{option.productCode}</span> : null}
          {option.productCode ? <span className="text-admin-text-muted"> · </span> : null}
          <span>{option.productName}</span>
        </p>
        {option.price != null ? (
          <p className="mt-0.5 text-xs tabular-nums text-admin-text-secondary">
            {formatOrderCurrency(option.price)}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-admin-text-muted">Nhập thông tin sản phẩm riêng</p>
        )}
      </div>
    </div>
  );
};

const OrderItemImagePreviews: React.FC<{
  existingImages: OrderImageDto[];
  files: File[];
  productName: string;
  onRemove: (index: number) => void;
}> = ({ existingImages, files, productName: itemProductName, onRemove }) => {
  const [previews, setPreviews] = useState<Array<{ file: File; url: string }>>([]);

  useEffect(() => {
    const nextPreviews = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPreviews(nextPreviews);
    return () => nextPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [files]);

  const gallery: ImagePreviewItem[] = [
    ...existingImages.map((image, index) => ({
      src: image.imageUrl,
      alt: image.description || `Ảnh minh họa đã lưu ${index + 1} của ${itemProductName}`,
      title: `Ảnh minh họa của ${itemProductName}`,
      caption: image.description || undefined,
    })),
    ...previews.map((preview, index) => ({
      src: preview.url,
      alt: `Ảnh minh họa mới ${index + 1} của ${itemProductName}`,
      title: `Ảnh minh họa của ${itemProductName}`,
      caption: preview.file.name,
    })),
  ];

  return (
    <>
      {existingImages.map((image, index) => (
        <ImagePreview
          key={image.id}
          src={image.imageUrl}
          alt={image.description || `Ảnh minh họa đã lưu ${index + 1} của ${itemProductName}`}
          title={`Ảnh minh họa của ${itemProductName}`}
          caption={image.description || undefined}
          gallery={gallery}
          buttonClassName="h-11 w-11 rounded-admin-control"
          thumbnailClassName="h-11 w-11 rounded-admin-control border border-admin-border object-cover"
        />
      ))}
      {previews.map((preview, index) => (
        <div key={`${preview.file.name}-${preview.file.lastModified}`} className="group relative h-11 w-11 shrink-0">
          <ImagePreview
            src={preview.url}
            alt={`Ảnh minh họa mới ${index + 1} của ${itemProductName}`}
            title={`Ảnh minh họa của ${itemProductName}`}
            caption={preview.file.name}
            gallery={gallery}
            loading="eager"
            buttonClassName="h-full w-full rounded-admin-control"
            thumbnailClassName="h-full w-full rounded-admin-control border border-admin-border object-cover"
          />
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="absolute -right-2 -top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-admin-border bg-admin-card text-admin-status-error shadow-sm transition-colors hover:bg-admin-status-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-status-error/30"
            aria-label={`Bỏ ảnh ${preview.file.name}`}
            title="Bỏ ảnh"
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      ))}
    </>
  );
};

const statusIndicator = (label: string, Icon: typeof FileText) => (
  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-admin-text-secondary">
    <Icon size={13} strokeWidth={1.8} aria-hidden="true" />
    {label}
  </span>
);

export const OrderProductLinesEditor: React.FC<Props> = ({
  items,
  products,
  categories,
  productTypes,
  lineErrors,
  expandedLineKeys,
  inventoryMaterialLineKeys,
  disabled = false,
  onAddCatalogProduct,
  onAddManualProduct,
  onSelectProduct,
  onUpdateLine,
  onRemoveLine,
  onToggleExpanded,
}) => {
  const [addMode, setAddMode] = useState<'menu' | 'catalog' | null>(null);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null);
  const addPanelId = useId();

  const productOptions = useMemo<ProductSelectOption[]>(() => [
    {
      value: 'manual',
      label: OUTSIDE_CATALOG_PRODUCT_NAME,
      searchText: 'san pham ngoai danh muc',
      productName: OUTSIDE_CATALOG_PRODUCT_NAME,
      isManual: true,
    },
    ...products.map((product) => ({
      value: String(product.id),
      label: `${productCode(product.sku)} · ${productName(product)}`,
      searchText: normalizeProductSearch(`${product.sku} ${productName(product)}`),
      productCode: product.sku,
      productName: productName(product),
      price: product.salePrice ?? product.price,
      thumbnailUrl: productImageSource(product),
      isDisabled: !product.isActive,
    })),
  ], [products]);
  const catalogOptions = productOptions.filter((option) => !option.isManual);

  useEffect(() => {
    if (addMode !== 'catalog') return;
    const frame = requestAnimationFrame(() => document.getElementById('order-add-catalog-product')?.focus());
    return () => cancelAnimationFrame(frame);
  }, [addMode]);

  useEffect(() => {
    if (!addMode) return;
    const closeAndRestoreFocus = () => {
      setAddMode(null);
      requestAnimationFrame(() => document.getElementById('order-add-product-trigger')?.focus());
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeAndRestoreFocus();
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest('[data-product-add-panel]') || event.target.closest('#order-add-product-trigger')) return;
      setAddMode(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [addMode]);

  const beginManualProduct = () => {
    setAddMode(null);
    onAddManualProduct();
  };

  const beginCatalogProduct = (productId: string) => {
    setAddMode(null);
    onAddCatalogProduct(productId);
  };

  const lineHasUserData = (item: OrderProductLineDraft) => Boolean(
    item.productId
    || item.categoryId
    || item.productTypeId
    || item.unitPrice > 0
    || item.note?.trim()
    || item.imageFiles.length
    || item.existingImages.length
    || item.hasCard
    || item.cardMessage?.trim()
    || item.hasBanner
    || item.bannerMessage?.trim()
    || item.ingredientDrafts.length
    || inventoryMaterialLineKeys.has(item.key)
  );

  const requestRemove = (index: number) => {
    if (items.length <= 1) return;
    if (lineHasUserData(items[index])) setPendingDeleteIndex(index);
    else onRemoveLine(index);
  };

  return (
    <section className="rounded-admin-panel border border-admin-border bg-admin-card shadow-admin-panel" aria-labelledby="order-lines-title">
      <header className="relative flex flex-col gap-3 border-b border-admin-border px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="order-lines-title" className="text-sm font-semibold text-admin-text-primary">Sản phẩm trong đơn</h2>
            <span className="text-xs tabular-nums text-admin-text-muted">{items.length} sản phẩm</span>
          </div>
          <p className="mt-1 max-w-[70ch] text-xs leading-5 text-admin-text-secondary">
            Chọn sản phẩm có sẵn hoặc tạo sản phẩm riêng theo yêu cầu của khách.
          </p>
        </div>
        <button
          id="order-add-product-trigger"
          type="button"
          onClick={() => setAddMode((current) => current ? null : 'menu')}
          disabled={disabled}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-admin-control border border-admin-primary/35 bg-admin-card px-3 text-sm font-semibold text-admin-primary transition-colors hover:bg-admin-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
          aria-expanded={Boolean(addMode)}
          aria-controls={addPanelId}
          aria-haspopup="dialog"
        >
          <Plus size={16} aria-hidden="true" /> Thêm sản phẩm
        </button>
        {addMode ? (
          <div
            id={addPanelId}
            data-product-add-panel="true"
            role="dialog"
            aria-label="Thêm sản phẩm"
            className="absolute right-4 top-[calc(100%-0.25rem)] z-admin-popover w-[min(24rem,calc(100%-2rem))] rounded-admin-control border border-admin-border bg-admin-card p-2 shadow-admin-popover"
          >
            {addMode === 'menu' ? (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setAddMode('catalog')}
                  className="flex min-h-14 w-full items-center gap-3 rounded-admin-control px-3 py-2 text-left transition-colors hover:bg-admin-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/30"
                >
                  <PackageSearch size={19} className="shrink-0 text-admin-primary" aria-hidden="true" />
                  <span className="min-w-0">
                    <strong className="block text-sm font-semibold text-admin-text-primary">Chọn từ danh mục</strong>
                    <span className="mt-0.5 block text-xs text-admin-text-secondary">Tìm và chọn sản phẩm có sẵn</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={beginManualProduct}
                  className="flex min-h-14 w-full items-center gap-3 rounded-admin-control px-3 py-2 text-left transition-colors hover:bg-admin-accent-light/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/30"
                >
                  <ShoppingBag size={19} className="shrink-0 text-admin-accent" aria-hidden="true" />
                  <span className="min-w-0">
                    <strong className="block text-sm font-semibold text-admin-text-primary">Tạo sản phẩm ngoài danh mục</strong>
                    <span className="mt-0.5 block text-xs text-admin-text-secondary">Tạo sản phẩm riêng cho đơn hàng này</span>
                  </span>
                </button>
              </div>
            ) : (
              <div className="p-1">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="order-add-catalog-product" className="text-xs font-semibold text-admin-text-primary">Chọn sản phẩm từ danh mục</label>
                  <button
                    type="button"
                    onClick={() => setAddMode('menu')}
                    className="inline-flex min-h-9 items-center px-2 text-xs font-semibold text-admin-text-secondary hover:text-admin-text-primary"
                  >
                    Quay lại
                  </button>
                </div>
                <AdminSelect<string, ProductSelectOption>
                  inputId="order-add-catalog-product"
                  aria-label="Tìm sản phẩm để thêm vào đơn"
                  options={catalogOptions}
                  value={null}
                  onChange={(option) => option && beginCatalogProduct(option.value)}
                  placeholder="Tìm theo mã hoặc tên sản phẩm"
                  filterOption={(option, inputValue) => option.data.searchText.includes(normalizeProductSearch(inputValue))}
                  formatOptionLabel={(option, meta) => <ProductOptionContent option={option} context={meta.context} />}
                  isSearchable
                  openMenuOnFocus
                />
                {catalogOptions.length === 0 ? (
                  <p className="mt-2 text-xs leading-5 text-admin-text-muted">Chưa có sản phẩm danh mục đang hoạt động.</p>
                ) : null}
              </div>
            )}
          </div>
        ) : null}
      </header>

      <div className="divide-y divide-admin-border">
        {items.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <ShoppingBag size={24} className="mx-auto text-admin-text-muted" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-admin-text-primary">Đơn hàng chưa có sản phẩm</p>
            <p className="mt-1 text-xs text-admin-text-secondary">Dùng “Thêm sản phẩm” để bắt đầu.</p>
          </div>
        ) : items.map((item, index) => {
          const selectedProduct = item.productId
            ? products.find((product) => String(product.id) === item.productId)
            : undefined;
          const isManual = !item.productId;
          const isIncomplete = isManual && (!item.categoryId || !item.productTypeId || item.unitPrice <= 0);
          const selectedProductImage = item.snapshotThumbnailUrl || (selectedProduct ? productImageSource(selectedProduct) : '');
          const selectedProductAlt = `${productCode(item.productSku)} · ${item.productName}`;
          const selectedProductGallery = productPreviewItems(selectedProduct, selectedProductImage, selectedProductAlt);
          const catalogPrice = selectedProduct ? selectedProduct.salePrice ?? selectedProduct.price : null;
          const priceDifference = catalogPrice == null ? 0 : item.unitPrice - catalogPrice;
          const fallbackProductOption: ProductSelectOption | null = item.productId ? {
            value: item.productId,
            label: `${productCode(item.productSku)} · ${item.productName}`,
            searchText: normalizeProductSearch(`${item.productSku ?? ''} ${item.productName}`),
            productCode: item.productSku ?? undefined,
            productName: item.productName,
            price: item.unitPrice,
            thumbnailUrl: item.snapshotThumbnailUrl,
          } : null;
          const hasLoadedProductOption = productOptions.some((option) => option.value === item.productId);
          const lineProductOptions = [
            ...productOptions.map((option) => option.value === item.productId ? { ...option, isDisabled: false } : option),
            ...(!hasLoadedProductOption && fallbackProductOption ? [fallbackProductOption] : []),
          ];
          const selectedProductOption = lineProductOptions.find((option) => option.value === (item.productId ?? 'manual'))
            ?? lineProductOptions[0];
          const isExpanded = expandedLineKeys.has(item.key);
          const lineError = lineErrors[index];
          const detailsId = `order-line-details-${item.key}`;
          const errorId = `order-line-error-${index}`;
          const category = categories.find((candidate) => candidate.id === (item.categoryId ?? selectedProduct?.categoryId));
          const productType = productTypes.find((candidate) => candidate.id === (item.productTypeId ?? selectedProduct?.productTypeId));
          const metadata = [category ? attributeName(category) : null, productType ? attributeName(productType) : null].filter(Boolean);
          const lineTotal = item.unitPrice * Math.max(0, item.quantity);

          return (
            <article key={item.key} className={lineError ? 'bg-admin-status-error/5' : 'bg-admin-card'} aria-labelledby={`order-line-title-${item.key}`}>
              <div className={`flex min-w-0 items-start gap-3 px-4 py-3.5 ${lineError ? 'border-l-[3px] border-admin-status-error' : ''}`}>
                <ImagePreview
                  src={selectedProductImage}
                  alt={selectedProductAlt}
                  title={selectedProductAlt}
                  previewTitle={selectedProductAlt}
                  gallery={selectedProductGallery}
                  buttonClassName="h-12 w-12 rounded-admin-control"
                  thumbnailClassName="h-12 w-12 rounded-admin-control border border-admin-border object-cover"
                  fallbackClassName="h-12 w-12"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 id={`order-line-title-${item.key}`} className="min-w-0 truncate text-sm font-semibold text-admin-text-primary" title={isIncomplete ? 'Chưa hoàn tất' : item.productName}>
                      <span className="text-admin-text-secondary">Sản phẩm {index + 1}</span>
                      <span> · </span>
                      {isIncomplete ? 'Chưa hoàn tất' : item.productName}
                    </h3>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isManual ? 'bg-admin-accent-light text-admin-accent' : 'bg-admin-primary/8 text-admin-primary'}`}>
                      {isManual ? 'Ngoài danh mục' : 'Trong danh mục'}
                    </span>
                    {lineError ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-admin-status-error">
                        <AlertCircle size={13} aria-hidden="true" /> Cần kiểm tra
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-admin-text-secondary">
                    {item.productSku ? <span className="max-w-full truncate font-medium tabular-nums" title={item.productSku}>{item.productSku}</span> : null}
                    <span>SL {item.quantity}</span>
                    <span className="tabular-nums">{formatOrderCurrency(item.unitPrice)}/sản phẩm</span>
                    {item.quantity > 1 && item.unitPrice > 0 ? (
                      <span className="font-semibold tabular-nums text-admin-text-primary">Thành tiền {formatOrderCurrency(lineTotal)}</span>
                    ) : null}
                  </div>
                  {(item.note?.trim() || item.imageFiles.length > 0 || item.existingImages.length > 0 || item.hasCard || item.hasBanner) ? (
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {item.note?.trim() ? statusIndicator('Có ghi chú', FileText) : null}
                      {item.imageFiles.length > 0 || item.existingImages.length > 0 ? statusIndicator('Có ảnh', Images) : null}
                      {item.hasCard ? statusIndicator('Thiệp', FileText) : null}
                      {item.hasBanner ? statusIndicator('Banner', ImagePlus) : null}
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onToggleExpanded(item.key)}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-admin-control px-2.5 text-xs font-semibold text-admin-text-secondary transition-colors hover:bg-admin-muted hover:text-admin-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/30"
                    aria-label={`${isExpanded ? 'Thu gọn' : 'Mở'} chi tiết sản phẩm ${index + 1}`}
                    aria-expanded={isExpanded}
                    aria-controls={detailsId}
                  >
                    <span className="hidden sm:inline">{isExpanded ? 'Thu gọn' : 'Chỉnh sửa'}</span>
                    {isExpanded ? <ChevronUp size={17} aria-hidden="true" /> : <ChevronDown size={17} aria-hidden="true" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => requestRemove(index)}
                    disabled={items.length <= 1 || disabled}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-admin-control text-admin-text-muted transition-colors hover:bg-admin-status-error/10 hover:text-admin-status-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-status-error/30 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={`Xóa sản phẩm ${index + 1}`}
                    title="Xóa sản phẩm"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {isExpanded ? (
                <div id={detailsId} className="border-t border-admin-border px-4 py-4">
                  <section aria-labelledby={`order-line-info-title-${item.key}`}>
                    <h4 id={`order-line-info-title-${item.key}`} className="text-xs font-semibold text-admin-text-primary">Thông tin sản phẩm</h4>
                    <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(15rem,1.4fr)_minmax(9rem,.75fr)_minmax(7rem,.45fr)]">
                      <div className="min-w-0 md:col-span-2 xl:col-span-1">
                        <label htmlFor={`order-line-product-${index}`} className={labelClass}>Sản phẩm</label>
                        <AdminSelect<string, ProductSelectOption>
                          inputId={`order-line-product-${index}`}
                          aria-label={`Tìm sản phẩm cụ thể cho dòng ${index + 1}`}
                          options={lineProductOptions}
                          value={selectedProductOption}
                          onChange={(option) => onSelectProduct(index, option?.value ?? 'manual')}
                          placeholder="Tìm theo mã hoặc tên sản phẩm"
                          filterOption={(option, inputValue) => option.data.searchText.includes(normalizeProductSearch(inputValue))}
                          formatOptionLabel={(option, meta) => <ProductOptionContent option={option} context={meta.context} />}
                          isSearchable
                          openMenuOnFocus
                          isDisabled={disabled}
                        />
                        {item.ingredientDrafts.length > 0 || inventoryMaterialLineKeys.has(item.key) ? (
                          <p className="mt-1.5 text-[11px] leading-4 text-admin-text-muted">
                            Đổi sản phẩm sẽ thay thành phần hiện tại bằng định mức của sản phẩm mới.
                          </p>
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <label htmlFor={`order-line-price-${index}`} className={labelClass}>Đơn giá của đơn này</label>
                        <div className="relative">
                          <input
                            id={`order-line-price-${index}`}
                            type="text"
                            inputMode="numeric"
                            className={`${inputClass} pr-8 text-right tabular-nums`}
                            value={formatVndInput(item.unitPrice)}
                            onChange={(event) => onUpdateLine(index, { unitPrice: parseVndInput(event.target.value) })}
                            disabled={disabled}
                            aria-invalid={lineError?.fieldId === `order-line-price-${index}` || undefined}
                            aria-describedby={lineError?.fieldId === `order-line-price-${index}` ? errorId : undefined}
                          />
                          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-admin-text-muted">₫</span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <label htmlFor={`order-line-quantity-${index}`} className={labelClass}>Số lượng</label>
                        <input
                          id={`order-line-quantity-${index}`}
                          type="number"
                          min={1}
                          step={1}
                          inputMode="numeric"
                          className={`${inputClass} text-right tabular-nums`}
                          value={item.quantity}
                          onChange={(event) => onUpdateLine(index, { quantity: Number(event.target.value) })}
                          disabled={disabled}
                          aria-invalid={lineError?.fieldId === `order-line-quantity-${index}` || undefined}
                          aria-describedby={lineError?.fieldId === `order-line-quantity-${index}` ? errorId : undefined}
                        />
                      </div>
                    </div>

                    {isManual ? (
                      <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
                        <div className="min-w-0">
                          <label htmlFor={`order-line-category-${index}`} className={labelClass}>Danh mục</label>
                          <select
                            id={`order-line-category-${index}`}
                            className={inputClass}
                            value={item.categoryId ?? ''}
                            onChange={(event) => onUpdateLine(index, { categoryId: event.target.value ? Number(event.target.value) : undefined })}
                            disabled={disabled}
                            aria-invalid={lineError?.fieldId === `order-line-category-${index}` || undefined}
                            aria-describedby={lineError?.fieldId === `order-line-category-${index}` ? errorId : undefined}
                          >
                            <option value="">Chọn danh mục</option>
                            {categories
                              .filter((candidate) => candidate.isActive || candidate.id === item.categoryId)
                              .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
                              .map((candidate) => <option key={candidate.id} value={candidate.id}>{attributeName(candidate)}</option>)}
                          </select>
                        </div>
                        <div className="min-w-0">
                          <label htmlFor={`order-line-product-type-${index}`} className={labelClass}>Dòng sản phẩm</label>
                          <select
                            id={`order-line-product-type-${index}`}
                            className={inputClass}
                            value={item.productTypeId ?? ''}
                            onChange={(event) => onUpdateLine(index, { productTypeId: event.target.value ? Number(event.target.value) : undefined })}
                            disabled={disabled}
                            aria-invalid={lineError?.fieldId === `order-line-product-type-${index}` || undefined}
                            aria-describedby={lineError?.fieldId === `order-line-product-type-${index}` ? errorId : undefined}
                          >
                            <option value="">Chọn dòng sản phẩm</option>
                            {productTypes
                              .filter((candidate) => candidate.isActive || candidate.id === item.productTypeId)
                              .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
                              .map((candidate) => <option key={candidate.id} value={candidate.id}>{attributeName(candidate)}</option>)}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-admin-text-secondary">
                        <span className="font-medium text-admin-text-primary">{metadata.length > 0 ? metadata.join(' · ') : 'Chưa có metadata danh mục'}</span>
                        <span>
                          {selectedProduct
                            ? selectedProduct.tracksInventory
                              ? `Tồn kho: ${selectedProduct.stock}`
                              : 'Làm theo đơn, không trừ tồn kho sản phẩm'
                            : 'Thông tin tồn kho chưa khả dụng'}
                        </span>
                        {priceDifference !== 0 ? (
                          <span className={`font-medium ${priceDifference < 0 ? 'text-admin-status-warning' : 'text-admin-status-success'}`}>
                            {priceDifference < 0 ? 'Giảm size' : 'Tăng size'} {priceDifference > 0 ? '+' : ''}{formatOrderCurrency(priceDifference)} so với giá danh mục
                          </span>
                        ) : null}
                      </div>
                    )}
                  </section>

                  <section className="mt-5 border-t border-admin-border pt-4" aria-labelledby={`order-line-request-title-${item.key}`}>
                    <h4 id={`order-line-request-title-${item.key}`} className="text-xs font-semibold text-admin-text-primary">Yêu cầu riêng</h4>
                    <div className="mt-3 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(14rem,.65fr)]">
                      <div className="min-w-0">
                        <label htmlFor={`order-line-note-${index}`} className={labelClass}>Ghi chú cho sản phẩm</label>
                        <textarea
                          id={`order-line-note-${index}`}
                          className={`${inputClass} min-h-20 resize-y`}
                          rows={3}
                          value={item.note ?? ''}
                          onChange={(event) => onUpdateLine(index, { note: event.target.value })}
                          disabled={disabled}
                          placeholder="Màu hoa, kích thước hoặc yêu cầu riêng của khách"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className={labelClass}>Ảnh minh họa <span className="font-normal text-admin-text-muted">(không bắt buộc)</span></span>
                        <div className="flex min-h-20 min-w-0 flex-wrap items-center gap-2 rounded-admin-control border border-dashed border-admin-border bg-admin-muted/25 px-3 py-2.5">
                          <OrderItemImagePreviews
                            existingImages={item.existingImages}
                            files={item.imageFiles}
                            productName={item.productName || `sản phẩm ${index + 1}`}
                            onRemove={(fileIndex) => onUpdateLine(index, { imageFiles: item.imageFiles.filter((_, currentIndex) => currentIndex !== fileIndex) })}
                          />
                          <label htmlFor={`order-line-images-${index}`} className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-admin-control px-2.5 text-xs font-semibold text-admin-primary transition-colors hover:bg-admin-primary/8 focus-within:ring-2 focus-within:ring-admin-primary/30">
                            <ImagePlus size={16} aria-hidden="true" />
                            {item.imageFiles.length || item.existingImages.length ? 'Thêm ảnh' : 'Thêm ảnh minh họa'}
                          </label>
                          <input
                            id={`order-line-images-${index}`}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            multiple
                            className="sr-only"
                            disabled={disabled}
                            onChange={(event) => {
                              const nextFiles = Array.from(event.target.files ?? []);
                              onUpdateLine(index, { imageFiles: [...item.imageFiles, ...nextFiles] });
                              event.target.value = '';
                            }}
                          />
                          {disabled ? (
                            <span className="text-xs text-admin-text-secondary" role="status">Đang lưu ảnh cùng đơn hàng…</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="mt-5 border-t border-admin-border pt-4" aria-labelledby={`order-line-card-banner-title-${item.key}`}>
                    <h4 id={`order-line-card-banner-title-${item.key}`} className="text-xs font-semibold text-admin-text-primary">Thiệp &amp; banner</h4>
                    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
                      {([
                        ['hasCard', 'Ghi thiệp', `order-line-card-message-${index}`],
                        ['hasBanner', 'In banner', `order-line-banner-message-${index}`],
                      ] as const).map(([toggleKey, toggleLabel, messageId]) => (
                        <label key={toggleKey} className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-admin-text-primary">
                          <input
                            type="checkbox"
                            checked={item[toggleKey]}
                            disabled={disabled}
                            onChange={(event) => {
                              onUpdateLine(index, { [toggleKey]: event.target.checked });
                              if (event.target.checked) requestAnimationFrame(() => document.getElementById(messageId)?.focus());
                            }}
                            className="h-4 w-4 accent-admin-primary"
                          />
                          {toggleLabel}
                        </label>
                      ))}
                    </div>
                    {item.hasCard || item.hasBanner ? (
                      <div className="mt-2 grid min-w-0 gap-3 md:grid-cols-2">
                        {item.hasCard ? (
                          <div className="min-w-0">
                            <label htmlFor={`order-line-card-message-${index}`} className={labelClass}>Nội dung thiệp</label>
                            <textarea
                              id={`order-line-card-message-${index}`}
                              className={`${inputClass} min-h-20 resize-y`}
                              rows={3}
                              value={item.cardMessage ?? ''}
                              onChange={(event) => onUpdateLine(index, { cardMessage: event.target.value })}
                              disabled={disabled}
                              placeholder="Nội dung thiệp"
                              aria-invalid={lineError?.fieldId === `order-line-card-message-${index}` || undefined}
                              aria-describedby={lineError?.fieldId === `order-line-card-message-${index}` ? errorId : undefined}
                            />
                          </div>
                        ) : null}
                        {item.hasBanner ? (
                          <div className="min-w-0">
                            <label htmlFor={`order-line-banner-message-${index}`} className={labelClass}>Nội dung banner</label>
                            <textarea
                              id={`order-line-banner-message-${index}`}
                              className={`${inputClass} min-h-20 resize-y`}
                              rows={3}
                              value={item.bannerMessage ?? ''}
                              onChange={(event) => onUpdateLine(index, { bannerMessage: event.target.value })}
                              disabled={disabled}
                              placeholder="Nội dung banner"
                              aria-invalid={lineError?.fieldId === `order-line-banner-message-${index}` || undefined}
                              aria-describedby={lineError?.fieldId === `order-line-banner-message-${index}` ? errorId : undefined}
                            />
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </section>
                </div>
              ) : null}
              {lineError ? (
                <p id={errorId} className="border-t border-admin-status-error/15 px-4 py-2.5 text-xs font-medium text-admin-status-error" role="alert">
                  {lineError.message}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>

      <SettingsDialog
        open={pendingDeleteIndex !== null}
        title="Xóa sản phẩm khỏi đơn?"
        description={pendingDeleteIndex === null ? undefined : `Sản phẩm “${items[pendingDeleteIndex]?.productName || `Sản phẩm ${pendingDeleteIndex + 1}`}” sẽ bị loại khỏi đơn.`}
        closeLabel="Đóng xác nhận xóa sản phẩm"
        onRequestClose={() => setPendingDeleteIndex(null)}
        footer={(
          <>
            <button
              type="button"
              onClick={() => setPendingDeleteIndex(null)}
              className="min-h-11 rounded-admin-control border border-admin-border bg-admin-card px-4 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted"
            >
              Hủy
            </button>
            <button
              type="button"
              data-autofocus
              onClick={() => {
                if (pendingDeleteIndex !== null) onRemoveLine(pendingDeleteIndex);
                setPendingDeleteIndex(null);
              }}
              className="min-h-11 rounded-admin-control bg-admin-status-error px-4 text-sm font-semibold text-white transition-colors hover:bg-admin-status-error/90"
            >
              Xóa sản phẩm
            </button>
          </>
        )}
      >
        <p className="text-sm leading-6 text-admin-text-secondary">
          Ghi chú, ảnh minh họa, nội dung thiệp/banner cùng nguyên liệu và vật tư của sản phẩm này cũng sẽ bị loại khỏi đơn. Thao tác chỉ có hiệu lực khi bạn lưu đơn hàng.
        </p>
      </SettingsDialog>
    </section>
  );
};
