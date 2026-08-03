import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

type SettingsDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  closeLabel?: string;
  onRequestClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'medium' | 'wide';
  focusKey?: string;
};

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  title,
  description,
  closeLabel = 'Đóng hộp thoại',
  onRequestClose,
  children,
  footer,
  width = 'medium',
  focusKey = 'default',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const frame = window.requestAnimationFrame(() => {
      const autofocusTarget = dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]');
      const firstTarget = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (autofocusTarget ?? firstTarget ?? dialogRef.current)?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onRequestClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true',
      );
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      window.requestAnimationFrame(() => previousFocus?.focus());
    };
  }, [onRequestClose, open]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      const autofocusTarget = dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]');
      autofocusTarget?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusKey, open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-admin-modal flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/45"
        onClick={onRequestClose}
        aria-label={closeLabel}
        tabIndex={-1}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={[
          'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-admin-panel border border-admin-border bg-admin-card shadow-admin-popover sm:rounded-admin-panel',
          width === 'wide' ? 'sm:max-w-3xl' : 'sm:max-w-lg',
        ].join(' ')}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-admin-border px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold leading-6 text-admin-text-primary">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 max-w-[65ch] text-sm leading-5 text-admin-text-secondary">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onRequestClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-admin-control text-admin-text-secondary transition-colors hover:bg-admin-muted hover:text-admin-text-primary"
            aria-label={closeLabel}
          >
            <X size={20} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">{children}</div>
        {footer ? (
          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-admin-border bg-admin-muted/45 px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
};

type ConfirmationPanelProps = {
  title: string;
  description: string;
  confirmLabel: string;
  busy?: boolean;
  tone?: 'danger' | 'warning';
  onCancel: () => void;
  onConfirm: () => void;
};

export const ConfirmationPanel: React.FC<ConfirmationPanelProps> = ({
  title,
  description,
  confirmLabel,
  busy = false,
  tone = 'danger',
  onCancel,
  onConfirm,
}) => (
  <div className="space-y-5">
    <div
      className={[
        'rounded-admin-control border p-4',
        tone === 'danger'
          ? 'border-admin-status-error/30 bg-red-50 text-admin-status-error'
          : 'border-amber-300 bg-amber-50 text-amber-950',
      ].join(' ')}
      role="alert"
    >
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm leading-6">{description}</p>
    </div>
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={busy}
        className="h-11 rounded-admin-control border border-admin-border bg-admin-card px-4 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        Quay lại
      </button>
      <button
        type="button"
        data-autofocus
        onClick={onConfirm}
        disabled={busy}
        className={[
          'h-11 rounded-admin-control px-4 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          tone === 'danger' ? 'bg-admin-status-error hover:bg-red-800' : 'bg-amber-800 hover:bg-amber-900',
        ].join(' ')}
      >
        {busy ? 'Đang xử lý...' : confirmLabel}
      </button>
    </div>
  </div>
);
