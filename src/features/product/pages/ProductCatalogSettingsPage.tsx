import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, Percent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProductApi } from '@/features/product/api/productApi';
import { PageHeader } from '@/shared/components/PageHeader';
import { getApiErrorMessage } from '@/shared/utils/apiError';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

export const ProductCatalogSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [value, setValue] = useState('20');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const numericValue = Number(value);
  const validationError = value.trim() === '' || !Number.isFinite(numericValue) || numericValue < 0 || numericValue > 100
    ? 'Độ lệch phải nằm trong khoảng từ 0% đến 100%.'
    : null;
  const example = useMemo(() => {
    const deviation = validationError ? 0 : numericValue / 100;
    return [500_000 * (1 - deviation), 500_000 * (1 + deviation)];
  }, [numericValue, validationError]);

  useEffect(() => {
    void ProductApi.getCatalogSettings()
      .then((setting) => setValue(String(setting.priceDeviationPercent)))
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
      const setting = await ProductApi.updateCatalogSettings(numericValue);
      setValue(String(setting.priceDeviationPercent));
      setSaved(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <PageHeader
        title="Cài đặt gợi ý theo giá"
        description="Thiết lập độ lệch phần trăm dùng cho nhóm sản phẩm cùng tầm giá trên cửa hàng."
        actions={<button type="button" onClick={() => navigate('/admin/products')} className="inline-flex min-h-11 items-center gap-2 rounded-admin-control border border-admin-border bg-admin-card px-4 text-sm font-semibold text-admin-text-primary hover:bg-admin-muted"><ArrowLeft size={17} aria-hidden="true" /> Sản phẩm</button>}
      />

      <form onSubmit={save} className="overflow-hidden rounded-admin-panel border border-admin-border bg-admin-card">
        <div className="p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-admin-control bg-admin-primary/10 text-admin-primary"><Percent size={20} aria-hidden="true" /></span>
            <div>
              <h2 className="text-base font-semibold text-admin-text-primary">Độ lệch giá chuẩn</h2>
              <p className="mt-1 text-sm leading-6 text-admin-text-secondary">Áp dụng đối xứng quanh giá hiệu lực của từng sản phẩm. Giá khuyến mãi được ưu tiên khi đang có hiệu lực trong dữ liệu sản phẩm.</p>
            </div>
          </div>

          <label htmlFor="price-deviation" className="mt-7 block text-sm font-medium text-admin-text-primary">Phần trăm độ lệch</label>
          <div className="relative mt-2 max-w-xs">
            <input id="price-deviation" type="number" inputMode="decimal" min={0} max={100} step={0.01} value={value} disabled={loading || saving} onChange={(event) => { setValue(event.target.value); setSaved(false); }} className={`min-h-11 w-full rounded-admin-control border bg-admin-card px-3.5 pr-11 text-right font-mono text-sm tabular-nums text-admin-text-primary outline-none focus:ring-2 ${validationError ? 'border-admin-status-error focus:ring-admin-status-error/15' : 'border-admin-input-border focus:border-admin-primary focus:ring-admin-primary/15'}`} aria-invalid={Boolean(validationError)} aria-describedby="price-deviation-help" />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-admin-text-muted">%</span>
          </div>
          <p id="price-deviation-help" className={`mt-2 text-xs leading-5 ${validationError ? 'text-admin-status-error' : 'text-admin-text-muted'}`}>{validationError ?? 'Có thể nhập đến 2 chữ số thập phân.'}</p>

          <div className="mt-7 rounded-admin-control border border-admin-primary/15 bg-admin-primary/5 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-admin-primary">Minh họa trực tiếp</p>
            <p className="mt-2 text-sm leading-6 text-admin-text-secondary">Với sản phẩm giá <strong className="text-admin-text-primary">{currency.format(500_000)}</strong>, khoảng được xem là cùng tầm giá:</p>
            <p className="mt-3 font-mono text-lg font-semibold tabular-nums text-admin-text-primary">{currency.format(example[0])} đến {currency.format(example[1])}</p>
          </div>

          {error ? <div className="mt-5 rounded-admin-control border border-admin-status-error/25 bg-red-50 px-4 py-3 text-sm text-admin-status-error" role="alert">{error}</div> : null}
          {saved ? <p className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-admin-status-success" role="status"><CheckCircle2 size={17} aria-hidden="true" /> Đã lưu cài đặt.</p> : null}
        </div>
        <div className="flex justify-end border-t border-admin-border bg-admin-muted/25 px-5 py-4 sm:px-7">
          <button type="submit" disabled={loading || saving || Boolean(validationError)} className="btn-press inline-flex min-h-11 items-center gap-2 rounded-admin-control bg-admin-primary px-5 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : null}
            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </div>
      </form>
    </div>
  );
};
