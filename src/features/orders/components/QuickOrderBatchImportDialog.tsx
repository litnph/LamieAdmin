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
import type { ChannelDto } from '@/features/settings/channels/api/channelsApi';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { ordersApi } from '../api/ordersApi';
import { administrativeAddressApi } from '../api/administrativeAddressApi';
import { chatScreenshotApi } from '../api/chatScreenshotApi';
import type {
  AdministrativeAddressField,
  AdministrativeAddressValue,
  AddressResolutionDto,
} from '../types/administrativeAddress.types';
import { ChatPlatform, type ChatPlatform as ChatPlatformValue, type ChatScreenshotAnalysis } from '../types/chatScreenshot.types';
import type {
  QuickOrderDraft,
  QuickOrderReviewErrors,
  QuickOrderReviewField,
  QuickOrderReviewState,
} from '../types/quickOrder.types';
import { quickOrderReviewFields } from '../types/quickOrder.types';
import { formatOrderCurrency } from '../utils/orderListFormatters';
import { parseOrderText, type ParsedOrderText } from '../utils/orderTextParser';
import { buildQuickOrderDraft, toBatchCreatePayload } from '../utils/quickOrderDraft';
import {
  appendUniqueQuickOrderFiles,
  quickOrderFileSetKey,
  quickOrderMaximumImageCount,
  validateQuickOrderFiles,
} from '../utils/quickOrderFiles';
import {
  createQuickOrderReview,
  createQuickOrderAddress,
  mergeQuickOrderReviewSuggestions,
  quickOrderReviewFieldIds,
  reviewSuggestionsFromParsed,
  validateQuickOrderReview,
} from '../utils/quickOrderReview';
import { QuickOrderReviewForm } from './QuickOrderReviewForm';

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

const normalizeChannel = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/gi, 'd')
  .toLocaleLowerCase('vi');

const platformLabel = (platform: ChatPlatformValue) => ({
  [ChatPlatform.Unknown]: 'Không xác định',
  [ChatPlatform.Zalo]: 'Zalo',
  [ChatPlatform.Meta]: 'Meta / Messenger',
  [ChatPlatform.TikTok]: 'TikTok',
})[platform];

const findChannelForPlatform = (channels: readonly ChannelDto[], platform: ChatPlatformValue) => {
  const aliases = platform === ChatPlatform.Zalo
    ? ['zalo']
    : platform === ChatPlatform.Meta
      ? ['meta', 'messenger', 'facebook']
      : platform === ChatPlatform.TikTok ? ['tiktok'] : [];
  return channels.find((channel) => channel.isActive && aliases.some((alias) =>
    normalizeChannel(`${channel.code} ${channel.name}`).includes(alias)));
};

const confidenceLabel = (confidence: number) => {
  if (confidence >= .8) return 'Tin cậy cao';
  if (confidence >= .5) return 'Cần kiểm tra';
  return 'Không chắc chắn';
};

const confidencePercent = (confidence: number) =>
  Math.round(Math.min(1, Math.max(0, confidence)) * 100);

const addressValueFromResolution = (
  resolution: AddressResolutionDto,
  fallbackDetail: string,
): AdministrativeAddressValue => {
  const candidate = resolution.selectedCandidate;
  if (!candidate) return createQuickOrderAddress(fallbackDetail);
  return {
    scheme: candidate.scheme,
    provinceCode: candidate.provinceCode ?? '',
    provinceName: candidate.provinceName ?? '',
    districtCode: candidate.districtCode ?? '',
    districtName: candidate.districtName ?? '',
    communeCode: candidate.communeCode ?? '',
    communeName: candidate.communeName ?? '',
    detail: candidate.addressDetail?.trim() || fallbackDetail,
  };
};

type AnalysisStatus = 'idle' | 'running' | 'complete' | 'failed';

