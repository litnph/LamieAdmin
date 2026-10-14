import { apiClient } from '@/services/apiClient';

export type PurchaseLineInput = { group: number; description: string; amount: number };
export type MaterialPurchase = {
  id: string; purchaseDate: string; receivedDate: string; invoiceDate: string | null; vendorName: string; vendorAddress: string | null;
  vendorTaxId: string | null; documentStatus: number; taxEligibilityStatus: number;
  documentReference: string | null; attachmentUrl: string | null; notes: string | null;
  totalAmount: number; paidAmount: number; outstandingAmount: number;
  lines: Array<PurchaseLineInput & { id: string }>;
  payments: Array<{ id: string; amount: number; paidAt: string; method: number; status: number; note: string | null }>;
  createdAt: string; updatedAt: string;
};
export type SavePurchaseInput = {
  purchaseDate: string; receivedDate: string; invoiceDate: string | null; vendorName: string; vendorAddress: string | null;
  vendorTaxId: string | null; documentStatus: number; taxEligibilityStatus: number;
  documentReference: string | null; attachmentUrl: string | null; notes: string | null; lines: PurchaseLineInput[];
};
export type FinancePeriod = {
  id: string; from: string; to: string; openingCashBalance: number | null; status: number; dataVersion: number;
  stocktakeConfirmed: boolean; shippingConfirmed: boolean; expensesConfirmed: boolean; canClose: boolean; closedAt: string | null;
  stocktake: Array<{ id: string; group: number; openingValue: number; purchasesValue: number; endingValue: number; wasteValue: number; adjustmentValue: number; consumptionValue: number; productCogsValue: number; isEstimated: boolean; status: number; note: string | null }>;
  history: Array<{ id: string; kind: number; dataVersion: number; reason: string | null; occurredAt: string; actorUserId: string | null }>;
};

export const financeApi = {
  purchases: async (from: string, to: string) => (await apiClient.get<MaterialPurchase[]>('/api/finance/purchases', { params: { from, to } })).data,
  createPurchase: async (input: SavePurchaseInput) => (await apiClient.post<{ id: string }>('/api/finance/purchases', input)).data,
  addPurchasePayment: async (id: string, input: { amount: number; paidAt: string; method: number; idempotencyKey: string; note: string | null }) => { await apiClient.post(`/api/finance/purchases/${id}/payments`, input); },
  getOrCreatePeriod: async (input: { from: string; to: string; openingCashBalance: number | null }) => (await apiClient.post<FinancePeriod>('/api/finance/periods', input)).data,
  getPeriod: async (id: string) => (await apiClient.get<FinancePeriod>(`/api/finance/periods/${id}`)).data,
  saveStocktake: async (id: string, lines: Array<{ group: number; openingValue: number; endingValue: number; wasteValue: number; adjustmentValue: number; isEstimated: boolean; note: string | null }>) => { await apiClient.put(`/api/finance/periods/${id}/stocktake`, { lines }); },
  periodAction: async (id: string, action: 'confirm-stocktake' | 'confirm-shipping' | 'confirm-expenses' | 'close') => { await apiClient.post(`/api/finance/periods/${id}/${action}`); },
  reopen: async (id: string, reason: string) => { await apiClient.post(`/api/finance/periods/${id}/reopen`, { reason }); },
};
