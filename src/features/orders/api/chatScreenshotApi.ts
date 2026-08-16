import { apiClient } from '@/services/apiClient';
import type { ChatScreenshotAnalysis } from '../types/chatScreenshot.types';

export const chatScreenshotApi = {
  analyze: async (files: File[], signal?: AbortSignal): Promise<ChatScreenshotAnalysis> => {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    const { data } = await apiClient.post<ChatScreenshotAnalysis>('/api/admin/quick-import/analyze-screenshots', form, {
      signal,
      timeout: 45_000,
    });
    return data;
  },
};
