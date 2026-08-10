import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff, LoaderCircle } from 'lucide-react';
import { SettingsDialog } from '@/features/settings/components/SettingsDialog';
import { resolveApiResourceUrl } from '@/services/apiResourceUrl';

export type ImagePreviewItem = {
  src: string | null | undefined;
  alt: string;
  title?: string;
  caption?: string;
};

type ResolvedPreviewItem = Omit<ImagePreviewItem, 'src'> & { src: string };

type ImagePreviewProps = ImagePreviewItem & {
  thumbnailSrc?: string | null;
  gallery?: readonly ImagePreviewItem[];
  previewTitle?: string;
  openHint?: string;
  thumbnailClassName?: string;
  buttonClassName?: string;
  fallbackClassName?: string;
  loading?: 'eager' | 'lazy';
};

const defaultThumbnailClassName =
  'h-12 w-12 rounded-admin-control border border-admin-border object-cover';

const resolvePreviewItems = (
  source: ImagePreviewItem,
  gallery: readonly ImagePreviewItem[] | undefined,
): ResolvedPreviewItem[] => {
  const sourceUrl = resolveApiResourceUrl(source.src);
  const candidates = gallery?.length ? [...gallery] : [source];
  const resolved = candidates.flatMap<ResolvedPreviewItem>((item) => {
    const resolvedUrl = resolveApiResourceUrl(item.src);
    return resolvedUrl ? [{ ...item, src: resolvedUrl }] : [];
  });

  if (sourceUrl && !resolved.some((item) => item.src === sourceUrl)) {
    resolved.unshift({ ...source, src: sourceUrl });
  }

  return resolved.filter(
    (item, index, items) => items.findIndex((candidate) => candidate.src === item.src) === index,
  );
};

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  src,
  thumbnailSrc,
  alt,
  title,
  caption,
  gallery,
  previewTitle,
  openHint = 'Nhấp đúp để xem ảnh lớn',
  thumbnailClassName = defaultThumbnailClassName,
  buttonClassName = '',
  fallbackClassName = '',
  loading = 'lazy',
}) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewFailed, setPreviewFailed] = useState(false);

  const source: ImagePreviewItem = { src, alt, title, caption };
  const previewItems = resolvePreviewItems(source, gallery);
  const resolvedSource = resolveApiResourceUrl(src);
  const resolvedThumbnail = resolveApiResourceUrl(thumbnailSrc) || resolvedSource;
  const activeItem = previewItems[activeIndex] ?? previewItems[0];
  const hasGallery = previewItems.length > 1;

  useEffect(() => {
    setThumbnailFailed(false);
  }, [resolvedThumbnail]);

  useEffect(() => {
    if (!open) return;
    setPreviewLoading(true);
    setPreviewFailed(false);
  }, [activeItem?.src, open]);

  useEffect(() => {
    if (!open || !hasGallery) return;

    const handleGalleryKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setActiveIndex((current) => (current - 1 + previewItems.length) % previewItems.length);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setActiveIndex((current) => (current + 1) % previewItems.length);
      }
    };

    document.addEventListener('keydown', handleGalleryKeyDown);
    return () => document.removeEventListener('keydown', handleGalleryKeyDown);
  }, [hasGallery, open, previewItems.length]);

  const showPreview = () => {
    if (previewItems.length === 0) return;
    const sourceIndex = previewItems.findIndex((item) => item.src === resolvedSource);
    setActiveIndex(sourceIndex >= 0 ? sourceIndex : 0);
    setOpen(true);
  };

  const movePreview = (direction: -1 | 1) => {
    setActiveIndex((current) => (current + direction + previewItems.length) % previewItems.length);
  };

  if (!resolvedThumbnail || thumbnailFailed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center bg-admin-muted text-admin-text-muted ${thumbnailClassName} ${fallbackClassName}`}
        role="img"
        aria-label={`Không có ảnh: ${alt}`}
        title="Không có ảnh"
      >
        <ImageOff size={18} strokeWidth={1.7} aria-hidden="true" />
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className={`group inline-flex max-w-full shrink-0 cursor-zoom-in overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/30 ${buttonClassName}`}
        aria-haspopup="dialog"
        aria-label={`${openHint}: ${alt}`}
        title={openHint}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onDoubleClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          showPreview();
        }}
        onPointerUp={(event) => {
          if (event.pointerType === 'mouse') return;
          event.preventDefault();
          event.stopPropagation();
          showPreview();
        }}
        onKeyDown={(event) => {
          if ((event.key !== 'Enter' && event.key !== ' ') || event.repeat) return;
          event.preventDefault();
          event.stopPropagation();
          showPreview();
        }}
      >
        <img
          src={resolvedThumbnail}
          alt={alt}
          loading={loading}
          decoding="async"
          onError={() => setThumbnailFailed(true)}
          className={`${thumbnailClassName} transition-opacity group-hover:opacity-90`}
        />
      </button>

      <SettingsDialog
        open={open}
        title={previewTitle || activeItem?.title || title || alt}
        description={activeItem?.caption}
        closeLabel="Đóng xem ảnh lớn"
        width="viewport"
        focusKey={activeItem?.src}
        onRequestClose={() => setOpen(false)}
        footer={hasGallery ? (
          <div className="flex w-full items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => movePreview(-1)}
              className="btn-press inline-flex min-h-11 items-center gap-1.5 rounded-admin-control border border-admin-border bg-admin-card px-3 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted"
              aria-label="Ảnh trước"
            >
              <ChevronLeft size={17} strokeWidth={1.8} aria-hidden="true" />
              <span className="hidden sm:inline">Trước</span>
            </button>
            <span className="text-sm tabular-nums text-admin-text-secondary" aria-live="polite">
              Ảnh {activeIndex + 1} / {previewItems.length}
            </span>
            <button
              type="button"
              onClick={() => movePreview(1)}
              className="btn-press inline-flex min-h-11 items-center gap-1.5 rounded-admin-control border border-admin-border bg-admin-card px-3 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted"
              aria-label="Ảnh tiếp theo"
            >
              <span className="hidden sm:inline">Tiếp</span>
              <ChevronRight size={17} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>
        ) : undefined}
      >
        <div className="relative flex h-[min(68dvh,48rem)] min-h-64 items-center justify-center overflow-hidden rounded-admin-control bg-slate-950 p-2 sm:min-h-80">
          {previewLoading && !previewFailed ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-200" role="status">
              <LoaderCircle size={24} className="animate-spin" aria-hidden="true" />
              <span className="ml-2 text-sm">Đang tải ảnh</span>
            </div>
          ) : null}
          {previewFailed || !activeItem ? (
            <div className="flex flex-col items-center justify-center px-4 text-center text-slate-200" role="status">
              <ImageOff size={36} strokeWidth={1.6} aria-hidden="true" />
              <p className="mt-3 text-sm font-medium">Không thể hiển thị ảnh này.</p>
            </div>
          ) : (
            <img
              src={activeItem.src}
              alt={activeItem.alt}
              decoding="async"
              onLoad={() => setPreviewLoading(false)}
              onError={() => {
                setPreviewLoading(false);
                setPreviewFailed(true);
              }}
              className={`max-h-full max-w-full object-contain ${previewLoading ? 'opacity-0' : 'opacity-100'}`}
            />
          )}
        </div>
      </SettingsDialog>
    </>
  );
};
