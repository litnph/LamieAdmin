import React, { useEffect, useState } from 'react';
import { CheckCircle2, Image, Loader2, ShieldCheck, UploadCloud } from 'lucide-react';
import {
  ProductApi,
  ProductWatermarkSource,
  type ProductCatalogSettings,
} from '@/features/product/api/productApi';
import { resolveApiResourceUrl } from '@/services/apiResourceUrl';
import { SettingsShell, SettingsStatus } from '@/features/settings/components/SettingsShell';
import { getApiErrorMessage } from '@/shared/utils/apiError';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const watermarkSources = [
  { value: ProductWatermarkSource.Sku, label: 'SKU', description: 'Dùng mã SKU của từng sản phẩm.' },
  { value: ProductWatermarkSource.ShopLogo, label: 'Logo shop', description: 'Dùng logo shop đã cấu hình.' },
  { value: ProductWatermarkSource.UploadedImage, label: 'Ảnh tải lên', description: 'Dùng một ảnh watermark riêng.' },
] as const;

const validateImage = (file: File) => {
  if (!file.type.startsWith('image/')) return 'File đã chọn không phải ảnh.';
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) return 'Ảnh phải có dung lượng từ 1 byte đến 10 MB.';
  return null;
};

const useFilePreview = (file: File | null) => {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!file) {
      setUrl('');
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
};

