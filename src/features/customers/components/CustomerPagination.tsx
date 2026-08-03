import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type CustomerPaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  label: string;
  onPageChange: (page: number) => void;
};

export const CustomerPagination: React.FC<CustomerPaginationProps> = ({
  page,
  pageSize,
  totalItems,
  totalPages,
  label,
  onPageChange,
}) => {
  if (totalItems === 0) return null;
  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  return (
    <nav
      className="flex flex-col gap-3 border-t border-admin-border px-4 py-3 text-sm text-admin-text-secondary sm:flex-row sm:items-center sm:justify-between"
      aria-label={label}
    >
      <p aria-live="polite">
        Hiển thị <span className="font-medium text-admin-text-primary">{firstItem}-{lastItem}</span> trong{' '}
        <span className="font-medium text-admin-text-primary">{totalItems}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="btn-press inline-flex min-h-11 items-center gap-1.5 rounded-admin-control border border-admin-border bg-admin-surface px-3 text-sm font-medium text-admin-text-primary transition-colors hover:border-admin-primary/50 hover:bg-admin-primary/5 disabled:cursor-not-allowed disabled:opacity-45"
          aria-label={`Trang trước của ${label.toLocaleLowerCase('vi')}`}
        >
          <ChevronLeft size={16} strokeWidth={1.8} aria-hidden="true" />
          Trước
        </button>
        <span className="min-w-20 text-center text-xs" aria-current="page">
          Trang {page}/{totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="btn-press inline-flex min-h-11 items-center gap-1.5 rounded-admin-control border border-admin-border bg-admin-surface px-3 text-sm font-medium text-admin-text-primary transition-colors hover:border-admin-primary/50 hover:bg-admin-primary/5 disabled:cursor-not-allowed disabled:opacity-45"
          aria-label={`Trang sau của ${label.toLocaleLowerCase('vi')}`}
        >
          Sau
          <ChevronRight size={16} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};
