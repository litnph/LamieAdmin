import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Filter, Plus, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { channelsApi, type ChannelDto } from '@/features/settings/channels/api/channelsApi';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Permission } from '@/features/auth/permissions';
import { SettingsDialog, ConfirmationPanel } from '@/features/settings/components/SettingsDialog';
import { PageHeader } from '@/shared/components/PageHeader';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { ordersApi } from '../api/ordersApi';
import { OrderListContent } from '../components/OrderListContent';
import { OrderPagination } from '../components/OrderPagination';
import { nextOrderStatuses, orderStatusLabel, paymentStatusLabel } from '../constants/orderLabels';
import type { OrderListItemDto, OrderListQuery, PagedOrders } from '../types/order.types';
import { OrderSortBy, OrderStatus, PaymentStatus, SortDirection } from '../types/order.types';
import { toLocalDateBoundaryIso } from '../utils/orderListFormatters';

const PAGE_SIZE = 20;

type OrderFilterDraft = {
  search: string;
  phone: string;
  orderStatus: string;
  paymentStatus: string;
  channelId: string;
  deliveryFrom: string;
  deliveryTo: string;
  createdFrom: string;
  createdTo: string;
  sortBy: string;
  sortDirection: string;
};

const EMPTY_FILTERS: OrderFilterDraft = {
  search: '',
  phone: '',
  orderStatus: '',
  paymentStatus: '',
  channelId: '',
  deliveryFrom: '',
  deliveryTo: '',
  createdFrom: '',
  createdTo: '',
  sortBy: String(OrderSortBy.DeliveryAt),
  sortDirection: String(SortDirection.Ascending),
};

