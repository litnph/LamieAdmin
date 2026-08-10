import { apiClient } from '@/services/apiClient';
import type { FinancialReport, FinancialReportParams } from '../types/financialReport.types';

const createObjectUrl = (blob: Blob): string => window.URL.createObjectURL(blob);

const scheduleRevoke = (url: string) => {
  window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
};

export const reportsApi = {
  financial: async (params: FinancialReportParams): Promise<FinancialReport> => {
    const { data } = await apiClient.get<FinancialReport>('/api/reports/financial', { params });
    return data;
  },

  downloadExcel: async (params: FinancialReportParams): Promise<void> => {
    const { data } = await apiClient.get<Blob>('/api/reports/financial/export/excel', {
      params,
      responseType: 'blob',
    });
    const url = createObjectUrl(data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `bao-cao-tai-chinh-${params.from}-${params.to}.xls`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    scheduleRevoke(url);
  },

  openPrintable: async (params: FinancialReportParams): Promise<void> => {
    const printWindow = window.open('about:blank', '_blank');
    if (!printWindow) throw new Error('Trình duyệt đã chặn cửa sổ in. Hãy cho phép pop-up và thử lại.');
    printWindow.opener = null;
    printWindow.document.title = 'Đang tạo báo cáo';
    printWindow.document.body.textContent = 'Đang tạo bản in báo cáo...';

    try {
      const { data } = await apiClient.get<Blob>('/api/reports/financial/export/print', {
        params,
        responseType: 'blob',
      });
      const url = createObjectUrl(data);
      printWindow.location.replace(url);
      scheduleRevoke(url);
    } catch (error) {
      printWindow.close();
      throw error;
    }
  },
};
