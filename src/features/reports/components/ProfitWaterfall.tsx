import React from 'react';
import type { FinancialReport } from '../types/financialReport.types';
import { formatCompactMoney, formatMoney } from '../utils/financeReportFormatters';

export const ProfitWaterfall: React.FC<{ report: FinancialReport }> = ({ report }) => {
  const knownDifference = report.profit;
  const steps = [
    { label: 'Doanh thu', value: report.productRevenue + report.shippingFee, kind: 'total' },
    { label: 'Giá vốn', value: -report.materialProductCogs, kind: 'cost' },
    { label: 'Hao hụt', value: -report.materialWaste, kind: 'cost' },
    { label: 'Giao hàng', value: -report.shippingFeeActual, kind: 'cost' },
    { label: 'Vận hành', value: -report.otherExpense, kind: 'cost' },
    { label: 'Lợi nhuận', value: knownDifference, kind: 'result' },
  ];
  const width = 760;
  const height = 290;
  const top = 42;
  const bottom = 64;
  const left = 54;
  const max = Math.max(1, ...steps.map((step) => Math.abs(step.value)));
  const y = (value: number) => top + (max - value) / (max * 2) * (height - top - bottom);
  let running = 0;
  const positioned = steps.map((step, index) => {
    const from = step.kind === 'cost' ? running : 0;
    const to = step.kind === 'cost' ? running + step.value : step.value;
    running = to;
    return { ...step, index, from, to };
  });
  return <section className="finance-card finance-waterfall-card">
    <div className="finance-card-head"><div><h2>Từ doanh thu đến lợi nhuận trước thuế</h2><p>Giá vốn theo kiểm kê kỳ; không phân bổ giả thành lợi nhuận từng ngày.</p></div>{report.isProfitProvisional ? <span className="finance-badge warning">Tạm tính</span> : <span className="finance-badge">Đã đối soát kỳ</span>}</div>
    <div className="finance-waterfall-scroll"><svg viewBox={`0 0 ${width} ${height}`} style={{ minWidth: width }} role="img" aria-label={`Doanh thu ${formatMoney(steps[0].value)}, giá vốn ${formatMoney(report.materialProductCogs)}, hao hụt ${formatMoney(report.materialWaste)}, giao hàng ${formatMoney(report.shippingFeeActual)}, vận hành ${formatMoney(report.otherExpense)}, lợi nhuận ${formatMoney(knownDifference)}`}>
      {[-1, -.5, 0, .5, 1].map((ratio) => <g key={ratio}><line x1={left} y1={y(max * ratio)} x2={width - 18} y2={y(max * ratio)} className="finance-grid-line" /><text x={left - 10} y={y(max * ratio) + 4} textAnchor="end" className="finance-chart-label">{formatCompactMoney(max * ratio)}</text></g>)}
      {positioned.map((step) => { const x = left + 70 + step.index * 108; const topY = y(Math.max(step.from, step.to)); const barHeight = Math.max(2, Math.abs(y(step.from) - y(step.to))); return <g key={step.label}><rect x={x - 30} y={topY} width="60" height={barHeight} rx="7" className={`finance-waterfall-bar ${step.kind}`} /><text x={x} y={topY - 12} textAnchor="middle" className="finance-waterfall-value">{formatCompactMoney(step.value)}</text><text x={x} y={height - 24} textAnchor="middle" className="finance-waterfall-label">{step.label}</text></g>; })}
    </svg></div>
    {report.isProfitProvisional ? <div className="finance-data-warning"><strong>Lợi nhuận {formatMoney(knownDifference)} đang tạm tính.</strong><span>{report.profitProvisionalReasons.join(' ')}</span></div> : null}
  </section>;
};
