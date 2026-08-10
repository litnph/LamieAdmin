import React from 'react';
import type { FinancialReportPoint } from '../types/financialReport.types';
import { formatExpenseCurrency } from '@/features/expenses/utils/expenseFormatters';

type FinancialReportChartProps = {
  points: FinancialReportPoint[];
};

export const FinancialReportChart: React.FC<FinancialReportChartProps> = ({ points }) => {
  const maximum = Math.max(1, ...points.flatMap((point) => [point.revenue, point.expense]));

  return (
    <figure className="overflow-hidden rounded-admin-panel border border-admin-border bg-admin-surface" aria-labelledby="financial-chart-title">
      <header className="flex flex-col gap-2 border-b border-admin-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 id="financial-chart-title" className="text-base font-semibold text-admin-text-primary">Doanh thu và chi phí theo kỳ</h2>
          <p className="mt-1 text-xs text-admin-text-muted">Cột đậm là doanh thu, cột nhạt là chi phí.</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-admin-text-secondary" aria-hidden="true">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-admin-primary" />Doanh thu</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-admin-accent" />Chi phí</span>
        </div>
      </header>
      <div className="overflow-x-auto px-4 pb-4 pt-5 sm:px-5">
        <div
          className="flex h-64 items-end gap-3"
          style={{ minWidth: `${Math.max(560, points.length * 72)}px` }}
        >
          {points.map((point) => {
            const revenueHeight = point.revenue === 0 ? 2 : Math.max(4, (point.revenue / maximum) * 100);
            const expenseHeight = point.expense === 0 ? 2 : Math.max(4, (point.expense / maximum) * 100);
            return (
              <div key={`${point.from}-${point.to}`} className="flex h-full min-w-14 flex-1 flex-col justify-end">
                <div className="flex min-h-0 flex-1 items-end justify-center gap-1.5">
                  <div
                    className="w-4 rounded-t-sm bg-admin-primary transition-colors hover:bg-admin-primary-hover"
                    style={{ height: `${revenueHeight}%` }}
                    title={`${point.label}: doanh thu ${formatExpenseCurrency(point.revenue)}`}
                    aria-label={`${point.label}, doanh thu ${formatExpenseCurrency(point.revenue)}`}
                  />
                  <div
                    className="w-4 rounded-t-sm bg-admin-accent transition-opacity hover:opacity-80"
                    style={{ height: `${expenseHeight}%` }}
                    title={`${point.label}: chi phí ${formatExpenseCurrency(point.expense)}`}
                    aria-label={`${point.label}, chi phí ${formatExpenseCurrency(point.expense)}`}
                  />
                </div>
                <p className="mt-2 truncate text-center text-[11px] text-admin-text-muted" title={point.label}>{point.label}</p>
              </div>
            );
          })}
        </div>
      </div>
      <table className="sr-only">
        <caption>Dữ liệu doanh thu, chi phí và lợi nhuận theo kỳ</caption>
        <thead><tr><th>Kỳ</th><th>Doanh thu</th><th>Chi phí</th><th>Lợi nhuận</th></tr></thead>
        <tbody>
          {points.map((point) => (
            <tr key={`accessible-${point.from}-${point.to}`}>
              <th>{point.label}</th>
              <td>{formatExpenseCurrency(point.revenue)}</td>
              <td>{formatExpenseCurrency(point.expense)}</td>
              <td>{formatExpenseCurrency(point.profit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};
