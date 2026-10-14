import React from 'react';

type Props = {
  from: string;
  to: string;
  includeShipping: boolean;
  showShippingToggle: boolean;
  loading: boolean;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onIncludeShippingChange: (value: boolean) => void;
  onApply: () => void;
};

const fieldClass = 'h-11 rounded-admin-control border border-admin-input-border bg-admin-surface px-3 text-sm text-admin-text-primary';

export const ReportFilters: React.FC<Props> = ({
  from, to, includeShipping, showShippingToggle, loading,
  onFromChange, onToChange, onIncludeShippingChange, onApply,
}) => (
  <section className="finance-toolbar" aria-label="Bộ lọc khoảng báo cáo">
    <div className="finance-range">
      <span className="finance-range-label">Khoảng báo cáo</span>
      <label>
        <span className="sr-only">Từ ngày</span>
        <input aria-label="Từ ngày" type="date" value={from} max={to} onChange={(event) => onFromChange(event.target.value)} className={fieldClass} />
      </label>
      <span aria-hidden="true" className="text-admin-text-muted">→</span>
      <label>
        <span className="sr-only">Đến ngày</span>
        <input aria-label="Đến ngày" type="date" value={to} min={from} onChange={(event) => onToChange(event.target.value)} className={fieldClass} />
      </label>
      <button type="button" onClick={onApply} disabled={loading} className="finance-secondary-button">
        {loading ? 'Đang tải…' : 'Áp dụng'}
      </button>
    </div>
    {showShippingToggle ? (
      <label className="finance-switch">
        <input type="checkbox" checked={includeShipping} onChange={(event) => onIncludeShippingChange(event.target.checked)} />
        <span aria-hidden="true" />
        Tính cả phí giao hàng
      </label>
    ) : null}
  </section>
);
