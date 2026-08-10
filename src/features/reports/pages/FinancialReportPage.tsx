import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  FileDown,
  Printer,
  RefreshCw,
  Scale,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import {
  firstDayOfMonth,
  formatExpenseCurrency,
  formatExpenseDate,
  localDateInputValue,
} from '@/features/expenses/utils/expenseFormatters';
import { reportsApi } from '../api/reportsApi';
import { FinancialReportChart } from '../components/FinancialReportChart';
import type {
  FinancialReport,
  FinancialReportParams,
} from '../types/financialReport.types';

const fieldClass =
  'h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 text-sm text-admin-text-primary focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text';

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: 'default' | 'positive' | 'negative';
};

const MetricCard: React.FC<MetricCardProps> = ({ label, value, detail, icon: Icon, tone = 'default' }) => {
  const toneClass = tone === 'positive'
    ? 'text-admin-status-success'
    : tone === 'negative'
      ? 'text-admin-status-error'
      : 'text-admin-primary';

  return (
    <article className="rounded-admin-panel border border-admin-border bg-admin-surface p-4 shadow-admin-panel sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-admin-text-muted">{label}</p>
        <Icon size={18} strokeWidth={1.8} className={toneClass} aria-hidden="true" />
      </div>
      <p className={`mt-3 text-xl font-semibold tabular-nums tracking-[-0.02em] sm:text-2xl ${tone === 'default' ? 'text-admin-text-primary' : toneClass}`}>
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-admin-text-secondary">{detail}</p>
    </article>
  );
};

const percentLabel = (value: number | null): string => (
  value === null
    ? 'Không xác định'
    : `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value)}%`
);

