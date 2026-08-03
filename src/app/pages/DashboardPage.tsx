import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { AttentionOrdersList } from '@/features/dashboard/components/AttentionOrdersList';
import { DashboardError, DashboardSkeleton, PartialDataWarning } from '@/features/dashboard/components/DashboardStates';
import { DashboardTimeFilter } from '@/features/dashboard/components/DashboardTimeFilter';
import { DeliveryRiskList } from '@/features/dashboard/components/DeliveryRiskList';
import { KpiCard } from '@/features/dashboard/components/KpiCard';
import { LowStockList } from '@/features/dashboard/components/LowStockList';
import { PriorityActions } from '@/features/dashboard/components/PriorityActions';
import { RevenueChart } from '@/features/dashboard/components/RevenueChart';
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData';
import type { DashboardPeriodKey } from '@/features/dashboard/types/dashboard.types';
import {
  formatDateTime,
  formatInteger,
  formatRevenueChange,
} from '@/features/dashboard/utils/dashboardFormatters';

export const DashboardPage: React.FC = () => {
  const [period, setPeriod] = useState<DashboardPeriodKey>('30d');
  const { data, loading, refreshing, retry } = useDashboardData(period);
  const activeOrders = data?.activeOrders ?? null;
  const inventory = data?.inventory ?? null;
  const revenue = data?.revenue ?? null;
  const dashboardUnavailable =
    data !== null &&
    data.newOrdersCount === null &&
    data.activeOrders === null &&
    data.revenue === null &&
    data.inventory === null;

  const revenueChange = revenue
    ? formatRevenueChange(revenue.currentRevenue, revenue.previousRevenue)
    : null;
  const deliveryRiskCount = activeOrders
    ? activeOrders.lateDeliveryCount + activeOrders.upcomingDeliveryCount
    : null;
  const inventoryRiskCount = inventory
    ? inventory.lowStockCount + inventory.outOfStockCount
    : null;

  return (
    <div
      className="w-full min-w-0 max-w-[calc(100vw-2rem)] space-y-6 sm:max-w-[calc(100vw-2.5rem)] lg:max-w-full"
      aria-busy={loading || refreshing}
    >
      <PageHeader
        title="Tổng quan vận hành"
        description="Theo dõi đơn cần xử lý, lịch giao, tồn kho và doanh thu tại một nơi."
        actions={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center md:w-auto">
            <DashboardTimeFilter
              value={period}
              onChange={setPeriod}
              disabled={loading || refreshing}
            />
            <button
              type="button"
              onClick={retry}
              disabled={loading || refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-admin-control border border-admin-border bg-admin-card px-3 text-sm font-semibold text-admin-text-secondary transition-colors hover:bg-admin-muted hover:text-admin-text-primary disabled:cursor-not-allowed disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text"
            >
              <RefreshCw
                size={16}
                strokeWidth={1.8}
                className={refreshing ? 'animate-spin' : undefined}
                aria-hidden="true"
              />
              {refreshing ? 'Đang cập nhật' : 'Làm mới'}
            </button>
          </div>
        }
      />

      {loading ? <DashboardSkeleton /> : null}

      {!loading && dashboardUnavailable ? <DashboardError onRetry={retry} retrying={refreshing} /> : null}

      {!loading && data && !dashboardUnavailable ? (
        <>
          {data.sourceErrors.length > 0 ? (
            <PartialDataWarning errors={data.sourceErrors} onRetry={retry} retrying={refreshing} />
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-admin-text-muted" aria-live="polite">
            <p>Dữ liệu cập nhật lúc {formatDateTime(data.generatedAt)}</p>
            {refreshing ? <p className="font-medium text-admin-primary">Đang tải dữ liệu mới</p> : null}
          </div>

          <section aria-labelledby="dashboard-kpi-title">
            <h2 id="dashboard-kpi-title" className="sr-only">
              Chỉ số chính
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Đơn cần xử lý"
                value={activeOrders ? formatInteger(activeOrders.needActionCount) : 'Chưa có'}
                unit="đơn"
                period="Tại thời điểm cập nhật"
                context={
                  activeOrders
                    ? `${formatInteger(activeOrders.awaitingConfirmationCount)} chờ xác nhận, ${formatInteger(activeOrders.preparingCount)} đang chuẩn bị`
                    : 'Nguồn đơn đang hoạt động chưa tải được'
                }
                unavailable={!activeOrders}
              />
              <KpiCard
                label="Sắp giao hoặc giao trễ"
                value={deliveryRiskCount === null ? 'Chưa có' : formatInteger(deliveryRiskCount)}
                unit="đơn"
                period="Quá hạn và 24 giờ tới"
                context={
                  activeOrders
                    ? `${formatInteger(activeOrders.lateDeliveryCount)} giao trễ, ${formatInteger(activeOrders.upcomingDeliveryCount)} sắp giao`
                    : 'Nguồn lịch giao chưa tải được'
                }
                unavailable={!activeOrders}
              />
              <KpiCard
                label="Tồn kho cần chú ý"
                value={inventoryRiskCount === null ? 'Chưa có' : formatInteger(inventoryRiskCount)}
                unit="sản phẩm"
                period="Tồn kho hiện tại"
                context={
                  inventory
                    ? `${formatInteger(inventory.lowStockCount)} sắp hết, ${formatInteger(inventory.outOfStockCount)} đã hết hàng`
                    : 'Nguồn tồn kho chưa tải được'
                }
                unavailable={!inventory}
              />
              <KpiCard
                label="Doanh thu"
                value={revenue ? formatInteger(revenue.currentRevenue) : 'Chưa có'}
                unit="VND"
                period={data.period.label}
                context={revenueChange?.label ?? 'Nguồn doanh thu chưa tải được'}
                unavailable={!revenue}
              />
            </div>
          </section>

          <PriorityActions
            newOrdersCount={data.newOrdersCount}
            periodLabel={data.period.label}
            activeOrders={activeOrders}
            inventory={inventory}
          />

          <div className="grid min-w-0 gap-5 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-7">
              <AttentionOrdersList orders={activeOrders?.attentionOrders ?? null} />
            </div>
            <div className="min-w-0 lg:col-span-5">
              <DeliveryRiskList orders={activeOrders?.deliveryRisks ?? null} />
            </div>
          </div>

          <div className="grid min-w-0 gap-5 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-7 xl:col-span-8">
              <RevenueChart data={revenue} periodLabel={data.period.label} />
            </div>
            <div className="min-w-0 lg:col-span-5 xl:col-span-4">
              <LowStockList products={inventory?.products ?? null} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
