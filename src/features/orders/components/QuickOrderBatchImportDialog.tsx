import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import type { ProductDto } from '@/features/product/api/productApi';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { ordersApi } from '../api/ordersApi';
import type { QuickOrderDraft } from '../types/quickOrder.types';
import { formatOrderCurrency } from '../utils/orderListFormatters';
import { parseOrderText, type ParsedOrderText } from '../utils/orderTextParser';
import { buildQuickOrderDraft, toBatchCreatePayload } from '../utils/quickOrderDraft';

const inputClass =
  'min-h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 py-2 text-sm text-admin-text-primary placeholder:text-admin-text-muted transition-colors focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text';
const labelClass = 'mb-1 block text-xs font-medium text-admin-text-secondary';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

type BatchFailure = {
  clientDraftId?: string;
  index?: number;
  message: string;
};

const getBatchFailure = (error: unknown): BatchFailure => {
  const fallback = getApiErrorMessage(error);
  if (!axios.isAxiosError(error) || !isRecord(error.response?.data)) return { message: fallback };
  const batchError = error.response.data.batchError;
  if (!isRecord(batchError)) return { message: fallback };
  return {
    clientDraftId: typeof batchError.clientDraftId === 'string' ? batchError.clientDraftId : undefined,
    index: typeof batchError.index === 'number' ? batchError.index : undefined,
    message: typeof batchError.message === 'string' ? batchError.message : fallback,
  };
};

const formatDeliveryDate = (date: string) => {
  const [year, month, day] = date.split('-');
  return year && month && day ? `${day}/${month}/${year}` : date;
};

type QuickOrderBatchImportDialogProps = {
  channelId: string;
  products: ProductDto[];
  initialRecipientName?: string;
  initialOrdererName?: string;
  onClose: () => void;
  onSaved: (createdCount: number) => void;
};

