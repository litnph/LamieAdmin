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
  <div className="min-w-[8.5rem]">
    <label htmlFor="dashboard-period" className="mb-1.5 block text-xs font-medium text-admin-text-primary">
      Khoảng thời gian
    </label>
    <select
      id="dashboard-period"
      value={value}
      onChange={(event) => onChange(event.target.value as DashboardPeriodKey)}
      disabled={disabled}
      className="h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 text-sm font-medium text-admin-text-primary outline-none transition-colors focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text"
    >
      {DASHBOARD_PERIODS.map((period) => (
        <option key={period.key} value={period.key}>
          {period.label}
        </option>
      ))}
    </select>
  </div>
);
