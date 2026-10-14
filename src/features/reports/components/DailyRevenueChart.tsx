import React from 'react';
import type { FinancialReportPoint } from '../types/financialReport.types';
import { formatCompactMoney, formatDate, formatMoney } from '../utils/financeReportFormatters';

export type DailyChartMode = 'line' | 'bar';

type Props = {
  points: FinancialReportPoint[];
  selectedDate: string;
  mode: DailyChartMode;
  onModeChange: (mode: DailyChartMode) => void;
  onSelect: (date: string) => void;
};

export const DailyRevenueChart: React.FC<Props> = ({ points, selectedDate, mode, onModeChange, onSelect }) => {
  const width = Math.max(820, points.length * 34);
  const height = 320;
  const left = 68;
  const right = 24;
  const top = 24;
  const bottom = 48;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const max = Math.max(500_000, Math.ceil(Math.max(0, ...points.map((point) => point.revenue)) / 500_000) * 500_000);
  const step = plotWidth / Math.max(1, points.length);
  const x = (index: number) => left + step * (index + 0.5);
  const y = (value: number) => top + plotHeight - value / max * plotHeight;
  const selectedIndex = Math.max(0, points.findIndex((point) => point.from === selectedDate));
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(point.revenue)}`).join(' ');
  const fillPath = points.length ? `${path} L ${x(points.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z` : '';

  const keyboardSelect = (event: React.KeyboardEvent<SVGGElement>, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(points[index].from);
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const next = Math.min(points.length - 1, Math.max(0, index + (event.key === 'ArrowRight' ? 1 : -1)));
      onSelect(points[next].from);
      requestAnimationFrame(() => document.getElementById(`finance-point-${next}`)?.focus());
    }
  };

  return (
    <section className="finance-card finance-chart-card" aria-labelledby="daily-revenue-title">
      <div className="finance-card-head">
        <div>
          <h2 id="daily-revenue-title">Nhịp doanh thu mỗi ngày</h2>
          <p>Chạm, bấm hoặc dùng phím mũi tên để xem một ngày cụ thể.</p>
        </div>
        <div className="finance-segmented" role="group" aria-label="Kiểu biểu đồ">
          {(['line', 'bar'] as const).map((value) => <button key={value} type="button" aria-pressed={mode === value} className={mode === value ? 'active' : ''} onClick={() => onModeChange(value)}>{value === 'line' ? 'Đường' : 'Cột'}</button>)}
        </div>
      </div>
      <div className="finance-chart-caption"><i /><span>Doanh thu đang hiển thị</span><strong>{formatMoney(points.reduce((sum, point) => sum + point.revenue, 0))}</strong></div>
      <div className="finance-chart-scroll">
        <svg viewBox={`0 0 ${width} ${height}`} style={{ minWidth: width }} role="img" aria-label="Biểu đồ doanh thu theo ngày, đơn vị đồng">
          <defs><linearGradient id="finance-revenue-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="rgb(var(--admin-chart-a-rgb))" stopOpacity=".24" /><stop offset="1" stopColor="rgb(var(--admin-chart-a-rgb))" stopOpacity=".015" /></linearGradient></defs>
          {Array.from({ length: 5 }, (_, index) => max * index / 4).map((value) => <g key={value}><line x1={left} y1={y(value)} x2={width - right} y2={y(value)} className="finance-grid-line" /><text x={left - 12} y={y(value) + 4} textAnchor="end" className="finance-chart-label">{formatCompactMoney(value)}</text></g>)}
          <text x={8} y={16} className="finance-chart-label">VND</text>
          {points[selectedIndex] ? <rect x={left + step * selectedIndex} y={top} width={step} height={plotHeight} rx="6" className="finance-selected-band" /> : null}
          {mode === 'line' && points.length ? <><path d={fillPath} fill="url(#finance-revenue-fill)" /><path d={path} className="finance-revenue-line" /></> : null}
          {points.map((point, index) => mode === 'bar'
            ? <rect key={point.from} x={x(index) - Math.min(28, step * 0.62) / 2} y={y(point.revenue)} width={Math.min(28, step * 0.62)} height={Math.max(point.revenue ? 2 : 0, plotHeight * point.revenue / max)} rx="4" className={point.from === selectedDate ? 'finance-revenue-bar selected' : 'finance-revenue-bar'} />
            : <circle key={point.from} cx={x(index)} cy={y(point.revenue)} r={point.from === selectedDate ? 6 : 3} className={point.from === selectedDate ? 'finance-revenue-dot selected' : 'finance-revenue-dot'} />)}
          {points.map((point, index) => (points.length <= 12 || index === 0 || index === points.length - 1 || index % 5 === 0) ? <text key={`label-${point.from}`} x={x(index)} y={height - 17} textAnchor="middle" className={point.from === selectedDate ? 'finance-chart-label selected' : 'finance-chart-label'}>{formatDate(point.from, false)}</text> : null)}
          {points.map((point, index) => (
            <g id={`finance-point-${index}`} key={`hit-${point.from}`} role="button" tabIndex={0} aria-label={`${formatDate(point.from)}: ${formatMoney(point.revenue)}, ${point.orderCount} đơn`} aria-pressed={point.from === selectedDate} onKeyDown={(event) => keyboardSelect(event, index)} onClick={() => onSelect(point.from)} className="finance-chart-hit">
              <title>{`${formatDate(point.from)} · ${formatMoney(point.revenue)} · ${point.orderCount} đơn`}</title>
              <rect x={left + step * index} y={top} width={step} height={plotHeight} fill="transparent" />
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
};
