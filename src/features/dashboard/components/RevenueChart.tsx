import React from 'react';
import type { DashboardRevenueData } from '../types/dashboard.types';
import { SectionEmpty, SectionUnavailable } from './DashboardStates';
import { formatCurrency, formatInteger } from '../utils/dashboardFormatters';

type RevenueChartProps = {
  data: DashboardRevenueData | null;
  periodLabel: string;
};

export const RevenueChart: React.FC<RevenueChartProps> = ({ data, periodLabel }) => {
  const maximumRevenue = Math.max(...(data?.points.flatMap((point) => [
    point.revenue,
    point.productRevenue,
    point.shippingFee,
  ]) ?? [0]));
  const hasRevenue = (data?.currentProductRevenue ?? 0) > 0 || (data?.currentShippingFee ?? 0) > 0;
  const visibleLabelInterval = Math.max(1, Math.ceil((data?.points.length ?? 1) / 5));

  return (
    <section
      className="min-w-0 overflow-hidden rounded-admin-panel border border-admin-border bg-admin-card shadow-admin-panel"
      aria-labelledby="revenue-chart-title"
    >
      <div className="flex flex-col gap-3 border-b border-admin-border px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div className="min-w-0">
          <h2 id="revenue-chart-title" className="text-base font-semibold text-admin-text-primary">
            Xu hướng doanh thu
          </h2>
          <p className="mt-1 text-xs text-admin-text-muted">
            Đơn đã thanh toán; doanh thu {data?.includeShippingFeeInRevenue ? 'gồm' : 'không gồm'} phí giao hàng.
          </p>
        </div>
        {data ? (
          <div className="flex shrink-0 flex-wrap gap-x-5 gap-y-1 text-xs">
            <span className="text-admin-text-muted">
              Đơn đã thanh toán <strong className="ml-1 font-semibold text-admin-text-primary tabular-nums">{formatInteger(data.paidOrderCount)}</strong>
            </span>
            <span className="text-admin-text-muted">
              Đơn vị <strong className="ml-1 font-semibold text-admin-text-primary">VND</strong>
            </span>
            <span className="text-admin-text-muted">
              Sản phẩm <strong className="ml-1 font-semibold text-admin-text-primary tabular-nums">{formatCurrency(data.currentProductRevenue)}</strong>
            </span>
            <span className="text-admin-text-muted">
              Ship <strong className="ml-1 font-semibold text-admin-text-primary tabular-nums">{formatCurrency(data.currentShippingFee)}</strong>
            </span>
          </div>
        ) : null}
      </div>

      {data === null ? (
        <SectionUnavailable title="Chưa tải được doanh thu" description="Nguồn doanh thu không phản hồi, các cảnh báo vận hành vẫn được giữ nguyên." />
      ) : !hasRevenue ? (
        <SectionEmpty title="Chưa có doanh thu trong kỳ" description="Không có đơn đã thanh toán theo ngày tạo trong khoảng thời gian này." />
      ) : (
        <figure className="px-3 pb-4 pt-5 sm:px-5" aria-labelledby="revenue-chart-title">
          <div
            className="flex h-56 min-w-0 items-end gap-1.5 border-b border-admin-border px-1 sm:gap-2"
            aria-hidden="true"
          >
            {data.points.map((point, index) => {
              const height = maximumRevenue > 0 ? Math.max(2, (point.revenue / maximumRevenue) * 100) : 1;
              const productHeight = maximumRevenue > 0 ? Math.max(2, (point.productRevenue / maximumRevenue) * 100) : 1;
              const shippingHeight = maximumRevenue > 0 ? Math.max(2, (point.shippingFee / maximumRevenue) * 100) : 1;
              const showLabel = index === 0 || index === data.points.length - 1 || index % visibleLabelInterval === 0;
              return (
                <div key={point.key} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                  <div className="group relative flex min-h-0 flex-1 items-end gap-px">
                    <div
                      className="min-w-0 flex-1 rounded-t-sm bg-admin-primary transition-opacity group-hover:opacity-85"
                      style={{ height: `${height}%` }}
                      title={`${point.label}: ${formatCurrency(point.revenue)}, ${formatInteger(point.orderCount)} đơn`}
                    />
                    <div
                      className="min-w-0 flex-1 rounded-t-sm bg-admin-status-success"
                      style={{ height: `${productHeight}%` }}
                      title={`${point.label}: tiền sản phẩm ${formatCurrency(point.productRevenue)}`}
                    />
                    <div
                      className="min-w-0 flex-1 rounded-t-sm bg-admin-status-info"
                      style={{ height: `${shippingHeight}%` }}
                      title={`${point.label}: phí giao hàng ${formatCurrency(point.shippingFee)}`}
                    />
                  </div>
                  <span
                    className={[
                      'mt-2 h-4 truncate text-center text-[10px] text-admin-text-muted',
                      showLabel ? 'opacity-100' : 'opacity-0',
                    ].join(' ')}
                  >
                    {point.shortLabel}
                  </span>
                </div>
              );
            })}
          </div>
          <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-admin-text-muted">
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-admin-primary" aria-hidden="true" />Doanh thu</span>
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-admin-status-success" aria-hidden="true" />Tiền sản phẩm</span>
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-admin-status-info" aria-hidden="true" />Phí giao hàng</span>
          </figcaption>

          <table className="sr-only">
            <caption>Dữ liệu doanh thu cho {periodLabel.toLowerCase()}</caption>
            <thead>
              <tr>
                <th scope="col">Khoảng ngày</th>
                <th scope="col">Số đơn đã thanh toán</th>
                <th scope="col">Doanh thu VND</th>
                <th scope="col">Tiền sản phẩm VND</th>
                <th scope="col">Phí giao hàng VND</th>
              </tr>
            </thead>
            <tbody>
              {data.points.map((point) => (
                <tr key={point.key}>
                  <td>{point.label}</td>
                  <td>{formatInteger(point.orderCount)}</td>
                  <td>{formatCurrency(point.revenue)}</td>
                  <td>{formatCurrency(point.productRevenue)}</td>
                  <td>{formatCurrency(point.shippingFee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      )}
    </section>
  );
};
