import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Clipboard, ImagePlus, RefreshCw, Save, Sparkles, Square } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { contentApi } from '../api/contentApi';
import { ContentShell, ContentStatus, platformLabel } from '../components/ContentShell';
import {
  CONTENT_PLATFORMS,
  type ContentPlatform,
  type ContentProductOptionDto,
  type ContentProviderStatusDto,
  type ContentSourceType,
  type GenerateContentResponseDto,
  type GeneratedContentItemDto,
} from '../types/content.types';

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const inputClass = 'h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 text-sm text-admin-text-primary outline-none transition-colors placeholder:text-admin-text-muted focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:bg-admin-muted';
const textareaClass = 'w-full resize-y rounded-admin-control border border-admin-input-border bg-admin-card px-3 py-2.5 text-sm leading-6 text-admin-text-primary outline-none transition-colors placeholder:text-admin-text-muted focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:bg-admin-muted';

const completeContent = (item: GeneratedContentItemDto) => [
  item.body.trim(),
  item.footerSnapshot.trim(),
  item.hashtagsSnapshot.join(' ').trim(),
].filter(Boolean).join('\n\n');

type GenerationAttempt = {
  fingerprint: string;
  images: File[];
  previousGenerationToken: string | null;
  idempotencyKey: string;
};

const generationFingerprint = (input: {
  sourceType: ContentSourceType;
  productId: number;
  topic: string;
  notes: string;
  tone: string;
  language: string;
  customInstructions: string;
}) => JSON.stringify({
  sourceType: input.sourceType,
  productId: input.sourceType === 'product' ? input.productId : null,
  topic: input.topic.trim(),
  notes: input.notes.trim(),
  tone: input.tone.trim(),
  language: input.language,
  customInstructions: input.customInstructions.trim(),
});

const hasSameImages = (left: File[], right: File[]) => (
  left.length === right.length && left.every((file, index) => file === right[index])
);

