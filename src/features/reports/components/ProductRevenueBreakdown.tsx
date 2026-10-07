import React from 'react';
import { formatExpenseCurrency } from '@/features/expenses/utils/expenseFormatters';
import type { ProductRevenueBreakdown as ProductRevenueBreakdownItem } from '../types/financialReport.types';

type Props = { title: string; description: string; items: ProductRevenueBreakdownItem[] };

export const ProductRevenueBreakdown: React.FC<Props> = ({ title, description, items }) => {
  const maximum = Math.max(1, ...items.map((item) => item.revenue));
  const titleId = `product-revenue-${title.toLocaleLowerCase('vi').replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <figure className="min-w-0 rounded-admin-panel border border-admin-border bg-admin-surface" aria-labelledby={titleId}>
      <figcaption className="border-b border-admin-border px-4 py-4 sm:px-5"><h2 id={titleId} className="text-base font-semibold text-admin-text-primary">{title}</h2><p className="mt-1 text-xs leading-5 text-admin-text-muted">{description}</p></figcaption>
      {items.length === 0 ? <p className="px-4 py-8 text-center text-sm text-admin-text-muted sm:px-5">Chưa có doanh thu sản phẩm trong kỳ báo cáo.</p> : <div className="max-h-[28rem] space-y-4 overflow-y-auto p-4 sm:p-5">{items.map((item) => {
        const width = item.revenue <= 0 ? 0 : Math.max(2, item.revenue / maximum * 100);
        return <div key={`${item.id ?? 'unclassified'}-${item.name}`} className="min-w-0"><div className="flex items-start justify-between gap-3 text-sm"><span className="min-w-0 truncate font-medium text-admin-text-primary" title={item.name}>{item.name}</span><strong className="shrink-0 font-semibold tabular-nums text-admin-text-primary">{formatExpenseCurrency(item.revenue)}</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-admin-muted" aria-hidden="true"><div className="h-full rounded-full bg-admin-primary" style={{ width: `${width}%` }} /></div></div>;
      })}</div>}
      <table className="sr-only"><caption>{title}</caption><thead><tr><th>Phân loại</th><th>Doanh thu</th></tr></thead><tbody>{items.map((item) => <tr key={`accessible-${item.id ?? 'unclassified'}-${item.name}`}><th>{item.name}</th><td>{formatExpenseCurrency(item.revenue)}</td></tr>)}</tbody></table>
    </figure>
  );
};
