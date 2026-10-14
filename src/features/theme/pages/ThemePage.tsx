import React, { useMemo, useRef } from 'react';
import { Check, MonitorUp, Moon, Sparkles } from '@/shared/icons/lucideAnimated';
import { PageHeader } from '@/shared/components/PageHeader';
import { useAdminTheme } from '@/shared/theme/ThemeContext';
import { ADMIN_THEMES, getAdminTheme, type AdminTheme } from '@/shared/theme/adminTheme';

const ThemePreview: React.FC<{ theme: AdminTheme }> = ({ theme }) => (
  <div
    className="relative h-44 overflow-hidden border-b"
    style={{ background: theme.preview.background, borderColor: `${theme.preview.text}18` }}
    aria-hidden="true"
  >
    <div className="absolute inset-y-0 left-0 w-[28%] p-3" style={{ background: theme.preview.sidebar }}>
      <div className="flex items-center gap-1.5">
        <span className="grid h-5 w-5 place-items-center rounded text-[8px] font-bold" style={{ background: theme.preview.selected, color: theme.preview.sidebar }}>
          L
        </span>
        <span className="h-1.5 w-12 rounded-full opacity-80" style={{ background: theme.preview.sidebarText }} />
      </div>
      <div className="mt-6 space-y-2.5">
        {[1, 0.55, 0.72, 0.5].map((opacity, index) => (
          <div
            key={index}
            className="h-2 rounded-full"
            style={{ background: index === 0 ? theme.preview.selected : theme.preview.sidebarText, opacity }}
          />
        ))}
      </div>
    </div>
    <div className="absolute inset-y-0 right-0 w-[72%] p-3.5">
      <div className="flex items-center justify-between">
        <div className="h-2 w-20 rounded-full" style={{ background: theme.preview.text, opacity: 0.82 }} />
        <div className="h-5 w-12" style={{ borderRadius: theme.preview.radius, background: theme.preview.accent }} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-10 border p-2"
            style={{ borderRadius: theme.preview.radius, background: theme.preview.surface, borderColor: `${theme.preview.text}16` }}
          >
            <div className="h-1 w-7 rounded-full" style={{ background: theme.preview.text, opacity: 0.28 }} />
            <div className="mt-2 h-1.5 w-10 rounded-full" style={{ background: item === 1 ? theme.preview.accent : theme.preview.text, opacity: item === 1 ? 0.9 : 0.72 }} />
          </div>
        ))}
      </div>
      <div
        className="mt-2.5 h-[4.65rem] border p-2"
        style={{ borderRadius: theme.preview.radius, background: theme.preview.surface, borderColor: `${theme.preview.text}16` }}
      >
        <div className="flex h-full items-end gap-1.5">
          {[42, 70, 54, 88, 62, 78].map((height, index) => (
            <span
              key={index}
              className="flex-1 rounded-t-sm"
              style={{ height: `${height}%`, background: index % 2 ? theme.preview.soft : theme.preview.accent }}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const ThemePage: React.FC = () => {
  const {
    appliedThemeId,
    previewThemeId,
    previewTheme,
    motionEnabled,
    setMotionEnabled,
    prefersReducedMotion,
  } = useAdminTheme();
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const appliedTheme = useMemo(() => getAdminTheme(appliedThemeId), [appliedThemeId]);

  const moveSelection = (currentIndex: number, key: string) => {
    let nextIndex = currentIndex;
    if (key === 'ArrowRight' || key === 'ArrowDown') nextIndex = (currentIndex + 1) % ADMIN_THEMES.length;
    if (key === 'ArrowLeft' || key === 'ArrowUp') nextIndex = (currentIndex - 1 + ADMIN_THEMES.length) % ADMIN_THEMES.length;
    if (key === 'Home') nextIndex = 0;
    if (key === 'End') nextIndex = ADMIN_THEMES.length - 1;
    if (nextIndex === currentIndex) return;
    previewTheme(ADMIN_THEMES[nextIndex].id);
    cardRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="pb-20 sm:pb-16">
      <PageHeader
        eyebrow="Cá nhân hóa không gian làm việc"
        title="Chủ đề giao diện"
        description="Chọn một phong cách phù hợp với cách bạn vận hành Lamie. Xem trước được áp dụng ngay trên toàn bộ giao diện và chỉ được lưu khi bạn xác nhận."
        actions={(
          <div className="flex items-center gap-2 rounded-full border border-admin-border bg-admin-card px-3 py-2 text-xs text-admin-text-secondary shadow-admin-panel">
            <span className="h-2 w-2 rounded-full bg-admin-primary" aria-hidden="true" />
            Đang dùng <strong className="font-semibold text-admin-text-primary">{appliedTheme.name}</strong>
          </div>
        )}
      />

      <section
        className="mb-7 overflow-hidden rounded-admin-panel border border-admin-border px-5 py-6 shadow-admin-panel sm:px-7 sm:py-7"
        style={{ background: 'var(--admin-hero)', color: 'var(--admin-hero-text)' }}
        aria-labelledby="theme-intro-title"
      >
        <div className="flex max-w-3xl items-start gap-4">
          <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-admin-control border border-current/20 bg-current/10">
            <Sparkles size={19} aria-hidden="true" />
          </span>
          <div>
            <h2 id="theme-intro-title" className="text-lg font-semibold tracking-[-0.01em]">Sáu sắc thái, một trải nghiệm Lamie</h2>
            <p className="mt-1.5 text-sm leading-6 opacity-80">
              Mỗi chủ đề điều chỉnh đồng bộ nền, bề mặt, biểu đồ, đường viền, độ bo và tương phản — không chỉ riêng màu nút.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="theme-grid-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="theme-grid-title" className="text-base font-semibold text-admin-text-primary">Bộ sưu tập chủ đề</h2>
            <p className="mt-1 text-xs text-admin-text-muted">Dùng phím mũi tên để di chuyển giữa các lựa chọn.</p>
          </div>
          <span className="hidden text-xs font-medium text-admin-text-muted sm:inline">{ADMIN_THEMES.length} chủ đề</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" role="radiogroup" aria-label="Chọn chủ đề giao diện">
          {ADMIN_THEMES.map((theme, index) => {
            const selected = previewThemeId === theme.id;
            const applied = appliedThemeId === theme.id;
            return (
              <button
                key={theme.id}
                ref={(element) => { cardRefs.current[index] = element; }}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => previewTheme(theme.id)}
                onKeyDown={(event) => {
                  if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
                    event.preventDefault();
                    moveSelection(index, event.key);
                  }
                }}
                className={`group overflow-hidden rounded-admin-panel border bg-admin-card text-left shadow-admin-panel transition-[border-color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary focus-visible:ring-offset-2 focus-visible:ring-offset-admin-bg ${selected ? 'border-admin-primary ring-1 ring-admin-primary' : 'border-admin-border hover:-translate-y-0.5 hover:border-admin-primary/45'}`}
              >
                <ThemePreview theme={theme} />
                <span className="flex min-h-[7.75rem] items-start gap-3 p-4">
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="text-[10px] font-semibold tracking-[0.18em] text-admin-text-muted">{theme.number}</span>
                      <span className="text-sm font-semibold text-admin-text-primary">{theme.name}</span>
                    </span>
                    <span className="mt-1 block text-xs font-medium text-admin-primary">{theme.vietnameseName}</span>
                    <span className="mt-2 block text-xs leading-5 text-admin-text-secondary">{theme.description}</span>
                    <span className="mt-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-admin-text-muted">{theme.mood}</span>
                  </span>
                  <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${selected ? 'border-admin-primary bg-admin-primary text-admin-primary-foreground' : 'border-admin-border text-transparent'}`} aria-hidden="true">
                    <Check size={14} strokeWidth={2.5} />
                  </span>
                </span>
                <span className="sr-only">{selected ? 'Đang xem trước.' : ''} {applied ? 'Chủ đề đang áp dụng.' : ''}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-7 flex flex-col gap-4 rounded-admin-panel border border-admin-border bg-admin-card p-4 shadow-admin-panel sm:flex-row sm:items-center sm:justify-between sm:p-5" aria-labelledby="motion-title">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-admin-control bg-admin-muted text-admin-primary">
            {prefersReducedMotion ? <Moon size={17} aria-hidden="true" /> : <MonitorUp size={17} aria-hidden="true" />}
          </span>
          <div>
            <h2 id="motion-title" className="text-sm font-semibold text-admin-text-primary">Chuyển động nhẹ</h2>
            <p className="mt-1 text-xs leading-5 text-admin-text-secondary">
              {prefersReducedMotion
                ? 'Hệ điều hành đang yêu cầu giảm chuyển động, nên icon sidebar sẽ đứng yên.'
                : 'Cho phép icon sidebar chuyển động khi rê chuột, focus hoặc chạm.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={motionEnabled}
          onClick={() => setMotionEnabled(!motionEnabled)}
          className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary focus-visible:ring-offset-2 ${motionEnabled ? 'border-admin-primary bg-admin-primary' : 'border-admin-border bg-admin-disabled-bg'}`}
          aria-label="Bật hoặc tắt chuyển động nhẹ của icon sidebar"
        >
          <span className={`absolute top-1 h-[1.125rem] w-[1.125rem] rounded-full shadow-sm transition-transform ${motionEnabled ? 'translate-x-6 bg-admin-primary-foreground' : 'translate-x-1 bg-admin-text-muted'}`} />
        </button>
      </section>
    </div>
  );
};
