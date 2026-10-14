import React from 'react';
import { ArrowDownRight, ArrowUpRight, CircleHelp, Minus } from '@/shared/icons/lucideAnimated';
import type { CategoryAmount, ReportMetric, ReportSeriesPoint } from '../types/reporting.types';
import { changeLabel, formatCompactVnd, formatPercent, formatVnd } from '../utils/reportFormatters';

type MetricProps = {
  label: string;
  metric: ReportMetric;
  detail: string;
  format?: 'currency' | 'percent' | 'number';
  emphasis?: 'primary' | 'secondary' | 'alert';
  className?: string;
};

const metricValue = (metric: ReportMetric, format: MetricProps['format']) => {
  if (format === 'percent') return formatPercent(metric.value);
  if (format === 'number') return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(metric.value);
  return formatVnd(metric.value);
};

export const MetricBlock: React.FC<MetricProps> = ({ label, metric, detail, format = 'currency', emphasis = 'secondary', className = '' }) => {
  const change = metric.changePercent;
  const ChangeIcon = change == null || change === 0 ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight;
  const valueClass = emphasis === 'primary' ? 'text-3xl sm:text-[2.15rem]' : 'text-xl sm:text-2xl';
  return (
    <article className={`${emphasis === 'primary' ? 'min-w-0 py-1' : 'min-w-0 border-t border-admin-border py-4 sm:border-l sm:border-t-0 sm:pl-5'} ${className}`}>
      <div className="flex items-center gap-1.5">
        <h3 className="text-xs font-semibold text-admin-text-secondary">{label}</h3>
        <span className="group relative -my-3 inline-flex min-h-11 min-w-11 items-center justify-center" tabIndex={0} aria-label={detail}>
          <CircleHelp size={14} className="text-admin-text-muted" aria-hidden="true" />
          <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-admin-popover mb-2 hidden w-60 -translate-x-1/2 rounded-admin-control bg-admin-text-primary px-3 py-2 text-xs font-normal leading-5 text-white shadow-admin-popover group-hover:block group-focus:block">{detail}</span>
        </span>
      </div>
      <p className={`mt-2 truncate font-semibold tabular-nums tracking-[-0.02em] ${valueClass} ${emphasis === 'alert' ? 'text-admin-status-warning' : 'text-admin-text-primary'}`} title={metricValue(metric, format)}>{metricValue(metric, format)}</p>
      {metric.previousValue != null ? (
        <p className={`mt-2 flex items-center gap-1 text-xs font-medium ${change != null && change < 0 ? 'text-admin-status-error' : 'text-admin-text-secondary'}`}>
          <ChangeIcon size={14} aria-hidden="true" /> {change == null ? `Kỳ trước ${format === 'currency' ? formatVnd(metric.previousValue) : metric.previousValue}` : changeLabel(change)}
        </p>
      ) : <p className="mt-2 text-xs text-admin-text-secondary">{detail}</p>}
    </article>
  );
};

type SeriesKey = 'revenue' | 'expenses' | 'profit' | 'cashIn' | 'refunds' | 'cashOut' | 'netCash';
const colors: Record<SeriesKey, string> = {
  revenue: 'bg-admin-primary', expenses: 'bg-admin-accent', profit: 'bg-admin-status-success',
  cashIn: 'bg-admin-primary', refunds: 'bg-admin-status-warning', cashOut: 'bg-admin-status-error', netCash: 'bg-admin-status-info',
};
const seriesLabels: Record<SeriesKey, string> = {
  revenue: 'Doanh thu ghi nhận', expenses: 'Chi phí', profit: 'Lợi nhuận', cashIn: 'Tiền thực thu',
  refunds: 'Hoàn khách', cashOut: 'Tiền thực chi', netCash: 'Dòng tiền ròng',
};

type ChartProps = {
  title: string;
  description: string;
  points: ReportSeriesPoint[];
  keys: SeriesKey[];
  selectedKey?: string | null;
  onSelect?: (point: ReportSeriesPoint) => void;
};

