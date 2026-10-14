import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Flower2,
  RefreshCw,
  WalletCards,
} from '@/shared/icons/lucideAnimated';
import { PageHeader } from '@/shared/components/PageHeader';
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData';
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadges';

const money = (value: number) => new Intl.NumberFormat('vi-VN', {
  style: 'currency', currency: 'VND', maximumFractionDigits: 0,
}).format(value);
const shortMoney = (value: number) => value >= 1_000_000
  ? `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value / 1_000_000)} tr`
  : money(value);
const dateLabel = (value: string, options: Intl.DateTimeFormatOptions = {}) => new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh', ...options,
}).format(new Date(`${value}T00:00:00+07:00`));
const timeLabel = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false,
}).format(new Date(value));

type MetricProps = { label: string; value: string; detail: string; icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>; olive?: boolean; warm?: boolean };
const Metric: React.FC<MetricProps> = ({ label, value, detail, icon: Icon, olive, warm }) => (
  <article className={`min-w-0 rounded-admin-panel border p-[1.125rem] shadow-admin-panel ${olive ? 'border-admin-primary bg-admin-primary text-admin-primary-foreground' : warm ? 'border-admin-border bg-admin-muted' : 'border-admin-border bg-admin-surface'}`}>
    <div className={`flex items-center justify-between gap-3 text-xs ${olive ? 'text-white/75' : 'text-admin-text-secondary'}`}><span>{label}</span><Icon size={17} className="shrink-0" aria-hidden /></div>
    <strong className="mt-3 block text-[1.75rem] font-semibold leading-none tracking-[-0.035em] tabular-nums">{value}</strong>
    <p className={`mt-2 text-[11px] leading-5 ${olive ? 'text-white/70' : 'text-admin-text-muted'}`}>{detail}</p>
  </article>
);

const DashboardSkeleton = () => (
  <div className="space-y-5" role="status" aria-label="Đang tải tổng quan">
    <div className="h-24 animate-pulse rounded-admin-panel bg-admin-muted" />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-admin-panel bg-admin-muted" />)}</div>
    <div className="h-72 animate-pulse rounded-admin-panel bg-admin-muted" />
  </div>
);

