import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Phone, RotateCcw, Search, UserRound } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { orderStatusLabel } from '@/features/orders/constants/orderLabels';
import { OrderStatus } from '@/features/orders/types/order.types';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { customersApi } from '../api/customersApi';
import { CustomerPagination } from '../components/CustomerPagination';
import { CustomerStatusBadge } from '../components/CustomerStatusBadge';
import type { PagedCustomers } from '../types/customer.types';
import {
  formatCustomerCurrency,
  formatCustomerDate,
  isCustomerRequestForbidden,
} from '../utils/customerFormatters';

const PAGE_SIZE = 20;

const fieldClass =
  'min-h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-surface px-3 text-sm text-admin-text-primary transition-colors placeholder:text-admin-text-muted focus:border-admin-input-focus focus:outline-none focus:ring-2 focus:ring-admin-primary/15';

const readCustomerParams = (params: URLSearchParams) => {
  const rawStatus = params.get('status');
  const statusValue = rawStatus === null ? undefined : Number(rawStatus);
  const validStatuses = Object.values(OrderStatus).filter((value): value is OrderStatus => typeof value === 'number');
  const pageValue = Number(params.get('page'));
  return {
    search: params.get('q') ?? '',
    orderStatus: statusValue !== undefined && validStatuses.includes(statusValue as OrderStatus)
      ? statusValue as OrderStatus
      : undefined,
    page: Number.isFinite(pageValue) && pageValue >= 1 ? Math.floor(pageValue) : 1,
  };
};

const toCustomerParams = (search: string, orderStatus: OrderStatus | undefined, page: number) => {
  const params = new URLSearchParams();
  if (search) params.set('q', search);
  if (orderStatus !== undefined) params.set('status', String(orderStatus));
  if (page > 1) params.set('page', String(page));
  return params;
};

const LoadingRows: React.FC = () => (
  <>
    <div className="space-y-3 p-4 md:hidden" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="animate-pulse rounded-admin-panel border border-admin-border bg-admin-surface p-4">
          <div className="h-4 w-2/5 rounded bg-admin-muted" />
          <div className="mt-3 h-3 w-3/5 rounded bg-admin-muted" />
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="h-10 rounded bg-admin-muted" />
            <div className="h-10 rounded bg-admin-muted" />
          </div>
        </div>
      ))}
    </div>
    <div className="hidden p-4 md:block" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="grid animate-pulse grid-cols-[minmax(13rem,1.8fr)_0.7fr_1fr_1fr_auto] gap-5 border-b border-admin-border px-2 py-4 last:border-0 xl:grid-cols-[1.5fr_1.1fr_0.65fr_1fr_1fr_0.8fr_auto]">
          {Array.from({ length: 5 }, (__, cellIndex) => (
            <div key={cellIndex} className="h-4 rounded bg-admin-muted" />
          ))}
        </div>
      ))}
    </div>
  </>
);

type ListStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  tone?: 'default' | 'error';
};

const ListState: React.FC<ListStateProps> = ({ title, description, action, tone = 'default' }) => (
  <div className="flex min-h-72 flex-col items-center justify-center px-5 py-10 text-center" role={tone === 'error' ? 'alert' : 'status'}>
    <div
      className={`flex h-11 w-11 items-center justify-center rounded-admin-control ${
        tone === 'error' ? 'bg-admin-status-error/10 text-admin-status-error' : 'bg-admin-muted text-admin-text-secondary'
      }`}
      aria-hidden="true"
    >
      <UserRound size={21} strokeWidth={1.8} />
    </div>
    <h2 className="mt-4 text-base font-semibold text-admin-text-primary">{title}</h2>
    <p className="mt-1.5 max-w-md text-sm leading-6 text-admin-text-secondary">{description}</p>
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);

