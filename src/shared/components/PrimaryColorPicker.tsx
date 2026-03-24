import React, { useEffect, useRef, useState } from 'react';
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

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
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
  }, []);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-2 text-admin-text-secondary hover:text-admin-text-primary hover:bg-admin-muted/60 rounded-xl transition-all duration-200"
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Chọn màu chủ đạo"
      >
        <Palette size={19} strokeWidth={1.75} />
      </button>

      {open ? (
        <div
          className="absolute right-0 top-full mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-slate-200/90 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.14)] ring-1 ring-black/5 p-3 z-[60] animate-slide-down"
          role="dialog"
          aria-label="Chọn màu primary"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 px-1 mb-2.5">
            Màu chủ đạo
          </p>
          <div className="grid grid-cols-5 gap-2 max-h-[min(14rem,40vh)] overflow-y-auto pr-0.5">
            {ADMIN_PRIMARY_PALETTE.map((hex) => {
              const selected = hex === current;
              return (
                <button
                  key={hex}
                  type="button"
                  title={hex}
                  onClick={() => {
                    selectAdminPrimaryHex(hex);
                    setCurrent(hex);
                    setOpen(false);
                  }}
                  className={`relative h-9 w-full rounded-xl border-2 transition-transform duration-150 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-admin-primary ${
                    selected ? 'ring-2 ring-offset-2 ring-admin-primary border-white shadow-md' : 'border-white/80 shadow-sm'
                  }`}
                  style={{ backgroundColor: hex }}
                >
                  {selected ? (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/55 shadow-sm ring-1 ring-white/40">
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