const EMPTY_RESULT: PagedOrders = {
  items: [],
  totalCount: 0,
  page: 1,
  pageSize: PAGE_SIZE,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

const inputClass =
  'h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-surface px-3 text-sm text-admin-text-primary placeholder-admin-text-muted transition-colors focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text';

const buildQuery = (filters: OrderFilterDraft): OrderListQuery => ({
  search: filters.search.trim() || undefined,
  phone: filters.phone.trim() || undefined,
  orderStatus: filters.orderStatus ? (Number(filters.orderStatus) as OrderStatus) : undefined,
  paymentStatus: filters.paymentStatus ? (Number(filters.paymentStatus) as PaymentStatus) : undefined,
  channelId: filters.channelId || undefined,
  deliveryFrom: toLocalDateBoundaryIso(filters.deliveryFrom, false),
  deliveryTo: toLocalDateBoundaryIso(filters.deliveryTo, true),
  createdFrom: toLocalDateBoundaryIso(filters.createdFrom, false),
  createdTo: toLocalDateBoundaryIso(filters.createdTo, true),
  sortBy: Number(filters.sortBy) as OrderSortBy,
  sortDirection: Number(filters.sortDirection) as SortDirection,
});

const countActiveFilters = (query: OrderListQuery) =>
  [
    query.search,
    query.phone,
    query.orderStatus,
    query.paymentStatus,
    query.channelId,
    query.deliveryFrom,
    query.deliveryTo,
    query.createdFrom,
    query.createdTo,
  ].filter((value) => value !== undefined && value !== '').length;

const filtersFromParams = (params: URLSearchParams): OrderFilterDraft => ({
  search: params.get('q') ?? '',
  phone: params.get('phone') ?? '',
  orderStatus: params.get('status') ?? '',
  paymentStatus: params.get('payment') ?? '',
  channelId: params.get('channel') ?? '',
  deliveryFrom: params.get('deliveryFrom') ?? '',
  deliveryTo: params.get('deliveryTo') ?? '',
  createdFrom: params.get('createdFrom') ?? '',
  createdTo: params.get('createdTo') ?? '',
  sortBy: params.get('sortBy') ?? String(OrderSortBy.DeliveryAt),
  sortDirection: params.get('sortDirection') ?? String(SortDirection.Ascending),
});

const filtersToParams = (filters: OrderFilterDraft, page: number): URLSearchParams => {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set('q', filters.search.trim());
  if (filters.phone.trim()) params.set('phone', filters.phone.trim());
  if (filters.orderStatus) params.set('status', filters.orderStatus);
  if (filters.paymentStatus) params.set('payment', filters.paymentStatus);
  if (filters.channelId) params.set('channel', filters.channelId);
  if (filters.deliveryFrom) params.set('deliveryFrom', filters.deliveryFrom);
  if (filters.deliveryTo) params.set('deliveryTo', filters.deliveryTo);
  if (filters.createdFrom) params.set('createdFrom', filters.createdFrom);
  if (filters.createdTo) params.set('createdTo', filters.createdTo);
  if (filters.sortBy !== String(OrderSortBy.DeliveryAt)) params.set('sortBy', filters.sortBy);
  if (filters.sortDirection !== String(SortDirection.Ascending)) params.set('sortDirection', filters.sortDirection);
  if (page > 1) params.set('page', String(page));
  return params;
};

const sameFilters = (left: OrderFilterDraft, right: OrderFilterDraft) =>
  (Object.keys(EMPTY_FILTERS) as Array<keyof OrderFilterDraft>).every((key) => left[key] === right[key]);

export const OrderListPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManageOrders = hasPermission(Permission.OrdersManage);
  const canCancelOrders = hasPermission(Permission.OrdersCancel);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const syncSourceRef = useRef<'url' | null>(null);
  const [initialFilters] = useState(() => filtersFromParams(searchParams));
  const [draftFilters, setDraftFilters] = useState<OrderFilterDraft>(initialFilters);
  const [appliedDraft, setAppliedDraft] = useState<OrderFilterDraft>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<OrderListQuery>(() => buildQuery(initialFilters));
  const [result, setResult] = useState<PagedOrders>(EMPTY_RESULT);
  const [page, setPage] = useState(() => {
    const value = Number(searchParams.get('page'));
    return Number.isFinite(value) && value >= 1 ? Math.floor(value) : 1;
  });
  const [channels, setChannels] = useState<ChannelDto[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [channelsError, setChannelsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<OrderListItemDto | null>(null);
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);

  const activeFilterCount = useMemo(() => countActiveFilters(appliedFilters), [appliedFilters]);
  const hasActiveFilters = activeFilterCount > 0;
  const advancedFilterCount = useMemo(
    () => [
      appliedFilters.orderStatus,
      appliedFilters.paymentStatus,
      appliedFilters.channelId,
      appliedFilters.createdFrom,
      appliedFilters.createdTo,
    ].filter((value) => value !== undefined && value !== '').length,
    [appliedFilters],
  );

  const loadChannels = useCallback(async () => {
    setChannelsLoading(true);
    setChannelsError(null);
    try {
      setChannels(await channelsApi.list());
    } catch (loadError) {
      setChannelsError(getApiErrorMessage(loadError));
    } finally {
      setChannelsLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ordersApi.list({
        ...appliedFilters,
        page,
        pageSize: PAGE_SIZE,
      });
      if (data.totalPages > 0 && page > data.totalPages) {
        setPage(data.totalPages);
        return;
      }
      setResult(data);
    } catch (loadError) {
      setResult((current) => ({ ...current, items: [] }));
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const nextFilters = filtersFromParams(searchParams);
    const pageValue = Number(searchParams.get('page'));
    const nextPage = Number.isFinite(pageValue) && pageValue >= 1 ? Math.floor(pageValue) : 1;
    if (!sameFilters(nextFilters, appliedDraft) || nextPage !== page) {
      syncSourceRef.current = 'url';
      setDraftFilters(nextFilters);
      setAppliedDraft(nextFilters);
      setAppliedFilters(buildQuery(nextFilters));
      setPage(nextPage);
    }
  }, [searchParamsKey]);

  useEffect(() => {
    if (syncSourceRef.current === 'url') {
      syncSourceRef.current = null;
      return;
    }
    const next = filtersToParams(appliedDraft, page);
    if (next.toString() !== searchParamsKey) {
      setSearchParams(next);
    }
  }, [appliedDraft, page, searchParamsKey, setSearchParams]);

  const updateDraft = <Key extends keyof OrderFilterDraft>(key: Key, value: OrderFilterDraft[Key]) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };

  const applyFilters = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setFilterError(null);

    if (draftFilters.deliveryFrom && draftFilters.deliveryTo && draftFilters.deliveryFrom > draftFilters.deliveryTo) {
      setFilterError('Ngày giao bắt đầu phải trước hoặc bằng ngày giao kết thúc.');
      return;
    }
    if (draftFilters.createdFrom && draftFilters.createdTo && draftFilters.createdFrom > draftFilters.createdTo) {
      setFilterError('Ngày tạo bắt đầu phải trước hoặc bằng ngày tạo kết thúc.');
      return;
    }

    setPage(1);
    setAppliedDraft(draftFilters);
    setAppliedFilters(buildQuery(draftFilters));
    setAdvancedFilterOpen(false);
  };

  const clearFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedDraft(EMPTY_FILTERS);
    setAppliedFilters({});
    setFilterError(null);
    setPage(1);
  };

  const changeStatus = async (order: OrderListItemDto, status: OrderStatus): Promise<boolean> => {
    const permitted = status === OrderStatus.Cancelled ? canCancelOrders : canManageOrders;
    if (!permitted || updatingId || !nextOrderStatuses(order.orderStatus).includes(status)) return false;

    setUpdatingId(order.id);
    setActionError(null);
    setActionMessage(null);
    try {
      await ordersApi.changeStatus(order.id, status);
      await loadOrders();
      setActionMessage(`Đã chuyển đơn ${order.orderCode} sang ${orderStatusLabel[status].toLocaleLowerCase('vi')}.`);
      return true;
    } catch (updateError) {
      setActionError(`Không thể cập nhật đơn ${order.orderCode}: ${getApiErrorMessage(updateError)}`);
      return false;
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete || updatingId) return;
    setUpdatingId(pendingDelete.id);
    setActionError(null);
    setActionMessage(null);
    try {
      await ordersApi.delete(pendingDelete.id);
      setPendingDelete(null);
      await loadOrders();
      setActionMessage(`Đã xóa đơn ${pendingDelete.orderCode}.`);
    } catch (deleteError) {
      setActionError(`Không thể xóa đơn ${pendingDelete.orderCode}: ${getApiErrorMessage(deleteError)}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const createAction = canManageOrders ? (
    <Link
      to="/admin/orders/new"
      className="btn-press inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover sm:w-auto"
    >
      <Plus size={17} strokeWidth={1.8} aria-hidden="true" />
      Tạo đơn
    </Link>
  ) : null;

  return (
    <div>
      <PageHeader
        title="Đơn hàng"
        description="Tìm và xử lý nhanh đơn chờ xác nhận, đang chuẩn bị, sắp giao hoặc giao trễ."
        actions={createAction}
      />

      <section
        className="mb-4 rounded-admin-panel border border-admin-border bg-admin-surface shadow-admin-panel"
        aria-labelledby="order-filter-title"
      >
        <div className="flex items-center justify-between gap-3 border-b border-admin-border px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <Filter size={18} strokeWidth={1.8} className="shrink-0 text-admin-text-secondary" aria-hidden="true" />
            <h2 id="order-filter-title" className="text-sm font-semibold text-admin-text-primary">Tìm kiếm và bộ lọc</h2>
          </div>
          {activeFilterCount > 0 ? (
            <span className="rounded-md bg-admin-primary/10 px-2 py-1 text-xs font-semibold text-admin-primary">
              {activeFilterCount} điều kiện
            </span>
          ) : null}
        </div>

        <form onSubmit={applyFilters} className="p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(14rem,1.45fr)_minmax(10rem,0.9fr)_minmax(9rem,0.75fr)_minmax(9rem,0.75fr)_minmax(13rem,1.1fr)]">
            <div>
              <label htmlFor="order-search" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">
                Tìm đơn hàng
              </label>
              <div className="relative">
                <Search
                  size={17}
                  strokeWidth={1.8}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted"
                  aria-hidden="true"
                />
                <input
                  id="order-search"
                  type="search"
                  value={draftFilters.search}
                  onChange={(event) => updateDraft('search', event.target.value)}
                  className={`${inputClass} pl-10`}
                  placeholder="Mã đơn, tên người đặt hoặc người nhận"
                />
              </div>
            </div>

            <div>
              <label htmlFor="order-phone" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">
                Số điện thoại
              </label>
              <input
                id="order-phone"
                type="tel"
                inputMode="tel"
                value={draftFilters.phone}
                onChange={(event) => updateDraft('phone', event.target.value)}
                className={inputClass}
                placeholder="Người đặt hoặc người nhận"
              />
            </div>

            <div className="hidden">
              <label htmlFor="order-status-hidden" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">
                Trạng thái đơn
              </label>
              <select
                id="order-status-hidden"
                value={draftFilters.orderStatus}
                onChange={(event) => updateDraft('orderStatus', event.target.value)}
                className={inputClass}
              >
                <option value="">Tất cả trạng thái</option>
                {Object.entries(orderStatusLabel).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="hidden">
              <label htmlFor="payment-status-hidden" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">
                Thanh toán
              </label>
              <select
                id="payment-status-hidden"
                value={draftFilters.paymentStatus}
                onChange={(event) => updateDraft('paymentStatus', event.target.value)}
                className={inputClass}
              >
                <option value="">Tất cả thanh toán</option>
                {Object.entries(paymentStatusLabel).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="hidden">
              <label htmlFor="order-channel-hidden" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">
                Kênh bán
              </label>
              <select
                id="order-channel-hidden"
                value={draftFilters.channelId}
                onChange={(event) => updateDraft('channelId', event.target.value)}
                className={inputClass}
                disabled={channelsLoading}
              >
                <option value="">{channelsLoading ? 'Đang tải kênh...' : 'Tất cả kênh'}</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>{channel.name}</option>
                ))}
              </select>
              {channelsError ? (
                <button
                  type="button"
                  onClick={() => void loadChannels()}
                  className="mt-1.5 inline-flex min-h-11 items-center rounded-admin-control px-2 text-left text-xs font-medium text-admin-status-error hover:bg-admin-status-error/8 hover:underline"
                >
                  Không tải được kênh. Thử lại
                </button>
              ) : null}
            </div>

            <div>
              <label htmlFor="delivery-from" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">
                Giao từ ngày
              </label>
              <input
                id="delivery-from"
                type="date"
                value={draftFilters.deliveryFrom}
                max={draftFilters.deliveryTo || undefined}
                onChange={(event) => updateDraft('deliveryFrom', event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="delivery-to" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">
                Giao đến ngày
              </label>
              <input
                id="delivery-to"
                type="date"
                value={draftFilters.deliveryTo}
                min={draftFilters.deliveryFrom || undefined}
                onChange={(event) => updateDraft('deliveryTo', event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="order-sort" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">
                Sắp xếp theo
              </label>
              <select
                id="order-sort"
                value={`${draftFilters.sortBy}:${draftFilters.sortDirection}`}
                onChange={(event) => {
                  const [sortBy, sortDirection] = event.target.value.split(':');
                  setDraftFilters((current) => ({ ...current, sortBy, sortDirection }));
                }}
                className={inputClass}
              >
                <option value={`${OrderSortBy.DeliveryAt}:${SortDirection.Ascending}`}>Thời gian giao · sớm nhất</option>
                <option value={`${OrderSortBy.DeliveryAt}:${SortDirection.Descending}`}>Thời gian giao · muộn nhất</option>
                <option value={`${OrderSortBy.CreatedAt}:${SortDirection.Descending}`}>Ngày tạo · mới nhất</option>
                <option value={`${OrderSortBy.CreatedAt}:${SortDirection.Ascending}`}>Ngày tạo · cũ nhất</option>
                <option value={`${OrderSortBy.TotalAmount}:${SortDirection.Descending}`}>Giá trị · cao nhất</option>
                <option value={`${OrderSortBy.TotalAmount}:${SortDirection.Ascending}`}>Giá trị · thấp nhất</option>
              </select>
            </div>
          </div>

          {filterError ? (
            <p className="mt-3 text-sm text-admin-status-error" role="alert">{filterError}</p>
          ) : null}

          <div className="mt-4 flex flex-nowrap items-center justify-end gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setAdvancedFilterOpen(true)}
              className="btn-press inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-admin-control border border-admin-primary/30 bg-admin-primary/5 px-4 text-sm font-semibold text-admin-primary transition-colors hover:bg-admin-primary/10"
            >
              <SlidersHorizontal size={16} strokeWidth={1.8} aria-hidden="true" />
              Lọc nâng cao
              {advancedFilterCount > 0 ? (
                <span className="rounded-full bg-admin-primary px-1.5 py-0.5 text-[11px] leading-none text-admin-primary-foreground">{advancedFilterCount}</span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters && countActiveFilters(buildQuery(draftFilters)) === 0}
              className="btn-press inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-admin-control border border-admin-border bg-admin-surface px-4 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted disabled:cursor-not-allowed disabled:opacity-45"
            >
              <RotateCcw size={16} strokeWidth={1.8} aria-hidden="true" />
              Xóa bộ lọc
            </button>
            <button
              type="submit"
              className="btn-press inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover"
            >
              <Search size={16} strokeWidth={1.8} aria-hidden="true" />
              Tìm và lọc
            </button>
          </div>
        </form>
      </section>

      {actionError ? (
        <div className="mb-4 rounded-admin-control border border-admin-status-error/25 bg-admin-status-error/8 px-4 py-3 text-sm text-admin-status-error" role="alert">
          {actionError}
        </div>
      ) : null}
      {actionMessage ? (
        <div className="mb-4 rounded-admin-control border border-admin-status-success/25 bg-admin-status-success/8 px-4 py-3 text-sm text-admin-status-success" role="status" aria-live="polite">
          {actionMessage}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-admin-panel border border-admin-border bg-admin-surface shadow-admin-panel" aria-label="Danh sách đơn hàng">
        <OrderListContent
          orders={result.items}
          loading={loading}
          error={error}
          hasActiveFilters={hasActiveFilters}
          updatingId={updatingId}
          canManage={canManageOrders}
          canDelete={canCancelOrders}
          onRetry={() => void loadOrders()}
          onClearFilters={clearFilters}
          onStatusChange={(order, status) => void changeStatus(order, status)}
          onDelete={setPendingDelete}
        />
        {!loading && !error && result.items.length > 0 ? (
          <OrderPagination
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={result.totalCount}
            totalPages={result.totalPages}
            onPageChange={setPage}
          />
        ) : null}
      </section>

      <SettingsDialog
        open={advancedFilterOpen}
        title="Lọc đơn hàng nâng cao"
        description="Thu hẹp danh sách theo trạng thái, kênh bán và ngày tạo."
        onRequestClose={() => setAdvancedFilterOpen(false)}
        closeLabel="Đóng bộ lọc nâng cao"
        width="wide"
      >
        <form onSubmit={applyFilters} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="advanced-order-status" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">Trạng thái đơn</label>
              <select id="advanced-order-status" value={draftFilters.orderStatus} onChange={(event) => updateDraft('orderStatus', event.target.value)} className={inputClass} data-autofocus>
                <option value="">Tất cả trạng thái</option>
                {Object.entries(orderStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="advanced-payment-status" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">Thanh toán</label>
              <select id="advanced-payment-status" value={draftFilters.paymentStatus} onChange={(event) => updateDraft('paymentStatus', event.target.value)} className={inputClass}>
                <option value="">Tất cả thanh toán</option>
                {Object.entries(paymentStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="advanced-order-channel" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">Kênh bán</label>
              <select id="advanced-order-channel" value={draftFilters.channelId} onChange={(event) => updateDraft('channelId', event.target.value)} className={inputClass} disabled={channelsLoading}>
                <option value="">{channelsLoading ? 'Đang tải kênh...' : 'Tất cả kênh'}</option>
                {channels.map((channel) => <option key={channel.id} value={channel.id}>{channel.name}</option>)}
              </select>
              {channelsError ? <p className="mt-1.5 text-xs text-admin-status-error">Không tải được danh sách kênh.</p> : null}
            </div>
            <div>
              <label htmlFor="created-from" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">Tạo từ ngày</label>
              <input id="created-from" type="date" value={draftFilters.createdFrom} max={draftFilters.createdTo || undefined} onChange={(event) => updateDraft('createdFrom', event.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="created-to" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">Tạo đến ngày</label>
              <input id="created-to" type="date" value={draftFilters.createdTo} min={draftFilters.createdFrom || undefined} onChange={(event) => updateDraft('createdTo', event.target.value)} className={inputClass} />
            </div>
          </div>
          {filterError ? <p className="text-sm text-admin-status-error" role="alert">{filterError}</p> : null}
          <div className="flex flex-col-reverse gap-2 border-t border-admin-border pt-4 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => setDraftFilters((current) => ({ ...current, orderStatus: '', paymentStatus: '', channelId: '', createdFrom: '', createdTo: '' }))}
              className="min-h-11 rounded-admin-control px-4 text-sm font-semibold text-admin-text-secondary transition-colors hover:bg-admin-muted"
            >
              Xóa lọc nâng cao
            </button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button type="button" onClick={() => setAdvancedFilterOpen(false)} className="min-h-11 rounded-admin-control border border-admin-border px-4 text-sm font-semibold text-admin-text-primary hover:bg-admin-muted">Đóng</button>
              <button type="submit" className="min-h-11 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover">Áp dụng bộ lọc</button>
            </div>
          </div>
        </form>
      </SettingsDialog>

      <SettingsDialog
        open={pendingDelete !== null}
        title="Xác nhận xóa đơn"
        description={pendingDelete ? `Đơn ${pendingDelete.orderCode} sẽ bị xóa khỏi hệ thống.` : undefined}
        onRequestClose={() => {
          if (!updatingId) setPendingDelete(null);
        }}
        closeLabel="Đóng xác nhận xóa đơn"
      >
        {pendingDelete ? (
          <ConfirmationPanel
            title={`Xóa vĩnh viễn đơn ${pendingDelete.orderCode}?`}
            description="Toàn bộ sản phẩm, ảnh minh họa và lịch sử thay đổi của đơn sẽ bị xóa. Thao tác này không thể hoàn tác."
            confirmLabel="Xóa đơn"
            busy={updatingId === pendingDelete.id}
            onCancel={() => setPendingDelete(null)}
            onConfirm={() => void confirmDelete()}
          />
        ) : null}
      </SettingsDialog>
    </div>
  );
};
