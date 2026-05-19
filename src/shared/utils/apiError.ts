import axios from 'axios';

export const getApiErrorMessage = (e: unknown): string => {
  if (!axios.isAxiosError(e)) return 'Đã xảy ra lỗi không xác định.';
  const data = e.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined;
  if (data?.errors) {
    const first = Object.values(data.errors).flat()[0];
    if (first) return first;
  }
  if (data?.message) return data.message;
  return e.message || 'Yêu cầu thất bại.';
};
