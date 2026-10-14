import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, LoaderCircle, Search, X } from '@/shared/icons/lucideAnimated';
import { customersApi } from '@/features/customers/api/customersApi';
import type { CustomerSummary } from '@/features/customers/types/customer.types';
import { getApiErrorMessage } from '@/shared/utils/apiError';

type Props = {
  name: string;
  phone: string;
  selected: SelectedMember | null;
  onSelect: (customer: CustomerSummary) => void;
  onClear: () => void;
};

export type SelectedMember = Pick<CustomerSummary, 'id' | 'name' | 'phone'> & { orderCount?: number };

const normalized = (value: string) => value.trim().toLocaleLowerCase('vi');

export const CustomerMemberLookup: React.FC<Props> = ({ name, phone, selected, onSelect, onClear }) => {
  const query = useMemo(() => phone.trim() || name.trim(), [name, phone]);
  const [results, setResults] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changeOpen, setChangeOpen] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const shouldSearch = query.length >= 2 && (!selected || changeOpen);

  useEffect(() => {
    if (!shouldSearch) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    let current = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await customersApi.list({ search: query, page: 1, pageSize: 8 });
        if (current) setResults(response.items);
      } catch (requestError) {
        if (current) {
          setResults([]);
          setError(getApiErrorMessage(requestError));
        }
      } finally {
        if (current) setLoading(false);
      }
    }, 300);

    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [query, retryKey, shouldSearch]);

  const differsFromSelected = selected
    ? normalized(name) !== normalized(selected.name) || normalized(phone) !== normalized(selected.phone)
    : false;

  if (selected) {
    return (
      <div className="rounded-admin-control border border-admin-primary/25 bg-admin-primary/5 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-admin-primary">
              <Check size={14} aria-hidden="true" /> Member đã liên kết
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-admin-text-primary" title={selected.name || selected.phone}>
              {selected.name || 'Chưa có tên'}
            </p>
            <p className="mt-0.5 text-xs text-admin-text-secondary">
              {selected.phone || 'Chưa có số điện thoại'}{selected.orderCount != null ? ` · ${selected.orderCount} đơn` : ''}
            </p>
            {differsFromSelected ? (
              <p className="mt-2 text-xs leading-5 text-admin-text-secondary">
                Thông tin trên đơn đã thay đổi; hồ sơ Member cũ sẽ không bị cập nhật.
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => setChangeOpen((value) => !value)} className="min-h-9 rounded-admin-control border border-admin-border bg-admin-card px-3 text-xs font-semibold text-admin-text-primary hover:bg-admin-muted">
              {changeOpen ? 'Đóng tìm kiếm' : 'Đổi Member'}
            </button>
            <button type="button" onClick={() => { setChangeOpen(false); onClear(); }} className="inline-flex min-h-9 items-center gap-1 rounded-admin-control px-2 text-xs font-semibold text-admin-text-secondary hover:bg-admin-muted hover:text-admin-text-primary">
              <X size={14} aria-hidden="true" /> Bỏ chọn
            </button>
          </div>
        </div>
        {changeOpen ? <LookupResults query={query} results={results} loading={loading} error={error} onRetry={() => setRetryKey((value) => value + 1)} onSelect={(customer) => { setChangeOpen(false); onSelect(customer); }} /> : null}
      </div>
    );
  }

  return (
    <div className="rounded-admin-control border border-admin-border bg-admin-muted/35 p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-admin-text-primary">
        <Search size={14} aria-hidden="true" /> Gợi ý Member cũ
      </p>
      <p className="mt-1 text-xs leading-5 text-admin-text-muted">
        Nhập ít nhất 2 ký tự ở tên hoặc số điện thoại. Chỉ liên kết khi bạn chọn một kết quả.
      </p>
      <LookupResults query={query} results={results} loading={loading} error={error} onRetry={() => setRetryKey((value) => value + 1)} onSelect={onSelect} />
    </div>
  );
};

type LookupResultsProps = {
  query: string;
  results: CustomerSummary[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelect: (customer: CustomerSummary) => void;
};

const LookupResults: React.FC<LookupResultsProps> = ({ query, results, loading, error, onRetry, onSelect }) => {
  if (query.length < 2) return null;
  if (loading) return <p className="mt-3 flex items-center gap-2 text-xs text-admin-text-secondary" role="status"><LoaderCircle size={14} className="animate-spin" aria-hidden="true" /> Đang tìm Member...</p>;
  if (error) return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs leading-5 text-admin-status-error" role="alert">
      <span className="flex min-w-0 items-start gap-2"><AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" /> Không thể tìm Member: {error}</span>
      <button type="button" onClick={onRetry} className="min-h-8 rounded-admin-control px-2 font-semibold underline underline-offset-2 hover:bg-red-50">Thử lại</button>
    </div>
  );
  if (results.length === 0) return <p className="mt-3 text-xs text-admin-text-muted" role="status">Không tìm thấy Member phù hợp. Thông tin này sẽ được coi là khách mới.</p>;

  return (
    <ul className="mt-3 max-h-56 divide-y divide-admin-border overflow-y-auto rounded-admin-control border border-admin-border bg-admin-card" aria-label="Kết quả tìm Member">
      {results.map((customer) => (
        <li key={customer.id}>
          <button type="button" onClick={() => onSelect(customer)} className="flex min-h-12 w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-admin-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-admin-primary/25">
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-admin-text-primary">{customer.name || 'Chưa có tên'}</span>
              <span className="block truncate text-xs text-admin-text-secondary">{customer.phone || 'Chưa có số điện thoại'}</span>
            </span>
            <span className="shrink-0 text-xs tabular-nums text-admin-text-muted">{customer.orderCount} đơn</span>
          </button>
        </li>
      ))}
    </ul>
  );
};
