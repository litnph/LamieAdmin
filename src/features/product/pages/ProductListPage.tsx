import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, RefreshCw, RotateCcw, Search } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ProductApi, type ProductDto } from '@/features/product/api/productApi';
import { ProductTable, type ProductListItem, type ProductStockStatus } from '@/features/product/components/ProductTable';
import { useAuth } from '@/features/auth/context/AuthContext';
import { AttributesApi } from '@/features/settings/attributes/api/attributesApi';
import type { AttributeItem, AttributeTranslation } from '@/features/settings/attributes/types/attributes.types';
import { ConfirmationPanel, SettingsDialog } from '@/features/settings/components/SettingsDialog';
import { PageHeader } from '@/shared/components/PageHeader';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { resolveApiResourceUrl } from '@/services/apiResourceUrl';

const PAGE_SIZE = 20;
const FILTER_STORAGE_KEY = 'lamie-admin-product-list-filters';

type CategoryFilter = number | 'all';
type ProductTypeFilter = number | 'all';
type InventoryFilter = ProductStockStatus | 'all';
type BusinessFilter = 'active' | 'hidden' | 'all';

type StoredFilters = {
  search: string;
  category: CategoryFilter;
  productType: ProductTypeFilter;
  inventory: InventoryFilter;
  business: BusinessFilter;
  page: number;
};

const defaultFilters: StoredFilters = {
  search: '',
  category: 'all',
  productType: 'all',
  inventory: 'all',
  business: 'all',
  page: 1,
};

const fieldClass =
  'min-h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-surface px-3 text-sm text-admin-text-primary transition-colors placeholder:text-admin-text-muted focus:border-admin-input-focus focus:outline-none focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isInventoryFilter = (value: unknown): value is InventoryFilter =>
  value === 'all' || value === 'made-to-order' || value === 'in-stock' || value === 'low-stock' || value === 'out-of-stock';

const isBusinessFilter = (value: unknown): value is BusinessFilter =>
  value === 'all' || value === 'active' || value === 'hidden';

const readStoredFilters = (): StoredFilters => {
  try {
    const raw = sessionStorage.getItem(FILTER_STORAGE_KEY);
    if (!raw) return defaultFilters;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return defaultFilters;

    return {
      search: typeof parsed.search === 'string' ? parsed.search : '',
      category: typeof parsed.category === 'number' && Number.isFinite(parsed.category) ? parsed.category : 'all',
      productType: typeof parsed.productType === 'number' && Number.isFinite(parsed.productType) ? parsed.productType : 'all',
      inventory: isInventoryFilter(parsed.inventory) ? parsed.inventory : 'all',
      business: isBusinessFilter(parsed.business) ? parsed.business : 'all',
      page: typeof parsed.page === 'number' && parsed.page >= 1 ? Math.floor(parsed.page) : 1,
    };
  } catch {
    return defaultFilters;
  }
};

const persistFilters = (filters: StoredFilters) => {
  try {
    sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // Browsers may block session storage. The list still works without persistence.
  }
};

const readUrlFilters = (params: URLSearchParams, fallback: StoredFilters): StoredFilters => {
  const categoryValue = Number(params.get('category'));
  const productTypeValue = Number(params.get('productType'));
  const pageValue = Number(params.get('page'));
  const inventoryValue = params.get('inventory');
  const businessValue = params.get('business');
  return {
    search: params.get('q') ?? fallback.search,
    category: Number.isFinite(categoryValue) && categoryValue > 0 ? categoryValue : fallback.category,
    productType: Number.isFinite(productTypeValue) && productTypeValue > 0 ? productTypeValue : fallback.productType,
    inventory: isInventoryFilter(inventoryValue) ? inventoryValue : fallback.inventory,
    business: isBusinessFilter(businessValue) ? businessValue : fallback.business,
    page: Number.isFinite(pageValue) && pageValue >= 1 ? Math.floor(pageValue) : fallback.page,
  };
};