export const DashboardPage: React.FC = () => {
  const { data, loading, refreshing, retry } = useDashboardData('7d', true);
  const view = data?.v2;
  const today = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', day: '2-digit', month: 'long',
  }).format(new Date());

  return (
    <div className="min-w-0" aria-busy={loading || refreshing}>
      <PageHeader
        eyebrow={today}
        title="Một ngày mới ở Lamie"
        description="Ưu tiên đơn sắp giao, kiểm soát doanh thu và tiền thực nhận."
        actions={<button type="button" onClick={retry} disabled={loading || refreshing} className="btn-press inline-flex min-h-11 items-center gap-2 rounded-admin-control border border-admin-border bg-admin-surface px-4 text-sm font-semibold hover:bg-admin-muted disabled:opacity-50"><RefreshCw size={17} className={refreshing ? 'animate-spin' : ''} aria-hidden />{refreshing ? 'Đang cập nhật' : 'Làm mới'}</button>}
      />

      {loading ? <DashboardSkeleton /> : null}
      {!loading && !view ? (
        <section className="rounded-admin-panel border border-admin-status-error/30 bg-red-50 p-6" role="alert">
          <h2 className="font-semibold text-admin-status-error">Không thể tải dữ liệu tổng quan V2</h2>
          <p className="mt-1 text-sm text-admin-text-secondary">Không hiển thị số 0 thay cho dữ liệu đang lỗi.</p>
          <button type="button" onClick={retry} className="mt-4 min-h-11 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-white">Thử lại</button>
        </section>
      ) : null}

      {view ? <>
        <section aria-labelledby="upcoming-title">
          <div className="mb-3 mt-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="upcoming-title" className="text-base font-semibold">Lịch giao sắp tới</h2>
            <p className="text-xs text-admin-text-muted">{dateLabel(view.upcoming.from, { day: '2-digit', month: '2-digit' })} – {dateLabel(view.upcoming.to, { day: '2-digit', month: '2-digit', year: 'numeric' })} · Theo ngày giao dự kiến</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Đơn sắp giao" value={`${view.upcoming.orderCount} đơn`} detail={`${view.upcoming.days[0]?.orderCount ?? 0} hôm nay · ${Math.max(0, view.upcoming.orderCount - (view.upcoming.days[0]?.orderCount ?? 0))} trong những ngày tới`} icon={CalendarDays} />
            <Metric label="Cần chú ý" value={`${view.upcoming.attentionCount} đơn`} detail="Đơn trễ giờ hôm nay hoặc còn chờ xác nhận" icon={AlertCircle} warm />
            <Metric label="Giá trị đơn sắp giao" value={shortMoney(view.upcoming.orderValue)} detail="Tiền hoa + ship · Chưa phải doanh thu" icon={Flower2} />
            <Metric label="Còn phải thu" value={shortMoney(view.upcoming.remainingAmount)} detail={`Trên ${view.upcoming.orderCount} đơn sắp giao · Đã thu ${shortMoney(view.upcoming.paidAmount)}`} icon={WalletCards} olive />
          </div>

          <div className="mt-3 grid grid-flow-col auto-cols-[6.25rem] gap-2 overflow-x-auto pb-1 sm:grid-cols-7 sm:auto-cols-auto">
            {view.upcoming.days.map((day, index) => <article key={day.date} className={`rounded-admin-control border px-3 py-3 ${index === 0 ? 'border-admin-primary bg-admin-primary/10' : 'border-admin-border bg-admin-surface'}`}>
              <span className="block text-[10px] text-admin-text-muted">{index === 0 ? 'Hôm nay' : dateLabel(day.date, { weekday: 'long' })}</span>
              <strong className="mt-1.5 block text-base font-semibold tabular-nums">{dateLabel(day.date, { day: '2-digit', month: '2-digit' })}</strong>
              <span className="mt-1.5 block text-[10px] text-admin-text-secondary">{day.orderCount} đơn cần giao</span>
            </article>)}
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
            <section className="overflow-hidden rounded-admin-panel border border-admin-border bg-admin-surface shadow-admin-panel" aria-labelledby="next-orders-title">
              <header className="flex items-start justify-between gap-3 px-5 py-4">
                <div><h3 id="next-orders-title" className="font-semibold">Các đơn tiếp theo</h3><p className="mt-1 text-xs text-admin-text-muted">Hôm nay · Sắp xếp theo giờ giao</p></div>
                <Link to="/admin/orders?range=today" className="inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-admin-primary">Xem đơn hàng <ArrowUpRight size={14} aria-hidden /></Link>
              </header>
              {view.upcoming.nextOrders.length === 0 ? <p className="border-t border-admin-border px-5 py-10 text-center text-sm text-admin-text-muted">Không có đơn cần giao hôm nay.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[40rem] text-left text-xs"><thead className="bg-admin-muted/70 text-[10px] uppercase tracking-wide text-admin-text-muted"><tr><th className="px-4 py-3">Giờ giao</th><th className="px-4 py-3">Đơn hàng / người nhận</th><th className="px-4 py-3">Tiến độ</th><th className="px-4 py-3 text-right">Thanh toán</th></tr></thead><tbody className="divide-y divide-admin-border">{view.upcoming.nextOrders.map(order => <tr key={order.id}><td className="px-4 py-3"><strong className="text-sm tabular-nums">{timeLabel(order.deliveryAt)}</strong></td><td className="px-4 py-3"><strong className="block">{order.recipientName || order.ordererName}</strong><span className="mt-1 block text-admin-text-muted">{order.orderCode} · {order.productSummary || 'Đơn hoa'}</span></td><td className="px-4 py-3"><OrderStatusBadge status={order.orderStatus} /></td><td className="px-4 py-3 text-right"><strong className="block tabular-nums">{money(order.remainingAmount ?? order.totalAmount)}</strong><span className="mt-1 block text-admin-text-muted">Còn phải thu</span></td></tr>)}</tbody></table></div>}
            </section>

            <section className="rounded-admin-panel border border-admin-border bg-admin-surface p-5 shadow-admin-panel" aria-labelledby="actions-title">
              <h3 id="actions-title" className="font-semibold">Việc cần xử lý</h3><p className="mt-1 text-xs text-admin-text-muted">Những việc ảnh hưởng trực tiếp đến lịch giao</p>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-3 border-b border-admin-border pb-3"><span>Đơn cần chú ý trong 7 ngày</span><strong>{view.upcoming.attentionCount} đơn</strong></div>
                <div className="flex justify-between gap-3 border-b border-admin-border pb-3"><span>Còn phải thu đơn giao hôm nay</span><strong>{money(view.upcoming.nextOrders.reduce((sum, order) => sum + (order.remainingAmount ?? 0), 0))}</strong></div>
              </div>
              {view.upcoming.overdueBeforeTodayCount > 0 ? <Link to="/admin/orders?overdue=true" className="mt-4 flex items-start gap-2 rounded-admin-control border border-admin-status-warning/30 bg-admin-status-warning-bg p-3 text-xs font-medium text-admin-status-warning"><AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden /><span>Còn {view.upcoming.overdueBeforeTodayCount} đơn quá hạn trước hôm nay.<br /><span className="underline underline-offset-2">Xem riêng đơn quá hạn →</span></span></Link> : null}
            </section>
          </div>
        </section>

        <section className="mt-6" aria-labelledby="today-finance-title">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><h2 id="today-finance-title" className="text-base font-semibold">Tài chính hôm nay</h2><p className="text-xs text-admin-text-muted">{dateLabel(view.todayFinance.date, { day: '2-digit', month: '2-digit', year: 'numeric' })} · Theo ngày giao và ngày thu / chi</p></div>
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-admin-panel border border-admin-border bg-admin-surface p-5 shadow-admin-panel">
              <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">Doanh thu theo ngày giao</h3><p className="mt-1 text-xs text-admin-text-muted">{view.todayFinance.completedOrderCount} đơn đã hoàn tất · Giao thực tế hôm nay</p></div><Link to={`/admin/reports?tab=revenue&from=${view.todayFinance.date}&to=${view.todayFinance.date}`} className="inline-flex items-center gap-1 text-xs font-semibold text-admin-primary">Báo cáo doanh thu <ArrowUpRight size={14} /></Link></div>
              <p className="my-5 text-[1.75rem] font-semibold tracking-[-0.035em] tabular-nums">{money(view.todayFinance.revenue)}</p>
              <dl className="space-y-3 text-sm"><div className="flex justify-between border-b border-admin-border pb-3"><dt>Tiền hoa</dt><dd className="font-semibold tabular-nums">{money(view.todayFinance.productRevenue)}</dd></div><div className="flex justify-between"><dt>Phí ship thu của khách</dt><dd className="font-semibold tabular-nums">{money(view.todayFinance.shippingRevenue)}</dd></div></dl>
            </article>
            <article className="rounded-admin-panel border border-admin-border bg-admin-surface p-5 shadow-admin-panel">
              <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">Dòng tiền theo ngày thu / chi</h3><p className="mt-1 text-xs text-admin-text-muted">Mỗi lần nhận hoặc trả tiền là một giao dịch</p></div><Link to={`/admin/reports?tab=cash&from=${view.todayFinance.date}&to=${view.todayFinance.date}`} className="inline-flex items-center gap-1 text-xs font-semibold text-admin-primary">Xem dòng tiền <ArrowUpRight size={14} /></Link></div>
              <dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between border-b border-admin-border pb-3"><dt>Tiền vào · Cọc + thu còn lại</dt><dd className="font-semibold tabular-nums">{money(view.todayFinance.cashIn)}</dd></div><div className="flex justify-between border-b border-admin-border pb-3"><dt>Tiền ra · Ship thực tế + chi phí</dt><dd className="font-semibold tabular-nums">{money(view.todayFinance.cashOut)}</dd></div><div className="flex justify-between rounded-admin-control bg-admin-primary/10 p-3"><dt>Dòng tiền thuần hôm nay</dt><dd className="font-semibold tabular-nums">{view.todayFinance.netCash >= 0 ? '+' : ''}{money(view.todayFinance.netCash)}</dd></div></dl>
              {view.todayFinance.incompleteHistoryCount > 0 ? <p className="mt-3 flex items-center gap-2 text-xs text-admin-status-warning"><Clock3 size={14} /> {view.todayFinance.incompleteHistoryCount} bản ghi cũ cần bổ sung ngày thu/chi.</p> : null}
            </article>
          </div>
        </section>
      </> : null}
    </div>
  );
};
