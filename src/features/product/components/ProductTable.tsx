import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Product } from '@/shared/types';
import { Badge } from '@/shared/components/Badge';

interface ProductTableProps {
  products: Product[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({ products, onEdit, onDelete }) => {
  return (
    <div className="glass border border-white/40 rounded-2xl shadow-sm overflow-hidden animate-fade-in-up">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-admin-border/40 bg-admin-muted/30">
              <th className="px-6 py-3.5 text-[11px] font-semibold text-admin-text-muted uppercase tracking-wider">Product</th>
              <th className="px-6 py-3.5 text-[11px] font-semibold text-admin-text-muted uppercase tracking-wider">Category</th>
              <th className="px-6 py-3.5 text-[11px] font-semibold text-admin-text-muted uppercase tracking-wider">Status</th>
              <th className="px-6 py-3.5 text-[11px] font-semibold text-admin-text-muted uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3.5 text-[11px] font-semibold text-admin-text-muted uppercase tracking-wider">Price</th>
              <th className="px-6 py-3.5 text-[11px] font-semibold text-admin-text-muted uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border/30">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-white/40 transition-colors duration-150">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-11 h-11 rounded-xl object-cover shadow-sm border border-white/50"
                    />
                    <div>
                      <p className="text-sm font-medium text-admin-text-primary">{product.name}</p>
                      <p className="text-[11px] text-admin-text-muted">ID: {product.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-sm text-admin-text-secondary">
                  {product.category}
                </td>
                <td className="px-6 py-3.5">
                  <Badge status={product.status} />
                </td>
                <td className="px-6 py-3.5 text-sm text-admin-text-secondary">
                  {product.stock} units
                </td>
                <td className="px-6 py-3.5 text-sm font-medium text-admin-text-primary">
                  ${product.price.toFixed(2)}
                </td>
                <td className="px-6 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit?.(product.id)}
                      className="p-2 text-admin-text-muted hover:text-admin-primary hover:bg-admin-primary/8 rounded-lg transition-all duration-200"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete?.(product.id)}
                      className="p-2 text-admin-text-muted hover:text-admin-status-error hover:bg-admin-status-error/8 rounded-lg transition-all duration-200"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3.5 border-t border-admin-border/30 flex items-center justify-between bg-admin-muted/20">
        <span className="text-xs text-admin-text-muted">Showing 1-5 of 24 products</span>
        <div className="flex gap-1.5">
          <button className="px-3 py-1.5 text-xs font-medium text-admin-text-muted border border-admin-border/50 rounded-lg hover:bg-white/50 transition-all duration-200 disabled:opacity-40">
            Previous
          </button>
          <button className="px-3 py-1.5 text-xs font-medium bg-admin-primary text-white hover:bg-admin-primary-hover rounded-lg transition-all duration-200 btn-press">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