const toUrlFilters = (filters: StoredFilters): URLSearchParams => {
  const params = new URLSearchParams();
  if (filters.search) params.set('q', filters.search);
  if (filters.category !== 'all') params.set('category', String(filters.category));
  if (filters.productType !== 'all') params.set('productType', String(filters.productType));
  if (filters.inventory !== 'all') params.set('inventory', filters.inventory);
  if (filters.business !== 'all') params.set('business', filters.business);
  if (filters.page > 1) params.set('page', String(filters.page));
  return params;
};

const preferredTranslation = <T extends { languageCode: string; name: string }>(translations: T[]): T | undefined =>
  translations.find((translation) => translation.languageCode.toLowerCase().startsWith('vi')) ?? translations[0];

const getStockStatus = (stock: number, tracksInventory: boolean): ProductStockStatus => {
  if (!tracksInventory) return 'made-to-order';
  if (stock <= 0) return 'out-of-stock';
  if (stock <= 5) return 'low-stock';
  return 'in-stock';
};

const normalizeSearch = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi')
    .trim();

const categoryName = (category: AttributeItem): string =>
  preferredTranslation<AttributeTranslation>(category.translations)?.name?.trim() || `Danh mục #${category.id}`;

const productTypeName = (productType: AttributeItem): string =>
  preferredTranslation<AttributeTranslation>(productType.translations)?.name?.trim()
  || productType.code
  || `Dòng sản phẩm #${productType.id}`;

const mapDtoToProduct = (
  dto: ProductDto,
  categoryNames: Map<number, string>,
  productTypeNames: Map<number, string>,
): ProductListItem => {
  const name = preferredTranslation(dto.translations)?.name?.trim() || dto.sku;
  const detailImage = [...dto.images]
    .filter((image) => image.isActive)
    .sort((left, right) => left.sortOrder - right.sortOrder)[0]?.imageUrl;

  return {
    id: dto.id,
    name,
    sku: dto.sku,
    categoryId: dto.categoryId,
    categoryName: categoryNames.get(dto.categoryId) ?? `Danh mục #${dto.categoryId}`,
    productTypeId: dto.productTypeId ?? null,
    productTypeName: dto.productTypeId
      ? productTypeNames.get(dto.productTypeId) ?? `Dòng sản phẩm #${dto.productTypeId}`
      : 'Chưa phân loại',
    price: dto.price,
    salePrice: dto.salePrice,
    stock: dto.stock,
    tracksInventory: dto.tracksInventory,
    stockStatus: getStockStatus(dto.stock, dto.tracksInventory),
    isActive: dto.isActive,
    imageUrl: resolveApiResourceUrl(dto.thumbnailUrl?.trim() || detailImage?.trim()) || null,
  };
};

