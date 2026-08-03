import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  CalendarClock,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  ShoppingBag,
  StickyNote,
  UserRound,
} from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Permission } from '@/features/auth/permissions';
import { paymentStatusLabel } from '@/features/orders/constants/orderLabels';
import { PaymentStatus } from '@/features/orders/types/order.types';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { customersApi } from '../api/customersApi';
import { CustomerPagination } from '../components/CustomerPagination';
import { CustomerStatusBadge } from '../components/CustomerStatusBadge';
import type { CustomerDetail, CustomerOrderNote } from '../types/customer.types';
import {
  formatCustomerCurrency,
  formatCustomerDate,
  formatCustomerDateTime,
  isCustomerRequestForbidden,
} from '../utils/customerFormatters';

const HISTORY_PAGE_SIZE = 10;

const paymentClass: Record<PaymentStatus, string> = {
  [PaymentStatus.Unpaid]: 'bg-admin-status-warning/12 text-admin-status-warning',
  [PaymentStatus.Deposited]: 'bg-admin-status-info/12 text-admin-status-info',
  [PaymentStatus.Paid]: 'bg-admin-status-success/12 text-admin-status-success',
};

const PaymentBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => (
  <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${paymentClass[status]}`}>
    {paymentStatusLabel[status]}
  </span>
);

const DetailLoading: React.FC = () => (
  <div className="space-y-4" aria-label="Đang tải chi tiết khách hàng" role="status">
    <div className="h-8 w-52 animate-pulse rounded bg-admin-muted" />
    <div className="h-4 w-80 max-w-full animate-pulse rounded bg-admin-muted" />
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-admin-panel border border-admin-border bg-admin-border lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-28 animate-pulse bg-admin-surface p-4">
          <div className="h-3 w-20 rounded bg-admin-muted" />
          <div className="mt-4 h-6 w-28 rounded bg-admin-muted" />
        </div>
      ))}
    </div>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
      <div className="h-64 animate-pulse rounded-admin-panel border border-admin-border bg-admin-surface" />
      <div className="h-64 animate-pulse rounded-admin-panel border border-admin-border bg-admin-surface" />
    </div>
  </div>
);

type DetailStateProps = {
  title: string;
  description: string;
  retry?: () => void;
};

const DetailState: React.FC<DetailStateProps> = ({ title, description, retry }) => (
  <div className="rounded-admin-panel border border-admin-border bg-admin-surface px-5 py-14 text-center" role="alert">
    <UserRound size={28} strokeWidth={1.7} className="mx-auto text-admin-text-muted" aria-hidden="true" />
    <h1 className="mt-4 text-lg font-semibold text-admin-text-primary">{title}</h1>
    <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-admin-text-secondary">{description}</p>
    <div className="mt-5 flex flex-wrap justify-center gap-2">
      {retry ? (
        <button
          type="button"
          onClick={retry}
          className="btn-press min-h-11 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover"
        >
          Thử lại
        </button>
      ) : null}
      <Link
        to="/admin/customers"
        className="inline-flex min-h-11 items-center justify-center rounded-admin-control border border-admin-border bg-admin-surface px-4 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted"
      >
        Về danh sách
      </Link>
    </div>
  </div>
);

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [notes, setNotes] = useState<CustomerOrderNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [notesFailedCount, setNotesFailedCount] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [customerNotes, setCustomerNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaveError, setNotesSaveError] = useState<string | null>(null);

  const loadNotes = useCallback(async (customerId: string) => {
    setNotesLoading(true);
    setNotesError(null);
    setNotesFailedCount(0);
    try {
      const result = await customersApi.getOrderNotes(customerId);
      setNotes(result.items);
      setNotesFailedCount(result.failedCount);
    } catch (requestError) {
      setNotes([]);
      setNotesError(getApiErrorMessage(requestError));
    } finally {
      setNotesLoading(false);
    }
  }, []);

  const loadCustomer = useCallback(
    async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      setPermissionDenied(false);
      setNotes([]);
      setNotesError(null);
      setNotesFailedCount(0);
      try {
        const result = await customersApi.getById(id);
        setCustomer(result);
        setCustomerNotes(result?.notes ?? '');
        setHistoryPage(1);
        if (result) void loadNotes(result.id);
      } catch (requestError) {
        setCustomer(null);
        setPermissionDenied(isCustomerRequestForbidden(requestError));
        setError(getApiErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    },
    [id, loadNotes],
  );

  useEffect(() => {
    void loadCustomer();
  }, [loadCustomer]);

  const historyTotalPages = customer ? Math.max(1, Math.ceil(customer.orders.length / HISTORY_PAGE_SIZE)) : 1;
  const visibleOrders = useMemo(() => {
    if (!customer) return [];
    const start = (historyPage - 1) * HISTORY_PAGE_SIZE;
    return customer.orders.slice(start, start + HISTORY_PAGE_SIZE);
  }, [customer, historyPage]);

  const saveCustomerNotes = async () => {
    if (!id || !customer) return;
    setNotesSaving(true);
    setNotesSaveError(null);
    try {
      const updated = await customersApi.updateNotes(id, customerNotes);
      setCustomer(updated);
      setCustomerNotes(updated.notes ?? '');
    } catch (requestError) {
      setNotesSaveError(getApiErrorMessage(requestError));
    } finally {
      setNotesSaving(false);
    }
  };

  if (loading) return <DetailLoading />;

  if (permissionDenied) {
    return (
      <DetailState
        title="Bạn không có quyền xem khách hàng này"
        description="Tài khoản hiện tại không được API cấp quyền đọc dữ liệu đơn dùng để tổng hợp hồ sơ khách hàng."
      />
    );
  }

  if (error) {
    return (
      <DetailState
        title="Không thể tải chi tiết khách hàng"
        description={error}
        retry={() => void loadCustomer()}
      />
    );
  }

  if (!customer) {
    return (
      <DetailState
        title="Không tìm thấy khách hàng"
        description="Hồ sơ có thể đã thay đổi khi dữ liệu đơn được cập nhật. Hãy quay lại danh sách và thử lại."
      />
    );
  }

  return (
    <div>
      <Link
        to="/admin/customers"
        className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-admin-control text-sm font-medium text-admin-text-secondary transition-colors hover:text-admin-primary"
      >
        <ArrowLeft size={17} strokeWidth={1.8} aria-hidden="true" />
        Danh sách khách hàng
      </Link>

      <PageHeader
        title={customer.name}
        description="Hồ sơ được tổng hợp từ các đơn có cùng số điện thoại người đặt."
        actions={
          <a
            href={`tel:${customer.phone}`}
            className="btn-press inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover sm:w-auto"
            aria-label={`Gọi ${customer.name} theo số ${customer.phone}`}
          >
            <Phone size={16} strokeWidth={1.8} aria-hidden="true" />
            Gọi khách hàng
          </a>
        }
      />

      <section
        className="grid grid-cols-2 gap-px overflow-hidden rounded-admin-panel border border-admin-border bg-admin-border lg:grid-cols-4"
        aria-label="Chỉ số mua hàng"
      >
        <div className="bg-admin-surface p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-admin-text-secondary">
            <ShoppingBag size={16} strokeWidth={1.8} aria-hidden="true" />
            Tổng số đơn
          </div>
          <p className="mt-2 text-xl font-semibold tabular-nums text-admin-text-primary">{customer.orderCount}</p>
        </div>
        <div className="bg-admin-surface p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-admin-text-secondary">
            <CheckCircle2 size={16} strokeWidth={1.8} aria-hidden="true" />
            Đơn đã thanh toán
          </div>
          <p className="mt-2 text-xl font-semibold tabular-nums text-admin-text-primary">{customer.paidOrderCount}</p>
        </div>
        <div className="bg-admin-surface p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-admin-text-secondary">
            <Banknote size={16} strokeWidth={1.8} aria-hidden="true" />
            Tổng chi tiêu
          </div>
          <p className="mt-2 text-lg font-semibold tabular-nums text-admin-text-primary sm:text-xl">
            {formatCustomerCurrency(customer.totalSpent)}
          </p>
        </div>
        <div className="bg-admin-surface p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-admin-text-secondary">
            <CalendarClock size={16} strokeWidth={1.8} aria-hidden="true" />
            Lần mua gần nhất
          </div>
          <p className="mt-2 text-sm font-semibold text-admin-text-primary sm:text-base">
            {formatCustomerDate(customer.lastPurchaseAt)}
          </p>
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="space-y-4">
          <section className="rounded-admin-panel border border-admin-border bg-admin-surface p-5" aria-labelledby="customer-contact-title">
            <h2 id="customer-contact-title" className="text-base font-semibold text-admin-text-primary">Thông tin liên hệ</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="flex items-center gap-2 text-xs font-medium text-admin-text-muted">
                  <UserRound size={15} strokeWidth={1.8} aria-hidden="true" />
                  Họ tên
                </dt>
                <dd className="mt-1.5 break-words font-medium text-admin-text-primary">{customer.name}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-xs font-medium text-admin-text-muted">
                  <Phone size={15} strokeWidth={1.8} aria-hidden="true" />
                  Số điện thoại
                </dt>
                <dd className="mt-1.5">
                  <a
                    href={`tel:${customer.phone}`}
                    className="inline-block break-all font-medium text-admin-primary hover:underline"
                    aria-label={`Gọi ${customer.name} theo số ${customer.phone}`}
                    dir="ltr"
                  >
                    {customer.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-xs font-medium text-admin-text-muted">
                  <Mail size={15} strokeWidth={1.8} aria-hidden="true" />
                  Email
                </dt>
                <dd className="mt-1.5 break-all text-admin-text-secondary">
                  {customer.email ? (
                    <a href={`mailto:${customer.email}`} className="font-medium text-admin-primary hover:underline">
                      {customer.email}
                    </a>
                  ) : 'Chưa có email'}
                </dd>
              </div>
            </dl>
            <div className="mt-5 flex gap-2 border-t border-admin-border pt-4 text-xs leading-5 text-admin-text-muted">
              <ShieldCheck size={16} strokeWidth={1.8} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>Không sao chép thông tin liên hệ ra ngoài quy trình xử lý đơn và chăm sóc khách hàng.</p>
            </div>
          </section>

          <section className="rounded-admin-panel border border-admin-border bg-admin-surface p-5" aria-labelledby="customer-crm-notes-title">
            <h2 id="customer-crm-notes-title" className="text-base font-semibold text-admin-text-primary">Ghi chú khách hàng</h2>
            {hasPermission(Permission.CustomersManage) ? (
              <div className="mt-4">
                <textarea
                  value={customerNotes}
                  onChange={(event) => setCustomerNotes(event.target.value)}
                  rows={5}
                  maxLength={4000}
                  className="w-full resize-y rounded-admin-control border border-admin-border bg-admin-surface px-3 py-2 text-sm text-admin-text-primary outline-none transition-colors focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/15"
                  placeholder="Thông tin chăm sóc nội bộ"
                  aria-label="Ghi chú nội bộ của khách hàng"
                />
                {notesSaveError ? <p className="mt-2 text-xs text-admin-status-error" role="alert">{notesSaveError}</p> : null}
                <button
                  type="button"
                  onClick={() => void saveCustomerNotes()}
                  disabled={notesSaving || customerNotes === (customer.notes ?? '')}
                  className="btn-press mt-3 min-h-10 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {notesSaving ? 'Đang lưu…' : 'Lưu ghi chú'}
                </button>
              </div>
            ) : (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-admin-text-secondary">
                {customer.notes || 'Chưa có ghi chú nội bộ.'}
              </p>
            )}
          </section>

          <section className="rounded-admin-panel border border-admin-border bg-admin-surface p-5" aria-labelledby="customer-address-title">
            <h2 id="customer-address-title" className="text-base font-semibold text-admin-text-primary">Địa chỉ giao gần đây</h2>
            {customer.addresses.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-admin-text-secondary">Chưa có địa chỉ giao tận nơi trong lịch sử đơn.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {customer.addresses.map((address) => (
                  <li key={`${address.orderId}-${address.address}`} className="flex gap-3 text-sm">
                    <MapPin size={17} strokeWidth={1.8} className="mt-0.5 shrink-0 text-admin-text-muted" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="break-words leading-6 text-admin-text-primary">{address.address}</p>
                      <Link
                        to={`/admin/orders/${address.orderId}`}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-admin-primary hover:underline"
                        aria-label={`Xem đơn ${address.orderCode} giao đến địa chỉ này`}
                      >
                        {address.orderCode}, {formatCustomerDate(address.deliveryAt)}
                        <ArrowUpRight size={13} strokeWidth={1.8} aria-hidden="true" />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="rounded-admin-panel border border-admin-border bg-admin-surface p-5" aria-labelledby="customer-notes-title">
          <div className="flex items-center gap-2">
            <StickyNote size={18} strokeWidth={1.8} className="text-admin-text-muted" aria-hidden="true" />
            <h2 id="customer-notes-title" className="text-base font-semibold text-admin-text-primary">Ghi chú từ đơn hàng</h2>
          </div>
          <p className="mt-1.5 text-xs leading-5 text-admin-text-muted">
            Chỉ hiển thị nội dung và mô tả đã lưu trong từng đơn; ghi chú nội bộ được quản lý riêng trong hồ sơ.
          </p>

          {notesLoading ? (
            <div className="mt-5 space-y-3" role="status" aria-label="Đang tải ghi chú từ đơn hàng">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="animate-pulse border-t border-admin-border pt-4 first:border-0 first:pt-0">
                  <div className="h-3 w-28 rounded bg-admin-muted" />
                  <div className="mt-3 h-4 w-full rounded bg-admin-muted" />
                  <div className="mt-2 h-4 w-4/5 rounded bg-admin-muted" />
                </div>
              ))}
            </div>
          ) : notesError ? (
            <div className="mt-5 rounded-admin-control border border-admin-status-error/25 bg-admin-status-error/8 p-4 text-sm text-admin-status-error" role="alert">
              <p>{notesError}</p>
              <button
                type="button"
                onClick={() => void loadNotes(customer.id)}
                className="mt-3 min-h-11 rounded-admin-control border border-admin-status-error/30 px-3 font-semibold transition-colors hover:bg-admin-status-error/8"
              >
                Tải lại ghi chú
              </button>
            </div>
          ) : notes.length === 0 ? (
            <p className="mt-5 rounded-admin-control bg-admin-muted/65 px-4 py-5 text-sm leading-6 text-admin-text-secondary" role="status">
              Chưa có nội dung hoặc mô tả đáng chú ý trong các đơn của khách hàng này.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {notes.map((note) => (
                <li key={note.id} className="border-t border-admin-border pt-4 first:border-0 first:pt-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-admin-text-muted">
                    <span>{note.label}</span>
                    <Link
                      to={`/admin/orders/${note.orderId}`}
                      className="font-medium text-admin-primary hover:underline"
                      aria-label={`Xem đơn ${note.orderCode} có ghi chú này`}
                    >
                      {note.orderCode}
                    </Link>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-admin-text-primary">{note.content}</p>
                </li>
              ))}
            </ul>
          )}

          {notesFailedCount > 0 ? (
            <div className="mt-5 rounded-admin-control border border-admin-status-warning/30 bg-admin-status-warning/8 p-4 text-sm text-admin-status-warning" role="alert">
              <p>Không tải được ghi chú của {notesFailedCount} đơn. Các ghi chú hiển thị có thể chưa đầy đủ.</p>
              <button
                type="button"
                onClick={() => void loadNotes(customer.id)}
                className="mt-3 min-h-11 rounded-admin-control border border-admin-status-warning/35 px-3 font-semibold transition-colors hover:bg-admin-status-warning/8"
              >
                Thử tải lại
              </button>
            </div>
          ) : null}
        </section>
      </div>

      <section className="mt-4 overflow-hidden rounded-admin-panel border border-admin-border bg-admin-surface" aria-labelledby="customer-history-title">
        <div className="border-b border-admin-border px-4 py-4 sm:px-5">
          <h2 id="customer-history-title" className="text-base font-semibold text-admin-text-primary">Lịch sử mua hàng</h2>
          <p className="mt-1 text-xs text-admin-text-muted">Sắp xếp theo đơn mới nhất.</p>
        </div>

        <div className="space-y-3 p-3 md:hidden">
          {visibleOrders.map((order) => (
            <article key={order.id} className="rounded-admin-panel border border-admin-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link to={`/admin/orders/${order.id}`} className="font-semibold text-admin-primary hover:underline">
                    {order.orderCode}
                  </Link>
                  <p className="mt-1 text-xs text-admin-text-muted">{formatCustomerDateTime(order.createdAt)}</p>
                </div>
                <CustomerStatusBadge status={order.orderStatus} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-admin-text-muted">Người nhận</dt>
                  <dd className="mt-1 break-words text-admin-text-primary">{order.recipientName}</dd>
                </div>
                <div className="text-right">
                  <dt className="text-xs text-admin-text-muted">Tổng đơn</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-admin-text-primary">
                    {formatCustomerCurrency(order.totalAmount)}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="sr-only">Trạng thái thanh toán</dt>
                  <dd><PaymentBadge status={order.paymentStatus} /></dd>
                </div>
              </dl>
              <Link
                to={`/admin/orders/${order.id}`}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-admin-control border border-admin-border text-sm font-semibold text-admin-text-primary transition-colors hover:border-admin-primary/45 hover:bg-admin-primary/5 hover:text-admin-primary"
                aria-label={`Xem chi tiết đơn ${order.orderCode}`}
              >
                Xem đơn
                <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[860px] text-left text-sm">
            <caption className="sr-only">Lịch sử đơn của khách hàng {customer.name}</caption>
            <thead className="border-b border-admin-border bg-admin-muted/55 text-xs text-admin-text-secondary">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Mã đơn</th>
                <th scope="col" className="px-4 py-3 font-semibold">Ngày tạo</th>
                <th scope="col" className="px-4 py-3 font-semibold">Người nhận</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Tổng đơn</th>
                <th scope="col" className="px-4 py-3 font-semibold">Thanh toán</th>
                <th scope="col" className="px-4 py-3 font-semibold">Trạng thái</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {visibleOrders.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-admin-muted/45">
                  <th scope="row" className="px-4 py-3.5 font-normal">
                    <Link to={`/admin/orders/${order.id}`} className="font-semibold text-admin-primary hover:underline">
                      {order.orderCode}
                    </Link>
                  </th>
                  <td className="whitespace-nowrap px-4 py-3.5 text-admin-text-secondary">{formatCustomerDateTime(order.createdAt)}</td>
                  <td className="max-w-52 break-words px-4 py-3.5 text-admin-text-primary">{order.recipientName}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold tabular-nums text-admin-text-primary">
                    {formatCustomerCurrency(order.totalAmount)}
                  </td>
                  <td className="px-4 py-3.5"><PaymentBadge status={order.paymentStatus} /></td>
                  <td className="px-4 py-3.5"><CustomerStatusBadge status={order.orderStatus} /></td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-admin-control px-3 font-semibold text-admin-primary transition-colors hover:bg-admin-primary/8"
                      aria-label={`Xem chi tiết đơn ${order.orderCode}`}
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
          page={historyPage}
          pageSize={HISTORY_PAGE_SIZE}
          totalItems={customer.orders.length}
          totalPages={historyTotalPages}
          label="Phân trang lịch sử mua hàng"
          onPageChange={setHistoryPage}
        />
      </section>
    </div>
  );
};
