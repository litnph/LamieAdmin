import { useCallback, useEffect, useRef, useState } from 'react';
import { dashboardApi } from '../api/dashboardApi';
import type { DashboardData, DashboardPeriodKey } from '../types/dashboard.types';

type DashboardState = {
  data: DashboardData | null;
  loading: boolean;
  refreshing: boolean;
};

export const useDashboardData = (period: DashboardPeriodKey) => {
  const [state, setState] = useState<DashboardState>({
    data: null,
    loading: true,
    refreshing: false,
  });
  const requestIdRef = useRef(0);

  const load = useCallback(
    async (keepCurrentData: boolean) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setState((current) => ({
        data: keepCurrentData ? current.data : null,
        loading: !keepCurrentData,
        refreshing: keepCurrentData,
      }));

      const data = await dashboardApi.load(period);
      if (requestId !== requestIdRef.current) return;

      setState({ data, loading: false, refreshing: false });
    },
    [period],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const retry = useCallback(() => {
    void load(state.data !== null);
  }, [load, state.data]);

  return {
    ...state,
    retry,
  };
};

