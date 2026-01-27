import React from 'react';
import { Plus, Filter, Download } from 'lucide-react';
import { ProductTable } from '../features/product/components/ProductTable';
import { mockProducts } from '../data/mockData';

export const ProductPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-admin-text-primary">Products</h2>
          <p className="text-admin-text-secondary mt-1">Manage your flower inventory and catalog.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-admin-card text-admin-text-secondary border border-admin-border rounded-xl hover:bg-admin-secondary hover:text-admin-text-primary transition-colors">
            <Filter size={18} />
            <span className="text-sm font-medium">Filter</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-admin-card text-admin-text-secondary border border-admin-border rounded-xl hover:bg-admin-secondary hover:text-admin-text-primary transition-colors">
            <Download size={18} />
            <span className="text-sm font-medium">Export</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-admin-primary text-admin-text-inverse rounded-xl hover:bg-admin-primary-hover transition-colors shadow-lg shadow-admin-primary/20">
            <Plus size={18} />
            <span className="text-sm font-medium">Add Product</span>
          </button>
        </div>
      </div>

      <ProductTable products={mockProducts} />
    </div>
  );
};