import React from 'react';

type KpiCardProps = {
  label: string;
  value: string;
  unit: string;
  period: string;
  context: string;
  unavailable?: boolean;
};

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  unit,
  period,
  context,
  unavailable = false,
}) => (
  <article
    className="min-w-0 rounded-admin-panel border border-admin-border bg-admin-card p-4 shadow-admin-panel sm:p-5"
    aria-label={`${label}: ${value}${unit ? ` ${unit}` : ''}. ${period}. ${context}`}
  >
    <p className="text-sm font-medium text-admin-text-secondary">{label}</p>
    <div className="mt-3 flex min-w-0 items-baseline gap-2">
      <p
        className={[
          'min-w-0 break-words text-[1.75rem] font-semibold leading-none tracking-[-0.03em] tabular-nums sm:text-[2rem]',
          unavailable ? 'text-admin-text-muted' : 'text-admin-text-primary',
        ].join(' ')}
      >
        {value}
      </p>
      {unit ? <span className="shrink-0 text-xs font-medium text-admin-text-muted">{unit}</span> : null}
    </div>
    <p className="mt-3 text-xs font-medium text-admin-text-secondary">{period}</p>
    <p className="mt-1 min-h-9 text-xs leading-[1.45] text-admin-text-muted">{context}</p>
  </article>
);

