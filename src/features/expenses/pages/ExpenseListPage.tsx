import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CircleDollarSign,
  ListFilter,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Tags,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Permission } from '@/features/auth/permissions';
import { ConfirmationPanel, SettingsDialog } from '@/features/settings/components/SettingsDialog';
import { PageHeader } from '@/shared/components/PageHeader';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { formatVndInput, parseVndInput } from '@/shared/utils/displayFormatters';
import { expenseCategoriesApi, expensesApi } from '../api/expensesApi';
import { ExpensePagination } from '../components/ExpensePagination';
import type {
  Expense,
  ExpenseCategory,
  ExpensePayload,
  ExpenseSummary,
  PagedExpenses,
} from '../types/expense.types';
import {
  firstDayOfMonth,
  formatExpenseCurrency,
  formatExpenseDate,
  localDateInputValue,
} from '../utils/expenseFormatters';

type ExpenseDraft = {
  expenseCategoryId: string;
  expenseDate: string;
  amount: string;
  description: string;
  notes: string;
};

const PAGE_SIZE = 20;

const fieldClass =
  'h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 text-sm text-admin-text-primary placeholder-admin-text-muted focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text';

const textAreaClass =
  'min-h-24 w-full resize-y rounded-admin-control border border-admin-input-border bg-admin-card px-3 py-2.5 text-sm leading-6 text-admin-text-primary placeholder-admin-text-muted focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/15';

const emptyDraft = (categoryId = ''): ExpenseDraft => ({
  expenseCategoryId: categoryId,
  expenseDate: localDateInputValue(),
  amount: '',
  description: '',
  notes: '',
});

const draftFromExpense = (expense: Expense): ExpenseDraft => ({
  expenseCategoryId: expense.expenseCategoryId,
  expenseDate: expense.expenseDate,
  amount: String(expense.amount),
  description: expense.description,
  notes: expense.notes ?? '',
});

const SummaryCard: React.FC<{ label: string; value: string; detail: string }> = ({ label, value, detail }) => (
  <article className="rounded-admin-panel border border-admin-border bg-admin-surface p-4 shadow-admin-panel sm:p-5">
    <p className="text-xs font-medium text-admin-text-muted">{label}</p>
    <p className="mt-2 text-xl font-semibold tabular-nums tracking-[-0.02em] text-admin-text-primary sm:text-2xl">
      {value}
    </p>
    <p className="mt-1 text-xs leading-5 text-admin-text-secondary">{detail}</p>
  </article>
);

