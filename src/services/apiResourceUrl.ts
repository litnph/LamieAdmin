import { apiClient } from './apiClient';

export const resolveApiResourceUrl = (value: string | null | undefined): string => {
  const resourceUrl = value?.trim();
  if (!resourceUrl) return '';
  if (['null', 'undefined', '[object Object]'].includes(resourceUrl)) return '';
  if (/^blob:/i.test(resourceUrl) || /^data:image\//i.test(resourceUrl)) return resourceUrl;

  try {
    if (/^https?:/i.test(resourceUrl)) return new URL(resourceUrl).toString();

    const apiBase = new URL(apiClient.defaults.baseURL ?? '/', window.location.origin);
    const resolvedUrl = new URL(resourceUrl, apiBase);
    return /^https?:$/i.test(resolvedUrl.protocol) ? resolvedUrl.toString() : '';
  } catch {
    return '';
  }
};
