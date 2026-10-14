import React, { useEffect, useState } from 'react';
import { CheckCircle2, Flower2, Loader2 } from '@/shared/icons/lucideAnimated';
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
      hideContentHeader
    >
      <form onSubmit={save} className="overflow-hidden rounded-admin-panel border border-admin-border bg-admin-card">
        <header className="border-b border-admin-border px-5 py-4">
          <h3 className="text-base font-semibold text-admin-text-primary">Logo & watermark</h3>
        </header>

        <div className="grid gap-6 p-5 lg:grid-cols-2 lg:gap-5">
          <section aria-labelledby="logo-settings-title">
            <h4 id="logo-settings-title" className="text-sm font-semibold text-admin-text-primary">Logo cửa hàng</h4>
            <div className="mt-4 flex min-h-36 items-center justify-center overflow-hidden rounded-admin-control border border-admin-border bg-admin-card">
              {logoPreview ? (
                <img src={logoPreview} alt="Xem trước logo shop" className="max-h-28 max-w-[75%] object-contain" />
              ) : (
                <div className="text-center">
                  <p className="font-serif text-4xl tracking-[-0.04em] text-admin-text-primary">lamie.</p>
                  <p className="mt-2 text-xs text-admin-text-muted">Logo minh họa</p>
                </div>
              )}
            </div>

            <label htmlFor="shop-logo-file" className="mb-1.5 mt-5 block text-sm font-medium text-admin-text-primary">Tải logo mới</label>
            <input
              id="shop-logo-file"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
              disabled={saving}
              onChange={(event) => chooseImage(event.target.files?.[0], 'logo')}
              className="block min-h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 py-2 text-sm file:mr-3 file:rounded-admin-control file:border file:border-admin-border file:bg-admin-card file:px-3 file:py-1 file:text-xs file:font-semibold"
            />

            <label className="mt-5 flex min-h-10 cursor-pointer items-center gap-3 text-sm text-admin-text-secondary">
              <input
                type="checkbox"
                role="switch"
                aria-label={watermarkEnabled ? 'Đang bật watermark ảnh sản phẩm' : 'Đang tắt watermark ảnh sản phẩm'}
                checked={watermarkEnabled}
                onChange={(event) => {
                  setWatermarkEnabled(event.target.checked);
                  setSaved(false);
                }}
                className="h-4 w-4 accent-admin-primary"
              />
              Bật watermark ảnh sản phẩm
            </label>

            <label htmlFor="watermark-source" className="mb-1.5 mt-4 block text-sm font-medium text-admin-text-primary">Nguồn watermark</label>
            <select
              id="watermark-source"
              value={watermarkSource}
              disabled={!watermarkEnabled || saving}
              onChange={(event) => {
                setWatermarkSource(Number(event.target.value) as ProductWatermarkSource);
                setSaved(false);
              }}
              className="h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 text-sm outline-none focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/15 disabled:bg-admin-disabled-bg"
            >
              {watermarkSources.map((source) => <option key={source.value} value={source.value}>{source.label}</option>)}
            </select>

            {watermarkSource === ProductWatermarkSource.UploadedImage ? (
              <div className="mt-4">
                <label htmlFor="watermark-image-file" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Ảnh watermark riêng</label>
                <input
                  id="watermark-image-file"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                  disabled={saving}
                  onChange={(event) => chooseImage(event.target.files?.[0], 'watermark')}
                  className="block min-h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 py-2 text-sm"
                />
              </div>
            ) : null}
          </section>

          <section aria-labelledby="watermark-preview-title">
            <h4 id="watermark-preview-title" className="text-sm font-semibold text-admin-text-primary">Xem trước watermark</h4>
            <div className="relative mt-4 aspect-[16/6] w-full overflow-hidden rounded-admin-control bg-[#ead8d1]">
              <div className="absolute inset-0 grid place-items-center text-admin-text-secondary/70">
                <Flower2 size={48} strokeWidth={1.5} aria-hidden="true" />
              </div>
              {watermarkEnabled && watermarkSource === ProductWatermarkSource.Sku ? (
                <div className="absolute bottom-[7%] right-[4%] font-serif text-xl text-admin-text-secondary">LAMI-2026</div>
              ) : watermarkEnabled && watermarkAsset ? (
                <img src={watermarkAsset} alt="Xem trước watermark" className="absolute bottom-[7%] right-[4%] max-h-[22%] max-w-[30%] object-contain opacity-75" />
              ) : null}
            </div>
            <p className="mt-3 text-xs leading-5 text-admin-text-secondary">Tắt watermark không xóa logo hoặc ảnh nguồn.</p>
            {!watermarkEnabled ? <p className="mt-2 text-xs text-admin-text-muted">Watermark đang tắt; ảnh sản phẩm sẽ được lưu nguyên bản.</p> : null}
            {missingSelectedAsset ? (
              <p className="mt-3 rounded-admin-control bg-admin-status-warning/10 px-3 py-2 text-xs leading-5 text-admin-status-warning" role="status">
                Chưa có {watermarkSource === ProductWatermarkSource.ShopLogo ? 'logo shop' : 'ảnh watermark'}. Ảnh sản phẩm sẽ được giữ nguyên cho đến khi bổ sung ảnh nguồn.
              </p>
            ) : null}
          </section>
        </div>

        <div className="border-t border-admin-border px-5 py-4">
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
              aria-label="Lưu logo & watermark"
              disabled={loading || saving || !settings || Boolean(assetError)}
              className="btn-press inline-flex min-h-11 items-center gap-2 rounded-admin-control bg-admin-primary px-5 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : null}
              {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
            </button>
          </div>
        </div>
      </form>
    </SettingsShell>
  );
};
