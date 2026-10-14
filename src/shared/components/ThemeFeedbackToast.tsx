import React from 'react';
import { CheckCircle2, CircleAlert, Info, X } from '@/shared/icons/lucideAnimated';
import { useAdminTheme } from '@/shared/theme/ThemeContext';

export const ThemeFeedbackToast: React.FC = () => {
  const { feedback, clearFeedback } = useAdminTheme();
  if (!feedback) return null;
  const Icon = feedback.tone === 'success' ? CheckCircle2 : feedback.tone === 'warning' ? CircleAlert : Info;
  const tone = feedback.tone === 'success'
    ? 'border-admin-status-success/30 bg-admin-status-success-bg text-admin-status-success'
    : feedback.tone === 'warning'
      ? 'border-admin-status-warning/30 bg-admin-status-warning-bg text-admin-status-warning'
      : 'border-admin-status-info/30 bg-admin-status-info-bg text-admin-status-info';

  return (
    <div className={`fixed right-3 top-20 z-admin-modal flex max-w-[calc(100vw-1.5rem)] items-start gap-2 rounded-admin-control border px-3 py-2.5 shadow-admin-popover ${tone}`} role="status" aria-live="polite">
      <Icon size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p className="text-xs font-medium leading-5">{feedback.message}</p>
      <button type="button" onClick={clearFeedback} className="grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-current/10" aria-label="Đóng thông báo">
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
};
