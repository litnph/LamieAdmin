import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Download, Eye, FileText,
  MapPin, PackageCheck, Pencil, Plus, Search, Truck,
} from '@/shared/icons/lucideAnimated';
import { PageHeader } from '@/shared/components/PageHeader';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Permission } from '@/features/auth/permissions';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { ordersApi } from '../api/ordersApi';
import { OrderListDialogs } from '../components/OrderListDialogs';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/OrderStatusBadges';
import {
  OrderStatus, PaymentStatus, type FulfillmentType, type OrderDeliveryBoard,
  type OrderListItemDto, type OrderListQuery,
} from '../types/order.types';

type RangeKey = 'all' | 'today' | 'tomorrow' | '3d' | '7d' | 'custom';
type ViewKey = 'table' | 'board';
type DialogKind = 'summary' | 'extra' | 'shipping' | null;
type OrderPriority = 'late' | 'upcoming' | 'unpaid' | 'completed' | 'other';

const BUSINESS_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const PAGE_SIZE = 25;

const dateInVietnam = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
};

const addDays = (iso: string, days: number) => {
  const date = new Date(`${iso}T00:00:00+07:00`);
  date.setUTCDate(date.getUTCDate() + days);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
};

const boundary = (iso: string, end = false) => `${iso}T${end ? '23:59:59.999' : '00:00:00'}+07:00`;
const localDate = (value: string) => dateInVietnam(new Date(value));
const time = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  timeZone: BUSINESS_TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: false,
}).format(new Date(value));
const dateText = (iso: string) => new Intl.DateTimeFormat('vi-VN', {
  timeZone: BUSINESS_TIME_ZONE, weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
}).format(new Date(`${iso}T00:00:00+07:00`));
const money = (value: number) => new Intl.NumberFormat('vi-VN', {
  style: 'currency', currency: 'VND', maximumFractionDigits: 0,
}).format(value);
const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

const rangeFor = (key: RangeKey, today: string, from: string, to: string) => {
  if (key === 'all') return {};
  if (key === 'custom') return { from, to };
  if (key === 'tomorrow') return { from: addDays(today, 1), to: addDays(today, 1) };
  return { from: today, to: addDays(today, key === 'today' ? 0 : key === '3d' ? 2 : 6) };
};

const fulfillmentLabel = (order: OrderListItemDto) => order.pickupAtShop
  ? 'Ghé lấy'
  : order.provinceShipping ? 'Ship tỉnh' : 'Ship nội thành';

const extraLabel = (order: OrderListItemDto) => order.hasCard && order.hasBanner
  ? 'Thiệp và banner'
  : order.hasCard ? 'Thiệp' : order.hasBanner ? 'Banner' : 'Không kèm';

const trackingLabel = (order: OrderListItemDto) => {
  switch (order.trackingGroup) {
    case 'late': return 'Đang trễ';
    case 'today': return 'Chưa giao hôm nay';
    case 'upcoming': return 'Sắp tới';
    case 'delivered-unpaid': return 'Công nợ';
    case 'completed': return 'Hoàn tất';
    case 'cancelled': return 'Đã hủy';
    case 'needs-schedule': return 'Cần bổ sung lịch';
    default: return order.orderStatus === OrderStatus.Completed ? 'Hoàn tất' : 'Đang theo dõi';
  }
};

const trackingTone = (order: OrderListItemDto) => order.trackingGroup === 'late'
  ? 'text-admin-status-error'
  : order.trackingGroup === 'delivered-unpaid' ? 'text-admin-status-warning' : 'text-admin-text-muted';

const priorityRank: Record<OrderPriority, number> = {
  late: 0,
  upcoming: 1,
  unpaid: 2,
  completed: 3,
  other: 4,
};

