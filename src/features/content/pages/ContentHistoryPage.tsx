import React, { useCallback, useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Clipboard, Eye, History, RefreshCw, Save } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { SettingsDialog } from '@/features/settings/components/SettingsDialog';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { contentApi } from '../api/contentApi';
import { ContentShell, ContentStatus, platformLabel } from '../components/ContentShell';
import {
  CONTENT_PLATFORMS,
  type ContentGenerationDetailDto,
  type ContentGenerationSummaryDto,
  type ContentHistoryQuery,
  type ContentHistoryResult,
  type ContentPlatform,
  type ContentProductOptionDto,
  type GeneratedContentItemDto,
} from '../types/content.types';

const PAGE_SIZE = 20;
const inputClass = 'h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 text-sm text-admin-text-primary outline-none transition-colors focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/15';
const textareaClass = 'w-full resize-y rounded-admin-control border border-admin-input-border bg-admin-card px-3 py-2.5 text-sm leading-6 text-admin-text-primary outline-none transition-colors focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/15 disabled:bg-admin-muted';
const emptyResult: ContentHistoryResult = {
  items: [], totalCount: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0, hasNext: false, hasPrevious: false,
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(date);
};

const sourceLabel = (item: ContentGenerationSummaryDto | ContentGenerationDetailDto) => (
  item.sourceType === 'product' ? item.productNameSnapshot || 'Sản phẩm đã thay đổi' : 'Ảnh tải lên'
);

const completeContent = (item: GeneratedContentItemDto) => [
  item.body.trim(), item.footerSnapshot.trim(), item.hashtagsSnapshot.join(' ').trim(),
].filter(Boolean).join('\n\n');

