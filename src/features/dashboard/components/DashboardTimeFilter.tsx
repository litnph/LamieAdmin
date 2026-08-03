import React from 'react';
import { DASHBOARD_PERIODS, type DashboardPeriodKey } from '../types/dashboard.types';

type DashboardTimeFilterProps = {
  value: DashboardPeriodKey;
  onChange: (value: DashboardPeriodKey) => void;
  disabled?: boolean;
};

export const DashboardTimeFilter: React.FC<DashboardTimeFilterProps> = ({
  value,
  onChange,
  disabled = false,
}) => (
  <div>
    <label htmlFor="dashboard-period" className="sr-only">
      Khoảng thời gian Dashboard
    </label>
    <select
      id="dashboard-period"
      value={value}
      onChange={(event) => onChange(event.target.value as DashboardPeriodKey)}
      disabled={disabled}
      className="h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 text-sm font-medium text-admin-text-primary disabled:cursor-not-allowed disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text md:hidden"
    >
      {DASHBOARD_PERIODS.map((period) => (
        <option key={period.key} value={period.key}>
          {period.label}
        </option>
      ))}
    </select>

    <div
      className="hidden rounded-admin-control border border-admin-border bg-admin-muted p-1 md:inline-flex"
      role="group"
      aria-label="Khoảng thời gian Dashboard"
    >
      {DASHBOARD_PERIODS.map((period) => {
        const selected = period.key === value;
        return (
          <button
            key={period.key}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(period.key)}
            className={[
              'h-11 rounded-md px-3 text-sm font-medium transition-colors',
              'disabled:cursor-not-allowed disabled:opacity-55',
              selected
                ? 'bg-admin-card text-admin-text-primary shadow-admin-panel'
                : 'text-admin-text-secondary hover:bg-admin-card/70 hover:text-admin-text-primary',
            ].join(' ')}
          >
            {period.shortLabel}
          </button>
        );
      })}
    </div>
  </div>
);