const orderPriority = (order: OrderListItemDto): OrderPriority => {
  if (order.trackingGroup === 'late') return 'late';
  if (order.trackingGroup === 'today' || order.trackingGroup === 'upcoming') return 'upcoming';
  if (order.paymentStatus !== PaymentStatus.Paid && order.orderStatus !== OrderStatus.Cancelled) return 'unpaid';
  if (order.orderStatus === OrderStatus.Completed || order.trackingGroup === 'completed') return 'completed';
  return 'other';
};

const priorityLabel: Record<OrderPriority, string> = {
  late: 'Đang trễ',
  upcoming: 'Sắp tới',
  unpaid: 'Công nợ',
  completed: 'Hoàn tất',
  other: 'Khác',
};

const orderHighlight = (order: OrderListItemDto) => {
  const priority = orderPriority(order);
  if (priority === 'late') return 'bg-admin-status-error-bg/65 hover:bg-admin-status-error-bg/85';
  if (priority === 'completed') return 'bg-admin-status-success-bg/65 hover:bg-admin-status-success-bg/85';
  if (order.paymentStatus !== PaymentStatus.Paid && order.orderStatus !== OrderStatus.Cancelled) {
    return 'bg-admin-status-warning-bg/65 hover:bg-admin-status-warning-bg/85';
  }
  return 'hover:bg-admin-muted/35';
};

const EmptyState: React.FC<{ onReset: () => void }> = ({ onReset }) => <div className="px-5 py-16 text-center">
  <PackageCheck size={28} className="mx-auto text-admin-text-muted" aria-hidden="true" />
  <h2 className="mt-3 text-base font-semibold text-admin-text-primary">Không có đơn khớp bộ lọc</h2>
  <p className="mx-auto mt-1 max-w-md text-sm text-admin-text-secondary">Thử đổi khoảng ngày hoặc xóa bớt điều kiện tìm kiếm.</p>
  <button type="button" onClick={onReset} className="mt-4 min-h-11 rounded-admin-control border border-admin-border bg-admin-card px-4 text-sm font-semibold text-admin-primary">Đặt lại bộ lọc</button>
</div>;

