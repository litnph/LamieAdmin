import React from 'react';

type KpiCardProps = {
  label: string;
  value: string;
  unit: string;
  period: string;
  context: string;
  unavailable?: boolean;
  accent?: boolean;
};

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  unit,
  period,
  context,
  unavailable = false,
  accent = false,
}) => (
  <article
    className={[
      'min-w-0 rounded-admin-panel border p-4 shadow-admin-panel sm:p-5',
      accent ? 'border-admin-primary bg-admin-primary text-admin-primary-foreground' : 'border-admin-border bg-admin-card',
    ].join(' ')}
    aria-label={`${label}: ${value}${unit ? ` ${unit}` : ''}. ${period}. ${context}`}
  >
    <p className={accent ? 'text-sm font-medium text-white/80' : 'text-sm font-medium text-admin-text-secondary'}>{label}</p>
    <div className="mt-3 flex min-w-0 items-baseline gap-2">
      <p
        className={[
          'min-w-0 break-words text-[1.75rem] font-semibold leading-none tracking-[-0.03em] tabular-nums sm:text-[2rem]',
          unavailable ? (accent ? 'text-white/65' : 'text-admin-text-muted') : (accent ? 'text-white' : 'text-admin-text-primary'),
        ].join(' ')}
      >
        {value}
      </p>
      {unit ? <span className={accent ? 'shrink-0 text-xs font-medium text-white/65' : 'shrink-0 text-xs font-medium text-admin-text-muted'}>{unit}</span> : null}
    </div>
    <p className={accent ? 'mt-3 text-xs font-medium text-white/80' : 'mt-3 text-xs font-medium text-admin-text-secondary'}>{period}</p>
    <p className={accent ? 'mt-1 min-h-9 text-xs leading-[1.45] text-white/65' : 'mt-1 min-h-9 text-xs leading-[1.45] text-admin-text-muted'}>{context}</p>
  </article>
);

