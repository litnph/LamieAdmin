import React, { useEffect, useId, useRef, useState } from 'react';
import { Palette, Check } from 'lucide-react';
import {
  ADMIN_PRIMARY_CHANGE_EVENT,
  ADMIN_PRIMARY_PALETTE,
  getStoredAdminPrimaryHex,
  selectAdminPrimaryHex,
} from '@/shared/theme/adminPrimary';

export const PrimaryColorPicker: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(() => getStoredAdminPrimaryHex());
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogId = useId().replace(/:/g, '');
  const titleId = `${dialogId}-title`;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !open) return;
      setOpen(false);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    };
    const onTheme = () => setCurrent(getStoredAdminPrimaryHex());
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener(ADMIN_PRIMARY_CHANGE_EVENT, onTheme);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener(ADMIN_PRIMARY_CHANGE_EVENT, onTheme);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-admin-control text-admin-text-secondary transition-colors duration-150 hover:bg-admin-muted hover:text-admin-text-primary"
        aria-label="Chọn màu chủ đạo"
        aria-controls={dialogId}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Chọn màu chủ đạo"
      >
        <Palette size={19} strokeWidth={1.75} />
      </button>

      {open ? (
        <div
          id={dialogId}
          className="fixed left-3 right-3 top-[4.5rem] z-admin-popover w-auto rounded-admin-panel border border-admin-border bg-admin-card p-3 shadow-admin-popover animate-slide-down sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[min(18rem,calc(100vw-1.5rem))]"
          role="dialog"
          aria-labelledby={titleId}
        >
          <h2 id={titleId} className="mb-2.5 px-1 text-xs font-semibold text-admin-text-secondary">
            Màu chủ đạo
          </h2>
          <div className="grid grid-cols-5 gap-2 max-h-[min(14rem,40vh)] overflow-y-auto pr-0.5">
            {ADMIN_PRIMARY_PALETTE.map((hex) => {
              const selected = hex === current;
              return (
                <button
                  key={hex}
                  type="button"
                  aria-label={`${selected ? 'Màu đang chọn' : 'Chọn màu'} ${hex}`}
                  aria-pressed={selected}
                  title={`${selected ? 'Đang chọn' : 'Chọn'} ${hex}`}
                  onClick={() => {
                    selectAdminPrimaryHex(hex);
                    setCurrent(hex);
                    setOpen(false);
                    window.requestAnimationFrame(() => triggerRef.current?.focus());
                  }}
                  className={`relative h-11 w-full rounded-admin-control border-2 transition-transform duration-150 hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary focus-visible:ring-offset-2 ${
                    selected ? 'border-white ring-2 ring-admin-primary ring-offset-2' : 'border-white/80'
                  }`}
                  style={{ backgroundColor: hex }}
                >
                  {selected ? (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950/70 ring-1 ring-white/50">
                        <Check size={14} className="text-white" strokeWidth={2.8} />
                      </span>
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};