export const ExpenseListPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(Permission.ExpensesManage);
  const today = useMemo(() => localDateInputValue(), []);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [data, setData] = useState<PagedExpenses | null>(null);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [draftSearch, setDraftSearch] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [from, setFrom] = useState(() => firstDayOfMonth(today));
  const [to, setTo] = useState(today);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [draft, setDraft] = useState<ExpenseDraft>(() => emptyDraft());
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await expenseCategoriesApi.list(true));
    } catch (error) {
      setPageError(getApiErrorMessage(error));
    }
  }, []);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const result = await expensesApi.list({
        search: search || undefined,
        expenseCategoryId: categoryId || undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setData(result);
      if (result.page !== page) setPage(result.page);
    } catch (error) {
      setPageError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [categoryId, from, page, search, to]);

  const loadSummary = useCallback(async () => {
    if (!from || !to || from > to) {
      setSummary(null);
      setSummaryError('Khoảng ngày tổng hợp chưa hợp lệ.');
      setSummaryLoading(false);
      return;
    }

    setSummaryLoading(true);
    setSummaryError(null);
    try {
      setSummary(await expensesApi.summary(from, to));
    } catch (error) {
      setSummaryError(getApiErrorMessage(error));
    } finally {
      setSummaryLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const activeCategories = categories.filter((category) => category.isActive);
  const validAmount = Number(draft.amount) > 0 && Number.isFinite(Number(draft.amount));
  const formValid =
    draft.expenseCategoryId.length > 0 &&
    draft.expenseDate.length > 0 &&
    validAmount &&
    draft.description.trim().length > 0;

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft(activeCategories[0]?.id));
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditing(expense);
    setDraft(draftFromExpense(expense));
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const saveExpense = async () => {
    if (!formValid) {
      setFormError('Vui lòng chọn danh mục, ngày chi, nhập số tiền lớn hơn 0 và nội dung chi.');
      return;
    }

    const payload: ExpensePayload = {
      expenseCategoryId: draft.expenseCategoryId,
      expenseDate: draft.expenseDate,
      amount: Number(draft.amount),
      description: draft.description.trim(),
      notes: draft.notes.trim() || null,
    };
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await expensesApi.update(editing.id, payload);
        setSuccessMessage('Đã cập nhật khoản chi.');
      } else {
        await expensesApi.create(payload);
        setSuccessMessage('Đã ghi nhận khoản chi.');
      }
      setModalOpen(false);
      setEditing(null);
      await Promise.all([loadExpenses(), loadSummary(), loadCategories()]);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await expensesApi.delete(deleting.id);
      setSuccessMessage('Đã xóa khoản chi.');
      setDeleting(null);
      await Promise.all([loadExpenses(), loadSummary(), loadCategories()]);
    } catch (error) {
      setPageError(getApiErrorMessage(error));
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  const applySearch = (event: React.FormEvent) => {
    event.preventDefault();
    setSearch(draftSearch.trim());
    setPage(1);
  };

  const resetFilters = () => {
    setDraftSearch('');
    setSearch('');
    setCategoryId('');
    setFrom(firstDayOfMonth(today));
    setTo(today);
    setPage(1);
  };

  const hasFilters = Boolean(search || categoryId || from !== firstDayOfMonth(today) || to !== today);
  const periodLabel = from && to ? `${formatExpenseDate(from)} - ${formatExpenseDate(to)}` : 'Khoảng ngày chưa hợp lệ';

  return (
    <div className="min-w-0">
      <PageHeader
        title="Chi phí"
        description="Ghi nhận, phân loại và theo dõi các khoản chi vận hành của cửa hàng."
        actions={
          <>
            <Link
              to="/admin/settings/expense-categories"
              className="btn-press inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-admin-control border border-admin-border bg-admin-surface px-4 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted sm:flex-none"
            >
              <Tags size={17} strokeWidth={1.8} aria-hidden="true" />
              Danh mục
            </Link>
            {canManage ? (
              <button
                type="button"
                onClick={openCreate}
                disabled={activeCategories.length === 0}
                className="btn-press inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                title={activeCategories.length === 0 ? 'Hãy tạo một danh mục chi phí đang hoạt động trước.' : undefined}
              >
                <Plus size={17} strokeWidth={1.8} aria-hidden="true" />
                Thêm khoản chi
              </button>
            ) : null}
          </>
        }
      />

      {successMessage ? (
        <div className="mb-5 rounded-admin-control border border-admin-status-success/30 bg-green-50 px-4 py-3 text-sm text-admin-status-success" role="status">
          {successMessage}
        </div>
      ) : null}

      {activeCategories.length === 0 && canManage ? (
        <div className="mb-5 rounded-admin-control border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950" role="status">
          Chưa có danh mục đang hoạt động. Hãy{' '}
          <Link to="/admin/settings/expense-categories" className="font-semibold underline underline-offset-2">
            tạo danh mục chi phí
          </Link>{' '}
          trước khi ghi khoản chi.
        </div>
      ) : null}

      <section aria-labelledby="expense-summary-title" className="mb-6">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="expense-summary-title" className="text-base font-semibold text-admin-text-primary">Tổng hợp theo kỳ</h2>
            <p className="mt-0.5 text-xs text-admin-text-muted">{periodLabel}</p>
          </div>
          {summaryError ? <p className="text-sm text-admin-status-error" role="alert">{summaryError}</p> : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            label="Tổng chi"
            value={summaryLoading ? 'Đang tải' : formatExpenseCurrency(summary?.totalAmount ?? 0)}
            detail="Tổng số tiền trong khoảng ngày đã chọn"
          />
          <SummaryCard
            label="Số khoản chi"
            value={summaryLoading ? 'Đang tải' : String(summary?.expenseCount ?? 0)}
            detail="Số giao dịch chi phí đã ghi nhận"
          />
          <SummaryCard
            label="Trung bình"
            value={summaryLoading ? 'Đang tải' : formatExpenseCurrency(summary?.averageAmount ?? 0)}
            detail="Giá trị trung bình mỗi khoản chi"
          />
        </div>
        {summary && summary.byCategory.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Tổng chi theo danh mục">
            {summary.byCategory.map((item) => (
              <span
                key={item.expenseCategoryId}
                className="inline-flex min-h-9 items-center gap-2 rounded-admin-control border border-admin-border bg-admin-surface px-3 text-xs text-admin-text-secondary"
              >
                <span>{item.expenseCategoryName}</span>
                <strong className="font-semibold tabular-nums text-admin-text-primary">
                  {formatExpenseCurrency(item.totalAmount)}
                </strong>
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <form
        onSubmit={applySearch}
        className="mb-5 grid gap-3 rounded-admin-panel border border-admin-border bg-admin-surface p-4 shadow-admin-panel md:grid-cols-2 xl:grid-cols-[minmax(14rem,1.5fr)_minmax(12rem,1fr)_minmax(9rem,0.8fr)_minmax(9rem,0.8fr)_auto]"
        aria-label="Bộ lọc chi phí"
      >
        <div>
          <label htmlFor="expense-search" className="mb-1.5 block text-xs font-medium text-admin-text-secondary">Tìm kiếm</label>
          <div className="relative">
            <Search size={16} strokeWidth={1.8} className="pointer-events-none absolute left-3 top-3.5 text-admin-text-muted" aria-hidden="true" />
            <input
              id="expense-search"
              value={draftSearch}
              onChange={(event) => setDraftSearch(event.target.value)}
              className={`${fieldClass} pl-9`}
              placeholder="Nội dung, ghi chú, danh mục"
              maxLength={200}
            />
          </div>
        </div>
        <div>
          <label htmlFor="expense-category-filter" className="mb-1.5 block text-xs font-medium text-admin-text-secondary">Danh mục</label>
          <select
            id="expense-category-filter"
            value={categoryId}
            onChange={(event) => {
              setCategoryId(event.target.value);
              setPage(1);
            }}
            className={fieldClass}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}{category.isActive ? '' : ' (đã tắt)'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="expense-from" className="mb-1.5 block text-xs font-medium text-admin-text-secondary">Từ ngày</label>
          <input
            id="expense-from"
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="expense-to" className="mb-1.5 block text-xs font-medium text-admin-text-secondary">Đến ngày</label>
          <input
            id="expense-to"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => {
              setTo(event.target.value);
              setPage(1);
            }}
            className={fieldClass}
          />
        </div>
        <div className="flex items-end gap-2 md:col-span-2 xl:col-span-1">
          <button
            type="submit"
            className="btn-press inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover xl:flex-none"
          >
            <ListFilter size={16} strokeWidth={1.8} aria-hidden="true" />
            Lọc
          </button>
          {hasFilters || draftSearch ? (
            <button
              type="button"
              onClick={resetFilters}
              className="btn-press inline-flex min-h-11 items-center justify-center rounded-admin-control border border-admin-border bg-admin-surface px-3 text-admin-text-secondary transition-colors hover:bg-admin-muted hover:text-admin-text-primary"
              aria-label="Xóa bộ lọc chi phí"
            >
              <RefreshCw size={16} strokeWidth={1.8} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </form>

      <section className="overflow-hidden rounded-admin-panel border border-admin-border bg-admin-surface" aria-label="Danh sách chi phí">
        {loading ? (
          <div className="grid min-h-56 place-items-center px-4 py-10 text-sm text-admin-text-secondary" role="status">
            Đang tải danh sách chi phí
          </div>
        ) : pageError ? (
          <div className="grid min-h-56 place-items-center px-4 py-10 text-center">
            <div>
              <p className="font-semibold text-admin-status-error">Không thể tải danh sách chi phí</p>
              <p className="mt-1 max-w-lg text-sm text-admin-text-secondary">{pageError}</p>
              <button
                type="button"
                onClick={() => void loadExpenses()}
                className="btn-press mt-4 min-h-11 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground"
              >
                Thử lại
              </button>
            </div>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="grid min-h-56 place-items-center px-4 py-10 text-center">
            <div>
              <CircleDollarSign size={34} strokeWidth={1.5} className="mx-auto text-admin-text-muted" aria-hidden="true" />
              <p className="mt-3 font-semibold text-admin-text-primary">Chưa có khoản chi phù hợp</p>
              <p className="mt-1 max-w-lg text-sm leading-6 text-admin-text-secondary">
                Điều chỉnh bộ lọc hoặc thêm khoản chi đầu tiên cho kỳ đang xem.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3 p-3 md:hidden">
              {data.items.map((expense) => (
                <article key={expense.id} className="rounded-admin-panel border border-admin-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-admin-text-primary">{expense.description}</p>
                      <p className="mt-1 text-xs text-admin-text-muted">
                        {expense.expenseCategoryName} · {formatExpenseDate(expense.expenseDate)}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums text-admin-text-primary">
                      {formatExpenseCurrency(expense.amount)}
                    </p>
                  </div>
                  {expense.notes ? <p className="mt-3 text-sm leading-6 text-admin-text-secondary">{expense.notes}</p> : null}
                  {canManage ? (
                    <div className="mt-4 flex gap-2 border-t border-admin-border pt-3">
                      <button
                        type="button"
                        onClick={() => openEdit(expense)}
                        className="btn-press inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-admin-control border border-admin-border text-sm font-semibold text-admin-text-primary"
                      >
                        <Pencil size={15} strokeWidth={1.8} aria-hidden="true" />
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(expense)}
                        className="btn-press inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-admin-control border border-admin-status-error/30 text-sm font-semibold text-admin-status-error"
                      >
                        <Trash2 size={15} strokeWidth={1.8} aria-hidden="true" />
                        Xóa
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[820px] text-left text-sm">
                <caption className="sr-only">Danh sách các khoản chi</caption>
                <thead className="border-b border-admin-border bg-admin-muted/55 text-xs text-admin-text-secondary">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Ngày chi</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Nội dung</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Danh mục</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Số tiền</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Ghi chú</th>
                    {canManage ? <th scope="col" className="px-4 py-3 text-right font-semibold">Hành động</th> : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {data.items.map((expense) => (
                    <tr key={expense.id} className="transition-colors hover:bg-admin-muted/45">
                      <td className="whitespace-nowrap px-4 py-3.5 text-admin-text-secondary">{formatExpenseDate(expense.expenseDate)}</td>
                      <th scope="row" className="max-w-72 px-4 py-3.5 font-semibold text-admin-text-primary">{expense.description}</th>
                      <td className="px-4 py-3.5 text-admin-text-secondary">{expense.expenseCategoryName}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold tabular-nums text-admin-text-primary">
                        {formatExpenseCurrency(expense.amount)}
                      </td>
                      <td className="max-w-64 px-4 py-3.5 text-admin-text-secondary">
                        <span className="line-clamp-2">{expense.notes || 'Không có'}</span>
                      </td>
                      {canManage ? (
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(expense)}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-admin-control text-admin-text-secondary transition-colors hover:bg-admin-primary/8 hover:text-admin-primary"
                              aria-label={`Sửa khoản chi ${expense.description}`}
                            >
                              <Pencil size={16} strokeWidth={1.8} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleting(expense)}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-admin-control text-admin-status-error transition-colors hover:bg-admin-status-error/10"
                              aria-label={`Xóa khoản chi ${expense.description}`}
                            >
                              <Trash2 size={16} strokeWidth={1.8} aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ExpensePagination
              page={data.page}
              pageSize={data.pageSize}
              totalItems={data.totalCount}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </section>

      <SettingsDialog
        open={modalOpen}
        title={editing ? 'Cập nhật khoản chi' : 'Thêm khoản chi'}
        description="Thông tin này được dùng cho danh sách và báo cáo chi phí."
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
              onClick={() => void saveExpense()}
              disabled={!formValid || saving}
              className="h-11 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm khoản chi'}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="expense-form-category" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Danh mục</label>
            <select
              id="expense-form-category"
              value={draft.expenseCategoryId}
              onChange={(event) => setDraft((current) => ({ ...current, expenseCategoryId: event.target.value }))}
              className={fieldClass}
              data-autofocus
            >
              <option value="">Chọn danh mục</option>
              {categories
                .filter((category) => category.isActive || category.id === draft.expenseCategoryId)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}{category.isActive ? '' : ' (đã tắt)'}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label htmlFor="expense-form-date" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Ngày chi</label>
            <input
              id="expense-form-date"
              type="date"
              value={draft.expenseDate}
              onChange={(event) => setDraft((current) => ({ ...current, expenseDate: event.target.value }))}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="expense-form-amount" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Số tiền</label>
            <div className="relative">
              <input
                id="expense-form-amount"
                type="text"
                value={formatVndInput(draft.amount)}
                onChange={(event) => setDraft((current) => ({ ...current, amount: String(parseVndInput(event.target.value) || '') }))}
                className={`${fieldClass} pr-8 text-right tabular-nums`}
                inputMode="numeric"
                placeholder="0"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-admin-text-muted">₫</span>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="expense-form-description" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Nội dung chi</label>
            <input
              id="expense-form-description"
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              className={fieldClass}
              maxLength={500}
              placeholder="Ví dụ: Phí giao hoa đơn buổi sáng"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="expense-form-notes" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Ghi chú</label>
            <textarea
              id="expense-form-notes"
              value={draft.notes}
              onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
              className={textAreaClass}
              maxLength={2000}
              placeholder="Thông tin bổ sung, không bắt buộc"
            />
          </div>
        </div>
        {formError ? <p className="mt-4 text-sm text-admin-status-error" role="alert">{formError}</p> : null}
      </SettingsDialog>

      <SettingsDialog
        open={Boolean(deleting)}
        title="Xác nhận xóa khoản chi"
        onRequestClose={() => {
          if (!deleteBusy) setDeleting(null);
        }}
      >
        {deleting ? (
          <ConfirmationPanel
            title={`Xóa ${deleting.description}?`}
            description={`Khoản chi ${formatExpenseCurrency(deleting.amount)} ngày ${formatExpenseDate(deleting.expenseDate)} sẽ bị xóa vĩnh viễn và không thể hoàn tác.`}
            confirmLabel="Xóa khoản chi"
            busy={deleteBusy}
            onCancel={() => setDeleting(null)}
            onConfirm={() => void deleteExpense()}
          />
        ) : null}
      </SettingsDialog>
    </div>
  );
};