type QuickOrderBatchImportDialogProps = {
  channelId: string;
  channels: ChannelDto[];
  products: ProductDto[];
  initialRecipientName?: string;
  initialOrdererName?: string;
  onClose: () => void;
  onSaved: (createdCount: number) => void;
};

export const QuickOrderBatchImportDialog: React.FC<QuickOrderBatchImportDialogProps> = ({
  channelId,
  channels,
  products,
  initialRecipientName = '',
  initialOrdererName = '',
  onClose,
  onSaved,
}) => {
  const initialReview = createQuickOrderReview(channelId, initialRecipientName, initialOrdererName);
  const initialAdministrativeAddress = createQuickOrderAddress();
  const initialDirtyFields: QuickOrderReviewField[] = [];
  if (initialRecipientName.trim()) initialDirtyFields.push('recipientName');
  if (initialOrdererName.trim()) initialDirtyFields.push('ordererName');
  const [sourceText, setSourceText] = useState('');
  const [parsed, setParsed] = useState<ParsedOrderText | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [addressAnalysis, setAddressAnalysis] = useState<AddressResolutionDto | null>(null);
  const [screenshotAnalysis, setScreenshotAnalysis] = useState<ChatScreenshotAnalysis | null>(null);
  const [suggestedChannelId, setSuggestedChannelId] = useState<string | undefined>();
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle');
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [review, setReview] = useState<QuickOrderReviewState>(initialReview);
  const [reviewErrors, setReviewErrors] = useState<QuickOrderReviewErrors>({});
  const [administrativeAddress, setAdministrativeAddress] = useState<AdministrativeAddressValue>(initialAdministrativeAddress);
  const [administrativeAddressInvalidField, setAdministrativeAddressInvalidField] = useState<AdministrativeAddressField>();
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
  const reviewRef = useRef<QuickOrderReviewState>(initialReview);
  const administrativeAddressRef = useRef<AdministrativeAddressValue>(initialAdministrativeAddress);
  const dirtyFieldsRef = useRef(new Set<QuickOrderReviewField>(initialDirtyFields));
  const analysisRequestRef = useRef(0);
  const analysisAbortRef = useRef<AbortController | null>(null);
  const screenshotCacheRef = useRef(new Map<string, ChatScreenshotAnalysis>());

  const requestClose = useCallback(() => {
    if (queue.length > 0) {
      setConfirmClose(true);
      return;
    }
    onClose();
  }, [onClose, queue.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      if (confirmClose) setConfirmClose(false);
      else requestClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmClose, requestClose]);

  useEffect(() => () => {
    analysisRequestRef.current += 1;
    analysisAbortRef.current?.abort();
  }, []);

  const invalidatePendingAnalysis = () => {
    analysisRequestRef.current += 1;
    analysisAbortRef.current?.abort();
    analysisAbortRef.current = null;
    setAnalysisStatus('idle');
  };

  const replaceReview = (next: QuickOrderReviewState) => {
    reviewRef.current = next;
    setReview(next);
  };

  const replaceAdministrativeAddress = (next: AdministrativeAddressValue) => {
    administrativeAddressRef.current = next;
    setAdministrativeAddress(next);
  };

  const mergeSuggestions = (suggestions: Partial<QuickOrderReviewState>) => {
    replaceReview(mergeQuickOrderReviewSuggestions(
      reviewRef.current,
      suggestions,
      dirtyFieldsRef.current,
    ));
  };

  const updateReview = (field: QuickOrderReviewField, value: string) => {
    dirtyFieldsRef.current.add(field);
    const next = { ...reviewRef.current };
    Object.assign(next, { [field]: value });
    replaceReview(next);
    setReviewErrors((current) => {
      if (!current[field]) return current;
      const updated = { ...current };
      delete updated[field];
      return updated;
    });
    setInputError(null);
    if (field === 'address') setAddressAnalysis(null);
  };

  const updateAdministrativeAddress = (next: AdministrativeAddressValue) => {
    dirtyFieldsRef.current.add('address');
    replaceAdministrativeAddress(next);
    replaceReview({ ...reviewRef.current, address: next.detail });
    setAddressAnalysis(null);
    setAdministrativeAddressInvalidField(undefined);
    setReviewErrors((current) => {
      if (!current.address) return current;
      const updated = { ...current };
      delete updated.address;
      return updated;
    });
    setInputError(null);
  };

  const resetInput = () => {
    invalidatePendingAnalysis();
    setSourceText('');
    setParsed(null);
    setFiles([]);
    setAddressAnalysis(null);
    setScreenshotAnalysis(null);
    setSuggestedChannelId(undefined);
    setScreenshotError(null);
    const nextReview = createQuickOrderReview(channelId);
    replaceAdministrativeAddress(createQuickOrderAddress());
    dirtyFieldsRef.current.clear();
    replaceReview(nextReview);
    setReviewErrors({});
    setAdministrativeAddressInvalidField(undefined);
    setInputError(null);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const analyze = async () => {
    const fileErrors = validateQuickOrderFiles(files);
    if (fileErrors.length > 0) {
      setInputError(fileErrors.join(' '));
      document.getElementById('quick-import-images')?.focus();
      return;
    }

    analysisAbortRef.current?.abort();
    const requestId = analysisRequestRef.current + 1;
    analysisRequestRef.current = requestId;
    const abortController = new AbortController();
    analysisAbortRef.current = abortController;

    const result = parseOrderText(sourceText);
    setParsed(result);
    mergeSuggestions(reviewSuggestionsFromParsed(result));
    if (!dirtyFieldsRef.current.has('address')) {
      replaceAdministrativeAddress(createQuickOrderAddress(result.address ?? ''));
    }
    setInputError(null);
    setReviewErrors({});
    setAdministrativeAddressInvalidField(undefined);
    setScreenshotError(null);
    setAddressAnalysis(null);
    setScreenshotAnalysis(null);
    setSuggestedChannelId(undefined);
    setAnalysisStatus('running');

    const addressToResolve = (
      dirtyFieldsRef.current.has('address')
        ? administrativeAddressRef.current.detail
        : result.address ?? ''
    ).trim();

    const addressPromise = addressToResolve && !dirtyFieldsRef.current.has('address')
      ? administrativeAddressApi.resolve(addressToResolve, undefined, abortController.signal)
      : Promise.resolve<AddressResolutionDto | null>(null);

    const screenshotKey = quickOrderFileSetKey(files);
    const cachedScreenshot = screenshotKey ? screenshotCacheRef.current.get(screenshotKey) : undefined;
    const screenshotPromise = files.length === 0
      ? Promise.resolve<ChatScreenshotAnalysis | null>(null)
      : cachedScreenshot
        ? Promise.resolve<ChatScreenshotAnalysis | null>(cachedScreenshot)
        : chatScreenshotApi.analyze(files, abortController.signal).then((analysis) => {
          screenshotCacheRef.current.set(screenshotKey, analysis);
          return analysis;
        });

    let addressFinished = false;
    let screenshotFinished = false;
    const releaseAbortController = () => {
      if (addressFinished
        && screenshotFinished
        && analysisAbortRef.current === abortController) {
        analysisAbortRef.current = null;
      }
    };
    const addressTask = addressPromise
      .then((resolvedAddress) => {
        if (requestId !== analysisRequestRef.current || abortController.signal.aborted) return;
        if (resolvedAddress
          && !dirtyFieldsRef.current.has('address')
          && normalizeChannel(administrativeAddressRef.current.detail) === normalizeChannel(addressToResolve)) {
          setAddressAnalysis(resolvedAddress);
          const nextAddress = addressValueFromResolution(resolvedAddress, addressToResolve);
          replaceAdministrativeAddress(nextAddress);
          mergeSuggestions({ address: nextAddress.detail });
        }
      })
      .catch(() => undefined)
      .finally(() => {
        addressFinished = true;
        releaseAbortController();
      });
    void addressTask;

    try {
      const resolvedScreenshot = await screenshotPromise;
      if (requestId !== analysisRequestRef.current || abortController.signal.aborted) return;

      if (resolvedScreenshot) {
        setScreenshotAnalysis(resolvedScreenshot);
        const matchingChannel = findChannelForPlatform(channels, resolvedScreenshot.detectedPlatform);
        setSuggestedChannelId(matchingChannel?.id);
        mergeSuggestions({
          ...(resolvedScreenshot.detectedOrdererName
            ? { ordererName: resolvedScreenshot.detectedOrdererName }
            : {}),
          ...(matchingChannel
            ? { channelId: matchingChannel.id }
            : {
              channelId: resolvedScreenshot.detectedPlatform !== ChatPlatform.Unknown
                ? ''
                : channelId,
            }),
        });
      }
      setAnalysisStatus('complete');
    } catch (error: unknown) {
      if (requestId !== analysisRequestRef.current || abortController.signal.aborted) return;
      const screenshotFailed = files.length > 0 && !axios.isCancel(error);
      if (screenshotFailed) {
        setScreenshotError('Không thể tự động phân tích ảnh. Bạn vẫn có thể nhập thông tin thủ công.');
      }
      setAnalysisStatus(screenshotFailed ? 'failed' : 'complete');
    } finally {
      screenshotFinished = true;
      releaseAbortController();
    }
  };

  const apply = () => {
    if (applyLockRef.current || !parsed || analysisStatus === 'running') return;
    applyLockRef.current = true;
    setApplying(true);
    try {
      if (queuedFingerprintsRef.current.size >= 50) {
        setInputError('Mỗi batch chỉ được chứa tối đa 50 đơn. Hãy lưu danh sách hiện tại trước.');
        return;
      }

      const fileErrors = validateQuickOrderFiles(files);
      if (fileErrors.length > 0) {
        setInputError(fileErrors.join(' '));
        document.getElementById('quick-import-images')?.focus();
        return;
      }

      const validation = validateQuickOrderReview(
        reviewRef.current,
        channels,
        administrativeAddressRef.current,
      );
      setReviewErrors(validation.errors);
      setAdministrativeAddressInvalidField(validation.administrativeAddressInvalidField);
      if (!validation.confirmed) {
        const firstInvalidField = quickOrderReviewFields.find((field) => validation.errors[field]);
        setInputError('Vui lòng kiểm tra lại các trường được đánh dấu.');
        if (firstInvalidField) {
          requestAnimationFrame(() => {
            const fieldId = firstInvalidField === 'address' && validation.administrativeAddressInvalidField
              ? `quick-review-address-${validation.administrativeAddressInvalidField}`
              : quickOrderReviewFieldIds[firstInvalidField];
            const field = document.getElementById(fieldId);
            field?.focus({ preventScroll: true });
            field?.scrollIntoView({ block: 'center' });
          });
        }
        return;
      }

      const draft = buildQuickOrderDraft({
        review: validation.confirmed,
        sourceText,
        files,
        products,
        parserWarnings: parsed.warnings,
        addressAnalysis: addressAnalysis ?? undefined,
        screenshotAnalysis: screenshotAnalysis ?? undefined,
      });
      if (!draft.isValid) {
        setInputError(draft.validationErrors.join(' '));
        if (draft.validationErrors.some((error) => error.includes('Sản phẩm ngoài danh mục'))) {
          setReviewErrors((current) => ({
            ...current,
            productHint: 'Sản phẩm ngoài danh mục cần ít nhất 1 ảnh minh họa.',
          }));
          requestAnimationFrame(() => document.getElementById(quickOrderReviewFieldIds.productHint)?.focus());
        }
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
            <div className="mt-3">
              <label htmlFor="quick-import-text" className={labelClass}>Đoạn chat</label>
              <textarea
                ref={textareaRef}
                id="quick-import-text"
                autoFocus
                className={`${inputClass} min-h-44 resize-y`}
                value={sourceText}
                onChange={(event) => {
                  invalidatePendingAnalysis();
                  setSourceText(event.target.value);
                  setParsed(null);
                  setAddressAnalysis(null);
                  setScreenshotAnalysis(null);
                  setSuggestedChannelId(undefined);
                  setScreenshotError(null);
                  setReviewErrors({});
                  setAdministrativeAddressInvalidField(undefined);
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
                  const validFiles = nextFiles.filter((file) => validateQuickOrderFiles([file]).length === 0);
                  const mergedFiles = appendUniqueQuickOrderFiles(files, validFiles);
                  const acceptedFiles = mergedFiles.slice(0, quickOrderMaximumImageCount);
                  const selectionErrors = [
                    ...validateQuickOrderFiles(nextFiles),
                    ...(mergedFiles.length > quickOrderMaximumImageCount
                      ? ['Mỗi đơn chỉ được tải tối đa ' + quickOrderMaximumImageCount + ' ảnh.']
                      : []),
                  ];
                  if (quickOrderFileSetKey(acceptedFiles) !== quickOrderFileSetKey(files)) {
                    invalidatePendingAnalysis();
                    setFiles(acceptedFiles);
                    setParsed(null);
                    setAddressAnalysis(null);
                    setScreenshotAnalysis(null);
                    setSuggestedChannelId(undefined);
                    setScreenshotError(null);
                  }
                  setInputError([...new Set(selectionErrors)].join(' ') || null);
                  event.target.value = '';
                }}
              />
              {files.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {files.map((file, index) => (
                    <li key={`${file.name}-${file.lastModified}-${index}`} className="flex min-w-0 items-center justify-between gap-2 text-xs text-admin-text-secondary">
                      <span className="truncate">{file.name}</span>
                      <button type="button" onClick={() => {
                        invalidatePendingAnalysis();
                        setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
                        setParsed(null);
                        setAddressAnalysis(null);
                        setScreenshotAnalysis(null);
                        setSuggestedChannelId(undefined);
                        setScreenshotError(null);
                        setInputError(null);
                      }} className="min-h-8 shrink-0 rounded-admin-control px-2 font-semibold text-admin-status-error hover:bg-red-50" aria-label={`Bỏ ảnh ${file.name}`}>Bỏ</button>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-xs leading-5 text-admin-text-muted">Ảnh được giữ cục bộ và gắn vào đúng đơn khi lưu batch.</p>}
            </div>

            <button type="button" onClick={() => void analyze()} disabled={(!sourceText.trim() && files.length === 0) || analysisStatus === 'running'} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-admin-control border border-admin-primary/35 px-4 text-sm font-semibold text-admin-primary hover:bg-admin-primary/8 disabled:cursor-not-allowed disabled:opacity-50">
              {analysisStatus === 'running' ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" /> : null}
              {analysisStatus === 'running'
                ? 'Đang phân tích ' + (files.length > 0 ? files.length + ' ảnh' : 'đoạn chat') + '...'
                : parsed ? 'Phân tích lại' : 'Phân tích'}
            </button>

            {parsed ? (
              <div className="mt-4 rounded-admin-control bg-admin-muted p-3 text-sm" aria-label="Kết quả phân tích">
                <h4 className="text-sm font-semibold text-admin-text-primary">Kết quả phân tích</h4>
                <p className="mt-1 text-xs leading-5 text-admin-text-muted">
                  Đây là dữ liệu gợi ý. Hãy kiểm tra và chỉnh trực tiếp trước khi áp dụng.
                </p>
                <QuickOrderReviewForm
                  review={review}
                  errors={reviewErrors}
                  channels={channels}
                  administrativeAddress={administrativeAddress}
                  administrativeAddressInvalidField={administrativeAddressInvalidField}
                  onChange={updateReview}
                  onAdministrativeAddressChange={updateAdministrativeAddress}
                />
                {screenshotError ? (
                  <p className="mt-3 rounded-admin-control border border-admin-status-warning/30 bg-amber-50 px-3 py-2 text-xs leading-5 text-admin-status-warning" role="alert">
                    {screenshotError}
                  </p>
                ) : null}
                {parsed.warnings.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-xs leading-5 text-admin-status-warning">
                    {parsed.warnings
                      .filter((warning) => !(review.ordererName && warning.includes('người đặt')))
                      .filter((warning) => !(review.productHint && warning.includes('sản phẩm')))
                      .map((warning, index) => <li key={warning + '-' + index}>• {warning}</li>)}
                  </ul>
                ) : null}
                {addressAnalysis ? (
                  <div className="mt-3 border-t border-admin-border pt-3 text-xs leading-5">
                    <p className="font-semibold text-admin-text-primary">Địa chỉ hành chính</p>
                    {addressAnalysis.selectedCandidate ? (
                      <div className={addressAnalysis.isConfident ? 'text-admin-status-success' : 'text-admin-status-warning'}>
                        <p>Đã tự chọn: {addressAnalysis.selectedCandidate.fullAddress} ({confidencePercent(addressAnalysis.confidence)}%)</p>
                        {addressAnalysis.candidates.length > 1 ? (
                          <details className="text-admin-text-secondary">
                            <summary className="cursor-pointer text-admin-primary">Xem {addressAnalysis.candidates.length} kết quả đã xếp hạng</summary>
                            {addressAnalysis.candidates.slice(0, 3).map((candidate, index) => (
                              <p key={[candidate.scheme, candidate.districtCode ?? 'none', candidate.communeCode ?? 'none'].join('-')}>
                                • #{index + 1} {candidate.fullAddress} ({confidencePercent(candidate.confidence)}%)
                              </p>
                            ))}
                          </details>
                        ) : null}
                      </div>
                    ) : <p className="text-admin-text-muted">Không tìm thấy đơn vị phù hợp; đơn vẫn có thể tạo bằng địa chỉ văn bản.</p>}
                    {addressAnalysis.warnings.map((warning) => <p key={warning} className="text-admin-status-warning">• {warning}</p>)}
                  </div>
                ) : null}
                {screenshotAnalysis ? (
                  <div className="mt-3 border-t border-admin-border pt-3 text-xs leading-5">
                    <p className="font-semibold text-admin-text-primary">Gợi ý từ ảnh</p>
                    <p>
                      Nguồn: <span className="font-medium">{platformLabel(screenshotAnalysis.detectedPlatform)}</span>
                      {' · '}{confidenceLabel(screenshotAnalysis.platformConfidence)} ({confidencePercent(screenshotAnalysis.platformConfidence)}%)
                    </p>
                    <p>
                      Người đặt: <span className="font-medium">{screenshotAnalysis.detectedOrdererName || 'Không đọc được'}</span>
                      {' · '}{confidenceLabel(screenshotAnalysis.nameConfidence)}
                      {screenshotAnalysis.detectedOrdererName ? ' (' + confidencePercent(screenshotAnalysis.nameConfidence) + '%)' : ''}
                    </p>
                    {screenshotAnalysis.detectedPlatform !== ChatPlatform.Unknown && !suggestedChannelId ? (
                      <p className="text-admin-status-warning">Không tìm thấy kênh bán tương ứng. Vui lòng chọn nguồn đơn thủ công.</p>
                    ) : suggestedChannelId ? (
                      <p className="text-admin-status-success">Đã tìm thấy kênh bán tương ứng; bạn vẫn có thể chọn kênh khác.</p>
                    ) : null}
                    {screenshotAnalysis.warnings.map((warning, index) => (
                      <p key={warning + '-' + index} className="text-admin-status-warning">• {warning}</p>
                    ))}
                    {screenshotAnalysis.detectedOrdererName
                      && normalizeChannel(review.ordererName) !== normalizeChannel(screenshotAnalysis.detectedOrdererName) ? (
                        <p className="text-admin-text-muted">Tên đang nhập đã được giữ nguyên thay vì ghi đè bằng OCR.</p>
                      ) : null}
                    {screenshotAnalysis.screenshots.length > 0 ? (
                      <details className="mt-2 rounded-admin-control border border-admin-border bg-admin-card px-3 py-2">
                        <summary className="cursor-pointer font-semibold text-admin-primary">
                          Chi tiết {screenshotAnalysis.screenshots.length} ảnh
                        </summary>
                        <div className="mt-2 space-y-2">
                          {screenshotAnalysis.screenshots.map((screenshot) => (
                            <div key={screenshot.screenshotId} className="border-t border-admin-border pt-2 first:border-t-0 first:pt-0">
                              <p className="truncate font-medium text-admin-text-primary">{screenshot.fileName}</p>
                              <p>
                                {platformLabel(screenshot.detectedPlatform)}
                                {' · '}{confidencePercent(screenshot.platformConfidence)}%
                                {screenshot.detectedOrdererName ? ' · ' + screenshot.detectedOrdererName : ''}
                              </p>
                              {screenshot.warnings.map((warning, warningIndex) => (
                                <p key={warning + '-' + warningIndex} className="text-admin-status-warning">• {warning}</p>
                              ))}
                            </div>
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {inputError ? <p className="mt-3 rounded-admin-control border border-admin-status-error/30 bg-red-50 px-3 py-2 text-xs leading-5 text-admin-status-error" role="alert">{inputError}</p> : null}
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={apply} disabled={!parsed || applying || analysisStatus === 'running'} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
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
                    const selectedChannelName = channels.find((channel) => channel.id === draft.channelId)?.name
                      ?? 'Kênh không còn khả dụng';
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
                            <p className="mt-1 truncate text-sm font-semibold text-admin-text-primary" title={draft.ordererName + ' · ' + selectedChannelName}>
                              {draft.ordererName} · {selectedChannelName}
                            </p>
                            <p className="mt-1 text-xs font-medium tabular-nums text-admin-text-secondary">
                              {formatDeliveryDate(draft.deliveryDate)} • {draft.deliveryStartTime}{draft.deliveryEndTime ? `-${draft.deliveryEndTime}` : ''}
                            </p>
                            <p className="mt-1 truncate text-sm font-medium text-admin-text-primary" title={`${draft.recipientName} - ${draft.recipientPhone}`}>{draft.recipientName} - {draft.recipientPhone}</p>
                            {draft.addressDetail || draft.deliveryAddress ? (
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-admin-text-secondary">{draft.addressDetail || draft.deliveryAddress}</p>
                            ) : null}
                            {draft.provinceName || draft.districtName || draft.communeName ? (
                              <p className={`mt-0.5 text-[11px] leading-4 ${draft.addressAnalysis
                                ? draft.addressAnalysis.isConfident && !draft.addressUsedDefaultProvince
                                  ? 'text-admin-status-success'
                                  : 'text-admin-status-warning'
                                : 'text-admin-text-secondary'}`}>
                                {[draft.communeName, draft.districtName, draft.provinceName].filter(Boolean).join(', ')}
                                {draft.addressAnalysis ? (
                                  <>
                                    {' · '}{draft.addressAnalysis.isConfident && !draft.addressUsedDefaultProvince ? 'Tin cậy cao' : 'Cần kiểm tra'}
                                    {draft.addressUsedDefaultProvince && draft.provinceName ? ` · ${draft.provinceName} được ưu tiên mặc định` : ''}
                                  </>
                                ) : null}
                              </p>
                            ) : null}
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