export const ReportBarChart: React.FC<ChartProps> = ({ title, description, points, keys, selectedKey, onSelect }) => {
  const maximum = Math.max(1, ...points.flatMap((point) => keys.map((key) => Math.abs(point[key]))));
  const titleId = `chart-${title.toLocaleLowerCase('vi').replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <figure className="min-w-0 border border-admin-border bg-admin-surface" aria-labelledby={titleId}>
      <figcaption className="flex flex-col gap-3 border-b border-admin-border px-4 py-4 sm:px-5 lg:flex-row lg:items-start lg:justify-between">
        <div><h2 id={titleId} className="text-base font-semibold text-admin-text-primary">{title}</h2><p className="mt-1 max-w-[65ch] text-xs leading-5 text-admin-text-secondary">{description}</p></div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-medium text-admin-text-secondary">
          {keys.map((key) => <span key={key} className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${colors[key]}`} aria-hidden="true" />{seriesLabels[key]}</span>)}
        </div>
      </figcaption>
      <div className="overflow-x-auto px-4 pb-4 pt-5 sm:px-5">
        <div className="flex h-64 items-end gap-2" style={{ minWidth: `${Math.max(520, points.length * 58)}px` }}>
          {points.map((point) => (
            <button
              key={point.key}
              type="button"
              onClick={() => onSelect?.(point)}
              className={`group flex h-full min-w-11 flex-1 flex-col justify-end rounded-admin-control px-1 pt-2 text-left focus-visible:outline-none ${selectedKey === point.key ? 'bg-admin-primary/8 ring-2 ring-admin-primary/40' : 'hover:bg-admin-muted/70'}`}
              aria-label={`${point.label}. ${keys.map((key) => `${seriesLabels[key]} ${formatVnd(point[key])}`).join(', ')}`}
              aria-pressed={selectedKey === point.key}
            >
              <span className="flex min-h-0 flex-1 items-end justify-center gap-1" aria-hidden="true">
                {keys.map((key) => <span key={key} className={`w-2.5 min-w-1 rounded-t-sm transition-[height] duration-200 ${colors[key]}`} style={{ height: `${point[key] === 0 ? 1 : Math.max(3, Math.abs(point[key]) / maximum * 100)}%`, opacity: point[key] < 0 ? 0.48 : 1 }} />)}
              </span>
              <span className="mt-2 block w-full truncate text-center text-[10px] text-admin-text-secondary">{point.label}</span>
            </button>
          ))}
        </div>
      </div>
      <table className="sr-only"><caption>{title}</caption><thead><tr><th>Kỳ</th>{keys.map((key) => <th key={key}>{seriesLabels[key]}</th>)}</tr></thead><tbody>{points.map((point) => <tr key={point.key}><th>{point.label}</th>{keys.map((key) => <td key={key}>{formatVnd(point[key])}</td>)}</tr>)}</tbody></table>
    </figure>
  );
};

export const BreakdownList: React.FC<{ title: string; description: string; items: CategoryAmount[]; tone?: 'primary' | 'expense'; onSelect?: (id: string) => void }> = ({ title, description, items, tone = 'primary', onSelect }) => {
  const maximum = Math.max(1, ...items.map((item) => item.amount));
  return (
    <section className="min-w-0" aria-labelledby={`${title}-heading`}>
      <div className="mb-4"><h2 id={`${title}-heading`} className="text-base font-semibold text-admin-text-primary">{title}</h2><p className="mt-1 text-xs leading-5 text-admin-text-secondary">{description}</p></div>
      <div className="space-y-4">
        {items.map((item) => (
          <button key={item.id} type="button" onClick={() => onSelect?.(item.id)} className="block w-full rounded-admin-control text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/45">
            <span className="flex items-start justify-between gap-3 text-sm"><span className="min-w-0 truncate font-medium text-admin-text-primary">{item.name}</span><strong className="shrink-0 tabular-nums text-admin-text-primary">{formatVnd(item.amount)}</strong></span>
            <span className="mt-2 block h-2 overflow-hidden rounded-full bg-admin-muted" aria-hidden="true"><span className={`block h-full rounded-full ${tone === 'expense' ? 'bg-admin-accent' : 'bg-admin-primary'}`} style={{ width: `${Math.max(2, item.amount / maximum * 100)}%` }} /></span>
            <span className="mt-1.5 flex justify-between text-[11px] text-admin-text-secondary"><span>{item.count} mục</span><span>{formatCompactVnd(item.amount)}</span></span>
          </button>
        ))}
      </div>
    </section>
  );
};

export const ReportSkeleton: React.FC = () => (
  <div className="animate-pulse" aria-label="Đang tải báo cáo" role="status">
    <div className="grid gap-5 lg:grid-cols-3"><div className="h-32 bg-admin-muted lg:col-span-2" /><div className="h-32 bg-admin-muted" /></div>
    <div className="mt-6 grid gap-5 xl:grid-cols-2"><div className="h-80 bg-admin-muted" /><div className="h-80 bg-admin-muted" /></div>
    <span className="sr-only">Đang tải dữ liệu tài chính…</span>
  </div>
);