export const ContentHistoryPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('content.manage');
  const [products, setProducts] = useState<ContentProductOptionDto[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [productId, setProductId] = useState<number | ''>('');
  const [platform, setPlatform] = useState<ContentPlatform | ''>('');
  const [applied, setApplied] = useState<Omit<ContentHistoryQuery, 'page' | 'pageSize'>>({});
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ContentHistoryResult>(emptyResult);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterError, setFilterError] = useState('');
  const [success, setSuccess] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detail, setDetail] = useState<ContentGenerationDetailDto | null>(null);
  const [detailItems, setDetailItems] = useState<GeneratedContentItemDto[]>([]);
  const [savingVersion, setSavingVersion] = useState(false);
  const [copiedPlatform, setCopiedPlatform] = useState<ContentPlatform | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setProducts(await contentApi.products());
    } catch {
      setProducts([]);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setResult(await contentApi.history({ ...applied, page, pageSize: PAGE_SIZE }));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [applied, page]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const applyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    if (from && to && from > to) {
      setFilterError('Ngày bắt đầu không được sau ngày kết thúc.');
      return;
    }
    setFilterError('');
    setPage(1);
    setApplied({
      from: from || undefined,
      to: to || undefined,
      productId: productId || undefined,
      platform: platform || undefined,
    });
  };

  const openDetail = async (summary: ContentGenerationSummaryDto) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError('');
    setDetail(null);
    setDetailItems([]);
    try {
      const response = await contentApi.historyDetail(summary.id);
      setDetail(response);
      setDetailItems(response.items);
    } catch (requestError) {
      setDetailError(getApiErrorMessage(requestError));
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    if (!savingVersion) setDetailOpen(false);
  };

  const updateBody = (target: ContentPlatform, body: string) => {
    if (!canManage) return;
    setDetailItems((current) => current.map((item) => item.platform === target ? { ...item, body } : item));
  };

  const createVersion = async () => {
    if (!detail || !canManage) return;
    if (detailItems.some((item) => !item.body.trim())) {
      setDetailError('Nội dung của mỗi nền tảng không được để trống.');
      return;
    }
    setSavingVersion(true);
    setDetailError('');
    try {
      await contentApi.createVersion(detail.id, {
        items: detailItems.map((item) => ({
          platform: item.platform,
          body: item.body.trim(),
        })),
      });
      setSuccess(`Đã lưu phiên bản mới. Bản ${detail.id.slice(0, 8)} vẫn được giữ nguyên.`);
      setDetailOpen(false);
      await loadHistory();
    } catch (requestError) {
      setDetailError(getApiErrorMessage(requestError));
    } finally {
      setSavingVersion(false);
    }
  };

  const copy = async (item: GeneratedContentItemDto) => {
    try {
      await navigator.clipboard.writeText(completeContent(item));
      setCopiedPlatform(item.platform);
      window.setTimeout(() => setCopiedPlatform((current) => current === item.platform ? null : current), 1800);
    } catch {
      setDetailError('Trình duyệt không cho phép sao chép tự động.');
    }
  };

  return (
    <ContentShell title="Lịch sử content" description="Chỉ hiển thị nội dung đã lưu. Mọi chỉnh sửa từ lịch sử tạo một phiên bản mới và không ghi đè bản cũ.">
      <div className="space-y-4">
        {success ? <ContentStatus kind="success">{success}</ContentStatus> : null}
        {error ? <ContentStatus kind="error"><div className="flex flex-wrap items-center justify-between gap-3"><span>{error}</span><button type="button" onClick={() => void loadHistory()} className="inline-flex min-h-9 items-center gap-1.5 font-semibold underline underline-offset-2"><RefreshCw size={15} aria-hidden="true" /> Thử lại</button></div></ContentStatus> : null}

        <form onSubmit={applyFilters} className="rounded-admin-panel border border-admin-border bg-admin-surface p-4 shadow-admin-panel">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(9rem,.7fr)_minmax(9rem,.7fr)_minmax(14rem,1.2fr)_minmax(10rem,.8fr)_auto] xl:items-end">
            <div><label htmlFor="history-from" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Từ ngày lưu</label><input id="history-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className={inputClass} /></div>
            <div><label htmlFor="history-to" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Đến ngày lưu</label><input id="history-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} className={inputClass} /></div>
            <div><label htmlFor="history-product" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Sản phẩm</label><select id="history-product" value={productId} onChange={(event) => setProductId(event.target.value ? Number(event.target.value) : '')} className={inputClass}><option value="">Tất cả sản phẩm</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>)}</select></div>
            <div><label htmlFor="history-platform" className="mb-1.5 block text-sm font-medium text-admin-text-primary">Nền tảng</label><select id="history-platform" value={platform} onChange={(event) => setPlatform(event.target.value as ContentPlatform | '')} className={inputClass}><option value="">Tất cả nền tảng</option>{CONTENT_PLATFORMS.map((item) => <option key={item} value={item}>{platformLabel(item)}</option>)}</select></div>
            <button type="submit" className="h-11 rounded-admin-control bg-admin-primary px-5 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover sm:col-span-2 xl:col-span-1">Lọc lịch sử</button>
          </div>
          {filterError ? <p className="mt-3 text-sm text-admin-status-error" role="alert">{filterError}</p> : null}
        </form>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center rounded-admin-panel border border-admin-border bg-admin-surface text-sm text-admin-text-secondary" role="status">Đang tải lịch sử content...</div>
        ) : result.items.length === 0 ? (
          <div className="rounded-admin-panel border border-dashed border-admin-border bg-admin-surface px-5 py-14 text-center"><History size={28} className="mx-auto text-admin-text-muted" aria-hidden="true" /><p className="mt-3 font-semibold text-admin-text-primary">Chưa có content đã lưu</p><p className="mt-1 text-sm text-admin-text-secondary">Kết quả generate chỉ xuất hiện ở đây sau khi người dùng bấm Lưu.</p></div>
        ) : (
          <section className="overflow-hidden rounded-admin-panel border border-admin-border bg-admin-surface shadow-admin-panel" aria-label="Danh sách lịch sử content">
            <div className="hidden grid-cols-[minmax(12rem,1.2fr)_minmax(11rem,1fr)_minmax(10rem,.9fr)_minmax(8rem,.7fr)_6rem] gap-4 border-b border-admin-border bg-admin-muted/45 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-admin-text-muted md:grid"><span>Nguồn</span><span>Nền tảng</span><span>Phong cách</span><span>Đã lưu</span><span className="text-right">Xem</span></div>
            <div className="divide-y divide-admin-border">
              {result.items.map((item) => (
                <article key={item.id} className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(12rem,1.2fr)_minmax(11rem,1fr)_minmax(10rem,.9fr)_minmax(8rem,.7fr)_6rem] md:items-center md:gap-4 md:px-5">
                  <div className="min-w-0"><p className="truncate font-semibold text-admin-text-primary">{sourceLabel(item)}</p><p className="mt-1 font-mono text-xs text-admin-text-muted">{item.parentGenerationId ? 'Phiên bản mới' : 'Bản gốc'} · {item.id.slice(0, 8)}</p></div>
                  <div className="flex flex-wrap gap-1.5">{item.platforms.map((itemPlatform) => <span key={itemPlatform} className="rounded-md bg-admin-primary/10 px-2 py-1 text-[11px] font-semibold text-admin-primary">{platformLabel(itemPlatform)}</span>)}</div>
                  <p className="text-sm text-admin-text-secondary">{item.styleName}</p>
                  <time className="text-xs leading-5 text-admin-text-muted" dateTime={item.savedAt ?? item.createdAt}>{formatDate(item.savedAt ?? item.createdAt)}</time>
                  <div className="flex justify-end"><button type="button" onClick={() => void openDetail(item)} className="inline-flex h-11 w-11 items-center justify-center rounded-admin-control text-admin-text-secondary hover:bg-admin-muted hover:text-admin-primary" aria-label={`Xem content ${sourceLabel(item)} ${item.id.slice(0, 8)}`}><Eye size={18} aria-hidden="true" /></button></div>
                </article>
              ))}
            </div>
          </section>
        )}

        {!loading && result.totalPages > 1 ? <div className="flex flex-col gap-3 rounded-admin-control border border-admin-border bg-admin-surface px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><span className="text-admin-text-secondary">Trang {result.page}/{result.totalPages} · {result.totalCount} lần lưu</span><div className="flex gap-2"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={!result.hasPrevious} className="inline-flex h-11 items-center gap-1 rounded-admin-control border border-admin-border px-3 font-semibold text-admin-text-primary hover:bg-admin-muted disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={16} aria-hidden="true" /> Trước</button><button type="button" onClick={() => setPage((current) => current + 1)} disabled={!result.hasNext} className="inline-flex h-11 items-center gap-1 rounded-admin-control border border-admin-border px-3 font-semibold text-admin-text-primary hover:bg-admin-muted disabled:cursor-not-allowed disabled:opacity-40">Sau <ChevronRight size={16} aria-hidden="true" /></button></div></div> : null}
      </div>

      <SettingsDialog
        open={detailOpen}
        title={detail ? `${sourceLabel(detail)} · ${detail.id.slice(0, 8)}` : 'Chi tiết content'}
        description={canManage
          ? 'Bản đã lưu là bất biến. Lưu thay đổi bên dưới sẽ tạo phiên bản kế tiếp.'
          : 'Bản đã lưu là bất biến. Bạn có thể xem và sao chép nội dung.'}
        width="viewport"
        onRequestClose={closeDetail}
        footer={detail ? (
          <>
            <button type="button" onClick={closeDetail} disabled={savingVersion} className="h-11 rounded-admin-control border border-admin-border bg-admin-card px-4 text-sm font-semibold text-admin-text-primary hover:bg-admin-muted disabled:opacity-50">Đóng</button>
            {canManage ? <button type="button" onClick={() => void createVersion()} disabled={savingVersion} className="inline-flex h-11 items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-50"><Save size={17} aria-hidden="true" /> {savingVersion ? 'Đang lưu phiên bản...' : 'Lưu thành phiên bản mới'}</button> : null}
          </>
        ) : undefined}
      >
        {detailLoading ? <div className="flex min-h-72 items-center justify-center text-sm text-admin-text-secondary" role="status">Đang tải chi tiết content...</div> : detailError && !detail ? <ContentStatus kind="error">{detailError}</ContentStatus> : detail ? (
          <div className="space-y-5">
            <ContentStatus kind="info">Bản lưu {detail.id.slice(0, 8)} lúc {formatDate(detail.savedAt ?? detail.createdAt)}. Footer bên dưới là snapshot của thời điểm lưu, không lấy lại từ cấu hình hiện tại.</ContentStatus>
            {!canManage ? <ContentStatus kind="warning">Bạn đang ở chế độ chỉ xem; nội dung body không thể sửa và không thể tạo phiên bản mới.</ContentStatus> : null}
            {detailError ? <ContentStatus kind="error">{detailError}</ContentStatus> : null}
            <dl className="grid gap-3 rounded-admin-control border border-admin-border bg-admin-muted/45 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div><dt className="text-xs text-admin-text-muted">Nguồn</dt><dd className="mt-1 font-medium text-admin-text-primary">{sourceLabel(detail)}</dd></div>
              <div><dt className="text-xs text-admin-text-muted">Phong cách</dt><dd className="mt-1 font-medium text-admin-text-primary">{detail.styleName}</dd></div>
              <div><dt className="text-xs text-admin-text-muted">Provider / model</dt><dd className="mt-1 font-medium text-admin-text-primary">{detail.provider || '—'}{detail.model ? ` · ${detail.model}` : ''}</dd></div>
              <div><dt className="text-xs text-admin-text-muted">Quan hệ phiên bản</dt><dd className="mt-1 font-medium text-admin-text-primary">{detail.parentGenerationId ? `Từ ${detail.parentGenerationId.slice(0, 8)}` : 'Bản gốc'}</dd></div>
            </dl>
            <div className="grid gap-4 xl:grid-cols-3">
              {detailItems.map((item) => (
                <article key={item.platform} className="flex min-w-0 flex-col rounded-admin-panel border border-admin-border bg-admin-card p-4">
                  <div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-semibold text-admin-text-primary">{platformLabel(item.platform)}</h3><button type="button" onClick={() => void copy(item)} className="inline-flex min-h-10 items-center gap-1.5 rounded-admin-control px-3 text-sm font-semibold text-admin-primary hover:bg-admin-muted">{copiedPlatform === item.platform ? <Check size={16} aria-hidden="true" /> : <Clipboard size={16} aria-hidden="true" />}{copiedPlatform === item.platform ? 'Đã chép' : 'Sao chép'}</button></div>
                  <label htmlFor={`history-body-${item.platform}`} className="mb-1.5 text-xs font-medium text-admin-text-secondary">{canManage ? 'Body dùng cho phiên bản mới' : 'Body đã lưu — chỉ đọc'}</label>
                  <textarea id={`history-body-${item.platform}`} value={item.body} onChange={(event) => updateBody(item.platform, event.target.value)} disabled={!canManage} className={`${textareaClass} min-h-64 flex-1`} />
                  <div className="mt-3 rounded-admin-control border border-dashed border-admin-border bg-admin-muted/45 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-admin-text-muted">Footer snapshot — chỉ đọc</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-admin-text-secondary">{item.footerSnapshot || 'Không có footer'}</p>{item.hashtagsSnapshot.length ? <p className="mt-2 break-words text-xs leading-5 text-admin-primary">{item.hashtagsSnapshot.join(' ')}</p> : null}</div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </SettingsDialog>
    </ContentShell>
  );
};
