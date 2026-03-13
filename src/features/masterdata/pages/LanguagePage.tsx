import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { mockLanguages } from '@/shared/constants/masterdataMock';
import type { Language } from '../types/masterdata.types';

export const LanguagePage: React.FC = () => {
  const [items, setItems] = useState<Language[]>(mockLanguages);
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const newItem: Language = { code, name, isActive };
      setItems((prev) => [...prev, newItem]);
      setCode('');
      setName('');
      setIsActive(true);
    } catch (error) {
      console.error('Failed to create language', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Languages"
        description="Configure supported languages for the storefront and admin."
        actions={null}
      />

      <form onSubmit={handleCreate} className="bg-admin-card rounded-2xl shadow-sm border border-admin-border p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-admin-text-secondary mb-1">Code</label>
            <input
              className="w-full px-3 py-2 text-sm rounded-lg border border-admin-input-border bg-admin-bg focus:outline-none focus:ring-2 focus:ring-admin-input-focus/20 focus:border-admin-input-focus"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="en-US"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-admin-text-secondary mb-1">Name</label>
            <input
              className="w-full px-3 py-2 text-sm rounded-lg border border-admin-input-border bg-admin-bg focus:outline-none focus:ring-2 focus:ring-admin-input-focus/20 focus:border-admin-input-focus"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="English (United States)"
              required
            />
          </div>
          <div className="flex items-end gap-2">
            <label className="inline-flex items-center gap-2 text-sm text-admin-text-secondary">
              <input
                type="checkbox"
                className="rounded border-admin-input-border text-admin-primary focus:ring-admin-input-focus"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Active
            </label>
          </div>
        </div>
        <button
          type="submit"
          disabled={creating}
          className="inline-flex items-center gap-2 px-4 py-2 bg-admin-primary text-admin-text-inverse rounded-xl hover:bg-admin-primary-hover transition-colors shadow-lg shadow-admin-primary/20 disabled:opacity-60"
        >
          <Plus size={18} />
          <span className="text-sm font-medium">{creating ? 'Saving...' : 'Add Language'}</span>
        </button>
      </form>

      <div className="bg-admin-card rounded-2xl shadow-sm border border-admin-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-admin-border bg-admin-muted/50">
                <th className="px-6 py-3 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">
                  Active
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {items.length === 0 ? (
                <tr>
                  <td className="px-6 py-4 text-sm text-admin-text-secondary" colSpan={3}>
                    No languages found.
                  </td>
                </tr>
              ) : (
                items.map((lang) => (
                  <tr key={lang.code} className="hover:bg-admin-bg transition-colors">
                    <td className="px-6 py-3 text-sm text-admin-text-primary">{lang.code}</td>
                    <td className="px-6 py-3 text-sm text-admin-text-primary">{lang.name}</td>
                    <td className="px-6 py-3 text-sm text-admin-text-primary">
                      {lang.isActive ? 'Yes' : 'No'}
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

