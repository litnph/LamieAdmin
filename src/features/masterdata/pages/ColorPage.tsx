import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { MasterdataApi } from '../api/masterdataApi';
import type { Color } from '../types/masterdata.types';

export const ColorPage: React.FC = () => {
  const [items, setItems] = useState<Color[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await MasterdataApi.getColors();
        setItems(data);
      } catch (error) {
        console.error('Failed to load colors', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Colors"
        description="Define reusable color master data for bouquets and products."
        actions={
          <button className="flex items-center gap-2 px-4 py-2 bg-admin-primary text-admin-text-inverse rounded-xl hover:bg-admin-primary-hover transition-colors shadow-lg shadow-admin-primary/20">
            <Plus size={18} />
            <span className="text-sm font-medium">Add Color</span>
          </button>
        }
      />

      <div className="bg-admin-card rounded-2xl shadow-sm border border-admin-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-admin-border bg-admin-muted/50">
                <th className="px-6 py-3 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">
                  Hex
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">
                  RGB
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
                    No colors found.
                  </td>
                </tr>
              ) : (
                items.map((color) => (
                  <tr key={color.id} className="hover:bg-admin-bg transition-colors">
                    <td className="px-6 py-3 text-sm text-admin-text-primary">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-5 h-5 rounded-full border border-admin-border"
                          style={{ backgroundColor: color.hex_code }}
                        />
                        {color.hex_code}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-admin-text-primary">
                      {color.rgb_code}
                    </td>
                    <td className="px-6 py-3 text-sm text-admin-text-primary">
                      {color.is_active ? 'Yes' : 'No'}
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

