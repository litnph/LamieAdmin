import React from 'react';
import { AlertCircle } from '@/shared/icons/lucideAnimated';

export const UnavailableFinanceData: React.FC<{ title: string; children: React.ReactNode; action?: React.ReactNode }> = ({ title, children, action }) => (
  <section className="finance-unavailable" role="status">
    <AlertCircle size={21} aria-hidden="true" />
    <div><h2>{title}</h2><p>{children}</p>{action ? <div className="mt-4">{action}</div> : null}</div>
  </section>
);