export const ProductListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const syncSourceRef = useRef<'url' | null>(null);
  const firstUrlEffectRef = useRef(true);
  const { isAdmin, isManagerOrAbove } = useAuth();
  const [initialFilters] = useState(() => readUrlFilters(searchParams, readStoredFilters()));
  const [items, setItems] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<AttributeItem[]>([]);
  const [productTypes, setProductTypes] = useState<AttributeItem[]>([]);
  const [draftSearch, setDraftSearch] = useState(initialFilters.search);
  const [search, setSearch] = useState(initialFilters.search);
  const [category, setCategory] = useState<CategoryFilter>(initialFilters.category);
  const [productType, setProductType] = useState<ProductTypeFilter>(initialFilters.productType);
  const [inventory, setInventory] = useState<InventoryFilter>(initialFilters.inventory);
  const [business, setBusiness] = useState<BusinessFilter>(initialFilters.business);
  const [page, setPage] = useState(initialFilters.page);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProductListItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [productsResult, categoriesResult, productTypesResult] = await Promise.allSettled([
      ProductApi.getAll(),
      AttributesApi.getAll<AttributeItem>('categories'),
      AttributesApi.getAll<AttributeItem>('product-types'),
    ]);

    if (productsResult.status === 'fulfilled') {
      setItems(productsResult.value);
    } else {
      setItems([]);
      setError(getApiErrorMessage(productsResult.reason));
    }

    if (categoriesResult.status === 'fulfilled') {
      setCategories(categoriesResult.value);
    }
    if (productTypesResult.status === 'fulfilled') {
      setProductTypes(productTypesResult.value);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    persistFilters({ search, category, productType, inventory, business, page });
  }, [business, category, inventory, page, productType, search]);

  useEffect(() => {
    if (firstUrlEffectRef.current) {
      firstUrlEffectRef.current = false;
      return;
    }
    const next = readUrlFilters(searchParams, defaultFilters);
    if (
      next.search !== search
      || next.category !== category
      || next.productType !== productType
      || next.inventory !== inventory
      || next.business !== business
      || next.page !== page
    ) {
      syncSourceRef.current = 'url';
      setDraftSearch(next.search);
      setSearch(next.search);
      setCategory(next.category);
      setProductType(next.productType);
      setInventory(next.inventory);
      setBusiness(next.business);
      setPage(next.page);
    }
  }, [searchParamsKey]);

  useEffect(() => {
    if (syncSourceRef.current === 'url') {
      syncSourceRef.current = null;
      return;
    }
    const next = toUrlFilters({ search, category, productType, inventory, business, page });
    if (next.toString() !== searchParamsKey) {
      setSearchParams(next);
    }
  }, [business, category, inventory, page, productType, search, searchParamsKey, setSearchParams]);

  const categoryNames = useMemo(
    () => new Map(categories.map((item) => [item.id, categoryName(item)])),
    [categories],
  );

  const productTypeNames = useMemo(
    () => new Map(productTypes.map((item) => [item.id, productTypeName(item)])),
    [productTypes],
  );

  const products = useMemo(
    () => items.map((item) => mapDtoToProduct(item, categoryNames, productTypeNames)),
    [categoryNames, items, productTypeNames],
  );

  const categoryOptions = useMemo(() => {
    const ids = new Set(products.map((product) => product.categoryId));
    categories.forEach((item) => ids.add(item.id));
    return Array.from(ids)
      .map((id) => ({ id, name: categoryNames.get(id) ?? `Danh mục #${id}` }))
      .sort((left, right) => left.name.localeCompare(right.name, 'vi'));
  }, [categories, categoryNames, products]);

  const productTypeOptions = useMemo(() => {
    const ids = new Set(products.flatMap((product) => product.productTypeId ? [product.productTypeId] : []));
    productTypes.forEach((item) => ids.add(item.id));
    return Array.from(ids)
      .map((id) => ({ id, name: productTypeNames.get(id) ?? `Dòng sản phẩm #${id}` }))
      .sort((left, right) => left.name.localeCompare(right.name, 'vi'));
  }, [productTypeNames, productTypes, products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = normalizeSearch(search);
    return products.filter((product) => {
      const matchesSearch = !normalizedQuery
        || normalizeSearch(`${product.name} ${product.sku}`).includes(normalizedQuery);
      const matchesCategory = category === 'all' || product.categoryId === category;
      const matchesProductType = productType === 'all' || product.productTypeId === productType;
      const matchesInventory = inventory === 'all' || product.stockStatus === inventory;
      const matchesBusiness = business === 'all'
        || (business === 'active' ? product.isActive : !product.isActive);
      return matchesSearch && matchesCategory && matchesProductType && matchesInventory && matchesBusiness;
    });
  }, [business, category, inventory, productType, products, search]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleProducts = useMemo(
    () => filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, filteredProducts],
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const activeFilterCount = [search.length > 0, productType !== 'all', category !== 'all', inventory !== 'all', business !== 'all']
    .filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

  const resetFilters = () => {
    setDraftSearch('');
    setSearch('');
    setCategory('all');
    setProductType('all');
    setInventory('all');
    setBusiness('all');
    setPage(1);
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setSearch(draftSearch.trim());
    setPage(1);
  };

  const editProduct = (product: ProductListItem) => {
    persistFilters({ search, category, productType, inventory, business, page });
    navigate(`/admin/products/${product.id}/edit`);
  };

  const requestDelete = (product: ProductListItem) => {
    if (!isAdmin) return;
    setMutationError(null);
    setPendingDelete(product);
  };

  const deleteProduct = async () => {
    if (!pendingDelete || !isAdmin) return;
    setDeletingId(pendingDelete.id);
    setMutationError(null);
    try {
      await ProductApi.remove(pendingDelete.id);
      setItems((current) => current.filter((item) => item.id !== pendingDelete.id));
      setSuccessMessage(`Đã xóa sản phẩm ${pendingDelete.name}.`);
      setPendingDelete(null);
    } catch (requestError) {
      setMutationError(getApiErrorMessage(requestError));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Sản phẩm"
        description="Tìm nhanh sản phẩm, kiểm tra giá bán, tồn kho và trạng thái kinh doanh."
        actions={
          <>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="btn-press inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-admin-control border border-admin-border bg-admin-surface px-3 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <RefreshCw size={17} strokeWidth={1.8} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
              Tải lại
            </button>
            {isManagerOrAbove ? (
              <button
                type="button"
                onClick={() => navigate('/admin/products/create')}
                className="btn-press inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover sm:w-auto"
              >
                <Plus size={18} strokeWidth={1.8} aria-hidden="true" />
                Thêm sản phẩm
              </button>
            ) : null}
          </>
        }
      />

      {!isManagerOrAbove ? (
        <div className="mb-4 rounded-admin-control border border-admin-primary/20 bg-admin-primary/5 px-4 py-3 text-sm leading-6 text-admin-text-secondary" role="status">
          Tài khoản của bạn chỉ có quyền xem sản phẩm. Liên hệ quản lý để tạo hoặc chỉnh sửa dữ liệu.
        </div>
      ) : null}

      {successMessage ? (
        <div className="mb-4 rounded-admin-control border border-admin-status-success/25 bg-admin-status-success/8 px-4 py-3 text-sm text-admin-status-success" role="status">
          {successMessage}
        </div>
      ) : null}

      <form
        onSubmit={submitSearch}
        className="mb-4 grid grid-cols-1 gap-3 rounded-admin-panel border border-admin-border bg-admin-surface p-4 md:grid-cols-2 xl:grid-cols-[minmax(15rem,1.3fr)_repeat(4,minmax(10rem,0.7fr))_auto] xl:items-end"
        aria-label="Tìm kiếm và lọc sản phẩm"
      >
        <div>
          <label htmlFor="product-search" className="mb-1.5 block text-xs font-medium text-admin-text-secondary">
            Tìm sản phẩm
          </label>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                size={17}
                strokeWidth={1.8}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted"
                aria-hidden="true"
              />
              <input
                id="product-search"
                type="search"
                autoComplete="off"
                value={draftSearch}
                onChange={(event) => setDraftSearch(event.target.value)}
                className={`${fieldClass} pl-10`}
                placeholder="Tên hoặc SKU"
              />
            </div>
            <button
              type="submit"
              className="btn-press min-h-11 shrink-0 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover"
            >
              Tìm
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="product-type-filter" className="mb-1.5 block text-xs font-medium text-admin-text-secondary">
            Dòng sản phẩm
          </label>
          <select
            id="product-type-filter"
            value={productType}
            onChange={(event) => {
              setProductType(event.target.value === 'all' ? 'all' : Number(event.target.value));
              setPage(1);
            }}
            className={fieldClass}
          >
            <option value="all">Tất cả dòng sản phẩm</option>
            {productTypeOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="product-category" className="mb-1.5 block text-xs font-medium text-admin-text-secondary">
            Danh mục
          </label>
          <select
            id="product-category"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value === 'all' ? 'all' : Number(event.target.value));
              setPage(1);
            }}
            className={fieldClass}
          >
            <option value="all">Tất cả danh mục</option>
            {categoryOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="product-inventory" className="mb-1.5 block text-xs font-medium text-admin-text-secondary">
            Tồn kho
          </label>
          <select
            id="product-inventory"
            value={inventory}
            onChange={(event) => {
              const value = event.target.value;
              if (isInventoryFilter(value)) setInventory(value);
              setPage(1);
            }}
            className={fieldClass}
          >
            <option value="all">Tất cả tồn kho</option>
            <option value="made-to-order">Làm theo đơn</option>
            <option value="in-stock">Còn hàng</option>
            <option value="low-stock">Sắp hết</option>
            <option value="out-of-stock">Hết hàng</option>
          </select>
        </div>

        <div>
          <label htmlFor="product-business" className="mb-1.5 block text-xs font-medium text-admin-text-secondary">
            Kinh doanh
          </label>
          <select
            id="product-business"
            value={business}
            onChange={(event) => {
              const value = event.target.value;
              if (isBusinessFilter(value)) setBusiness(value);
              setPage(1);
            }}
            className={fieldClass}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang bán</option>
            <option value="hidden">Đang ẩn</option>
          </select>
        </div>

        <button
          type="button"
          onClick={resetFilters}
          disabled={!hasActiveFilters}
          className="btn-press inline-flex min-h-11 items-center justify-center gap-2 rounded-admin-control border border-admin-border bg-admin-surface px-3 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted disabled:cursor-not-allowed disabled:opacity-45 md:justify-self-start xl:justify-self-auto"
        >
          <RotateCcw size={16} strokeWidth={1.8} aria-hidden="true" />
          Xóa lọc{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>
      </form>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-admin-text-secondary" aria-live="polite">
        <p>
          {loading
            ? 'Đang tải dữ liệu sản phẩm'
            : `${filteredProducts.length.toLocaleString('vi-VN')} sản phẩm${hasActiveFilters ? ' phù hợp' : ''}`}
        </p>
        {hasActiveFilters ? <p className="text-xs">Đang dùng {activeFilterCount} bộ lọc</p> : null}
      </div>

      <ProductTable
        products={visibleProducts}
        loading={loading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        canEdit={isManagerOrAbove}
        canDelete={isAdmin}
        deletingId={deletingId}
        page={currentPage}
        pageSize={PAGE_SIZE}
        totalItems={filteredProducts.length}
        totalPages={totalPages}
        onEdit={editProduct}
        onDelete={requestDelete}
        onPageChange={setPage}
        onClearFilters={resetFilters}
        onRetry={() => void load()}
      />

      <SettingsDialog
        open={pendingDelete !== null}
        title="Xác nhận xóa sản phẩm"
        description="Kiểm tra kỹ sản phẩm trước khi tiếp tục."
        closeLabel="Đóng xác nhận xóa sản phẩm"
        onRequestClose={() => {
          if (deletingId === null) setPendingDelete(null);
        }}
        focusKey={mutationError ? 'delete-error' : 'delete-confirm'}
      >
        {mutationError ? (
          <div className="mb-4 rounded-admin-control border border-admin-status-error/25 bg-admin-status-error/8 px-4 py-3 text-sm leading-6 text-admin-status-error" role="alert">
            Không thể xóa sản phẩm: {mutationError}
          </div>
        ) : null}
        <ConfirmationPanel
          title={`Xóa sản phẩm ${pendingDelete?.name ?? ''}?`}
          description="Sản phẩm sẽ bị xóa khỏi danh mục. API có thể từ chối nếu dữ liệu đang được đơn hàng hoặc cấu hình khác sử dụng."
          confirmLabel="Xóa sản phẩm"
          busy={deletingId !== null}
          onCancel={() => {
            if (deletingId === null) setPendingDelete(null);
          }}
          onConfirm={() => void deleteProduct()}
        />
      </SettingsDialog>
    </div>
  );
};