export const OrderListPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const today = useMemo(() => dateInVietnam(), []);
  const initialRange = params.get('range') as RangeKey | null;
  const [range, setRange] = useState<RangeKey>(initialRange && ['all', 'today', 'tomorrow', '3d', '7d', 'custom'].includes(initialRange) ? initialRange : '7d');
  const [customFrom, setCustomFrom] = useState(params.get('from') ?? today);
  const [customTo, setCustomTo] = useState(params.get('to') ?? addDays(today, 6));
  const [status, setStatus] = useState(params.get('stage') ?? 'all');
  const [payment, setPayment] = useState(params.get('payment') ?? 'all');
  const [fulfillment, setFulfillment] = useState(params.get('fulfillment') ?? 'all');
  const [includeBacklog, setIncludeBacklog] = useState(params.get('backlog') === 'true');
  const [searchDraft, setSearchDraft] = useState(params.get('q') ?? '');
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [page, setPage] = useState(Math.max(1, Number(params.get('page') ?? 1) || 1));
  const [view] = useState<ViewKey>('table');
  const [data, setData] = useState<OrderDeliveryBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState<string | null>(null);
  const [dialogOrder, setDialogOrder] = useState<OrderListItemDto | null>(null);
  const [dialogKind, setDialogKind] = useState<DialogKind>(null);
  const canManage = hasPermission(Permission.OrdersManage);

  const selectedRange = rangeFor(range, today, customFrom, customTo);
  const invalidCustomRange = range === 'custom' && Boolean(customFrom && customTo && customFrom > customTo);

  const query = useMemo<OrderListQuery>(() => ({
    search: search || undefined,
    paymentStatus: payment === 'all' ? undefined : Number(payment) as PaymentStatus,
    orderStatus: status === 'all' ? undefined : Number(status) as OrderStatus,
    fulfillmentType: fulfillment === 'all' ? undefined : fulfillment as FulfillmentType,
    includeBacklog,
    deliveryFrom: selectedRange.from ? boundary(selectedRange.from) : undefined,
    deliveryTo: selectedRange.to ? boundary(selectedRange.to, true) : undefined,
    page,
    pageSize: PAGE_SIZE,
  }), [fulfillment, includeBacklog, page, payment, search, selectedRange.from, selectedRange.to, status]);

  const syncParams = useCallback((overrides: Record<string, string | number | boolean | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(overrides).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === false || value === 'all' || value === 1) next.delete(key);
      else next.set(key, String(value));
    });
    setParams(next, { replace: true });
  }, [params, setParams]);

  const load = useCallback(async (announce = false) => {
    if (invalidCustomRange) return;
    setLoading(true); setError(null);
    try {
      const result = await ordersApi.deliveryBoard(query);
      setData(result);
      if (announce) setLiveMessage('Danh sách đơn hàng đã được cập nhật.');
    } catch (requestError) {
      setData(null); setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [invalidCustomRange, query]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (loading || typeof location.state !== 'object' || location.state === null || !('restoreScrollY' in location.state)) return;
    const scrollY = Number(location.state.restoreScrollY);
    if (!Number.isFinite(scrollY) || scrollY < 0) return;
    requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: 'auto' }));
    window.history.replaceState({}, document.title, `${location.pathname}${location.search}`);
  }, [loading, location.pathname, location.search, location.state]);

  const groups = useMemo(() => {
    const sorted = [...(data?.items ?? [])].sort((left, right) => {
      const priorityDifference = priorityRank[orderPriority(left)] - priorityRank[orderPriority(right)];
      if (priorityDifference !== 0) return priorityDifference;
      const deliveryDifference = new Date(left.deliveryAt).getTime() - new Date(right.deliveryAt).getTime();
      return deliveryDifference !== 0 ? deliveryDifference : left.orderCode.localeCompare(right.orderCode, 'vi');
    });
    const result = new Map<string, { date: string; priority: OrderPriority; orders: OrderListItemDto[] }>();
    for (const order of sorted) {
      const date = localDate(order.deliveryAt);
      const priority = orderPriority(order);
      const key = `${priority}:${date}`;
      const group = result.get(key) ?? { date, priority, orders: [] };
      group.orders.push(order);
      result.set(key, group);
    }
    return [...result.entries()];
  }, [data]);

  const updateFilter = (key: 'stage' | 'payment' | 'fulfillment', value: string) => {
    if (key === 'stage') setStatus(value);
    if (key === 'payment') setPayment(value);
    if (key === 'fulfillment') setFulfillment(value);
    setPage(1); syncParams({ [key]: value, page: undefined });
  };

  const chooseRange = (nextRange: RangeKey) => {
    setRange(nextRange); setPage(1);
    syncParams({ range: nextRange === '7d' ? undefined : nextRange, page: undefined, from: nextRange === 'custom' ? customFrom : undefined, to: nextRange === 'custom' ? customTo : undefined });
  };

  const resetFilters = () => {
    setRange('7d'); setCustomFrom(today); setCustomTo(addDays(today, 6)); setStatus('all'); setPayment('all'); setFulfillment('all'); setIncludeBacklog(false); setSearchDraft(''); setSearch(''); setPage(1);
    setParams(new URLSearchParams(), { replace: true });
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault(); const value = searchDraft.trim(); setSearch(value); setPage(1); syncParams({ q: value, page: undefined });
  };

  const openDialog = (order: OrderListItemDto, kind: Exclude<DialogKind, null>) => {
    setDialogOrder(order); setDialogKind(kind); setLiveMessage(null);
  };

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['Ngày', 'Giờ', 'Mã đơn', 'Sản phẩm', 'Người đặt', 'Điện thoại', 'Kênh', 'Cách nhận', 'Tiến trình', 'Tổng đơn', 'Đã thanh toán', 'Còn lại'],
      ...data.items.map(order => [localDate(order.deliveryAt), time(order.deliveryAt), order.orderCode, order.productSummary, order.ordererName, order.ordererPhone, order.channelName ?? '', fulfillmentLabel(order), trackingLabel(order), order.totalAmount, order.paidAmount, order.remainingAmount]),
    ];
    const blob = new Blob([`﻿${rows.map(row => row.map(csvCell).join(',')).join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `don-hang-${today}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const listState = { from: `${location.pathname}${location.search}`, scrollY: window.scrollY };
  const successMessage = typeof location.state === 'object' && location.state !== null && 'successMessage' in location.state
    ? String(location.state.successMessage)
    : null;
  const summaryCards = [
    ['Đang trễ', data?.summary.lateCount ?? data?.summary.overdueBeforeTodayCount ?? 0, 'Cần xử lý trước'],
    ['Chưa giao hôm nay', data?.summary.undeliveredTodayCount ?? data?.summary.todayCount ?? 0, 'Trong ngày hiện tại'],
    ['Sắp tới', data?.summary.upcomingCount ?? 0, 'Theo lịch sắp tới'],
    ['Công nợ', data?.summary.deliveredUnpaidCount ?? 0, 'Đã nhận hàng, còn phải thu'],
    ['Hoàn tất', data?.summary.completedCount ?? 0, 'Đã giao và đủ tiền'],
  ] as const;

  return <div className="min-w-0">
    <PageHeader
      title="Đơn hàng"
      description="Theo dõi lịch hẹn, tiến trình giao nhận và thanh toán trên cùng một danh sách."
      actions={<><button type="button" onClick={exportCsv} disabled={!data || loading} className="btn-press inline-flex min-h-11 items-center gap-2 rounded-admin-control border border-admin-border bg-admin-card px-4 text-sm font-semibold hover:bg-admin-muted disabled:opacity-45"><Download size={17} />Xuất danh sách</button>{canManage ? <Link to="/admin/orders/new" state={listState} className="btn-press inline-flex min-h-11 items-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-white"><Plus size={17} />Tạo đơn hàng</Link> : null}</>}
    />

    {successMessage ? <div role="status" className="mb-4 border border-admin-status-success/30 bg-admin-status-success-bg px-4 py-3 text-sm font-semibold text-admin-status-success">{successMessage}</div> : null}
    {liveMessage ? <p role="status" aria-live="polite" className="sr-only">{liveMessage}</p> : null}

    <section className="border-y border-admin-border bg-admin-card px-3 py-3 sm:px-4" aria-label="Bộ lọc đơn hàng">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex gap-1 overflow-x-auto rounded-admin-control bg-admin-muted p-1" role="group" aria-label="Khoảng ngày hẹn">
          {([['all', 'Tất cả'], ['today', 'Hôm nay'], ['tomorrow', 'Ngày mai'], ['3d', '3 ngày'], ['7d', '7 ngày'], ['custom', 'Tùy chọn']] as const).map(([key, label]) => <button key={key} type="button" onClick={() => chooseRange(key)} aria-pressed={range === key} className={`min-h-9 shrink-0 rounded-admin-control px-3 text-sm transition-colors ${range === key ? 'bg-admin-card font-semibold text-admin-primary shadow-admin-panel' : 'text-admin-text-secondary hover:text-admin-text-primary'}`}>{label}</button>)}
        </div>
        <form onSubmit={submitSearch} className="relative w-full xl:max-w-sm"><Search size={17} className="pointer-events-none absolute left-3 top-3.5 text-admin-text-muted" /><input value={searchDraft} onChange={event => setSearchDraft(event.target.value)} aria-label="Tìm đơn hàng" placeholder="Mã đơn, người đặt, SĐT, sản phẩm" className="h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card pl-10 pr-3 text-sm focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/15" /></form>
      </div>

      {range === 'custom' ? <div className="mt-3 grid max-w-xl gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-admin-text-secondary">Từ ngày<input type="date" value={customFrom} onChange={event => { setCustomFrom(event.target.value); setPage(1); syncParams({ from: event.target.value, page: undefined }); }} className="mt-1 h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 text-sm font-normal text-admin-text-primary" /></label><label className="text-xs font-semibold text-admin-text-secondary">Đến ngày<input type="date" value={customTo} onChange={event => { setCustomTo(event.target.value); setPage(1); syncParams({ to: event.target.value, page: undefined }); }} className="mt-1 h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 text-sm font-normal text-admin-text-primary" /></label>{invalidCustomRange ? <p role="alert" className="text-sm font-medium text-admin-status-error sm:col-span-2">Ngày kết thúc không được trước ngày bắt đầu.</p> : null}</div> : null}

      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <label><span className="sr-only">Tiến trình</span><select value={status} onChange={event => updateFilter('stage', event.target.value)} className="h-11 rounded-admin-control border border-admin-input-border bg-admin-card px-3 text-sm"><option value="all">Mọi tiến trình</option><option value={OrderStatus.Created}>Đơn mới</option><option value={OrderStatus.Producing}>Làm hoa</option><option value={OrderStatus.Ready}>Thành phẩm</option><option value={OrderStatus.Shipping}>Đang giao hàng</option><option value={OrderStatus.Delivered}>Công nợ</option><option value={OrderStatus.DeliveryFailed}>Giao chưa thành công</option><option value={OrderStatus.Completed}>Hoàn tất</option><option value={OrderStatus.Cancelled}>Đã hủy</option></select></label>
          <label><span className="sr-only">Thanh toán</span><select value={payment} onChange={event => updateFilter('payment', event.target.value)} className="h-11 rounded-admin-control border border-admin-input-border bg-admin-card px-3 text-sm"><option value="all">Mọi thanh toán</option><option value={PaymentStatus.Unpaid}>Chưa thanh toán</option><option value={PaymentStatus.Deposited}>Chưa thanh toán đủ</option><option value={PaymentStatus.Paid}>Đã thanh toán</option></select></label>
          <label><span className="sr-only">Cách nhận</span><select value={fulfillment} onChange={event => updateFilter('fulfillment', event.target.value)} className="h-11 rounded-admin-control border border-admin-input-border bg-admin-card px-3 text-sm"><option value="all">Mọi cách nhận</option><option value="pickup">Ghé lấy</option><option value="local-delivery">Ship nội thành</option><option value="province-delivery">Ship tỉnh</option></select></label>
        </div>
        <label className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-admin-text-secondary"><input type="checkbox" checked={includeBacklog} onChange={event => { setIncludeBacklog(event.target.checked); setPage(1); syncParams({ backlog: event.target.checked, page: undefined }); }} className="h-4 w-4 rounded border-admin-input-border text-admin-primary" />Kèm đơn trễ hoặc chờ tiền trước kỳ</label>
      </div>
    </section>

    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
      {summaryCards.map(([label, count, detail]) => <article key={label} className="min-w-0 bg-admin-card px-4 py-3 shadow-admin-panel"><p className="text-xs text-admin-text-muted">{label}</p><strong className="mt-1 block text-xl tabular-nums text-admin-text-primary">{loading && !data ? '—' : count}</strong><p className="mt-1 truncate text-xs text-admin-text-muted">{detail}</p></article>)}
    </div>

    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="font-semibold text-admin-text-primary">Danh sách theo ngày hẹn</h2><p className="mt-0.5 text-xs text-admin-text-muted">{data?.totalCount ?? data?.summary.orderCount ?? 0} đơn sau bộ lọc. Tổng đếm không phụ thuộc trang hiện tại.</p></div>
    </div>

    <section className="mt-3 overflow-hidden border border-admin-border bg-admin-card shadow-admin-panel" aria-busy={loading}>
      {loading ? <div className="space-y-px" role="status" aria-label="Đang tải đơn hàng">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-20 animate-pulse bg-admin-muted/70" />)}</div> : error ? <div className="px-5 py-14 text-center" role="alert"><h2 className="font-semibold text-admin-status-error">Không thể tải danh sách đơn</h2><p className="mx-auto mt-2 max-w-lg text-sm text-admin-text-secondary">{error}</p><button type="button" onClick={() => void load()} className="mt-4 min-h-11 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-white">Thử lại</button></div> : !data?.items.length ? <EmptyState onReset={resetFilters} /> : view === 'board' ? <div className="grid gap-px bg-admin-border lg:grid-cols-4">{[
        { title: 'Chờ xác nhận', statuses: [OrderStatus.Created] },
        { title: 'Đã xác nhận', statuses: [OrderStatus.Confirmed] },
        { title: 'Đang chuẩn bị', statuses: [OrderStatus.Producing] },
        { title: 'Sẵn sàng', statuses: [OrderStatus.Ready] },
      ].map(column => { const orders = data.items.filter(order => column.statuses.includes(order.orderStatus)); return <section key={column.title} className="min-w-0 bg-admin-canvas p-3"><header className="flex items-center justify-between gap-3 px-1 pb-3"><h3 className="text-sm font-semibold">{column.title}</h3><span className="text-xs tabular-nums text-admin-text-muted">{orders.length}</span></header><div className="space-y-2">{orders.length ? orders.map(order => <article key={order.id} className="bg-admin-card p-3 shadow-admin-panel"><div className="flex items-start justify-between gap-2"><Link to={`/admin/orders/${order.id}`} state={listState} className="font-semibold text-admin-primary">{order.orderCode}</Link><span className="text-xs tabular-nums text-admin-text-muted">{time(order.deliveryAt)}</span></div><p className="mt-2 line-clamp-2 text-sm font-semibold">{order.productSummary || 'Đơn hoa'}</p><p className="mt-1 truncate text-xs text-admin-text-secondary">{order.ordererName} · {fulfillmentLabel(order)}</p><p className={`mt-2 text-xs font-medium ${order.paymentStatus === PaymentStatus.Paid ? 'text-admin-status-success' : 'text-admin-status-warning'}`}>{order.paymentStatus === PaymentStatus.Paid ? 'Đã thanh toán' : `Còn ${money(order.remainingAmount)}`}</p><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => openDialog(order, 'summary')} className="min-h-10 rounded-admin-control border border-admin-border text-xs font-semibold">Xem tóm tắt</button><Link to={`/admin/orders/${order.id}`} state={listState} className="inline-flex min-h-10 items-center justify-center text-xs font-semibold text-admin-primary">Xem chi tiết</Link></div></article>) : <p className="px-1 py-6 text-center text-xs text-admin-text-muted">Không có đơn</p>}</div></section>; })}</div> : <div>{groups.map(([key, { date, priority, orders }]) => <section key={key} aria-labelledby={`date-${key}`}>
        <header className="flex min-h-11 items-center justify-between gap-3 border-t border-admin-border bg-admin-muted/70 px-4 first:border-t-0"><div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1"><h3 id={`date-${key}`} className="text-xs font-semibold text-admin-text-primary">{date === today ? 'Hôm nay · ' : date === addDays(today, 1) ? 'Ngày mai · ' : ''}{dateText(date)}</h3><span className="text-xs font-semibold text-admin-text-secondary">{priorityLabel[priority]}</span></div><span className="shrink-0 text-xs text-admin-text-muted">{orders.length} đơn</span></header>
        <div className="divide-y divide-admin-border md:hidden">{orders.map(order => <article key={order.id} data-priority={orderPriority(order)} className={`p-4 transition-colors ${orderHighlight(order)}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-baseline gap-2"><strong className="text-lg tabular-nums">{time(order.deliveryAt)}</strong><Link to={`/admin/orders/${order.id}`} state={listState} className="font-semibold text-admin-primary">{order.orderCode}</Link></div><p className="mt-1 line-clamp-2 text-sm font-semibold">{order.productSummary || 'Đơn hoa'}</p></div><OrderStatusBadge status={order.orderStatus} /></div><dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-admin-text-muted">Người đặt</dt><dd className="mt-1 font-semibold">{order.ordererName}</dd><dd className="mt-0.5 text-admin-text-secondary">{order.ordererPhone}</dd><dd className="mt-1 text-admin-text-muted">{order.channelName || 'Chưa rõ kênh'}</dd></div><div><dt className="text-admin-text-muted">Nhận hàng</dt><dd className="mt-1 font-semibold">{fulfillmentLabel(order)}</dd><dd className="mt-0.5 text-admin-text-secondary">{order.pickupAtShop ? 'Tại tiệm Lamie' : order.recipientName || 'Chưa có người nhận'}</dd></div><div><dt className="text-admin-text-muted">Thanh toán</dt><dd className="mt-1 font-semibold tabular-nums">{money(order.totalAmount)}</dd><dd className={`mt-0.5 ${order.paymentStatus === PaymentStatus.Paid ? 'text-admin-status-success' : 'text-admin-status-error'}`}>{order.paymentStatus === PaymentStatus.Paid ? 'Đã thanh toán' : `Còn ${money(order.remainingAmount)}`}</dd></div><div><dt className="text-admin-text-muted">Theo dõi</dt><dd className={`mt-1 font-semibold ${trackingTone(order)}`}>{trackingLabel(order)}</dd>{order.holdReason ? <dd className="mt-0.5 text-admin-status-warning">Tạm dừng: {order.holdReason}</dd> : null}</div></dl><div className="mt-4 flex flex-wrap gap-2">{order.hasCard || order.hasBanner ? <button type="button" onClick={() => openDialog(order, 'extra')} className="inline-flex min-h-10 items-center gap-2 rounded-admin-control border border-admin-border px-3 text-xs font-semibold"><FileText size={15} />{extraLabel(order)}</button> : null}{!order.pickupAtShop && canManage ? <button type="button" onClick={() => openDialog(order, 'shipping')} className="inline-flex min-h-10 items-center gap-2 rounded-admin-control border border-admin-border px-3 text-xs font-semibold"><Truck size={15} />Ship thực tế</button> : null}</div><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => openDialog(order, 'summary')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-admin-control border border-admin-border text-sm font-semibold"><Eye size={16} />Xem tóm tắt</button><Link to={`/admin/orders/${order.id}`} state={listState} className="inline-flex min-h-11 items-center justify-center rounded-admin-control bg-admin-primary px-3 text-sm font-semibold text-white">Xem chi tiết</Link></div></article>)}</div>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[1180px] text-left text-xs"><thead className="border-b border-admin-border bg-admin-card text-admin-text-muted"><tr><th className="px-4 py-3 font-semibold">Đơn / lịch hẹn</th><th className="px-4 py-3 font-semibold">Người đặt / kênh</th><th className="px-4 py-3 font-semibold">Nhận hàng</th><th className="px-4 py-3 font-semibold">Tiến trình</th><th className="px-4 py-3 font-semibold">Thanh toán</th><th className="px-4 py-3 font-semibold">Nội dung thêm</th><th className="px-4 py-3 font-semibold">Thao tác</th></tr></thead><tbody className="divide-y divide-admin-border">{orders.map(order => <tr key={order.id} data-priority={orderPriority(order)} className={`align-top transition-colors ${orderHighlight(order)}`}><td className="px-4 py-3"><div className="flex items-baseline gap-2"><Link to={`/admin/orders/${order.id}`} state={listState} className="font-semibold text-admin-primary">{order.orderCode}</Link><strong className="text-sm tabular-nums">{time(order.deliveryAt)}</strong></div><p className="mt-1 max-w-56 line-clamp-2 text-admin-text-secondary">{order.productSummary || 'Đơn hoa'}</p><p className="mt-1 text-xs text-admin-text-muted">{order.quantityTotal ?? 0} sản phẩm</p></td><td className="px-4 py-3"><p className="font-semibold">{order.ordererName}</p><a href={`tel:${order.ordererPhone}`} className="mt-1 block text-admin-text-secondary hover:text-admin-primary">{order.ordererPhone}</a><p className="mt-1 text-xs text-admin-text-muted">{order.channelName || 'Chưa rõ kênh'}</p></td><td className="px-4 py-3"><p className="inline-flex items-center gap-1.5 font-semibold"><MapPin size={14} />{fulfillmentLabel(order)}</p><p className="mt-1 max-w-48 truncate text-admin-text-secondary">{order.pickupAtShop ? 'Tại tiệm Lamie' : order.recipientName || 'Chưa có người nhận'}</p>{!order.pickupAtShop && canManage ? <button type="button" onClick={() => openDialog(order, 'shipping')} className="mt-1 inline-flex min-h-7 items-center gap-1 text-xs font-semibold text-admin-primary"><Pencil size={12} />Ship thực tế: {order.shippingFeeActual == null ? 'chưa chốt' : money(order.shippingFeeActual)}</button> : null}</td><td className="px-4 py-3"><OrderStatusBadge status={order.orderStatus} /><p className={`mt-2 font-medium ${trackingTone(order)}`}>{trackingLabel(order)}</p>{order.holdReason ? <p className="mt-1 max-w-44 text-admin-status-warning">Tạm dừng: {order.holdReason}</p> : null}</td><td className="px-4 py-3"><strong className="tabular-nums">{money(order.totalAmount)}</strong><div className="mt-2"><PaymentStatusBadge status={order.paymentStatus} /></div>{order.paymentStatus !== PaymentStatus.Paid ? <p className="mt-1 text-admin-status-error">Còn {money(order.remainingAmount)}</p> : null}</td><td className="px-4 py-3">{order.hasCard || order.hasBanner ? <button type="button" onClick={() => openDialog(order, 'extra')} className="inline-flex min-h-9 items-center gap-2 rounded-admin-control border border-admin-border px-3 font-semibold hover:bg-admin-muted" aria-label={`Xem ${extraLabel(order)} của đơn ${order.orderCode}`}><FileText size={15} />{extraLabel(order)}</button> : <span className="text-admin-text-muted">Không kèm</span>}</td><td className="px-4 py-3"><div className="flex min-w-36 flex-col gap-1"><button type="button" onClick={() => openDialog(order, 'summary')} className="inline-flex min-h-9 items-center gap-2 rounded-admin-control border border-admin-border px-3 font-semibold hover:bg-admin-muted"><Eye size={15} />Xem tóm tắt</button><Link to={`/admin/orders/${order.id}`} state={listState} className="inline-flex min-h-9 items-center px-3 font-semibold text-admin-primary">Xem chi tiết</Link></div></td></tr>)}</tbody></table></div>
      </section>)}</div>}
    </section>

    {!loading && !error && data?.items.length ? <nav className="mt-4 flex flex-col gap-3 border-t border-admin-border pt-4 sm:flex-row sm:items-center sm:justify-between" aria-label="Phân trang đơn hàng"><p className="text-xs text-admin-text-muted">Trang {page}/{totalPages} · tối đa {PAGE_SIZE} đơn mỗi trang</p><div className="flex gap-2"><button type="button" onClick={() => { const next = Math.max(1, page - 1); setPage(next); syncParams({ page: next }); }} disabled={page <= 1} className="inline-flex min-h-10 items-center gap-1 rounded-admin-control border border-admin-border px-3 text-sm font-semibold disabled:opacity-40"><ChevronLeft size={16} />Trước</button><button type="button" onClick={() => { const next = Math.min(totalPages, page + 1); setPage(next); syncParams({ page: next }); }} disabled={page >= totalPages} className="inline-flex min-h-10 items-center gap-1 rounded-admin-control border border-admin-border px-3 text-sm font-semibold disabled:opacity-40">Sau<ChevronRight size={16} /></button></div></nav> : null}

    <OrderListDialogs order={dialogOrder} kind={dialogKind} canManage={canManage} onClose={() => { setDialogKind(null); setDialogOrder(null); }} onUpdated={async () => { await load(true); }} />
  </div>;
};
