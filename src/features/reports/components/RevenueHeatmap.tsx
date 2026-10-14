import React from 'react';
import type { FinancialReportPoint } from '../types/financialReport.types';
import { formatCompactMoney, formatDate, formatMoney } from '../utils/financeReportFormatters';

export const RevenueHeatmap: React.FC<{ points: FinancialReportPoint[]; selectedDate: string; onSelect: (date: string) => void }> = ({ points, selectedDate, onSelect }) => {
  const max = Math.max(1, ...points.map((point) => point.revenue));
  const leading = points.length ? (new Date(`${points[0].from}T00:00:00Z`).getUTCDay() + 6) % 7 : 0;
  return (
    <section className="finance-card">
      <div className="finance-card-head"><div><h2>Một khoảng ngày, nhìn là hiểu</h2><p>Màu đậm hơn = doanh thu cao hơn; mỗi ô luôn có số tiền.</p></div><strong className="finance-month-label">{points.length ? `${formatDate(points[0].from)} — ${formatDate(points.at(-1)!.from)}` : '—'}</strong></div>
      <div className="finance-card-body">
        <div className="finance-heatmap">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => <span key={day} className="finance-weekday">{day}</span>)}{Array.from({ length: leading }, (_, index) => <i key={`lead-${index}`} />)}{points.map((point) => {
          const level = point.revenue === 0 ? 0 : Math.max(1, Math.ceil(point.revenue / max * 4));
          return <button key={point.from} type="button" className={`finance-heat-day level-${level} ${point.from === selectedDate ? 'selected' : ''}`} aria-pressed={point.from === selectedDate} aria-label={`${formatDate(point.from)}: ${formatMoney(point.revenue)}, ${point.orderCount} đơn`} title={`${formatDate(point.from)} · ${formatMoney(point.revenue)} · ${point.orderCount} đơn`} onClick={() => onSelect(point.from)}><span>{point.from.slice(-2)}</span><b>{point.revenue ? formatCompactMoney(point.revenue) : '0 ₫'}</b></button>;
        })}</div>
        <div className="finance-heat-legend"><span>Doanh thu / ngày</span><span>Thấp {[0, 1, 2, 3, 4].map((level) => <i key={level} className={`level-${level}`} />)} Cao</span></div>
      </div>
    </section>
  );
};
