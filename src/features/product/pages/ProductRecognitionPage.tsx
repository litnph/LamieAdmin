import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ImagePlus, Loader2, RefreshCw, ScanSearch, UploadCloud } from '@/shared/icons/lucideAnimated';
import { useNavigate } from 'react-router-dom';
import {
  ProductApi,
  type ProductRecognitionIndexStatus,
  type ProductRecognitionResponse,
} from '@/features/product/api/productApi';
import { PageHeader } from '@/shared/components/PageHeader';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { resolveApiResourceUrl } from '@/services/apiResourceUrl';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const ProductRecognitionPage: React.FC = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<ProductRecognitionIndexStatus | null>(null);
  const [response, setResponse] = useState<ProductRecognitionResponse | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [backfilling, setBackfilling] = useState(false);

  const loadStatus = async () => {
    try {
      setStatus(await ProductApi.getRecognitionStatus());
    } catch (error) {
      setRequestError(getApiErrorMessage(error));
    }
  };

  useEffect(() => {
    void loadStatus();
  }, []);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const chooseFile = (nextFile?: File) => {
    setFileError(null);
    setRequestError(null);
    setResponse(null);
    setFile(null);
    setPreviewUrl(null);
    if (!nextFile) return;
    if (!ACCEPTED_TYPES.has(nextFile.type)) {
      setFileError('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.');
      return;
    }
    if (nextFile.size <= 0 || nextFile.size > MAX_IMAGE_BYTES) {
      setFileError('Ảnh phải có dung lượng lớn hơn 0 và không quá 10 MB.');
      return;
    }
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
  };

  const analyze = async () => {
    if (!file || analyzing) return;
    setAnalyzing(true);
    setRequestError(null);
    setResponse(null);
    try {
      setResponse(await ProductApi.recognizeImage(file));
    } catch (error) {
      setRequestError(getApiErrorMessage(error));
    } finally {
      setAnalyzing(false);
    }
  };

  const backfill = async () => {
    if (backfilling) return;
    setBackfilling(true);
    setRequestError(null);
    try {
      const result = await ProductApi.backfillRecognition();
      await loadStatus();
      if (result.warnings.length) setRequestError(result.warnings.join(' '));
    } catch (error) {
      setRequestError(getApiErrorMessage(error));
    } finally {
      setBackfilling(false);
    }
  };

  return (
    <div className="mx-auto max-w-admin-content pb-10">
      <PageHeader
        title="Nhận diện sản phẩm bằng ảnh"
        description="Tải một ảnh chưa có watermark để tìm tối đa 5 sản phẩm có hình ảnh gần giống nhất trong catalog."
        actions={(
          <button type="button" onClick={() => navigate('/admin/products')} className="inline-flex min-h-11 items-center gap-2 rounded-admin-control border border-admin-border bg-admin-card px-4 text-sm font-semibold text-admin-text-primary hover:bg-admin-muted">
            <ArrowLeft size={17} aria-hidden="true" /> Sản phẩm
          </button>
        )}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(20rem,.8fr)_minmax(30rem,1.2fr)]">
        <section className="rounded-admin-panel border border-admin-border bg-admin-card p-4 sm:p-6" aria-labelledby="recognition-upload-heading">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="recognition-upload-heading" className="text-base font-semibold text-admin-text-primary">Ảnh cần nhận diện</h2>
              <p className="mt-1 text-sm leading-6 text-admin-text-secondary">JPG, PNG hoặc WebP, tối đa 10 MB.</p>
            </div>
            <ScanSearch className="shrink-0 text-admin-primary" size={24} strokeWidth={1.6} aria-hidden="true" />
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              chooseFile(event.dataTransfer.files[0]);
            }}
            className="mt-5 flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-admin-control border border-dashed border-admin-border bg-admin-muted/30 transition-colors hover:border-admin-primary/55 hover:bg-admin-primary/5"
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Ảnh sản phẩm cần nhận diện" className="h-full w-full object-contain" />
            ) : (
              <span className="flex flex-col items-center px-6 text-center text-admin-text-secondary">
                <ImagePlus size={34} strokeWidth={1.4} className="text-admin-primary" aria-hidden="true" />
                <span className="mt-3 text-sm font-semibold text-admin-text-primary">Chọn hoặc kéo thả ảnh</span>
                <span className="mt-1 text-xs leading-5">Ảnh rõ sản phẩm và ít vật thể nền sẽ cho kết quả ổn định hơn.</span>
              </span>
            )}
          </button>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} />

          {file ? <p className="mt-3 truncate text-xs text-admin-text-muted">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p> : null}
          {fileError ? <p className="mt-3 text-sm text-admin-status-error" role="alert">{fileError}</p> : null}

          <button type="button" onClick={() => void analyze()} disabled={!file || analyzing} className="btn-press mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
            {analyzing ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <UploadCloud size={18} aria-hidden="true" />}
            {analyzing ? 'Đang phân tích hình ảnh...' : 'Tìm sản phẩm gần giống'}
          </button>

          <div className="mt-5 border-t border-admin-border pt-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-admin-text-secondary">Catalog đã lập chỉ mục</span>
              <span className="font-mono font-semibold tabular-nums text-admin-text-primary">{status ? `${status.indexedProductCount}/${status.activeProductCount}` : '...'}</span>
            </div>
            {status?.pendingImageCount ? (
              <button type="button" onClick={() => void backfill()} disabled={backfilling} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-admin-control border border-admin-border px-3 text-sm font-semibold text-admin-primary hover:bg-admin-muted disabled:opacity-50">
                <RefreshCw size={16} className={backfilling ? 'animate-spin' : ''} aria-hidden="true" />
                {backfilling ? 'Đang lập chỉ mục...' : `Lập chỉ mục ${status.pendingImageCount} ảnh còn thiếu`}
              </button>
            ) : null}
          </div>
        </section>

        <section className="min-h-[30rem] rounded-admin-panel border border-admin-border bg-admin-card p-4 sm:p-6" aria-labelledby="recognition-results-heading" aria-busy={analyzing}>
          <h2 id="recognition-results-heading" className="text-base font-semibold text-admin-text-primary">Kết quả gần giống</h2>
          <p className="mt-1 text-sm leading-6 text-admin-text-secondary">Điểm tương đồng mô tả mức độ gần nhau về hình ảnh, không phải độ chính xác tuyệt đối.</p>

          {requestError ? <div className="mt-5 rounded-admin-control border border-admin-status-error/25 bg-red-50 px-4 py-3 text-sm leading-6 text-admin-status-error" role="alert">{requestError}</div> : null}
          {analyzing ? (
            <div className="mt-6 space-y-3">
              {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-admin-control bg-admin-muted" />)}
            </div>
          ) : response ? (
            response.results.length ? (
              <ol className="mt-6 space-y-3">
                {response.results.map((result, index) => (
                  <li key={result.productId}>
                    <button type="button" onClick={() => navigate(`/admin/products/${result.productId}/edit`)} className="group grid w-full grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-4 rounded-admin-control border border-admin-border p-3 text-left transition-colors hover:border-admin-primary/35 hover:bg-admin-primary/5">
                      <div className="aspect-square overflow-hidden rounded-md bg-admin-muted">
                        {result.thumbnailUrl ? <img src={resolveApiResourceUrl(result.thumbnailUrl)} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><ImagePlus size={22} className="text-admin-text-muted" aria-hidden="true" /></div>}
                      </div>
                      <span className="min-w-0">
                        <span className="block text-xs font-medium text-admin-text-muted">#{index + 1} · {result.sku}</span>
                        <span className="mt-1 block truncate text-sm font-semibold text-admin-text-primary group-hover:text-admin-primary">{result.name}</span>
                      </span>
                      <span className="rounded-full border border-admin-primary/20 bg-admin-primary/8 px-2.5 py-1 font-mono text-xs font-semibold tabular-nums text-admin-primary">{result.similarityPercent.toFixed(1)}%</span>
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="mt-8 rounded-admin-control border border-dashed border-admin-border bg-admin-muted/20 px-6 py-10 text-center">
                <p className="text-sm font-semibold text-admin-text-primary">Chưa có kết quả đủ tin cậy</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-admin-text-secondary">Thử ảnh rõ hơn hoặc lập chỉ mục các ảnh catalog còn thiếu. Hệ thống không chèn kết quả ngẫu nhiên dưới ngưỡng {response.minimumSimilarityPercent}%.</p>
              </div>
            )
          ) : (
            <div className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-admin-control border border-dashed border-admin-border bg-admin-muted/20 px-6 text-center">
              <ScanSearch size={38} strokeWidth={1.3} className="text-admin-text-muted" aria-hidden="true" />
              <p className="mt-4 text-sm font-semibold text-admin-text-primary">Kết quả sẽ xuất hiện tại đây</p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-admin-text-secondary">Chọn một ảnh ở bên trái để bắt đầu so sánh với catalog hiện tại.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
