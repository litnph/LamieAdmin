import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  FolderTree,
  Gift,
  Languages,
  Layers3,
  Palette,
  Radio,
  Tags,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';

type SettingsNavigationItem = {
  label: string;
  description: string;
  to: string;
  icon?: LucideIcon;
};

type SettingsNavigationGroup = {
  label: string;
  items: SettingsNavigationItem[];
};

const SETTINGS_NAVIGATION: SettingsNavigationGroup[] = [
  {
    label: 'Bán hàng',
    items: [
      {
        label: 'Kênh bán',
        description: 'Nguồn tiếp nhận đơn hàng',
        to: '/admin/settings/channels',
        icon: Radio,
      },
    ],
  },
  {
    label: 'Thuộc tính sản phẩm',
    items: [
      { label: 'Danh mục', description: 'Nhóm sản phẩm chính', to: '/admin/settings/attributes/categories', icon: FolderTree },
      { label: 'Dòng sản phẩm', description: 'Hoa tươi, hoa sáp', to: '/admin/settings/attributes/product-types', icon: Layers3 },
      { label: 'Bộ sưu tập', description: 'Nhóm theo chiến dịch', to: '/admin/settings/attributes/collections', icon: Layers3 },
      { label: 'Màu sắc', description: 'Màu dùng cho sản phẩm', to: '/admin/settings/attributes/colors', icon: Palette },
      { label: 'Ngôn ngữ', description: 'Ngôn ngữ của nội dung', to: '/admin/settings/attributes/languages', icon: Languages },
      { label: 'Dịp', description: 'Dịp tặng hoa', to: '/admin/settings/attributes/occasions', icon: Gift },
      { label: 'Phong cách', description: 'Phong cách thiết kế', to: '/admin/settings/attributes/styles', icon: WandSparkles },
      { label: 'Thẻ', description: 'Nhãn hỗ trợ tìm kiếm', to: '/admin/settings/attributes/tags', icon: Tags },
    ],
  },
];

type SettingsShellProps = {
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

const isNavigationItemActive = (pathname: string, to: string) => pathname === to;

export const SettingsShell: React.FC<SettingsShellProps> = ({ title, description, actions, children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const allItems = SETTINGS_NAVIGATION.flatMap((group) => group.items);
  const selectedPath = allItems.find((item) => isNavigationItemActive(location.pathname, item.to))?.to ?? '';

  return (
    <div className="min-w-0">
      <PageHeader
        title="Cài đặt"
        description="Quản lý các cấu hình đang được dùng trong quy trình bán hàng và dữ liệu sản phẩm."
      />

      <div className="mb-5 lg:hidden">
        <label htmlFor="settings-section" className="mb-1.5 block text-sm font-semibold text-admin-text-primary">
          Nhóm cài đặt
        </label>
        <select
          id="settings-section"
          value={selectedPath}
          onChange={(event) => navigate(event.target.value)}
          className="h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 text-sm text-admin-text-primary focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/15"
        >
          {SETTINGS_NAVIGATION.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.items.map((item) => (
                <option key={item.to} value={item.to}>
                  {item.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="mt-1.5 text-xs leading-5 text-admin-text-muted">
          Chọn một nhóm để mở đúng cài đặt mà không cần cuộn ngang.
        </p>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] xl:gap-8">
        <aside className="hidden lg:block" aria-label="Các nhóm cài đặt">
          <nav className="sticky top-0 space-y-5 rounded-admin-panel border border-admin-border bg-admin-card p-3 shadow-admin-panel">
            {SETTINGS_NAVIGATION.map((group) => (
              <section key={group.label} aria-labelledby={`settings-group-${group.label.replace(/\s+/g, '-').toLowerCase()}`}>
                <h2
                  id={`settings-group-${group.label.replace(/\s+/g, '-').toLowerCase()}`}
                  className="mb-1.5 px-2 text-xs font-semibold text-admin-text-muted"
                >
                  {group.label}
                </h2>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          [
                            'group flex min-h-11 items-center gap-2.5 rounded-admin-control px-2.5 py-2 text-sm transition-colors',
                            isActive
                              ? 'bg-admin-primary/10 font-semibold text-admin-primary'
                              : 'text-admin-text-secondary hover:bg-admin-muted hover:text-admin-text-primary',
                          ].join(' ')
                        }
                      >
                        {Icon ? <Icon size={17} strokeWidth={1.8} aria-hidden="true" /> : null}
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        <ChevronRight
                          size={15}
                          strokeWidth={1.8}
                          className="shrink-0 opacity-45 group-hover:opacity-75"
                          aria-hidden="true"
                        />
                      </NavLink>
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>
        </aside>

        <section className="min-w-0" aria-labelledby="settings-content-title">
          <header className="mb-5 flex min-w-0 flex-col gap-4 border-b border-admin-border pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2 id="settings-content-title" className="text-xl font-semibold tracking-[-0.015em] text-admin-text-primary">
                {title}
              </h2>
              <p className="mt-1 max-w-[65ch] text-sm leading-6 text-admin-text-secondary">{description}</p>
            </div>
            {actions ? <div className="flex w-full min-w-0 shrink-0 flex-wrap gap-2 sm:w-auto sm:justify-end">{actions}</div> : null}
          </header>
          {children}
        </section>
      </div>
    </div>
  );
};

type SettingsStatusProps = {
  kind: 'success' | 'error' | 'info';
  children: React.ReactNode;
};

export const SettingsStatus: React.FC<SettingsStatusProps> = ({ kind, children }) => {
  const styles = {
    success: 'border-admin-status-success/30 bg-green-50 text-admin-status-success',
    error: 'border-admin-status-error/30 bg-red-50 text-admin-status-error',
    info: 'border-admin-status-info/30 bg-sky-50 text-admin-status-info',
  }[kind];

  return (
    <div
      className={`rounded-admin-control border px-3.5 py-3 text-sm leading-5 ${styles}`}
      role={kind === 'error' ? 'alert' : 'status'}
      aria-live={kind === 'error' ? 'assertive' : 'polite'}
    >
      {children}
    </div>
  );
};