export const QuickOrderBatchImportDialog: React.FC<QuickOrderBatchImportDialogProps> = ({
  channelId,
  products,
  initialRecipientName = '',
  initialOrdererName = '',
  onClose,
  onSaved,
}) => {
  const [sourceText, setSourceText] = useState('');
  const [parsed, setParsed] = useState<ParsedOrderText | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [recipientName, setRecipientName] = useState(initialRecipientName);
  const [ordererName, setOrdererName] = useState(initialOrdererName);
  const [queue, setQueue] = useState<QuickOrderDraft[]>([]);
  const [inputError, setInputError] = useState<string | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const applyLockRef = useRef(false);
  const saveLockRef = useRef(false);
  const queuedFingerprintsRef = useRef(new Set<string>());

  const requestClose = useCallback(() => {
    if (queue.length > 0) {
      setConfirmClose(true);
      return;
    }
    onClose();
  }, [onClose, queue.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (confirmClose) setConfirmClose(false);
      else requestClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmClose, requestClose]);

  const resetInput = () => {
    setSourceText('');
    setParsed(null);
    setFiles([]);
    setRecipientName('');
    setOrdererName('');
    setInputError(null);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const analyze = () => {
    const result = parseOrderText(sourceText);
    setParsed(result);
    if (!recipientName.trim() && result.recipientName) setRecipientName(result.recipientName);
    if (!ordererName.trim() && result.ordererName) setOrdererName(result.ordererName);
    setInputError(null);
  };

  const apply = () => {
    if (applyLockRef.current || !parsed) return;
    applyLockRef.current = true;
    setApplying(true);
    try {
      if (queuedFingerprintsRef.current.size >= 50) {
        setInputError('Mỗi batch chỉ được chứa tối đa 50 đơn. Hãy lưu danh sách hiện tại trước.');
        return;
      }
      const draft = buildQuickOrderDraft({
        parsed,
        sourceText,
        recipientName,
        ordererName,
        channelId,
        files,
        products,
      });
      if (!draft.isValid) {
        setInputError(draft.validationErrors.join(' '));
        return;
      }
      if (queuedFingerprintsRef.current.has(draft.fingerprint)) {
        setInputError('Đơn này đã có trong danh sách chờ.');
        return;
      }
      queuedFingerprintsRef.current.add(draft.fingerprint);
      setQueue((current) => [...current, draft]);
      setBatchError(null);
      resetInput();
    } finally {
      applyLockRef.current = false;
      setApplying(false);
    }
  };

  const removeDraft = (clientDraftId: string) => {
    setQueue((current) => {
      const removed = current.find((draft) => draft.clientDraftId === clientDraftId);
      if (removed) queuedFingerprintsRef.current.delete(removed.fingerprint);
      return current.filter((draft) => draft.clientDraftId !== clientDraftId);
    });
    setBatchError(null);
  };

  const saveAll = async () => {
    if (saveLockRef.current || queue.length === 0) return;
    const firstInvalid = queue.find((draft) => !draft.isValid);
    if (firstInvalid) {
      setBatchError('Danh sách còn đơn chưa hợp lệ. Hãy xóa và phân tích lại đơn được đánh dấu.');
      document.getElementById(`quick-draft-${firstInvalid.clientDraftId}`)?.scrollIntoView({ block: 'center' });
      return;
    }

    saveLockRef.current = true;
    setSaving(true);
    setBatchError(null);
    setQueue((current) => current.map((draft) => ({ ...draft, apiError: undefined })));
    try {
      const response = await ordersApi.createBatch(queue.map(toBatchCreatePayload));
      queuedFingerprintsRef.current.clear();
      setQueue([]);
      resetInput();
      onSaved(response.createdCount);
    } catch (requestError) {
      const failure = getBatchFailure(requestError);
      const failedDraft = failure.clientDraftId
        ? queue.find((draft) => draft.clientDraftId === failure.clientDraftId)
        : failure.index != null ? queue[failure.index] : undefined;
      setBatchError(failure.message);
      if (failedDraft) {
        setQueue((current) => current.map((draft) => draft.clientDraftId === failedDraft.clientDraftId
          ? { ...draft, apiError: failure.message }
          : draft));
        requestAnimationFrame(() => {
          document.getElementById(`quick-draft-${failedDraft.clientDraftId}`)?.scrollIntoView({ block: 'center' });
        });
      }
    } finally {
      saveLockRef.current = false;
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-import-title"
      onMouseDown={(event) => { if (event.target === event.currentTarget) requestClose(); }}
    >
      <div className="flex max-h-[96dvh] min-h-0 w-full max-w-6xl flex-col overflow-hidden rounded-t-admin-panel border border-admin-border bg-admin-card shadow-xl sm:max-h-[92dvh] sm:rounded-admin-panel">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-admin-border px-4 py-3 sm:px-5">
          <div>
            <h2 id="quick-import-title" className="text-base font-semibold text-admin-text-primary">Nhập nhiều đơn hàng</h2>
            <p className="mt-1 text-xs text-admin-text-muted">Phân tích từng đoạn chat, thêm vào danh sách chờ rồi lưu một lần.</p>
          </div>
          <button type="button" onClick={requestClose} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-admin-control hover:bg-admin-muted focus:outline-none focus:ring-2 focus:ring-admin-primary/25" aria-label="Đóng nhập nhiều đơn hàng">
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:overflow-hidden">
          <section className="min-w-0 border-b border-admin-border p-4 lg:overflow-y-auto lg:border-b-0 lg:border-r sm:p-5" aria-labelledby="quick-input-title">
            <h3 id="quick-input-title" className="text-sm font-semibold text-admin-text-primary">Nhập và phân tích</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="quick-recipient-name" className={labelClass}>Tên người nhận</label>
                <input id="quick-recipient-name" className={inputClass} value={recipientName} onChange={(event) => setRecipientName(event.target.value)} placeholder="Nhập tên người nhận" />
              </div>
              <div>
                <label htmlFor="quick-orderer-name" className={labelClass}>Tên người đặt</label>
                <input id="quick-orderer-name" className={inputClass} value={ordererName} onChange={(event) => setOrdererName(event.target.value)} placeholder="Nhập tên người đặt" />
              </div>
            </div>
            <div className="mt-3">
              <label htmlFor="quick-import-text" className={labelClass}>Đoạn chat</label>
              <textarea
                ref={textareaRef}
                id="quick-import-text"
                autoFocus
                className={`${inputClass} min-h-44 resize-y`}
                value={sourceText}
                onChange={(event) => {
                  setSourceText(event.target.value);
                  setParsed(null);
                  setInputError(null);
                }}
                placeholder={'11/08 17h15-17h30\nBó 550, 50 ship cọc 200\n0352752593\n461 Phan Văn Trị, Phường An Nhơn'}
              />
            </div>

            <div className="mt-3 rounded-admin-control border border-dashed border-admin-border p-3">
              <label htmlFor="quick-import-images" className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-admin-control border border-admin-border px-3 text-xs font-semibold text-admin-primary hover:bg-admin-muted focus-within:ring-2 focus-within:ring-admin-primary/20">
                <ImagePlus size={15} aria-hidden="true" /> Thêm ảnh chụp chat
              </label>
              <input
                id="quick-import-images"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="sr-only"
                onChange={(event) => {
                  const nextFiles = Array.from(event.target.files ?? []);
                  setFiles((current) => [...current, ...nextFiles]);
                  setInputError(null);
                  event.target.value = '';
                }}
              />
              {files.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {files.map((file, index) => (
                    <li key={`${file.name}-${file.lastModified}-${index}`} className="flex min-w-0 items-center justify-between gap-2 text-xs text-admin-text-secondary">
                      <span className="truncate">{file.name}</span>
                      <button type="button" onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} className="min-h-8 shrink-0 rounded-admin-control px-2 font-semibold text-admin-status-error hover:bg-red-50" aria-label={`Bỏ ảnh ${file.name}`}>Bỏ</button>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-xs leading-5 text-admin-text-muted">Ảnh được giữ cục bộ và gắn vào đúng đơn khi lưu batch.</p>}
            </div>

            <button type="button" onClick={analyze} disabled={!sourceText.trim()} className="mt-3 min-h-10 rounded-admin-control border border-admin-primary/35 px-4 text-sm font-semibold text-admin-primary hover:bg-admin-primary/8 disabled:cursor-not-allowed disabled:opacity-50">Phân tích</button>

            {parsed ? (
              <div className="mt-4 rounded-admin-control bg-admin-muted p-3 text-sm" aria-label="Kết quả nhận diện">
                <h4 className="text-xs font-semibold text-admin-text-primary">Kết quả nhận diện</h4>
                <dl className="mt-2 grid gap-x-4 gap-y-2 sm:grid-cols-2">
                  {Object.entries({
                    'Người nhận': recipientName || parsed.recipientName,
                    'Người đặt': ordererName || parsed.ordererName,
                    Ngày: parsed.deliveryDate,
                    'Thời gian': [parsed.deliveryStartTime, parsed.deliveryEndTime].filter(Boolean).join(' - '),
                    'Gợi ý sản phẩm': parsed.productHint,
                    Giá: parsed.price ? formatOrderCurrency(parsed.price) : undefined,
                    Ship: parsed.shippingFee != null ? formatOrderCurrency(parsed.shippingFee) : undefined,
                    Cọc: parsed.deposit != null ? formatOrderCurrency(parsed.deposit) : undefined,
                    'SĐT người nhận': parsed.phone,
                    'Địa chỉ': parsed.address,
                    Thiệp: parsed.cardMessage,
                    Banner: parsed.bannerMessage,
                  }).filter(([, value]) => value).map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="text-xs font-semibold text-admin-text-muted">{label}</dt>
                      <dd className="mt-0.5 break-words text-admin-text-primary">{value}</dd>
                    </div>
                  ))}
                </dl>
                {parsed.warnings.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-xs leading-5 text-admin-status-warning">
                    {parsed.warnings.map((warning) => <li key={warning}>• {warning}</li>)}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {inputError ? <p className="mt-3 rounded-admin-control border border-admin-status-error/30 bg-red-50 px-3 py-2 text-xs leading-5 text-admin-status-error" role="alert">{inputError}</p> : null}
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={apply} disabled={!parsed || applying} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
                {applying ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" /> : null}
                Áp dụng
              </button>
            </div>
          </section>

          <section className="flex min-h-[24rem] min-w-0 flex-col bg-admin-muted/35 lg:min-h-0" aria-labelledby="quick-queue-title">
            <div className="shrink-0 border-b border-admin-border bg-admin-card px-4 py-3 sm:px-5">
              <h3 id="quick-queue-title" className="text-sm font-semibold text-admin-text-primary">Danh sách đơn chờ ({queue.length})</h3>
              <p className="mt-1 text-xs text-admin-text-muted">Tối đa 50 đơn mỗi lần lưu.</p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4" data-testid="quick-order-queue">
              {queue.length === 0 ? (
                <div className="flex min-h-48 items-center justify-center rounded-admin-control border border-dashed border-admin-border bg-admin-card px-5 text-center text-sm leading-6 text-admin-text-muted">
                  Chưa có đơn chờ. Phân tích và áp dụng đơn đầu tiên ở panel bên trái.
                </div>
              ) : (
                <ol className="space-y-2.5">
                  {queue.map((draft, index) => {
                    const item = draft.items[0];
                    return (
                      <li
                        id={`quick-draft-${draft.clientDraftId}`}
                        key={draft.clientDraftId}
                        className={`rounded-admin-control border bg-admin-card p-3 ${draft.apiError ? 'border-admin-status-error ring-1 ring-admin-status-error/15' : 'border-admin-border'}`}
                      >
                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="text-sm font-semibold tabular-nums text-admin-text-primary">#{index + 1}</span>
                              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${draft.warnings.length > 0 ? 'text-admin-status-warning' : 'text-admin-status-success'}`}>
                                {draft.warnings.length > 0 ? <AlertTriangle size={12} aria-hidden="true" /> : <CheckCircle2 size={12} aria-hidden="true" />}
                                {draft.warnings.length > 0 ? 'Cần kiểm tra' : 'Hợp lệ'}
                              </span>
                            </div>
                            <p className="mt-1 text-xs font-medium tabular-nums text-admin-text-secondary">
                              {formatDeliveryDate(draft.deliveryDate)} • {draft.deliveryStartTime}{draft.deliveryEndTime ? `-${draft.deliveryEndTime}` : ''}
                            </p>
                            <p className="mt-1 truncate text-sm font-medium text-admin-text-primary" title={`${draft.recipientName} - ${draft.recipientPhone}`}>{draft.recipientName} - {draft.recipientPhone}</p>
                            {draft.deliveryAddress ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-admin-text-secondary">{draft.deliveryAddress}</p> : null}
                            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs tabular-nums text-admin-text-secondary">
                              <span className="font-medium text-admin-text-primary">{item?.productName || item?.productHint} • {formatOrderCurrency(item?.unitPrice ?? 0)}</span>
                              <span>Ship {formatOrderCurrency(draft.shippingFee)}</span>
                              <span>Cọc {draft.deposit != null ? formatOrderCurrency(draft.deposit) : 'mặc định'}</span>
                              {draft.attachments.length > 0 ? <span>{draft.attachments.length} ảnh</span> : null}
                            </div>
                            {draft.warnings.length > 0 ? <p className="mt-2 text-[11px] leading-4 text-admin-status-warning">{draft.warnings.join(' ')}</p> : null}
                            {draft.apiError ? <p className="mt-2 text-xs font-medium leading-5 text-admin-status-error" role="alert">{draft.apiError}</p> : null}
                          </div>
                          <button type="button" onClick={() => removeDraft(draft.clientDraftId)} disabled={saving} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-admin-control text-admin-status-error hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-admin-status-error/20 disabled:opacity-50" aria-label={`Xóa đơn chờ ${index + 1}`}>
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
            <footer className="sticky bottom-0 shrink-0 border-t border-admin-border bg-admin-card px-4 py-3 sm:px-5">
              {batchError ? <p className="mb-2 text-xs leading-5 text-admin-status-error" role="alert">{batchError}</p> : null}
              <button type="button" onClick={() => void saveAll()} disabled={queue.length === 0 || saving} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
                {saving ? 'Đang lưu batch' : `Lưu ${queue.length} đơn`}
              </button>
            </footer>
          </section>
        </div>
      </div>

      {confirmClose ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/35 p-4" role="alertdialog" aria-modal="true" aria-labelledby="quick-close-title">
          <div className="w-full max-w-md rounded-admin-panel border border-admin-border bg-admin-card p-5 shadow-xl">
            <h3 id="quick-close-title" className="text-base font-semibold text-admin-text-primary">Bỏ {queue.length} đơn chưa lưu?</h3>
            <p className="mt-2 text-sm leading-6 text-admin-text-secondary">Đóng cửa sổ sẽ làm mất toàn bộ danh sách đơn chờ.</p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setConfirmClose(false)} className="min-h-10 rounded-admin-control border border-admin-border px-4 text-sm font-semibold text-admin-text-primary hover:bg-admin-muted">Tiếp tục nhập</button>
              <button type="button" onClick={onClose} className="min-h-10 rounded-admin-control bg-admin-status-error px-4 text-sm font-semibold text-white hover:opacity-90">Bỏ dữ liệu và đóng</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
