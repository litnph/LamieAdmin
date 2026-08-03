import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleOff,
  Clock3,
  Eye,
  EyeOff,
  ImageOff,
  PackageOpen,
  Pencil,
  SearchX,
  Trash2,
} from 'lucide-react';
import { formatCurrency, formatInteger } from '@/features/dashboard/utils/dashboardFormatters';

export type ProductStockStatus = 'made-to-order' | 'in-stock' | 'low-stock' | 'out-of-stock';

export type ProductListItem = {
  id: number;
  name: string;
  sku: string;
  categoryId: number;
  categoryName: string;
  productTypeId: number | null;
  productTypeName: string;
  price: number;
  salePrice: number | null;
  stock: number;
  tracksInventory: boolean;
  stockStatus: ProductStockStatus;
  isActive: boolean;
  imageUrl: string | null;
};

type ProductTableProps = {
  products: ProductListItem[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  canEdit: boolean;
  canDelete: boolean;
  deletingId: number | null;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onEdit: (product: ProductListItem) => void;
  onDelete: (product: ProductListItem) => void;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
  onRetry: () => void;
};

const StockBadge: React.FC<{ status: ProductStockStatus }> = ({ status }) => {
  const config = {
    'made-to-order': {
      label: 'Làm theo đơn',
      className: 'bg-admin-primary/10 text-admin-primary',
      icon: Clock3,
    },
    'in-stock': {
      label: 'Còn hàng',
      className: 'bg-admin-status-success/10 text-admin-status-success',
      icon: CheckCircle2,
    },
    'low-stock': {
      label: 'Sắp hết',
      className: 'bg-admin-status-warning/10 text-admin-status-warning',
      icon: AlertTriangle,
    },
    'out-of-stock': {
      label: 'Hết hàng',
      className: 'bg-admin-status-error/10 text-admin-status-error',
      icon: CircleOff,
    },
  }[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${config.className}`}>
      <Icon size={14} strokeWidth={1.8} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};

const BusinessStatus: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <span
    className={[
      'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold',
      isActive
        ? 'bg-admin-primary/10 text-admin-primary'
        : 'bg-admin-muted text-admin-text-secondary',
    ].join(' ')}
  >
    {isActive ? <Eye size={14} strokeWidth={1.8} aria-hidden="true" /> : <EyeOff size={14} strokeWidth={1.8} aria-hidden="true" />}
    {isActive ? 'Đang bán' : 'Đang ẩn'}
  </span>
);

const ProductImage: React.FC<{ src: string | null; name: string }> = ({ src, name }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-admin-control border border-admin-border bg-admin-muted text-admin-text-muted"
        role="img"
        aria-label={`Chưa có ảnh cho sản phẩm ${name}`}
      >
        <ImageOff size={20} strokeWidth={1.7} aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`Ảnh sản phẩm ${name}`}
      width={56}
      height={56}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="h-14 w-14 shrink-0 rounded-admin-control border border-admin-border object-cover"
    />
  );
};

const ProductPrice: React.FC<{ price: number; salePrice: number | null }> = ({ price, salePrice }) => {
  const hasSalePrice = salePrice !== null && salePrice > 0 && salePrice < price;

  return (
    <div className="whitespace-nowrap text-right tabular-nums">
      <p className="font-semibold text-admin-text-primary">{formatCurrency(hasSalePrice ? salePrice : price)}</p>
      {hasSalePrice ? <p className="mt-0.5 text-xs text-admin-text-muted line-through">{formatCurrency(price)}</p> : null}
    </div>
  );
};

const LoadingState: React.FC = () => (
  <div role="status" aria-label="Đang tải danh sách sản phẩm">
    <div className="space-y-3 p-3 md:hidden" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="animate-pulse rounded-admin-panel border border-admin-border bg-admin-surface p-4">
          <div className="flex gap-3">
            <div className="h-14 w-14 rounded-admin-control bg-admin-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-admin-muted" />
              <div className="h-3 w-2/5 rounded bg-admin-muted" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="h-10 rounded-admin-control bg-admin-muted" />
            <div className="h-10 rounded-admin-control bg-admin-muted" />
          </div>
        </div>
      ))}
    </div>
    <div className="hidden md:block" aria-hidden="true">
      {Array.from({ length: 7 }, (_, index) => (
        <div key={index} className="grid animate-pulse grid-cols-[minmax(15rem,1.8fr)_1fr_0.8fr_0.9fr_0.8fr_auto] gap-4 border-b border-admin-border px-4 py-4 last:border-b-0">
          {Array.from({ length: 6 }, (__, cellIndex) => (
            <div key={cellIndex} className="h-5 rounded bg-admin-muted" />
          ))}
        </div>
      ))}
    </div>
    <span className="sr-only">Đang tải sản phẩm</span>
  </div>
);

type ListStateProps = {
  error: string | null;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onRetry: () => void;
};

const ListState: React.FC<ListStateProps> = ({ error, hasActiveFilters, onClearFilters, onRetry }) => {
  const Icon = error ? AlertTriangle : hasActiveFilters ? SearchX : PackageOpen;
  const title = error ? 'Không thể tải sản phẩm' : hasActiveFilters ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm';
  const description = error
    ? error
    : hasActiveFilters
      ? 'Không có sản phẩm phù hợp với từ khóa hoặc bộ lọc hiện tại.'
      : 'Danh sách sẽ hiển thị sản phẩm sau khi cửa hàng tạo dữ liệu đầu tiên.';

  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-5 py-12 text-center" role={error ? 'alert' : 'status'}>
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-admin-control ${
          error ? 'bg-admin-status-error/10 text-admin-status-error' : 'bg-admin-muted text-admin-text-secondary'
        }`}
        aria-hidden="true"
      >
        <Icon size={21} strokeWidth={1.8} />
      </div>
      <h2 className="mt-4 text-base font-semibold text-admin-text-primary">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm leading-6 text-admin-text-secondary">{description}</p>
      {error ? (
        <button
          type="button"
          onClick={onRetry}
          className="btn-press mt-5 inline-flex min-h-11 items-center justify-center rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover"
        >
          Thử lại
        </button>
      ) : hasActiveFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="btn-press mt-5 inline-flex min-h-11 items-center justify-center rounded-admin-control border border-admin-border bg-admin-surface px-4 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted"
        >
          Xóa bộ lọc
        </button>
      ) : null}
    </div>
  );
};