export const ContentCreatePage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('content.manage');
  const [providerStatus, setProviderStatus] = useState<ContentProviderStatusDto | null>(null);
  const [products, setProducts] = useState<ContentProductOptionDto[]>([]);
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [setupError, setSetupError] = useState('');
  const [sourceType, setSourceType] = useState<ContentSourceType>('product');
  const [productId, setProductId] = useState(0);
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [tone, setTone] = useState('Tự nhiên, tinh tế');
  const [language, setLanguage] = useState('vi');
  const [customInstructions, setCustomInstructions] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [generation, setGeneration] = useState<GenerateContentResponseDto | null>(null);
  const [items, setItems] = useState<GeneratedContentItemDto[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedPlatform, setCopiedPlatform] = useState<ContentPlatform | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const generationAttemptRef = useRef<GenerationAttempt | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSetup = useCallback(async () => {
    setLoadingSetup(true);
    setSetupError('');
    const [statusResult, productResult] = await Promise.allSettled([
      contentApi.status(),
      contentApi.products(),
    ]);
    if (statusResult.status === 'fulfilled') setProviderStatus(statusResult.value);
    else setSetupError(getApiErrorMessage(statusResult.reason));
    if (productResult.status === 'fulfilled') {
      setProducts(productResult.value);
      setProductId((current) => current || productResult.value[0]?.id || 0);
    } else {
      setSetupError((current) => current || getApiErrorMessage(productResult.reason));
    }
    setLoadingSetup(false);
  }, []);

  useEffect(() => {
    void loadSetup();
    return () => abortRef.current?.abort();
  }, [loadSetup]);

  useEffect(() => {
    const hasUnsavedChanges = Boolean(generation) && !saved;
    if (!hasUnsavedChanges) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [generation, saved]);

  const selectImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    setFormError('');
    if (selected.length > MAX_IMAGES) {
      setImages([]);
      setFormError(`Chỉ được chọn tối đa ${MAX_IMAGES} ảnh.`);
      event.target.value = '';
      return;
    }
    const invalid = selected.find((file) => {
      const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
      return !ALLOWED_IMAGE_TYPES.has(file.type) || !ALLOWED_EXTENSIONS.has(extension) || file.size > MAX_IMAGE_BYTES;
    });
    if (invalid) {
      setImages([]);
      setFormError(`Ảnh “${invalid.name}” không hợp lệ. Dùng JPG, PNG hoặc WebP, tối đa 10 MB mỗi ảnh.`);
      event.target.value = '';
      return;
    }
    setImages(selected);
  };

  const validate = () => {
    if (!providerStatus?.isConfigured) return 'Dịch vụ AI chưa được cấu hình trên máy chủ.';
    if (sourceType === 'product' && !productId) return 'Chọn một sản phẩm làm nguồn nội dung.';
    if (sourceType === 'uploaded-images' && images.length === 0) return 'Chọn ít nhất một ảnh làm nguồn nội dung.';
    return '';
  };

  const generate = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setGenerating(true);
    setFormError('');
    setSuccess('');
    const fingerprint = generationFingerprint({
      sourceType,
      productId,
      topic,
      notes,
      tone,
      language,
      customInstructions,
    });
    const requestImages = sourceType === 'uploaded-images' ? images : [];
    const previousGenerationToken = generation?.generationToken ?? null;
    const previousAttempt = generationAttemptRef.current;
    const canRetryPreviousAttempt = previousAttempt
      && previousAttempt.fingerprint === fingerprint
      && previousAttempt.previousGenerationToken === previousGenerationToken
      && hasSameImages(previousAttempt.images, requestImages);
    const attempt = canRetryPreviousAttempt
      ? previousAttempt
      : {
          fingerprint,
          images: [...requestImages],
          previousGenerationToken,
          idempotencyKey: crypto.randomUUID(),
        };
    generationAttemptRef.current = attempt;
    try {
      const response = await contentApi.generate({
        sourceType,
        productId: sourceType === 'product' ? productId : undefined,
        topic: topic.trim() || undefined,
        notes: notes.trim() || undefined,
        tone: tone.trim() || undefined,
        language,
        customInstructions: customInstructions.trim() || undefined,
        images: requestImages,
        idempotencyKey: attempt.idempotencyKey,
      }, controller.signal);
      generationAttemptRef.current = null;
      setGeneration(response);
      setItems(response.items);
      setSaved(false);
      setSuccess(`Đã tạo ${response.items.length} nội dung. Hãy kiểm tra, chỉnh sửa và bấm Lưu.`);
    } catch (error) {
      if (controller.signal.aborted) setFormError('Đã hủy yêu cầu tạo content.');
      else setFormError(getApiErrorMessage(error));
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setGenerating(false);
    }
  };

  const save = async () => {
    if (!generation || items.length === 0) return;
    if (items.some((item) => !item.body.trim())) {
      setFormError('Nội dung của mỗi nền tảng không được để trống trước khi lưu.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const savedGeneration = await contentApi.save({
        generationToken: generation.generationToken,
        items: items.map((item) => ({ platform: item.platform, body: item.body.trim() })),
      });
      setGeneration((current) => current ? {
        ...current,
        generationToken: savedGeneration.id,
        sourceType: savedGeneration.sourceType,
        productId: savedGeneration.productId,
        productNameSnapshot: savedGeneration.productNameSnapshot,
        imageUrlSnapshot: savedGeneration.imageUrlSnapshot,
        uploadedImageUrls: savedGeneration.uploadedImageUrls,
        styleName: savedGeneration.styleName,
        provider: savedGeneration.provider ?? current.provider,
        model: savedGeneration.model ?? current.model,
        promptVersion: savedGeneration.promptVersion ?? current.promptVersion,
        items: savedGeneration.items,
        createdAt: savedGeneration.createdAt,
        savedAt: savedGeneration.savedAt,
      } : null);
      setItems(savedGeneration.items);
      setSaved(true);
      setSuccess(`Đã lưu ${savedGeneration.items.length} nội dung nền tảng vào lịch sử.`);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const copy = async (item: GeneratedContentItemDto) => {
    try {
      await navigator.clipboard.writeText(completeContent(item));
      setCopiedPlatform(item.platform);
      window.setTimeout(() => setCopiedPlatform((current) => current === item.platform ? null : current), 1800);
    } catch {
      setFormError('Trình duyệt không cho phép sao chép tự động. Hãy chọn và sao chép nội dung thủ công.');
    }
  };

  const updateBody = (platform: ContentPlatform, body: string) => {
    setItems((current) => current.map((item) => item.platform === platform ? { ...item, body } : item));
    setSaved(false);
  };

  return (
    <ContentShell title="Tạo content đa nền tảng" description="Tạo bản nháp từ dữ liệu sản phẩm hoặc ảnh tải lên; API key và xử lý AI chỉ tồn tại ở máy chủ.">
      <div className="space-y-5">
        {loadingSetup ? <ContentStatus kind="info">Đang kiểm tra cấu hình AI và danh sách sản phẩm...</ContentStatus> : null}
        {setupError ? <ContentStatus kind="error"><div className="flex flex-wrap items-center justify-between gap-3"><span>{setupError}</span><button type="button" onClick={() => void loadSetup()} className="inline-flex min-h-9 items-center gap-1.5 font-semibold underline underline-offset-2"><RefreshCw size={15} aria-hidden="true" /> Thử lại</button></div></ContentStatus> : null}
        {!loadingSetup && providerStatus && !providerStatus.isConfigured ? <ContentStatus kind="warning">{providerStatus.message || 'AI chưa được cấu hình trên API. Các module khác vẫn hoạt động bình thường; hãy cấu hình provider ở máy chủ để tạo content.'}</ContentStatus> : null}
        {!loadingSetup && providerStatus?.isConfigured ? <ContentStatus kind="info">Sẵn sàng với {providerStatus.providerName || 'provider máy chủ'}{providerStatus.model ? ` · ${providerStatus.model}` : ''}. Không có khóa AI nào được gửi xuống trình duyệt.</ContentStatus> : null}
        {!canManage ? <ContentStatus kind="warning">Bạn có quyền xem Content nhưng chưa có quyền tạo hoặc lưu. Hãy dùng mục Lịch sử đã lưu, hoặc liên hệ quản trị viên để được cấp quyền content.manage.</ContentStatus> : null}
        {success ? <ContentStatus kind="success">{success}</ContentStatus> : null}
        {formError ? <ContentStatus kind="error">{formError}</ContentStatus> : null}

        <form onSubmit={(event) => void generate(event)} className="rounded-admin-panel border border-admin-border bg-admin-surface p-4 shadow-admin-panel sm:p-5">
          <fieldset disabled={generating || loadingSetup || !canManage} className="space-y-5 disabled:opacity-70">
            <div>
              <h2 className="text-base font-semibold text-admin-text-primary">1. Chọn nguồn</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className={`cursor-pointer rounded-admin-control border p-4 transition-colors ${sourceType === 'product' ? 'border-admin-primary bg-admin-primary/5' : 'border-admin-border hover:bg-admin-muted'}`}><span className="flex items-start gap-3"><input type="radio" name="content-source" value="product" checked={sourceType === 'product'} onChange={() => { setSourceType('product'); setImages([]); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="mt-1 h-4 w-4 accent-admin-primary" /><span><span className="block text-sm font-semibold text-admin-text-primary">Sản phẩm có sẵn</span><span className="mt-1 block text-xs leading-5 text-admin-text-muted">Máy chủ cung cấp tên, giá, ảnh và dữ kiện đã xác thực.</span></span></span></label>
                <label className={`cursor-pointer rounded-admin-control border p-4 transition-colors ${sourceType === 'uploaded-images' ? 'border-admin-primary bg-admin-primary/5' : 'border-admin-border hover:bg-admin-muted'}`}><span className="flex items-start gap-3"><input type="radio" name="content-source" value="uploaded-images" checked={sourceType === 'uploaded-images'} onChange={() => setSourceType('uploaded-images')} className="mt-1 h-4 w-4 accent-admin-primary" /><span><span className="block text-sm font-semibold text-admin-text-primary">Ảnh tải lên</span><span className="mt-1 block text-xs leading-5 text-admin-text-muted">Dùng tối đa {MAX_IMAGES} ảnh; máy chủ tiếp tục kiểm tra nội dung file.</span></span></span></label>
              </div>
            </div>

            {sourceType === 'product' ? (
              <div><label htmlFor="content-product" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Sản phẩm *</label><select id="content-product" value={productId} onChange={(event) => setProductId(Number(event.target.value))} className={inputClass}><option value={0}>Chọn sản phẩm</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>)}</select>{!products.length && !loadingSetup ? <p className="mt-1.5 text-xs text-admin-text-muted">Không có sản phẩm đang hoạt động.</p> : null}</div>
            ) : null}

            {sourceType === 'uploaded-images' ? <div>
              <label htmlFor="content-images" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Ảnh nguồn *</label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input ref={fileInputRef} id="content-images" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" multiple onChange={selectImages} className="sr-only" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-admin-control border border-admin-border px-4 text-sm font-semibold text-admin-primary hover:bg-admin-muted"><ImagePlus size={17} aria-hidden="true" /> Chọn ảnh</button>
                <span className="text-xs leading-5 text-admin-text-muted">JPG, PNG, WebP · tối đa 10 MB/ảnh</span>
              </div>
              {images.length ? <ul className="mt-3 grid gap-2 sm:grid-cols-2" aria-label="Ảnh đã chọn">{images.map((file) => <li key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between gap-3 rounded-admin-control bg-admin-muted px-3 py-2 text-xs text-admin-text-secondary"><span className="min-w-0 truncate">{file.name}</span><span className="shrink-0 tabular-nums">{(file.size / 1024 / 1024).toFixed(1)} MB</span></li>)}</ul> : null}
            </div> : null}

            <fieldset>
              <legend className="text-base font-semibold text-admin-text-primary">2. Nền tảng đầu ra</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {CONTENT_PLATFORMS.map((platform) => <div key={platform} className="flex min-h-12 items-center gap-3 rounded-admin-control border border-admin-primary bg-admin-primary/5 px-4 text-sm font-semibold text-admin-primary"><Check size={16} aria-hidden="true" /> {platformLabel(platform)}</div>)}
              </div>
              <p className="mt-2 text-xs leading-5 text-admin-text-muted">Mỗi lần tạo luôn trả một nội dung riêng cho Facebook, Instagram và TikTok.</p>
            </fieldset>

            <div>
              <h2 className="text-base font-semibold text-admin-text-primary">3. Brief nội dung</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><label htmlFor="content-topic" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Chủ đề / dịp tặng</label><input id="content-topic" value={topic} onChange={(event) => setTopic(event.target.value)} className={inputClass} maxLength={200} placeholder="Ví dụ: Quà kỷ niệm cho người yêu" /></div>
                <div><label htmlFor="content-tone" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Giọng văn</label><input id="content-tone" value={tone} onChange={(event) => setTone(event.target.value)} className={inputClass} maxLength={100} /></div>
                <div><label htmlFor="content-language" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Ngôn ngữ</label><select id="content-language" value={language} onChange={(event) => setLanguage(event.target.value)} className={inputClass}><option value="vi">Tiếng Việt</option><option value="en">English</option><option value="vi-en">Song ngữ Việt — Anh</option></select></div>
                <div><label htmlFor="content-notes" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Ghi chú dữ kiện</label><textarea id="content-notes" value={notes} onChange={(event) => setNotes(event.target.value)} className={`${textareaClass} min-h-28`} maxLength={1200} placeholder="Đối tượng nhận, ưu đãi đã được xác nhận, điểm cần nhấn mạnh..." /></div>
                <div><label htmlFor="content-instructions" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Hướng dẫn riêng</label><textarea id="content-instructions" value={customInstructions} onChange={(event) => setCustomInstructions(event.target.value)} className={`${textareaClass} min-h-28`} maxLength={1200} placeholder="Yêu cầu về độ dài, CTA hoặc điều cần tránh..." /></div>
              </div>
              <p className="mt-2 text-xs leading-5 text-admin-text-muted">AI được yêu cầu không tự bịa giá, khuyến mãi, địa chỉ, cam kết giao hàng hoặc đặc điểm sản phẩm ngoài dữ liệu nguồn.</p>
            </div>
          </fieldset>

          <div className="mt-5 flex flex-col-reverse gap-2 border-t border-admin-border pt-5 sm:flex-row sm:justify-end">
            {generating ? <button type="button" onClick={() => abortRef.current?.abort()} className="inline-flex h-11 items-center justify-center gap-2 rounded-admin-control border border-admin-status-error px-4 text-sm font-semibold text-admin-status-error hover:bg-admin-status-error/10"><Square size={14} fill="currentColor" aria-hidden="true" /> Hủy tạo</button> : null}
            <button type="submit" disabled={generating || loadingSetup || !canManage || !providerStatus?.isConfigured} className="inline-flex h-11 items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-5 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-50"><Sparkles size={17} aria-hidden="true" /> {generating ? 'Đang tạo content...' : generation ? 'Tạo lại toàn bộ' : 'Tạo content'}</button>
          </div>
        </form>

        {generation ? (
          <section aria-labelledby="generated-content-heading">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div><h2 id="generated-content-heading" className="text-base font-semibold text-admin-text-primary">Kết quả có thể chỉnh sửa</h2><p className="mt-1 text-xs text-admin-text-muted">Phong cách: {generation.styleName} · {generation.provider}/{generation.model} · prompt {generation.promptVersion}</p></div>
              <button type="button" onClick={() => void save()} disabled={saving || saved} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-50"><Save size={17} aria-hidden="true" /> {saving ? 'Đang lưu...' : saved ? 'Đã lưu' : 'Lưu vào lịch sử'}</button>
            </div>
            {generation.warnings.length ? <div className="mb-3"><ContentStatus kind="warning"><ul className="list-disc space-y-1 pl-5">{generation.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></ContentStatus></div> : null}
            {!saved ? <div className="mb-3"><ContentStatus kind="info">Kết quả hiện chỉ là bản nháp trong trình duyệt và chưa xuất hiện trong lịch sử.</ContentStatus></div> : null}
            <div className="grid gap-4 xl:grid-cols-3">
              {items.map((item) => (
                <article key={item.platform} className="flex min-w-0 flex-col rounded-admin-panel border border-admin-border bg-admin-surface p-4 shadow-admin-panel">
                  <div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-semibold text-admin-text-primary">{platformLabel(item.platform)}</h3><button type="button" onClick={() => void copy(item)} className="inline-flex min-h-10 items-center gap-1.5 rounded-admin-control px-3 text-sm font-semibold text-admin-primary hover:bg-admin-muted">{copiedPlatform === item.platform ? <Check size={16} aria-hidden="true" /> : <Clipboard size={16} aria-hidden="true" />}{copiedPlatform === item.platform ? 'Đã chép' : 'Sao chép'}</button></div>
                  <label htmlFor={`generated-${item.platform}`} className="mb-1.5 text-xs font-medium text-admin-text-secondary">Nội dung body</label>
                  <textarea id={`generated-${item.platform}`} value={item.body} onChange={(event) => updateBody(item.platform, event.target.value)} className={`${textareaClass} min-h-64 flex-1`} aria-label={`Nội dung ${platformLabel(item.platform)}`} />
                  <div className="mt-3 rounded-admin-control border border-dashed border-admin-border bg-admin-muted/45 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-admin-text-muted">Footer snapshot — chỉ đọc</p>
                    <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-admin-text-secondary">{item.footerSnapshot || 'Không có footer'}</p>
                    {item.hashtagsSnapshot.length ? <p className="mt-2 break-words text-xs leading-5 text-admin-primary">{item.hashtagsSnapshot.join(' ')}</p> : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </ContentShell>
  );
};
