import React, { useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardPaste, LoaderCircle } from 'lucide-react';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { administrativeAddressApi } from '../api/administrativeAddressApi';
import type { AddressResolutionDto } from '../types/administrativeAddress.types';

type Props = {
  disabled?: boolean;
  onResolved: (resolution: AddressResolutionDto) => void;
  onBusyChange?: (busy: boolean) => void;
};

const inputClass =
  'min-h-20 w-full resize-y rounded-admin-control border border-admin-input-border bg-admin-card px-3 py-2.5 text-sm leading-5 text-admin-text-primary placeholder:text-admin-text-muted transition-colors focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text';

const confidenceLabel = (result: AddressResolutionDto) => result.isConfident
  ? 'Tin cậy cao'
  : 'Cần kiểm tra';

export const AddressAutoImport: React.FC<Props> = ({
  disabled = false,
  onResolved,
  onBusyChange,
}) => {
  const [rawText, setRawText] = useState('');
  const [resolution, setResolution] = useState<AddressResolutionDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const resolve = async (text: string) => {
    const value = text.trim();
    if (!value) {
      setError('Hãy dán hoặc nhập địa chỉ cần phân tích.');
      return;
    }
    const requestId = ++requestIdRef.current;
    setRawText(value);
    setLoading(true);
    onBusyChange?.(true);
    setError(null);
    try {
      const result = await administrativeAddressApi.resolve(value);
      if (requestId !== requestIdRef.current) return;
      setResolution(result);
      onResolved(result);
    } catch (requestError) {
      if (requestId !== requestIdRef.current) return;
      setError(getApiErrorMessage(requestError));
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        onBusyChange?.(false);
      }
    }
  };

  const pasteAndResolve = async () => {
    if (rawText.trim()) {
      await resolve(rawText);
      return;
    }
    try {
      const clipboardText = await navigator.clipboard.readText();
      await resolve(clipboardText);
    } catch {
      setError('Trình duyệt chưa cho phép đọc clipboard. Hãy dán địa chỉ vào ô phía trên.');
    }
  };

  return (
    <section className="rounded-admin-control border border-admin-primary/20 bg-admin-primary/[0.035] p-3" aria-labelledby="address-auto-import-title">
      <div className="flex items-start gap-2.5">
        <ClipboardPaste size={16} className="mt-0.5 shrink-0 text-admin-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 id="address-auto-import-title" className="text-xs font-semibold text-admin-text-primary">Dán địa chỉ nhận</h3>
          <p className="mt-0.5 text-[11px] leading-4 text-admin-text-muted">Hệ thống tự chọn kết quả phù hợp nhất. Bạn vẫn có thể sửa các trường bên dưới.</p>
        </div>
      </div>
      <textarea
        id="address-auto-import"
        className={`${inputClass} mt-2.5`}
        disabled={disabled || loading}
        value={rawText}
        onChange={(event) => {
          setRawText(event.target.value);
          setResolution(null);
          setError(null);
        }}
        onPaste={(event) => {
          const pastedText = event.clipboardData.getData('text');
          if (pastedText.trim()) {
            event.preventDefault();
            void resolve(pastedText);
          }
        }}
        placeholder="Ví dụ: 80/3 Nguyễn Trãi, phường Chợ Quán"
        aria-label="Địa chỉ nhận cần tự động phân tích"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] leading-4 text-admin-text-muted">Không sử dụng vị trí hoặc bản đồ.</p>
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => void pasteAndResolve()}
          className="inline-flex min-h-9 items-center gap-2 rounded-admin-control bg-admin-primary px-3 text-xs font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover focus:outline-none focus:ring-2 focus:ring-admin-primary/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <LoaderCircle size={14} className="animate-spin" aria-hidden="true" /> : <ClipboardPaste size={14} aria-hidden="true" />}
          {loading ? 'Đang phân tích' : 'Dán & nhập tự động'}
        </button>
      </div>

      {resolution ? (
        <div className="mt-3 border-t border-admin-primary/15 pt-2.5 text-xs leading-5" aria-live="polite">
          {resolution.selectedCandidate ? (
            <>
              <div className={`flex items-start gap-2 ${resolution.isConfident ? 'text-admin-status-success' : 'text-admin-status-warning'}`}>
                {resolution.isConfident
                  ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                  : <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />}
                <div>
                  <p className="font-semibold">Đã tự điền · {confidenceLabel(resolution)} ({Math.round(resolution.confidence * 100)}%)</p>
                  <p className="text-admin-text-secondary">{resolution.selectedCandidate.fullAddress}</p>
                </div>
              </div>
              {resolution.candidates.length > 1 ? (
                <details className="mt-2 text-admin-text-secondary">
                  <summary className="cursor-pointer font-medium text-admin-primary">Xem {resolution.candidates.length} kết quả đã xếp hạng</summary>
                  <ol className="mt-1 space-y-1 pl-4">
                    {resolution.candidates.slice(0, 5).map((candidate, index) => (
                      <li key={`${candidate.scheme}-${candidate.districtCode ?? 'none'}-${candidate.communeCode ?? 'none'}`}>
                        {index + 1}. {candidate.fullAddress} · {Math.round(candidate.confidence * 100)}%
                      </li>
                    ))}
                  </ol>
                </details>
              ) : null}
            </>
          ) : (
            <div className="flex items-start gap-2 text-admin-status-warning">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>Không xác định được đơn vị hành chính. Nội dung đã dán vẫn được giữ ở địa chỉ chi tiết.</p>
            </div>
          )}
          {resolution.warnings.map((warning) => <p key={warning} className="mt-1 text-admin-status-warning">• {warning}</p>)}
        </div>
      ) : null}
      {error ? <p className="mt-2 text-xs leading-5 text-admin-status-error" role="alert">{error}</p> : null}
    </section>
  );
};
