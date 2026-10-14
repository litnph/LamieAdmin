import React, { useCallback, useState } from 'react';
import { CalendarRange, Download, Filter, RefreshCw, X } from '@/shared/icons/lucideAnimated';
import type { ReportFilters, ReportTab } from '../types/reporting.types';
import { useDialogFocus } from '../hooks/useDialogFocus';

export const reportTabs: Array<{ id: ReportTab; label: string; basis: string }> = [
  { id: 'overview', label: 'Tổng quan', basis: 'Ngày khách nhận hoa / ngày giao dịch / ngày phát sinh theo từng chỉ số' },
  { id: 'performance', label: 'Doanh thu & lợi nhuận', basis: 'Ngày khách nhận hoa' },
  { id: 'cashflow', label: 'Dòng tiền', basis: 'Ngày thanh toán' },
  { id: 'expenses', label: 'Chi phí', basis: 'Ngày phát sinh' },
  { id: 'receivables', label: 'Cọc & công nợ', basis: 'Tình trạng tại cuối ngày báo cáo' },
];

type Props = {
  filters: ReportFilters;
  onChange: (next: ReportFilters) => void;
  onReset: () => void;
  onExport: (kind: 'csv' | 'xlsx') => void;
  loading: boolean;
  channels: string[];
  categories: Array<{ id: string; name: string }>;
};

const fieldClass = 'min-h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-surface px-3 text-sm text-admin-text-primary transition-colors focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/15';

const presetRange = (preset: string, anchor: string): { from: string; to: string } => {
  const toDate = new Date(`${anchor}T00:00:00Z`);
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  const add = (days: number) => new Date(toDate.getTime() + days * 86_400_000);
  if (preset === 'today') return { from: anchor, to: anchor };
  if (preset === '7d') return { from: iso(add(-6)), to: anchor };
  if (preset === '30d') return { from: iso(add(-29)), to: anchor };
  if (preset === 'month') return { from: `${anchor.slice(0, 8)}01`, to: anchor };
  if (preset === 'previous-month') {
    const first = new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth() - 1, 1));
    const last = new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), 0));
    return { from: iso(first), to: iso(last) };
  }
  if (preset === 'quarter') {
    const month = Math.floor(toDate.getUTCMonth() / 3) * 3;
    return { from: iso(new Date(Date.UTC(toDate.getUTCFullYear(), month, 1))), to: anchor };
  }
  return { from: `${anchor.slice(0, 4)}-01-01`, to: anchor };
};

