import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChartNoAxesCombined, Flower2, Ruler } from '@/shared/icons/lucideAnimated';
import { useAuth } from '@/features/auth/context/AuthContext';
import { PageHeader } from '@/shared/components/PageHeader';

type IngredientShellProps = {
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

const links = [
  { to: '/admin/ingredients', label: 'Danh mục chuẩn bị', icon: Flower2, permission: 'ingredients.view', end: true },
  { to: '/admin/ingredients/units', label: 'Đơn vị tính', icon: Ruler, permission: 'ingredients.view', end: false },
  { to: '/admin/ingredients/demand', label: 'Nguyên liệu cần chuẩn bị', icon: ChartNoAxesCombined, permission: 'ingredient-reports.view', end: false },
] as const;

export const IngredientShell: React.FC<IngredientShellProps> = ({ title, description, actions, children }) => {
  const { hasPermission } = useAuth();

  return (
    <div className="min-w-0">
      <PageHeader title={title} description={description} actions={actions} />
      <nav className="mb-5 flex max-w-full gap-1 overflow-x-auto border-b border-admin-border pb-px" aria-label="Khu vực nguyên liệu">
        {links.filter((link) => hasPermission(link.permission)).map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => [
              'inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors',
              isActive
                ? 'border-admin-primary text-admin-primary'
                : 'border-transparent text-admin-text-secondary hover:text-admin-text-primary',
            ].join(' ')}
          >
            <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
      {children}
    </div>
  );
};

export const IngredientStatus: React.FC<{
  kind: 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
}> = ({ kind, children }) => {
  const styles = {
    success: 'border-admin-status-success/30 bg-green-50 text-admin-status-success',
    error: 'border-admin-status-error/30 bg-red-50 text-admin-status-error',
    warning: 'border-admin-status-warning/30 bg-amber-50 text-admin-status-warning',
    info: 'border-admin-status-info/30 bg-sky-50 text-admin-status-info',
  }[kind];
  return (
    <div className={`rounded-admin-control border px-4 py-3 text-sm leading-6 ${styles}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
};

export const formatDecimalQuantity = (value: string | number): string => {
  const normalized = String(value ?? '').trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return normalized || '0';
  const negative = normalized.startsWith('-');
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [whole, fraction = ''] = unsigned.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const trimmedFraction = fraction.replace(/0+$/, '');
  return `${negative ? '-' : ''}${grouped}${trimmedFraction ? `,${trimmedFraction}` : ''}`;
};
