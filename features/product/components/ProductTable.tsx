import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Product } from '../../../types';
import { Badge } from '../../../components/ui/Badge';

interface ProductTableProps {
  products: Product[];
}

export const ProductTable: React.FC<ProductTableProps> = ({ products }) => {
  return (
    <div className="bg-admin-card rounded-2xl shadow-sm border border-admin-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-admin-border bg-admin-muted/50">
              <th className="px-6 py-4 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">Stock</th>
              <th className="px-6 py-4 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">Price</th>
              <th className="px-6 py-4 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-admin-bg transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-12 h-12 rounded-lg object-cover shadow-sm border border-admin-border"
                    />
                    <div>
                      <p className="text-sm font-medium text-admin-text-primary">{product.name}</p>
                      <p className="text-xs text-admin-text-secondary">ID: {product.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-admin-text-primary">
                  {product.category}
                </td>
                <td className="px-6 py-4">
                  <Badge status={product.status} />
                </td>
                <td className="px-6 py-4 text-sm text-admin-text-primary">
                  {product.stock} units
                </td>
                <td className="px-6 py-4 text-sm font-medium text-admin-text-primary">
                  ${product.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-admin-text-secondary hover:text-admin-primary hover:bg-admin-muted rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button className="p-2 text-admin-text-secondary hover:text-admin-status-error hover:bg-admin-status-error/10 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-4 border-t border-admin-border flex items-center justify-between">
        <span className="text-sm text-admin-text-secondary">Showing 1-5 of 24 products</span>
        <div className="flex gap-2">
          <button className="px-3 py-1 text-sm text-admin-text-secondary border border-admin-border rounded-lg hover:bg-admin-muted transition-colors disabled:opacity-50">Previous</button>
          <button className="px-3 py-1 text-sm bg-admin-primary text-admin-text-inverse hover:bg-admin-primary-hover rounded-lg transition-colors">Next</button>
        </div>
      </div>
    </div>
  );
};