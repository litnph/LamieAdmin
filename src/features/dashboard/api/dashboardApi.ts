import { apiClient } from '@/services/apiClient';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import type {
  DashboardData,
  DashboardPeriodKey,
  DashboardSourceError,
  DashboardSourceKey,
} from '../types/dashboard.types';
import { createDashboardPeriodRange } from '../utils/dashboardFormatters';

const sourceLabels: Record<DashboardSourceKey, string> = {
  newOrders: 'đơn mới',
  activeOrders: 'đơn cần xử lý và lịch giao',
  revenue: 'doanh thu',
  inventory: 'tồn kho',
};

const failedDashboard = (periodKey: DashboardPeriodKey, error: unknown): DashboardData => {
  const now = new Date();
  const message = getApiErrorMessage(error);
  const sourceErrors = (Object.keys(sourceLabels) as DashboardSourceKey[]).map<DashboardSourceError>((source) => ({
    source,
    label: sourceLabels[source],
    message,
  }));

  return {
    period: createDashboardPeriodRange(periodKey, now),
    generatedAt: now.toISOString(),
    newOrdersCount: null,
    activeOrders: null,
    revenue: null,
    inventory: null,
    sourceErrors,
  };
};

export const dashboardApi = {
  load: async (period: DashboardPeriodKey): Promise<DashboardData> => {
    try {
      const { data } = await apiClient.get<DashboardData>('/api/dashboard', { params: { period } });
      return data;
    } catch (error) {
      return failedDashboard(period, error);
    }
  },
};
