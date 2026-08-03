import React from 'react';
import { Link } from 'react-router-dom';
import type { DashboardStockProduct } from '../types/dashboard.types';
import { SectionEmpty, SectionUnavailable } from './DashboardStates';
import { formatInteger } from '../utils/dashboardFormatters';

type LowStockListProps = {
  products: DashboardStockProduct[] | null;
};

export const LowStockList: React.FC<LowStockListProps> = ({ products }) => (
  <section
    className="min-w-0 overflow-hidden rounded-admin-panel border border-admin-border bg-admin-card shadow-admin-panel"
    aria-labelledby="low-stock-title"
  >
    <div className="flex items-start justify-between gap-4 border-b border-admin-border px-4 py-4 sm:px-5">
      <div className="min-w-0">
        <h2 id="low-stock-title" className="text-base font-semibold text-admin-text-primary">
          Tồn kho cần chú ý
        </h2>
        <p className="mt-1 text-xs text-admin-text-muted">Sản phẩm đang bán có tồn kho từ 5 trở xuống.</p>
      </div>
      <Link to="/admin/products" className="shrink-0 text-sm font-semibold text-admin-primary hover:underline">
        Xem sản phẩm
      </Link>
    </div>

    {products === null ? (
      <SectionUnavailable title="Chưa tải được tồn kho" description="Dữ liệu đơn hàng và doanh thu vẫn có thể xem bình thường." />
    ) : products.length === 0 ? (
      <SectionEmpty title="Tồn kho đang ổn định" description="Không có sản phẩm đang bán nào sắp hết hoặc đã hết hàng." />
    ) : (
      <ol className="divide-y divide-admin-border">
        {products.map((product) => {
          const outOfStock = product.stock <= 0;
          return (
            <li key={product.id}>
              <Link
                to={`/admin/products/${product.id}/edit`}
                className="grid min-h-[4.75rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-admin-muted/55 sm:px-5"
                aria-label={`${product.name}, ${outOfStock ? 'hết hàng' : `còn ${formatInteger(product.stock)} sản phẩm`}`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-admin-text-primary">{product.name}</p>
                  <p className="mt-1 truncate font-mono text-[11px] text-admin-text-muted">SKU {product.sku}</p>
                </div>
                <div className="text-right">
                  <p className={outOfStock ? 'text-sm font-semibold text-admin-status-error' : 'text-sm font-semibold text-admin-status-warning'}>
                    {outOfStock ? 'Hết hàng' : `Còn ${formatInteger(product.stock)}`}
                  </p>
                  <p className="mt-1 text-[11px] text-admin-text-muted">Chỉnh tồn kho</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    )}
  </section>
);

