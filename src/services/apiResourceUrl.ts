import { apiClient } from './apiClient';

export const resolveApiResourceUrl = (value: string | null | undefined): string => {
  const resourceUrl = value?.trim();
  if (!resourceUrl) return '';
  if (/^(?:https?:|blob:|data:)/i.test(resourceUrl)) return resourceUrl;

  const apiBase = new URL(apiClient.defaults.baseURL ?? '/', window.location.origin);
  return new URL(resourceUrl, apiBase).toString();
};