type PaginationProps = Pick<
  ProductTableProps,
  'page' | 'pageSize' | 'totalItems' | 'totalPages' | 'onPageChange'
>;

const ProductPagination: React.FC<PaginationProps> = ({ page, pageSize, totalItems, totalPages, onPageChange }) => {
  if (totalItems === 0) return null;
  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  return (
    <nav
      className="flex flex-col gap-3 border-t border-admin-border px-4 py-3 text-sm text-admin-text-secondary sm:flex-row sm:items-center sm:justify-between"
      aria-label="Phân trang sản phẩm"
    >
      <p aria-live="polite">
        Hiển thị <span className="font-medium text-admin-text-primary">{firstItem}-{lastItem}</span> trong{' '}
        <span className="font-medium text-admin-text-primary">{formatInteger(totalItems)}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="btn-press inline-flex min-h-11 items-center gap-1.5 rounded-admin-control border border-admin-border bg-admin-surface px-3 text-sm font-medium text-admin-text-primary transition-colors hover:border-admin-primary/50 hover:bg-admin-primary/5 disabled:cursor-not-allowed disabled:opacity-45"
          aria-label="Trang sản phẩm trước"
        >
          <ChevronLeft size={16} strokeWidth={1.8} aria-hidden="true" />
          Trước
        </button>
        <span className="min-w-20 text-center text-xs" aria-current="page">
          Trang {page}/{totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="btn-press inline-flex min-h-11 items-center gap-1.5 rounded-admin-control border border-admin-border bg-admin-surface px-3 text-sm font-medium text-admin-text-primary transition-colors hover:border-admin-primary/50 hover:bg-admin-primary/5 disabled:cursor-not-allowed disabled:opacity-45"
          aria-label="Trang sản phẩm sau"
        >
          Sau
          <ChevronRight size={16} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  loading,
  error,
  hasActiveFilters,
  canEdit,
  canDelete,
  deletingId,
  page,
  pageSize,
  totalItems,
  totalPages,
  onEdit,
  onDelete,
  onPageChange,
  onClearFilters,
  onRetry,
}) => {
  const showState = loading || error !== null || products.length === 0;

  return (
    <section className="overflow-hidden rounded-admin-panel border border-admin-border bg-admin-surface shadow-admin-panel" aria-label="Danh sách sản phẩm">
      {showState ? (
        loading ? <LoadingState /> : <ListState error={error} hasActiveFilters={hasActiveFilters} onClearFilters={onClearFilters} onRetry={onRetry} />
      ) : (
        <>
          <div className="divide-y divide-admin-border md:hidden">
            {products.map((product) => (
              <article key={product.id} className="p-4">
                <div className="flex min-w-0 gap-3">
                  <ProductImage src={product.imageUrl} name={product.name} />
                  <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-2 text-sm font-semibold leading-5 text-admin-text-primary" title={product.name}>
                      {product.name}
                    </h2>
                    <p className="mt-1 truncate font-mono text-[11px] text-admin-text-muted" title={product.sku}>SKU {product.sku}</p>
                    <p className="mt-1 truncate text-xs text-admin-text-secondary" title={`${product.productTypeName} · ${product.categoryName}`}>
                      {product.productTypeName} · {product.categoryName}
                    </p>
                  </div>
                  <ProductPrice price={product.price} salePrice={product.salePrice} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 rounded-admin-control bg-admin-muted/55 p-3">
                  <div>
                    <dt className="text-[11px] font-medium text-admin-text-muted">Tồn kho</dt>
                    <dd className="mt-1">
                      <StockBadge status={product.stockStatus} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium text-admin-text-muted">Kinh doanh</dt>
                    <dd className="mt-1"><BusinessStatus isActive={product.isActive} /></dd>
                  </div>
                </dl>
                <div className="mt-3 flex items-center justify-end gap-2">
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={() => onEdit(product)}
                      className="btn-press inline-flex min-h-11 items-center gap-2 rounded-admin-control border border-admin-border px-3 text-sm font-semibold text-admin-text-primary transition-colors hover:border-admin-primary/45 hover:bg-admin-primary/5 hover:text-admin-primary"
                      aria-label={`Sửa sản phẩm ${product.name}`}
                    >
                      <Pencil size={16} strokeWidth={1.8} aria-hidden="true" />
                      Sửa
                    </button>
                  ) : <span className="text-xs text-admin-text-muted">Chỉ xem</span>}
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => onDelete(product)}
                      disabled={deletingId !== null}
                      className="btn-press inline-flex min-h-11 items-center gap-2 rounded-admin-control px-3 text-sm font-semibold text-admin-status-error transition-colors hover:bg-admin-status-error/8 disabled:cursor-not-allowed disabled:opacity-45"
                      aria-label={`Xóa sản phẩm ${product.name}`}
                    >
                      <Trash2 size={16} strokeWidth={1.8} aria-hidden="true" />
                      Xóa
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] table-fixed text-left text-sm">
              <caption className="sr-only">Danh sách sản phẩm, giá bán, tồn kho, trạng thái kinh doanh và thao tác</caption>
              <thead className="border-b border-admin-border bg-admin-muted/55 text-xs text-admin-text-secondary">
                <tr>
                  <th scope="col" className="w-[32%] px-4 py-3 font-semibold xl:w-[29%]">Sản phẩm</th>
                  <th scope="col" className="hidden w-[18%] px-4 py-3 font-semibold lg:table-cell">Phân loại</th>
                  <th scope="col" className="w-[16%] px-4 py-3 text-right font-semibold">Giá</th>
                  <th scope="col" className="w-[15%] px-4 py-3 font-semibold">Tồn kho</th>
                  <th scope="col" className="w-[14%] px-4 py-3 font-semibold">Kinh doanh</th>
                  <th scope="col" className="w-[19%] px-4 py-3 text-right font-semibold lg:w-[12%]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {products.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-admin-muted/35">
                    <th scope="row" className="px-4 py-3 font-normal">
                      <div className="flex min-w-0 items-center gap-3">
                        <ProductImage src={product.imageUrl} name={product.name} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-admin-text-primary" title={product.name}>{product.name}</p>
                          <p className="mt-1 truncate font-mono text-[11px] text-admin-text-muted" title={product.sku}>SKU {product.sku}</p>
                          <p className="mt-1 truncate text-xs text-admin-text-secondary lg:hidden" title={`${product.productTypeName} · ${product.categoryName}`}>
                            {product.productTypeName} · {product.categoryName}
                          </p>
                        </div>
                      </div>
                    </th>
                    <td className="hidden px-4 py-3 text-admin-text-secondary lg:table-cell">
                      <p className="truncate font-medium text-admin-text-primary" title={product.productTypeName}>{product.productTypeName}</p>
                      <p className="mt-0.5 truncate text-xs" title={product.categoryName}>{product.categoryName}</p>
                    </td>
                    <td className="px-4 py-3"><ProductPrice price={product.price} salePrice={product.salePrice} /></td>
                    <td className="px-4 py-3">
                      <StockBadge status={product.stockStatus} />
                    </td>
                    <td className="px-4 py-3"><BusinessStatus isActive={product.isActive} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => onEdit(product)}
                            className="btn-press inline-flex min-h-10 items-center gap-1.5 rounded-admin-control px-2.5 text-sm font-semibold text-admin-text-secondary transition-colors hover:bg-admin-primary/8 hover:text-admin-primary"
                            aria-label={`Sửa sản phẩm ${product.name}`}
                          >
                            <Pencil size={16} strokeWidth={1.8} aria-hidden="true" />
                            Sửa
                          </button>
                        ) : <span className="text-xs text-admin-text-muted">Chỉ xem</span>}
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => onDelete(product)}
                            disabled={deletingId !== null}
                            className="btn-press inline-flex h-10 w-10 items-center justify-center rounded-admin-control text-admin-text-muted transition-colors hover:bg-admin-status-error/8 hover:text-admin-status-error disabled:cursor-not-allowed disabled:opacity-45"
                            aria-label={`Xóa sản phẩm ${product.name}`}
                            title="Xóa sản phẩm"
                          >
                            <Trash2 size={16} strokeWidth={1.8} aria-hidden="true" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ProductPagination
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </>
      )}
    </section>
  );
};
