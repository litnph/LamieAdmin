import React from 'react';
import { formatCompactMoney } from '../utils/financeReportFormatters';

export const Sparkline: React.FC<{ values: number[]; bars?: boolean }> = ({ values, bars = false }) => {
  const width = 180;
  const height = 44;
  const max = Math.max(1, ...values);
  if (!values.length) return <div className="h-11" />;
  const points = values.map((value, index) => `${index * width / Math.max(1, values.length - 1)},${height - 4 - value / max * 34}`).join(' ');
  return (
    <svg className="finance-spark" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {bars ? values.map((value, index) => (
        <rect key={index} x={index * width / values.length} y={height - 4 - value / max * 34} width={Math.max(1, width / values.length - 3)} height={value / max * 34} rx="2" />
      )) : <polyline points={points} fill="none" vectorEffect="non-scaling-stroke" />}
    </svg>
  );
};

type Props = {
  label: string;
  value: number | string;
  detail: string;
  values: number[];
  money?: boolean;
  accent?: boolean;
  bars?: boolean;
};

export const KpiSparkline: React.FC<Props> = ({ label, value, detail, values, money = false, accent = false, bars = false }) => (
  <article className={`finance-kpi ${accent ? 'finance-kpi-accent' : ''}`}>
    <span className="finance-kpi-label">{label}</span>
    <strong className="finance-kpi-value">{money && typeof value === 'number' ? formatCompactMoney(value) : value}</strong>
    <div className="finance-kpi-bottom">
      <span>{detail}</span>
      <Sparkline values={values} bars={bars} />
    </div>
  </article>
);
