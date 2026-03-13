import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { mockTags } from '@/shared/constants/masterdataMock';
import type { Tag } from '../types/masterdata.types';

export const TagPage: React.FC = () => {
  const [items, setItems] = useState<Tag[]>(mockTags);
  const [creating, setCreating] = useState(false);
  const [languageCode, setLanguageCode] = useState('en');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const nextId = items.length ? Math.max(...items.map((t) => t.id)) + 1 : 1;
      const newTag: Tag = {
        id: nextId,
        isActive: true,
        translations: [
          {
            languageCode,
            name,
            description: description || null,
          },
        ],
      };
      setItems((prev) => [...prev, newTag]);
      setName('');
      setDescription('');
    } catch (error) {
      console.error('Failed to create tag', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tags"
        description="Manage product tags used for search and merchandising."
        actions={null}
      />

      <form onSubmit={handleCreate} className="bg-admin-card rounded-2xl shadow-sm border border-admin-border p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-admin-text-secondary mb-1">Language Code</label>
            <input
              className="w-full px-3 py-2 text-sm rounded-lg border border-admin-input-border bg-admin-bg focus:outline-none focus:ring-2 focus:ring-admin-input-focus/20 focus:border-admin-input-focus"
              value={languageCode}
              onChange={(e) => setLanguageCode(e.target.value)}
              placeholder="en"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-admin-text-secondary mb-1">Name</label>
            <input
              className="w-full px-3 py-2 text-sm rounded-lg border border-admin-input-border bg-admin-bg focus:outline-none focus:ring-2 focus:ring-admin-input-focus/20 focus:border-admin-input-focus"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Occasion: Birthday"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-admin-text-secondary mb-1">Description</label>
            <input
              className="w-full px-3 py-2 text-sm rounded-lg border border-admin-input-border bg-admin-bg focus:outline-none focus:ring-2 focus:ring-admin-input-focus/20 focus:border-admin-input-focus"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={creating}
          className="inline-flex items-center gap-2 px-4 py-2 bg-admin-primary text-admin-text-inverse rounded-xl hover:bg-admin-primary-hover transition-colors shadow-lg shadow-admin-primary/20 disabled:opacity-60"
        >
          <Plus size={18} />
          <span className="text-sm font-medium">{creating ? 'Saving...' : 'Add Tag'}</span>
        </button>
      </form>

      <div className="bg-admin-card rounded-2xl shadow-sm border border-admin-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-admin-border bg-admin-muted/50">
                <th className="px-6 py-3 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">
                  Default Name (en)
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">
                  Active
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {items.length === 0 ? (
                <tr>
                  <td className="px-6 py-4 text-sm text-admin-text-secondary" colSpan={2}>
                    No tags found.
                  </td>
                </tr>
              ) : (
                items.map((tag) => (
                  <tr key={tag.id} className="hover:bg-admin-bg transition-colors">
                    <td className="px-6 py-3 text-sm text-admin-text-primary">{tag.id}</td>
                    <td className="px-6 py-3 text-sm text-admin-text-primary">
                      {(
                        tag.translations.find((t) => t.languageCode === 'en') ??
                        tag.translations[0]
                      )?.name ?? '-'}
                    </td>
                    <td className="px-6 py-3 text-sm text-admin-text-primary">
                      {tag.isActive ? 'Yes' : 'No'}
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

