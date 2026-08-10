import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Permission } from '@/features/auth/permissions';
import { ConfirmationPanel, SettingsDialog } from '@/features/settings/components/SettingsDialog';
import { SettingsShell, SettingsStatus } from '@/features/settings/components/SettingsShell';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { expenseCategoriesApi } from '../api/expensesApi';
import type { ExpenseCategory, ExpenseCategoryPayload } from '../types/expense.types';
import { formatExpenseCurrency } from '../utils/expenseFormatters';

type CategoryDraft = {
  name: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyDraft = (sortOrder = 0): CategoryDraft => ({
  name: '',
  description: '',
  sortOrder: String(sortOrder),
  isActive: true,
});

const draftFromCategory = (category: ExpenseCategory): CategoryDraft => ({
  name: category.name,
  description: category.description ?? '',
  sortOrder: String(category.sortOrder),
  isActive: category.isActive,
});

const fieldClass =
  'h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 text-sm text-admin-text-primary placeholder-admin-text-muted focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:bg-admin-disabled-bg';

export const ExpenseCategoriesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(Permission.ExpensesManage);
  const [rows, setRows] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseCategory | null>(null);
  const [draft, setDraft] = useState<CategoryDraft>(() => emptyDraft());
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<ExpenseCategory | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      setRows(await expenseCategoriesApi.list(true));
    } catch (error) {
      setPageError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    const nextOrder = rows.length === 0 ? 0 : Math.max(...rows.map((row) => row.sortOrder)) + 10;
    setEditing(null);
    setDraft(emptyDraft(nextOrder));
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (category: ExpenseCategory) => {
    setEditing(category);
    setDraft(draftFromCategory(category));
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const sortOrder = Number(draft.sortOrder);
  const formValid = draft.name.trim().length > 0 && Number.isInteger(sortOrder) && sortOrder >= 0;

  const save = async () => {
    if (!formValid) {
      setFormError('Tên danh mục là bắt buộc và thứ tự phải là số nguyên không âm.');
      return;
    }

    const payload: ExpenseCategoryPayload = {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      sortOrder,
      isActive: draft.isActive,
    };
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await expenseCategoriesApi.update(editing.id, payload);
        setSuccessMessage('Đã cập nhật danh mục chi phí.');
      } else {
        await expenseCategoriesApi.create(payload);
        setSuccessMessage('Đã tạo danh mục chi phí.');
      }
      setModalOpen(false);
      setEditing(null);
      await load();
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await expenseCategoriesApi.delete(deleting.id);
      setDeleting(null);
      setSuccessMessage('Đã xóa danh mục chi phí.');
      await load();
    } catch (error) {
      setDeleting(null);
      setPageError(getApiErrorMessage(error));
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <SettingsShell
      title="Danh mục chi phí"
      description="Phân nhóm các khoản chi để lọc danh sách và tổng hợp báo cáo chính xác."
      actions={
        canManage ? (
          <button
            type="button"
            onClick={openCreate}
            className="btn-press inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover sm:w-auto"
          >
            <Plus size={17} strokeWidth={1.8} aria-hidden="true" />
            Thêm danh mục
          </button>
        ) : null
      }
    >
      <div className="space-y-4">
        {successMessage ? <SettingsStatus kind="success">{successMessage}</SettingsStatus> : null}
        {pageError ? <SettingsStatus kind="error">{pageError}</SettingsStatus> : null}

        <section className="overflow-hidden rounded-admin-panel border border-admin-border bg-admin-surface" aria-label="Danh sách danh mục chi phí">
          {loading ? (
            <div className="grid min-h-52 place-items-center px-4 py-10 text-sm text-admin-text-secondary" role="status">
              Đang tải danh mục chi phí
            </div>
          ) : rows.length === 0 ? (
            <div className="grid min-h-52 place-items-center px-4 py-10 text-center">
              <div>
                <p className="font-semibold text-admin-text-primary">Chưa có danh mục chi phí</p>
                <p className="mt-1 text-sm leading-6 text-admin-text-secondary">
                  Tạo danh mục đầu tiên trước khi ghi nhận khoản chi.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-admin-border">
              {rows.map((category) => (
                <article key={category.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-admin-text-primary">{category.name}</h3>
                      <span
                        className={[
                          'rounded-admin-control px-2 py-0.5 text-xs font-medium',
                          category.isActive
                            ? 'bg-green-50 text-admin-status-success'
                            : 'bg-admin-disabled-bg text-admin-disabled-text',
                        ].join(' ')}
                      >
                        {category.isActive ? 'Đang hoạt động' : 'Đã tắt'}
                      </span>
                    </div>
                    <p className="mt-1 max-w-[65ch] text-sm leading-6 text-admin-text-secondary">
                      {category.description || 'Không có mô tả.'}
                    </p>
                    <p className="mt-1 text-xs tabular-nums text-admin-text-muted">
                      Thứ tự {category.sortOrder} · {category.expenseCount} khoản chi · {formatExpenseCurrency(category.totalAmount)}
                    </p>
                  </div>
                  {canManage ? (
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(category)}
                        className="btn-press inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-admin-control border border-admin-border px-3 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted sm:flex-none"
                      >
                        <Pencil size={15} strokeWidth={1.8} aria-hidden="true" />
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(category)}
                        disabled={category.expenseCount > 0}
                        className="btn-press inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-admin-control border border-admin-status-error/30 px-3 text-sm font-semibold text-admin-status-error transition-colors hover:bg-admin-status-error/10 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                        title={category.expenseCount > 0 ? 'Danh mục đã được sử dụng. Hãy tắt thay vì xóa.' : undefined}
                      >
                        <Trash2 size={15} strokeWidth={1.8} aria-hidden="true" />
                        Xóa
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>

        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="btn-press inline-flex min-h-11 items-center gap-2 rounded-admin-control border border-admin-border bg-admin-surface px-3 text-sm font-medium text-admin-text-secondary transition-colors hover:bg-admin-muted hover:text-admin-text-primary disabled:opacity-50"
        >
          <RefreshCw size={16} strokeWidth={1.8} aria-hidden="true" />
          Làm mới
        </button>
      </div>

      <SettingsDialog
        open={modalOpen}
        title={editing ? 'Cập nhật danh mục' : 'Thêm danh mục chi phí'}
        description="Tên danh mục phải duy nhất. Danh mục đã tắt vẫn được giữ trong các khoản chi cũ."
        onRequestClose={closeModal}
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="h-11 rounded-admin-control border border-admin-border bg-admin-card px-4 text-sm font-semibold text-admin-text-primary hover:bg-admin-muted disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={!formValid || saving}
              className="h-11 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm danh mục'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="expense-category-name" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Tên danh mục</label>
            <input
              id="expense-category-name"
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              className={fieldClass}
              maxLength={120}
              placeholder="Ví dụ: Vận chuyển"
              data-autofocus
            />
          </div>
          <div>
            <label htmlFor="expense-category-description" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Mô tả</label>
            <textarea
              id="expense-category-description"
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              className="min-h-24 w-full resize-y rounded-admin-control border border-admin-input-border bg-admin-card px-3 py-2.5 text-sm leading-6 text-admin-text-primary focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/15"
              maxLength={500}
              placeholder="Phạm vi sử dụng của danh mục, không bắt buộc"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="expense-category-order" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Thứ tự</label>
              <input
                id="expense-category-order"
                type="number"
                min="0"
                step="1"
                value={draft.sortOrder}
                onChange={(event) => setDraft((current) => ({ ...current, sortOrder: event.target.value }))}
                className={fieldClass}
              />
            </div>
            <label className="flex min-h-11 items-center gap-3 self-end rounded-admin-control border border-admin-border px-3 text-sm text-admin-text-primary">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))}
                className="h-4 w-4 accent-admin-primary"
              />
              Đang hoạt động
            </label>
          </div>
          {formError ? <p className="text-sm text-admin-status-error" role="alert">{formError}</p> : null}
        </div>
      </SettingsDialog>

      <SettingsDialog
        open={Boolean(deleting)}
        title="Xác nhận xóa danh mục"
        onRequestClose={() => {
          if (!deleteBusy) setDeleting(null);
        }}
      >
        {deleting ? (
          <ConfirmationPanel
            title={`Xóa danh mục ${deleting.name}?`}
            description="Danh mục chưa được sử dụng sẽ bị xóa vĩnh viễn và không thể hoàn tác."
            confirmLabel="Xóa danh mục"
            busy={deleteBusy}
            onCancel={() => setDeleting(null)}
            onConfirm={() => void remove()}
          />
        ) : null}
      </SettingsDialog>
    </SettingsShell>
  );
};