export const ReportTabs: React.FC<{ active: ReportTab; onChange: (tab: ReportTab) => void }> = ({ active, onChange }) => (
  <div className="mb-5 overflow-x-auto border-b border-admin-border [scrollbar-width:none]" aria-label="Các báo cáo tài chính">
    <div className="flex min-w-max gap-1" role="tablist">
      {reportTabs.map((tab, index) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          tabIndex={active === tab.id ? 0 : -1}
          onKeyDown={(event) => {
            const offsets: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
            if (event.key === 'Home' || event.key === 'End' || event.key in offsets) {
              event.preventDefault();
              const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? reportTabs.length - 1 : (index + offsets[event.key] + reportTabs.length) % reportTabs.length;
              const next = reportTabs[nextIndex];
              onChange(next.id);
              requestAnimationFrame(() => document.querySelectorAll<HTMLElement>('[role="tab"]')[nextIndex]?.focus());
            }
          }}
          onClick={() => onChange(tab.id)}
          className={`min-h-11 border-b-2 px-3.5 text-sm font-semibold transition-colors ${active === tab.id ? 'border-admin-primary text-admin-primary' : 'border-transparent text-admin-text-secondary hover:border-admin-border hover:text-admin-text-primary'}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  </div>
);

export const ReportToolbar: React.FC<Props> = ({ filters, onChange, onReset, onExport, loading, channels, categories }) => {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const closeAdvanced = useCallback(() => setAdvancedOpen(false), []);
  const dialogRef = useDialogFocus<HTMLElement>(advancedOpen, closeAdvanced);
  const basis = reportTabs.find((tab) => tab.id === filters.tab)?.basis ?? '';
  const update = <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => onChange({ ...filters, [key]: value });
  const activeAdvanced = [filters.orderStatus, filters.paymentStatus, filters.paymentMethod, filters.expenseCategory, filters.channel].filter((value) => value !== 'all').length;

  return (
    <section className="mb-6 border-y border-admin-border bg-admin-surface" aria-label="Bộ lọc báo cáo">
      <div className="flex flex-col gap-3 px-3 py-3 sm:px-4">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[repeat(4,minmax(9rem,1fr))_11rem]">
          <label className="hidden text-xs font-semibold text-admin-text-secondary sm:block">
            Từ ngày
            <input aria-label="Từ ngày" type="date" value={filters.from} max={filters.to} onChange={(event) => update('from', event.target.value)} className={`${fieldClass} mt-1.5`} />
          </label>
          <label className="hidden text-xs font-semibold text-admin-text-secondary sm:block">
            Đến ngày
            <input aria-label="Đến ngày" type="date" value={filters.to} min={filters.from} onChange={(event) => update('to', event.target.value)} className={`${fieldClass} mt-1.5`} />
          </label>
          <label className="text-xs font-semibold text-admin-text-secondary">
            Chọn nhanh
            <select aria-label="Khoảng ngày nhanh" defaultValue="month" onChange={(event) => onChange({ ...filters, ...presetRange(event.target.value, '2026-09-15') })} className={`${fieldClass} mt-1.5`}>
              <option value="today">Hôm nay</option><option value="7d">7 ngày</option><option value="30d">30 ngày</option>
              <option value="month">Tháng này</option><option value="previous-month">Tháng trước</option>
              <option value="quarter">Quý này</option><option value="year">Năm nay</option>
            </select>
          </label>
          <label className="hidden text-xs font-semibold text-admin-text-secondary sm:block">
            Nhóm dữ liệu
            <select aria-label="Nhóm dữ liệu" value={filters.groupBy} onChange={(event) => update('groupBy', event.target.value as ReportFilters['groupBy'])} className={`${fieldClass} mt-1.5`}>
              <option value="day">Theo ngày</option><option value="week">Theo tuần</option><option value="month">Theo tháng</option>
            </select>
          </label>
          <label className="hidden min-h-11 items-center gap-2.5 self-end rounded-admin-control px-1 text-sm font-medium text-admin-text-primary sm:flex">
            <input type="checkbox" checked={filters.compare} onChange={(event) => update('compare', event.target.checked)} className="h-4 w-4 rounded border-admin-input-border text-admin-primary focus:ring-admin-primary/25" />
            So với kỳ trước
          </label>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => setAdvancedOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-admin-control border border-admin-border bg-admin-surface px-3 text-sm font-semibold text-admin-text-primary hover:bg-admin-muted">
            <Filter size={16} aria-hidden="true" /> Bộ lọc {activeAdvanced ? `(${activeAdvanced})` : ''}
          </button>
          <button type="button" onClick={onReset} className="inline-flex min-h-11 items-center gap-2 rounded-admin-control px-3 text-sm font-semibold text-admin-text-secondary hover:bg-admin-muted">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden="true" /> Xóa bộ lọc
          </button>
          <div className="inline-flex overflow-hidden rounded-admin-control border border-admin-border" aria-label="Xuất báo cáo">
            <button type="button" onClick={() => onExport('csv')} className="min-h-11 px-3 text-sm font-semibold text-admin-text-primary hover:bg-admin-muted">CSV</button>
            <button type="button" onClick={() => onExport('xlsx')} className="inline-flex min-h-11 items-center gap-1.5 border-l border-admin-border px-3 text-sm font-semibold text-admin-text-primary hover:bg-admin-muted"><Download size={15} aria-hidden="true" /> Excel (.xls)</button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-admin-border px-3 py-2 text-xs text-admin-text-secondary sm:px-4">
        <CalendarRange size={15} className="shrink-0 text-admin-primary" aria-hidden="true" />
        <span>Cơ sở thời gian: <strong className="font-semibold text-admin-text-primary">{basis}</strong></span>
      </div>

      {advancedOpen ? (
        <div className="fixed inset-0 z-admin-modal flex items-end justify-end bg-[#292623]/35 lg:items-stretch" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setAdvancedOpen(false); }}>
          <aside ref={dialogRef} tabIndex={-1} className="max-h-[88dvh] w-full overflow-y-auto rounded-t-admin-panel bg-admin-surface p-5 shadow-admin-popover lg:max-h-none lg:w-[25rem] lg:rounded-none" role="dialog" aria-modal="true" aria-labelledby="advanced-filter-title">
            <div className="flex items-center justify-between gap-3">
              <div><h2 id="advanced-filter-title" className="text-lg font-semibold text-admin-text-primary">Bộ lọc nâng cao</h2><p className="mt-1 text-xs text-admin-text-secondary">Áp dụng ngay cho số liệu và bảng đang xem.</p></div>
              <button type="button" aria-label="Đóng bộ lọc" onClick={closeAdvanced} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-admin-control text-admin-text-secondary hover:bg-admin-muted"><X size={19} /></button>
            </div>
            <div className="mt-6 space-y-5">
              <div className="space-y-4 border-b border-admin-border pb-5 sm:hidden">
                <p className="text-sm font-semibold text-admin-text-primary">Khoảng thời gian</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-admin-text-secondary">Từ ngày<input type="date" value={filters.from} max={filters.to} onChange={(event) => update('from', event.target.value)} className={`${fieldClass} mt-2`} /></label>
                  <label className="text-xs font-semibold text-admin-text-secondary">Đến ngày<input type="date" value={filters.to} min={filters.from} onChange={(event) => update('to', event.target.value)} className={`${fieldClass} mt-2`} /></label>
                </div>
                <label className="block text-xs font-semibold text-admin-text-secondary">Nhóm dữ liệu<select value={filters.groupBy} onChange={(event) => update('groupBy', event.target.value as ReportFilters['groupBy'])} className={`${fieldClass} mt-2`}><option value="day">Theo ngày</option><option value="week">Theo tuần</option><option value="month">Theo tháng</option></select></label>
                <label className="flex min-h-11 items-center gap-2.5 text-sm font-medium text-admin-text-primary"><input type="checkbox" checked={filters.compare} onChange={(event) => update('compare', event.target.checked)} className="h-4 w-4 rounded border-admin-input-border text-admin-primary" />So với kỳ trước</label>
              </div>
              <label className="block text-sm font-semibold text-admin-text-primary">Trạng thái đơn
                <select value={filters.orderStatus} onChange={(event) => update('orderStatus', event.target.value as ReportFilters['orderStatus'])} className={`${fieldClass} mt-2`}><option value="all">Tất cả</option><option value="created">Mới tạo</option><option value="producing">Đang làm</option><option value="shipping">Đang giao</option><option value="completed">Hoàn tất</option><option value="cancelled">Đã hủy</option></select>
              </label>
              <label className="block text-sm font-semibold text-admin-text-primary">Trạng thái thanh toán
                <select value={filters.paymentStatus} onChange={(event) => update('paymentStatus', event.target.value as ReportFilters['paymentStatus'])} className={`${fieldClass} mt-2`}><option value="all">Tất cả</option><option value="unpaid">Chưa thanh toán</option><option value="deposited">Đã cọc</option><option value="paid">Đã thanh toán đủ</option><option value="overpaid">Thanh toán dư</option><option value="refunded">Đã hoàn</option></select>
              </label>
              <label className="block text-sm font-semibold text-admin-text-primary">Phương thức
                <select value={filters.paymentMethod} onChange={(event) => update('paymentMethod', event.target.value as ReportFilters['paymentMethod'])} className={`${fieldClass} mt-2`}><option value="all">Tất cả</option><option value="cash">Tiền mặt</option><option value="bank_transfer">Chuyển khoản</option><option value="card">Thẻ</option><option value="other">Khác</option></select>
              </label>
              <label className="block text-sm font-semibold text-admin-text-primary">Danh mục chi phí
                <select value={filters.expenseCategory} onChange={(event) => update('expenseCategory', event.target.value)} className={`${fieldClass} mt-2`}><option value="all">Tất cả</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
              </label>
              <label className="block text-sm font-semibold text-admin-text-primary">Kênh bán hàng
                <select value={filters.channel} onChange={(event) => update('channel', event.target.value)} className={`${fieldClass} mt-2`}><option value="all">Tất cả</option>{channels.map((channel) => <option key={channel}>{channel}</option>)}</select>
              </label>
            </div>
            <div className="sticky bottom-0 mt-7 flex gap-2 bg-admin-surface pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
              <button type="button" onClick={() => { onReset(); setAdvancedOpen(false); }} className="min-h-11 flex-1 rounded-admin-control border border-admin-border px-4 text-sm font-semibold text-admin-text-primary">Xóa bộ lọc</button>
              <button type="button" onClick={closeAdvanced} className="min-h-11 flex-1 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground">Xem kết quả</button>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
};
