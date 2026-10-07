import type { ReportingDataset } from '../types/reporting.types';
import { mockReportingDataset } from './mockReportingData';

export interface ReportingDataAdapter {
  load(): Promise<ReportingDataset>;
}

class MockReportingAdapter implements ReportingDataAdapter {
  async load(): Promise<ReportingDataset> {
    await new Promise((resolve) => window.setTimeout(resolve, 260));
    return structuredClone(mockReportingDataset);
  }
}

// API v2 can implement this interface once payment ledger, actual completion and expense paidAt are available.
export const reportingAdapter: ReportingDataAdapter = new MockReportingAdapter();
