import React from 'react';
import type { FinancialReportPoint } from '../types/financialReport.types';
import { formatExpenseCurrency } from '@/features/expenses/utils/expenseFormatters';

type FinancialReportChartProps = {
  points: FinancialReportPoint[];
  includeShippingFeeInRevenue: boolean;
};

export const FinancialReportChart: React.FC<FinancialReportChartProps> = ({ points, includeShippingFeeInRevenue }) => {
  const maximum = Math.max(1, ...points.flatMap((point) => [point.revenue, point.productRevenue, point.shippingFee, point.expense]));
  return (
    <figure className="overflow-hidden rounded-admin-panel border border-admin-border bg-admin-surface" aria-labelledby="financial-chart-title">
      <header className="flex flex-col gap-2 border-b border-admin-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div><h2 id="financial-chart-title" className="text-base font-semibold text-admin-text-primary">Doanh thu và chi phí theo kỳ</h2><p className="mt-1 text-xs text-admin-text-muted">Doanh thu {includeShippingFeeInRevenue ? 'gồm' : 'không gồm'} phí giao hàng; các thành phần luôn được tách riêng.</p></div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-admin-text-secondary" aria-hidden="true"><span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-admin-primary" />Doanh thu</span><span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-admin-status-success" />Tiền sản phẩm</span><span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-admin-status-info" />Phí giao hàng</span><span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-admin-accent" />Chi phí</span></div>
      </header>
      <div className="overflow-x-auto px-4 pb-4 pt-5 sm:px-5"><div className="flex h-64 items-end gap-3" style={{ minWidth: `${Math.max(560, points.length * 72)}px` }}>{points.map((point) => {
        const values = [point.revenue, point.productRevenue, point.shippingFee, point.expense];
        const heights = values.map((value) => value === 0 ? 2 : Math.max(4, value / maximum * 100));
        const bars = [
          ['bg-admin-primary', 'doanh thu', point.revenue], ['bg-admin-status-success', 'tiền sản phẩm', point.productRevenue],
          ['bg-admin-status-info', 'phí giao hàng', point.shippingFee], ['bg-admin-accent', 'chi phí', point.expense],
        ] as const;
        return <div key={`${point.from}-${point.to}`} className="flex h-full min-w-14 flex-1 flex-col justify-end"><div className="flex min-h-0 flex-1 items-end justify-center gap-1.5">{bars.map(([color, label, value], index) => <div key={label} className={`w-3 rounded-t-sm ${color}`} style={{ height: `${heights[index]}%` }} title={`${point.label}: ${label} ${formatExpenseCurrency(value)}`} aria-label={`${point.label}, ${label} ${formatExpenseCurrency(value)}`} />)}</div><p className="mt-2 truncate text-center text-[11px] text-admin-text-muted" title={point.label}>{point.label}</p></div>;
      })}</div></div>
      <table className="sr-only"><caption>Dữ liệu doanh thu, tiền sản phẩm, phí giao hàng, chi phí và lợi nhuận theo kỳ</caption><thead><tr><th>Kỳ</th><th>Doanh thu</th><th>Tiền sản phẩm</th><th>Phí giao hàng</th><th>Chi phí</th><th>Lợi nhuận</th></tr></thead><tbody>{points.map((point) => <tr key={`accessible-${point.from}-${point.to}`}><th>{point.label}</th><td>{formatExpenseCurrency(point.revenue)}</td><td>{formatExpenseCurrency(point.productRevenue)}</td><td>{formatExpenseCurrency(point.shippingFee)}</td><td>{formatExpenseCurrency(point.expense)}</td><td>{formatExpenseCurrency(point.profit)}</td></tr>)}</tbody></table>
    </figure>
  );
};