export const ShopBrandingSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<ProductCatalogSettings | null>(null);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [watermarkSource, setWatermarkSource] = useState(ProductWatermarkSource.Sku);
  const [shopLogoFile, setShopLogoFile] = useState<File | null>(null);
  const [watermarkImageFile, setWatermarkImageFile] = useState<File | null>(null);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const logoPreview = useFilePreview(shopLogoFile) || resolveApiResourceUrl(settings?.shopLogoUrl);
  const uploadedPreview = useFilePreview(watermarkImageFile) || resolveApiResourceUrl(settings?.watermarkImageUrl);
  const missingSelectedAsset = watermarkEnabled
    && ((watermarkSource === ProductWatermarkSource.ShopLogo && !logoPreview)
      || (watermarkSource === ProductWatermarkSource.UploadedImage && !uploadedPreview));
  const watermarkAsset = watermarkSource === ProductWatermarkSource.ShopLogo ? logoPreview : uploadedPreview;

  const applySettings = (next: ProductCatalogSettings) => {
    setSettings(next);
    setWatermarkEnabled(next.watermarkEnabled ?? true);
    setWatermarkSource(next.watermarkSource ?? ProductWatermarkSource.Sku);
  };

  useEffect(() => {
    void ProductApi.getCatalogSettings()
      .then(applySettings)
      .catch((requestError) => setError(getApiErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, []);

  const chooseImage = (file: File | undefined, target: 'logo' | 'watermark') => {
    if (!file) return;
    const nextError = validateImage(file);
    if (nextError) {
      setAssetError(nextError);
      return;
    }
    setAssetError(null);
    setSaved(false);
    if (target === 'logo') setShopLogoFile(file);
    else setWatermarkImageFile(file);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!settings || assetError || saving) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const next = await ProductApi.updateBrandingSettings({
        priceDeviationPercent: settings.priceDeviationPercent,
        shopLogoFile,
        watermarkEnabled,
        watermarkSource,
        watermarkImageFile,
      });
      applySettings(next);
      setShopLogoFile(null);
      setWatermarkImageFile(null);
      setSaved(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsShell
      title="Logo & watermark"
      description="Quản lý nhận diện của shop và cách đóng dấu lên ảnh sản phẩm mới."
    >
      <form onSubmit={save} className="overflow-hidden rounded-admin-panel border border-admin-border bg-admin-card">
        <section className="p-5 sm:p-7" aria-labelledby="logo-settings-title">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-admin-control bg-admin-muted text-admin-text-secondary">
              <Image size={20} aria-hidden="true" />
            </span>
            <div>
              <h3 id="logo-settings-title" className="text-base font-semibold text-admin-text-primary">Logo shop</h3>
              <p className="mt-1 max-w-[65ch] text-sm leading-6 text-admin-text-secondary">
                Logo được lưu trong kho ảnh hiện tại và có thể dùng làm nguồn watermark.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-[9rem_1fr] sm:items-center">
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-admin-control border border-admin-border bg-admin-muted/40">
              {logoPreview ? (
                <img src={logoPreview} alt="Xem trước logo shop" className="h-full w-full object-contain p-3" />
              ) : (
                <span className="px-3 text-center text-xs text-admin-text-muted">Chưa có logo</span>
              )}
            </div>
            <div>
              <label htmlFor="shop-logo-file" className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-admin-control border border-admin-border px-3 text-sm font-semibold text-admin-primary hover:bg-admin-muted">
                <UploadCloud size={16} aria-hidden="true" /> {logoPreview ? 'Thay logo' : 'Tải logo lên'}
              </label>
              <input
                id="shop-logo-file"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                disabled={saving}
                onChange={(event) => {
                  chooseImage(event.target.files?.[0], 'logo');
                  event.target.value = '';
                }}
              />
              <p className="mt-2 text-xs leading-5 text-admin-text-muted">
                JPG, PNG, WebP hoặc GIF; tối đa 10 MB. File mới chỉ được tải lên khi lưu.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-admin-border p-5 sm:p-7" aria-labelledby="watermark-settings-title">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-admin-control bg-admin-muted text-admin-text-secondary">
                <ShieldCheck size={20} aria-hidden="true" />
              </span>
              <div>
                <h3 id="watermark-settings-title" className="text-base font-semibold text-admin-text-primary">Watermark ảnh sản phẩm</h3>
                <p className="mt-1 max-w-[65ch] text-sm leading-6 text-admin-text-secondary">
                  Tắt watermark không xóa logo, ảnh đã tải lên hoặc lựa chọn nguồn hiện tại.
                </p>
              </div>
            </div>
            <label className="inline-flex min-h-10 cursor-pointer items-center gap-3 rounded-admin-control border border-admin-border px-3 text-sm font-semibold text-admin-text-primary">
              <input
                type="checkbox"
                role="switch"
                checked={watermarkEnabled}
                onChange={(event) => {
                  setWatermarkEnabled(event.target.checked);
                  setSaved(false);
                }}
                className="h-4 w-4 accent-admin-primary"
              />
              {watermarkEnabled ? 'Đang bật' : 'Đang tắt'}
            </label>
          </div>

          <fieldset className="mt-5" disabled={!watermarkEnabled || saving}>
            <legend className="text-sm font-medium text-admin-text-primary">Nguồn watermark</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {watermarkSources.map((source) => (
                <label
                  key={source.value}
                  className={`cursor-pointer rounded-admin-control border p-3 transition-colors ${watermarkSource === source.value ? 'border-admin-primary bg-admin-primary/5' : 'border-admin-border hover:bg-admin-muted/50'}`}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-admin-text-primary">
                    <input
                      type="radio"
                      name="watermark-source"
                      value={source.value}
                      checked={watermarkSource === source.value}
                      onChange={() => {
                        setWatermarkSource(source.value);
                        setSaved(false);
                      }}
                      className="accent-admin-primary"
                    />
                    {source.label}
                  </span>
                  <span className="mt-1 block pl-6 text-xs leading-5 text-admin-text-muted">{source.description}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {watermarkSource === ProductWatermarkSource.UploadedImage ? (
            <div className="mt-4">
              <label htmlFor="watermark-image-file" className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-admin-control border border-admin-border px-3 text-sm font-semibold text-admin-primary hover:bg-admin-muted">
                <UploadCloud size={16} aria-hidden="true" /> {uploadedPreview ? 'Thay ảnh watermark' : 'Tải ảnh watermark lên'}
              </label>
              <input
                id="watermark-image-file"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                disabled={saving}
                onChange={(event) => {
                  chooseImage(event.target.files?.[0], 'watermark');
                  event.target.value = '';
                }}
              />
            </div>
          ) : null}

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold text-admin-text-muted">Xem trước</p>
            <div className="relative aspect-[16/9] w-full max-w-xl overflow-hidden rounded-admin-control border border-admin-border bg-admin-muted/60">
              <div className="absolute inset-0 grid place-items-center text-sm text-admin-text-muted">Ảnh sản phẩm</div>
              {watermarkEnabled && watermarkSource === ProductWatermarkSource.Sku ? (
                <div className="absolute bottom-[5%] right-[4%] flex min-h-9 min-w-24 max-w-[55%] items-center justify-center rounded bg-white/80 px-3 py-2 text-center font-mono text-sm font-bold text-slate-900 shadow-sm">
                  LAMI-2026
                </div>
              ) : watermarkEnabled && watermarkAsset ? (
                <img src={watermarkAsset} alt="Xem trước watermark" className="absolute bottom-[5%] right-[4%] max-h-[20%] max-w-[28%] object-contain opacity-75" />
              ) : null}
            </div>
            {!watermarkEnabled ? (
              <p className="mt-2 text-xs text-admin-text-muted">Watermark đang tắt; ảnh sản phẩm sẽ được lưu nguyên bản.</p>
            ) : null}
            {missingSelectedAsset ? (
              <p className="mt-2 text-sm font-medium text-admin-status-warning" role="status">
                Chưa có {watermarkSource === ProductWatermarkSource.ShopLogo ? 'logo shop' : 'ảnh watermark'}. Bạn vẫn có thể lưu; ảnh sản phẩm sẽ được giữ nguyên cho đến khi bổ sung ảnh nguồn.
              </p>
            ) : null}
          </div>
        </section>

        <div className="border-t border-admin-border px-5 py-4 sm:px-7">
          {assetError ? <div className="mb-3"><SettingsStatus kind="error">{assetError}</SettingsStatus></div> : null}
          {error ? <div className="mb-3"><SettingsStatus kind="error">{error}</SettingsStatus></div> : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {saved ? (
              <p className="inline-flex items-center gap-2 text-sm font-medium text-admin-status-success" role="status">
                <CheckCircle2 size={17} aria-hidden="true" /> Đã lưu logo & watermark.
              </p>
            ) : <span />}
            <button
              type="submit"
              disabled={loading || saving || !settings || Boolean(assetError)}
              className="btn-press inline-flex min-h-11 items-center gap-2 rounded-admin-control bg-admin-primary px-5 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : null}
              {saving ? 'Đang lưu...' : 'Lưu logo & watermark'}
            </button>
          </div>
        </div>
      </form>
    </SettingsShell>
  );
};
