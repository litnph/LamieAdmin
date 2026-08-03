import React from 'react';
import type { DashboardSourceError } from '../types/dashboard.types';

type RetryProps = {
  onRetry: () => void;
  retrying?: boolean;
};

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6" aria-label="Đang tải Dashboard" aria-busy="true">
    <span className="sr-only">Đang tải dữ liệu Dashboard</span>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-40 animate-pulse rounded-admin-panel border border-admin-border bg-admin-card p-5">
          <div className="h-4 w-24 rounded bg-admin-muted" />
          <div className="mt-5 h-8 w-32 rounded bg-admin-muted" />
          <div className="mt-4 h-3 w-full rounded bg-admin-muted" />
          <div className="mt-2 h-3 w-2/3 rounded bg-admin-muted" />
        </div>
      ))}
    </div>
    <div className="h-44 animate-pulse rounded-admin-panel border border-admin-border bg-admin-card p-5">
      <div className="h-5 w-44 rounded bg-admin-muted" />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-20 rounded-admin-control bg-admin-muted" />
        ))}
      </div>
    </div>
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="h-80 animate-pulse rounded-admin-panel border border-admin-border bg-admin-card" />
      <div className="h-80 animate-pulse rounded-admin-panel border border-admin-border bg-admin-card" />
    </div>
  </div>
);

export const DashboardError: React.FC<RetryProps> = ({ onRetry, retrying = false }) => (
  <section
    className="rounded-admin-panel border border-admin-status-error/30 bg-red-50 p-6 text-center"
    role="alert"
    aria-labelledby="dashboard-error-title"
  >
    <h2 id="dashboard-error-title" className="text-lg font-semibold text-admin-text-primary">
      Chưa thể tải Dashboard
    </h2>
    <p className="mx-auto mt-2 max-w-xl break-words text-sm leading-6 text-admin-text-secondary">
      Các nguồn dữ liệu hiện không phản hồi. Bạn có thể thử tải lại mà không cần rời trang.
    </p>
    <button
      type="button"
      onClick={onRetry}
      disabled={retrying}
      className="mt-4 inline-flex h-11 items-center justify-center rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text"
    >
      {retrying ? 'Đang thử lại' : 'Thử tải lại'}
    </button>
  </section>
);

type PartialDataWarningProps = RetryProps & {
  errors: DashboardSourceError[];
};

export const PartialDataWarning: React.FC<PartialDataWarningProps> = ({
  errors,
  onRetry,
  retrying = false,
}) => (
  <section
    className="flex flex-col gap-3 rounded-admin-panel border border-amber-300 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    role="status"
    aria-live="polite"
  >
    <div className="min-w-0">
      <p className="text-sm font-semibold text-amber-950">Một phần dữ liệu chưa tải được</p>
      <p className="mt-0.5 text-xs leading-5 text-amber-900">
        Thiếu dữ liệu: {errors.map((error) => error.label).join(', ')}. Các khu vực còn lại vẫn có thể sử dụng.
      </p>
    </div>
    <button
      type="button"
      onClick={onRetry}
      disabled={retrying}
      className="h-10 shrink-0 rounded-admin-control border border-amber-400 bg-white px-3 text-sm font-semibold text-amber-950 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {retrying ? 'Đang tải lại' : 'Tải lại dữ liệu thiếu'}
    </button>
  </section>
);

type SectionStateProps = {
  title: string;
  description: string;
};

export const SectionEmpty: React.FC<SectionStateProps> = ({ title, description }) => (
  <div className="flex min-h-36 flex-col items-center justify-center px-5 py-8 text-center">
    <p className="text-sm font-semibold text-admin-text-primary">{title}</p>
    <p className="mt-1 max-w-sm text-xs leading-5 text-admin-text-muted">{description}</p>
  </div>
);

export const SectionUnavailable: React.FC<SectionStateProps> = ({ title, description }) => (
  <div className="flex min-h-36 flex-col items-center justify-center bg-admin-muted/45 px-5 py-8 text-center" role="status">
    <p className="text-sm font-semibold text-admin-text-primary">{title}</p>
    <p className="mt-1 max-w-sm text-xs leading-5 text-admin-text-muted">{description}</p>
  </div>
);
