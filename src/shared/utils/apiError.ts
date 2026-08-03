import axios from 'axios';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const getApiErrorMessage = (e: unknown): string => {
  if (!axios.isAxiosError(e)) return 'Đã xảy ra lỗi không xác định.';
  const data: unknown = e.response?.data;
  if (isRecord(data) && isRecord(data.errors)) {
    const first = Object.values(data.errors)
      .filter((value): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string'))
      .flat()[0];
    if (first) return first;
  }
  if (isRecord(data) && typeof data.message === 'string') return data.message;
  return e.message || 'Yêu cầu thất bại.';
};