export const CustomerListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const syncSourceRef = useRef<'url' | null>(null);
  const [initialFilters] = useState(() => readCustomerParams(searchParams));
  const [data, setData] = useState<PagedCustomers | null>(null);
  const [draftSearch, setDraftSearch] = useState(initialFilters.search);
  const [search, setSearch] = useState(initialFilters.search);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | undefined>(initialFilters.orderStatus);
  const [page, setPage] = useState(initialFilters.page);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const load = useCallback(
    async () => {
      setLoading(true);
      setError(null);
      setPermissionDenied(false);
      try {
        const nextData = await customersApi.list({
          search: search || undefined,
          orderStatus,
          page,
          pageSize: PAGE_SIZE,
        });
        setData(nextData);
        if (nextData.page !== page) setPage(nextData.page);
      } catch (requestError) {
        setData(null);
        setPermissionDenied(isCustomerRequestForbidden(requestError));
        setError(getApiErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    },
    [orderStatus, page, search],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const next = readCustomerParams(searchParams);
    if (next.search !== search || next.orderStatus !== orderStatus || next.page !== page) {
      syncSourceRef.current = 'url';
      setDraftSearch(next.search);
      setSearch(next.search);
      setOrderStatus(next.orderStatus);
      setPage(next.page);
    }
  }, [searchParamsKey]);

  useEffect(() => {
    if (syncSourceRef.current === 'url') {
      syncSourceRef.current = null;
      return;
    }
    const next = toCustomerParams(search, orderStatus, page);
    if (next.toString() !== searchParamsKey) {
      setSearchParams(next);
    }
  }, [orderStatus, page, search, searchParamsKey, setSearchParams]);

  const hasActiveFilters = Boolean(search || orderStatus !== undefined);
  const resultDescription = useMemo(() => {
    if (!data || loading) return 'Đang tải dữ liệu khách hàng';
    if (data.totalCount === 0) return 'Không có khách hàng phù hợp';
    return `${data.totalCount.toLocaleString('vi-VN')} khách hàng phù hợp`;
  }, [data, loading]);

  const applySearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(draftSearch.trim());
  };

  const resetFilters = () => {
    setDraftSearch('');
    setSearch('');
    setOrderStatus(undefined);
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Khách hàng"
        description="Tra cứu liên hệ, tổng quan mua hàng và lịch sử đơn từ dữ liệu vận hành hiện có."
      />

      <form
        onSubmit={applySearch}
        className="mb-4 grid grid-cols-1 gap-3 rounded-admin-panel border border-admin-border bg-admin-surface p-4 md:grid-cols-[minmax(0,1fr)_minmax(13rem,0.35fr)_auto] md:items-end"
        aria-label="Tìm kiếm và lọc khách hàng"
      >
        <div>
          <label htmlFor="customer-search" className="mb-1.5 block text-xs font-medium text-admin-text-secondary">
            Tìm khách hàng
          </label>
          <div className="relative">
            <Search
              size={17}
              strokeWidth={1.8}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted"
              aria-hidden="true"
            />
            <input
              id="customer-search"
              type="search"
              autoComplete="off"
              value={draftSearch}
              onChange={(event) => setDraftSearch(event.target.value)}
              className={`${fieldClass} pl-10`}
              placeholder="Tên hoặc số điện thoại"
            />
          </div>
        </div>
        <div>
          <label htmlFor="customer-order-status" className="mb-1.5 block text-xs font-medium text-admin-text-secondary">
            Có đơn trạng thái
          </label>
          <select
            id="customer-order-status"
            value={orderStatus ?? ''}
            onChange={(event) => {
              setOrderStatus(event.target.value ? (Number(event.target.value) as OrderStatus) : undefined);
              setPage(1);
            }}
            className={fieldClass}
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(orderStatusLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="btn-press inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover md:flex-none"
          >
            <Search size={16} strokeWidth={1.8} aria-hidden="true" />
            Tìm kiếm
          </button>
          {hasActiveFilters || draftSearch ? (
            <button
              type="button"
              onClick={resetFilters}
              className="btn-press inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-admin-control border border-admin-border bg-admin-surface px-3 text-sm font-medium text-admin-text-secondary transition-colors hover:bg-admin-muted hover:text-admin-text-primary"
              aria-label="Xóa tìm kiếm và bộ lọc"
            >
              <RotateCcw size={16} strokeWidth={1.8} aria-hidden="true" />
              <span className="hidden sm:inline">Xóa lọc</span>
            </button>
          ) : null}
        </div>
      </form>

      <p className="mb-3 text-xs text-admin-text-muted" aria-live="polite">
        {resultDescription}. Thông tin liên hệ chỉ dùng cho công việc chăm sóc và xử lý đơn.
      </p>

      <section className="overflow-hidden rounded-admin-panel border border-admin-border bg-admin-surface" aria-label="Danh sách khách hàng">
        {loading ? (
          <LoadingRows />
        ) : permissionDenied ? (
          <ListState
            title="Bạn không có quyền xem dữ liệu khách hàng"
            description="Tài khoản hiện tại không được API cấp quyền đọc dữ liệu đơn dùng để tổng hợp khách hàng."
            tone="error"
          />
        ) : error ? (
          <ListState
            title="Không thể tải danh sách khách hàng"
            description={error}
            tone="error"
            action={
              <button
                type="button"
                onClick={() => void load()}
                className="btn-press min-h-11 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover"
              >
                Thử lại
              </button>
            }
          />
        ) : !data || data.items.length === 0 ? (
          <ListState
            title={hasActiveFilters ? 'Không tìm thấy khách hàng' : 'Chưa có dữ liệu khách hàng'}
            description={
              hasActiveFilters
                ? 'Hãy kiểm tra từ khóa, số điện thoại hoặc bỏ bớt bộ lọc trạng thái.'
                : 'Khách hàng sẽ xuất hiện khi hệ thống có dữ liệu đơn hàng.'
            }
            action={
              hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="btn-press min-h-11 rounded-admin-control border border-admin-border bg-admin-surface px-4 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted"
                >
                  Xóa bộ lọc
                </button>
              ) : null
            }
          />
        ) : (
          <>
            <div className="space-y-3 p-3 md:hidden">
              {data.items.map((customer) => (
                <article key={customer.id} className="rounded-admin-panel border border-admin-border bg-admin-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/admin/customers/${customer.id}`}
                        className="text-base font-semibold text-admin-text-primary transition-colors hover:text-admin-primary"
                      >
                        {customer.name}
                      </Link>
                      <a
                        href={`tel:${customer.phone}`}
                        className="mt-1.5 flex min-w-0 items-start gap-1.5 text-sm text-admin-text-secondary hover:text-admin-primary"
                        aria-label={`Gọi ${customer.name} theo số ${customer.phone}`}
                      >
                        <Phone size={15} strokeWidth={1.8} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <span className="min-w-0 break-all" dir="ltr">{customer.phone}</span>
                      </a>
                    </div>
                    <CustomerStatusBadge status={customer.latestOrder.orderStatus} />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-admin-border pt-4 text-sm">
                    <div>
                      <dt className="text-xs text-admin-text-muted">Số đơn</dt>
                      <dd className="mt-1 font-semibold tabular-nums text-admin-text-primary">{customer.orderCount}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-admin-text-muted">Tổng chi tiêu</dt>
                      <dd className="mt-1 font-semibold tabular-nums text-admin-text-primary">
                        {formatCustomerCurrency(customer.totalSpent)}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-admin-text-muted">Lần mua gần nhất</dt>
                      <dd className="mt-1 text-admin-text-secondary">{formatCustomerDate(customer.lastPurchaseAt)}</dd>
                    </div>
                  </dl>
                  <Link
                    to={`/admin/customers/${customer.id}`}
                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-admin-control border border-admin-border text-sm font-semibold text-admin-text-primary transition-colors hover:border-admin-primary/45 hover:bg-admin-primary/5 hover:text-admin-primary"
                    aria-label={`Xem chi tiết khách hàng ${customer.name}`}
                  >
                    Xem chi tiết
                    <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <caption className="sr-only">Danh sách khách hàng và chỉ số mua hàng</caption>
                <thead className="border-b border-admin-border bg-admin-muted/55 text-xs text-admin-text-secondary">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Khách hàng</th>
                    <th scope="col" className="hidden px-4 py-3 font-semibold xl:table-cell">Liên hệ</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Số đơn</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Tổng chi tiêu</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Lần mua gần nhất</th>
                    <th scope="col" className="hidden px-4 py-3 font-semibold xl:table-cell">Đơn gần nhất</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {data.items.map((customer) => (
                    <tr key={customer.id} className="transition-colors hover:bg-admin-muted/45">
                      <th scope="row" className="px-4 py-3.5 font-normal">
                        <Link
                          to={`/admin/customers/${customer.id}`}
                          className="font-semibold text-admin-text-primary transition-colors hover:text-admin-primary"
                        >
                          {customer.name}
                        </Link>
                        <a
                          href={`tel:${customer.phone}`}
                          className="mt-1 flex max-w-52 items-center gap-1.5 break-all text-xs text-admin-text-muted hover:text-admin-primary xl:hidden"
                          aria-label={`Gọi ${customer.name} theo số ${customer.phone}`}
                        >
                          <Phone size={13} strokeWidth={1.8} className="shrink-0" aria-hidden="true" />
                          <span dir="ltr">{customer.phone}</span>
                        </a>
                      </th>
                      <td className="hidden max-w-56 px-4 py-3.5 xl:table-cell">
                        <a
                          href={`tel:${customer.phone}`}
                          className="inline-flex items-center gap-1.5 break-all text-admin-text-secondary hover:text-admin-primary"
                          aria-label={`Gọi ${customer.name} theo số ${customer.phone}`}
                        >
                          <Phone size={14} strokeWidth={1.8} className="shrink-0" aria-hidden="true" />
                          <span dir="ltr">{customer.phone}</span>
                        </a>
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium tabular-nums text-admin-text-primary">
                        {customer.orderCount}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold tabular-nums text-admin-text-primary">
                        {formatCustomerCurrency(customer.totalSpent)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-admin-text-secondary">
                        {formatCustomerDate(customer.lastPurchaseAt)}
                      </td>
                      <td className="hidden px-4 py-3.5 xl:table-cell">
                        <CustomerStatusBadge status={customer.latestOrder.orderStatus} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          to={`/admin/customers/${customer.id}`}
                          className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-admin-control px-3 text-sm font-semibold text-admin-primary transition-colors hover:bg-admin-primary/8"
                          aria-label={`Xem chi tiết khách hàng ${customer.name}`}
                        >
                          Xem
                          <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <CustomerPagination
              page={data.page}
              pageSize={data.pageSize}
              totalItems={data.totalCount}
              totalPages={data.totalPages}
              label="Phân trang khách hàng"
              onPageChange={setPage}
            />
          </>
        )}
      </section>
    </div>
  );
};
