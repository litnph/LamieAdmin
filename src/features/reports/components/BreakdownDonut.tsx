import React from 'react';
import type { ProductRevenueBreakdown } from '../types/financialReport.types';
import { formatCompactMoney, formatMoney } from '../utils/financeReportFormatters';

const colors = ['var(--finance-chart-main)', 'var(--finance-chart-lime)', 'var(--finance-chart-lilac)', 'var(--finance-chart-peach)', 'var(--finance-chart-muted)'];

export const BreakdownDonut: React.FC<{ rows: ProductRevenueBreakdown[]; title?: string; description?: string }> = ({ rows, title = 'Khách đang chọn hoa gì?', description = 'Cơ cấu tiền sản phẩm · luôn loại phí giao hàng' }) => {
  const total = rows.reduce((sum, row) => sum + row.revenue, 0);
  const positiveTotal = rows.reduce((sum, row) => sum + Math.max(0, row.revenue), 0);
  let offset = 0;
  const circumference = 2 * Math.PI * 62;
  return <section className="finance-card">
    <div className="finance-card-head"><div><h2>{title}</h2><p>{description}</p></div></div>
    <div className="finance-donut-layout">
      <div className="finance-donut"><svg viewBox="0 0 180 180" role="img" aria-label={rows.map((row) => `${row.name}: ${formatMoney(row.revenue)}`).join(', ')}><circle cx="90" cy="90" r="62" className="finance-donut-base" />{rows.map((row, index) => { const length = positiveTotal && row.revenue > 0 ? row.revenue / positiveTotal * circumference : 0; const dashOffset = offset; offset += length; return <circle key={`${row.id}-${row.name}`} cx="90" cy="90" r="62" fill="none" stroke={colors[index % colors.length]} strokeWidth="22" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-dashOffset} transform="rotate(-90 90 90)"><title>{row.name}: {formatMoney(row.revenue)}</title></circle>; })}</svg><div><b>{formatCompactMoney(total)}</b><span>tiền sản phẩm</span></div></div>
      <div className="finance-donut-legend">{rows.length ? rows.map((row, index) => <div key={`${row.id}-${row.name}`}><i style={{ background: colors[index % colors.length] }} /><span><strong>{row.name}</strong><small>{formatMoney(row.revenue)}</small></span><b>{row.revenue < 0 ? 'Điều chỉnh' : positiveTotal ? `${(row.revenue / positiveTotal * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%` : '0%'}</b></div>) : <div className="finance-empty">Chưa có doanh thu sản phẩm trong khoảng này.</div>}</div>
    </div>
  </section>;
};
