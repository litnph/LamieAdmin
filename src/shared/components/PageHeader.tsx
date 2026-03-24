import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-serif font-bold text-admin-text-primary tracking-tight">{title}</h2>
        {description ? (
          <p className="text-sm text-admin-text-secondary mt-1.5 max-w-xl">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2.5">{actions}</div> : null}
    </div>
  );
};
