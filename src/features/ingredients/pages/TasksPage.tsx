import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCw, Search } from '@/shared/icons/lucideAnimated';
import { useAuth } from '@/features/auth/context/AuthContext';
import { PageHeader } from '@/shared/components/PageHeader';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { inventoryApi } from '../api/inventoryApi';
import { formatDecimalQuantity, IngredientStatus } from '../components/IngredientShell';
import { IngredientDemandReportPage } from './IngredientDemandReportPage';
import {
  InventoryStockStatus,
  type PagedReplenishmentTasks,
} from '../types/inventory.types';

const PAGE_SIZE = 20;
const emptyTasks: PagedReplenishmentTasks = {
  items: [],
  totalCount: 0,
  pendingCount: 0,
  page: 1,
  pageSize: PAGE_SIZE,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

type TaskTab = 'preparation' | 'replenishment';

export const TasksPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canViewPreparation = hasPermission('ingredient-reports.view');
  const canViewReplenishment = hasPermission('inventory.view');
  const availableTabs = useMemo<TaskTab[]>(() => [
    ...(canViewPreparation ? ['preparation' as const] : []),
    ...(canViewReplenishment ? ['replenishment' as const] : []),
  ], [canViewPreparation, canViewReplenishment]);
  const [activeTab, setActiveTab] = useState<TaskTab>(() => (
    canViewPreparation ? 'preparation' : 'replenishment'
  ));
  const [tasks, setTasks] = useState<PagedReplenishmentTasks>(emptyTasks);
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(canViewReplenishment);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!availableTabs.includes(activeTab)) setActiveTab(availableTabs[0] ?? 'preparation');
  }, [activeTab, availableTabs]);

  const loadTasks = useCallback(async (keepCurrent = false) => {
    if (!canViewReplenishment) return;
    keepCurrent ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      setTasks(await inventoryApi.replenishmentTasks({ search, page, pageSize: PAGE_SIZE }));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [canViewReplenishment, page, search]);

  useEffect(() => {
    void loadTasks(false);
  }, [loadTasks]);

  if (availableTabs.length === 0) {
    return (
      <IngredientStatus kind="error">
        Tài khoản chưa có quyền xem nguyên liệu cần chuẩn bị hoặc cảnh báo nhập hàng.
      </IngredientStatus>
    );
  }

  const applySearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchText.trim());
  };

  return (
    <div className="min-w-0">
      <PageHeader
        title="Việc cần làm"
        description="Theo dõi nguyên liệu cần chuẩn bị theo lịch giao và các mặt hàng đang chạm ngưỡng cảnh báo tồn kho."
        actions={canViewReplenishment ? (
          <button
            type="button"
            onClick={() => void loadTasks(true)}
            disabled={loading || refreshing}
            className="inline-flex h-11 items-center gap-2 rounded-admin-control border border-admin-border bg-admin-card px-4 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : undefined} aria-hidden="true" />
            {refreshing ? 'Đang cập nhật' : 'Làm mới'}
          </button>
        ) : undefined}
      />

      <div className="mb-5 flex max-w-full gap-1 overflow-x-auto border-b border-admin-border" role="tablist" aria-label="Nhóm việc cần làm">
        {canViewPreparation ? (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'preparation'}
            onClick={() => setActiveTab('preparation')}
            className={`min-h-11 shrink-0 border-b-2 px-3 text-sm font-semibold transition-colors ${activeTab === 'preparation' ? 'border-admin-primary text-admin-primary' : 'border-transparent text-admin-text-secondary hover:text-admin-text-primary'}`}
          >
            Nguyên liệu cần chuẩn bị
          </button>
        ) : null}
        {canViewReplenishment ? (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'replenishment'}
            onClick={() => setActiveTab('replenishment')}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors ${activeTab === 'replenishment' ? 'border-admin-primary text-admin-primary' : 'border-transparent text-admin-text-secondary hover:text-admin-text-primary'}`}
          >
            Việc nhập hàng
            <span className="inline-flex min-w-6 items-center justify-center rounded-md bg-admin-primary/10 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-admin-primary" aria-label={`${tasks.pendingCount} việc nhập hàng chưa hoàn thành`}>
              {tasks.pendingCount}
            </span>
          </button>
        ) : null}
      </div>

      {activeTab === 'preparation' && canViewPreparation ? (
        <div role="tabpanel"><IngredientDemandReportPage embedded /></div>
      ) : null}

      {activeTab === 'replenishment' && canViewReplenishment ? (
        <div className="space-y-4" role="tabpanel">
          <form onSubmit={applySearch} className="flex flex-col gap-3 rounded-admin-panel border border-admin-border bg-admin-surface p-4 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1">
              <span className="mb-1.5 block text-sm font-medium text-admin-text-primary">Tìm mặt hàng cần nhập</span>
              <span className="relative block">
                <Search size={17} className="pointer-events-none absolute left-3 top-3 text-admin-text-muted" aria-hidden="true" />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  className="h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card pl-9 pr-3 text-sm text-admin-text-primary outline-none placeholder:text-admin-text-muted focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/15"
                  placeholder="Mã, tên hoặc size"
                />
              </span>
            </label>
            <button type="submit" className="h-11 rounded-admin-control bg-admin-primary px-5 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover">Tìm kiếm</button>
          </form>

          {error ? <IngredientStatus kind="error">{error}</IngredientStatus> : null}
          {loading ? (
            <div className="flex min-h-64 items-center justify-center rounded-admin-panel border border-admin-border bg-admin-surface text-sm text-admin-text-secondary" role="status">Đang tải việc nhập hàng...</div>
          ) : tasks.items.length === 0 ? (
            <div className="rounded-admin-panel border border-dashed border-admin-border bg-admin-surface px-5 py-14 text-center">
              <p className="font-semibold text-admin-text-primary">Không có việc nhập hàng đang chờ</p>
              <p className="mt-1 text-sm text-admin-text-secondary">Các mặt hàng đang hoạt động đều cao hơn ngưỡng cảnh báo.</p>
            </div>
          ) : (
            <section className="overflow-hidden rounded-admin-panel border border-admin-border bg-admin-surface shadow-admin-panel" aria-label="Danh sách việc nhập hàng">
              <div className="hidden grid-cols-[minmax(14rem,1.4fr)_8rem_10rem_9rem] gap-4 border-b border-admin-border bg-admin-muted/45 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-admin-text-muted md:grid">
                <span>Mặt hàng</span><span>Size</span><span className="text-right">Tồn / Ngưỡng</span><span>Trạng thái</span>
              </div>
              <div className="divide-y divide-admin-border">
                {tasks.items.map((task) => {
                  const outOfStock = task.stockStatus === InventoryStockStatus.OutOfStock;
                  return (
                    <article key={task.id} className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(14rem,1.4fr)_8rem_10rem_9rem] md:items-center md:gap-4 md:px-5">
                      <div>
                        <p className="font-medium text-admin-text-primary">{task.inventoryItemName}</p>
                        <p className="mt-0.5 font-mono text-xs text-admin-text-muted">{task.inventoryItemCode} · {task.unitSymbol || task.unitName}</p>
                      </div>
                      <p className="text-sm text-admin-text-secondary">{task.sizeName || 'Không size'}</p>
                      <p className="text-right text-sm tabular-nums text-admin-text-primary">
                        <strong>{formatDecimalQuantity(task.currentQuantity)}</strong>
                        <span className="text-admin-text-muted"> / {formatDecimalQuantity(task.lowStockThreshold)}</span>
                      </p>
                      <span className={`inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${outOfStock ? 'bg-red-50 text-admin-status-error' : 'bg-amber-50 text-admin-status-warning'}`}>
                        <AlertTriangle size={13} aria-hidden="true" />
                        {outOfStock ? 'Hết hàng' : 'Cần nhập'}
                      </span>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {!loading && tasks.totalPages > 1 ? (
            <div className="flex flex-col gap-3 rounded-admin-control border border-admin-border bg-admin-surface px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-admin-text-secondary">Trang {tasks.page}/{tasks.totalPages} · {tasks.totalCount} việc chưa hoàn thành</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={!tasks.hasPrevious} className="inline-flex h-11 items-center gap-1 rounded-admin-control border border-admin-border px-3 font-semibold disabled:opacity-40"><ChevronLeft size={16} aria-hidden="true" /> Trước</button>
                <button type="button" onClick={() => setPage((current) => current + 1)} disabled={!tasks.hasNext} className="inline-flex h-11 items-center gap-1 rounded-admin-control border border-admin-border px-3 font-semibold disabled:opacity-40">Sau <ChevronRight size={16} aria-hidden="true" /></button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
