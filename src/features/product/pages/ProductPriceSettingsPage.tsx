import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, Percent } from 'lucide-react';
import { ProductApi } from '@/features/product/api/productApi';
import { SettingsShell, SettingsStatus } from '@/features/settings/components/SettingsShell';
import { getApiErrorMessage } from '@/shared/utils/apiError';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export const ProductPriceSettingsPage: React.FC = () => {
  const [value, setValue] = useState('20');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const numericValue = Number(value);
  const validationError = value.trim() === ''
    || !Number.isFinite(numericValue)
    || numericValue < 0
    || numericValue > 100
    ? 'Độ lệch phải nằm trong khoảng từ 0% đến 100%.'
    : null;
  const example = useMemo(() => {
    const deviation = validationError ? 0 : numericValue / 100;
    return [500_000 * (1 - deviation), 500_000 * (1 + deviation)];
  }, [numericValue, validationError]);

  useEffect(() => {
    void ProductApi.getCatalogSettings()
      .then((settings) => setValue(String(settings.priceDeviationPercent)))
      .catch((requestError) => setError(getApiErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (validationError || saving) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const settings = await ProductApi.updateCatalogPriceSettings(numericValue);
      setValue(String(settings.priceDeviationPercent));
      setSaved(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsShell
      title="Gợi ý theo giá"
      description="Thiết lập khoảng giá dùng để gợi ý những sản phẩm có mức giá tương đương."
    >
      <form onSubmit={save} className="overflow-hidden rounded-admin-panel border border-admin-border bg-admin-card">
        <section className="p-5 sm:p-7" aria-labelledby="pricing-settings-title">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-admin-control bg-admin-primary/10 text-admin-primary">
              <Percent size={20} aria-hidden="true" />
            </span>
            <div>
              <h3 id="pricing-settings-title" className="text-base font-semibold text-admin-text-primary">
                Độ lệch giá chuẩn
              </h3>
              <p className="mt-1 max-w-[65ch] text-sm leading-6 text-admin-text-secondary">
                Khoảng giá được tính đối xứng quanh giá hiệu lực của từng sản phẩm.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-[minmax(12rem,18rem)_1fr] md:items-end">
            <div>
              <label htmlFor="price-deviation" className="block text-sm font-medium text-admin-text-primary">
                Phần trăm độ lệch
              </label>
              <div className="relative mt-2">
                <input
                  id="price-deviation"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step={0.01}
                  value={value}
                  disabled={loading || saving}
                  onChange={(event) => {
                    setValue(event.target.value);
                    setSaved(false);
                  }}
                  className={`min-h-11 w-full rounded-admin-control border bg-admin-card px-3.5 pr-11 text-right font-mono text-sm tabular-nums text-admin-text-primary outline-none focus:ring-2 ${validationError ? 'border-admin-status-error focus:ring-admin-status-error/15' : 'border-admin-input-border focus:border-admin-primary focus:ring-admin-primary/15'}`}
                  aria-invalid={Boolean(validationError)}
                  aria-describedby="price-deviation-help"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-admin-text-muted">%</span>
              </div>
              <p id="price-deviation-help" className={`mt-2 text-xs leading-5 ${validationError ? 'text-admin-status-error' : 'text-admin-text-muted'}`}>
                {validationError ?? 'Cho phép tối đa 2 chữ số thập phân.'}
              </p>
            </div>

            <div className="rounded-admin-control border border-admin-primary/15 bg-admin-primary/5 px-4 py-3">
              <p className="text-xs text-admin-text-secondary">
                Khoảng gợi ý cho sản phẩm giá {currency.format(500_000)}
              </p>
              <p className="mt-1 font-mono text-base font-semibold tabular-nums text-admin-text-primary">
                {currency.format(example[0])} — {currency.format(example[1])}
              </p>
            </div>
          </div>
        </section>

        <div className="border-t border-admin-border px-5 py-4 sm:px-7">
          {error ? <div className="mb-3"><SettingsStatus kind="error">{error}</SettingsStatus></div> : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {saved ? (
              <p className="inline-flex items-center gap-2 text-sm font-medium text-admin-status-success" role="status">
                <CheckCircle2 size={17} aria-hidden="true" /> Đã lưu tầm giá.
              </p>
            ) : <span />}
            <button
              type="submit"
              disabled={loading || saving || Boolean(validationError)}
              className="btn-press inline-flex min-h-11 items-center gap-2 rounded-admin-control bg-admin-primary px-5 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : null}
              {saving ? 'Đang lưu...' : 'Lưu tầm giá'}
            </button>
          </div>
        </div>
      </form>
    </SettingsShell>
  );
};
