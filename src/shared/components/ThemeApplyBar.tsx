import React from 'react';
import { Check, RotateCcw } from '@/shared/icons/lucideAnimated';
import { useAdminTheme } from '@/shared/theme/ThemeContext';
import { getAdminTheme } from '@/shared/theme/adminTheme';

type ThemeApplyBarProps = {
  forceVisible?: boolean;
  desktopOffset?: string;
};

export const ThemeApplyBar: React.FC<ThemeApplyBarProps> = ({ forceVisible = false, desktopOffset = '0px' }) => {
  const { previewThemeId, appliedThemeId, hasUnappliedPreview, applyPreview, cancelPreview } = useAdminTheme();
  if (!forceVisible && !hasUnappliedPreview) return null;

  const previewTheme = getAdminTheme(previewThemeId);
  const appliedTheme = getAdminTheme(appliedThemeId);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-admin-popover border-t border-admin-border bg-admin-card/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_36px_rgb(0_0_0/0.08)] backdrop-blur-lg lg:left-[var(--theme-bar-offset)] lg:px-6"
      style={{ '--theme-bar-offset': desktopOffset } as React.CSSProperties}
      role="region"
      aria-label="Thao tác chủ đề"
    >
      <div className="mx-auto flex w-full max-w-admin-content flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-admin-text-primary">
            {hasUnappliedPreview ? `Đang xem trước: ${previewTheme.name}` : `Đang áp dụng: ${appliedTheme.name}`}
          </p>
          <p className="mt-0.5 hidden text-[11px] text-admin-text-muted sm:block">
            {hasUnappliedPreview ? 'Thay đổi chưa được lưu.' : 'Chọn một thẻ khác để xem trước.'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={cancelPreview}
            disabled={!hasUnappliedPreview}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-admin-control border border-admin-border bg-admin-card px-4 text-sm font-semibold text-admin-text-secondary transition-colors hover:bg-admin-muted hover:text-admin-text-primary disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text"
          >
            <RotateCcw size={16} aria-hidden="true" />
            Hủy xem trước
          </button>
          <button
            type="button"
            onClick={applyPreview}
            disabled={!hasUnappliedPreview}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text"
          >
            <Check size={16} aria-hidden="true" />
            Áp dụng chủ đề
          </button>
        </div>
      </div>
    </div>
  );
};