export const FinancialReportPage: React.FC = () => {
  const today = useMemo(() => localDateInputValue(), []);
  const initialParams = useMemo<FinancialReportParams>(() => ({
    from: firstDayOfMonth(today),
    to: today,
    groupBy: 'auto',
  }), [today]);
  const [draft, setDraft] = useState<FinancialReportParams>(initialParams);
  const [params, setParams] = useState<FinancialReportParams>(initialParams);
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'excel' | 'print' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReport(await reportsApi.financial(params));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const applyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    setExportError(null);
    if (!draft.from || !draft.to || draft.from > draft.to) {
      setError('Khoảng ngày báo cáo chưa hợp lệ.');
      return;
    }
    setParams({ ...draft });
  };

  const resetFilters = () => {
    setDraft(initialParams);
    setParams(initialParams);
    setError(null);
    setExportError(null);
  };

  const exportExcel = async () => {
    setExporting('excel');
    setExportError(null);
    try {
      await reportsApi.downloadExcel(params);
    } catch (requestError) {
      setExportError(getApiErrorMessage(requestError));
    } finally {
      setExporting(null);
    }
  };

  const openPrintable = async () => {
    setExporting('print');
    setExportError(null);
    try {
      await reportsApi.openPrintable(params);
    } catch (requestError) {
      setExportError(getApiErrorMessage(requestError));
    } finally {
      setExporting(null);
    }
  };

  const profitTone: MetricCardProps['tone'] = (report?.profit ?? 0) < 0 ? 'negative' : 'positive';
  const periodLabel = report
    ? `${formatExpenseDate(report.period.from)} - ${formatExpenseDate(report.period.to)}`
    : `${formatExpenseDate(params.from)} - ${formatExpenseDate(params.to)}`;

  return (
    <div className="min-w-0">
      <PageHeader
        title="Báo cáo tài chính"
        description="Doanh thu theo ngày giao hàng; chi phí theo ngày ghi nhận trong cùng kỳ."
        actions={
          <>
            <button
              type="button"
              onClick={() => void exportExcel()}
              disabled={!report || loading || exporting !== null}
              className="btn-press inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-admin-control border border-admin-border bg-admin-surface px-4 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              <FileDown size={17} strokeWidth={1.8} aria-hidden="true" />
              {exporting === 'excel' ? 'Đang xuất...' : 'Xuất Excel'}
            </button>
            <button
              type="button"
              onClick={() => void openPrintable()}
              disabled={!report || loading || exporting !== null}
              className="btn-press inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              <Printer size={17} strokeWidth={1.8} aria-hidden="true" />
              {exporting === 'print' ? 'Đang tạo...' : 'In / Lưu PDF'}
            </button>
          </>
        }
      />

      {exportError ? (
        <div className="mb-5 rounded-admin-control border border-admin-status-error/30 bg-red-50 px-4 py-3 text-sm text-admin-status-error" role="alert">
          {exportError}
        </div>
      ) : null}

      <form
        onSubmit={applyFilters}
        className="mb-6 grid gap-3 rounded-admin-panel border border-admin-border bg-admin-surface p-4 shadow-admin-panel sm:grid-cols-2 xl:grid-cols-[minmax(10rem,1fr)_minmax(10rem,1fr)_minmax(11rem,0.8fr)_auto]"
        aria-label="Bộ lọc báo cáo tài chính"
      >
        <div>
          <label htmlFor="report-from" className="mb-1.5 block text-xs font-medium text-admin-text-secondary">Từ ngày giao</label>
          <input
            id="report-from"
            type="date"
            value={draft.from}
            max={draft.to || undefined}
            onChange={(event) => setDraft((current) => ({ ...current, from: event.target.value }))}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="report-to" className="mb-1.5 block text-xs font-medium text-admin-text-secondary">Đến ngày giao</label>
          <input
            id="report-to"
            type="date"
            value={draft.to}
            min={draft.from || undefined}
            onChange={(event) => setDraft((current) => ({ ...current, to: event.target.value }))}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="report-group" className="mb-1.5 block text-xs font-medium text-admin-text-secondary">Nhóm dữ liệu</label>
          <select
            id="report-group"
            value={draft.groupBy}
            onChange={(event) => setDraft((current) => ({
              ...current,
              groupBy: event.target.value as FinancialReportParams['groupBy'],
            }))}
            className={fieldClass}
          >
            <option value="auto">Tự động</option>
            <option value="day">Theo ngày</option>
            <option value="month">Theo tháng</option>
          </select>
        </div>
        <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-1">
          <button
            type="submit"
            disabled={loading}
            className="btn-press inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={16} strokeWidth={1.8} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
            Xem báo cáo
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex min-h-11 items-center justify-center rounded-admin-control border border-admin-border bg-admin-surface px-3 text-sm font-medium text-admin-text-secondary hover:bg-admin-muted"
          >
            Đặt lại
          </button>
        </div>
      </form>

      {error ? (
        <div className="mb-6 rounded-admin-control border border-admin-status-error/30 bg-red-50 px-4 py-3 text-sm text-admin-status-error" role="alert">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <button type="button" onClick={() => void loadReport()} className="font-semibold underline underline-offset-2">Thử lại</button>
          </div>
        </div>
      ) : null}

      <section aria-labelledby="financial-summary-title" className="mb-6">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="financial-summary-title" className="text-base font-semibold text-admin-text-primary">Tổng hợp kỳ báo cáo</h2>
            <p className="mt-0.5 text-xs text-admin-text-muted">{periodLabel}</p>
          </div>
          {report ? <p className="text-xs text-admin-text-muted">{report.period.days} ngày · {report.period.groupBy === 'day' ? 'theo ngày' : 'theo tháng'}</p> : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Doanh thu"
            value={loading ? 'Đang tải' : formatExpenseCurrency(report?.revenue ?? 0)}
            detail={`${report?.orderCount ?? 0} đơn đã thanh toán`}
            icon={ArrowUpRight}
          />
          <MetricCard
            label="Chi phí"
            value={loading ? 'Đang tải' : formatExpenseCurrency(report?.expense ?? 0)}
            detail={`${report?.expenseCount ?? 0} khoản chi đã ghi nhận`}
            icon={ArrowDownRight}
          />
          <MetricCard
            label="Lợi nhuận"
            value={loading ? 'Đang tải' : formatExpenseCurrency(report?.profit ?? 0)}
            detail="Doanh thu trừ chi phí"
            icon={WalletCards}
            tone={profitTone}
          />
          <MetricCard
            label="Biên lợi nhuận"
            value={loading ? 'Đang tải' : percentLabel(report?.profitMarginPercent ?? null)}
            detail="Lợi nhuận trên doanh thu"
            icon={Scale}
            tone={profitTone}
          />
        </div>
      </section>

      {report ? (
        <>
          <div className="mb-6">
            <FinancialReportChart points={report.points} />
          </div>

          <div className="mb-6 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(19rem,0.75fr)]">
            <section className="overflow-hidden rounded-admin-panel border border-admin-border bg-admin-surface" aria-labelledby="financial-detail-title">
              <header className="border-b border-admin-border px-4 py-4 sm:px-5">
                <h2 id="financial-detail-title" className="text-base font-semibold text-admin-text-primary">Chi tiết theo kỳ</h2>
                <p className="mt-1 text-xs text-admin-text-muted">Số liệu dùng cùng quy tắc với phần tổng hợp.</p>
              </header>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
                  <thead className="bg-admin-muted text-xs font-semibold text-admin-text-secondary">
                    <tr>
                      <th scope="col" className="px-4 py-3 sm:px-5">Kỳ</th>
                      <th scope="col" className="px-4 py-3 text-right">Doanh thu</th>
                      <th scope="col" className="px-4 py-3 text-right">Chi phí</th>
                      <th scope="col" className="px-4 py-3 text-right">Lợi nhuận</th>
                      <th scope="col" className="px-4 py-3 text-right sm:px-5">Giao dịch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-admin-border">
                    {report.points.map((point) => (
                      <tr key={`row-${point.from}-${point.to}`} className="text-admin-text-secondary hover:bg-admin-muted/50">
                        <th scope="row" className="px-4 py-3 font-medium text-admin-text-primary sm:px-5">{point.label}</th>
                        <td className="px-4 py-3 text-right tabular-nums">{formatExpenseCurrency(point.revenue)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatExpenseCurrency(point.expense)}</td>
                        <td className={`px-4 py-3 text-right font-semibold tabular-nums ${point.profit < 0 ? 'text-admin-status-error' : 'text-admin-status-success'}`}>
                          {formatExpenseCurrency(point.profit)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums sm:px-5">{point.orderCount} đơn · {point.expenseCount} chi</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-admin-panel border border-admin-border bg-admin-surface" aria-labelledby="expense-breakdown-title">
              <header className="border-b border-admin-border px-4 py-4 sm:px-5">
                <h2 id="expense-breakdown-title" className="text-base font-semibold text-admin-text-primary">Chi phí theo danh mục</h2>
                <p className="mt-1 text-xs text-admin-text-muted">Tỷ trọng trong tổng chi phí.</p>
              </header>
              <div className="space-y-4 p-4 sm:p-5">
                {report.expensesByCategory.length === 0 ? (
                  <p className="text-sm text-admin-text-muted">Chưa có chi phí trong kỳ báo cáo.</p>
                ) : report.expensesByCategory.map((category) => {
                  const share = report.expense > 0 ? (category.totalAmount / report.expense) * 100 : 0;
                  return (
                    <article key={category.expenseCategoryId}>
                      <div className="flex items-start justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <h3 className="truncate font-medium text-admin-text-primary" title={category.expenseCategoryName}>{category.expenseCategoryName}</h3>
                          <p className="mt-0.5 text-xs text-admin-text-muted">{category.expenseCount} khoản · {percentLabel(share)}</p>
                        </div>
                        <strong className="shrink-0 font-semibold tabular-nums text-admin-text-primary">{formatExpenseCurrency(category.totalAmount)}</strong>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-admin-muted" aria-hidden="true">
                        <div className="h-full rounded-full bg-admin-accent" style={{ width: `${Math.min(100, share)}%` }} />
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="rounded-admin-control border border-admin-border bg-admin-muted px-4 py-3 text-xs leading-5 text-admin-text-secondary" aria-label="Quy tắc tính báo cáo">
            <p><strong className="font-semibold text-admin-text-primary">Doanh thu:</strong> {report.revenueBasis}</p>
            <p className="mt-1"><strong className="font-semibold text-admin-text-primary">Lợi nhuận:</strong> {report.profitBasis}</p>
          </aside>
        </>
      ) : loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-admin-panel border border-admin-border bg-admin-surface text-sm text-admin-text-secondary" role="status">
          Đang tải báo cáo...
        </div>
      ) : null}
    </div>
  );
};
