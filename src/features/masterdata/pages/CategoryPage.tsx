import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { MasterdataApi } from '../api/masterdataApi';
import type { Category } from '../types/masterdata.types';

export const CategoryPage: React.FC = () => {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await MasterdataApi.getCategories();
        setItems(data);
      } catch (error) {
        console.error('Failed to load categories', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Categories"
        description="Manage product categories for navigation and reporting."
        actions={
          <button className="flex items-center gap-2 px-4 py-2 bg-admin-primary text-admin-text-inverse rounded-xl hover:bg-admin-primary-hover transition-colors shadow-lg shadow-admin-primary/20">
            <Plus size={18} />
            <span className="text-sm font-medium">Add Category</span>
          </button>
        }
      />

      <div className="bg-admin-card rounded-2xl shadow-sm border border-admin-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-admin-border bg-admin-muted/50">
                <th className="px-6 py-3 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">
                  Sort Order
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">
                  Active
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {loading ? (
                <tr>
                  <td className="px-6 py-4 text-sm text-admin-text-secondary" colSpan={3}>
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-6 py-4 text-sm text-admin-text-secondary" colSpan={3}>
                    No categories found.
                  </td>
                </tr>
              ) : (
                items.map((category) => (
                  <tr key={category.id} className="hover:bg-admin-bg transition-colors">
                    <td className="px-6 py-3 text-sm text-admin-text-primary">{category.id}</td>
                    <td className="px-6 py-3 text-sm text-admin-text-primary">
                      {category.sort_order ?? '-'}
                    </td>
                    <td className="px-6 py-3 text-sm text-admin-text-primary">
                      {category.is_active ? 'Yes' : 'No'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

