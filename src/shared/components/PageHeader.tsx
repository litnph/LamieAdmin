import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, subtitle, actions }) => {
  const supportingText = description ?? subtitle;

  return (
    <header className="mb-6 flex min-w-0 flex-col gap-4 sm:mb-7 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h1 className="text-balance text-2xl font-semibold leading-tight tracking-[-0.02em] text-admin-text-primary sm:text-[1.75rem]">
          {title}
        </h1>
        {supportingText ? (
          <p className="mt-1.5 max-w-[65ch] text-sm leading-6 text-admin-text-secondary">{supportingText}</p>
        ) : null}
      </div>
      {actions ? <div className="flex w-full flex-wrap items-center gap-2.5 md:w-auto md:justify-end">{actions}</div> : null}
    </header>
  );
};
